<template>
  <div class="customization-card">
    <!-- En-tête du module de personnalisation -->
    <div class="customization-header">
      <div class="header-info">
        <div class="editor-icon-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="wand-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <div>
          <h3>Moteur de Personnalisation (HTML / CSS / Audio)</h3>
          <p class="subtitle">Modifiez le rendu visuel et sonore des notifications en direct pour Desktop & OBS</p>
        </div>
      </div>

      <!-- Bouton principal : Tester la notification -->
      <div class="header-actions">
        <button
          id="btn-test-notification"
          class="btn-test-primary"
          :disabled="isTesting"
          @click="triggerTestNotification"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="btn-play-icon">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>{{ isTesting ? 'Diffusion...' : 'Tester la notification' }}</span>
        </button>
      </div>
    </div>

    <!-- Barre d'onglets pour basculer entre HTML, CSS, Audio et Aperçu -->
    <div class="editor-tabs-bar">
      <div class="tabs-group">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'html' }"
          @click="activeTab = 'html'"
        >
          <span>Code HTML</span>
          <span class="tab-badge">Placeholders</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'css' }"
          @click="activeTab = 'css'"
        >
          <span>Style CSS</span>
          <span class="tab-badge">Animations</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'audio' }"
          @click="activeTab = 'audio'"
        >
          <span>Son & Audio</span>
          <span v-if="theme.audioPath" class="tab-badge audio-active">Custom</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'preview' }"
          @click="activeTab = 'preview'"
        >
          <span>Aperçu en Direct</span>
        </button>
      </div>

      <div class="theme-actions-inline">
        <span v-if="saveMessage" class="save-status-pill">{{ saveMessage }}</span>
        <button class="btn-reset" title="Restaurer le template d'origine" @click="resetToDefault">
          Réinitialiser par défaut
        </button>
        <button class="btn-save" :disabled="isSaving" @click="saveCustomization">
          {{ isSaving ? 'Enregistrement...' : 'Sauvegarder le thème' }}
        </button>
      </div>
    </div>

    <!-- 1. Onglet HTML -->
    <div v-show="activeTab === 'html'" class="tab-pane">
      <div class="placeholders-bar">
        <span class="pl-label">Insérer un placeholder :</span>
        <div class="pl-buttons">
          <button
            class="btn-pl"
            title="Titre du succès débloqué"
            @click="insertPlaceholder('{title}')"
          >
            + {title}
          </button>
          <button
            class="btn-pl"
            title="Description du succès"
            @click="insertPlaceholder('{description}')"
          >
            + {description}
          </button>
          <button
            class="btn-pl"
            title="URL de l'icône du succès"
            @click="insertPlaceholder('{icon}')"
          >
            + {icon}
          </button>
          <button
            class="btn-pl"
            title="Nom du jeu Steam"
            @click="insertPlaceholder('{game}')"
          >
            + {game}
          </button>
        </div>
      </div>

      <div class="code-editor-box">
        <textarea
          ref="htmlTextarea"
          v-model="theme.html"
          class="editor-textarea"
          placeholder="Entrez votre structure HTML..."
          spellcheck="false"
          rows="14"
        ></textarea>
      </div>
    </div>

    <!-- 2. Onglet CSS -->
    <div v-show="activeTab === 'css'" class="tab-pane">
      <div class="css-info-banner">
        <span>💡 <strong>Astuce :</strong> Utilisez les classes <code>.animate-enter</code> et <code>.animate-leave</code> pour vos animations d'entrée et de sortie. La notification dure 5 secondes par défaut.</span>
      </div>

      <div class="code-editor-box">
        <textarea
          v-model="theme.css"
          class="editor-textarea css-mode"
          placeholder="Entrez vos règles CSS personnalisées..."
          spellcheck="false"
          rows="14"
        ></textarea>
      </div>
    </div>

    <!-- 3. Onglet Audio -->
    <div v-show="activeTab === 'audio'" class="tab-pane">
      <div class="audio-config-card">
        <div class="audio-config-header">
          <div class="audio-status-box">
            <span class="audio-dot" :class="{ custom: theme.audioPath }"></span>
            <div>
              <h4>Fichier audio de déblocage</h4>
              <p class="audio-sub">
                {{ theme.audioPath ? 'Fichier personnalisé configuré' : 'Carillon synthétisé Web Audio par défaut' }}
              </p>
            </div>
          </div>

          <div class="audio-file-actions">
            <button class="btn-select-file" @click="browseAudioFile">
              📁 Choisir un fichier (.mp3, .wav, .ogg)
            </button>
            <button
              v-if="theme.audioPath"
              class="btn-clear-audio"
              title="Revenir au carillon par défaut"
              @click="removeAudioFile"
            >
              ✕ Retirer
            </button>
          </div>
        </div>

        <div v-if="theme.audioPath" class="audio-file-path-row">
          <span class="path-label">Chemin :</span>
          <code class="path-text" :title="theme.audioPath">{{ theme.audioPath }}</code>
        </div>

        <!-- Paramètres de lecture et volume -->
        <div class="audio-settings-grid">
          <div class="setting-item">
            <label class="setting-label">Lecture audio :</label>
            <label class="toggle-switch">
              <input v-model="theme.soundEnabled" type="checkbox" />
              <span class="slider"></span>
              <span class="toggle-text">{{ theme.soundEnabled ? 'Son Activé' : 'Son Muet' }}</span>
            </label>
          </div>

          <div class="setting-item">
            <label class="setting-label">Volume sonore ({{ Math.round(theme.soundVolume * 100) }}%) :</label>
            <div class="volume-slider-row">
              <input
                v-model.number="theme.soundVolume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                class="range-slider"
                :disabled="!theme.soundEnabled"
              />
              <button
                class="btn-play-test-sound"
                :disabled="!theme.soundEnabled"
                @click="playTestSound"
              >
                {{ isPlayingSound ? '🔊 Écoute...' : '▶ Écouter' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Onglet Aperçu en direct -->
    <div v-show="activeTab === 'preview'" class="tab-pane">
      <div class="preview-stage-container">
        <!-- Style utilisateur injecté pour l'aperçu -->
        <component :is="'style'">
          {{ theme.css || '' }}
        </component>

        <div class="preview-backdrop">
          <div class="preview-watermark">Aperçu en direct (Zone transparente)</div>
          <!-- Slot d'aperçu dynamique -->
          <div class="preview-slot" v-html="previewHtml"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['test'])

const activeTab = ref('html')
const isSaving = ref(false)
const isTesting = ref(false)
const isPlayingSound = ref(false)
const saveMessage = ref('')
const htmlTextarea = ref(null)

const theme = ref({
  html: '',
  css: '',
  audioPath: null,
  soundEnabled: true,
  soundVolume: 0.8
})

const testData = {
  displayName: 'Ceci est un test',
  description: 'Bravo, tout fonctionne ! Votre thème personnalisé est opérationnel.',
  gameName: 'Test Game',
  icon: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
}

// Calcul du HTML d'aperçu en direct
const previewHtml = computed(() => {
  if (!theme.value.html) return '<div style="color: #8b9bb4; padding: 20px;">Aucun HTML défini.</div>'
  return theme.value.html
    .replace(/\{title\}/gi, testData.displayName)
    .replace(/\{description\}/gi, testData.description)
    .replace(/\{icon\}/gi, testData.icon)
    .replace(/\{game\}/gi, testData.gameName)
})

onMounted(async () => {
  if (window.steamAPI?.getCustomization) {
    try {
      const saved = await window.steamAPI.getCustomization()
      if (saved) {
        theme.value = { ...saved }
      }
    } catch (err) {
      console.error('[CustomizationEditor] Erreur chargement thème:', err)
    }
  }
})

// Insertion ergonomique des placeholders à l'emplacement du curseur
function insertPlaceholder(placeholder) {
  const el = htmlTextarea.value
  if (!el) {
    theme.value.html += placeholder
    return
  }

  const start = el.selectionStart || 0
  const end = el.selectionEnd || 0
  const text = theme.value.html
  theme.value.html = text.substring(0, start) + placeholder + text.substring(end)

  setTimeout(() => {
    el.focus()
    el.setSelectionRange(start + placeholder.length, start + placeholder.length)
  }, 10)
}

// Sélection native d'un fichier audio
async function browseAudioFile() {
  if (!window.steamAPI?.selectAudioFile) return
  try {
    const res = await window.steamAPI.selectAudioFile()
    if (res.success && res.filePath) {
      theme.value.audioPath = res.filePath
      showStatus('Fichier audio sélectionné ✔')
      // Auto-sauvegarde du nouveau chemin audio
      saveCustomization()
    }
  } catch (err) {
    console.error('[CustomizationEditor] Erreur sélection audio:', err)
  }
}

function removeAudioFile() {
  theme.value.audioPath = null
  showStatus('Fichier audio retiré (retour au carillon par défaut)')
  saveCustomization()
}

// Joue un test du son sélectionné
function playTestSound() {
  if (!theme.value.soundEnabled || isPlayingSound.value) return
  isPlayingSound.value = true

  const volume = theme.value.soundVolume ?? 0.8

  if (theme.value.audioPath) {
    try {
      const audio = new Audio(`http://127.0.0.1:8080/audio/custom?t=${Date.now()}`)
      audio.volume = volume
      audio.onended = () => { isPlayingSound.value = false }
      audio.play().catch(() => {
        playDefaultChime(volume)
        isPlayingSound.value = false
      })
      return
    } catch {
      playDefaultChime(volume)
      isPlayingSound.value = false
      return
    }
  }

  playDefaultChime(volume)
  setTimeout(() => { isPlayingSound.value = false }, 800)
}

function playDefaultChime(vol = 0.8) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.08 * vol, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.00, now + 0.12)
    gain2.gain.setValueAtTime(0.09 * vol, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.75)
  } catch {}
}

// Sauvegarde et diffusion en direct du thème
async function saveCustomization() {
  if (isSaving.value) return
  isSaving.value = true

  try {
    if (window.steamAPI?.saveCustomization) {
      const res = await window.steamAPI.saveCustomization({ ...theme.value })
      if (res.success) {
        showStatus('Thème sauvegardé & diffusé en direct ✔')
      }
    }
  } catch (err) {
    console.error('[CustomizationEditor] Erreur sauvegarde thème:', err)
    showStatus('Erreur de sauvegarde ✖')
  } finally {
    isSaving.value = false
  }
}

// Réinitialise le template au design par défaut
async function resetToDefault() {
  if (!confirm('Voulez-vous vraiment restaurer le template et le style par défaut ?')) return

  try {
    if (window.steamAPI?.resetCustomization) {
      const res = await window.steamAPI.resetCustomization()
      if (res.success && res.theme) {
        theme.value = { ...res.theme }
        showStatus('Thème par défaut restauré ✔')
      }
    }
  } catch (err) {
    console.error('[CustomizationEditor] Erreur réinitialisation:', err)
  }
}

// Déclenche le faux succès de test dans tout le pipeline
async function triggerTestNotification() {
  if (isTesting.value) return
  isTesting.value = true

  try {
    if (window.steamAPI?.broadcastTestAchievement) {
      await window.steamAPI.broadcastTestAchievement({ ...testData })
      showStatus('Notification de test diffusée avec succès 🚀')
    } else {
      emit('test', testData)
    }
  } catch (err) {
    console.error('[CustomizationEditor] Erreur test notification:', err)
  } finally {
    setTimeout(() => {
      isTesting.value = false
    }, 1500)
  }
}

function showStatus(msg) {
  saveMessage.value = msg
  setTimeout(() => {
    if (saveMessage.value === msg) saveMessage.value = ''
  }, 3500)
}
</script>

<style scoped>
.customization-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(240, 195, 48, 0.35);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 20px rgba(240, 195, 48, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.customization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editor-icon-glow {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(240, 195, 48, 0.12);
  border: 1px solid rgba(240, 195, 48, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0c330;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.2);
}

.wand-icon {
  width: 24px;
  height: 24px;
}

.header-info h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.2rem;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--steam-text-muted);
}

.btn-test-primary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  color: #0b0e14;
  font-weight: 800;
  font-size: 0.9rem;
  padding: 0.75rem 1.4rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(240, 195, 48, 0.35);
  transition: var(--transition-smooth);
}

.btn-test-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 26px rgba(240, 195, 48, 0.55);
  background: linear-gradient(135deg, #ffd859 0%, #e6a722 100%);
}

.btn-test-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-play-icon {
  width: 18px;
  height: 18px;
}

/* Barre d'onglets */
.editor-tabs-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.75rem;
  gap: 1rem;
}

.tabs-group {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--steam-text-muted);
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.tab-btn.active {
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.4);
  color: #66c0f4;
}

.tab-badge {
  font-size: 0.68rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--steam-text-muted);
}

.tab-badge.audio-active {
  background: rgba(161, 205, 68, 0.2);
  color: #a1cd44;
}

.theme-actions-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.save-status-pill {
  font-size: 0.75rem;
  color: #a1cd44;
  font-weight: 600;
}

.btn-reset {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #a4b4cc;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.78rem;
  cursor: pointer;
}

.btn-reset:hover {
  background: rgba(235, 87, 87, 0.15);
  border-color: rgba(235, 87, 87, 0.35);
  color: #ff8080;
}

.btn-save {
  background: rgba(102, 192, 244, 0.2);
  border: 1px solid rgba(102, 192, 244, 0.45);
  color: #66c0f4;
  font-weight: 700;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-save:hover:not(:disabled) {
  background: var(--steam-blue);
  color: #0b0e14;
}

/* Onglet HTML */
.placeholders-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  background: rgba(11, 16, 24, 0.5);
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pl-label {
  font-size: 0.75rem;
  color: var(--steam-text-muted);
  font-weight: 600;
}

.pl-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-pl {
  background: rgba(240, 195, 48, 0.12);
  border: 1px solid rgba(240, 195, 48, 0.3);
  color: #f0c330;
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-pl:hover {
  background: rgba(240, 195, 48, 0.25);
  border-color: #f0c330;
  transform: translateY(-1px);
}

/* Zone d'édition de code */
.code-editor-box {
  background: #090d13;
  border: 1px solid rgba(102, 192, 244, 0.2);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
}

.editor-textarea {
  width: 100%;
  box-sizing: border-box;
  background: transparent;
  color: #e6edf3;
  font-family: 'Fira Code', Consolas, Monaco, monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  padding: 1rem;
  border: none;
  outline: none;
  resize: vertical;
}

.editor-textarea.css-mode {
  color: #a5d6ff;
}

.css-info-banner {
  font-size: 0.78rem;
  color: #a4b4cc;
  background: rgba(102, 192, 244, 0.08);
  border: 1px solid rgba(102, 192, 244, 0.2);
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.css-info-banner code {
  color: #66c0f4;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

/* Onglet Audio */
.audio-config-card {
  background: rgba(11, 16, 24, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.audio-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.audio-status-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.audio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #66c0f4;
  box-shadow: 0 0 8px #66c0f4;
}

.audio-dot.custom {
  background: #a1cd44;
  box-shadow: 0 0 8px #a1cd44;
}

.audio-status-box h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.audio-sub {
  font-size: 0.78rem;
  color: var(--steam-text-muted);
}

.audio-file-actions {
  display: flex;
  gap: 0.6rem;
}

.btn-select-file {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.35);
  color: #66c0f4;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-select-file:hover {
  background: rgba(102, 192, 244, 0.3);
}

.btn-clear-audio {
  background: rgba(235, 87, 87, 0.15);
  border: 1px solid rgba(235, 87, 87, 0.35);
  color: #ff8080;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  cursor: pointer;
}

.audio-file-path-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.path-label {
  font-size: 0.75rem;
  color: var(--steam-text-muted);
  font-weight: 600;
}

.path-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: #a1cd44;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  font-size: 0.78rem;
  color: var(--steam-text-muted);
  font-weight: 600;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle-switch input {
  display: none;
}

.slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  transition: 0.3s;
}

.slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .slider {
  background-color: #a1cd44;
}

.toggle-switch input:checked + .slider::before {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 0.82rem;
  color: #fff;
}

.volume-slider-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.range-slider {
  flex: 1;
  accent-color: var(--steam-blue);
  cursor: pointer;
}

.btn-play-test-sound {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-play-test-sound:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}

/* Onglet Aperçu */
.preview-stage-container {
  border-radius: 12px;
  overflow: hidden;
  border: 1px dashed rgba(102, 192, 244, 0.3);
  background: #090d13;
  min-height: 240px;
  position: relative;
}

.preview-backdrop {
  position: relative;
  min-height: 240px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.preview-watermark {
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 600;
}

.preview-slot {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
</style>
