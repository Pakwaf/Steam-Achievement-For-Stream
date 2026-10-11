<template>
  <div class="obs-overlay-container">
    <!-- Indicateur d'état de connexion OBS (visible brièvement lors du setup) -->
    <div v-if="showDebugBanner" class="obs-debug-pill" :class="{ connected: isConnected }">
      <span class="dot"></span>
      <span>{{ isConnected ? 'OBS Connecté (ws://localhost:8080)' : 'Connexion au serveur OBS...' }}</span>
    </div>

    <!-- Bannière de succès animée (5 secondes) -->
    <AchievementBanner
      :achievement="currentAchievement"
      :duration="5000"
      position="bottom-right"
      @dismiss="onDismiss"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AchievementBanner from '../components/AchievementBanner.vue'

const currentAchievement = ref(null)
const isConnected = ref(false)
const showDebugBanner = ref(true)

let socket = null
let reconnectTimer = null
let debugHideTimer = null

onMounted(() => {
  // S'assurer que le body est 100% transparent pour la source OBS Browser
  document.body.classList.add('transparent-view')
  document.documentElement.classList.add('transparent-view')

  connectWebSocket()

  // Masquer discrètement la pilule de débogage après 4 secondes pour garder la source 100% propre
  debugHideTimer = setTimeout(() => {
    showDebugBanner.value = false
  }, 4000)
})

function connectWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  // Déterminer l'URL du WebSocket (défaut ws://localhost:8080)
  const host = window.location.hostname || 'localhost'
  const wsUrl = `ws://${host}:8080`

  console.log(`[ObsOverlay] Connexion WebSocket vers ${wsUrl}...`)

  try {
    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      console.log('[ObsOverlay] ✔ Connecté au serveur OBS')
      isConnected.value = true
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        console.log('[ObsOverlay] Message WebSocket reçu:', payload.type)

        if (payload.type === 'ACHIEVEMENT_UNLOCKED' && payload.data) {
          currentAchievement.value = payload.data
        } else if (payload.type === 'CONNECTED') {
          console.log('[ObsOverlay]', payload.message)
        }
      } catch (err) {
        console.error('[ObsOverlay] Erreur analyse payload WebSocket:', err)
      }
    }

    socket.onclose = () => {
      console.warn('[ObsOverlay] Déconnecté du serveur OBS. Tentative de reconnexion dans 3s...')
      isConnected.value = false
      scheduleReconnect()
    }

    socket.onerror = (err) => {
      console.error('[ObsOverlay] Erreur WebSocket:', err)
      isConnected.value = false
      if (socket) socket.close()
    }
  } catch (err) {
    console.error('[ObsOverlay] Impossible de créer la connexion WebSocket:', err)
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectWebSocket()
  }, 3000)
}

function onDismiss() {
  currentAchievement.value = null
}

onUnmounted(() => {
  document.body.classList.remove('transparent-view')
  document.documentElement.classList.remove('transparent-view')

  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (debugHideTimer) clearTimeout(debugHideTimer)
  if (socket) {
    socket.close()
    socket = null
  }
})
</script>

<style scoped>
.obs-overlay-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: transparent !important;
  overflow: hidden;
  position: relative;
}

/* Pilule discrète de diagnostic lors de l'intégration dans OBS */
.obs-debug-pill {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 999px;
  background: rgba(14, 20, 27, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #a4b4cc;
  backdrop-filter: blur(8px);
  z-index: 10;
  transition: opacity 0.5s ease;
}

.obs-debug-pill.connected {
  border-color: rgba(92, 126, 16, 0.6);
  color: #a1cd44;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff5555;
}

.connected .dot {
  background: #a1cd44;
  box-shadow: 0 0 6px #a1cd44;
}
</style>
