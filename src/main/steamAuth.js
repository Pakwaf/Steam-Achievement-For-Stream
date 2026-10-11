import http from 'node:http'
import { URL, URLSearchParams } from 'node:url'
import { BrowserWindow } from 'electron'

/**
 * Service d'authentification Steam via OpenID 2.0
 */
class SteamAuthService {
  constructor() {
    this.currentUser = null
  }

  /**
   * Retourne l'utilisateur actuellement connecté
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * Déconnecte l'utilisateur courant
   */
  logout() {
    this.currentUser = null
    return { success: true }
  }

  /**
   * Lance le flux d'authentification Steam OpenID
   * @param {BrowserWindow} parentWindow - Fenêtre parente pour ancrer la popup
   * @returns {Promise<Object>} Profil de l'utilisateur connecté
   */
  async authenticate(parentWindow) {
    return new Promise((resolve, reject) => {
      let authWindow = null
      let isCompleted = false

      // 1. Démarrer un serveur HTTP local temporaire sur un port aléatoire libre
      const server = http.createServer(async (req, res) => {
        try {
          if (!req.url.startsWith('/auth/steam/callback')) {
            res.writeHead(404)
            res.end('Not Found')
            return
          }

          const parsedUrl = new URL(req.url, `http://localhost:${server.address().port}`)
          const queryParams = Object.fromEntries(parsedUrl.searchParams.entries())

          // Réponse HTML conviviale pour le navigateur de redirection
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <title>Steam Auth</title>
              <style>
                body {
                  margin: 0;
                  background-color: #171a21;
                  color: #c7d5e0;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                }
                .box {
                  text-align: center;
                  background: #1b2838;
                  padding: 2.5rem 3rem;
                  border-radius: 10px;
                  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                  border: 1px solid #2a475e;
                }
                h1 { color: #66c0f4; margin-top: 0; font-size: 1.5rem; }
                p { margin-bottom: 0; font-size: 0.95rem; color: #8f98a0; }
              </style>
            </head>
            <body>
              <div class="box">
                <h1>Connexion réussie !</h1>
                <p>Retour vers l'application en cours...</p>
              </div>
            </body>
            </html>
          `)

          if (isCompleted) return
          isCompleted = true

          // Fermer la fenêtre popup
          if (authWindow && !authWindow.isDestroyed()) {
            authWindow.close()
          }

          // 2. Valider l'assertion OpenID auprès des serveurs Valve
          await this.validateOpenIdResponse(queryParams)

          // 3. Extraire le SteamID64
          const steamId = this.extractSteamId(queryParams['openid.claimed_id'])

          // 4. Récupérer les informations de profil (Pseudo & Avatar)
          const profile = await this.fetchUserProfile(steamId)
          this.currentUser = profile

          cleanup()
          resolve(profile)
        } catch (error) {
          cleanup()
          reject(error)
        }
      })

      const cleanup = () => {
        if (server && server.listening) {
          server.close()
        }
      }

      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port
        const returnToUrl = `http://localhost:${port}/auth/steam/callback`
        const realmUrl = `http://localhost:${port}/`

        // Construction de l'URL OpenID 2.0 Steam
        const steamOpenIdUrl = new URL('https://steamcommunity.com/openid/login')
        const params = {
          'openid.ns': 'http://specs.openid.net/auth/2.0',
          'openid.mode': 'checkid_setup',
          'openid.return_to': returnToUrl,
          'openid.realm': realmUrl,
          'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
          'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
        }

        for (const [key, value] of Object.entries(params)) {
          steamOpenIdUrl.searchParams.append(key, value)
        }

        // Création de la fenêtre modale sécurisée d'authentification
        authWindow = new BrowserWindow({
          width: 820,
          height: 720,
          parent: parentWindow || null,
          modal: true,
          show: false,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            partition: 'persist:steam_auth' // Mémorise la session Steam pour éviter de ressaisir ses identifiants à chaque fois
          }
        })

        authWindow.loadURL(steamOpenIdUrl.toString())

        authWindow.once('ready-to-show', () => {
          authWindow.show()
        })

        // Gestion de l'annulation par l'utilisateur
        authWindow.on('closed', () => {
          authWindow = null
          if (!isCompleted) {
            cleanup()
            reject(new Error('Authentification annulée par l’utilisateur.'))
          }
        })
      })

      server.on('error', (err) => {
        cleanup()
        reject(new Error(`Erreur du serveur d'authentification local: ${err.message}`))
      })
    })
  }

  /**
   * Vérifie la validité cryptographique de l'assertion OpenID auprès de Steam
   * @param {Object} queryParams - Paramètres renvoyés par Steam lors de la redirection
   */
  async validateOpenIdResponse(queryParams) {
    const verificationParams = new URLSearchParams()

    for (const [key, value] of Object.entries(queryParams)) {
      if (key === 'openid.mode') {
        verificationParams.append('openid.mode', 'check_authentication')
      } else {
        verificationParams.append(key, value)
      }
    }

    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: verificationParams.toString()
    })

    if (!response.ok) {
      throw new Error(`Échec de contact du serveur Steam OpenID (code HTTP ${response.status})`)
    }

    const bodyText = await response.text()
    if (!bodyText.includes('is_valid:true')) {
      throw new Error('Validation OpenID échouée : signature rejetée par les serveurs Steam.')
    }
  }

  /**
   * Extrait le SteamID64 à partir de l'URL claimed_id
   * @param {string} claimedId URL de la forme https://steamcommunity.com/openid/id/76561198...
   */
  extractSteamId(claimedId) {
    if (!claimedId) {
      throw new Error('Paramètre openid.claimed_id manquant.')
    }

    const match = claimedId.match(/\/id\/(\d+)$/)
    if (!match || !match[1]) {
      throw new Error(`Format du SteamID non reconnu dans : ${claimedId}`)
    }

    return match[1]
  }

  /**
   * Récupère le pseudo et l'avatar de l'utilisateur
   * Priorité : Steam Web API si STEAM_API_KEY est fournie, sinon Fallback profil public XML.
   * @param {string} steamId - SteamID64
   */
  async fetchUserProfile(steamId) {
    const apiKey = process.env.STEAM_API_KEY?.trim()

    // 1. Essai via la Steam Web API officielle (si clé API configurée)
    if (apiKey) {
      try {
        const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
        const apiRes = await fetch(apiUrl)
        if (apiRes.ok) {
          const data = await apiRes.json()
          const player = data?.response?.players?.[0]
          if (player) {
            return {
              steamId: player.steamid,
              personaName: player.personaname,
              avatar: player.avatarfull || player.avatarmedium || player.avatar,
              profileUrl: player.profileurl,
              onlineState: player.personastate !== 0 ? 'En ligne' : 'Hors ligne',
              authenticatedAt: new Date().toISOString()
            }
          }
        }
      } catch (err) {
        console.warn('Avertissement: Impossible de contacter la Steam Web API, bascule sur le profil XML:', err)
      }
    }

    // 2. Fallback sans clé API : interrogation du flux XML public du profil Steam
    try {
      const xmlRes = await fetch(`https://steamcommunity.com/profiles/${steamId}/?xml=1`)
      if (xmlRes.ok) {
        const xml = await xmlRes.text()

        // Extraction du pseudo Steam
        const nameMatch = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/) || xml.match(/<steamID>(.*?)<\/steamID>/)
        const personaName = nameMatch ? nameMatch[1] : `Joueur (${steamId})`

        // Extraction de l'avatar Full
        const avatarMatch = xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/) || xml.match(/<avatarFull>(.*?)<\/avatarFull>/)
        const avatar = avatarMatch
          ? avatarMatch[1]
          : 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

        // Extraction du statut
        const stateMatch = xml.match(/<onlineState>(.*?)<\/onlineState>/)
        const onlineState = stateMatch && stateMatch[1] === 'online' ? 'En ligne' : 'Hors ligne'

        return {
          steamId,
          personaName,
          avatar,
          profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
          onlineState,
          authenticatedAt: new Date().toISOString()
        }
      }
    } catch (err) {
      console.warn('Avertissement: Impossible de parser le flux XML du profil Steam:', err)
    }

    // 3. Données minimales si le profil est totalement privé
    return {
      steamId,
      personaName: `Joueur Steam #${steamId.slice(-4)}`,
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
      onlineState: 'Inconnu',
      authenticatedAt: new Date().toISOString()
    }
  }
}

export const steamAuth = new SteamAuthService()
