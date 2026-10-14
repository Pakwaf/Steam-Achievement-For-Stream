import { readTextFile, writeTextFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs'
import { invoke } from '@tauri-apps/api/core'
import { IPC_COMMANDS, STORAGE_KEYS } from '../constants/index.js'
import {
  BUILTIN_THEMES,
  DEFAULT_THEME,
  STEAM_GOLD_THEME,
  COZY_PIXEL_THEME,
  HORROR_THEME,
  DARK_FANTASY_THEME,
  FRUTIGER_AERO_THEME
} from '../themes/index.js'

// Re-export des thèmes pour rétro-compatibilité
export {
  BUILTIN_THEMES,
  DEFAULT_THEME,
  STEAM_GOLD_THEME,
  COZY_PIXEL_THEME,
  HORROR_THEME,
  DARK_FANTASY_THEME,
  FRUTIGER_AERO_THEME
}

export const DEPRECATED_THEME_IDS = ['theme-minimal', 'theme-cyberpunk', 'theme-wii', 'theme-pokemon']
const THEMES_FILENAME = 'themes.json'

/**
 * Assainit les tiers importés en neutralisant tout chemin audio local (Arbitrary File Read)
 * et en purifiant le template HTML contre les attaques XSS.
 */
function sanitizeImportedTiers(rawTiers) {
  if (!rawTiers || typeof rawTiers !== 'object') return {}
  const cleaned = JSON.parse(JSON.stringify(rawTiers))
  for (const tierKey of Object.keys(cleaned)) {
    if (cleaned[tierKey] && typeof cleaned[tierKey] === 'object') {
      cleaned[tierKey].audioPath = null
      cleaned[tierKey].html = cleaned[tierKey].html || ''
    }
  }
  return cleaned
}

/**
 * Assainit les tiers exportés pour éviter de divulguer les chemins système locaux de l'utilisateur.
 */
function sanitizeExportedTiers(rawTiers) {
  if (!rawTiers || typeof rawTiers !== 'object') return {}
  const cleaned = JSON.parse(JSON.stringify(rawTiers))
  for (const tierKey of Object.keys(cleaned)) {
    if (cleaned[tierKey] && typeof cleaned[tierKey] === 'object') {
      cleaned[tierKey].audioPath = null
    }
  }
  return cleaned
}

class ThemeStorageService {
  constructor() {
    this.cachedLibrary = null
    this.libraryListeners = new Set()
    this.customizationListeners = new Set()
  }

  isTauriAvailable() {
    return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__)
  }

  async ensureDirectory() {
    if (!this.isTauriAvailable()) return
    try {
      const dirExists = await exists('', { baseDir: BaseDirectory.AppData })
      if (!dirExists) {
        await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true })
      }
    } catch {
      // Ignoré si le répertoire existe déjà ou n'est pas accessible
    }
  }

  async loadLibrary() {
    if (this.cachedLibrary) {
      return this.cachedLibrary
    }

    let loaded = null

    // 1. Essai backend Rust natif (AppData direct)
    if (this.isTauriAvailable()) {
      try {
        const raw = await invoke(IPC_COMMANDS.GET_THEME_LIBRARY)
        if (raw && Array.isArray(raw.themes) && raw.themes.length > 0) {
          loaded = raw
        }
      } catch (err) {
        console.warn('[ThemeStorage] get_theme_library erreur:', err)
      }
    }

    // 2. Essai Tauri plugin-fs
    if (!loaded && this.isTauriAvailable()) {
      try {
        await this.ensureDirectory()
        const fileExists = await exists(THEMES_FILENAME, { baseDir: BaseDirectory.AppData })
        if (fileExists) {
          const content = await readTextFile(THEMES_FILENAME, { baseDir: BaseDirectory.AppData })
          const parsed = JSON.parse(content)
          if (parsed && Array.isArray(parsed.themes) && parsed.themes.length > 0) {
            loaded = parsed
          }
        }
      } catch (err) {
        console.warn('[ThemeStorage] plugin-fs erreur:', err)
      }
    }

    // 3. Fallback localStorage
    if (!loaded && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.THEMES)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && Array.isArray(parsed.themes) && parsed.themes.length > 0) {
            loaded = parsed
          }
        }
      } catch {
        // ignore
      }
    }

    if (loaded) {
      // 1. Purge automatique des thèmes retirés de base (Minimaliste, Cyberpunk, Wii, Pokémon)
      loaded.themes = (loaded.themes || []).filter((t) => !DEPRECATED_THEME_IDS.includes(t.id))

      const deletedIds = Array.isArray(loaded.deletedThemeIds) ? loaded.deletedThemeIds : []
      for (const depId of DEPRECATED_THEME_IDS) {
        if (!deletedIds.includes(depId)) {
          deletedIds.push(depId)
        }
      }

      // 2. Réinsérer les thèmes de base actifs s'ils ne sont pas déjà présents et non supprimés
      for (const builtin of BUILTIN_THEMES) {
        if (deletedIds.includes(builtin.id)) {
          continue
        }
        const existingTheme = loaded.themes.find((t) => t.id === builtin.id)
        if (!existingTheme) {
          loaded.themes.push({
            ...builtin,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        } else if (builtin.tiers && (!existingTheme.tiers || Object.keys(existingTheme.tiers).length === 0)) {
          existingTheme.tiers = JSON.parse(JSON.stringify(builtin.tiers))
        }
      }

      loaded.deletedThemeIds = deletedIds

      // 3. Si le thème actif était l'un des thèmes supprimés ou n'existe plus, basculer vers le thème par défaut
      const activeStillExists = loaded.themes.some((t) => t.id === loaded.activeThemeId)
      if (!activeStillExists || DEPRECATED_THEME_IDS.includes(loaded.activeThemeId)) {
        loaded.activeThemeId = DEFAULT_THEME.id
      }

      this.cachedLibrary = loaded
    } else {
      // Premier lancement : créer la bibliothèque avec les 5 thèmes officiels
      this.cachedLibrary = {
        activeThemeId: DEFAULT_THEME.id,
        deletedThemeIds: [...DEPRECATED_THEME_IDS],
        themes: BUILTIN_THEMES.map((t) => ({
          ...t,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      }
    }

    await this.persistLibrary()
    return this.cachedLibrary
  }

  async persistLibrary() {
    if (!this.cachedLibrary) return

    const json = JSON.stringify(this.cachedLibrary, null, 2)

    // 1. Sauvegarde instantanée dans localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.THEMES, json)
      } catch (e) {
        console.warn('[ThemeStorage] Erreur sauvegarde localStorage:', e)
      }
    }

    // 2. Sauvegarde via le backend natif Rust (AppData)
    if (this.isTauriAvailable()) {
      try {
        await invoke(IPC_COMMANDS.SAVE_THEME_LIBRARY, { library: this.cachedLibrary })
      } catch (err) {
        console.warn('[ThemeStorage] save_theme_library erreur:', err)
      }

      // 3. Sauvegarde plugin FS de secours
      try {
        await this.ensureDirectory()
        await writeTextFile(THEMES_FILENAME, json, { baseDir: BaseDirectory.AppData })
      } catch {
        // ignore
      }
    }

    // Synchroniser avec OBS Server
    const active = this.getActiveThemeSync()
    if (active && this.isTauriAvailable()) {
      try {
        await invoke(IPC_COMMANDS.UPDATE_CUSTOMIZATION, { theme: active })
      } catch (err) {
        console.warn('[ThemeStorage] Erreur synchronisation customization:', err)
      }
    }

    this.notifyLibraryUpdated()
    if (active) {
      this.notifyCustomizationUpdated(active)
    }
  }

  async getLibrary() {
    return await this.loadLibrary()
  }

  getActiveThemeSync() {
    if (!this.cachedLibrary) return DEFAULT_THEME
    const target = this.cachedLibrary.themes.find((t) => t.id === this.cachedLibrary.activeThemeId)
    return target || this.cachedLibrary.themes[0] || DEFAULT_THEME
  }

  async getActiveTheme() {
    await this.loadLibrary()
    return this.getActiveThemeSync()
  }

  async setActiveTheme(id) {
    const lib = await this.loadLibrary()
    const found = lib.themes.find((t) => t.id === id)
    if (!found) {
      return { success: false, error: 'Thème introuvable' }
    }

    lib.activeThemeId = id
    await this.persistLibrary()

    return {
      success: true,
      activeTheme: { ...found },
      library: { ...lib }
    }
  }

  async saveTheme(themeData) {
    if (!themeData) return { success: false, error: 'Données invalides' }

    const lib = await this.loadLibrary()
    const index = lib.themes.findIndex((t) => t.id === themeData.id)
    const now = new Date().toISOString()

    let updated = null
    if (index !== -1) {
      lib.themes[index] = {
        ...lib.themes[index],
        ...themeData,
        tiers: themeData.tiers ? JSON.parse(JSON.stringify(themeData.tiers)) : (lib.themes[index].tiers || {}),
        updatedAt: now
      }
      updated = lib.themes[index]
    } else {
      const newId = themeData.id || `theme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      updated = {
        id: newId,
        name: themeData.name || `Thème ${lib.themes.length + 1}`,
        html: themeData.html || DEFAULT_THEME.html,
        css: themeData.css || DEFAULT_THEME.css,
        visualEffect: themeData.visualEffect || 'none',
        audioPath: themeData.audioPath || null,
        audioDeviceId: themeData.audioDeviceId || 'default',
        soundEnabled: themeData.soundEnabled ?? true,
        soundVolume: typeof themeData.soundVolume === 'number' ? themeData.soundVolume : 0.8,
        tiers: themeData.tiers ? JSON.parse(JSON.stringify(themeData.tiers)) : {},
        createdAt: now,
        updatedAt: now
      }
      lib.themes.push(updated)
    }

    if (Array.isArray(lib.deletedThemeIds) && updated?.id) {
      lib.deletedThemeIds = lib.deletedThemeIds.filter((d) => d !== updated.id)
    }

    await this.persistLibrary()

    return {
      success: true,
      theme: { ...updated },
      library: { ...lib }
    }
  }

  async createTheme(initial = {}) {
    const lib = await this.loadLibrary()
    const newId = `theme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const newTheme = {
      id: newId,
      name: initial.name || `Nouveau Thème ${lib.themes.length + 1}`,
      html: initial.html || DEFAULT_THEME.html,
      css: initial.css || DEFAULT_THEME.css,
      visualEffect: initial.visualEffect || 'none',
      audioPath: initial.audioPath || null,
      audioDeviceId: initial.audioDeviceId || 'default',
      soundEnabled: initial.soundEnabled ?? true,
      soundVolume: typeof initial.soundVolume === 'number' ? initial.soundVolume : 0.8,
      tiers: initial.tiers ? JSON.parse(JSON.stringify(initial.tiers)) : {},
      createdAt: now,
      updatedAt: now
    }

    lib.themes.unshift(newTheme)
    await this.persistLibrary()

    return {
      success: true,
      theme: { ...newTheme },
      library: { ...lib }
    }
  }

  async duplicateTheme(id) {
    const lib = await this.loadLibrary()
    const source = lib.themes.find((t) => t.id === id)
    if (!source) {
      return { success: false, error: 'Thème source introuvable' }
    }

    const newId = `theme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const duplicated = {
      ...source,
      id: newId,
      name: `${source.name} (Copie)`,
      createdAt: now,
      updatedAt: now
    }

    const idx = lib.themes.findIndex((t) => t.id === id)
    lib.themes.splice(idx + 1, 0, duplicated)
    await this.persistLibrary()

    return {
      success: true,
      duplicatedTheme: { ...duplicated },
      library: { ...lib }
    }
  }

  async deleteTheme(id) {
    const lib = await this.loadLibrary()
    if (lib.themes.length <= 1) {
      return { success: false, error: 'Impossible de supprimer le dernier thème restant' }
    }

    const idx = lib.themes.findIndex((t) => t.id === id)
    if (idx === -1) {
      return { success: false, error: 'Thème introuvable' }
    }

    const removed = lib.themes.splice(idx, 1)[0]

    if (!Array.isArray(lib.deletedThemeIds)) {
      lib.deletedThemeIds = []
    }
    if (!lib.deletedThemeIds.includes(id)) {
      lib.deletedThemeIds.push(id)
    }

    if (lib.activeThemeId === id) {
      lib.activeThemeId = lib.themes[0].id
    }

    await this.persistLibrary()

    return {
      success: true,
      deletedTheme: removed,
      activeTheme: this.getActiveThemeSync(),
      library: { ...lib }
    }
  }

  async restoreDefaultThemes() {
    const lib = await this.loadLibrary()
    lib.deletedThemeIds = []
    const now = new Date().toISOString()
    for (const builtin of BUILTIN_THEMES) {
      const exists = lib.themes.some((t) => t.id === builtin.id)
      if (!exists) {
        lib.themes.push({
          ...builtin,
          createdAt: now,
          updatedAt: now
        })
      }
    }
    await this.persistLibrary()
    return {
      success: true,
      activeTheme: this.getActiveThemeSync(),
      library: { ...lib }
    }
  }

  /**
   * Exporte un thème individuel sous forme de fichier JSON téléchargeable
   */
  async exportTheme(id) {
    const lib = await this.loadLibrary()
    const theme = lib.themes.find((t) => t.id === id)
    if (!theme) {
      return { success: false, error: 'Thème introuvable pour l\'export' }
    }

    const payload = {
      _app: 'SteamOverlayStream',
      version: '2.0',
      type: 'single_theme',
      exportedAt: new Date().toISOString(),
      theme: {
        name: theme.name,
        html: theme.html,
        css: theme.css,
        visualEffect: theme.visualEffect || 'none',
        audioPath: null,
        soundEnabled: theme.soundEnabled ?? true,
        soundVolume: theme.soundVolume ?? 0.8,
        tiers: sanitizeExportedTiers(theme.tiers)
      }
    }

    const jsonString = JSON.stringify(payload, null, 2)
    const safeName = (theme.name || 'theme').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    const fileName = `${safeName}.theme.json`

    this.downloadJsonFile(fileName, jsonString)
    return { success: true, fileName, theme: payload.theme }
  }

  /**
   * Exporte toute la bibliothèque de thèmes personnalisés
   */
  async exportLibrary() {
    const lib = await this.loadLibrary()
    const payload = {
      _app: 'SteamOverlayStream',
      version: '2.0',
      type: 'theme_library',
      exportedAt: new Date().toISOString(),
      activeThemeId: lib.activeThemeId,
      themes: lib.themes.map((t) => ({
        name: t.name,
        html: t.html,
        css: t.css,
        visualEffect: t.visualEffect || 'none',
        audioPath: null,
        soundEnabled: t.soundEnabled ?? true,
        soundVolume: t.soundVolume ?? 0.8,
        tiers: sanitizeExportedTiers(t.tiers)
      }))
    }

    const jsonString = JSON.stringify(payload, null, 2)
    const fileName = `steam_themes_library_${Date.now()}.json`

    this.downloadJsonFile(fileName, jsonString)
    return { success: true, fileName, count: payload.themes.length }
  }

  /**
   * Importe un thème (depuis un contenu JSON brut ou un objet parsé)
   */
  async importTheme(jsonOrString) {
    try {
      let data = jsonOrString
      if (typeof jsonOrString === 'string') {
        data = JSON.parse(jsonOrString)
      }

      // Si le payload vient d'un export unitaire
      const raw = data.theme || data
      if (!raw || !raw.html || !raw.css) {
        return { success: false, error: 'Format de fichier thème invalide (HTML ou CSS manquant)' }
      }

      const lib = await this.loadLibrary()
      const now = new Date().toISOString()
      const newId = `imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      const baseName = (raw.name || 'Thème Importé').trim()
      
      const newTheme = {
        id: newId,
        name: baseName,
        html: raw.html,
        css: raw.css,
        visualEffect: raw.visualEffect || 'none',
        audioPath: null,
        audioDeviceId: 'default',
        soundEnabled: raw.soundEnabled ?? true,
        soundVolume: typeof raw.soundVolume === 'number' ? raw.soundVolume : 0.8,
        tiers: sanitizeImportedTiers(raw.tiers),
        createdAt: now,
        updatedAt: now
      }

      lib.themes.unshift(newTheme)
      lib.activeThemeId = newId
      await this.persistLibrary()

      return {
        success: true,
        importedTheme: { ...newTheme },
        library: { ...lib }
      }
    } catch (err) {
      console.error('[ThemeStorage] Erreur importTheme:', err)
      return { success: false, error: `Erreur lors de l'import : ${err.message}` }
    }
  }

  /**
   * Importe une collection ou sauvegarde entière de thèmes
   */
  async importLibrary(jsonOrString) {
    try {
      let data = jsonOrString
      if (typeof jsonOrString === 'string') {
        data = JSON.parse(jsonOrString)
      }

      const list = Array.isArray(data) ? data : (data.themes || [data.theme || data])
      if (!Array.isArray(list) || list.length === 0) {
        return { success: false, error: 'Aucun thème valide trouvé dans le fichier' }
      }

      const lib = await this.loadLibrary()
      const now = new Date().toISOString()
      let count = 0

      for (const item of list) {
        if (!item || !item.html || !item.css) continue
        const newId = `imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        lib.themes.push({
          id: newId,
          name: (item.name || `Importé ${count + 1}`).trim(),
          html: item.html,
          css: item.css,
          visualEffect: item.visualEffect || 'none',
          audioPath: null,
          audioDeviceId: 'default',
          soundEnabled: item.soundEnabled ?? true,
          soundVolume: typeof item.soundVolume === 'number' ? item.soundVolume : 0.8,
          tiers: sanitizeImportedTiers(item.tiers),
          createdAt: now,
          updatedAt: now
        })
        count++
      }

      if (count === 0) {
        return { success: false, error: 'Aucun thème conforme n\'a pu être importé' }
      }

      await this.persistLibrary()
      return { success: true, count, library: { ...lib } }
    } catch (err) {
      return { success: false, error: `Erreur import collection : ${err.message}` }
    }
  }

  downloadJsonFile(filename, jsonString) {
    if (typeof window === 'undefined' || !document?.createElement) return
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 150)
  }

  notifyLibraryUpdated() {
    if (!this.cachedLibrary) return
    const clone = { ...this.cachedLibrary }
    for (const cb of this.libraryListeners) {
      try {
        cb(clone)
      } catch (e) {
        console.error(e)
      }
    }
  }

  notifyCustomizationUpdated(theme) {
    const clone = { ...theme }
    for (const cb of this.customizationListeners) {
      try {
        cb(clone)
      } catch (e) {
        console.error(e)
      }
    }
  }

  onLibraryUpdated(callback) {
    this.libraryListeners.add(callback)
    return () => this.libraryListeners.delete(callback)
  }

  onCustomizationUpdated(callback) {
    this.customizationListeners.add(callback)
    return () => this.customizationListeners.delete(callback)
  }
}

export const themeStorage = new ThemeStorageService()
