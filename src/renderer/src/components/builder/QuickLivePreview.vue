<template>
  <div class="preview-column quick-live-preview">
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
            type="button"
            @click="previewTier = 'common'"
          >
            Standard
          </button>
          <button
            class="tier-tab-btn"
            :class="{ active: previewTier === 'rare' }"
            type="button"
            @click="previewTier = 'rare'"
          >
            Rare (&lt;10%)
          </button>
          <button
            class="tier-tab-btn master"
            :class="{ active: previewTier === 'master' }"
            type="button"
            @click="previewTier = 'master'"
          >
            Platine 100% 🏆
          </button>
        </div>
      </div>

      <!-- Zone de prévisualisation du thème avec rendu réel natif -->
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
        <button
          class="btn-save-large"
          :disabled="isSaving"
          type="button"
          @click="$emit('save')"
        >
          <span v-if="isSaving">⏳ Enregistrement...</span>
          <span v-else>💾 Enregistrer ce Thème</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const previewTier = defineModel('previewTier', { type: String, default: 'common' })

defineProps({
  generatedCssPreview: {
    type: String,
    required: true
  },
  renderedHtmlPreview: {
    type: String,
    required: true
  },
  animKey: {
    type: Number,
    default: 0
  },
  animationLabel: {
    type: String,
    default: 'Slide Up'
  },
  selectedFont: {
    type: String,
    default: 'Outfit'
  },
  effectLabel: {
    type: String,
    default: 'Aucun'
  },
  isSaving: {
    type: Boolean,
    default: false
  }
})

defineEmits(['save'])
</script>

<style scoped>
.preview-column {
  flex: 1.1;
  min-width: 380px;
}

@media (max-width: 1024px) {
  .preview-column {
    min-width: 100%;
  }
}

.preview-sticky-card {
  position: sticky;
  top: 1.5rem;
  background: rgba(14, 20, 29, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
}

.preview-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 1rem;
}

.preview-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-badge {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.05em;
}

.preview-title {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

.preview-tier-tabs {
  display: flex;
  background: rgba(8, 12, 18, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 3px;
  gap: 4px;
}

.tier-tab-btn {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  color: #8b9bb4;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tier-tab-btn:hover {
  color: #ffffff;
}

.tier-tab-btn.active {
  background: rgba(102, 192, 244, 0.2);
  color: #66c0f4;
  font-weight: 700;
}

.tier-tab-btn.master.active {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.preview-stage-container {
  min-height: 230px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: radial-gradient(circle at center, rgba(30, 45, 65, 0.35) 0%, rgba(8, 12, 18, 0.7) 100%);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.preview-stage-bg {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-render-wrapper {
  display: inline-block;
  will-change: transform, opacity;
}

.preview-meta-box {
  background: rgba(8, 12, 18, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.meta-label {
  color: #8b9bb4;
}

.meta-value {
  color: #ffffff;
  font-weight: 600;
}

.meta-value.gold {
  color: #ffd700;
}

.preview-footer-action {
  margin-top: 0.5rem;
}

.btn-save-large {
  width: 100%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: 1px solid rgba(147, 197, 253, 0.3);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-save-large:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.btn-save-large:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
