<template>
  <div class="audio-config-card">
    <!-- En-tête : sélection du son pour le tier actuel -->
    <div class="audio-config-header">
      <div class="audio-status-box">
        <span class="audio-dot" :class="{ custom: Boolean(audioPath) }"></span>
        <div>
          <h4>Son de notification — {{ selectedTierName }}</h4>
          <p class="audio-sub">
            <template v-if="audioPath">
              Fichier personnalisé pour ce tier
            </template>
            <template v-else-if="selectedTier !== 'common' && fallbackAudioPath">
              Hérité du thème standard : {{ fallbackAudioPath.split(/[/\\]/).pop() }}
            </template>
            <template v-else>
              Carillon synthétisé natif par défaut ({{ selectedTierName }})
            </template>
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
          title="Revenir au carillon ou au son hérité"
          @click="$emit('remove-audio-file')"
        >
          ✕ Retirer
        </button>
      </div>
    </div>

    <!-- Affichage du chemin du fichier configuré -->
    <div v-if="audioPath" class="audio-file-path-row">
      <span class="path-label">Fichier actif :</span>
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
            {{ isPlayingSound ? '🔊 Test...' : '▶ Tester ce son' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Information de sortie audio globale -->
    <div class="global-audio-notice-card">
      <div class="notice-icon">🎧</div>
      <div class="notice-text">
        <p class="notice-title">Sortie audio de l'application</p>
        <p class="notice-desc">
          Le périphérique audio de sortie (casque, Wave Link SFX, etc.) se configure désormais de manière centralisée dans les <strong>Paramètres Généraux ⚙️</strong> de l'application.
        </p>
      </div>
    </div>

    <!-- Astuce discrète OBS Studio -->
    <div class="obs-sound-tips-card">
      <p class="tips-note">
        💡 <strong>OBS Studio</strong> : Si vous cochez <em>"Contrôler l'audio via OBS"</em> dans votre source navigateur, réglez la piste sur <strong>"Surveillance et sortie"</strong> dans le Mélangeur Audio OBS pour l'entendre dans vos retours.
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
  fallbackAudioPath: {
    type: String,
    default: null
  },
  selectedTier: {
    type: String,
    default: 'common'
  },
  selectedTierName: {
    type: String,
    default: 'Standard'
  },
  soundEnabled: {
    type: Boolean,
    default: true
  },
  soundVolume: {
    type: Number,
    default: 0.8
  },
  isPlayingSound: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'update:soundEnabled',
  'update:soundVolume',
  'browse-audio-file',
  'remove-audio-file',
  'play-test-sound'
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
  flex-wrap: wrap;
}

.audio-status-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.audio-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #66c0f4;
  box-shadow: 0 0 10px rgba(102, 192, 244, 0.5);
}

.audio-dot.custom {
  background: #a1cd44;
  box-shadow: 0 0 10px rgba(161, 205, 68, 0.6);
}

.audio-status-box h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
}

.audio-sub {
  margin: 0.2rem 0 0 0;
  font-size: 0.78rem;
  color: #8b9bb4;
}

.audio-file-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-select-file {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.35);
  color: #66c0f4;
  padding: 0.45rem 0.9rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-select-file:hover {
  background: rgba(102, 192, 244, 0.28);
  border-color: #66c0f4;
  color: #fff;
}

.btn-clear-audio {
  background: rgba(255, 75, 75, 0.15);
  border: 1px solid rgba(255, 75, 75, 0.35);
  color: #ff6b6b;
  padding: 0.45rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear-audio:hover {
  background: rgba(255, 75, 75, 0.28);
  border-color: #ff4d4d;
  color: #fff;
}

.audio-file-path-row {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.6rem 0.9rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.path-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #a1cd44;
}

.path-text {
  font-size: 0.75rem;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.audio-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 1.1rem;
  border-radius: 8px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.setting-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #9cb3ce;
}

.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
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

.global-audio-notice-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  padding: 0.85rem 1rem;
}

.notice-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.notice-text {
  flex: 1;
}

.notice-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #e2e8f0;
}

.notice-desc {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.4;
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
