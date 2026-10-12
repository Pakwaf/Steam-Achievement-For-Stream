<template>
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
          :class="{ active: (visualEffect || 'none') === fx.id }"
          @click="$emit('select-visual-effect', fx.id)"
        >
          <div class="fx-option-icon">{{ fx.icon }}</div>
          <div class="fx-option-info">
            <div class="fx-option-header">
              <h4 class="fx-option-name">{{ fx.name }}</h4>
              <span v-if="(visualEffect || 'none') === fx.id" class="fx-check-dot">✓</span>
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
          <div class="tier-card-actions-row">
            <button class="btn-tier-action common" :disabled="isTesting" @click="$emit('trigger-tier-test', 'common')">
              ▶ Tester l'alerte
            </button>
            <button class="btn-tier-edit-action" title="Éditer le HTML, CSS et l'Audio pour ce tier" @click="$emit('edit-tier', 'common')">
              ✏️ Éditer ce Tier
            </button>
          </div>
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
          <div class="tier-card-actions-row">
            <button class="btn-tier-action rare" :disabled="isTesting" @click="$emit('trigger-tier-test', 'rare')">
              ▶ Tester l'alerte
            </button>
            <button class="btn-tier-edit-action" title="Éditer le HTML, CSS et l'Audio pour ce tier" @click="$emit('edit-tier', 'rare')">
              ✏️ Éditer ce Tier
            </button>
          </div>
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
          <div class="tier-card-actions-row">
            <button class="btn-tier-action master" :disabled="isTesting" @click="$emit('trigger-tier-test', 'master')">
              ▶ Tester l'alerte
            </button>
            <button class="btn-tier-edit-action" title="Éditer le HTML, CSS et l'Audio pour ce tier" @click="$emit('edit-tier', 'master')">
              ✏️ Éditer ce Tier
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visualEffect: {
    type: String,
    default: 'none'
  },
  currentEffectName: {
    type: String,
    default: 'Aucun'
  },
  visualEffectsList: {
    type: Array,
    required: true
  },
  isTesting: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select-visual-effect', 'trigger-tier-test', 'edit-tier'])
</script>

<style scoped>
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

.tier-card-actions-row {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.tier-card-actions-row .btn-tier-action {
  flex: 1.2;
}

.btn-tier-edit-action {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #e2e8f0;
  padding: 0.55rem;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-tier-edit-action:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}
</style>
