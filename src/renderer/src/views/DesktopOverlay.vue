<template>
  <div class="desktop-overlay-container">
    <!-- Style CSS universel (effets, tiers) + CSS utilisateur injecté dynamiquement -->
    <component :is="'style'">
      {{ visualEffectsCss }}
      {{ activePreviewTheme?.css || currentTheme.css || DEFAULT_THEME.css }}
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
import { getVisualEffectsCss, enrichAchievementHtml } from '../utils/visualEffects.js'

const visualEffectsCss = getVisualEffectsCss()
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
        currentTheme.value = { ...DEFAULT_THEME, ...newTheme }
      })
      unsubs.push(unsubTheme)
    }

    // 3. Écouter les succès débloqués (réels ou tests)
    if (window.steamAPI.onAchievementUnlocked) {
      const unsubAch = window.steamAPI.onAchievementUnlocked((achievement) => {
        triggerAchievement(achievement)
      })
      unsubs.push(unsubAch)
    }
  }
})

const activePreviewTheme = ref(null)

// Déclenche l'affichage dynamique pendant 5 secondes avec son et animations
function triggerAchievement(achievement) {
  if (dismissTimer) clearTimeout(dismissTimer)
  if (leaveTimer) clearTimeout(leaveTimer)

  // Utiliser le thème de preview (si test en cours dans l'éditeur) ou le thème actif
  const effectiveTheme = achievement.previewTheme || currentTheme.value
  activePreviewTheme.value = achievement.previewTheme || null

  const tier = achievement.tier || 'common'

  // 1. Jouer le son configuré via le moteur audio adapté au Tier
  playAchievementSound(effectiveTheme, tier)

  // 2. Remplacer les placeholders {title}, {description}, {icon}, {game}, {tier}, {tierLabel}
  const tpl = (effectiveTheme.html && effectiveTheme.html.trim())
    ? effectiveTheme.html
    : DEFAULT_THEME.html

  let processed = replacePlaceholders(tpl, achievement)

  // 3. Enrichir avec les classes de Tier et le calque d'effets visuels
  renderedHtml.value = enrichAchievementHtml(processed, {
    tier,
    visualEffect: effectiveTheme.visualEffect || 'none'
  })

  // 4. Appliquer l'animation d'entrée directement sur la carte racine
  nextTick(() => {
    const rootNode = slotRef.value?.firstElementChild
    if (rootNode) {
      rootNode.classList.remove('animate-leave')
      void rootNode.offsetWidth
      rootNode.classList.add('animate-enter')
    }
  })

  // 5. Après 5 secondes : animation de sortie puis masquage
  dismissTimer = setTimeout(() => {
    const rootNode = slotRef.value?.firstElementChild
    if (rootNode) {
      rootNode.classList.remove('animate-enter')
      rootNode.classList.add('animate-leave')
    }

    // 6. Fin de l'animation de sortie : nettoyage du HTML
    leaveTimer = setTimeout(() => {
      renderedHtml.value = ''
      activePreviewTheme.value = null
    }, 450)
  }, 5000)
}

function replacePlaceholders(template, data) {
  if (!template) return ''
  const tier = data.tier || 'common'
  const defaultBadge = tier === 'master' 
    ? '🏆 JEU COMPLÉTÉ (100%)' 
    : (tier === 'rare' ? '★ SUCCÈS RARE (< 10%)' : 'SUCCÈS DÉBLOQUÉ')
  const rarityText = data.rarityPercent ? (data.rarityPercent + '%') : (tier === 'rare' ? '4.8%' : '42.5%')

  const title = escapeHtml(data.displayName || 'Succès Débloqué')
  const description = escapeHtml(data.description || '')
  const icon = data.icon || fallbackIcon
  const game = escapeHtml(data.gameName || 'Steam')

  let html = template
    .replace(/\{title\}/gi, title)
    .replace(/\{description\}/gi, description)
    .replace(/\{icon\}/gi, icon)
    .replace(/\{game\}/gi, game)
    .replace(/\{tier\}/gi, tier)
    .replace(/\{tierLabel\}/gi, defaultBadge)
    .replace(/\{rarity\}/gi, rarityText)

  if (tier !== 'common') {
    html = html.replace(/SUCCÈS DÉBLOQUÉ/g, defaultBadge)
  }

  return html
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
