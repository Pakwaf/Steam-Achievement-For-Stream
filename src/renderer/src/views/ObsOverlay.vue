<template>
  <div class="obs-overlay-container">
    <!-- Indicateur d'état de connexion OBS (visible brièvement lors du setup) -->
    <div v-if="showDebugBanner" class="obs-debug-pill" :class="{ connected: isConnected }">
      <span class="dot"></span>
      <span>{{ isConnected ? 'OBS Connecté (ws://127.0.0.1:8080)' : 'Connexion au serveur OBS...' }}</span>
    </div>

    <!-- Style CSS universel (effets, tiers) + CSS du thème injecté -->
    <component :is="'style'">
      {{ visualEffectsCss }}
      {{ currentTheme.css || '' }}
    </component>

    <!-- Rendu HTML dynamique du succès avec placeholders remplacés -->
    <div
      v-if="isDisplaying && renderedHtml"
      class="dynamic-achievement-wrapper"
      :class="{ 'animate-enter': isEntering, 'animate-leave': isLeaving }"
      v-html="renderedHtml"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getVisualEffectsCss, enrichAchievementHtml } from '../utils/visualEffects.js'

const visualEffectsCss = getVisualEffectsCss()

const currentTheme = ref({
  html: '',
  css: '',
  visualEffect: 'none',
  hasAudio: false,
  audioUrl: '/audio/custom',
  soundEnabled: true,
  soundVolume: 0.8
})

const isDisplaying = ref(false)
const isEntering = ref(false)
const isLeaving = ref(false)
const renderedHtml = ref('')
const isConnected = ref(false)
const showDebugBanner = ref(true)

let socket = null
let reconnectTimer = null
let debugHideTimer = null
let dismissTimer = null
let leaveTimer = null
let reconnectAttempts = 0

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

onMounted(() => {
  document.body.classList.add('transparent-view')
  document.documentElement.classList.add('transparent-view')

  connectWebSocket()

  debugHideTimer = setTimeout(() => {
    showDebugBanner.value = false
  }, 4000)
})

function connectWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  // Alterne entre 127.0.0.1 et localhost pour contourner les soucis DNS Windows
  let host = '127.0.0.1'
  if (reconnectAttempts % 2 === 1) {
    host = 'localhost'
  }
  const wsUrl = `ws://${host}:8080`

  try {
    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      isConnected.value = true
      reconnectAttempts = 0
      socket.send(JSON.stringify({ type: 'OBS_CLIENT_READY' }))
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)

        if (payload.type === 'CUSTOMIZATION_UPDATED' && payload.data) {
          currentTheme.value = payload.data
        } else if (payload.type === 'ACHIEVEMENT_UNLOCKED' && payload.data) {
          triggerAchievement(payload.data)
        }
      } catch (err) {
        console.error('[ObsOverlay] Erreur payload:', err)
      }
    }

    socket.onclose = () => {
      isConnected.value = false
      reconnectAttempts++
      scheduleReconnect()
    }

    socket.onerror = () => {
      isConnected.value = false
      if (socket) socket.close()
    }
  } catch (err) {
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectWebSocket()
  }, 1500)
}

function triggerAchievement(data) {
  if (dismissTimer) clearTimeout(dismissTimer)
  if (leaveTimer) clearTimeout(leaveTimer)

  playNotificationSound()

  const tier = data.tier || 'common'
  const visualEffect = currentTheme.value.visualEffect || 'none'

  const rawReplaced = replacePlaceholders(currentTheme.value.html, data)
  renderedHtml.value = enrichAchievementHtml(rawReplaced, {
    tier,
    visualEffect
  })

  isDisplaying.value = true
  isEntering.value = true
  isLeaving.value = false

  dismissTimer = setTimeout(() => {
    isEntering.value = false
    isLeaving.value = true

    leaveTimer = setTimeout(() => {
      isDisplaying.value = false
      isLeaving.value = false
      renderedHtml.value = ''
    }, 400)
  }, 5000)
}

function replacePlaceholders(template, data) {
  if (!template) return ''
  const tier = data.tier || 'common'
  const defaultBadge = tier === 'master'
    ? '🏆 JEU COMPLÉTÉ (100%)'
    : (tier === 'rare' ? '★ SUCCÈS RARE (< 10%)' : 'SUCCÈS DÉBLOQUÉ')
  const rarity = data.rarityPercent ? `${data.rarityPercent}%` : (tier === 'rare' ? '4.8%' : '42.5%')
  const rawPlaytime = data.playtime_hours ?? data.playtimeHours ?? null
  const playtimeStr = (rawPlaytime !== null && rawPlaytime !== undefined && rawPlaytime !== '')
    ? `${rawPlaytime}h`
    : ''

  const title = (data.displayName || data.title || data.name || 'Succès Débloqué').toString()
  const description = (data.description || data.desc || '').toString()
  let icon = (data.icon || data.iconUrl || data.icon_url || data.iconPath || fallbackIcon).toString().trim()
  if (!icon) icon = fallbackIcon
  if (icon.startsWith('http://') && (icon.includes('steamstatic.com') || icon.includes('akamaihd.net') || icon.includes('steampowered.com'))) {
    icon = icon.replace('http://', 'https://')
  }

  const game = (data.gameName || data.game || data.game_name || 'Steam').toString()

  let html = template
    .replace(/\{title\}/gi, title)
    .replace(/\{description\}/gi, description)
    .replace(/\{icon\}/gi, icon)
    .replace(/\{iconUrl\}/gi, icon)
    .replace(/\{icon_url\}/gi, icon)
    .replace(/\{image\}/gi, icon)
    .replace(/\{img\}/gi, icon)
    .replace(/\{game\}/gi, game)
    .replace(/\{tier\}/gi, tier)
    .replace(/\{tierLabel\}/gi, defaultBadge)
    .replace(/\{rarity\}/gi, rarity)
    .replace(/\{playtime\}/gi, playtimeStr)

  if (tier !== 'common') {
    html = html.replace(/SUCCÈS DÉBLOQUÉ/g, defaultBadge)
  }

  return html
}

async function playNotificationSound() {
  if (!currentTheme.value.soundEnabled) return

  const volume = currentTheme.value.soundVolume ?? 0.8
  const audioUrl = `http://127.0.0.1:8080/audio/custom?t=${Date.now()}`

  try {
    const audio = new Audio(audioUrl)
    audio.volume = volume
    audio.onerror = () => { playDefaultChime(volume) }
    await audio.play()
  } catch {
    await playDefaultChime(volume)
  }
}

async function playDefaultChime(vol = 0.8) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.08 * vol, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.00, now + 0.12)
    gain2.gain.setValueAtTime(0.09 * vol, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.75)
  } catch {}
}

onUnmounted(() => {
  document.body.classList.remove('transparent-view')
  document.documentElement.classList.remove('transparent-view')
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (debugHideTimer) clearTimeout(debugHideTimer)
  if (dismissTimer) clearTimeout(dismissTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
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

.dynamic-achievement-wrapper {
  position: fixed;
  bottom: 0;
  right: 0;
  pointer-events: none;
  will-change: transform, opacity;
  transform: translateZ(0);
}
</style>
