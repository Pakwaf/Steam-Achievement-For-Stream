import fs from 'node:fs'
import path from 'node:path'
import electronPkg from 'electron'

const app = electronPkg?.app || electronPkg?.default?.app || null

// 1. Thème 1 : Steam Gold Classique
export const DEFAULT_THEME = {
  id: 'theme-steam-gold',
  name: 'Steam Gold Classique',
  html: `<div class="custom-achievement-card">
  <div class="card-glow"></div>
  <div class="card-body">
    <div class="icon-container">
      <img src="{icon}" alt="{title}" class="ach-icon" />
      <div class="icon-sheen"></div>
    </div>
    <div class="text-content">
      <div class="meta-line">
        <span class="game-tag">{game}</span>
        <span class="unlock-tag">SUCCÈS DÉBLOQUÉ</span>
      </div>
      <h3 class="ach-title">{title}</h3>
      <p class="ach-desc">{description}</p>
    </div>
  </div>
  <div class="progress-countdown"></div>
</div>`,

  css: `/* Conteneur principal de la notification */
.custom-achievement-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 440px;
  max-width: calc(100vw - 60px);
  background: rgba(14, 20, 29, 0.96);
  border-radius: 14px;
  border: 1px solid rgba(240, 195, 48, 0.6);
  box-shadow: 
    0 20px 48px rgba(0, 0, 0, 0.85),
    0 0 32px rgba(240, 195, 48, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  color: #fff;
  user-select: none;
  z-index: 999999;
}

/* Lueur d'ambiance */
.card-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, rgba(240, 195, 48, 0.3) 0%, transparent 70%);
  pointer-events: none;
}

/* Corps de la carte */
.card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

/* Cadre de l'icône */
.icon-container {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #f0c330;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.45);
  background: #090d13;
}

.ach-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.icon-sheen {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.35) 50%, transparent 60%);
  animation: ach-sheen 4s infinite;
  pointer-events: none;
}

@keyframes ach-sheen {
  0% { transform: translate(-80%, -80%); }
  35%, 100% { transform: translate(80%, 80%); }
}

/* Textes */
.text-content {
  flex: 1;
  min-width: 0;
}

.meta-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.game-tag {
  font-size: 11px;
  font-weight: 700;
  color: #66c0f4;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.unlock-tag {
  font-size: 11px;
  font-weight: 800;
  color: #f0c330;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(240, 195, 48, 0.5);
  white-space: nowrap;
}

.ach-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 3px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ach-desc {
  font-size: 12.5px;
  color: #a4b4cc;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Barre de progression (compte à rebours 5 secondes) */
.progress-countdown {
  height: 3px;
  background: linear-gradient(90deg, #f0c330, #ffe680);
  width: 100%;
  animation: ach-countdown 5s linear forwards;
}

@keyframes ach-countdown {
  from { width: 100%; }
  to { width: 0%; }
}

/* Animations d'entrée / sortie de la notification */
.animate-enter {
  animation: ach-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-leave {
  animation: ach-slide-down 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes ach-slide-up {
  from { opacity: 0; transform: translateY(40px) scale(0.94); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes ach-slide-down {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(30px) scale(0.96); }
}`,

  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}

// 2. Thème 2 : Cyberpunk Néon (Synthwave & Glow)
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
  border-radius: 8px;
  background: #050614;
  border: 2px solid #ff0055;
  box-shadow: 0 0 14px rgba(255, 0, 85, 0.6);
  overflow: hidden;
}

.cyber-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cyber-details {
  flex: 1;
  min-width: 0;
}

.cyber-top-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.cyber-game {
  font-size: 11px;
  font-weight: 700;
  color: #ff0055;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.cyber-tag {
  font-size: 10px;
  font-weight: 800;
  color: #00f3ff;
  letter-spacing: 0.1em;
  text-shadow: 0 0 8px rgba(0, 243, 255, 0.8);
}

.cyber-title {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.cyber-desc {
  font-size: 12px;
  color: #9eb5d6;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cyber-progress {
  height: 3px;
  background: linear-gradient(90deg, #00f3ff, #ff0055);
  animation: cyber-timer 5s linear forwards;
}

@keyframes cyber-timer {
  from { width: 100%; }
  to { width: 0%; }
}

.animate-enter {
  animation: cyber-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-leave {
  animation: cyber-leave 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes cyber-enter {
  from { opacity: 0; transform: translateY(40px) scale(0.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes cyber-leave {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(30px) scale(0.95); }
}`,

  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}

// 3. Thème 3 : Minimalist Glass (Épuré & Moderne)
export const MINIMAL_THEME = {
  id: 'theme-minimal-dark',
  name: 'Minimalist Glass',
  html: `<div class="minimal-achievement-card">
  <div class="min-icon-wrap">
    <img src="{icon}" alt="{title}" class="min-icon" />
  </div>
  <div class="min-text">
    <div class="min-sub">{game} • SUCCÈS DÉBLOQUÉ</div>
    <div class="min-title">{title}</div>
    <div class="min-desc">{description}</div>
  </div>
  <div class="min-bar"></div>
</div>`,

  css: `/* Minimalist Glass */
.minimal-achievement-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 420px;
  max-width: calc(100vw - 60px);
  background: rgba(18, 22, 28, 0.92);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  font-family: 'Outfit', sans-serif;
  color: #fff;
  user-select: none;
  overflow: hidden;
  z-index: 999999;
}

.min-icon-wrap {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #0d1117;
}

.min-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.min-text {
  flex: 1;
  min-width: 0;
}

.min-sub {
  font-size: 10.5px;
  font-weight: 700;
  color: #66c0f4;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.min-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.min-desc {
  font-size: 12px;
  color: #8b9bb4;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.min-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #66c0f4;
  animation: min-timer 5s linear forwards;
}

@keyframes min-timer {
  from { width: 100%; }
  to { width: 0%; }
}

.animate-enter {
  animation: min-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-leave {
  animation: min-leave 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes min-enter {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes min-leave {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
}`,

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

export class CustomizationService {
  constructor() {
    this.configPath = null
    this.activeThemeId = DEFAULT_THEME.id
    this.themes = [
      { ...DEFAULT_THEME, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { ...CYBERPUNK_THEME, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { ...MINIMAL_THEME, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
    this.onUpdateCallbacks = []
    this.onLibraryUpdateCallbacks = []
  }

  init() {
    try {
      if (app && typeof app.getPath === 'function') {
        const userDataDir = app.getPath('userData')
        this.configPath = path.join(userDataDir, 'custom_overlay_theme.json')
        this.load()
      }
    } catch (err) {
      console.warn('[CustomizationService] Utilisation de la bibliothèque par défaut en mémoire:', err.message)
    }
  }

  load() {
    if (!this.configPath || !fs.existsSync(this.configPath)) {
      this.activeThemeId = DEFAULT_THEME.id
      this.persist()
      return
    }

    try {
      const raw = fs.readFileSync(this.configPath, 'utf-8')
      const parsed = JSON.parse(raw)

      // 1. Détection de l'ancienne structure Phase 4 (un seul thème à la racine)
      if (parsed && !Array.isArray(parsed.themes) && (parsed.html || parsed.css)) {
        const migratedTheme = {
          id: 'theme-custom-perso',
          name: 'Mon Thème Personnalisé',
          html: parsed.html || DEFAULT_THEME.html,
          css: parsed.css || DEFAULT_THEME.css,
          audioPath: parsed.audioPath || null,
          audioDeviceId: parsed.audioDeviceId || 'default',
          soundEnabled: parsed.soundEnabled ?? true,
          soundVolume: typeof parsed.soundVolume === 'number' ? parsed.soundVolume : 0.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        this.themes = [migratedTheme, ...BUILTIN_THEMES]
        this.activeThemeId = migratedTheme.id
        this.persist()
        return
      }

      // 2. Format Bibliothèque Phase 5 ({ activeThemeId, themes: [...] })
      if (parsed && Array.isArray(parsed.themes) && parsed.themes.length > 0) {
        this.themes = parsed.themes.map((t, idx) => ({
          id: t.id || `theme-${Date.now()}-${idx}`,
          name: t.name || `Thème ${idx + 1}`,
          html: t.html || DEFAULT_THEME.html,
          css: t.css || DEFAULT_THEME.css,
          audioPath: t.audioPath || null,
          audioDeviceId: t.audioDeviceId || 'default',
          soundEnabled: t.soundEnabled ?? true,
          soundVolume: typeof t.soundVolume === 'number' ? t.soundVolume : 0.8,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString()
        }))

        // Vérifier que activeThemeId pointe vers un thème existant
        if (parsed.activeThemeId && this.themes.some((t) => t.id === parsed.activeThemeId)) {
          this.activeThemeId = parsed.activeThemeId
        } else {
          this.activeThemeId = this.themes[0].id
        }
      } else {
        // Bibliothèque vide : initialiser avec les thèmes par défaut
        this.themes = BUILTIN_THEMES.map((t) => ({
          ...t,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
        this.activeThemeId = DEFAULT_THEME.id
        this.persist()
      }
    } catch (err) {
      console.error('[CustomizationService] Erreur lecture fichier config, réinitialisation par défaut:', err)
      this.themes = BUILTIN_THEMES.map((t) => ({
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      this.activeThemeId = DEFAULT_THEME.id
    }
  }

  persist() {
    if (!this.configPath) return
    try {
      const dataToSave = {
        activeThemeId: this.activeThemeId,
        themes: this.themes
      }
      fs.writeFileSync(this.configPath, JSON.stringify(dataToSave, null, 2), 'utf-8')
    } catch (err) {
      console.error('[CustomizationService] Erreur écriture config:', err)
    }
  }

  getLibrary() {
    return {
      activeThemeId: this.activeThemeId,
      themes: this.themes.map((t) => ({ ...t }))
    }
  }

  getActiveTheme() {
    const found = this.themes.find((t) => t.id === this.activeThemeId)
    return found ? { ...found } : { ...this.themes[0] || DEFAULT_THEME }
  }

  getThemeById(id) {
    const found = this.themes.find((t) => t.id === id)
    return found ? { ...found } : null
  }

  setActiveTheme(id) {
    const target = this.themes.find((t) => t.id === id)
    if (!target) {
      return { success: false, error: 'Thème introuvable' }
    }

    this.activeThemeId = id
    this.persist()

    this.notifyUpdate()
    this.notifyLibraryUpdate()

    return {
      success: true,
      activeTheme: this.getActiveTheme(),
      library: this.getLibrary()
    }
  }

  saveTheme(themeData) {
    if (!themeData) return { success: false, error: 'Données invalides' }

    const index = this.themes.findIndex((t) => t.id === themeData.id)
    const now = new Date().toISOString()

    let updatedTheme = null

    if (index !== -1) {
      // Mise à jour du thème existant
      this.themes[index] = {
        ...this.themes[index],
        name: themeData.name || this.themes[index].name,
        html: themeData.html !== undefined ? themeData.html : this.themes[index].html,
        css: themeData.css !== undefined ? themeData.css : this.themes[index].css,
        audioPath: themeData.audioPath !== undefined ? themeData.audioPath : this.themes[index].audioPath,
        audioDeviceId: themeData.audioDeviceId || this.themes[index].audioDeviceId || 'default',
        soundEnabled: themeData.soundEnabled ?? this.themes[index].soundEnabled,
        soundVolume: typeof themeData.soundVolume === 'number' ? themeData.soundVolume : this.themes[index].soundVolume,
        updatedAt: now
      }
      updatedTheme = this.themes[index]
    } else {
      // Création si l'ID n'existait pas
      const newId = themeData.id || `theme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      updatedTheme = {
        id: newId,
        name: themeData.name || `Thème ${this.themes.length + 1}`,
        html: themeData.html || DEFAULT_THEME.html,
        css: themeData.css || DEFAULT_THEME.css,
        audioPath: themeData.audioPath || null,
        audioDeviceId: themeData.audioDeviceId || 'default',
        soundEnabled: themeData.soundEnabled ?? true,
        soundVolume: typeof themeData.soundVolume === 'number' ? themeData.soundVolume : 0.8,
        createdAt: now,
        updatedAt: now
      }
      this.themes.push(updatedTheme)
    }

    this.persist()

    // Si le thème modifié est le thème actif, notifier les overlays
    if (updatedTheme.id === this.activeThemeId) {
      this.notifyUpdate()
    }
    this.notifyLibraryUpdate()

    return {
      success: true,
      theme: { ...updatedTheme },
      library: this.getLibrary()
    }
  }

  createTheme(initial = {}) {
    const newId = `theme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const newTheme = {
      id: newId,
      name: initial.name || `Nouveau Thème ${this.themes.length + 1}`,
      html: initial.html || DEFAULT_THEME.html,
      css: initial.css || DEFAULT_THEME.css,
      audioPath: initial.audioPath || null,
      audioDeviceId: initial.audioDeviceId || 'default',
      soundEnabled: initial.soundEnabled ?? true,
      soundVolume: typeof initial.soundVolume === 'number' ? initial.soundVolume : 0.8,
      createdAt: now,
      updatedAt: now
    }

    this.themes.unshift(newTheme) // Ajoute en tête de liste
    this.persist()
    this.notifyLibraryUpdate()

    return {
      success: true,
      theme: { ...newTheme },
      library: this.getLibrary()
    }
  }

  duplicateTheme(id) {
    const source = this.themes.find((t) => t.id === id)
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

    // Insérer juste après le thème source
    const sourceIndex = this.themes.findIndex((t) => t.id === id)
    this.themes.splice(sourceIndex + 1, 0, duplicated)

    this.persist()
    this.notifyLibraryUpdate()

    return {
      success: true,
      duplicatedTheme: { ...duplicated },
      library: this.getLibrary()
    }
  }

  deleteTheme(id) {
    if (this.themes.length <= 1) {
      return {
        success: false,
        error: 'Impossible de supprimer le seul thème restant dans la bibliothèque.'
      }
    }

    const index = this.themes.findIndex((t) => t.id === id)
    if (index === -1) {
      return { success: false, error: 'Thème introuvable' }
    }

    const [deleted] = this.themes.splice(index, 1)

    // Si on a supprimé le thème actif, basculer vers un autre thème valide
    let activeChanged = false
    if (this.activeThemeId === id) {
      this.activeThemeId = this.themes[0].id
      activeChanged = true
    }

    this.persist()

    if (activeChanged) {
      this.notifyUpdate()
    }
    this.notifyLibraryUpdate()

    return {
      success: true,
      deletedId: id,
      activeTheme: this.getActiveTheme(),
      library: this.getLibrary()
    }
  }

  // Compatibilité ascendante avec Phase 4
  getTheme() {
    return this.getActiveTheme()
  }

  save(data) {
    const active = this.getActiveTheme()
    return this.saveTheme({ ...active, ...data }).theme
  }

  reset() {
    const active = this.getActiveTheme()
    return this.saveTheme({
      ...active,
      html: DEFAULT_THEME.html,
      css: DEFAULT_THEME.css,
      audioPath: null,
      soundEnabled: true,
      soundVolume: 0.8
    }).theme
  }

  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.onUpdateCallbacks.push(callback)
    }
  }

  onLibraryUpdate(callback) {
    if (typeof callback === 'function') {
      this.onLibraryUpdateCallbacks.push(callback)
    }
  }

  notifyUpdate() {
    const theme = this.getActiveTheme()
    for (const cb of this.onUpdateCallbacks) {
      try {
        cb(theme)
      } catch (err) {
        console.error('[CustomizationService] Erreur callback update:', err)
      }
    }
  }

  notifyLibraryUpdate() {
    const library = this.getLibrary()
    for (const cb of this.onLibraryUpdateCallbacks) {
      try {
        cb(library)
      } catch (err) {
        console.error('[CustomizationService] Erreur callback library update:', err)
      }
    }
  }
}

export const customizationService = new CustomizationService()
