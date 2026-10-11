import { readTextFile, writeTextFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs'
import { invoke } from '@tauri-apps/api/core'
import { DEFAULT_THEME } from '../utils/defaultTheme.js'

const THEMES_FILENAME = 'themes.json'

export const CYBERPUNK_THEME = {
  id: 'theme-cyberpunk-neon',
  name: 'Cyberpunk Néon',
  html: `<div class="cyber-achievement-card">
  <div class="cyber-glow-bar"></div>
  <div class="cyber-body">
    <div class="cyber-icon-box">
      <img src="{icon}" alt="{title}" class="cyber-icon" />
      <div class="cyber-corner tr"></div>
      <div class="cyber-corner bl"></div>
    </div>
    <div class="cyber-details">
      <div class="cyber-top-line">
        <span class="cyber-game">{game}</span>
        <span class="cyber-tag">ACHIEVEMENT UNLOCKED</span>
      </div>
      <h3 class="cyber-title">{title}</h3>
      <p class="cyber-desc">{description}</p>
    </div>
  </div>
  <div class="cyber-progress"></div>
</div>`,
  css: `/* Conteneur Cyberpunk */
.cyber-achievement-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 440px;
  max-width: calc(100vw - 60px);
  background: rgba(10, 11, 26, 0.95);
  border-radius: 12px;
  border: 1px solid #00f3ff;
  box-shadow: 
    0 18px 45px rgba(0, 0, 0, 0.9),
    0 0 24px rgba(0, 243, 255, 0.35),
    inset 0 0 16px rgba(255, 0, 85, 0.15);
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  color: #fff;
  user-select: none;
  z-index: 999999;
}
.cyber-glow-bar {
  height: 3px;
  background: linear-gradient(90deg, #ff0055, #00f3ff, #ff0055);
}
.cyber-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.cyber-icon-box {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  background: #03040a;
  border: 1px solid #ff0055;
  box-shadow: 0 0 12px rgba(255, 0, 85, 0.4);
}
.cyber-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cyber-corner {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #00f3ff;
}
.cyber-corner.tr { top: -2px; right: -2px; }
.cyber-corner.bl { bottom: -2px; left: -2px; }
.cyber-details { flex: 1; min-width: 0; }
.cyber-top-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.cyber-game {
  font-size: 11px;
  color: #00f3ff;
  font-weight: 700;
  text-transform: uppercase;
}
.cyber-tag {
  font-size: 10px;
  color: #ff0055;
  font-weight: 800;
}
.cyber-title {
  margin: 0 0 3px 0;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}
.cyber-desc {
  margin: 0;
  font-size: 12px;
  color: #a4b4cc;
}
.cyber-progress {
  height: 3px;
  background: linear-gradient(90deg, #00f3ff, #ff0055);
  animation: cyber-prog 5s linear forwards;
}
@keyframes cyber-prog {
  from { width: 100%; }
  to { width: 0%; }
}`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}

export const MINIMAL_THEME = {
  id: 'theme-minimal-dark',
  name: 'Minimaliste Sombre',
  html: `<div class="mini-card">
  <img src="{icon}" alt="{title}" class="mini-icon" />
  <div class="mini-content">
    <span class="mini-game">{game}</span>
    <h4 class="mini-title">{title}</h4>
    <p class="mini-desc">{description}</p>
  </div>
</div>`,
  css: `.mini-card {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px;
  background: rgba(18, 18, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #fff;
  font-family: 'Outfit', sans-serif;
  z-index: 999999;
}
.mini-icon {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}
.mini-content { flex: 1; min-width: 0; }
.mini-game { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600; display: block; }
.mini-title { margin: 0 0 2px 0; font-size: 14px; font-weight: 600; }
.mini-desc { margin: 0; font-size: 11.5px; color: #bbb; }`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}

export const BUILTIN_THEMES = [
  DEFAULT_THEME,
  CYBERPUNK_THEME,
  MINIMAL_THEME
]

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
      await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true })
    } catch {
      // Ignore si le dossier existe déjà
    }
  }

  async loadLibrary() {
    if (this.cachedLibrary) {
      return this.cachedLibrary
    }

    if (this.isTauriAvailable()) {
      try {
        await this.ensureDirectory()
        const fileExists = await exists(THEMES_FILENAME, { baseDir: BaseDirectory.AppData })
        if (fileExists) {
          const content = await readTextFile(THEMES_FILENAME, { baseDir: BaseDirectory.AppData })
          const parsed = JSON.parse(content)
          if (parsed && Array.isArray(parsed.themes) && parsed.themes.length > 0) {
            this.cachedLibrary = parsed
            return this.cachedLibrary
          }
        }
      } catch (err) {
        console.warn('[ThemeStorage] Lecture AppData échouée, initialisation avec thèmes par défaut:', err)
      }
    }

    // Fallback ou premier lancement : créer la bibliothèque par défaut
    this.cachedLibrary = {
      activeThemeId: DEFAULT_THEME.id,
      themes: BUILTIN_THEMES.map((t) => ({
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    }

    await this.persistLibrary()
    return this.cachedLibrary
  }

  async persistLibrary() {
    if (!this.cachedLibrary) return

    if (this.isTauriAvailable()) {
      try {
        await this.ensureDirectory()
        const json = JSON.stringify(this.cachedLibrary, null, 2)
        await writeTextFile(THEMES_FILENAME, json, { baseDir: BaseDirectory.AppData })
      } catch (err) {
        console.error('[ThemeStorage] Erreur sauvegarde dans AppData:', err)
      }
    }

    // Synchroniser avec le backend Tauri et OBS Server
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
