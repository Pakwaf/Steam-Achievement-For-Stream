<template>
  <div class="desktop-overlay-container">
    <!-- Style CSS utilisateur injecté dynamiquement avec fallback garanti -->
    <component :is="'style'">
      {{ currentTheme.css || DEFAULT_THEME.css }}
    </component>

    <!-- Zone de rendu plein écran pour la notification de succès sur l'écran du joueur -->
    <div
      ref="slotRef"
      class="desktop-achievement-slot"
      v-html="renderedHtml"
    ></div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { DEFAULT_THEME } from '../utils/defaultTheme.js'
import { playAchievementSound } from '../utils/soundPlayer.js'

const currentTheme = ref({ ...DEFAULT_THEME })
const renderedHtml = ref('')
const slotRef = ref(null)

let unsubs = []
let dismissTimer = null
let leaveTimer = null

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

onMounted(async () => {
  // Transparence complète pour le jeu
  document.body.classList.add('transparent-view')
  document.documentElement.classList.add('transparent-view')

  if (window.steamAPI) {
    // 1. Récupérer le thème actuel sauvegardé
    try {
      if (window.steamAPI.getCustomization) {
        const theme = await window.steamAPI.getCustomization()
        if (theme && (theme.html || theme.css)) {
          currentTheme.value = { ...DEFAULT_THEME, ...theme }
        }
      }
    } catch (err) {
      console.error('[DesktopOverlay] Erreur chargement thème:', err)
    }

    // 2. Écouter les mises à jour en direct du thème
    if (window.steamAPI.onCustomizationUpdated) {
      const unsubTheme = window.steamAPI.onCustomizationUpdated((newTheme) => {
        console.log('[DesktopOverlay] 🎨 Mise à jour du thème reçue')
        currentTheme.value = { ...DEFAULT_THEME, ...newTheme }
      })
      unsubs.push(unsubTheme)
    }

    // 3. Écouter les succès débloqués (réels ou tests)
    if (window.steamAPI.onAchievementUnlocked) {
      const unsubAch = window.steamAPI.onAchievementUnlocked((achievement) => {
        console.log('[DesktopOverlay] 🏆 Succès reçu sur l\'overlay écran :', achievement.displayName)
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

  // 1. Jouer le son configuré via le moteur audio fiable
  playAchievementSound(currentTheme.value)

  // 2. Remplacer les placeholders {title}, {description}, {icon}, {game} avec fallback garanti
  const tpl = (currentTheme.value.html && currentTheme.value.html.trim())
    ? currentTheme.value.html
    : DEFAULT_THEME.html

  renderedHtml.value = replacePlaceholders(tpl, achievement)

  // 3. Appliquer l'animation d'entrée directement sur la carte racine (évite tout bug de containing block)
  nextTick(() => {
    const rootNode = slotRef.value?.firstElementChild
    if (rootNode) {
      rootNode.classList.remove('animate-leave')
      void rootNode.offsetWidth // Force reflow pour relancer l'animation
      rootNode.classList.add('animate-enter')
    }
  })

  // 4. Après 5 secondes : animation de sortie puis masquage
  dismissTimer = setTimeout(() => {
    const rootNode = slotRef.value?.firstElementChild
    if (rootNode) {
      rootNode.classList.remove('animate-enter')
      rootNode.classList.add('animate-leave')
    }

    // 5. Fin de l'animation de sortie : nettoyage du HTML
    leaveTimer = setTimeout(() => {
      renderedHtml.value = ''
    }, 450)
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

.desktop-achievement-slot {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  pointer-events: none;
  overflow: hidden;
}
</style>
