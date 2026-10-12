<template>
  <div class="audio-config-card">
    <div class="audio-config-header">
      <div class="audio-status-box">
        <span class="audio-dot" :class="{ custom: audioPath }"></span>
        <div>
          <h4>Son de notification</h4>
          <p class="audio-sub">
            {{ audioPath ? 'Fichier personnalisé' : 'Son standard par défaut' }}
          </p>
        </div>
      </div>

      <div class="audio-file-actions">
        <button class="btn-select-file" @click="$emit('browse-audio-file')">
          📁 Choisir un fichier
        </button>
        <button
          v-if="audioPath"
          class="btn-clear-audio"
          title="Revenir au son standard"
          @click="$emit('remove-audio-file')"
        >
          ✕ Retirer
        </button>
      </div>
    </div>

    <div v-if="audioPath" class="audio-file-path-row">
      <span class="path-label">Fichier :</span>
      <code class="path-text" :title="audioPath">{{ audioPath }}</code>
    </div>

    <!-- Paramètres de lecture et volume -->
    <div class="audio-settings-grid">
      <div class="setting-item">
        <label class="setting-label">Lecture audio :</label>
        <label class="toggle-switch">
          <input
            :checked="soundEnabled"
            type="checkbox"
            @change="$emit('update:soundEnabled', $event.target.checked)"
          />
          <span class="slider"></span>
          <span class="toggle-text">{{ soundEnabled ? 'Activé' : 'Muet' }}</span>
        </label>
      </div>

      <div class="setting-item">
        <label class="setting-label">Volume ({{ Math.round((soundVolume || 0) * 100) }}%) :</label>
        <div class="volume-slider-row">
          <input
            :value="soundVolume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="range-slider"
            :disabled="!soundEnabled"
            @input="$emit('update:soundVolume', Number($event.target.value))"
          />
          <button
            class="btn-play-test-sound"
            :disabled="!soundEnabled"
            @click="$emit('play-test-sound')"
          >
            {{ isPlayingSound ? '🔊 Test...' : '▶ Tester' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sélecteur de sortie audio -->
    <div class="device-selector-card">
      <div class="setting-item">
        <div class="device-label-row">
          <label class="setting-label">Sortie audio de l'application :</label>
          <button class="btn-refresh-devices" title="Actualiser les périphériques" @click="$emit('refresh-audio-devices')">
            🔄 Actualiser
          </button>
        </div>
        <select
          :value="audioDeviceId"
          class="device-select"
          @change="$emit('update:audioDeviceId', $event.target.value)"
        >
          <option v-for="dev in audioDevices" :key="dev.deviceId" :value="dev.deviceId">
            {{ dev.label }}
          </option>
        </select>
        <p class="device-hint">
          Sélectionnez le canal de sortie audio souhaité (casque, Wave Link SFX, etc.).
        </p>
      </div>
    </div>

    <!-- Astuce discrète OBS Studio -->
    <div class="obs-sound-tips-card">
      <p class="tips-note">
        💡 <strong>OBS Studio</strong> : Si vous activez <em>"Contrôler l'audio via OBS"</em> dans votre source navigateur, réglez-la sur <strong>"Surveillance et sortie"</strong> dans le Mélangeur Audio pour l'entendre dans votre casque.
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  audioPath: {
    type: String,
    default: null
  },
  soundEnabled: {
    type: Boolean,
    default: true
  },
  soundVolume: {
    type: Number,
    default: 0.8
  },
  audioDeviceId: {
    type: String,
    default: 'default'
  },
  audioDevices: {
    type: Array,
    default: () => []
  },
  isPlayingSound: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'update:soundEnabled',
  'update:soundVolume',
  'update:audioDeviceId',
  'browse-audio-file',
  'remove-audio-file',
  'play-test-sound',
  'refresh-audio-devices'
])
</script>

<style scoped>
.audio-config-card {
  background: rgba(12, 18, 26, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.audio-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.audio-status-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.audio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #a1cd44;
}

.audio-dot.custom {
  background: #a855f7;
  box-shadow: 0 0 8px #a855f7;
}

.audio-status-box h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #fff;
  font-weight: 700;
}

.audio-sub {
  margin: 0.15rem 0 0 0;
  font-size: 0.75rem;
  color: #8b9bb4;
}

.audio-file-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-select-file {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-select-file:hover {
  background: rgba(102, 192, 244, 0.28);
}

.btn-clear-audio {
  background: rgba(235, 87, 87, 0.15);
  border: 1px solid rgba(235, 87, 87, 0.35);
  color: #ff8080;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear-audio:hover {
  background: rgba(235, 87, 87, 0.25);
}

.audio-file-path-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  font-size: 0.78rem;
}

.path-label {
  color: #8b9bb4;
}

.path-text {
  color: #c084fc;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-settings-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 1.1rem;
  border-radius: 8px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #c5d4e8;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
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
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
}

.volume-slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.range-slider {
  flex: 1;
  accent-color: #66c0f4;
}

.btn-play-test-sound {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-play-test-sound:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.2);
  border-color: #66c0f4;
  color: #66c0f4;
}

.device-selector-card {
  background: rgba(0, 0, 0, 0.2);
  padding: 1.1rem;
  border-radius: 8px;
}

.device-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-refresh-devices {
  background: none;
  border: none;
  color: #66c0f4;
  font-size: 0.74rem;
  cursor: pointer;
}

.device-select {
  background: rgba(16, 24, 34, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  outline: none;
}

.device-hint {
  margin: 0.25rem 0 0 0;
  font-size: 0.72rem;
  color: #7d8ea6;
}

.obs-sound-tips-card {
  background: rgba(102, 192, 244, 0.06);
  border: 1px solid rgba(102, 192, 244, 0.2);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.tips-note {
  margin: 0;
  font-size: 0.76rem;
  color: #a4c2e6;
  line-height: 1.45;
}
</style>
