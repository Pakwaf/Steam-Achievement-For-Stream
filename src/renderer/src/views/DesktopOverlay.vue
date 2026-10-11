<template>
  <div class="desktop-overlay-container">
    <!-- Style CSS utilisateur injecté dynamiquement -->
    <component :is="'style'">
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

const currentTheme = ref({
  html: '',
  css: '',
  audioPath: null,
  soundEnabled: true,
  soundVolume: 0.8
})

const isDisplaying = ref(false)
const isEntering = ref(false)
const isLeaving = ref(false)
const renderedHtml = ref('')

let unsubs = []
let dismissTimer = null
let leaveTimer = null

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

onMounted(async () => {
  // Transparence complète
  document.body.classList.add('transparent-view')
  document.documentElement.classList.add('transparent-view')

  if (window.steamAPI) {
    // 1. Récupérer le thème actuel sauvegardé
    try {
      if (window.steamAPI.getCustomization) {
        const theme = await window.steamAPI.getCustomization()
        if (theme) currentTheme.value = theme
      }
    } catch (err) {
      console.error('[DesktopOverlay] Erreur chargement thème:', err)
    }

    // 2. Écouter les mises à jour en direct du thème
    if (window.steamAPI.onCustomizationUpdated) {
      const unsubTheme = window.steamAPI.onCustomizationUpdated((newTheme) => {
        console.log('[DesktopOverlay] 🎨 Mise à jour du thème reçue')
        currentTheme.value = newTheme
      })
      unsubs.push(unsubTheme)
    }

    // 3. Écouter les succès débloqués (réels ou tests)
    if (window.steamAPI.onAchievementUnlocked) {
      const unsubAch = window.steamAPI.onAchievementUnlocked((achievement) => {
        console.log('[DesktopOverlay] 🏆 Succès reçu :', achievement.displayName)
        triggerAchievement(achievement)
      })
      unsubs.push(unsubAch)
    }
  }
})

// Déclenche l'affichage dynamique pendant 5 secondes avec son et animations
function triggerAchievement(achievement) {
  if (dismissTimer) clearTimeout(dismissTimer)
  if (leaveTimer) clearTimeout(leaveTimer)

  // 1. Jouer le son
  playNotificationSound()

  // 2. Remplacer les placeholders {title}, {description}, {icon}, {game}
  renderedHtml.value = replacePlaceholders(currentTheme.value.html, achievement)
  isDisplaying.value = true
  isEntering.value = true
  isLeaving.value = false

  // 3. Après 5 secondes : animation de sortie
  dismissTimer = setTimeout(() => {
    isEntering.value = false
    isLeaving.value = true

    // 4. Fin de l'animation de sortie : masquage
    leaveTimer = setTimeout(() => {
      isDisplaying.value = false
      isLeaving.value = false
      renderedHtml.value = ''
    }, 400)
  }, 5000)
}

function replacePlaceholders(template, data) {
  if (!template) return ''
  const title = escapeHtml(data.displayName || 'Succès Débloqué')
  const description = escapeHtml(data.description || '')
  const icon = data.icon || fallbackIcon
  const game = escapeHtml(data.gameName || 'Steam')

  return template
    .replace(/\{title\}/gi, title)
    .replace(/\{description\}/gi, description)
    .replace(/\{icon\}/gi, icon)
    .replace(/\{game\}/gi, game)
}

function escapeHtml(text) {
  if (!text) return ''
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return text.toString().replace(/[&<>"']/g, (m) => map[m])
}

// Joue le son personnalisé via Base64 ou l'endpoint local ou le carillon Web Audio
async function playNotificationSound() {
  if (!currentTheme.value.soundEnabled) return

  const volume = currentTheme.value.soundVolume ?? 0.8

  // 1. Essayer d'abord la récupération directe en Data URL Base64
  if (currentTheme.value.audioPath && window.steamAPI?.getAudioData) {
    try {
      const audioInfo = await window.steamAPI.getAudioData()
      if (audioInfo?.hasAudio && audioInfo.dataUrl) {
        const audio = new Audio(audioInfo.dataUrl)
        audio.volume = volume
        audio.onerror = () => { playDefaultChime(volume) }
        await audio.play()
        return
      }
    } catch (err) {
      console.warn('[DesktopOverlay] Échec lecture audio Base64:', err)
    }
  }

  // 2. Fallback endpoint HTTP local
  if (currentTheme.value.audioPath) {
    try {
      const audioUrl = `http://127.0.0.1:8080/audio/custom?t=${Date.now()}`
      const audio = new Audio(audioUrl)
      audio.volume = volume
      audio.onerror = () => { playDefaultChime(volume) }
      await audio.play()
      return
    } catch {
      await playDefaultChime(volume)
      return
    }
  }

  // 3. Fallback carillon synthétisé Web Audio
  await playDefaultChime(volume)
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
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0.08 * vol, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.00, now + 0.12) // A5
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
  for (const unsub of unsubs) {
    if (typeof unsub === 'function') unsub()
  }
  if (dismissTimer) clearTimeout(dismissTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
})
</script>

<style scoped>
.desktop-overlay-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: transparent !important;
  overflow: hidden;
  pointer-events: none;
  position: relative;
}

.dynamic-achievement-wrapper {
  pointer-events: none;
}
</style>
