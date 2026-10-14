<template>
  <div class="quick-builder-wrapper">
    <!-- Barre supérieure de navigation -->
    <div class="builder-top-nav">
      <button class="btn-back-library" title="Revenir à la galerie de thèmes" type="button" @click="$emit('back')">
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
          type="button"
          @click="testDraftLive"
        >
          <span v-if="isTestingDraft">⏳ Envoi...</span>
          <span v-else>🚀 Tester ce brouillon (Live)</span>
        </button>
        <button class="btn-save-theme" :disabled="isSaving" type="button" @click="saveQuickTheme">
          <span v-if="isSaving">⏳ Enregistrement...</span>
          <span v-else>💾 Enregistrer le Thème</span>
        </button>
      </div>
    </div>

    <!-- Conteneur principal 2 colonnes (Contrôles visuels vs Live Preview) -->
    <div class="builder-layout">
      <!-- Colonne 1 : Contrôles visuels modulaires -->
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

        <!-- Section 2 : Couleurs & Dégradés (Sous-composant modulaire) -->
        <QuickPalettePicker
          v-model:primary-color="primaryColor"
          v-model:accent-color="accentColor"
          v-model:background-opacity="backgroundOpacity"
          v-model:selected-preset-id="selectedPresetId"
          :gradient-presets="GRADIENT_PRESETS"
          :saved-palettes="savedPalettes"
          @apply-preset="applyPreset"
          @save-palette="saveCurrentPalette"
          @apply-saved-palette="applySavedPalette"
          @remove-saved-palette="removeSavedPalette"
        />

        <!-- Section 3 : Animation d'apparition (Sous-composant modulaire) -->
        <QuickAnimationPicker
          v-model:selected-animation="selectedAnimation"
        />

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

        <!-- Section 5 : Configuration des Raretés (Sous-composant modulaire) -->
        <QuickRarityTiers
          v-model:common-color="commonColor"
          v-model:rare-color="rareColor"
          v-model:master-color="masterColor"
        />

        <!-- Section 6 : Audio & Effet Visuel -->
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
              <button class="btn-pick-audio" type="button" @click="handlePickAudio">
                <span>📁 Choisir un fichier (.mp3, .wav, .ogg)</span>
              </button>
              <span class="audio-path-display">{{ audioFileName || 'Aucun fichier sélectionné' }}</span>
              <button v-if="customAudioPath" class="btn-test-sound" type="button" @click="testAudioFile">
                ▶ Tester
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne 2 : Aperçu en Direct (Sous-composant modulaire Live Preview) -->
      <QuickLivePreview
        v-model:preview-tier="previewTier"
        :generated-css-preview="generatedCssPreview"
        :rendered-html-preview="renderedHtmlPreview"
        :anim-key="animKey"
        :animation-label="animationLabel"
        :selected-font="selectedFont"
        :effect-label="effectLabel"
        :is-saving="isSaving"
        @save="saveQuickTheme"
      />
    </div>
  </div>
</template>

<script setup>
import { useThemeBuilder } from '../../composables/useThemeBuilder.js'
import QuickPalettePicker from '../builder/QuickPalettePicker.vue'
import QuickAnimationPicker from '../builder/QuickAnimationPicker.vue'
import QuickRarityTiers from '../builder/QuickRarityTiers.vue'
import QuickLivePreview from '../builder/QuickLivePreview.vue'

const emit = defineEmits(['back', 'saved'])

const {
  themeName,
  selectedPresetId,
  primaryColor,
  accentColor,
  backgroundOpacity,
  selectedFont,
  selectedAnimation,
  savedPalettes,
  commonColor,
  rareColor,
  masterColor,
  selectedEffect,
  useCustomAudio,
  customAudioPath,
  audioFileName,
  previewTier,
  isSaving,
  isTestingDraft,
  saveMessage,
  animKey,
  GRADIENT_PRESETS,
  GOOGLE_FONTS,
  VISUAL_EFFECTS,
  effectLabel,
  animationLabel,
  generatedCssPreview,
  renderedHtmlPreview,
  applyPreset,
  saveCurrentPalette,
  applySavedPalette,
  removeSavedPalette,
  handlePickAudio,
  testAudioFile,
  testDraftLive,
  saveQuickTheme
} = useThemeBuilder(emit)
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
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e6edf3;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back-library:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateX(-2px);
}

.back-icon {
  width: 16px;
  height: 16px;
}

.builder-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.builder-icon-glow {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 195, 48, 0.15);
  border: 1px solid rgba(240, 195, 48, 0.35);
  border-radius: 10px;
  font-size: 1.3rem;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.2);
}

.builder-header-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.builder-sub {
  font-size: 0.82rem;
  color: #8b9bb4;
}

.builder-top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-status-toast {
  font-size: 0.82rem;
  font-weight: 600;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
  animation: fadeIn 0.2s ease-out;
}

.btn-test-draft {
  background: linear-gradient(135deg, rgba(240, 195, 48, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
  border: 1px solid rgba(240, 195, 48, 0.4);
  color: #ffd700;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-test-draft:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(240, 195, 48, 0.35) 0%, rgba(217, 119, 6, 0.35) 100%);
  border-color: #ffd700;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.3);
}

.btn-test-draft:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save-theme {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: 1px solid rgba(147, 197, 253, 0.3);
  color: #ffffff;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-save-theme:hover:not(:disabled) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.5);
  transform: translateY(-1px);
}

.btn-save-theme:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.builder-layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .builder-layout {
    flex-direction: column;
  }
}

.controls-column {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.builder-card {
  background: rgba(14, 20, 29, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sec-icon {
  font-size: 1.15rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #a4b4cc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.builder-input,
.builder-select {
  background: rgba(8, 12, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.builder-input:focus,
.builder-select:focus {
  outline: none;
  border-color: #66c0f4;
}

.field-hint {
  font-size: 0.75rem;
  color: #8b9bb4;
  line-height: 1.35;
}

.audio-toggle-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #e6edf3;
  cursor: pointer;
}

.radio-label input[type='radio'] {
  accent-color: #66c0f4;
  cursor: pointer;
}

.custom-audio-picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
  background: rgba(8, 12, 18, 0.6);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px 12px;
}

.btn-pick-audio {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-pick-audio:hover {
  background: rgba(102, 192, 244, 0.25);
  border-color: #66c0f4;
}

.audio-path-display {
  font-size: 0.8rem;
  color: #8b9bb4;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-test-sound {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-test-sound:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
