import { ref, computed, onMounted, onUnmounted } from 'vue'
import { steamAPI } from '../services/steamApi.js'
import { DEFAULT_THEME } from '../utils/defaultTheme.js'
import { playAchievementSound } from './useAudioEngine.js'
import { enrichAchievementHtml, getVisualEffectsCss } from '../utils/visualEffects.js'
import { sanitizeSoft, sanitizeCss } from '../utils/sanitizeSoft.js'
import { ACHIEVEMENT_TIERS_KEYS } from '../constants/index.js'

const FALLBACK_ICON = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

function escapeHtml(text) {
  if (!text) return ''
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return text.toString().replace(/[&<>"']/g, (m) => map[m])
}

function replacePlaceholders(template, data) {
  if (!template) return ''
  const tier = data.tier || ACHIEVEMENT_TIERS_KEYS.COMMON
  const defaultBadge = tier === ACHIEVEMENT_TIERS_KEYS.MASTER
    ? '🏆 JEU COMPLÉTÉ (100%)'
    : (tier === ACHIEVEMENT_TIERS_KEYS.RARE ? '★ SUCCÈS RARE (< 10%)' : 'SUCCÈS DÉBLOQUÉ')
  const rarityText = data.rarityPercent ? (data.rarityPercent + '%') : (tier === ACHIEVEMENT_TIERS_KEYS.RARE ? '4.8%' : '42.5%')

  const title = escapeHtml(data.displayName || data.title || data.name || 'Succès Débloqué')
  const description = escapeHtml(data.description || data.desc || '')
  let icon = (data.icon || data.iconUrl || data.icon_url || data.iconPath || FALLBACK_ICON).toString().trim()
  if (!icon) icon = FALLBACK_ICON
  if (icon.startsWith('http://') && (icon.includes('steamstatic.com') || icon.includes('akamaihd.net') || icon.includes('steampowered.com'))) {
    icon = icon.replace('http://', 'https://')
  }

  const game = escapeHtml(data.gameName || data.game || data.game_name || 'Steam')

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

  if (tier !== ACHIEVEMENT_TIERS_KEYS.COMMON) {
    html = html.replace(/SUCCÈS DÉBLOQUÉ/g, defaultBadge)
  }

  return html
}

/**
 * Composable pour l'Overlay transparent de bureau (Desktop Overlay).
 * Rendu natif Vue 3 avec sanitisation douce (Safe HTML) et injection CSS isolée.
 */
export function useDesktopOverlay() {
  const visualEffectsCss = getVisualEffectsCss()
  const currentTheme = ref({ ...DEFAULT_THEME })
  const activePreviewTheme = ref(null)
  const currentTierOverrideCss = ref('')
  const processedHtml = ref('')

  const currentTier = ref(ACHIEVEMENT_TIERS_KEYS.COMMON)
  const currentFx = ref('none')
  const isDisplaying = ref(false)
  const isEntering = ref(false)
  const isLeaving = ref(false)

  const tierClass = computed(() => {
    return currentTier.value === ACHIEVEMENT_TIERS_KEYS.MASTER
      ? 'tier-master'
      : (currentTier.value === ACHIEVEMENT_TIERS_KEYS.RARE ? 'tier-rare' : 'tier-common')
  })

  const fxClass = computed(() => {
    return currentFx.value && currentFx.value !== 'none'
      ? `fx-${currentFx.value.replace(/_/g, '-')}`
      : ''
  })

  // CSS universel des tiers/effets + CSS du thème + surcharge du tier actif
  const currentThemeCss = computed(() => {
    const effectiveTheme = activePreviewTheme.value || currentTheme.value || DEFAULT_THEME
    const baseCss = effectiveTheme.css || DEFAULT_THEME.css || ''
    const tierCss = currentTierOverrideCss.value || ''
    return sanitizeCss(`${visualEffectsCss}\n${baseCss}\n${tierCss}`)
  })

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
    currentTier.value = tier
    currentFx.value = effectiveTheme.visualEffect || 'none'

    // 1. Son
    playAchievementSound(effectiveTheme, tier)

    // 2. Sélection du template HTML
    const tierHtml = effectiveTheme.tiers?.[tier]?.html
    const baseHtml = effectiveTheme.html
    const tpl = (tierHtml && tierHtml.trim())
      ? tierHtml
      : ((baseHtml && baseHtml.trim()) ? baseHtml : DEFAULT_THEME.html)

    // 3. Substitution des variables
    const rawReplaced = replacePlaceholders(tpl, achievement)

    // 4. Enrichissement calque d'effets visuels
    const enriched = enrichAchievementHtml(rawReplaced, {
      tier,
      visualEffect: currentFx.value
    })

    // 5. Sanitisation douce (Safe HTML) : neutralise XSS sans détruire le CSS/HTML
    processedHtml.value = sanitizeSoft(enriched)

    // 6. CSS du tier
    const tierCss = effectiveTheme.tiers?.[tier]?.css || ''
    currentTierOverrideCss.value = tierCss

    // 7. Affichage et animation d'entrée
    isDisplaying.value = true
    isEntering.value = true
    isLeaving.value = false

    // 8. Animation de sortie après 5 secondes
    dismissTimer = setTimeout(() => {
      isEntering.value = false
      isLeaving.value = true

      leaveTimer = setTimeout(() => {
        isDisplaying.value = false
        isLeaving.value = false
        processedHtml.value = ''
        activePreviewTheme.value = null
        currentTierOverrideCss.value = ''
        currentTier.value = ACHIEVEMENT_TIERS_KEYS.COMMON
        currentFx.value = 'none'
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
    currentTier,
    currentFx,
    tierClass,
    fxClass,
    isDisplaying,
    isEntering,
    isLeaving,
    currentTierOverrideCss,
    currentThemeCss,
    processedHtml,
    sanitizedHtml: processedHtml, // alias rétro-compatibilité
    renderedHtml: processedHtml,   // alias rétro-compatibilité
    triggerAchievement
  }
}
