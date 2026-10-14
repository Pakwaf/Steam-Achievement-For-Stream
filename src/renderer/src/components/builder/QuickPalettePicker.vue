<template>
  <div class="builder-card quick-palette-picker">
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
          type="button"
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
        <button
          class="btn-save-combo"
          title="Sauvegarder ce combo de couleurs"
          type="button"
          @click="saveCurrentPalette"
        >
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
            type="button"
            @click.stop="removeSavedPalette(p.id)"
          >
            ×
          </button>
        </div>
      </div>
      <span v-else class="empty-palettes-hint">
        Aucun combo sauvegardé. Cliquez sur "Sauvegarder ce combo" pour mémoriser vos couleurs favorites.
      </span>
    </div>
  </div>
</template>

<script setup>
const primaryColor = defineModel('primaryColor', { type: String, required: true })
const accentColor = defineModel('accentColor', { type: String, required: true })
const backgroundOpacity = defineModel('backgroundOpacity', { type: Number, required: true })
const selectedPresetId = defineModel('selectedPresetId', { type: String, required: true })

defineProps({
  gradientPresets: {
    type: Array,
    default: () => []
  },
  savedPalettes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['apply-preset', 'save-palette', 'apply-saved-palette', 'remove-saved-palette'])

function applyPreset(preset) {
  emit('apply-preset', preset)
}

function saveCurrentPalette() {
  emit('save-palette')
}

function applySavedPalette(palette) {
  emit('apply-saved-palette', palette)
}

function removeSavedPalette(id) {
  emit('remove-saved-palette', id)
}
</script>

<style scoped>
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

.gradient-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
}

.gradient-preset-btn {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  transition: all 0.2s ease;
  min-height: 44px;
}

.gradient-preset-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.gradient-preset-btn.active {
  border: 2px solid #66c0f4;
  box-shadow: 0 0 12px rgba(102, 192, 244, 0.5);
}

.check-mark {
  font-size: 0.85rem;
  color: #66c0f4;
  font-weight: bold;
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-input {
  width: 40px;
  height: 38px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.color-hex-input {
  flex: 1;
  background: rgba(8, 12, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 8px 10px;
  color: #ffffff;
  font-family: monospace;
  font-size: 0.88rem;
}

.color-hex-input:focus {
  outline: none;
  border-color: #66c0f4;
}

.label-with-val {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-val {
  font-size: 0.82rem;
  color: #66c0f4;
  font-weight: 700;
  font-family: monospace;
}

.builder-slider {
  width: 100%;
  accent-color: #66c0f4;
  cursor: pointer;
}

.saved-palettes-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}

.saved-palettes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-save-combo {
  background: rgba(102, 192, 244, 0.12);
  border: 1px solid rgba(102, 192, 244, 0.35);
  color: #66c0f4;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-combo:hover {
  background: rgba(102, 192, 244, 0.25);
  border-color: #66c0f4;
}

.saved-palettes-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.palette-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(18, 26, 38, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 4px 10px 4px 6px;
  font-size: 0.78rem;
  color: #e6edf3;
  cursor: pointer;
  transition: all 0.2s ease;
}

.palette-chip:hover {
  border-color: #66c0f4;
  transform: translateY(-1px);
}

.palette-swatch {
  display: flex;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.swatch-half {
  flex: 1;
  height: 100%;
}

.chip-name {
  font-weight: 500;
}

.btn-delete-chip {
  background: transparent;
  border: none;
  color: #8b9bb4;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0 2px;
  margin-left: 2px;
}

.btn-delete-chip:hover {
  color: #ff5555;
}

.empty-palettes-hint {
  font-size: 0.75rem;
  color: #8b9bb4;
  font-style: italic;
}
</style>
