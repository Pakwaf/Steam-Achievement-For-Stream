<template>
  <div class="tab-content-panel settings-streaming-tab">
    <!-- 1. Périphérique de sortie audio matériel (setSinkId) -->
    <div class="settings-block">
      <div class="block-header-row">
        <span class="block-icon">🎧</span>
        <div>
          <h4 class="block-title">Périphérique de Sortie Audio (setSinkId)</h4>
          <p class="block-sub">Règle la carte son ou le canal virtuel pour les alertes (ex : Elgato Wave Link SFX, Casque, Voicemeeter)</p>
        </div>
      </div>
      <div class="settings-field-row">
        <select
          v-model="audioSettings.deviceId"
          class="device-select-global"
        >
          <option v-for="dev in audioDevicesList" :key="dev.deviceId" :value="dev.deviceId">
            {{ dev.label }}
          </option>
        </select>
        <button class="btn-test-global-audio" :disabled="isPlayingTest" type="button" @click="$emit('test-audio')">
          {{ isPlayingTest ? '🔊 Lecture...' : '▶ Tester la sortie' }}
        </button>
      </div>
    </div>

    <!-- 2. Volume et activation sonore -->
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
          <input v-model="audioSettings.soundEnabled" type="checkbox" />
          <span class="slider"></span>
          <span class="toggle-text">{{ audioSettings.soundEnabled ? 'Sons Activés' : 'Mode Muet' }}</span>
        </label>

        <div class="global-volume-slider-box">
          <span class="volume-pct">{{ Math.round((audioSettings.soundVolume || 0.8) * 100) }}%</span>
          <input
            v-model.number="audioSettings.soundVolume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="range-slider"
            :disabled="!audioSettings.soundEnabled"
          />
        </div>
      </div>
    </div>

    <!-- 3. Port OBS et Réseau local -->
    <div class="settings-block">
      <div class="block-header-row">
        <span class="block-icon">🔌</span>
        <div>
          <h4 class="block-title">Port du Serveur Web OBS</h4>
          <p class="block-sub">Port utilisé pour la source navigateur OBS (par défaut 8080, bascule automatique si Streamer.bot est actif)</p>
        </div>
      </div>

      <div class="settings-field-row">
        <input
          v-model.number="port"
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

      <div class="settings-field-row lan-field-row">
        <label class="custom-checkbox-label">
          <input v-model="lanBroadcast" type="checkbox" class="styled-checkbox" />
          <span class="checkbox-label-text">Activer la diffusion LAN pour OBS (écoute sur 0.0.0.0)</span>
        </label>
        <p class="field-hint-text">
          🔒 <strong>Sécurité renforcée :</strong> Désactivé par défaut. Activez uniquement si OBS fonctionne sur un second PC dédié au streaming sur votre réseau local.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const audioSettings = defineModel('audioSettings', {
  type: Object,
  default: () => ({ deviceId: 'default', soundEnabled: true, soundVolume: 0.8 })
})
const port = defineModel('port', { type: Number, default: 8080 })
const lanBroadcast = defineModel('lanBroadcast', { type: Boolean, default: false })

defineProps({
  audioDevicesList: {
    type: Array,
    default: () => [{ deviceId: 'default', label: 'Périphérique Windows par défaut' }]
  },
  obsStatus: {
    type: Object,
    default: null
  },
  isPlayingTest: {
    type: Boolean,
    default: false
  }
})

defineEmits(['test-audio'])
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
  flex-wrap: wrap;
}

.device-select-global {
  flex: 1;
  background: rgba(8, 12, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 0.88rem;
  cursor: pointer;
  min-width: 200px;
}

.btn-test-global-audio {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.35);
  color: #66c0f4;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-test-global-audio:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.25);
  border-color: #66c0f4;
}

.settings-volume-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
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

.global-volume-slider-box {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 260px;
}

.volume-pct {
  font-family: monospace;
  font-size: 0.85rem;
  color: #66c0f4;
  font-weight: 700;
  min-width: 40px;
}

.range-slider {
  flex: 1;
  accent-color: #66c0f4;
  cursor: pointer;
}

.port-input {
  width: 120px;
  background: rgba(8, 12, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: #ffffff;
  font-family: monospace;
  font-size: 0.95rem;
}

.port-status-badge {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #4ade80;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
}

.port-status-badge.conflict {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fbbf24;
}

.lan-field-row {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}

.custom-checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.styled-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
  cursor: pointer;
}

.checkbox-label-text {
  font-size: 0.85rem;
  color: #e6edf3;
  font-weight: 600;
}

.field-hint-text {
  margin: 0;
  font-size: 0.78rem;
  color: #8b9bb4;
  line-height: 1.4;
}
</style>
