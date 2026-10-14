<template>
  <div class="builder-card quick-animation-picker">
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
</template>

<script setup>
const selectedAnimation = defineModel('selectedAnimation', { type: String, required: true })
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

.builder-select {
  background: rgba(8, 12, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.builder-select:focus {
  outline: none;
  border-color: #66c0f4;
}

.field-hint {
  font-size: 0.75rem;
  color: #8b9bb4;
  line-height: 1.35;
}
</style>
