<template>
  <div class="quick-builder-wrapper">
    <!-- Barre supérieure de navigation -->
    <div class="builder-top-nav">
      <button class="btn-back-library" title="Revenir à la galerie de thèmes" @click="$emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="back-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Retour</span>
      </button>

      <div class="builder-header-title">
        <div class="builder-icon-glow">⚡</div>
        <div>
          <h3>Générateur Visuel de Thème</h3>
          <span class="builder-sub">Concevez votre overlay sans aucune ligne de code</span>
        </div>
      </div>

      <div class="builder-top-actions">
        <span v-if="saveMessage" class="save-status-toast">{{ saveMessage }}</span>
        <button
          class="btn-test-draft"
          :disabled="isTestingDraft"
          title="Diffuser immédiatement ce rendu sur l'écran et OBS sans sauvegarder"
          @click="testDraftLive"
        >
          <span v-if="isTestingDraft">⏳ Envoi...</span>
          <span v-else>🚀 Tester ce brouillon (Live)</span>
        </button>
        <button class="btn-save-theme" :disabled="isSaving" @click="saveQuickTheme">
          <span v-if="isSaving">⏳ Enregistrement...</span>
          <span v-else>💾 Enregistrer le Thème</span>
        </button>
      </div>
    </div>

    <!-- Conteneur principal 2 colonnes (Contrôles visuels vs Live Preview) -->
    <div class="builder-layout">
      <!-- Colonne 1 : Contrôles visuels -->
      <div class="controls-column">
        <!-- Section 1 : Informations générales -->
        <div class="builder-card">
          <h4 class="card-section-title">
            <span class="sec-icon">🏷️</span> Nom du Thème
          </h4>
          <input
            v-model="themeName"
            type="text"
            class="builder-input"
            placeholder="Ex : Mon Thème Cyber Gold"
            maxlength="45"
          />
        </div>

        <!-- Section 2 : Couleurs & Arrière-plan -->
        <div class="builder-card">
          <h4 class="card-section-title">
            <span class="sec-icon">🎨</span> Couleurs & Arrière-plan
          </h4>

          <!-- Présélections de dégradés -->
          <div class="form-group">
            <label class="form-label">Style de fond</label>
            <div class="gradient-presets-grid">
              <button
                v-for="preset in GRADIENT_PRESETS"
                :key="preset.id"
                class="gradient-preset-btn"
                :class="{ active: selectedPresetId === preset.id }"
                :style="{ background: preset.gradient }"
                :title="preset.name"
                @click="applyPreset(preset)"
              >
                <span class="preset-name">{{ preset.name }}</span>
                <span v-if="selectedPresetId === preset.id" class="check-mark">✓</span>
              </button>
            </div>
          </div>

          <!-- Couleur personnalisée libre -->
          <div class="form-row-2col">
            <div class="form-group">
              <label class="form-label">Couleur Principale</label>
              <div class="color-picker-row">
                <input
                  v-model="primaryColor"
                  type="color"
                  class="color-picker-input"
                  @change="selectedPresetId = 'custom'"
                />
                <input
                  v-model="primaryColor"
                  type="text"
                  class="color-hex-input"
                  placeholder="#1b2838"
                  @input="selectedPresetId = 'custom'"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Couleur Accent / Bordure</label>
              <div class="color-picker-row">
                <input
                  v-model="accentColor"
                  type="color"
                  class="color-picker-input"
                />
                <input
                  v-model="accentColor"
                  type="text"
                  class="color-hex-input"
                  placeholder="#66c0f4"
                />
              </div>
            </div>
          </div>

          <!-- Slider Opacité -->
          <div class="form-group">
            <div class="label-with-val">
              <label class="form-label">Opacité du fond</label>
              <span class="slider-val">{{ backgroundOpacity }}%</span>
            </div>
            <input
              v-model.number="backgroundOpacity"
              type="range"
              min="10"
              max="100"
              step="5"
              class="builder-slider"
            />
          </div>

          <!-- Sauvegarde et application de palettes -->
          <div class="saved-palettes-section">
            <div class="saved-palettes-header">
              <label class="form-label">Combos de couleurs sauvegardés</label>
              <button class="btn-save-combo" title="Sauvegarder ce combo de couleurs" @click="saveCurrentPalette">
                <span>💾 Sauvegarder ce combo</span>
              </button>
            </div>

            <div v-if="savedPalettes.length > 0" class="saved-palettes-chips">
              <div
                v-for="p in savedPalettes"
                :key="p.id"
                class="palette-chip"
                :title="`Appliquer ${p.name} (${p.primary} / ${p.accent})`"
                @click="applySavedPalette(p)"
              >
                <div class="palette-swatch">
                  <span class="swatch-half" :style="{ background: p.primary }"></span>
                  <span class="swatch-half" :style="{ background: p.accent }"></span>
                </div>
                <span class="chip-name">{{ p.name }}</span>
                <button
                  class="btn-delete-chip"
                  title="Supprimer ce combo"
                  @click.stop="removeSavedPalette(p.id)"
                >
                  ×
                </button>
              </div>
            </div>
            <span v-else class="empty-palettes-hint">Aucun combo sauvegardé. Cliquez sur "Sauvegarder ce combo" pour mémoriser vos couleurs favorites.</span>
          </div>
        </div>

        <!-- Section 3 : Animation d'apparition -->
        <div class="builder-card">
          <h4 class="card-section-title">
            <span class="sec-icon">🎬</span> Animation d'apparition
          </h4>
          <div class="form-group">
            <label class="form-label">Style de transition d'entrée</label>
            <select v-model="selectedAnimation" class="builder-select">
              <option value="slide-up">Slide Up (Glissement bas vers haut)</option>
              <option value="pop-in">Pop In (Rebond dynamique)</option>
              <option value="fade-in">Fade In (Fondu élégant)</option>
              <option value="glitch">Glitch (Cyber & Effet Numérique)</option>
            </select>
            <span class="field-hint">Injecte l'animation CSS au conteneur principal lors de l'apparition.</span>
          </div>
        </div>

        <!-- Section 4 : Typographie Google Fonts -->
        <div class="builder-card">
          <h4 class="card-section-title">
            <span class="sec-icon">🔤</span> Police d'écriture
          </h4>
          <div class="form-group">
            <label class="form-label">Typographie principale</label>
            <select v-model="selectedFont" class="builder-select" :style="{ fontFamily: selectedFont }">
              <option
                v-for="font in GOOGLE_FONTS"
                :key="font.family"
                :value="font.family"
                :style="{ fontFamily: font.family }"
              >
                {{ font.label }} (Exemple d'affichage)
              </option>
            </select>
            <span class="field-hint">Toutes les polices sont pré-chargées pour OBS et l'overlay de bureau.</span>
          </div>
        </div>

        <!-- Section 5 : Configuration des Raretés (Tiers) -->
        <div class="builder-card">
          <h4 class="card-section-title">
            <span class="sec-icon">🏆</span> Configuration des Raretés
          </h4>
          <p class="section-desc">Personnalisez les teintes associées aux différents paliers de succès :</p>

          <div class="rarity-tiers-grid">
            <!-- Standard -->
            <div class="tier-config-box common">
              <div class="tier-box-header">
                <span class="tier-pill common-pill">Standard</span>
                <span class="tier-stat">> 10%</span>
              </div>
              <div class="color-picker-row">
                <input v-model="commonColor" type="color" class="color-picker-input" />
                <span class="color-label">{{ commonColor }}</span>
              </div>
            </div>

            <!-- Rare -->
            <div class="tier-config-box rare">
              <div class="tier-box-header">
                <span class="tier-pill rare-pill">Rare</span>
                <span class="tier-stat">&lt; 10%</span>
              </div>
              <div class="color-picker-row">
                <input v-model="rareColor" type="color" class="color-picker-input" />
                <span class="color-label">{{ rareColor }}</span>
              </div>
            </div>

            <!-- Platine 100% -->
            <div class="tier-config-box master">
              <div class="tier-box-header">
                <span class="tier-pill master-pill">Platine 100%</span>
                <span class="tier-stat">Master</span>
              </div>
              <div class="color-picker-row">
                <input v-model="masterColor" type="color" class="color-picker-input" />
                <span class="color-label">{{ masterColor }}</span>
              </div>
              <div class="playtime-hint">
                <span>⏱️ Temps de jeu {playtime} inclus automatiquement</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 5 : Audio & Effet Visuel -->
        <div class="builder-card">
          <h4 class="card-section-title">
            <span class="sec-icon">🔔</span> Audio & Effets Visuels
          </h4>

          <div class="form-group">
            <label class="form-label">Effet d'animation visuel</label>
            <select v-model="selectedEffect" class="builder-select">
              <option v-for="fx in VISUAL_EFFECTS" :key="fx.id" :value="fx.id">
                {{ fx.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Sonnerie lors du déblocage</label>
            <div class="audio-toggle-row">
              <label class="radio-label">
                <input v-model="useCustomAudio" type="radio" :value="false" />
                <span>Garder le carillon de base Steam</span>
              </label>
              <label class="radio-label">
                <input v-model="useCustomAudio" type="radio" :value="true" />
                <span>Son personnalisé local</span>
              </label>
            </div>

            <div v-if="useCustomAudio" class="custom-audio-picker-row">
              <button class="btn-pick-audio" @click="handlePickAudio">
                <span>📁 Choisir un fichier (.mp3, .wav, .ogg)</span>
              </button>
              <span class="audio-path-display">{{ audioFileName || 'Aucun fichier sélectionné' }}</span>
              <button v-if="customAudioPath" class="btn-test-sound" @click="testAudioFile">
                ▶ Tester
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne 2 : Aperçu en Direct (Live Interactive Preview) -->
      <div class="preview-column">
        <div class="preview-sticky-card">
          <div class="preview-card-header">
            <div class="preview-header-left">
              <span class="preview-badge">Live Preview</span>
              <span class="preview-title">Aperçu en Temps Réel</span>
            </div>

            <!-- Onglets de simulation de rareté -->
            <div class="preview-tier-tabs">
              <button
                class="tier-tab-btn"
                :class="{ active: previewTier === 'common' }"
                @click="previewTier = 'common'"
              >
                Standard
              </button>
              <button
                class="tier-tab-btn"
                :class="{ active: previewTier === 'rare' }"
                @click="previewTier = 'rare'"
              >
                Rare (&lt;10%)
              </button>
              <button
                class="tier-tab-btn master"
                :class="{ active: previewTier === 'master' }"
                @click="previewTier = 'master'"
              >
                Platine 100% 🏆
              </button>
            </div>
          </div>

          <!-- Zone de prévisualisation du thème avec rendu réel -->
          <div class="preview-stage-container">
            <div class="preview-stage-bg">
              <!-- Injection dynamique du CSS généré pour l'aperçu -->
              <component :is="'style'">
                {{ generatedCssPreview }}
              </component>

              <!-- Rendu HTML brut généré pour le palier sélectionné avec animation rejouée -->
              <div :key="animKey" class="preview-render-wrapper" v-html="renderedHtmlPreview"></div>
            </div>
          </div>

          <!-- Informations & caractéristiques générées -->
          <div class="preview-meta-box">
            <div class="meta-row">
              <span class="meta-label">Animation :</span>
              <span class="meta-value">{{ animationLabel }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Police active :</span>
              <span class="meta-value" :style="{ fontFamily: selectedFont }">{{ selectedFont }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Effet global :</span>
              <span class="meta-value">{{ effectLabel }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Temps de jeu Master :</span>
              <span class="meta-value gold">Badge dynamique {playtime} prêt</span>
            </div>
          </div>

          <div class="preview-footer-action">
            <button class="btn-save-large" :disabled="isSaving" @click="saveQuickTheme">
              <span>💾 Enregistrer ce Thème</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { steamAPI } from '../../services/steamApi.js'
import { VISUAL_EFFECTS } from '../../utils/visualEffects.js'

const emit = defineEmits(['back', 'saved'])

const STORAGE_KEY_PALETTES = 'SAVED_PALETTES'

// Presets de dégradés élégants
const GRADIENT_PRESETS = [
  { id: 'steam-blue', name: 'Bleu Steam', gradient: 'linear-gradient(135deg, #1b2838 0%, #171a21 100%)', primary: '#1b2838', accent: '#66c0f4' },
  { id: 'gold-prestige', name: 'Or Prestige', gradient: 'linear-gradient(135deg, #2a1f07 0%, #141008 100%)', primary: '#2a1f07', accent: '#f0c330' },
  { id: 'cyber-neon', name: 'Cyber Néon', gradient: 'linear-gradient(135deg, #240b38 0%, #0d0e1c 100%)', primary: '#240b38', accent: '#00ffee' },
  { id: 'sunset-purple', name: 'Sunset Pourpre', gradient: 'linear-gradient(135deg, #381228 0%, #150a1d 100%)', primary: '#381228', accent: '#ec4899' },
  { id: 'royal-emerald', name: 'Émeraude Royale', gradient: 'linear-gradient(135deg, #092c1d 0%, #061510 100%)', primary: '#092c1d', accent: '#10b981' },
  { id: 'ruby-red', name: 'Rouge Rubis', gradient: 'linear-gradient(135deg, #330b0b 0%, #140505 100%)', primary: '#330b0b', accent: '#f43f5e' },
  { id: 'carbon-dark', name: 'Gris Carbone', gradient: 'linear-gradient(135deg, #18191c 0%, #0e0f11 100%)', primary: '#18191c', accent: '#94a3b8' }
]

// Polices Google Fonts pré-chargées
const GOOGLE_FONTS = [
  { family: 'Outfit', label: 'Outfit (Moderne & Arrondi)' },
  { family: 'Inter', label: 'Inter (Épuré & Précis)' },
  { family: 'Poppins', label: 'Poppins (Géométrique)' },
  { family: 'Cinzel', label: 'Cinzel (Épique & Médiéval)' },
  { family: 'Orbitron', label: 'Orbitron (Futuriste / Sci-Fi)' }
]

// --- États réactifs des contrôles visuels ---
const themeName = ref('Mon Thème Rapide')
const selectedPresetId = ref('steam-blue')
const primaryColor = ref('#1b2838')
const accentColor = ref('#66c0f4')
const backgroundOpacity = ref(85)
const selectedFont = ref('Outfit')
const selectedAnimation = ref('slide-up')

// Combos de couleurs sauvegardés dans LocalStorage
const savedPalettes = ref([])

function loadSavedPalettes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PALETTES)
    if (raw) {
      savedPalettes.value = JSON.parse(raw)
    } else {
      savedPalettes.value = [
        { id: 'p1', name: 'Néon Violet', primary: '#240b38', accent: '#00ffee', opacity: 85 },
        { id: 'p2', name: 'Ambre Chaud', primary: '#291807', accent: '#f59e0b', opacity: 90 }
      ]
    }
  } catch (err) {
    console.warn('[QuickThemeBuilder] Erreur lecture localStorage palettes:', err)
    savedPalettes.value = []
  }
}

function saveCurrentPalette() {
  const newPalette = {
    id: `palette-${Date.now()}`,
    name: `Combo ${savedPalettes.value.length + 1}`,
    primary: primaryColor.value,
    accent: accentColor.value,
    opacity: backgroundOpacity.value
  }
  savedPalettes.value.unshift(newPalette)
  try {
    localStorage.setItem(STORAGE_KEY_PALETTES, JSON.stringify(savedPalettes.value))
    saveMessage.value = 'Combo de couleurs sauvegardé !'
    setTimeout(() => {
      if (saveMessage.value.includes('Combo')) saveMessage.value = ''
    }, 2500)
  } catch (err) {
    console.error('[QuickThemeBuilder] Erreur écriture SAVED_PALETTES:', err)
  }
}

function applySavedPalette(p) {
  selectedPresetId.value = 'custom'
  primaryColor.value = p.primary
  accentColor.value = p.accent
  if (p.opacity) backgroundOpacity.value = p.opacity
}

function removeSavedPalette(id) {
  savedPalettes.value = savedPalettes.value.filter((p) => p.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY_PALETTES, JSON.stringify(savedPalettes.value))
  } catch (err) {
    console.error('[QuickThemeBuilder] Erreur suppression palette:', err)
  }
}

onMounted(() => {
  loadSavedPalettes()
})

// Configuration des Tiers
const commonColor = ref('#66c0f4')
const rareColor = ref('#c084fc')
const masterColor = ref('#ffd700')

// Audio & Effets
const selectedEffect = ref('none')
const useCustomAudio = ref(false)
const customAudioPath = ref(null)
const audioFileName = ref('')

// Aperçu en temps réel
const previewTier = ref('common') // 'common' | 'rare' | 'master'
const isSaving = ref(false)
const isTestingDraft = ref(false)
const saveMessage = ref('')
const animKey = ref(0)

// Déclenche l'animation dans le preview lors d'un changement
watch([selectedAnimation, previewTier], () => {
  animKey.value++
})

function applyPreset(preset) {
  selectedPresetId.value = preset.id
  primaryColor.value = preset.primary
  accentColor.value = preset.accent
}

const effectLabel = computed(() => {
  const fx = VISUAL_EFFECTS.find((e) => e.id === selectedEffect.value)
  return fx ? fx.name : 'Aucun'
})

const animationLabel = computed(() => {
  switch (selectedAnimation.value) {
    case 'slide-up': return 'Slide Up (Glissement)'
    case 'pop-in': return 'Pop In (Rebond)'
    case 'fade-in': return 'Fade In (Fondu)'
    case 'glitch': return 'Glitch (Cyber)'
    default: return 'Slide Up'
  }
})

// Conversion hex vers rgba pour l'opacité
function hexToRgba(hex, alphaPercent) {
  if (!hex || typeof hex !== 'string') return `rgba(27, 40, 56, ${alphaPercent / 100})`
  let c = hex.replace('#', '')
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('')
  }
  const num = parseInt(c, 16)
  if (isNaN(num)) return `rgba(27, 40, 56, ${alphaPercent / 100})`
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${(alphaPercent / 100).toFixed(2)})`
}

// Génération du fond CSS
const backgroundCssValue = computed(() => {
  const alpha = backgroundOpacity.value
  if (selectedPresetId.value !== 'custom') {
    const preset = GRADIENT_PRESETS.find((p) => p.id === selectedPresetId.value)
    if (preset) {
      return preset.gradient
    }
  }
  return hexToRgba(primaryColor.value, alpha)
})

// --- Génération dynamique du CSS complet ---
const generatedCss = computed(() => {
  const bg = backgroundCssValue.value
  const accent = accentColor.value
  const primary = primaryColor.value
  const font = selectedFont.value
  const cColor = commonColor.value
  const rColor = rareColor.value
  const mColor = masterColor.value

  return `/* Thème généré via le Générateur Visuel SteamOverlayStream */
:root, .quick-theme-container {
  --theme-accent: ${accent};
  --theme-primary: ${primary};
  --theme-bg: ${bg};
}

.quick-theme-container {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--theme-bg, ${bg});
  border: 2px solid var(--theme-accent, ${accent});
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65), 0 0 20px ${accent}33;
  font-family: '${font}', -apple-system, sans-serif;
  color: #ffffff;
  max-width: 440px;
  min-width: 320px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  will-change: transform, opacity;
}

.quick-theme-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: var(--theme-accent, ${accent});
  box-shadow: 0 0 10px ${accent};
}

.quick-theme-icon-wrap {
  width: 58px;
  height: 58px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  background: #000;
}

.quick-theme-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.quick-theme-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-theme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b9bb4;
}

.quick-theme-app {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.quick-theme-time {
  opacity: 0.8;
  font-size: 0.68rem;
  white-space: nowrap;
}

.quick-theme-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-theme-desc {
  font-size: 0.8rem;
  color: #c7d5e0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animations d'apparition dynamiques */
.quick-theme-container.anim-slide-up {
  animation: qtbSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes qtbSlideUp {
  0% { transform: translateY(40px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.quick-theme-container.anim-pop-in {
  animation: qtbPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes qtbPopIn {
  0% { transform: scale(0.65); opacity: 0; }
  70% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.quick-theme-container.anim-fade-in {
  animation: qtbFadeIn 0.35s ease-out forwards;
}
@keyframes qtbFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.quick-theme-container.anim-glitch {
  animation: qtbGlitch 0.4s steps(2, start) forwards;
}
@keyframes qtbGlitch {
  0% { transform: translate(-4px, 2px) skewX(2deg); opacity: 0; }
  25% { transform: translate(4px, -2px) skewX(-2deg); opacity: 0.85; }
  50% { transform: translate(-2px, -1px) skewX(1deg); opacity: 1; }
  75% { transform: translate(2px, 1px) skewX(-1deg); }
  100% { transform: translate(0, 0); opacity: 1; }
}

/* Tier Standard */
.quick-theme-container.common-tier {
  border-color: ${cColor}77;
}
.quick-theme-container.common-tier::before {
  background: ${cColor};
}
.quick-theme-container.common-tier .quick-theme-title {
  color: #ffffff;
}

/* Tier Rare */
.quick-theme-container.rare-tier {
  border-color: ${rColor}aa;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 25px ${rColor}44;
}
.quick-theme-container.rare-tier::before {
  background: ${rColor};
}
.quick-theme-container.rare-tier .quick-theme-title {
  color: ${rColor};
}
.quick-theme-badge {
  background: ${rColor}25;
  border: 1px solid ${rColor}66;
  color: ${rColor};
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 800;
}

/* Tier Master (Platine 100%) */
.quick-theme-container.master-tier {
  border-color: ${mColor}cc;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.8), 0 0 35px ${mColor}55;
}
.quick-theme-container.master-tier::before {
  background: ${mColor};
}
.quick-theme-container.master-tier .quick-theme-title {
  color: ${mColor};
  text-shadow: 0 0 10px ${mColor}44;
}
.quick-master-playtime {
  margin-top: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${mColor};
  background: ${mColor}18;
  border: 1px solid ${mColor}55;
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-block;
  align-self: flex-start;
}`
})

// CSS spécifique pour l'aperçu encapsulé
const generatedCssPreview = computed(() => {
  return generatedCss.value
})

// Templates HTML générés avec injection de la classe d'animation
const htmlTemplateCommon = computed(() => `<div class="quick-theme-container common-tier anim-${selectedAnimation.value}">
  <div class="quick-theme-icon-wrap">
    <img src="{icon}" alt="{title}" class="quick-theme-icon" />
  </div>
  <div class="quick-theme-content">
    <div class="quick-theme-header">
      <span class="quick-theme-app">{game}</span>
      <span class="quick-theme-time">{unlockedAt}</span>
    </div>
    <div class="quick-theme-title">{title}</div>
    <div class="quick-theme-desc">{description}</div>
  </div>
</div>`)

const htmlTemplateRare = computed(() => `<div class="quick-theme-container rare-tier anim-${selectedAnimation.value}">
  <div class="quick-theme-icon-wrap">
    <img src="{icon}" alt="{title}" class="quick-theme-icon" />
  </div>
  <div class="quick-theme-content">
    <div class="quick-theme-header">
      <span class="quick-theme-badge">★ RARE</span>
      <span class="quick-theme-app">{game}</span>
    </div>
    <div class="quick-theme-title">{title}</div>
    <div class="quick-theme-desc">{description}</div>
  </div>
</div>`)

const htmlTemplateMaster = computed(() => `<div class="quick-theme-container master-tier anim-${selectedAnimation.value}">
  <div class="quick-theme-icon-wrap">
    <img src="{icon}" alt="{title}" class="quick-theme-icon" />
  </div>
  <div class="quick-theme-content">
    <div class="quick-theme-header">
      <span class="quick-theme-badge">🏆 PLATINE 100%</span>
      <span class="quick-theme-app">{game}</span>
    </div>
    <div class="quick-theme-title">{title}</div>
    <div class="quick-theme-desc">{description}</div>
    <div class="quick-master-playtime">Complété à 100% en {playtime}</div>
  </div>
</div>`)

// Données fictives pour la prévisualisation en direct
const previewSamples = {
  common: {
    title: 'Premier Sang',
    description: 'Éliminez votre premier adversaire dans une partie multijoueur classée.',
    icon: 'https://community.cloudflare.steamstatic.com/public/images/apps/440/e0d16c52a0a2df3087db8c0dc1c05d0cbcc52d2a.jpg',
    game: 'Team Fortress 2',
    unlockedAt: 'À l\'instant',
    playtime: '12h'
  },
  rare: {
    title: 'Légende Incontestée',
    description: 'Terminez la campagne solo en difficulté Maître sans subir de défaite.',
    icon: 'https://community.cloudflare.steamstatic.com/public/images/apps/440/d772960f2bb97f58e17db194680877a111a432ea.jpg',
    game: 'Team Fortress 2',
    unlockedAt: 'Rare (4.8%)',
    playtime: '48h'
  },
  master: {
    title: 'Perfectionniste Absolu',
    description: 'Débloquez l\'intégralité des succès et terminez tous les défis du jeu.',
    icon: 'https://community.cloudflare.steamstatic.com/public/images/apps/440/b84170564619a9f997c4033ee3ffaa7ea1cbcf8d.jpg',
    game: 'Team Fortress 2',
    unlockedAt: '100% Complété',
    playtime: '124 heures'
  }
}

// Rendu HTML avec variables injectées
const renderedHtmlPreview = computed(() => {
  let template = htmlTemplateCommon.value
  if (previewTier.value === 'rare') template = htmlTemplateRare.value
  if (previewTier.value === 'master') template = htmlTemplateMaster.value

  const s = previewSamples[previewTier.value] || previewSamples.common
  return template
    .replace(/{title}/g, s.title)
    .replace(/{description}/g, s.description)
    .replace(/{icon}/g, s.icon)
    .replace(/{game}/g, s.game)
    .replace(/{unlockedAt}/g, s.unlockedAt)
    .replace(/{playtime}/g, s.playtime)
})

async function handlePickAudio() {
  try {
    const picked = await steamAPI.pickAudioFile()
    if (picked) {
      customAudioPath.value = picked
      audioFileName.value = picked.split(/[\\/]/).pop() || picked
    }
  } catch (err) {
    console.error('[QuickThemeBuilder] Erreur sélection audio:', err)
  }
}

function testAudioFile() {
  if (customAudioPath.value) {
    try {
      const audio = new Audio(customAudioPath.value)
      audio.volume = 0.8
      audio.play().catch(() => {})
    } catch {
      // ignore
    }
  }
}

// Test du brouillon en direct sur Desktop Overlay et OBS WebSocket sans toucher à la BDD
async function testDraftLive() {
  if (isTestingDraft.value) return
  isTestingDraft.value = true
  saveMessage.value = ''

  try {
    const activeHtml = previewTier.value === 'master'
      ? htmlTemplateMaster.value
      : (previewTier.value === 'rare' ? htmlTemplateRare.value : htmlTemplateCommon.value)

    const res = await steamAPI.broadcastDraftAchievement({
      tier: previewTier.value,
      html: activeHtml,
      css: generatedCss.value,
      visualEffect: selectedEffect.value || 'none',
      displayName: previewSamples[previewTier.value]?.title || 'Succès de Brouillon',
      description: previewSamples[previewTier.value]?.description || 'Prévisualisation en direct de votre création.',
      tiers: {
        common: { html: htmlTemplateCommon.value },
        rare: { html: htmlTemplateRare.value },
        master: { html: htmlTemplateMaster.value }
      }
    })

    if (res.success) {
      saveMessage.value = '🚀 Brouillon diffusé en direct (5s) !'
      setTimeout(() => {
        if (saveMessage.value.includes('Brouillon')) saveMessage.value = ''
      }, 3500)
    } else {
      saveMessage.value = res.error || 'Erreur diffusion brouillon'
    }
  } catch (err) {
    console.error('[QuickThemeBuilder] Erreur test draft:', err)
    saveMessage.value = 'Erreur: ' + err.message
  } finally {
    setTimeout(() => {
      isTestingDraft.value = false
    }, 1200)
  }
}

async function saveQuickTheme() {
  isSaving.value = true
  saveMessage.value = ''

  try {
    const finalId = `theme-quick-${Date.now()}`
    const finalTheme = {
      id: finalId,
      name: themeName.value.trim() || 'Nouveau Thème Rapide',
      html: htmlTemplateCommon.value,
      css: generatedCss.value,
      visualEffect: selectedEffect.value || 'none',
      audioPath: useCustomAudio.value ? customAudioPath.value : null,
      soundEnabled: true,
      soundVolume: 0.8,
      tiers: {
        common: {
          html: htmlTemplateCommon.value,
          soundEnabled: true
        },
        rare: {
          html: htmlTemplateRare.value,
          soundEnabled: true
        },
        master: {
          html: htmlTemplateMaster.value,
          soundEnabled: true
        }
      }
    }

    const res = await steamAPI.saveTheme(finalTheme)
    if (res.success) {
      saveMessage.value = 'Thème enregistré avec succès ! 🎉'
      setTimeout(() => {
        emit('saved', res.theme || finalTheme)
        emit('back')
      }, 700)
    } else {
      saveMessage.value = res.error || 'Erreur lors de la sauvegarde'
    }
  } catch (err) {
    saveMessage.value = `Erreur: ${err.message}`
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.quick-builder-wrapper {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  margin-bottom: 2rem;
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.builder-top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 1.25rem;
}

.btn-back-library {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #c7d5e0;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back-library:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  transform: translateX(-2px);
}

.back-icon {
  width: 16px;
  height: 16px;
}

.builder-header-title {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.builder-icon-glow {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(240, 195, 48, 0.2) 0%, rgba(27, 40, 56, 0.8) 100%);
  border: 1px solid rgba(240, 195, 48, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.25);
}

.builder-header-title h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.builder-sub {
  font-size: 0.8rem;
  color: #8b9bb4;
}

.builder-top-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-status-toast {
  font-size: 0.82rem;
  color: #a1cd44;
  font-weight: 600;
  background: rgba(161, 205, 68, 0.12);
  border: 1px solid rgba(161, 205, 68, 0.4);
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
}

.btn-test-draft {
  background: rgba(102, 192, 244, 0.12);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.6rem 1.15rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-test-draft:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.25);
  border-color: #66c0f4;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(102, 192, 244, 0.25);
}

.btn-test-draft:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save-theme {
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  color: #0b0e14;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(240, 195, 48, 0.3);
  transition: all 0.2s ease;
}

.btn-save-theme:hover:not(:disabled) {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #ffd859 0%, #e6a722 100%);
  box-shadow: 0 6px 18px rgba(240, 195, 48, 0.5);
}

.btn-save-theme:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Layout 2 colonnes */
.builder-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 900px) {
  .builder-layout {
    grid-template-columns: 1fr;
  }
}

.controls-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.builder-card {
  background: rgba(15, 22, 31, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sec-icon {
  font-size: 1.1rem;
}

.section-desc {
  margin: -0.25rem 0 0.25rem 0;
  font-size: 0.78rem;
  color: #8b9bb4;
}

.builder-input {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.builder-input:focus {
  border-color: #f0c330;
  box-shadow: 0 0 10px rgba(240, 195, 48, 0.2);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #c7d5e0;
}

.gradient-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.6rem;
}

.gradient-preset-btn {
  height: 48px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  padding: 0.35rem;
  transition: all 0.2s ease;
}

.gradient-preset-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
}

.gradient-preset-btn.active {
  border: 2px solid #f0c330;
  box-shadow: 0 0 12px rgba(240, 195, 48, 0.4);
}

.preset-name {
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  text-align: center;
}

.check-mark {
  position: absolute;
  top: 3px;
  right: 5px;
  font-size: 0.75rem;
  font-weight: 900;
  color: #f0c330;
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-picker-input {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  background: none;
}

.color-hex-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 0.45rem 0.65rem;
  color: #fff;
  font-family: monospace;
  font-size: 0.8rem;
  outline: none;
}

.color-hex-input:focus {
  border-color: #66c0f4;
}

.color-label {
  font-family: monospace;
  font-size: 0.78rem;
  color: #c7d5e0;
}

.label-with-val {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-val {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f0c330;
}

.builder-slider {
  accent-color: #f0c330;
  width: 100%;
}

/* Combos de couleurs sauvegardés */
.saved-palettes-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-top: 0.35rem;
}

.saved-palettes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-save-combo {
  background: rgba(240, 195, 48, 0.15);
  border: 1px solid rgba(240, 195, 48, 0.4);
  color: #ffd859;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-combo:hover {
  background: rgba(240, 195, 48, 0.28);
  transform: translateY(-1px);
}

.saved-palettes-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.palette-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.3rem 0.55rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.palette-chip:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(240, 195, 48, 0.5);
  transform: translateY(-1px);
}

.palette-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.swatch-half {
  flex: 1;
  height: 100%;
}

.chip-name {
  font-size: 0.73rem;
  color: #e2e8f0;
  font-weight: 600;
}

.btn-delete-chip {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0 0.15rem;
  cursor: pointer;
  border-radius: 50%;
  transition: color 0.15s ease;
}

.btn-delete-chip:hover {
  color: #f87171;
}

.empty-palettes-hint {
  font-size: 0.72rem;
  color: #718096;
  font-style: italic;
}

.builder-select {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  color: #fff;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
}

.builder-select:focus {
  border-color: #66c0f4;
}

.field-hint {
  font-size: 0.72rem;
  color: #8b9bb4;
}

.rarity-tiers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .rarity-tiers-grid {
    grid-template-columns: 1fr;
  }
}

.tier-config-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tier-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tier-pill {
  font-size: 0.66rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.common-pill {
  background: rgba(102, 192, 244, 0.15);
  color: #66c0f4;
}

.rare-pill {
  background: rgba(192, 132, 252, 0.15);
  color: #c084fc;
}

.master-pill {
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
}

.tier-stat {
  font-size: 0.68rem;
  color: #8b9bb4;
}

.playtime-hint {
  font-size: 0.65rem;
  color: #ffd700;
  line-height: 1.25;
}

.audio-toggle-row {
  display: flex;
  gap: 1.25rem;
  margin-bottom: 0.4rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: #c7d5e0;
  cursor: pointer;
}

.radio-label input {
  accent-color: #f0c330;
}

.custom-audio-picker-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.btn-pick-audio {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c7d5e0;
  padding: 0.45rem 0.8rem;
  border-radius: 6px;
  font-size: 0.78rem;
  cursor: pointer;
}

.btn-pick-audio:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.audio-path-display {
  font-size: 0.74rem;
  color: #8b9bb4;
  font-family: monospace;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-test-sound {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.35);
  color: #66c0f4;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

/* Colonne Aperçu Live */
.preview-sticky-card {
  position: sticky;
  top: 1.5rem;
  background: rgba(15, 22, 31, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.preview-card-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.preview-badge {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.preview-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.preview-tier-tabs {
  display: flex;
  gap: 0.4rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.25rem;
  border-radius: 8px;
}

.tier-tab-btn {
  flex: 1;
  background: none;
  border: none;
  color: #8b9bb4;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tier-tab-btn:hover {
  color: #fff;
}

.tier-tab-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 700;
}

.tier-tab-btn.master.active {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.preview-stage-container {
  min-height: 180px;
  background: radial-gradient(circle, rgba(20, 30, 45, 0.8) 0%, rgba(9, 13, 20, 0.95) 100%);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  overflow: hidden;
}

.preview-stage-bg {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-render-wrapper {
  max-width: 100%;
  animation: popIn 0.25s ease-out;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.preview-meta-box {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.76rem;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  color: #8b9bb4;
}

.meta-value {
  color: #fff;
  font-weight: 600;
}

.meta-value.gold {
  color: #ffd700;
}

.preview-footer-action {
  margin-top: 0.25rem;
}

.btn-save-large {
  width: 100%;
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  color: #0b0e14;
  font-size: 0.95rem;
  font-weight: 800;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(240, 195, 48, 0.35);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-save-large:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffd859 0%, #e6a722 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 195, 48, 0.5);
}

.btn-save-large:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
