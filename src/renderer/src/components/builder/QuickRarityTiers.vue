<template>
  <div class="builder-card quick-rarity-tiers">
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
</template>

<script setup>
const commonColor = defineModel('commonColor', { type: String, required: true })
const rareColor = defineModel('rareColor', { type: String, required: true })
const masterColor = defineModel('masterColor', { type: String, required: true })
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

.section-desc {
  margin: -6px 0 0 0;
  font-size: 0.82rem;
  color: #8b9bb4;
  line-height: 1.4;
}

.rarity-tiers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .rarity-tiers-grid {
    grid-template-columns: 1fr;
  }
}

.tier-config-box {
  background: rgba(18, 26, 38, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
}

.tier-config-box:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.tier-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tier-pill {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.04em;
}

.common-pill {
  background: rgba(102, 192, 244, 0.15);
  color: #66c0f4;
  border: 1px solid rgba(102, 192, 244, 0.4);
}

.rare-pill {
  background: rgba(192, 132, 252, 0.15);
  color: #c084fc;
  border: 1px solid rgba(192, 132, 252, 0.4);
}

.master-pill {
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.4);
}

.tier-stat {
  font-size: 0.7rem;
  color: #8b9bb4;
  font-family: monospace;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker-input {
  width: 36px;
  height: 34px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.color-label {
  font-family: monospace;
  font-size: 0.82rem;
  color: #e6edf3;
}

.playtime-hint {
  font-size: 0.7rem;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 6px;
  padding: 6px 8px;
  line-height: 1.3;
}
</style>
