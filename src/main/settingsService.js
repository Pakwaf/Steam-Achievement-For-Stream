import fs from 'node:fs'
import path from 'node:path'
import electronPkg from 'electron'

const app = electronPkg?.app || electronPkg?.default?.app || null

export class SettingsService {
  constructor() {
    this.configPath = null
    this.settings = {
      steamApiKey: ''
    }
  }

  init() {
    try {
      if (app && typeof app.getPath === 'function') {
        const userDataDir = app.getPath('userData')
        this.configPath = path.join(userDataDir, 'app_settings.json')
        this.load()
      }
    } catch (err) {
      console.warn('[SettingsService] Erreur init userData:', err.message)
    }

    // Si une clé est déjà présente dans les variables d'environnement, la charger
    if (!this.settings.steamApiKey && process.env.STEAM_API_KEY) {
      this.settings.steamApiKey = process.env.STEAM_API_KEY.trim()
    } else if (this.settings.steamApiKey) {
      process.env.STEAM_API_KEY = this.settings.steamApiKey
    }
  }

  load() {
    if (!this.configPath || !fs.existsSync(this.configPath)) return

    try {
      const raw = fs.readFileSync(this.configPath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        this.settings = {
          ...this.settings,
          ...parsed
        }
        if (this.settings.steamApiKey) {
          process.env.STEAM_API_KEY = this.settings.steamApiKey.trim()
        }
      }
    } catch (err) {
      console.error('[SettingsService] Erreur lecture fichier paramètres:', err)
    }
  }

  persist() {
    if (!this.configPath) return
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2), 'utf-8')
    } catch (err) {
      console.error('[SettingsService] Erreur sauvegarde paramètres:', err)
    }
  }

  getSteamApiKey() {
    let key = (this.settings.steamApiKey || process.env.STEAM_API_KEY || '').trim()
    if (key === '[object Object]' || key === 'undefined' || key === 'null') {
      key = ''
      this.settings.steamApiKey = ''
      this.persist()
    }
    return {
      apiKey: key,
      hasKey: Boolean(key && key.length >= 8)
    }
  }

  saveSteamApiKey(key) {
    let trimmed = (typeof key === 'string' ? key : '').trim()
    if (trimmed === '[object Object]' || trimmed === 'undefined' || trimmed === 'null') {
      trimmed = ''
    }
    this.settings.steamApiKey = trimmed
    process.env.STEAM_API_KEY = trimmed
    this.persist()

    console.log(`[SettingsService] 🔑 Clé Steam API mise à jour : ${trimmed ? `${trimmed.substring(0, 4)}... (32 car.)` : 'Vidé'}`)

    return {
      success: true,
      apiKey: trimmed,
      hasKey: Boolean(trimmed && trimmed.length >= 8)
    }
  }

  getCurrentUser() {
    return this.settings.currentUser || null
  }

  saveCurrentUser(user) {
    this.settings.currentUser = user || null
    this.persist()
    return { success: true }
  }
}

export const settingsService = new SettingsService()
