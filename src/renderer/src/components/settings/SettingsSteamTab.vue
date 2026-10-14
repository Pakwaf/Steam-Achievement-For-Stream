<template>
  <div class="tab-content-panel settings-steam-tab">
    <!-- 1. Intervalle de rafraîchissement (polling) -->
    <div class="settings-block">
      <div class="block-header-row">
        <span class="block-icon">⏱️</span>
        <div>
          <h4 class="block-title">Intervalle de Rafraîchissement (Polling)</h4>
          <p class="block-sub">Fréquence de vérification des succès débloqués lorsque vous êtes en jeu</p>
        </div>
      </div>
      <div class="settings-field-row">
        <select v-model.number="pollingInterval" class="device-select-global">
          <option :value="1500">1.5 seconde (Ultra Réactif - Recommandé pour le Stream)</option>
          <option :value="3000">3.0 secondes (Équilibré)</option>
          <option :value="5000">5.0 secondes (Économie processeur)</option>
        </select>
      </div>
    </div>

    <!-- 2. Dossier surveillé & Fichiers de log Steam -->
    <div class="settings-block">
      <div class="block-header-row">
        <span class="block-icon">📂</span>
        <div>
          <h4 class="block-title">Dossier et Fichiers Steam Surveillés</h4>
          <p class="block-sub">Emplacement local des fichiers de statistiques et logs Steam détectés</p>
        </div>
      </div>
      <div class="steam-path-info-box">
        <div class="path-line">
          <span class="path-label">Répertoire Steam :</span>
          <span class="path-val">{{ trackerStatus?.steamPath || 'C:\\Program Files (x86)\\Steam (Détection auto)' }}</span>
        </div>
        <div v-if="trackerStatus?.watchedFiles?.length" class="watched-files-list">
          <span class="path-label">Fichiers surveillés en direct :</span>
          <div v-for="file in trackerStatus.watchedFiles" :key="file" class="file-chip">
            📄 {{ file.split(/[\\/]/).pop() }}
          </div>
        </div>
        <div v-else class="status-tip">
          ⚡ Le tracker surveille automatiquement les fichiers <code>stats.bin</code> et les logs Steam au lancement d'un jeu.
        </div>
      </div>
    </div>

    <!-- 3. Statut Clé API Steam -->
    <div class="settings-block">
      <div class="block-header-row">
        <span class="block-icon">🔑</span>
        <div>
          <h4 class="block-title">Clé Steam Web API</h4>
          <p class="block-sub">Nécessaire pour récupérer les descriptions enrichies, icônes HD et le temps de jeu Master</p>
        </div>
      </div>
      <div class="settings-field-row justify-between">
        <div class="api-key-status-indicator">
          <span class="badge-dot" :class="{ green: trackerStatus?.hasApiKey }"></span>
          <span class="api-key-text">
            {{ trackerStatus?.hasApiKey ? 'Clé API active et opérationnelle' : 'Aucune clé configurée (Mode dégradé)' }}
          </span>
        </div>
        <button class="btn-manage-api-key" type="button" @click="$emit('open-api-key')">
          Modifier la clé
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const pollingInterval = defineModel('pollingInterval', { type: Number, default: 1500 })

defineProps({
  trackerStatus: {
    type: Object,
    default: null
  }
})

defineEmits(['open-api-key'])
</script>

<style scoped>
.tab-content-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.settings-block {
  background: rgba(14, 20, 29, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.block-header-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.block-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.block-title {
  margin: 0 0 3px 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
}

.block-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #8b9bb4;
  line-height: 1.35;
}

.settings-field-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.justify-between {
  justify-content: space-between;
}

.device-select-global {
  width: 100%;
  background: rgba(8, 12, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 0.88rem;
  cursor: pointer;
}

.steam-path-info-box {
  background: rgba(8, 12, 18, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.path-line {
  display: flex;
  gap: 8px;
  font-size: 0.82rem;
  flex-wrap: wrap;
}

.path-label {
  color: #8b9bb4;
  font-weight: 600;
}

.path-val {
  color: #ffffff;
  font-family: monospace;
}

.watched-files-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.file-chip {
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.78rem;
  color: #66c0f4;
  align-self: flex-start;
}

.status-tip {
  font-size: 0.78rem;
  color: #8b9bb4;
  line-height: 1.4;
}

.status-tip code {
  color: #66c0f4;
  background: rgba(102, 192, 244, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
}

.api-key-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ef4444;
}

.badge-dot.green {
  background-color: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.api-key-text {
  font-size: 0.82rem;
  color: #e6edf3;
  font-weight: 500;
}

.btn-manage-api-key {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.35);
  color: #66c0f4;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-manage-api-key:hover {
  background: rgba(102, 192, 244, 0.25);
  border-color: #66c0f4;
}
</style>
