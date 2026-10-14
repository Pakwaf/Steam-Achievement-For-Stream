<template>
  <div class="preview-stage-container">
    <!-- Barre de sélection du tier pour l'aperçu -->
    <div class="preview-tier-controls">
      <span class="preview-tier-label">Rendu simulé selon le Tier Steam :</span>
      <div class="tier-pill-selector">
        <button
          class="tier-pill-btn"
          :class="{ active: selectedPreviewTier === 'common' }"
          @click="$emit('update:selectedPreviewTier', 'common')"
        >
          🏅 Standard (> 10%)
        </button>
        <button
          class="tier-pill-btn rare"
          :class="{ active: selectedPreviewTier === 'rare' }"
          @click="$emit('update:selectedPreviewTier', 'rare')"
        >
          ★ Rare (< 10%)
        </button>
        <button
          class="tier-pill-btn master"
          :class="{ active: selectedPreviewTier === 'master' }"
          @click="$emit('update:selectedPreviewTier', 'master')"
        >
          🏆 Platine 100%
        </button>
      </div>
    </div>

    <!-- Style universel des effets et tiers + style du thème injecté -->
    <component is="style" type="text/css">
      {{ safeCss }}
    </component>

    <div class="preview-backdrop">
      <div class="preview-watermark">Aperçu en direct ({{ selectedPreviewTierName }})</div>
      <div class="preview-slot">
        <div v-html="processedHtml" class="achievement-preview-box"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeSoft, sanitizeCss } from '../../utils/sanitizeSoft.js'

const props = defineProps({
  selectedPreviewTier: {
    type: String,
    default: 'common'
  },
  selectedPreviewTierName: {
    type: String,
    default: 'Standard'
  },
  visualEffectsCss: {
    type: String,
    default: ''
  },
  themeCss: {
    type: String,
    default: ''
  },
  previewHtml: {
    type: String,
    default: ''
  }
})

defineEmits(['update:selectedPreviewTier'])

const processedHtml = computed(() => {
  return sanitizeSoft(props.previewHtml)
})

const safeCss = computed(() => {
  return sanitizeCss(`${props.visualEffectsCss || ''}\n${props.themeCss || ''}`)
})
</script>

<style scoped>
.preview-stage-container {
  display: flex;
  flex-direction: column;
  background: rgba(12, 18, 26, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

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

.preview-backdrop {
  position: relative;
  min-height: 280px;
  background: radial-gradient(circle at center, #1b2838 0%, #0d121a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
}

.preview-watermark {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.25);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

/* Neutralisation du positionnement fixe pour affichage parfait centré dans la zone d'aperçu */
.preview-slot :deep(.custom-achievement-card),
.preview-slot :deep(.cyber-achievement-card),
.preview-slot :deep(.minimal-achievement-card),
.preview-slot :deep(div[class*="achievement-card"]),
.preview-slot :deep(div[class*="card"]) {
  position: relative !important;
  top: auto !important;
  bottom: auto !important;
  left: auto !important;
  right: auto !important;
  margin: 0 auto !important;
  transform: none !important;
}

.preview-slot :deep(img),
.preview-slot :deep(.ach-icon),
.preview-slot :deep(.mini-icon),
.preview-slot :deep(.cyber-icon) {
  max-width: 64px !important;
  max-height: 64px !important;
  object-fit: cover !important;
  border-radius: 8px !important;
}
</style>
