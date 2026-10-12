<template>
  <div class="customization-card">
    <!-- Barre supérieure de navigation dans l'éditeur -->
    <div class="editor-top-nav">
      <button class="btn-back-library" title="Revenir à la liste des thèmes" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="back-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Retour</span>
      </button>

      <div class="editor-header-badges">
        <span v-if="isActiveTheme" class="status-badge-active">
          <span class="badge-dot pulse"></span>
          Thème actif
        </span>
        <span v-else class="status-badge-inactive">
          <span class="badge-dot"></span>
          Édition
        </span>

        <button
          v-if="!isActiveTheme"
          class="btn-activate-now"
          title="Définir immédiatement comme thème actif pour les overlays"
          @click="activateCurrentTheme"
        >
          Activer
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
          <label class="theme-name-label">Nom</label>
          <div class="theme-name-input-row">
            <input
              v-model="theme.name"
              type="text"
              class="theme-name-input"
              placeholder="Nom du thème..."
              maxlength="45"
              @blur="autoSaveThemeName"
            />
            <span class="theme-id-chip">{{ theme.id }}</span>
          </div>
        </div>
      </div>

      <!-- Boutons de test : simulation pour chaque Tier -->
      <div class="header-actions">
        <div class="tier-test-btn-group">
          <button
            class="btn-tier-test common"
            :disabled="isTesting"
            title="Tester le rendu d'un succès standard (> 10%)"
            @click="triggerTierTest('common')"
          >
            <span>🏅 Standard</span>
          </button>
          <button
            class="btn-tier-test rare"
            :disabled="isTesting"
            title="Tester le rendu d'un succès rare (< 10%)"
            @click="triggerTierTest('rare')"
          >
            <span>★ Rare</span>
          </button>
          <button
            class="btn-tier-test master"
            :disabled="isTesting"
            title="Tester le rendu du 100% Jeu Complété (Platine)"
            @click="triggerTierTest('master')"
          >
            <span>🏆 Platine 100%</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Barre d'onglets pour basculer entre Effets, HTML, CSS, Audio et Aperçu -->
    <div class="editor-tabs-bar">
      <div class="tabs-group">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'effects' }"
          @click="activeTab = 'effects'"
        >
          <span>✨ Effets & Tiers</span>
          <span v-if="theme.visualEffect && theme.visualEffect !== 'none'" class="tab-badge fx-active">Actif</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'html' }"
          @click="activeTab = 'html'"
        >
          <span>HTML</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'css' }"
          @click="activeTab = 'css'"
        >
          <span>CSS</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'audio' }"
          @click="activeTab = 'audio'"
        >
          <span>Audio</span>
          <span v-if="theme.audioPath" class="tab-badge audio-active">Perso</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'preview' }"
          @click="activeTab = 'preview'"
        >
          <span>Aperçu</span>
        </button>
      </div>

      <div class="theme-actions-inline">
        <span v-if="saveMessage" class="save-status-pill">{{ saveMessage }}</span>
        <button class="btn-export-theme" title="Télécharger ce thème en fichier .json" @click="exportCurrentTheme">
          💾 Exporter
        </button>
        <button class="btn-reset" title="Restaurer le template d'origine" @click="resetToDefault">
          Réinitialiser
        </button>
        <button class="btn-save" :disabled="isSaving" @click="saveCustomization">
          {{ isSaving ? 'Enregistrement...' : 'Sauvegarder' }}
        </button>
      </div>
    </div>

    <!-- 0. Onglet Effets Visuels & Tiers (Scintillements, Particules et Rareté) -->
    <div v-show="activeTab === 'effects'" class="tab-pane">
      <div class="effects-config-card">
        <!-- Section A : Effets Visuels Pré-faits -->
        <div class="effects-section">
          <div class="section-title-row">
            <div>
              <h3 class="section-title">Effet de Scintillement & Bordure</h3>
              <p class="section-desc">Choisissez une animation visuelle pré-faite appliquée automatiquement autour de la carte et du cadre du succès.</p>
            </div>
            <span class="active-effect-pill">
              Effet sélectionné : <strong>{{ currentEffectName }}</strong>
            </span>
          </div>

          <div class="fx-options-grid">
            <div
              v-for="fx in visualEffectsList"
              :key="fx.id"
              class="fx-option-card"
              :class="{ active: (theme.visualEffect || 'none') === fx.id }"
              @click="selectVisualEffect(fx.id)"
            >
              <div class="fx-option-icon">{{ fx.icon }}</div>
              <div class="fx-option-info">
                <div class="fx-option-header">
                  <h4 class="fx-option-name">{{ fx.name }}</h4>
                  <span v-if="(theme.visualEffect || 'none') === fx.id" class="fx-check-dot">✓</span>
                </div>
                <p class="fx-option-desc">{{ fx.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Section B : Système de Rareté des Succès Steam (Tiers) -->
        <div class="tiers-section">
          <div class="section-title-row">
            <div>
              <h3 class="section-title">Niveaux de Succès Steam (Tiers)</h3>
              <p class="section-desc">Steam différencie les succès ordinaires, les succès rares (&lt; 10%) et le grand final à 100%. Testez chaque alerte en un clic :</p>
            </div>
          </div>

          <div class="tiers-cards-grid">
            <!-- 1. Tier Standard -->
            <div class="tier-card tier-card-common">
              <div class="tier-card-header">
                <span class="tier-icon">🏅</span>
                <div>
                  <h4 class="tier-title">Succès Standard (&gt; 10%)</h4>
                  <span class="tier-badge-pill common">SUCCÈS DÉBLOQUÉ</span>
                </div>
              </div>
              <p class="tier-desc">Succès commun débloqué par la majorité des joueurs. Style et teinte dorée classique Steam.</p>
              <button class="btn-tier-action common" :disabled="isTesting" @click="triggerTierTest('common')">
                ▶ Tester l'alerte Standard
              </button>
            </div>

            <!-- 2. Tier Rare -->
            <div class="tier-card tier-card-rare">
              <div class="tier-card-header">
                <span class="tier-icon">★</span>
                <div>
                  <h4 class="tier-title">Succès Rare (&lt; 10%)</h4>
                  <span class="tier-badge-pill rare">★ SUCCÈS RARE (&lt; 10%)</span>
                </div>
              </div>
              <p class="tier-desc">Débloqué par moins de 10% des joueurs mondiaux. Bordure et lueur améthyste avec arpège mystique.</p>
              <button class="btn-tier-action rare" :disabled="isTesting" @click="triggerTierTest('rare')">
                ▶ Tester l'alerte Rare
              </button>
            </div>

            <!-- 3. Tier Platine 100% -->
            <div class="tier-card tier-card-master">
              <div class="tier-card-header">
                <span class="tier-icon">🏆</span>
                <div>
                  <h4 class="tier-title">Jeu Complété (100% Platine)</h4>
                  <span class="tier-badge-pill master">🏆 JEU COMPLÉTÉ (100%)</span>
                </div>
              </div>
              <p class="tier-desc">Dernier succès validant 100% du jeu. Halo azur platine étincelant avec fanfare de victoire triomphante.</p>
              <button class="btn-tier-action master" :disabled="isTesting" @click="triggerTierTest('master')">
                ▶ Tester l'alerte 100% Platine
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 1. Onglet HTML -->
    <div v-show="activeTab === 'html'" class="tab-pane">
      <div class="placeholders-bar">
        <span class="pl-label">Placeholders :</span>
        <div class="pl-buttons">
          <button
            class="btn-pl"
            title="Titre du succès"
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
            title="URL de l'icône"
            @click="insertPlaceholder('{icon}')"
          >
            + {icon}
          </button>
          <button
            class="btn-pl"
            title="Nom du jeu"
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
        <span>💡 Utilisez les classes <code>.animate-enter</code> et <code>.animate-leave</code> pour vos animations (durée standard : 5s).</span>
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
              <h4>Son de notification</h4>
              <p class="audio-sub">
                {{ theme.audioPath ? 'Fichier personnalisé' : 'Son standard par défaut' }}
              </p>
            </div>
          </div>

          <div class="audio-file-actions">
            <button class="btn-select-file" @click="browseAudioFile">
              📁 Choisir un fichier
            </button>
            <button
              v-if="theme.audioPath"
              class="btn-clear-audio"
              title="Revenir au son standard"
              @click="removeAudioFile"
            >
              ✕ Retirer
            </button>
          </div>
        </div>

        <div v-if="theme.audioPath" class="audio-file-path-row">
          <span class="path-label">Fichier :</span>
          <code class="path-text" :title="theme.audioPath">{{ theme.audioPath }}</code>
        </div>

        <!-- Paramètres de lecture et volume -->
        <div class="audio-settings-grid">
          <div class="setting-item">
            <label class="setting-label">Lecture audio :</label>
            <label class="toggle-switch">
              <input v-model="theme.soundEnabled" type="checkbox" />
              <span class="slider"></span>
              <span class="toggle-text">{{ theme.soundEnabled ? 'Activé' : 'Muet' }}</span>
            </label>
          </div>

          <div class="setting-item">
            <label class="setting-label">Volume ({{ Math.round(theme.soundVolume * 100) }}%) :</label>
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
                {{ isPlayingSound ? '🔊 Test...' : '▶ Tester' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Sélecteur de sortie audio -->
        <div class="device-selector-card">
          <div class="setting-item">
            <div class="device-label-row">
              <label class="setting-label">Sortie audio de l'application :</label>
              <button class="btn-refresh-devices" title="Actualiser les périphériques" @click="refreshAudioDevices">
                🔄 Actualiser
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
              Sélectionnez le canal de sortie audio souhaité (casque, Wave Link SFX, etc.).
            </p>
          </div>
        </div>

        <!-- Astuce discrète OBS Studio -->
        <div class="obs-sound-tips-card">
          <p class="tips-note">
            💡 <strong>OBS Studio</strong> : Si vous activez <em>"Contrôler l'audio via OBS"</em> dans votre source navigateur, réglez-la sur <strong>"Surveillance et sortie"</strong> dans le Mélangeur Audio pour l'entendre dans votre casque.
          </p>
        </div>
      </div>
    </div>

    <!-- 4. Onglet Aperçu en direct -->
    <div v-show="activeTab === 'preview'" class="tab-pane">
      <div class="preview-stage-container">
        <!-- Barre de sélection du tier pour l'aperçu -->
        <div class="preview-tier-controls">
          <span class="preview-tier-label">Rendu simulé selon le Tier Steam :</span>
          <div class="tier-pill-selector">
            <button
              class="tier-pill-btn"
              :class="{ active: selectedPreviewTier === 'common' }"
              @click="selectedPreviewTier = 'common'"
            >
              🏅 Standard (> 10%)
            </button>
            <button
              class="tier-pill-btn rare"
              :class="{ active: selectedPreviewTier === 'rare' }"
              @click="selectedPreviewTier = 'rare'"
            >
              ★ Rare (< 10%)
            </button>
            <button
              class="tier-pill-btn master"
              :class="{ active: selectedPreviewTier === 'master' }"
              @click="selectedPreviewTier = 'master'"
            >
              🏆 Platine 100%
            </button>
          </div>
        </div>

        <!-- Style universel des effets et tiers + style du thème injecté -->
        <component :is="'style'">
          {{ visualEffectsCss }}
          {{ theme.css || '' }}
        </component>

        <div class="preview-backdrop">
          <div class="preview-watermark">Aperçu en direct ({{ selectedPreviewTierName }})</div>
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
import { VISUAL_EFFECTS, ACHIEVEMENT_TIERS, getVisualEffectsCss, enrichAchievementHtml } from '../utils/visualEffects.js'
import { themeStorage } from '../services/themeStorage.js'

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

const visualEffectsList = VISUAL_EFFECTS
const visualEffectsCss = getVisualEffectsCss()
const selectedPreviewTier = ref('common')

const activeTab = ref('effects')
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
  visualEffect: 'none',
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

const currentEffectName = computed(() => {
  const found = visualEffectsList.find((e) => e.id === (theme.value.visualEffect || 'none'))
  return found ? found.name : 'Aucun'
})

const selectedPreviewTierName = computed(() => {
  return selectedPreviewTier.value === 'master'
    ? '100% Platine'
    : (selectedPreviewTier.value === 'rare' ? 'Succès Rare < 10%' : 'Succès Standard')
})

function selectVisualEffect(fxId) {
  theme.value.visualEffect = fxId
  saveCustomization()
  showStatus(`Effet appliqué : ${currentEffectName.value} ✔`)
}

// Synchronise le thème édité dès que targetTheme change
watch(
  () => props.targetTheme,
  (newTheme) => {
    if (newTheme) {
      theme.value = {
        ...DEFAULT_THEME,
        ...JSON.parse(JSON.stringify(newTheme)),
        visualEffect: newTheme.visualEffect || 'none',
        audioDeviceId: newTheme.audioDeviceId || 'default'
      }
    }
  },
  { immediate: true, deep: true }
)

// Calcul du HTML d'aperçu en direct avec effet visuel et tier
const previewHtml = computed(() => {
  if (!theme.value.html) return '<div style="color: #8b9bb4; padding: 20px;">Aucun HTML défini.</div>'
  const tierMeta = ACHIEVEMENT_TIERS[selectedPreviewTier.value] || ACHIEVEMENT_TIERS.common

  let html = theme.value.html
    .replace(/\{title\}/gi, tierMeta.defaultTitle)
    .replace(/\{description\}/gi, tierMeta.defaultDesc)
    .replace(/\{icon\}/gi, tierMeta.icon)
    .replace(/\{game\}/gi, tierMeta.defaultGame)
    .replace(/\{tier\}/gi, selectedPreviewTier.value)
    .replace(/\{tierLabel\}/gi, tierMeta.defaultBadge)
    .replace(/\{rarity\}/gi, tierMeta.defaultPercent + '%')

  if (selectedPreviewTier.value !== 'common') {
    html = html.replace(/SUCCÈS DÉBLOQUÉ/g, tierMeta.defaultBadge)
  }

  return enrichAchievementHtml(html, {
    tier: selectedPreviewTier.value,
    visualEffect: theme.value.visualEffect || 'none'
  })
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
          visualEffect: active.visualEffect || 'none',
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
  const outputs = await getAudioOutputDevices(true)
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

// Déclenche une simulation de succès selon le tier spécifié ('common', 'rare', 'master')
async function triggerTierTest(tier = 'common') {
  if (isTesting.value) return
  isTesting.value = true

  const tierMeta = ACHIEVEMENT_TIERS[tier] || ACHIEVEMENT_TIERS.common

  // 1. Jouer immédiatement le son avec la tonalité / carillon du Tier dans l'app
  playAchievementSound({
    soundEnabled: theme.value.soundEnabled,
    soundVolume: theme.value.soundVolume,
    audioPath: theme.value.audioPath,
    audioDeviceId: theme.value.audioDeviceId
  }, tier)

  // 2. Diffuser le test avec le thème en cours d'édition et les métadonnées du Tier
  try {
    if (window.steamAPI?.broadcastTestAchievement) {
      await window.steamAPI.broadcastTestAchievement({
        displayName: tierMeta.defaultTitle,
        description: tierMeta.defaultDesc,
        gameName: tierMeta.defaultGame,
        icon: tierMeta.icon,
        tier: tier,
        rarityPercent: tierMeta.defaultPercent,
        previewTheme: {
          id: theme.value.id,
          name: theme.value.name,
          html: theme.value.html,
          css: theme.value.css,
          visualEffect: theme.value.visualEffect || 'none',
          audioPath: theme.value.audioPath,
          soundEnabled: theme.value.soundEnabled,
          soundVolume: theme.value.soundVolume
        }
      })
      showStatus(`Alerte test (${tierMeta.name}) diffusée 🚀`)
    }
  } catch (err) {
    console.error('[CustomizationEditor] Erreur test notification:', err)
  } finally {
    setTimeout(() => {
      isTesting.value = false
    }, 1500)
  }
}

async function triggerTestNotification() {
  await triggerTierTest('common')
}

// Exporte ce thème en fichier JSON téléchargeable
async function exportCurrentTheme() {
  if (!theme.value.id) return
  try {
    const res = await themeStorage.exportTheme(theme.value.id)
    if (res.success) {
      showStatus(`Thème exporté dans ${res.fileName} 💾`)
    } else {
      showStatus(res.error || 'Erreur lors de l\'export ✖')
    }
  } catch (err) {
    showStatus('Erreur export: ' + err.message)
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
  padding: 0.65rem 0.85rem;
}

.tips-note {
  margin: 0;
  font-size: 0.74rem;
  color: #a4b4cc;
  line-height: 1.45;
}

.tips-note code {
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

/* Boutons de test de simulation par Tier */
.tier-test-btn-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-tier-test {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  user-select: none;
}

.btn-tier-test.common {
  background: rgba(240, 195, 48, 0.12);
  border-color: rgba(240, 195, 48, 0.35);
  color: #ffd644;
}

.btn-tier-test.common:hover:not(:disabled) {
  background: rgba(240, 195, 48, 0.25);
  border-color: rgba(240, 195, 48, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(240, 195, 48, 0.2);
}

.btn-tier-test.rare {
  background: rgba(168, 85, 247, 0.15);
  border-color: rgba(168, 85, 247, 0.4);
  color: #c084fc;
}

.btn-tier-test.rare:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.28);
  border-color: rgba(168, 85, 247, 0.7);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.25);
}

.btn-tier-test.master {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
  color: #7dd3fc;
}

.btn-tier-test.master:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.28);
  border-color: rgba(56, 189, 248, 0.7);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
}

.btn-tier-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Badge dans l'onglet */
.tab-badge.fx-active {
  background: #f0c330;
  color: #0d121a;
  font-weight: 800;
}

/* Bouton export thème */
.btn-export-theme {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #c5d4e8;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-export-theme:hover {
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.45);
  color: #66c0f4;
  transform: translateY(-1px);
}

/* Onglet Effets & Tiers */
.effects-config-card {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.effects-section,
.tiers-section {
  background: rgba(12, 18, 26, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.section-title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
  color: #ffffff;
}

.section-desc {
  margin: 0.25rem 0 0 0;
  font-size: 0.78rem;
  color: #8b9bb4;
  line-height: 1.4;
}

.active-effect-pill {
  font-size: 0.75rem;
  background: rgba(240, 195, 48, 0.12);
  border: 1px solid rgba(240, 195, 48, 0.35);
  color: #f0c330;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  white-space: nowrap;
}

/* Grille des effets */
.fx-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.85rem;
}

.fx-option-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.fx-option-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.fx-option-card.active {
  background: rgba(240, 195, 48, 0.1);
  border-color: #f0c330;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.2);
}

.fx-option-icon {
  font-size: 1.6rem;
  line-height: 1;
  flex-shrink: 0;
}

.fx-option-info {
  flex: 1;
  min-width: 0;
}

.fx-option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.fx-option-name {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 700;
  color: #e5effa;
}

.fx-check-dot {
  color: #f0c330;
  font-size: 0.85rem;
  font-weight: 900;
}

.fx-option-desc {
  margin: 0.2rem 0 0 0;
  font-size: 0.72rem;
  color: #8b9bb4;
  line-height: 1.35;
}

/* Grille des Tiers */
.tiers-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.tier-card {
  border-radius: 10px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.tier-card-common {
  border-color: rgba(240, 195, 48, 0.3);
  background: linear-gradient(180deg, rgba(240, 195, 48, 0.04) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.tier-card-rare {
  border-color: rgba(168, 85, 247, 0.35);
  background: linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.tier-card-master {
  border-color: rgba(56, 189, 248, 0.35);
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.tier-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tier-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.tier-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: #fff;
}

.tier-badge-pill {
  display: inline-block;
  margin-top: 0.2rem;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.tier-badge-pill.common {
  background: rgba(240, 195, 48, 0.15);
  color: #f0c330;
  border: 1px solid rgba(240, 195, 48, 0.4);
}

.tier-badge-pill.rare {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.5);
}

.tier-badge-pill.master {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.5);
}

.tier-desc {
  margin: 0;
  font-size: 0.74rem;
  color: #9ab0c9;
  line-height: 1.4;
  flex: 1;
}

.btn-tier-action {
  width: 100%;
  padding: 0.55rem;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-tier-action.common {
  background: rgba(240, 195, 48, 0.15);
  border-color: rgba(240, 195, 48, 0.4);
  color: #ffd644;
}

.btn-tier-action.common:hover:not(:disabled) {
  background: rgba(240, 195, 48, 0.3);
  box-shadow: 0 0 12px rgba(240, 195, 48, 0.25);
}

.btn-tier-action.rare {
  background: rgba(168, 85, 247, 0.18);
  border-color: rgba(168, 85, 247, 0.45);
  color: #d8b4fe;
}

.btn-tier-action.rare:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.35);
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
}

.btn-tier-action.master {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.45);
  color: #7dd3fc;
}

.btn-tier-action.master:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

/* Contrôles de simulation dans l'onglet Aperçu */
.preview-tier-controls {
  padding: 0.85rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.preview-tier-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #9cb3ce;
}

.tier-pill-selector {
  display: flex;
  gap: 0.4rem;
}

.tier-pill-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #a4b4cc;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tier-pill-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.tier-pill-btn.active {
  background: rgba(240, 195, 48, 0.2);
  border-color: #f0c330;
  color: #f0c330;
}

.tier-pill-btn.rare.active {
  background: rgba(168, 85, 247, 0.25);
  border-color: #a855f7;
  color: #c084fc;
}

.tier-pill-btn.master.active {
  background: rgba(56, 189, 248, 0.25);
  border-color: #38bdf8;
  color: #38bdf8;
}
</style>
