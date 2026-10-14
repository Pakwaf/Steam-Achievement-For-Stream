import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { steamAPI } from '../services/steamApi.js'
import { DEFAULT_THEME } from '../utils/defaultTheme.js'
import { playAchievementSound } from './useAudioEngine.js'
import { enrichAchievementHtml } from '../utils/visualEffects.js'
import { ACHIEVEMENT_TIERS_KEYS } from '../constants/index.js'

const FALLBACK_ICON = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

function replacePlaceholders(template, data) {
  if (!template) return ''
  const tier = data.tier || ACHIEVEMENT_TIERS_KEYS.COMMON
  const defaultBadge = tier === ACHIEVEMENT_TIERS_KEYS.MASTER
    ? '🏆 JEU COMPLÉTÉ (100%)'
    : (tier === ACHIEVEMENT_TIERS_KEYS.RARE ? '★ SUCCÈS RARE (< 10%)' : 'SUCCÈS DÉBLOQUÉ')
  const rarityText = data.rarityPercent ? (data.rarityPercent + '%') : (tier === ACHIEVEMENT_TIERS_KEYS.RARE ? '4.8%' : '42.5%')
  const rawPlaytime = data.playtime_hours ?? data.playtimeHours ?? null
  const playtimeStr = (rawPlaytime !== null && rawPlaytime !== undefined && rawPlaytime !== '')
    ? `${rawPlaytime}h`
    : ''

  const title = (data.displayName || data.title || data.name || 'Succès Débloqué').toString()
  const description = (data.description || data.desc || '').toString()
  let icon = (data.icon || data.iconUrl || data.icon_url || data.iconPath || FALLBACK_ICON).toString().trim()
  if (!icon) icon = FALLBACK_ICON
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
    .replace(/\{rarity\}/gi, rarityText)
    .replace(/\{playtime\}/gi, playtimeStr)

  if (tier !== ACHIEVEMENT_TIERS_KEYS.COMMON) {
    html = html.replace(/SUCCÈS DÉBLOQUÉ/g, defaultBadge)
  }

  return html
}

/**
 * Composable pour l'Overlay transparent de bureau (Desktop Overlay).
 * Isole la souscription IPC, le moteur de rendu HTML/CSS dynamique et l'animation des succès.
 */
export function useDesktopOverlay() {
  const currentTheme = ref({ ...DEFAULT_THEME })
  const activePreviewTheme = ref(null)
  const currentTierOverrideCss = ref('')
  const renderedHtml = ref('')
  const slotRef = ref(null)

  let unsubs = []
  let dismissTimer = null
  let leaveTimer = null

  function triggerAchievement(achievement) {
    if (!achievement) return
    if (dismissTimer) clearTimeout(dismissTimer)
    if (leaveTimer) clearTimeout(leaveTimer)

    const effectiveTheme = achievement.previewTheme || currentTheme.value
    activePreviewTheme.value = achievement.previewTheme || null

    const tier = achievement.tier || ACHIEVEMENT_TIERS_KEYS.COMMON

    // 1. Jouer le son
    playAchievementSound(effectiveTheme, tier)

    // 2. Sélection du template HTML adapté au tier (ou fallback base)
    const tierHtml = effectiveTheme.tiers?.[tier]?.html
    const baseHtml = effectiveTheme.html
    const tpl = (tierHtml && tierHtml.trim())
      ? tierHtml
      : ((baseHtml && baseHtml.trim()) ? baseHtml : DEFAULT_THEME.html)

    const processed = replacePlaceholders(tpl, achievement)

    // 3. Enrichir avec calque d'effets visuels et injecter le Raw HTML
    renderedHtml.value = enrichAchievementHtml(processed, {
      tier,
      visualEffect: effectiveTheme.visualEffect || 'none'
    })

    // 4. CSS de surcharge du Tier
    const tierCss = effectiveTheme.tiers?.[tier]?.css
    currentTierOverrideCss.value = tierCss || ''

    // 5. Animation d'entrée
    nextTick(() => {
      const rootNode = slotRef.value?.firstElementChild
      if (rootNode) {
        rootNode.classList.remove('animate-leave')
        void rootNode.offsetWidth
        rootNode.classList.add('animate-enter')
      }
    })

    // 6. Animation de sortie après 5 secondes
    dismissTimer = setTimeout(() => {
      const rootNode = slotRef.value?.firstElementChild
      if (rootNode) {
        rootNode.classList.remove('animate-enter')
        rootNode.classList.add('animate-leave')
      }

      leaveTimer = setTimeout(() => {
        renderedHtml.value = ''
        activePreviewTheme.value = null
        currentTierOverrideCss.value = ''
      }, 450)
    }, 5000)
  }

  onMounted(async () => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('transparent-view')
      document.documentElement.classList.add('transparent-view')
    }

    try {
      const theme = await steamAPI.getCustomization()
      if (theme && (theme.html || theme.css)) {
        currentTheme.value = { ...DEFAULT_THEME, ...theme }
      }
    } catch (err) {
      console.error('[useDesktopOverlay] Erreur chargement thème:', err)
    }

    const unsubTheme = steamAPI.onCustomizationUpdated((newTheme) => {
      if (newTheme) {
        currentTheme.value = { ...DEFAULT_THEME, ...newTheme }
      }
    })
    unsubs.push(unsubTheme)

    const unsubAch = steamAPI.onAchievementUnlocked((achievement) => {
      triggerAchievement(achievement)
    })
    unsubs.push(unsubAch)
  })

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('transparent-view')
      document.documentElement.classList.remove('transparent-view')
    }
    for (const unsub of unsubs) {
      if (typeof unsub === 'function') unsub()
    }
    unsubs = []
    if (dismissTimer) clearTimeout(dismissTimer)
    if (leaveTimer) clearTimeout(leaveTimer)
  })

  return {
    currentTheme,
    activePreviewTheme,
    currentTierOverrideCss,
    renderedHtml,
    slotRef,
    triggerAchievement
  }
}
