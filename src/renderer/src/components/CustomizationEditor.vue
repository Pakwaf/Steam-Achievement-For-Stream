<template>
  <div class="customization-card">
    <!-- Barre supérieure de navigation dans l'éditeur -->
    <div class="editor-top-nav">
      <button class="btn-back-library" title="Revenir à la liste des thèmes" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="back-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Retour à la Bibliothèque</span>
      </button>

      <div class="editor-header-badges">
        <span v-if="isActiveTheme" class="status-badge-active">
          <span class="badge-dot pulse"></span>
          Thème Actif sur Overlays
        </span>
        <span v-else class="status-badge-inactive">
          <span class="badge-dot"></span>
          Thème en cours d'édition
        </span>

        <button
          v-if="!isActiveTheme"
          class="btn-activate-now"
          title="Définir immédiatement comme thème actif pour les overlays"
          @click="activateCurrentTheme"
        >
          Activer pour le stream
        </button>
      </div>
    </div>

    <!-- En-tête principal : Nom du thème et actions clés -->
    <div class="customization-header">
      <div class="header-info">
        <div class="editor-icon-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="wand-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>

        <div class="theme-title-editor-wrap">
          <label class="theme-name-label">Nom du thème</label>
          <div class="theme-name-input-row">
            <input
              v-model="theme.name"
              type="text"
              class="theme-name-input"
              placeholder="Ex : Steam Gold Classique..."
              maxlength="45"
              @blur="autoSaveThemeName"
            />
            <span class="theme-id-chip">ID: {{ theme.id }}</span>
          </div>
        </div>
      </div>

      <!-- Bouton principal : Tester la notification -->
      <div class="header-actions">
        <button
          id="btn-test-notification"
          class="btn-test-primary"
          :disabled="isTesting"
          title="Teste le code actuellement en cours d'édition sur Desktop et OBS"
          @click="triggerTestNotification"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="btn-play-icon">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>{{ isTesting ? 'Diffusion...' : 'Tester ce thème' }}</span>
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
          Réinitialiser
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

        <!-- Sélecteur de sortie audio (Wave Link / Casque / Périphérique Windows) -->
        <div class="device-selector-card">
          <div class="setting-item">
            <div class="device-label-row">
              <label class="setting-label">Sortie audio de l'application :</label>
              <button class="btn-refresh-devices" title="Actualiser la liste des périphériques" @click="refreshAudioDevices">
                🔄 Détecter
              </button>
            </div>
            <select
              v-model="theme.audioDeviceId"
              class="device-select"
              @change="onAudioDeviceChange"
            >
              <option v-for="dev in audioDevices" :key="dev.deviceId" :value="dev.deviceId">
                {{ dev.label }}
              </option>
            </select>
            <p class="device-hint">
              💡 <strong>Wave Link / Casque</strong> : Sélectionnez le canal où vous souhaitez entendre la notification (ex : <em>Wave Link SFX</em> ou votre sortie casque habituelle).
            </p>
          </div>
        </div>

        <!-- Astuces de routage audio pour OBS Studio -->
        <div class="obs-sound-tips-card">
          <div class="tips-header">
            <span>📺 Comment entendre le son dans OBS Studio & Wave Link :</span>
          </div>
          <ul class="tips-list">
            <li>
              <strong>Option 1 (Le plus simple) :</strong> Dans les propriétés de la source navigateur OBS, <em>décochez</em> <code>Contrôler l'audio via OBS</code>. Le son passera directement par Windows sur votre sortie audio habituelle.
            </li>
            <li>
              <strong>Option 2 (Mixage OBS / Wave Link) :</strong> Si <code>Contrôler l'audio via OBS</code> est <em>coché</em> (les barres vertes bougent dans OBS), allez dans le Mélangeur Audio OBS &gt; ⚙️ Propriétés audio avancées &gt; réglez la source navigateur sur <strong>"Surveillance et sortie"</strong>.
            </li>
          </ul>
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
import { ref, computed, watch, onMounted } from 'vue'
import { playAchievementSound, getAudioOutputDevices } from '../utils/soundPlayer.js'
import { DEFAULT_THEME } from '../utils/defaultTheme.js'

const props = defineProps({
  targetTheme: {
    type: Object,
    default: null
  },
  isActiveTheme: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back', 'saved', 'activate'])

const activeTab = ref('html')
const isSaving = ref(false)
const isTesting = ref(false)
const isPlayingSound = ref(false)
const saveMessage = ref('')
const htmlTextarea = ref(null)

const theme = ref({
  id: 'theme-custom',
  name: 'Nouveau Thème',
  html: '',
  css: '',
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
})

const audioDevices = ref([
  { deviceId: 'default', label: 'Périphérique Windows par défaut' }
])

const testData = {
  displayName: 'Ceci est un test',
  description: 'Bravo, tout fonctionne ! Votre thème personnalisé est opérationnel.',
  gameName: 'Test Game',
  icon: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
}

// Synchronise le thème édité dès que targetTheme change
watch(
  () => props.targetTheme,
  (newTheme) => {
    if (newTheme) {
      theme.value = {
        ...DEFAULT_THEME,
        ...JSON.parse(JSON.stringify(newTheme)),
        audioDeviceId: newTheme.audioDeviceId || 'default'
      }
    }
  },
  { immediate: true, deep: true }
)

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
  // 1. Détection des périphériques audio (Wave Link / Windows)
  await refreshAudioDevices()

  // 2. Si aucun targetTheme n'a été passé en prop, charger le thème actif depuis le backend
  if (!props.targetTheme && window.steamAPI?.getActiveTheme) {
    try {
      const active = await window.steamAPI.getActiveTheme()
      if (active) {
        theme.value = {
          ...DEFAULT_THEME,
          ...active,
          audioDeviceId: active.audioDeviceId || 'default'
        }
      }
    } catch (err) {
      console.error('[CustomizationEditor] Erreur chargement thème:', err)
    }
  }
})

function goBack() {
  emit('back')
}

function activateCurrentTheme() {
  emit('activate', theme.value.id)
}

function autoSaveThemeName() {
  if (theme.value.id && window.steamAPI?.saveTheme) {
    window.steamAPI.saveTheme({ ...theme.value })
  }
}

// Actualise la liste des sorties audio du système
async function refreshAudioDevices() {
  const outputs = await getAudioOutputDevices()
  if (outputs.length > 0) {
    audioDevices.value = outputs
  }
}

// Changement de périphérique audio
function onAudioDeviceChange() {
  saveCustomization()
  showStatus('Sortie audio mise à jour ✔')
}

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
      // Auto-sauvegarde immédiate du nouveau chemin audio pour ce thème
      await saveCustomization()
      // Jouer immédiatement le nouveau son sélectionné pour confirmation auditive
      await playTestSound()
    }
  } catch (err) {
    console.error('[CustomizationEditor] Erreur sélection audio:', err)
  }
}

async function removeAudioFile() {
  theme.value.audioPath = null
  showStatus('Fichier audio retiré (retour au carillon par défaut)')
  await saveCustomization()
  await playTestSound()
}

// Joue un test du son sélectionné via le moteur audio fiable
async function playTestSound() {
  if (!theme.value.soundEnabled || isPlayingSound.value) return
  isPlayingSound.value = true

  try {
    await playAchievementSound({
      soundEnabled: true,
      soundVolume: theme.value.soundVolume,
      audioPath: theme.value.audioPath,
      audioDeviceId: theme.value.audioDeviceId
    })
  } catch (err) {
    console.error('[CustomizationEditor] Erreur test son:', err)
  } finally {
    setTimeout(() => {
      isPlayingSound.value = false
    }, 900)
  }
}

// Sauvegarde du thème spécifique
async function saveCustomization() {
  if (isSaving.value) return
  isSaving.value = true

  try {
    if (window.steamAPI?.saveTheme) {
      const res = await window.steamAPI.saveTheme({ ...theme.value })
      if (res.success) {
        showStatus('Thème sauvegardé avec succès ✔')
        emit('saved', res.theme)
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
  if (!confirm('Voulez-vous vraiment restaurer le template et le style par défaut pour ce thème ?')) return

  theme.value.html = DEFAULT_THEME.html
  theme.value.css = DEFAULT_THEME.css
  theme.value.audioPath = null
  await saveCustomization()
  showStatus('Structure par défaut restaurée ✔')
}

// Déclenche le faux succès de test en utilisant LE CODE EN COURS D'ÉDITION pour la prévisualisation
async function triggerTestNotification() {
  if (isTesting.value) return
  isTesting.value = true

  // 1. Jouer immédiatement le son du thème en cours d'édition dans l'application
  playAchievementSound({
    soundEnabled: theme.value.soundEnabled,
    soundVolume: theme.value.soundVolume,
    audioPath: theme.value.audioPath,
    audioDeviceId: theme.value.audioDeviceId
  })

  // 2. Diffuser le test avec le thème en cours d'édition pour aperçu temporaire sur Desktop et OBS
  try {
    if (window.steamAPI?.broadcastTestAchievement) {
      await window.steamAPI.broadcastTestAchievement({
        ...testData,
        previewTheme: {
          id: theme.value.id,
          name: theme.value.name,
          html: theme.value.html,
          css: theme.value.css,
          audioPath: theme.value.audioPath,
          soundEnabled: theme.value.soundEnabled,
          soundVolume: theme.value.soundVolume
        }
      })
      showStatus('Notification de test diffusée avec ce thème 🚀')
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

/* Barre de navigation supérieure */
.editor-top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-back-library {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c5d4e8;
  padding: 0.5rem 0.95rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-back-library:hover {
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  transform: translateX(-2px);
}

.back-icon {
  width: 16px;
  height: 16px;
}

.editor-header-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-badge-active {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(161, 205, 68, 0.15);
  border: 1px solid rgba(161, 205, 68, 0.5);
  color: #a1cd44;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.status-badge-inactive {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #9cb0c9;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9cb0c9;
}

.status-badge-active .badge-dot {
  background: #a1cd44;
  box-shadow: 0 0 8px #a1cd44;
}

.btn-activate-now {
  background: linear-gradient(135deg, rgba(161, 205, 68, 0.25) 0%, rgba(121, 165, 38, 0.25) 100%);
  border: 1px solid rgba(161, 205, 68, 0.6);
  color: #a1cd44;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-activate-now:hover {
  background: #a1cd44;
  color: #0b0e14;
  box-shadow: 0 0 12px rgba(161, 205, 68, 0.4);
}

/* En-tête principal */
.customization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.editor-icon-glow {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(240, 195, 48, 0.12);
  border: 1px solid rgba(240, 195, 48, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0c330;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.2);
  flex-shrink: 0;
}

.wand-icon {
  width: 24px;
  height: 24px;
}

.theme-title-editor-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.theme-name-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #66c0f4;
  letter-spacing: 0.05em;
}

.theme-name-input-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.theme-name-input {
  background: rgba(14, 20, 29, 0.85);
  border: 1px solid rgba(102, 192, 244, 0.35);
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 700;
  outline: none;
  width: 100%;
  max-width: 360px;
  transition: var(--transition-smooth);
}

.theme-name-input:focus {
  border-color: #66c0f4;
  box-shadow: 0 0 12px rgba(102, 192, 244, 0.35);
  background: rgba(14, 20, 29, 1);
}

.theme-id-chip {
  font-family: monospace;
  font-size: 0.72rem;
  color: #72849c;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
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
  white-space: nowrap;
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
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.15rem;
}

.audio-sub {
  font-size: 0.75rem;
  color: var(--steam-text-muted);
}

.audio-file-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-select-file {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-select-file:hover {
  background: rgba(102, 192, 244, 0.3);
  color: #fff;
}

.btn-clear-audio {
  background: rgba(235, 87, 87, 0.15);
  border: 1px solid rgba(235, 87, 87, 0.35);
  color: #ff8080;
  font-size: 0.8rem;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
}

.audio-file-path-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.path-label {
  color: var(--steam-text-muted);
  font-weight: 600;
}

.path-text {
  color: #a1cd44;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #c5d4e8;
}

.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  display: none;
}

.slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  transition: 0.3s;
}

.slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .slider {
  background-color: #a1cd44;
}

input:checked + .slider::before {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 0.82rem;
  color: #fff;
  font-weight: 600;
}

.volume-slider-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.range-slider {
  flex: 1;
  accent-color: #f0c330;
  cursor: pointer;
}

.btn-play-test-sound {
  background: rgba(240, 195, 48, 0.15);
  border: 1px solid rgba(240, 195, 48, 0.4);
  color: #f0c330;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: var(--transition-smooth);
}

.btn-play-test-sound:hover:not(:disabled) {
  background: #f0c330;
  color: #0b0e14;
}

.btn-play-test-sound:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Sélecteur de sortie audio */
.device-selector-card {
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.device-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-refresh-devices {
  background: none;
  border: none;
  color: #66c0f4;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.btn-refresh-devices:hover {
  background: rgba(102, 192, 244, 0.15);
}

.device-select {
  width: 100%;
  background: rgba(14, 20, 29, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  padding: 0.5rem 0.75rem;
  font-size: 0.82rem;
  outline: none;
  cursor: pointer;
}

.device-select:focus {
  border-color: #66c0f4;
}

.device-hint {
  font-size: 0.72rem;
  color: var(--steam-text-muted);
  margin-top: 0.25rem;
}

.obs-sound-tips-card {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.85rem 1rem;
}

.tips-header {
  font-size: 0.78rem;
  font-weight: 700;
  color: #66c0f4;
  margin-bottom: 0.35rem;
}

.tips-list {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.74rem;
  color: #a4b4cc;
  line-height: 1.45;
}

.tips-list code {
  color: #f0c330;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
}

/* Onglet Aperçu en direct */
.preview-stage-container {
  background: #090d13;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  min-height: 280px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.6);
}

.preview-backdrop {
  width: 100%;
  height: 280px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: 
    linear-gradient(45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.02) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.02) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.preview-watermark {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.preview-slot {
  width: 100%;
  height: 100%;
  position: relative;
  pointer-events: none;
}
</style>
