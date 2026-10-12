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

    <!-- 0. Onglet Effets Visuels & Tiers -->
    <div v-show="activeTab === 'effects'" class="tab-pane">
      <EditorEffectsTab
        :visual-effect="theme.visualEffect || 'none'"
        :current-effect-name="currentEffectName"
        :visual-effects-list="visualEffectsList"
        :is-testing="isTesting"
        @select-visual-effect="selectVisualEffect"
        @trigger-tier-test="triggerTierTest"
      />
    </div>

    <!-- 1. Onglet HTML -->
    <div v-show="activeTab === 'html'" class="tab-pane">
      <div class="editor-pane-layout">
        <div class="editor-column">
          <div class="code-editor-header">
            <span class="editor-label">Structure HTML du Succès</span>
            <span class="editor-hint">Utilisez des balises HTML valides et stylisez-les via l'onglet CSS</span>
          </div>
          <textarea
            ref="htmlTextarea"
            v-model="theme.html"
            class="code-textarea html-mode"
            spellcheck="false"
            placeholder="<div>...</div>"
          ></textarea>
        </div>

        <div class="help-sidebar">
          <h4>Balises Disponibles</h4>
          <p class="help-sub">Ces variables seront automatiquement remplacées lors d'un déblocage de succès :</p>

          <div class="placeholders-list">
            <button
              class="placeholder-chip"
              title="Cliquer pour insérer {title}"
              @click="insertPlaceholder('{title}')"
            >
              <code>{title}</code>
              <span>Titre officiel du succès</span>
            </button>
            <button
              class="placeholder-chip"
              title="Cliquer pour insérer {description}"
              @click="insertPlaceholder('{description}')"
            >
              <code>{description}</code>
              <span>Description / objectif</span>
            </button>
            <button
              class="placeholder-chip"
              title="Cliquer pour insérer {icon}"
              @click="insertPlaceholder('{icon}')"
            >
              <code>{icon}</code>
              <span>URL de l'image (icône 64x64)</span>
            </button>
            <button
              class="placeholder-chip"
              title="Cliquer pour insérer {game}"
              @click="insertPlaceholder('{game}')"
            >
              <code>{game}</code>
              <span>Nom du jeu Steam</span>
            </button>
            <button
              class="placeholder-chip"
              title="Cliquer pour insérer {tier}"
              @click="insertPlaceholder('{tier}')"
            >
              <code>{tier}</code>
              <span>common, rare ou master</span>
            </button>
            <button
              class="placeholder-chip"
              title="Cliquer pour insérer {tierLabel}"
              @click="insertPlaceholder('{tierLabel}')"
            >
              <code>{tierLabel}</code>
              <span>Badge texte (ex: SUCCÈS RARE)</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Onglet CSS -->
    <div v-show="activeTab === 'css'" class="tab-pane">
      <div class="editor-column">
        <div class="code-editor-header">
          <span class="editor-label">Styles CSS du Thème</span>
          <span class="editor-hint">Vous pouvez utiliser des animations CSS (@keyframes), du flexbox, et des filtres graphiques</span>
        </div>
        <textarea
          v-model="theme.css"
          class="code-textarea css-mode"
          spellcheck="false"
          placeholder=".achievement-card { ... }"
        ></textarea>
      </div>
    </div>

    <!-- 3. Onglet Audio -->
    <div v-show="activeTab === 'audio'" class="tab-pane">
      <EditorAudioTab
        v-model:sound-enabled="theme.soundEnabled"
        v-model:sound-volume="theme.soundVolume"
        v-model:audio-device-id="theme.audioDeviceId"
        :audio-path="theme.audioPath"
        :audio-devices="audioDevices"
        :is-playing-sound="isPlayingSound"
        @browse-audio-file="browseAudioFile"
        @remove-audio-file="removeAudioFile"
        @play-test-sound="playTestSound"
        @refresh-audio-devices="refreshAudioDevices"
      />
    </div>

    <!-- 4. Onglet Aperçu en direct -->
    <div v-show="activeTab === 'preview'" class="tab-pane">
      <EditorPreviewTab
        v-model:selected-preview-tier="selectedPreviewTier"
        :selected-preview-tier-name="selectedPreviewTierName"
        :visual-effects-css="visualEffectsCss"
        :theme-css="theme.css || ''"
        :preview-html="previewHtml"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import EditorEffectsTab from './editor/EditorEffectsTab.vue'
import EditorAudioTab from './editor/EditorAudioTab.vue'
import EditorPreviewTab from './editor/EditorPreviewTab.vue'
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
  await refreshAudioDevices()

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

async function refreshAudioDevices() {
  const outputs = await getAudioOutputDevices(true)
  if (outputs.length > 0) {
    audioDevices.value = outputs
  }
}

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

async function browseAudioFile() {
  if (!window.steamAPI?.selectAudioFile) return
  try {
    const res = await window.steamAPI.selectAudioFile()
    if (res.success && res.filePath) {
      theme.value.audioPath = res.filePath
      showStatus('Fichier audio sélectionné ✔')
      await saveCustomization()
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

async function resetToDefault() {
  if (!confirm('Voulez-vous vraiment restaurer le template et le style par défaut pour ce thème ?')) return

  theme.value.html = DEFAULT_THEME.html
  theme.value.css = DEFAULT_THEME.css
  theme.value.audioPath = null
  await saveCustomization()
  showStatus('Structure par défaut restaurée ✔')
}

async function triggerTierTest(tier = 'common') {
  if (isTesting.value) return
  isTesting.value = true

  const tierMeta = ACHIEVEMENT_TIERS[tier] || ACHIEVEMENT_TIERS.common

  playAchievementSound({
    soundEnabled: theme.value.soundEnabled,
    soundVolume: theme.value.soundVolume,
    audioPath: theme.value.audioPath,
    audioDeviceId: theme.value.audioDeviceId
  }, tier)

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

.customization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.editor-icon-glow {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(240, 195, 48, 0.2) 0%, rgba(216, 158, 27, 0.1) 100%);
  border: 1px solid rgba(240, 195, 48, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0c330;
  box-shadow: 0 0 20px rgba(240, 195, 48, 0.25);
  flex-shrink: 0;
}

.wand-icon {
  width: 24px;
  height: 24px;
}

.theme-title-editor-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.theme-name-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #9cb0c9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.theme-name-input-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.theme-name-input {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
  width: 260px;
  transition: var(--transition-smooth);
}

.theme-name-input:focus {
  outline: none;
  border-color: #f0c330;
  box-shadow: 0 0 12px rgba(240, 195, 48, 0.25);
}

.theme-id-chip {
  font-family: monospace;
  font-size: 0.72rem;
  color: #7d8ea6;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
}

.tier-test-btn-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.btn-tier-test {
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-tier-test.common {
  background: rgba(240, 195, 48, 0.15);
  border-color: rgba(240, 195, 48, 0.4);
  color: #ffd644;
}

.btn-tier-test.common:hover:not(:disabled) {
  background: rgba(240, 195, 48, 0.28);
}

.btn-tier-test.rare {
  background: rgba(168, 85, 247, 0.18);
  border-color: rgba(168, 85, 247, 0.45);
  color: #d8b4fe;
}

.btn-tier-test.rare:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.32);
}

.btn-tier-test.master {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.45);
  color: #7dd3fc;
}

.btn-tier-test.master:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.32);
}

.editor-tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.tabs-group {
  display: flex;
  gap: 0.35rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: none;
  border: none;
  color: #8b9bb4;
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: #f0c330;
  background: rgba(240, 195, 48, 0.12);
  font-weight: 700;
}

.tab-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  font-weight: 800;
}

.tab-badge.fx-active {
  background: rgba(240, 195, 48, 0.25);
  color: #ffd859;
}

.tab-badge.audio-active {
  background: rgba(168, 85, 247, 0.25);
  color: #c084fc;
}

.theme-actions-inline {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.save-status-pill {
  font-size: 0.78rem;
  color: #a1cd44;
  font-weight: 600;
}

.btn-export-theme,
.btn-reset {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c5d4e8;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-export-theme:hover {
  background: rgba(240, 195, 48, 0.12);
  color: #f0c330;
  border-color: rgba(240, 195, 48, 0.4);
}

.btn-reset:hover {
  background: rgba(235, 87, 87, 0.12);
  color: #ff8080;
  border-color: rgba(235, 87, 87, 0.35);
}

.btn-save {
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  color: #0b0e14;
  font-weight: 800;
  font-size: 0.82rem;
  padding: 0.5rem 1.15rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(240, 195, 48, 0.3);
  transition: var(--transition-smooth);
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffd859 0%, #e6a722 100%);
  transform: translateY(-1px);
}

.tab-pane {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.editor-pane-layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .editor-pane-layout {
    grid-template-columns: 1fr;
  }
}

.editor-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.code-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #e5effa;
}

.editor-hint {
  font-size: 0.72rem;
  color: #7d8ea6;
}

.code-textarea {
  background: rgba(10, 15, 22, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 1rem;
  color: #e0ecf8;
  font-family: monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  min-height: 380px;
  resize: vertical;
  outline: none;
}

.code-textarea:focus {
  border-color: #66c0f4;
  box-shadow: 0 0 14px rgba(102, 192, 244, 0.15);
}

.code-textarea.css-mode {
  min-height: 440px;
}

.help-sidebar {
  background: rgba(12, 18, 26, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
}

.help-sidebar h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.3rem 0;
}

.help-sub {
  font-size: 0.76rem;
  color: #8b9bb4;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.placeholders-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.placeholder-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.placeholder-chip:hover {
  background: rgba(102, 192, 244, 0.1);
  border-color: rgba(102, 192, 244, 0.35);
}

.placeholder-chip code {
  color: #66c0f4;
  font-size: 0.8rem;
  font-family: monospace;
  font-weight: 700;
}

.placeholder-chip span {
  font-size: 0.72rem;
  color: #8b9bb4;
}
</style>
