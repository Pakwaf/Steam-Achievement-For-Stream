<template>
  <div class="display-systems-card">
    <div class="display-systems-header">
      <div class="icon-title-group">
        <div class="display-icon-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="screen-icon">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <div>
          <h3>Systèmes d'Affichage</h3>
          <p class="subtitle">Overlay transparent pour le joueur et source navigateur pour OBS</p>
        </div>
      </div>
    </div>

    <div class="display-grid">
      <!-- Colonne 1 : Overlay Desktop Transparent -->
      <div class="display-item-box">
        <div class="display-item-header">
          <div class="display-item-title">
            <span class="item-badge-pill in-game">En Jeu</span>
            <h4>Overlay Écran</h4>
          </div>
          <span class="status-indicator-pill active">Actif</span>
        </div>
        <p class="item-desc">
          Affichage transparent direct sur votre écran de jeu, sans bloquer vos clics ni votre gameplay.
        </p>
      </div>

      <!-- Colonne 2 : Serveur Local OBS Studio -->
      <div class="display-item-box obs-box">
        <div class="display-item-header">
          <div class="display-item-title">
            <span class="item-badge-pill obs">OBS Studio</span>
            <h4>Source OBS</h4>
          </div>
          <div class="obs-header-controls">
            <button class="btn-port-config" title="Changer le port (ex: si Streamer.bot utilise 8080)" @click="$emit('open-port-modal')">
              ⚙️ Port {{ obsStatus?.port || 8080 }}
            </button>
            <span class="status-indicator-pill" :class="{ active: obsStatus?.isRunning }">
              {{ obsStatus?.isRunning ? 'En ligne' : 'Démarrage...' }}
            </span>
          </div>
        </div>

        <!-- Bannière alerte conflit de port (ex: Streamer.bot sur 8080) -->
        <div v-if="obsStatus?.hasPortConflict" class="obs-conflict-alert">
          <span class="conflict-alert-icon">⚡</span>
          <div class="conflict-alert-body">
            <strong>Port {{ obsStatus?.preferredPort || 8080 }} déjà utilisé</strong> (ex: Streamer.bot).
            <p>L'overlay a basculé automatiquement sur le port <strong>{{ obsStatus?.port }}</strong> sans perturber vos autres applications !</p>
          </div>
        </div>

        <p class="item-desc">
          Source Navigateur à intégrer dans OBS Studio pour diffuser les succès sur votre stream :
        </p>

        <!-- Lien Principal Localhost / 127.0.0.1 -->
        <div class="obs-url-container">
          <div class="url-kind-header">
            <span class="url-type-tag">Local (Même PC)</span>
            <span class="url-type-hint">OBS installé sur ce PC</span>
          </div>
          <div class="url-action-bar">
            <code class="obs-url-text">{{ obsUrl }}</code>
            <div class="obs-url-actions">
              <button class="btn-copy-obs" @click="$emit('copy-obs-url')">
                {{ obsCopied ? 'Copié !' : 'Copier' }}
              </button>
              <button class="btn-test-obs" title="Tester dans le navigateur" @click="$emit('open-obs-in-browser')">
                Ouvrir ↗
              </button>
            </div>
          </div>
        </div>

        <!-- Vrai Lien Réseau Local (LAN IP pour Dual-PC ou OBS distant) -->
        <div v-if="obsStatus?.obsUrlLan" class="obs-url-container lan-highlight">
          <div class="url-kind-header">
            <span class="url-type-tag lan">Réseau Local (LAN / 2e PC)</span>
            <span class="url-type-hint">Vrai lien pour OBS sur PC de stream dédié</span>
          </div>
          <div class="url-action-bar">
            <code class="obs-url-text lan-text">{{ obsStatus.obsUrlLan }}</code>
            <div class="obs-url-actions">
              <button class="btn-copy-obs btn-copy-lan" @click="$emit('copy-obs-url-lan')">
                {{ obsLanCopied ? 'Copié !' : 'Copier' }}
              </button>
              <button class="btn-test-obs" title="Tester le lien LAN" @click="$emit('open-obs-lan-in-browser')">
                Ouvrir ↗
              </button>
            </div>
          </div>
        </div>

        <div class="obs-alt-url" title="Alternative localhost">
          <span class="alt-label">Alternative :</span>
          <code class="alt-code" title="Cliquer pour copier" @click="$emit('copy-obs-url-localhost')">
            {{ obsStatus?.obsUrlLocalhost || `http://localhost:${obsStatus?.port || 8080}/obs` }}
          </code>
          <span v-if="obsLocalhostCopied" class="copied-badge">Copié !</span>
        </div>

        <div class="obs-meta-stats">
          <span>Sources connectées : <strong :class="{ 'connected-count': (obsStatus?.connectedClients || 0) > 0 }">{{ obsStatus?.connectedClients || 0 }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  obsStatus: {
    type: Object,
    default: null
  },
  obsUrl: {
    type: String,
    default: 'http://127.0.0.1:8080/obs'
  },
  obsCopied: {
    type: Boolean,
    default: false
  },
  obsLanCopied: {
    type: Boolean,
    default: false
  },
  obsLocalhostCopied: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'open-port-modal',
  'copy-obs-url',
  'copy-obs-url-lan',
  'copy-obs-url-localhost',
  'open-obs-in-browser',
  'open-obs-lan-in-browser'
])
</script>

<style scoped>
.display-systems-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-card);
}

.display-systems-header {
  margin-bottom: 1.5rem;
}

.icon-title-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.display-icon-glow {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(102, 192, 244, 0.15) 0%, rgba(27, 40, 56, 0.6) 100%);
  border: 1px solid rgba(102, 192, 244, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #66c0f4;
}

.screen-icon {
  width: 22px;
  height: 22px;
}

.icon-title-group h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.2rem 0;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--steam-text-muted);
  margin: 0;
}

.display-grid {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 1.5rem;
}

@media (max-width: 860px) {
  .display-grid {
    grid-template-columns: 1fr;
  }
}

.display-item-box {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.display-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.display-item-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.display-item-title h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.item-badge-pill {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.item-badge-pill.in-game {
  background: rgba(92, 126, 16, 0.3);
  color: #a1cd44;
  border: 1px solid rgba(92, 126, 16, 0.5);
}

.item-badge-pill.obs {
  background: rgba(102, 192, 244, 0.2);
  color: #66c0f4;
  border: 1px solid rgba(102, 192, 244, 0.4);
}

.status-indicator-pill {
  font-size: 0.75rem;
  color: var(--steam-text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.status-indicator-pill.active {
  color: #a1cd44;
  background: rgba(92, 126, 16, 0.2);
  border: 1px solid rgba(92, 126, 16, 0.4);
}

.item-desc {
  font-size: 0.82rem;
  color: #a8b8cf;
  line-height: 1.45;
  margin-bottom: 1rem;
}

.obs-header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-port-config {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #c5d4e8;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-port-config:hover {
  background: rgba(102, 192, 244, 0.2);
  border-color: #66c0f4;
  color: #fff;
}

.obs-conflict-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  background: rgba(240, 195, 48, 0.12);
  border: 1px solid rgba(240, 195, 48, 0.4);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.9rem;
  font-size: 0.78rem;
  color: #ffd859;
}

.conflict-alert-icon {
  font-size: 1rem;
  line-height: 1;
}

.conflict-alert-body p {
  margin: 0.2rem 0 0 0;
  color: #f1ebd0;
  font-size: 0.74rem;
}

.obs-url-container {
  background: rgba(15, 21, 29, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.75rem;
}

.obs-url-container.lan-highlight {
  border-color: rgba(102, 192, 244, 0.35);
  background: rgba(102, 192, 244, 0.05);
}

.url-kind-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}

.url-type-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: #9cbcdb;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.url-type-tag.lan {
  color: #66c0f4;
}

.url-type-hint {
  font-size: 0.7rem;
  color: var(--steam-text-muted);
}

.url-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.obs-url-text {
  font-family: monospace;
  font-size: 0.82rem;
  color: #66c0f4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.obs-url-text.lan-text {
  color: #a1cd44;
}

.obs-url-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-copy-obs,
.btn-test-obs {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  color: #fff;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-copy-obs:hover,
.btn-test-obs:hover {
  background: rgba(102, 192, 244, 0.2);
  border-color: #66c0f4;
}

.btn-copy-lan {
  background: rgba(161, 205, 68, 0.15);
  border-color: rgba(161, 205, 68, 0.4);
  color: #c7eb74;
}

.btn-copy-lan:hover {
  background: rgba(161, 205, 68, 0.3);
  border-color: #a1cd44;
}

.obs-alt-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.74rem;
  color: var(--steam-text-muted);
  margin-bottom: 0.6rem;
}

.alt-code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: #a8b8cf;
  font-family: monospace;
  cursor: pointer;
}

.alt-code:hover {
  color: #66c0f4;
  text-decoration: underline;
}

.copied-badge {
  color: #a1cd44;
  font-weight: 600;
}

.obs-meta-stats {
  font-size: 0.75rem;
  color: var(--steam-text-muted);
  padding-top: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.connected-count {
  color: #a1cd44;
}
</style>
