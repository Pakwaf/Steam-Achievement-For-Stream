import { readTextFile, writeTextFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs'
import { invoke } from '@tauri-apps/api/core'
import {
  BUILTIN_THEMES,
  DEFAULT_THEME,
  STEAM_GOLD_THEME,
  POKEMON_THEME,
  COZY_PIXEL_THEME,
  HORROR_THEME,
  DARK_FANTASY_THEME,
  WII_THEME,
  FRUTIGER_AERO_THEME,
  CYBERPUNK_THEME,
  MINIMAL_THEME
} from '../themes/index.js'

// Re-export des thèmes pour rétro-compatibilité
export {
  BUILTIN_THEMES,
  DEFAULT_THEME,
  STEAM_GOLD_THEME,
  POKEMON_THEME,
  COZY_PIXEL_THEME,
  HORROR_THEME,
  DARK_FANTASY_THEME,
  WII_THEME,
  FRUTIGER_AERO_THEME,
  CYBERPUNK_THEME,
  MINIMAL_THEME
}

const THEMES_FILENAME = 'themes.json'

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
        const raw = await invoke('get_theme_library')
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
        const stored = localStorage.getItem('steam_overlay_themes_v2')
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
      // Vérification et ajout des thèmes par défaut manquants (ex: Frutiger Aero)
      for (const builtin of BUILTIN_THEMES) {
        const existsInLoaded = loaded.themes.some((t) => t.id === builtin.id)
        if (!existsInLoaded) {
          loaded.themes.push({
            ...builtin,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }
      this.cachedLibrary = loaded
    } else {
      // Premier lancement : créer la bibliothèque avec tous les thèmes modulaires par défaut
      this.cachedLibrary = {
        activeThemeId: DEFAULT_THEME.id,
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
        localStorage.setItem('steam_overlay_themes_v2', json)
      } catch (e) {
        console.warn('[ThemeStorage] Erreur sauvegarde localStorage:', e)
      }
    }

    // 2. Sauvegarde via le backend natif Rust (AppData)
    if (this.isTauriAvailable()) {
      try {
        await invoke('save_theme_library', { library: this.cachedLibrary })
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
        await invoke('update_customization', { theme: active })
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
        audioPath: themeData.audioPath || null,
        audioDeviceId: themeData.audioDeviceId || 'default',
        soundEnabled: themeData.soundEnabled ?? true,
        soundVolume: typeof themeData.soundVolume === 'number' ? themeData.soundVolume : 0.8,
        createdAt: now,
        updatedAt: now
      }
      lib.themes.push(updated)
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
      audioPath: initial.audioPath || null,
      audioDeviceId: initial.audioDeviceId || 'default',
      soundEnabled: initial.soundEnabled ?? true,
      soundVolume: typeof initial.soundVolume === 'number' ? initial.soundVolume : 0.8,
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

    lib.themes.splice(idx, 1)

    if (lib.activeThemeId === id) {
      lib.activeThemeId = lib.themes[0].id
    }

    await this.persistLibrary()

    return {
      success: true,
      activeTheme: this.getActiveThemeSync(),
      library: { ...lib }
    }
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
