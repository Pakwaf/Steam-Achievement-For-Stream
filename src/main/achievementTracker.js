import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

/**
 * Service de détection et d'écoute des succès Steam en temps réel via les logs locaux
 */
export class AchievementTracker {
  constructor() {
    this.steamPath = null
    this.watchedFiles = []
    this.isTracking = false
    this.fileOffsets = new Map() // chemin -> position de lecture actuelle (en octets)
    this.remainders = new Map() // chemin -> reste de ligne non terminée
    this.watchers = [] // instances de fs.watchFile
    this.schemaCache = new Map() // appId -> schéma complet du jeu
    this.gameNameCache = new Map() // appId -> nom du jeu (Store API fallback)
    this.onUnlockCallback = null
  }

  /**
   * Détecte automatiquement le chemin d'installation de Steam sur la machine
   * @returns {string|null} Chemin racine de Steam
   */
  detectSteamPath() {
    // 1. Variable d'environnement explicite (ex: .env ou variable système)
    if (process.env.STEAM_PATH && fs.existsSync(process.env.STEAM_PATH)) {
      return path.normalize(process.env.STEAM_PATH)
    }

    // 2. Détection Windows via le Registre
    if (process.platform === 'win32') {
      try {
        const stdout = execSync('reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath', {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore']
        })
        const match = stdout.match(/SteamPath\s+REG_SZ\s+(.+)/i)
        if (match && match[1]) {
          const regPath = path.normalize(match[1].trim())
          if (fs.existsSync(regPath)) return regPath
        }
      } catch {
        // En cas d'échec du registre HKCU, on tente le chemin d'installation global HKLM
        try {
          const stdout = execSync('reg query "HKLM\\Software\\WOW6432Node\\Valve\\Steam" /v InstallPath', {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
          })
          const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/i)
          if (match && match[1]) {
            const regPath = path.normalize(match[1].trim())
            if (fs.existsSync(regPath)) return regPath
          }
        } catch {
          // Poursuivre vers les chemins par défaut
        }
      }

      // Chemins par défaut Windows courants
      const defaultWindowsPaths = [
        'C:\\Program Files (x86)\\Steam',
        'C:\\Program Files\\Steam',
        'D:\\Steam',
        'E:\\Steam'
      ]
      for (const p of defaultWindowsPaths) {
        if (fs.existsSync(p)) return path.normalize(p)
      }
    }

    // 3. Détection macOS
    if (process.platform === 'darwin') {
      const macPath = path.join(process.env.HOME || '', 'Library/Application Support/Steam')
      if (fs.existsSync(macPath)) return macPath
    }

    // 4. Détection Linux
    if (process.platform === 'linux') {
      const linuxPaths = [
        path.join(process.env.HOME || '', '.local/share/Steam'),
        path.join(process.env.HOME || '', '.steam/steam')
      ]
      for (const p of linuxPaths) {
        if (fs.existsSync(p)) return p
      }
    }

    return null
  }

  /**
   * Trouve les fichiers de logs pertinents pour les stats et succès
   * @param {string} steamPath 
   * @returns {string[]} Liste des chemins complets des fichiers de log existants
   */
  findLogFiles(steamPath) {
    if (!steamPath) return []
    const logsDir = path.join(steamPath, 'logs')
    if (!fs.existsSync(logsDir)) return []

    const candidates = ['stats_log.txt', 'user_stats_log.txt']
    const found = []

    for (const filename of candidates) {
      const fullPath = path.join(logsDir, filename)
      if (fs.existsSync(fullPath)) {
        found.push(fullPath)
      }
    }

    // Si aucun n'existe encore (par ex. Steam jamais lancé), on surveille le fichier standard par anticipation
    if (found.length === 0) {
      found.push(path.join(logsDir, 'stats_log.txt'))
    }

    return found
  }

  /**
   * Démarre l'écoute (tail) des logs Steam en temps réel
   * @param {Function} onUnlockCallback - Callback appelé avec les métadonnées complètes du succès
   */
  start(onUnlockCallback) {
    if (this.isTracking) return
    this.onUnlockCallback = onUnlockCallback

    this.steamPath = this.detectSteamPath()
    if (!this.steamPath) {
      console.warn('[AchievementTracker] Impossible de détecter le répertoire Steam.')
      return
    }

    this.watchedFiles = this.findLogFiles(this.steamPath)
    console.log(`[AchievementTracker] Steam détecté dans : ${this.steamPath}`)
    console.log(`[AchievementTracker] Fichiers surveillés :`, this.watchedFiles)

    for (const filePath of this.watchedFiles) {
      this.attachFileWatcher(filePath)
    }

    this.isTracking = true
  }

  /**
   * Arrête l'écoute des fichiers de logs
   */
  stop() {
    for (const filePath of this.watchedFiles) {
      try {
        fs.unwatchFile(filePath)
      } catch {}
    }
    this.watchedFiles = []
    this.watchers = []
    this.isTracking = false
    this.onUnlockCallback = null
    console.log('[AchievementTracker] Écoute des logs arrêtée.')
  }

  /**
   * Attache un observateur de fichier en queue (tail)
   * @param {string} filePath 
   */
  attachFileWatcher(filePath) {
    // Si le fichier existe déjà, on commence à lire depuis la FIN actuelle (pour ne pas rejouer les anciens succès)
    let initialOffset = 0
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath)
        initialOffset = stats.size
      } catch (err) {
        console.error(`[AchievementTracker] Erreur lecture taille initiale de ${filePath}:`, err)
      }
    }

    this.fileOffsets.set(filePath, initialOffset)
    this.remainders.set(filePath, '')

    // Surveillance réactive du fichier (intervalle serré de 300ms pour réactivité instantanée sans surconsommation CPU)
    fs.watchFile(filePath, { interval: 300 }, (curr, prev) => {
      if (curr.mtimeMs <= prev.mtimeMs && curr.size === prev.size) return
      this.readNewLines(filePath, curr.size)
    })

    this.watchers.push(filePath)
  }

  /**
   * Lit uniquement les nouveaux octets ajoutés au fichier de log
   * @param {string} filePath 
   * @param {number} newSize 
   */
  readNewLines(filePath, newSize) {
    let offset = this.fileOffsets.get(filePath) || 0

    // Si le fichier a été réinitialisé / tronqué (taille devenue inférieure à l'offset précédent)
    if (newSize < offset) {
      offset = 0
    }

    const bytesToRead = newSize - offset
    if (bytesToRead <= 0) return

    const buffer = Buffer.alloc(bytesToRead)
    let fd = null

    try {
      fd = fs.openSync(filePath, 'r')
      fs.readSync(fd, buffer, 0, bytesToRead, offset)
      this.fileOffsets.set(filePath, newSize)

      const text = buffer.toString('utf8')
      const prevRemainder = this.remainders.get(filePath) || ''
      const fullText = prevRemainder + text

      // Découpage par ligne
      const lines = fullText.split(/\r?\n/)
      // La dernière ligne peut être incomplète si Steam est en train d'écrire
      const remainder = lines.pop() || ''
      this.remainders.set(filePath, remainder)

      for (const line of lines) {
        if (line.trim()) {
          this.processLogLine(line)
        }
      }
    } catch (err) {
      console.error(`[AchievementTracker] Erreur lors de la lecture incrémentale de ${filePath}:`, err)
    } finally {
      if (fd !== null) {
        try {
          fs.closeSync(fd)
        } catch {}
      }
    }
  }

  /**
   * Analyse une ligne de log avec une Regex pour détecter un déblocage de succès
   * Formats Steam courants dans stats_log.txt :
   *   [2026-10-11 12:00:00] [AppID 440] Achievement unlocked: 'TF_PLAY_GAME_EVERYCLASS'
   *   [2026-10-11 12:00:00] [AppID 440] SetAchievement 'TF_PLAY_GAME_EVERYCLASS'
   *   [2026-10-11 12:00:00] [AppID 440] unlocked achievement 'TF_PLAY_GAME_EVERYCLASS'
   *   [2026-10-11 12:00:00] [AppID 440] Achievement TF_PLAY_GAME_EVERYCLASS unlocked
   *   [2026-10-11 12:00:00] [AppID 440] Setting achievement TF_PLAY_GAME_EVERYCLASS
   * @param {string} line 
   */
  processLogLine(line) {
    if (!line.includes('[AppID')) return

    const parsed = this.parseAchievementRegex(line)
    if (!parsed) return

    console.log(`[AchievementTracker] 🎯 Succès détecté dans le log ! AppID: ${parsed.appId}, Code: ${parsed.achievementApiName}`)
    this.handleUnlockedAchievement(parsed.appId, parsed.achievementApiName)
  }

  /**
   * Extraction de l'AppID et du code de succès par Regex
   * @param {string} line 
   * @returns {{appId: string, achievementApiName: string}|null}
   */
  parseAchievementRegex(line) {
    // Regex universelle pour capturer l'AppID et le nom de l'achievement dans les logs Steam
    const regexList = [
      /\[AppID\s+(\d+)\]\s*(?:.*?(?:achievement\s+unlocked|unlocked\s+achievement)\s*[:']?\s*['"]?([a-zA-Z0-9_\-:]+)['"]?)/i,
      /\[AppID\s+(\d+)\]\s*(?:.*?(?:SetAchievement|Setting\s+achievement|adding\s+achievement)\s*['"]?([a-zA-Z0-9_\-:]+)['"]?)/i,
      /\[AppID\s+(\d+)\]\s*(?:.*?Achievement\s+['"]?([a-zA-Z0-9_\-:]+)['"]?\s+unlocked)/i
    ]

    for (const rx of regexList) {
      const match = line.match(rx)
      if (match && match[1] && match[2]) {
        return {
          appId: match[1],
          achievementApiName: match[2].trim()
        }
      }
    }

    return null
  }

  /**
   * Récupère les métadonnées riches depuis la Steam Web API et notifie le callback
   * @param {string} appId 
   * @param {string} achievementApiName 
   */
  async handleUnlockedAchievement(appId, achievementApiName) {
    try {
      const metadata = await this.getAchievementMetadata(appId, achievementApiName)
      if (this.onUnlockCallback) {
        this.onUnlockCallback(metadata)
      }
    } catch (err) {
      console.error(`[AchievementTracker] Erreur lors de la récupération des métadonnées pour ${appId}/${achievementApiName}:`, err)
      // Fallback avec les informations brutes
      if (this.onUnlockCallback) {
        this.onUnlockCallback({
          appId,
          gameName: `AppID ${appId}`,
          apiName: achievementApiName,
          displayName: achievementApiName,
          description: 'Succès débloqué !',
          icon: 'https://community.cloudflare.steamstatic.com/public/images/apps/' + appId + '/icon.jpg',
          unlockedAt: new Date().toISOString()
        })
      }
    }
  }

  /**
   * Résout le nom du jeu via le schéma ou l'API Steam Store en fallback
   * (Nécessaire pour les jeux comme Left 4 Dead 2 ou Portal 2 où gameName est vide dans GetSchemaForGame)
   * @param {string} appId 
   * @param {string} schemaGameName 
   * @returns {Promise<string>}
   */
  async resolveGameName(appId, schemaGameName) {
    if (schemaGameName && schemaGameName.trim()) {
      return schemaGameName.trim()
    }

    if (this.gameNameCache.has(appId)) {
      return this.gameNameCache.get(appId)
    }

    try {
      const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`)
      if (res.ok) {
        const data = await res.json()
        const storeName = data?.[appId]?.data?.name
        if (storeName && storeName.trim()) {
          const cleanName = storeName.trim()
          this.gameNameCache.set(appId, cleanName)
          return cleanName
        }
      }
    } catch (err) {
      console.warn(`[AchievementTracker] Impossible de résoudre le nom du jeu pour AppID ${appId}:`, err)
    }

    const fallback = `Jeu #${appId}`
    this.gameNameCache.set(appId, fallback)
    return fallback
  }

  /**
   * Interroge l'API Steam ISteamUserStats/GetSchemaForGame avec système de cache
   * @param {string} appId 
   * @param {string} achievementApiName 
   * @returns {Promise<Object>}
   */
  async getAchievementMetadata(appId, achievementApiName) {
    const apiKey = process.env.STEAM_API_KEY?.trim()
    let schema = this.schemaCache.get(appId)

    // 1. Récupération du schéma du jeu si pas en cache
    if (!schema && apiKey) {
      try {
        const url = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appId}&l=french`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          if (data?.game) {
            schema = data.game
            this.schemaCache.set(appId, schema)
          }
        } else {
          console.warn(`[AchievementTracker] Échec HTTP (${res.status}) lors de l'appel GetSchemaForGame pour AppID ${appId}`)
        }
      } catch (err) {
        console.warn(`[AchievementTracker] Erreur réseau GetSchemaForGame:`, err)
      }
    }

    // Résolution fiable du nom du jeu (gère les noms vides de Valve comme L4D2)
    const gameName = await this.resolveGameName(appId, schema?.gameName)
    const achievementsList = schema?.availableGameStats?.achievements || []

    // 2. Recherche robuste du succès correspondant dans le schéma
    const cleanCode = achievementApiName.replace(/^['"]|['"]$/g, '').trim().toLowerCase()
    const strippedCode = cleanCode.replace(/[^a-z0-9]/g, '')

    // Recherche A : correspondance directe insensible à la casse
    let target = achievementsList.find((a) => a.name.toLowerCase() === cleanCode)

    // Recherche B : correspondance insensible aux underscores et tirets
    if (!target) {
      target = achievementsList.find((a) => a.name.toLowerCase().replace(/[^a-z0-9]/g, '') === strippedCode)
    }

    // Recherche C : correspondance partielle
    if (!target) {
      target = achievementsList.find((a) => a.name.toLowerCase().includes(cleanCode) || cleanCode.includes(a.name.toLowerCase()))
    }

    if (target) {
      return {
        appId,
        gameName,
        apiName: target.name,
        displayName: target.displayName || target.name,
        description: target.description || 'Succès débloqué !',
        icon: target.icon || target.icongray || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        iconGray: target.icongray || '',
        hidden: Boolean(target.hidden),
        unlockedAt: new Date().toISOString()
      }
    }

    // 3. Fallback avec icône par défaut fiable si le code n'est pas dans le schéma
    return {
      appId,
      gameName,
      apiName: achievementApiName,
      displayName: achievementApiName,
      description: 'Succès débloqué !',
      icon: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      iconGray: '',
      hidden: false,
      unlockedAt: new Date().toISOString()
    }
  }

  /**
   * Déclenche une simulation manuelle (idéal pour tester l'overlay sans lancer de jeu)
   * @param {string} appId - Par défaut 440 (Team Fortress 2)
   * @param {string} achievementCode - Par défaut 'TF_PLAY_GAME_EVERYCLASS'
   */
  async simulateUnlock(appId = '440', achievementCode = 'TF_PLAY_GAME_EVERYCLASS') {
    console.log(`[AchievementTracker] 🧪 Simulation manuelle déclenchée pour AppID ${appId} : ${achievementCode}`)
    await this.handleUnlockedAchievement(appId, achievementCode)
  }

  /**
   * Retourne l'état actuel du tracker pour l'interface Vue
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      steamPath: this.steamPath,
      watchedFiles: this.watchedFiles,
      hasApiKey: Boolean(process.env.STEAM_API_KEY?.trim())
    }
  }
}

export const achievementTracker = new AchievementTracker()
