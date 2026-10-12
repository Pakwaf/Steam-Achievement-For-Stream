<template>
  <div class="tracker-card">
    <div class="tracker-card-header">
      <div class="tracker-title-box">
        <div class="tracker-pulse-icon">
          <span class="pulse-ring"></span>
          <span class="pulse-center"></span>
        </div>
        <div>
          <h3>Détection des succès</h3>
          <p class="tracker-subtitle">Surveillance continue des succès Steam</p>
        </div>
      </div>
      <span class="badge-active-tracker">
        {{ trackerStatus?.isTracking ? '● Prêt' : '○ Inactif' }}
      </span>
    </div>

    <!-- Informations système détectées -->
    <div class="tracker-diagnostics">
      <div class="diag-item">
        <span class="diag-label">Dossier Steam :</span>
        <span class="diag-value" :title="trackerStatus?.steamPath">
          {{ trackerStatus?.steamPath || 'Recherche automatique...' }}
        </span>
      </div>
      <div class="diag-item">
        <span class="diag-label">Fichier surveillé :</span>
        <span class="diag-value" :title="trackerStatus?.watchedFiles?.join(', ')">
          {{ trackerStatus?.watchedFiles?.[0] ? getFilename(trackerStatus.watchedFiles[0]) : 'stats_log.txt' }}
        </span>
      </div>
      <div class="diag-item">
        <span class="diag-label">Clé Steam Web API :</span>
        <span class="diag-value" :class="{ 'api-ok': trackerStatus?.hasApiKey, 'api-warn': !trackerStatus?.hasApiKey }">
          {{ trackerStatus?.hasApiKey ? 'Configurée ✔' : 'Non configurée (fallback)' }}
        </span>
      </div>
    </div>

    <!-- Section de Test & Simulation par Tier -->
    <div class="simulation-section">
      <div class="simulation-header">
        <div class="sim-title-group">
          <h4>Tester les Niveaux de Rareté (Tiers Steam)</h4>
          <span class="sim-badge">3 Tiers Disponibles</span>
        </div>
        <p>Simulez chaque niveau de rareté pour valider l'affichage visuel, le badge, et la signature sonore sur votre écran et OBS :</p>
      </div>

      <div class="sim-tiers-grid">
        <!-- Tier 1 : Standard -->
        <div class="sim-tier-card common">
          <div class="sim-tier-badge">🏅 Standard (&gt; 10%)</div>
          <div class="sim-tier-name">Tête de classe</div>
          <div class="sim-tier-game">Team Fortress 2 (42.5%)</div>
          <button
            class="btn-sim-action common"
            :disabled="isSimulating"
            @click="$emit('trigger-tier-test', 'common')"
          >
            ▶ Tester Standard
          </button>
        </div>

        <!-- Tier 2 : Rare -->
        <div class="sim-tier-card rare">
          <div class="sim-tier-badge">★ Rare (&lt; 10%)</div>
          <div class="sim-tier-name">Guerre frontale</div>
          <div class="sim-tier-game">Left 4 Dead 2 (4.8%)</div>
          <button
            class="btn-sim-action rare"
            :disabled="isSimulating"
            @click="$emit('trigger-tier-test', 'rare')"
          >
            ▶ Tester Rare (&lt; 10%)
          </button>
        </div>

        <!-- Tier 3 : 100% Platine -->
        <div class="sim-tier-card master">
          <div class="sim-tier-badge">🏆 Jeu Complété (100%)</div>
          <div class="sim-tier-name">Maître Incontesté</div>
          <div class="sim-tier-game">100% Tous les succès</div>
          <button
            class="btn-sim-action master"
            :disabled="isSimulating"
            @click="$emit('trigger-tier-test', 'master')"
          >
            ▶ Tester 100% Platine
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  trackerStatus: {
    type: Object,
    default: null
  },
  isSimulating: {
    type: Boolean,
    default: false
  }
})

defineEmits(['trigger-tier-test'])

function getFilename(fullPath) {
  if (!fullPath) return ''
  return fullPath.split(/\\|\//).pop()
}
</script>

<style scoped>
.tracker-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-card);
}

.tracker-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.tracker-title-box {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tracker-pulse-icon {
  position: relative;
  width: 24px;
  height: 24px;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #a1cd44;
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.pulse-center {
  position: absolute;
  inset: 4px;
  background-color: #a1cd44;
  border-radius: 50%;
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.8); opacity: 0; }
}

.tracker-title-box h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.2rem 0;
}

.tracker-subtitle {
  font-size: 0.85rem;
  color: var(--steam-text-muted);
  margin: 0;
}

.badge-active-tracker {
  font-size: 0.8rem;
  font-weight: 600;
  color: #a1cd44;
  background: rgba(92, 126, 16, 0.2);
  border: 1px solid rgba(92, 126, 16, 0.4);
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
}

.tracker-diagnostics {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.diag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
}

.diag-label {
  color: var(--steam-text-muted);
}

.diag-value {
  color: #fff;
  font-family: monospace;
  max-width: 55%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diag-value.api-ok {
  color: #a1cd44;
}

.diag-value.api-warn {
  color: #f0c330;
}

.simulation-section {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 1.25rem;
}

.simulation-header {
  margin-bottom: 1rem;
}

.simulation-header p {
  font-size: 0.82rem;
  color: var(--steam-text-muted);
  margin: 0.25rem 0 0 0;
}

.sim-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.sim-title-group h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.sim-badge {
  font-size: 0.68rem;
  font-weight: 800;
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.sim-tiers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.sim-tier-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.sim-tier-card:hover {
  transform: translateY(-2px);
}

.sim-tier-card.common {
  border-color: rgba(240, 195, 48, 0.3);
  background: linear-gradient(180deg, rgba(240, 195, 48, 0.04) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.sim-tier-card.rare {
  border-color: rgba(168, 85, 247, 0.35);
  background: linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.sim-tier-card.master {
  border-color: rgba(56, 189, 248, 0.35);
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.sim-tier-badge {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.sim-tier-card.common .sim-tier-badge { color: #f0c330; }
.sim-tier-card.rare .sim-tier-badge { color: #c084fc; }
.sim-tier-card.master .sim-tier-badge { color: #38bdf8; }

.sim-tier-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #fff;
}

.sim-tier-game {
  font-size: 0.72rem;
  color: #8b9bb4;
  margin-bottom: 0.4rem;
}

.btn-sim-action {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-sim-action.common {
  background: rgba(240, 195, 48, 0.15);
  border-color: rgba(240, 195, 48, 0.45);
  color: #ffd644;
}

.btn-sim-action.common:hover:not(:disabled) {
  background: rgba(240, 195, 48, 0.3);
  box-shadow: 0 0 12px rgba(240, 195, 48, 0.25);
}

.btn-sim-action.rare {
  background: rgba(168, 85, 247, 0.18);
  border-color: rgba(168, 85, 247, 0.5);
  color: #d8b4fe;
}

.btn-sim-action.rare:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.35);
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
}

.btn-sim-action.master {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.5);
  color: #7dd3fc;
}

.btn-sim-action.master:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}
</style>
