<template>
  <div class="tab-content-panel settings-app-tab">
    <!-- 1. Démarrage avec Windows -->
    <div class="settings-block">
      <div class="block-header-row">
        <span class="block-icon">🚀</span>
        <div>
          <h4 class="block-title">Démarrage avec Windows</h4>
          <p class="block-sub">Lancer automatiquement SteamOverlayStream en tâche de fond dès le démarrage de votre PC</p>
        </div>
      </div>
      <div class="settings-field-row">
        <label class="toggle-switch">
          <input v-model="autostart" type="checkbox" />
          <span class="slider"></span>
          <span class="toggle-text">{{ autostart ? 'Activé (Démarrage automatique)' : 'Désactivé' }}</span>
        </label>
      </div>
    </div>

    <!-- 2. Thème de l'interface (Clair / Sombre) -->
    <div class="settings-block">
      <div class="block-header-row">
        <span class="block-icon">🌓</span>
        <div>
          <h4 class="block-title">Thème de l'Application</h4>
          <p class="block-sub">Choisissez l'apparence visuelle de l'interface du tableau de bord</p>
        </div>
      </div>
      <div class="theme-choice-row">
        <button
          class="theme-preset-card"
          :class="{ active: appTheme === 'dark' }"
          type="button"
          @click="selectTheme('dark')"
        >
          <div class="theme-preview dark-preview"></div>
          <span class="theme-preset-name">Mode Sombre (Steam Dark)</span>
        </button>
        <button
          class="theme-preset-card"
          :class="{ active: appTheme === 'light' }"
          type="button"
          @click="selectTheme('light')"
        >
          <div class="theme-preview light-preview"></div>
          <span class="theme-preset-name">Mode Clair (Modern Light)</span>
        </button>
      </div>
    </div>

    <!-- 3. Mises à jour logicielles (Auto-Updater) -->
    <div class="settings-block">
      <div class="block-header-row">
        <span class="block-icon">🔄</span>
        <div>
          <h4 class="block-title">Mise à Jour de l'Application</h4>
          <p class="block-sub">Recherchez et installez les dernières versions de SteamOverlayStream</p>
        </div>
      </div>
      <div class="settings-field-row updater-field-row">
        <div class="updater-status-info">
          <span class="current-version-text">Version installée : <strong>v{{ currentAppVersion }}</strong></span>
          <span v-if="updaterStatusMessage" class="updater-status-badge" :class="{ error: updaterError }">
            {{ updaterStatusMessage }}
          </span>
        </div>
        <button
          class="btn-check-updates"
          :disabled="isCheckingUpdates || isDownloadingUpdates"
          type="button"
          @click="handleCheckUpdates"
        >
          <span v-if="isCheckingUpdates">⏳ Recherche...</span>
          <span v-else-if="isDownloadingUpdates">📥 Téléchargement...</span>
          <span v-else>🔍 Rechercher</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppUpdater } from '../../composables/useAppUpdater.js'

const autostart = defineModel('autostart', { type: Boolean, default: false })
const appTheme = defineModel('appTheme', { type: String, default: 'dark' })

const emit = defineEmits(['update-theme'])

const {
  isChecking: isCheckingUpdates,
  isDownloading: isDownloadingUpdates,
  statusMessage: updaterStatusMessage,
  errorMessage: updaterError,
  currentAppVersion,
  checkForUpdates
} = useAppUpdater()

function handleCheckUpdates() {
  checkForUpdates(true)
}

function selectTheme(theme) {
  appTheme.value = theme
  emit('update-theme', theme)
}
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

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: all 0.25s ease;
}

.toggle-switch input:checked + .slider {
  background-color: #2563eb;
}

.toggle-switch input:checked + .slider:before {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 0.85rem;
  color: #e6edf3;
  font-weight: 600;
}

.theme-choice-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.theme-preset-card {
  background: rgba(8, 12, 18, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #e6edf3;
}

.theme-preset-card:hover {
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.theme-preset-card.active {
  border-color: #66c0f4;
  box-shadow: 0 0 12px rgba(102, 192, 244, 0.3);
  background: rgba(102, 192, 244, 0.08);
}

.theme-preview {
  width: 100%;
  height: 48px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dark-preview {
  background: linear-gradient(135deg, #0b0e14 0%, #16202f 100%);
}

.light-preview {
  background: linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%);
}

.theme-preset-name {
  font-size: 0.8rem;
  font-weight: 600;
}

.updater-field-row {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.updater-status-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.current-version-text {
  font-size: 0.82rem;
  color: #e6edf3;
}

.updater-status-badge {
  font-size: 0.75rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
}

.updater-status-badge.error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.3);
}

.btn-check-updates {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-check-updates:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-check-updates:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
