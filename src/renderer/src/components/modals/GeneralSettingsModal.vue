<template>
  <div v-if="isOpen" class="api-key-modal-overlay" @click.self="$emit('close')">
    <div class="api-key-modal-card general-settings-modal">
      <!-- En-tête de la modale -->
      <div class="modal-card-header">
        <div class="modal-title-group">
          <div class="settings-header-icon-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27.1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.108-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3>Paramètres de l'Application</h3>
            <p class="modal-subtitle-text">Configurez le comportement général, la détection Steam et votre flux OBS</p>
          </div>
        </div>
        <button class="btn-close-modal" title="Fermer" type="button" @click="$emit('close')">✕</button>
      </div>

      <!-- Barre d'onglets stricte et catégorisée -->
      <div class="settings-tabs-nav">
        <button
          class="settings-tab-btn"
          :class="{ active: activeTab === 'app' }"
          type="button"
          @click="activeTab = 'app'"
        >
          <span class="tab-icon">💻</span>
          <span>Général / Application</span>
        </button>
        <button
          class="settings-tab-btn"
          :class="{ active: activeTab === 'steam' }"
          type="button"
          @click="activeTab = 'steam'"
        >
          <span class="tab-icon">🎯</span>
          <span>Steam & Tracker</span>
        </button>
        <button
          class="settings-tab-btn"
          :class="{ active: activeTab === 'stream' }"
          type="button"
          @click="activeTab = 'stream'"
        >
          <span class="tab-icon">📡</span>
          <span>Streaming (OBS / Audio)</span>
        </button>
      </div>

      <!-- Corps du formulaire selon l'onglet actif (Sous-composants modulaires) -->
      <div class="general-settings-body">
        <SettingsAppTab
          v-if="activeTab === 'app'"
          v-model:autostart="localAutostart"
          v-model:app-theme="appTheme"
          @update-theme="setAppTheme"
        />

        <SettingsSteamTab
          v-else-if="activeTab === 'steam'"
          v-model:polling-interval="localPollingInterval"
          :tracker-status="trackerStatus"
          @open-api-key="$emit('open-api-key')"
        />

        <SettingsStreamingTab
          v-else-if="activeTab === 'stream'"
          v-model:audio-settings="localAudioSettings"
          v-model:port="localPort"
          v-model:lan-broadcast="localLanBroadcast"
          :audio-devices-list="audioDevicesList"
          :obs-status="obsStatus"
          :is-playing-test="isPlayingTest"
          @test-audio="$emit('test-audio')"
        />
      </div>

      <div v-if="statusMessage" class="success-banner">
        <span>{{ statusMessage }}</span>
      </div>

      <div class="modal-actions-footer">
        <button class="btn-secondary" type="button" @click="$emit('close')">Fermer</button>
        <button class="btn-save-modal-key" type="button" @click="handleSave">
          Enregistrer les Paramètres
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import SettingsAppTab from '../settings/SettingsAppTab.vue'
import SettingsSteamTab from '../settings/SettingsSteamTab.vue'
import SettingsStreamingTab from '../settings/SettingsStreamingTab.vue'

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
  trackerStatus: {
    type: Object,
    default: null
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

const emit = defineEmits(['close', 'save', 'test-audio', 'open-api-key'])

// Onglet actif : 'app' | 'steam' | 'stream'
const activeTab = ref('app')

// Paramètres de l'onglet Application
const localAutostart = ref(false)
const appTheme = ref('dark') // 'dark' | 'light'

// Paramètres de l'onglet Steam
const localPollingInterval = ref(1500)

// Paramètres de l'onglet Streaming
const localAudioSettings = ref({
  deviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
})
const localPort = ref(8080)
const localLanBroadcast = ref(false)

function loadLocalAppSettings() {
  if (typeof localStorage !== 'undefined') {
    const savedAutostart = localStorage.getItem('steam_autostart_enabled')
    if (savedAutostart !== null) {
      localAutostart.value = savedAutostart === 'true'
    }

    const savedTheme = localStorage.getItem('steam_app_theme')
    if (savedTheme) {
      setAppTheme(savedTheme)
    }

    const savedPolling = localStorage.getItem('steam_tracker_polling')
    if (savedPolling) {
      localPollingInterval.value = parseInt(savedPolling, 10) || 1500
    }
  }
}

function setAppTheme(theme) {
  appTheme.value = theme
  if (typeof document !== 'undefined') {
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('steam_app_theme', theme)
  }
}

onMounted(() => {
  loadLocalAppSettings()
})

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
  () => props.obsStatus,
  (val) => {
    if (val) {
      localLanBroadcast.value = Boolean(val.lanBroadcastEnabled)
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadLocalAppSettings()
      if (props.audioSettings) {
        localAudioSettings.value = { ...props.audioSettings }
      }
      localPort.value = props.obsPort || 8080
      localLanBroadcast.value = Boolean(props.obsStatus?.lanBroadcastEnabled)
    }
  }
)

function handleSave() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('steam_autostart_enabled', String(localAutostart.value))
    localStorage.setItem('steam_tracker_polling', String(localPollingInterval.value))
    localStorage.setItem('steam_app_theme', appTheme.value)
  }

  emit('save', {
    audioSettings: { ...localAudioSettings.value },
    obsPort: localPort.value,
    obsLanBroadcast: localLanBroadcast.value,
    autostart: localAutostart.value,
    pollingInterval: localPollingInterval.value,
    appTheme: appTheme.value
  })
}
</script>

<style scoped>
.api-key-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.api-key-modal-card.general-settings-modal {
  width: 90%;
  max-width: 680px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: #101622;
  border: 1px solid rgba(102, 192, 244, 0.25);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(102, 192, 244, 0.15);
  overflow: hidden;
  animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-header-icon-glow {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.35);
  border-radius: 10px;
  color: #66c0f4;
}

.settings-icon {
  width: 22px;
  height: 22px;
}

.modal-title-group h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #ffffff;
}

.modal-subtitle-text {
  margin: 2px 0 0 0;
  font-size: 0.8rem;
  color: #8b9bb4;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #8b9bb4;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
}

.btn-close-modal:hover {
  color: #ffffff;
}

.settings-tabs-nav {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 12, 18, 0.5);
  padding: 0 1.75rem;
  gap: 8px;
}

.settings-tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #8b9bb4;
  padding: 12px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-tab-btn:hover {
  color: #ffffff;
}

.settings-tab-btn.active {
  color: #66c0f4;
  border-bottom-color: #66c0f4;
}

.tab-icon {
  font-size: 1rem;
}

.general-settings-body {
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  flex: 1;
}

.success-banner {
  margin: 0 1.75rem;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #4ade80;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.modal-actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 1.25rem 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 12, 18, 0.5);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e6edf3;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
}

.btn-save-modal-key {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: 1px solid rgba(147, 197, 253, 0.3);
  color: #ffffff;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-modal-key:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
</style>
