<template>
  <div v-if="isOpen" class="api-key-modal-overlay" @click.self="$emit('close')">
    <div class="api-key-modal-card general-settings-modal">
      <div class="modal-card-header">
        <div class="modal-title-group">
          <span class="modal-key-icon">⚙️</span>
          <div>
            <h3>Paramètres Généraux de l'Application</h3>
            <p class="modal-subtitle-text">Gérez la sortie audio globale Windows, les volumes et vos flux OBS</p>
          </div>
        </div>
        <button class="btn-close-modal" title="Fermer" @click="$emit('close')">✕</button>
      </div>

      <div class="general-settings-body">
        <!-- 1. Sortie audio globale Windows -->
        <div class="settings-block">
          <div class="block-header-row">
            <span class="block-icon">🎧</span>
            <div>
              <h4 class="block-title">Sortie Audio Globale (Windows)</h4>
              <p class="block-sub">Règle le périphérique de sortie audio par défaut pour toutes vos alertes (ex : Elgato Wave Link SFX, Casque, Enceintes)</p>
            </div>
          </div>

          <div class="settings-field-row">
            <select
              v-model="localAudioSettings.deviceId"
              class="device-select-global"
            >
              <option v-for="dev in audioDevicesList" :key="dev.deviceId" :value="dev.deviceId">
                {{ dev.label }}
              </option>
            </select>
            <button class="btn-test-global-audio" :disabled="isPlayingTest" @click="$emit('test-audio')">
              {{ isPlayingTest ? '🔊 Lecture...' : '▶ Tester la sortie' }}
            </button>
          </div>
        </div>

        <!-- 2. Volume sonore global et statut -->
        <div class="settings-block">
          <div class="block-header-row">
            <span class="block-icon">🔊</span>
            <div>
              <h4 class="block-title">Volume et Lecture Sonore Globale</h4>
              <p class="block-sub">Contrôlez l'activation et le volume général de notification des succès</p>
            </div>
          </div>

          <div class="settings-volume-controls">
            <label class="toggle-switch">
              <input v-model="localAudioSettings.soundEnabled" type="checkbox" />
              <span class="slider"></span>
              <span class="toggle-text">{{ localAudioSettings.soundEnabled ? 'Sons Activés' : 'Mode Muet' }}</span>
            </label>

            <div class="global-volume-slider-box">
              <span class="volume-pct">{{ Math.round((localAudioSettings.soundVolume || 0.8) * 100) }}%</span>
              <input
                v-model.number="localAudioSettings.soundVolume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                class="range-slider"
                :disabled="!localAudioSettings.soundEnabled"
              />
            </div>
          </div>
        </div>

        <!-- 3. Port OBS et Réseau -->
        <div class="settings-block">
          <div class="block-header-row">
            <span class="block-icon">🔌</span>
            <div>
              <h4 class="block-title">Port du Serveur Local OBS</h4>
              <p class="block-sub">Port utilisé pour la source navigateur OBS (par défaut 8080, bascule automatique si Streamer.bot est actif)</p>
            </div>
          </div>

          <div class="settings-field-row">
            <input
              v-model.number="localPort"
              type="number"
              min="1024"
              max="65535"
              class="key-text-input port-input"
              placeholder="8080"
            />
            <span class="port-status-badge" :class="{ conflict: obsStatus?.hasPortConflict }">
              Port actif : {{ obsStatus?.port || 8080 }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="statusMessage" class="success-banner">
        <span>{{ statusMessage }}</span>
      </div>

      <div class="modal-actions-footer">
        <button class="btn-secondary" @click="$emit('close')">Fermer</button>
        <button class="btn-save-modal-key" @click="handleSave">
          Enregistrer les Paramètres
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  audioSettings: {
    type: Object,
    default: () => ({
      deviceId: 'default',
      soundEnabled: true,
      soundVolume: 0.8
    })
  },
  audioDevicesList: {
    type: Array,
    default: () => [{ deviceId: 'default', label: 'Périphérique Windows par défaut' }]
  },
  obsStatus: {
    type: Object,
    default: null
  },
  obsPort: {
    type: Number,
    default: 8080
  },
  isPlayingTest: {
    type: Boolean,
    default: false
  },
  statusMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'save', 'test-audio'])

const localAudioSettings = ref({
  deviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
})
const localPort = ref(8080)

watch(
  () => props.audioSettings,
  (val) => {
    if (val) {
      localAudioSettings.value = { ...val }
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.obsPort,
  (val) => {
    localPort.value = val || 8080
  },
  { immediate: true }
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.audioSettings) {
        localAudioSettings.value = { ...props.audioSettings }
      }
      localPort.value = props.obsPort || 8080
    }
  }
)

function handleSave() {
  emit('save', {
    audioSettings: { ...localAudioSettings.value },
    obsPort: localPort.value
  })
}
</script>

<style scoped>
.api-key-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem;
}

.api-key-modal-card {
  background: #171d25;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
  animation: fadeIn 0.25s ease;
}

.general-settings-modal {
  max-width: 580px;
  width: 95vw;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-key-icon {
  font-size: 1.4rem;
}

.modal-title-group h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.modal-subtitle-text {
  margin: 0.2rem 0 0 0;
  font-size: 0.78rem;
  color: #8b9bb4;
}

.btn-close-modal {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  line-height: 1;
}

.btn-close-modal:hover {
  color: #fff;
}

.general-settings-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 1.25rem 0;
}

.settings-block {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.block-header-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.block-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.block-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
}

.block-sub {
  margin: 0.2rem 0 0 0;
  font-size: 0.74rem;
  color: #8b9bb4;
  line-height: 1.35;
}

.settings-field-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.device-select-global {
  flex: 1;
  background: rgba(16, 24, 34, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  outline: none;
}

.device-select-global:focus {
  border-color: #66c0f4;
}

.btn-test-global-audio {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  padding: 0.55rem 0.95rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-test-global-audio:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.28);
  box-shadow: 0 0 12px rgba(102, 192, 244, 0.3);
}

.settings-volume-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  position: relative;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.slider {
  width: 38px;
  height: 22px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 34px;
  position: relative;
  transition: 0.3s;
}

.slider::before {
  content: "";
  position: absolute;
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .slider {
  background-color: #a1cd44;
}

input:checked + .slider::before {
  transform: translateX(16px);
}

.toggle-text {
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
}

.global-volume-slider-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 200px;
}

.volume-pct {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f0c330;
  min-width: 42px;
}

.range-slider {
  flex: 1;
  accent-color: #66c0f4;
}

.key-text-input {
  background: rgba(15, 21, 29, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  color: #fff;
  font-family: monospace;
  font-size: 0.85rem;
}

.key-text-input:focus {
  outline: none;
  border-color: #66c0f4;
}

.port-input {
  width: 140px;
}

.port-status-badge {
  font-size: 0.76rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  color: #9cb3ce;
}

.port-status-badge.conflict {
  border-color: #f0c330;
  color: #ffd644;
}

.success-banner {
  background: rgba(92, 126, 16, 0.25);
  border: 1px solid rgba(161, 205, 68, 0.5);
  color: #c7eb74;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-top: 1rem;
}

.modal-actions-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--steam-text-main);
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-save-modal-key {
  background: linear-gradient(135deg, #66c0f4 0%, #1999e3 100%);
  border: none;
  color: #fff;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(102, 192, 244, 0.3);
}

.btn-save-modal-key:hover {
  background: linear-gradient(135deg, #7ad0ff 0%, #20a7f5 100%);
}
</style>
