<template>
  <div v-if="isOpen" class="choice-modal-overlay" @click.self="$emit('close')">
    <div class="choice-modal-card">
      <div class="modal-card-header">
        <div class="modal-title-group">
          <div class="header-icon-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <h3>Créer un Nouveau Thème</h3>
            <p class="modal-subtitle-text">Choisissez votre méthode de conception d'overlay</p>
          </div>
        </div>
        <button class="btn-close-modal" title="Fermer" @click="$emit('close')">✕</button>
      </div>

      <div class="choice-grid">
        <!-- Option 1 : Mode Rapide (Visuel) -->
        <div class="choice-card quick-choice" @click="$emit('select-quick')">
          <div class="card-highlight-badge">Recommandé</div>
          <div class="choice-icon-wrap quick-icon-bg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="choice-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <h4 class="choice-title">Création Rapide</h4>
          <span class="choice-subtitle">Générateur visuel sans code</span>
          <p class="choice-desc">
            Créez un thème unique en quelques clics en ajustant visuellement les couleurs, dégradés, opacité, polices et alertes sonores.
          </p>
          <ul class="choice-features">
            <li><span>✓</span> Palette et dégradés prédéfinis</li>
            <li><span>✓</span> Google Fonts préchargées</li>
            <li><span>✓</span> Configuration visuelle des raretés</li>
            <li><span>✓</span> Zéro code HTML / CSS requis</li>
          </ul>
          <button class="btn-select-mode btn-quick">
            <span>Lancer le Générateur Rapide ⚡</span>
          </button>
        </div>

        <!-- Option 2 : Mode Custom (Expert) -->
        <div class="choice-card custom-choice" @click="$emit('select-custom')">
          <div class="card-tag-badge">Expert</div>
          <div class="choice-icon-wrap custom-icon-bg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="choice-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h4 class="choice-title">Création Custom</h4>
          <span class="choice-subtitle">Éditeur de code intégral</span>
          <p class="choice-desc">
            Accédez directement à la structure HTML brute, aux règles CSS avancées et personnalisez chaque Tier de succès au pixel près.
          </p>
          <ul class="choice-features">
            <li><span>✓</span> HTML & CSS bruts modifiables</li>
            <li><span>✓</span> Support de toutes les variables Steam</li>
            <li><span>✓</span> Édition indépendante des Tiers (Common, Rare, Master)</li>
            <li><span>✓</span> Pour designers & créateurs avertis</li>
          </ul>
          <button class="btn-select-mode btn-custom">
            <span>Ouvrir l'Éditeur Expert 🛠️</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'select-quick', 'select-custom'])
</script>

<style scoped>
.choice-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.choice-modal-card {
  background: #141a24;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 2.25rem;
  max-width: 780px;
  width: 95vw;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85);
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon-glow {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(240, 195, 48, 0.2) 0%, rgba(27, 40, 56, 0.8) 100%);
  border: 1px solid rgba(240, 195, 48, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0c330;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.2);
}

.header-icon {
  width: 22px;
  height: 22px;
}

.modal-title-group h3 {
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.modal-subtitle-text {
  font-size: 0.85rem;
  color: #8b9bb4;
  margin: 0.2rem 0 0 0;
}

.btn-close-modal {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  line-height: 1;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 680px) {
  .choice-grid {
    grid-template-columns: 1fr;
  }
}

.choice-card {
  position: relative;
  background: rgba(22, 32, 47, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.choice-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
}

.quick-choice:hover {
  border-color: rgba(240, 195, 48, 0.6);
  background: linear-gradient(180deg, rgba(240, 195, 48, 0.08) 0%, rgba(22, 32, 47, 0.85) 100%);
}

.custom-choice:hover {
  border-color: rgba(102, 192, 244, 0.6);
  background: linear-gradient(180deg, rgba(102, 192, 244, 0.08) 0%, rgba(22, 32, 47, 0.85) 100%);
}

.card-highlight-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  color: #0b0e14;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(240, 195, 48, 0.4);
}

.card-tag-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
}

.choice-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.quick-icon-bg {
  background: rgba(240, 195, 48, 0.15);
  border: 1px solid rgba(240, 195, 48, 0.35);
  color: #f0c330;
}

.custom-icon-bg {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.35);
  color: #66c0f4;
}

.choice-icon {
  width: 26px;
  height: 26px;
}

.choice-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.choice-subtitle {
  font-size: 0.78rem;
  color: #66c0f4;
  margin-top: 0.15rem;
  font-weight: 600;
}

.quick-choice .choice-subtitle {
  color: #ffd859;
}

.choice-desc {
  font-size: 0.82rem;
  color: #8b9bb4;
  line-height: 1.45;
  margin: 0.85rem 0 1.25rem 0;
  flex: 1;
}

.choice-features {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.choice-features li {
  font-size: 0.76rem;
  color: #c7d5e0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.choice-features li span {
  color: #a1cd44;
  font-weight: 700;
}

.btn-select-mode {
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-quick {
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  color: #0b0e14;
  box-shadow: 0 4px 14px rgba(240, 195, 48, 0.35);
}

.btn-quick:hover {
  background: linear-gradient(135deg, #ffd859 0%, #e6a722 100%);
  transform: translateY(-1px);
}

.btn-custom {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
}

.btn-custom:hover {
  background: rgba(102, 192, 244, 0.2);
  border-color: #66c0f4;
  color: #66c0f4;
  transform: translateY(-1px);
}
</style>
