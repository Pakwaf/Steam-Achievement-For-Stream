import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { settingsService } from './settingsService.js'

/**
 * Service de détection et d'écoute des succès Steam en temps réel
 * Mode Hybride : Événements logs locaux (stats_log.txt) + Steam Web API intelligente
 */
export class AchievementTracker {
  constructor() {
    this.steamPath = null
    this.steamId = null
    this.apiKey = null
    this.watchedFiles = []
    this.isTracking = false
    this.fileOffsets = new Map() // chemin -> position de lecture actuelle (en octets)
    this.remainders = new Map() // chemin -> reste de ligne non terminée
    this.watchers = []

    // État du jeu en cours
    this.activeAppId = null
    this.activeGameName = null
    this.knownUnlockedAchievements = new Map() // appId -> Set d'apiName déjà débloqués
    this.gameInitialized = new Map() // appId -> boolean (vrai quand l'état de départ est indexé)
    this.isCheckingAchievements = false

    // Timers de surveillance
    this.summaryPollTimer = null
    this.gamePollTimer = null

    // Caches métadonnées
    this.schemaCache = new Map() // appId -> schéma complet du jeu
    this.gameNameCache = new Map() // appId -> nom du jeu (Store API fallback)
    this.onUnlockCallback = null
  }

  /**
   * Retourne la clé Steam API active (du service paramètres ou de l'environnement)
   * @returns {string}
   */
  getEffectiveApiKey() {
    if (this.apiKey && this.apiKey.trim().length >= 8) {
      return this.apiKey.trim()
    }
    const settingsKey = settingsService.getSteamApiKey()?.apiKey
    if (settingsKey && settingsKey.trim().length >= 8) {
      return settingsKey.trim()
    }
    return (process.env.STEAM_API_KEY || '').trim()
  }

  /**
   * Retourne le SteamID64 actif (du profil connecté ou auto-détecté dans loginusers.vdf)
   * @returns {string|null}
   */
  getEffectiveSteamId() {
    if (this.steamId && /^\d{17}$/.test(this.steamId)) {
      return this.steamId
    }
    const savedUser = settingsService.getCurrentUser()
    if (savedUser?.steamId && /^\d{17}$/.test(savedUser.steamId)) {
      this.steamId = savedUser.steamId
      return this.steamId
    }
    const autoDetected = this.detectActiveSteamId(this.steamPath)
    if (autoDetected) {
      this.steamId = autoDetected
      return this.steamId
    }
    return null
  }

  /**
   * Met à jour le profil Steam de l'utilisateur actif
   * @param {Object} user 
   */
  setSteamUser(user) {
    if (user?.steamId) {
      this.steamId = user.steamId
      console.log(`[AchievementTracker] 👤 Utilisateur Steam associé : ${user.personaName || user.steamId} (${user.steamId})`)
    } else {
      this.steamId = null
    }
  }

  /**
   * Met à jour la clé Steam API
   * @param {string} key 
   */
  setApiKey(key) {
    if (key && typeof key === 'string') {
      this.apiKey = key.trim()
      console.log(`[AchievementTracker] 🔑 Clé Steam API actualisée : ${this.apiKey.substring(0, 4)}...`)
    }
  }

  /**
   * Détecte automatiquement le SteamID64 du joueur actif via loginusers.vdf de Steam
   * @param {string} steamPath 
   * @returns {string|null}
   */
  detectActiveSteamId(steamPath) {
    if (!steamPath) return null
    const loginUsersPath = path.join(steamPath, 'config', 'loginusers.vdf')
    if (!fs.existsSync(loginUsersPath)) return null

    try {
      const content = fs.readFileSync(loginUsersPath, 'utf8')
      const userMatches = [...content.matchAll(/"(7656\d+)"\s*\{([\s\S]*?)\}/g)]
      let autoLoginSteamId = null
      let bestSteamId = null
      let highestTimestamp = 0

      for (const match of userMatches) {
        const steamId = match[1]
        const block = match[2]
        if (block.includes('"AutoLogin"\t\t"1"') || block.includes('"AutoLogin" "1"') || block.includes('"MostRecent"\t\t"1"')) {
          autoLoginSteamId = steamId
        }
        const timeMatch = block.match(/"Timestamp"\s*"(\d+)"/)
        if (timeMatch) {
          const ts = parseInt(timeMatch[1], 10)
          if (ts > highestTimestamp) {
            highestTimestamp = ts
            bestSteamId = steamId
          }
        }
      }

      return autoLoginSteamId || bestSteamId
    } catch (err) {
      console.warn('[AchievementTracker] Erreur lecture loginusers.vdf:', err.message)
      return null
    }
  }

  /**
   * Détecte automatiquement le chemin d'installation de Steam sur la machine
   * @returns {string|null} Chemin racine de Steam
   */
  detectSteamPath() {
    if (process.env.STEAM_PATH && fs.existsSync(process.env.STEAM_PATH)) {
      return path.normalize(process.env.STEAM_PATH)
    }

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
        } catch {}
      }

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

    if (process.platform === 'darwin') {
      const macPath = path.join(process.env.HOME || '', 'Library/Application Support/Steam')
      if (fs.existsSync(macPath)) return macPath
    }

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

    if (found.length === 0) {
      found.push(path.join(logsDir, 'stats_log.txt'))
    }

    return found
  }

  /**
   * Démarre la détection des succès en temps réel
   * @param {Function} onUnlockCallback
   */
  start(onUnlockCallback) {
    if (this.isTracking) return
    this.onUnlockCallback = onUnlockCallback

    this.steamPath = this.detectSteamPath()
    if (!this.steamPath) {
      console.warn('[AchievementTracker] Impossible de détecter le répertoire Steam.')
      return
    }

    this.steamId = this.getEffectiveSteamId()
    this.apiKey = this.getEffectiveApiKey()

    console.log(`[AchievementTracker] 🔍 Steam détecté dans : ${this.steamPath}`)
    console.log(`[AchievementTracker] 👤 SteamID64 actif : ${this.steamId || 'Non détecté'}`)
    console.log(`[AchievementTracker] 🔑 Clé API Steam présente : ${Boolean(this.apiKey)}`)

    // 1. Surveillance temps réel du fichier de log stats_log.txt
    this.watchedFiles = this.findLogFiles(this.steamPath)
    console.log(`[AchievementTracker] 📄 Fichiers de log surveillés :`, this.watchedFiles)

    for (const filePath of this.watchedFiles) {
      this.attachFileWatcher(filePath)
    }

    // 2. Démarrage de la détection du jeu actif via Steam Web API
    this.startActiveGameDetection()

    this.isTracking = true
  }

  /**
   * Arrête toute la surveillance
   */
  stop() {
    for (const filePath of this.watchedFiles) {
      try {
        fs.unwatchFile(filePath)
      } catch {}
    }
    this.watchedFiles = []
    this.watchers = []

    if (this.summaryPollTimer) {
      clearInterval(this.summaryPollTimer)
      this.summaryPollTimer = null
    }

    if (this.gamePollTimer) {
      clearInterval(this.gamePollTimer)
      this.gamePollTimer = null
    }

    this.isTracking = false
    this.onUnlockCallback = null
    console.log('[AchievementTracker] Surveillance arrêtée.')
  }

  /**
   * Boucle légère de détection du jeu en cours (vérification toutes les 3.5s)
   */
  startActiveGameDetection() {
    if (this.summaryPollTimer) clearInterval(this.summaryPollTimer)

    // Exécution immédiate
    this.pollActiveGame()

    // Vérification périodique toutes les 3.5 secondes
    this.summaryPollTimer = setInterval(() => {
      this.pollActiveGame()
    }, 3500)
  }

  /**
   * Interroge GetPlayerSummaries pour savoir si un jeu Steam est en cours d'exécution
   */
  async pollActiveGame() {
    const apiKey = this.getEffectiveApiKey()
    const steamId = this.getEffectiveSteamId()
    if (!apiKey || !steamId) return

    try {
      const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const player = data?.response?.players?.[0]
        const gameId = player?.gameid ? String(player.gameid).trim() : null
        const gameName = player?.gameextrainfo || null

        if (gameId && gameId !== this.activeAppId) {
          await this.onGameStarted(gameId, gameName)
        } else if (!gameId && this.activeAppId) {
          this.onGameStopped(this.activeAppId)
        }
      }
    } catch {
      // Ignorer les micro-coupures réseau
    }
  }

  /**
   * Déclenché quand un jeu Steam démarre
   * @param {string} appId 
   * @param {string} [gameName] 
   */
  async onGameStarted(appId, gameName) {
    if (!appId) return

    // Si c'est déjà le même jeu actif et que son suivi tourne, ne rien perturber
    if (this.activeAppId === appId && this.gameInitialized.get(appId) && this.gamePollTimer) {
      return
    }

    const previousAppId = this.activeAppId
    this.activeAppId = appId
    this.activeGameName = gameName || await this.resolveGameName(appId)

    if (previousAppId !== appId) {
      console.log(`[AchievementTracker] 🎮 Jeu détecté en cours d'exécution : ${this.activeGameName} (AppID ${appId})`)
    }

    // Si ce jeu n'a jamais été initialisé dans la session, on indexe son point de départ
    const isAlreadyInitialized = this.gameInitialized.get(appId)
    if (!isAlreadyInitialized) {
      await this.checkPlayerAchievements(appId, true)
    }

    // Démarrer la surveillance rapprochée pendant la partie (toutes les 1.5 secondes)
    if (this.gamePollTimer) clearInterval(this.gamePollTimer)
    this.gamePollTimer = setInterval(async () => {
      if (this.activeAppId === appId) {
        await this.checkPlayerAchievements(appId, false)
      }
    }, 1500)
  }

  /**
   * Déclenché quand un jeu Steam s'arrête
   * @param {string} appId 
   */
  onGameStopped(appId) {
    console.log(`[AchievementTracker] ⏹️ Fin de session de jeu pour ${this.activeGameName || appId}`)
    if (this.gamePollTimer) {
      clearInterval(this.gamePollTimer)
      this.gamePollTimer = null
    }
    this.activeAppId = null
    this.activeGameName = null
  }

  /**
   * Interroge GetPlayerAchievements pour comparer l'état actuel et détecter les déblocages
   * @param {string} appId 
   * @param {boolean} isInitial - Si true, indexe les succès existants sans déclencher d'alerte
   */
  async checkPlayerAchievements(appId, isInitial = false) {
    if (!appId) return
    const apiKey = this.getEffectiveApiKey()
    const steamId = this.getEffectiveSteamId()
    if (!apiKey || !steamId) return

    if (this.isCheckingAchievements) return
    this.isCheckingAchievements = true

    try {
      // Ajout d'un timestamp anti-cache pour forcer Steam à renvoyer l'état le plus frais
      const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${apiKey}&steamid=${steamId}&l=french&_t=${Date.now()}`
      const res = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      if (!res.ok) {
        console.warn(`[AchievementTracker] ⚠️ Requête GetPlayerAchievements status HTTP ${res.status} pour AppID ${appId}`)
        return
      }

      const data = await res.json()
      const achievements = data?.playerstats?.achievements || []
      const resolvedGameName = data?.playerstats?.gameName || this.activeGameName || `AppID ${appId}`
      if (resolvedGameName && !this.activeGameName) {
        this.activeGameName = resolvedGameName
      }

      let knownSet = this.knownUnlockedAchievements.get(appId)
      if (!knownSet) {
        knownSet = new Set()
        this.knownUnlockedAchievements.set(appId, knownSet)
      }

      // Initialisation : on mémorise tous les succès déjà débloqués par le joueur
      if (isInitial || !this.gameInitialized.get(appId)) {
        for (const a of achievements) {
          if (a.achieved === 1) {
            knownSet.add((a.apiname || '').toLowerCase().trim())
          }
        }
        this.gameInitialized.set(appId, true)
        console.log(`[AchievementTracker] ✅ Suivi des succès enclenché pour "${resolvedGameName}" (${knownSet.size}/${achievements.length} déjà débloqués).`)
        return
      }

      // Recherche des nouveaux succès débloqués depuis la dernière vérification
      for (const a of achievements) {
        const codeKey = (a.apiname || '').toLowerCase().trim()
        if (a.achieved === 1 && !knownSet.has(codeKey)) {
          // NOUVEAU SUCCÈS DÉBLOQUÉ !
          knownSet.add(codeKey)
          console.log(`[AchievementTracker] 🏆 NOUVEAU SUCCÈS DÉBLOQUÉ : "${a.name || a.apiname}" dans ${resolvedGameName} !`)

          const meta = await this.getAchievementMetadata(appId, a.apiname, a.name, a.description, resolvedGameName)
          if (this.onUnlockCallback) {
            this.onUnlockCallback(meta)
          }
        }
      }
    } catch (err) {
      console.warn(`[AchievementTracker] Erreur lors de la vérification des succès pour AppID ${appId}:`, err.message)
    } finally {
      this.isCheckingAchievements = false
    }
  }

  /**
   * Attache un observateur de fichier en queue (tail)
   * @param {string} filePath 
   */
  attachFileWatcher(filePath) {
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

    // Surveillance réactive du fichier (intervalle serré de 300ms)
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

      const lines = fullText.split(/\r?\n/)
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
   * Analyse une ligne de log avec gestion réactive
   * @param {string} line 
   */
  processLogLine(line) {
    if (!line.includes('[AppID')) return

    const appMatch = line.match(/\[AppID\s+(\d+)\]/i)
    if (appMatch && appMatch[1]) {
      const appId = appMatch[1]

      // Si aucun jeu actif n'a été détecté via l'API, on utilise celui du log
      if (!this.activeAppId) {
        this.onGameStarted(appId)
      }

      // Déclencheur immédiat : Steam sauvegarde des stats ou succès !
      // On déclenche la vérification si la ligne concerne le jeu actif ou si le log est en cours
      if (line.includes('CAPIJobStoreUserStats') || line.includes('CAPIJobRequestUserStats')) {
        const targetAppId = this.activeAppId || appId
        console.log(`[AchievementTracker] ⚡ Déclencheur Steam reçu dans stats_log.txt pour AppID ${targetAppId}`)
        this.checkPlayerAchievements(targetAppId, false)
      }
    }

    // 3. Fallback textuel historique (pour émulateurs ou anciens jeux qui écriraient encore en clair)
    const parsed = this.parseAchievementRegex(line)
    if (parsed) {
      console.log(`[AchievementTracker] 🎯 Succès détecté via log texte ! AppID: ${parsed.appId}, Code: ${parsed.achievementApiName}`)
      this.handleUnlockedAchievement(parsed.appId, parsed.achievementApiName)
    }
  }

  /**
   * Extraction de l'AppID et du code de succès par Regex historique
   * @param {string} line 
   * @returns {{appId: string, achievementApiName: string}|null}
   */
  parseAchievementRegex(line) {
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
   * Traitement d'un succès débloqué (appel direct ou historique)
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
      console.error(`[AchievementTracker] Erreur métadonnées ${appId}/${achievementApiName}:`, err)
    }
  }

  /**
   * Résout le nom du jeu via le schéma ou l'API Steam Store en fallback
   * @param {string} appId 
   * @param {string} [schemaGameName] 
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
    } catch {
      // Ignorer
    }

    const fallback = `Jeu #${appId}`
    this.gameNameCache.set(appId, fallback)
    return fallback
  }

  /**
   * Récupère le schéma officiel et les icônes haute résolution pour un succès
   * @param {string} appId 
   * @param {string} achievementApiName 
   * @param {string} [providedName] 
   * @param {string} [providedDesc] 
   * @param {string} [providedGameName] 
   * @returns {Promise<Object>}
   */
  async getAchievementMetadata(appId, achievementApiName, providedName, providedDesc, providedGameName) {
    const apiKey = this.getEffectiveApiKey()
    let schema = this.schemaCache.get(appId)

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
        }
      } catch (err) {
        console.warn(`[AchievementTracker] Erreur réseau GetSchemaForGame:`, err.message)
      }
    }

    const gameName = providedGameName || await this.resolveGameName(appId, schema?.gameName)
    const achievementsList = schema?.availableGameStats?.achievements || []

    const cleanCode = (achievementApiName || '').replace(/^['"]|['"]$/g, '').trim().toLowerCase()
    const strippedCode = cleanCode.replace(/[^a-z0-9]/g, '')

    let target = achievementsList.find((a) => a.name.toLowerCase() === cleanCode)
    if (!target) {
      target = achievementsList.find((a) => a.name.toLowerCase().replace(/[^a-z0-9]/g, '') === strippedCode)
    }
    if (!target) {
      target = achievementsList.find((a) => a.name.toLowerCase().includes(cleanCode) || cleanCode.includes(a.name.toLowerCase()))
    }

    const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

    if (target) {
      return {
        appId,
        gameName,
        apiName: target.name,
        displayName: providedName || target.displayName || target.name,
        description: providedDesc || target.description || 'Succès débloqué !',
        icon: target.icon || target.icongray || fallbackIcon,
        iconGray: target.icongray || '',
        hidden: Boolean(target.hidden),
        unlockedAt: new Date().toISOString()
      }
    }

    return {
      appId,
      gameName,
      apiName: achievementApiName,
      displayName: providedName || achievementApiName,
      description: providedDesc || 'Succès débloqué !',
      icon: fallbackIcon,
      iconGray: '',
      hidden: false,
      unlockedAt: new Date().toISOString()
    }
  }

  /**
   * Déclenche une simulation manuelle (idéal pour tester l'overlay sans lancer de jeu)
   * @param {string} appId 
   * @param {string} achievementCode 
   */
  async simulateUnlock(appId = '440', achievementCode = 'TF_PLAY_GAME_EVERYCLASS') {
    console.log(`[AchievementTracker] 🧪 Simulation manuelle pour AppID ${appId} : ${achievementCode}`)
    await this.handleUnlockedAchievement(appId, achievementCode)
  }

  /**
   * Retourne l'état actuel du tracker pour l'interface Vue
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      steamPath: this.steamPath,
      steamId: this.getEffectiveSteamId(),
      hasApiKey: Boolean(this.getEffectiveApiKey()),
      activeAppId: this.activeAppId,
      activeGameName: this.activeGameName,
      watchedFiles: this.watchedFiles
    }
  }
}

export const achievementTracker = new AchievementTracker()
