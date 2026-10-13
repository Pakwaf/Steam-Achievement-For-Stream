<template>
  <div v-if="isOpen" class="update-modal-overlay" @click.self="onBackdropClick">
    <div class="update-modal-card">
      <!-- En-tête de la modale -->
      <div class="modal-card-header">
        <div class="modal-title-group">
          <div class="modal-update-icon" :class="{ pulse: isChecking || isDownloading }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div>
            <h3>Mise à jour disponible</h3>
            <p class="modal-subtitle-text">Une nouvelle version de SteamOverlayStream est prête à être installée</p>
          </div>
        </div>
        <button v-if="!isDownloading && !isUpdateReady" class="btn-close-modal" title="Fermer" @click="$emit('close')">
          ✕
        </button>
      </div>

      <!-- Corps de la modale -->
      <div class="update-modal-body">
        <!-- État 1 : Mise à jour disponible -->
        <div v-if="updateInfo" class="version-badge-container">
          <div class="version-chip current">
            <span class="chip-label">Actuelle</span>
            <span class="chip-value">v{{ updateInfo.currentVersion }}</span>
          </div>
          <div class="version-arrow">➔</div>
          <div class="version-chip next">
            <span class="chip-label">Nouvelle</span>
            <span class="chip-value">v{{ updateInfo.version }}</span>
          </div>
        </div>

        <!-- Notes de version / Changelog -->
        <div v-if="updateInfo?.body" class="changelog-box">
          <div class="changelog-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notes-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span>Notes de mise à jour</span>
          </div>
          <div class="changelog-content">
            <pre>{{ updateInfo.body }}</pre>
          </div>
        </div>

        <!-- Barre de progression du téléchargement -->
        <div v-if="isDownloading || isUpdateReady" class="progress-section">
          <div class="progress-labels">
            <span class="progress-status-text">{{ statusMessage }}</span>
            <span class="progress-pct">{{ downloadProgress }}%</span>
          </div>
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              :style="{ width: `${downloadProgress}%` }"
              :class="{ complete: isUpdateReady }"
            ></div>
          </div>
          <div v-if="totalBytes > 0" class="progress-bytes">
            {{ formatBytes(downloadedBytes) }} / {{ formatBytes(totalBytes) }}
          </div>
        </div>

        <!-- Message d'erreur le cas échéant -->
        <div v-if="errorMessage" class="error-banner">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Pied de page & Actions -->
      <div class="modal-card-footer">
        <button
          v-if="!isDownloading && !isUpdateReady"
          class="btn-secondary"
          @click="$emit('close')"
        >
          Plus tard
        </button>

        <button
          v-if="!isDownloading && !isUpdateReady"
          class="btn-primary-update"
          @click="$emit('install')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Mettre à jour et redémarrer
        </button>

        <div v-else-if="isDownloading" class="downloading-indicator">
          <div class="spinner"></div>
          <span>Téléchargement en cours...</span>
        </div>

        <div v-else-if="isUpdateReady" class="ready-indicator">
          <span class="ready-icon">✔</span>
          <span>Redémarrage de l'application...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatBytes } from '../../composables/useAppUpdater.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  updateInfo: {
    type: Object,
    default: null
  },
  isChecking: {
    type: Boolean,
    default: false
  },
  isDownloading: {
    type: Boolean,
    default: false
  },
  isUpdateReady: {
    type: Boolean,
    default: false
  },
  downloadProgress: {
    type: Number,
    default: 0
  },
  downloadedBytes: {
    type: Number,
    default: 0
  },
  totalBytes: {
    type: Number,
    default: 0
  },
  statusMessage: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'install'])

function onBackdropClick() {
  if (!props.isDownloading && !props.isUpdateReady) {
    emit('close')
  }
}
</script>

<style scoped>
.update-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 18, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
  animation: fadeIn 0.2s ease-out;
}

.update-modal-card {
  width: 100%;
  max-width: 540px;
  background: linear-gradient(145deg, #16202d 0%, #0e141b 100%);
  border: 1px solid rgba(102, 192, 244, 0.25);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(102, 192, 244, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-update-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(102, 192, 244, 0.2) 0%, rgba(27, 40, 56, 0.6) 100%);
  border: 1px solid rgba(102, 192, 244, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #66c0f4;
}

.modal-update-icon.pulse {
  animation: pulseGlow 1.5s infinite;
}

.icon-svg {
  width: 22px;
  height: 22px;
}

.modal-title-group h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
}

.modal-subtitle-text {
  margin: 0.2rem 0 0 0;
  font-size: 0.8rem;
  color: var(--steam-text-muted);
}

.btn-close-modal {
  background: none;
  border: none;
  color: var(--steam-text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.4rem;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close-modal:hover {
  color: #fff;
}

.update-modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.version-badge-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.version-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.version-chip.current .chip-value {
  color: var(--steam-text-muted);
}

.version-chip.next .chip-value {
  color: #a1cd44;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(161, 205, 68, 0.4);
}

.chip-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--steam-text-muted);
  margin-bottom: 0.15rem;
}

.chip-value {
  font-size: 1rem;
  font-weight: 600;
}

.version-arrow {
  color: #66c0f4;
  font-size: 1.1rem;
}

.changelog-box {
  background: rgba(10, 15, 22, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.changelog-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.75rem;
  font-weight: 600;
  color: #c7d5e0;
}

.notes-icon {
  width: 14px;
  height: 14px;
  color: #66c0f4;
}

.changelog-content {
  padding: 0.9rem;
  max-height: 160px;
  overflow-y: auto;
}

.changelog-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--steam-text-main);
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(102, 192, 244, 0.2);
  border-radius: 10px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.progress-status-text {
  color: #c7d5e0;
  font-weight: 500;
}

.progress-pct {
  color: #66c0f4;
  font-weight: 700;
}

.progress-bar-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1999e3 0%, #66c0f4 100%);
  border-radius: 999px;
  transition: width 0.25s ease-out;
  box-shadow: 0 0 10px rgba(102, 192, 244, 0.5);
  will-change: transform, width;
}

.progress-bar-fill.complete {
  background: linear-gradient(90deg, #5c7e10 0%, #a1cd44 100%);
  box-shadow: 0 0 10px rgba(161, 205, 68, 0.5);
}

.progress-bytes {
  font-size: 0.7rem;
  color: var(--steam-text-muted);
  text-align: right;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: rgba(235, 87, 87, 0.12);
  border: 1px solid rgba(235, 87, 87, 0.35);
  border-radius: 10px;
  font-size: 0.8rem;
  color: #ff6b6b;
}

.modal-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.1rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--steam-text-muted);
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-primary-update {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #1999e3 0%, #0077b6 100%);
  border: 1px solid rgba(102, 192, 244, 0.5);
  color: #fff;
  padding: 0.6rem 1.3rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 119, 182, 0.4);
  transition: all 0.2s;
}

.btn-primary-update:hover {
  background: linear-gradient(135deg, #2eb5ff 0%, #0096c7 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 119, 182, 0.6);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.downloading-indicator,
.ready-indicator {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #66c0f4;
  font-weight: 600;
}

.ready-indicator {
  color: #a1cd44;
}

.ready-icon {
  font-size: 1rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(102, 192, 244, 0.3);
  border-top-color: #66c0f4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(102, 192, 244, 0.2);
  }
  50% {
    box-shadow: 0 0 18px rgba(102, 192, 244, 0.6);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
