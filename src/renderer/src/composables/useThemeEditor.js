import { ref, computed, watch, onMounted } from 'vue'
import { playAchievementSound } from '../utils/soundPlayer.js'
import { DEFAULT_THEME } from '../utils/defaultTheme.js'
import { VISUAL_EFFECTS, ACHIEVEMENT_TIERS, getVisualEffectsCss, enrichAchievementHtml } from '../utils/visualEffects.js'
import { sanitizeAchievementHtml } from '../utils/sanitizeHtml.js'
import { themeStorage } from '../services/themeStorage.js'
import { steamAPI } from '../services/steamApi.js'
import { ACHIEVEMENT_TIERS_KEYS } from '../constants/index.js'

export function useThemeEditor(props, emit) {
  const visualEffectsList = VISUAL_EFFECTS
  const visualEffectsCss = getVisualEffectsCss()

  const selectedPreviewTier = ref(ACHIEVEMENT_TIERS_KEYS.COMMON)
  const selectedEditingTier = ref(ACHIEVEMENT_TIERS_KEYS.COMMON)
  const activeTab = ref('effects')
  const isSaving = ref(false)
  const isTesting = ref(false)
  const isPlayingSound = ref(false)
  const saveMessage = ref('')
  const htmlTextarea = ref(null)

  const theme = ref({
    id: 'theme-custom',
    name: 'Nouveau Thème',
    html: '',
    css: '',
    visualEffect: 'none',
    audioPath: null,
    audioDeviceId: 'default',
    soundEnabled: true,
    soundVolume: 0.8,
    tiers: {}
  })

  const selectedEditingTierName = computed(() => {
    if (selectedEditingTier.value === ACHIEVEMENT_TIERS_KEYS.MASTER) return '100% Platine'
    if (selectedEditingTier.value === ACHIEVEMENT_TIERS_KEYS.RARE) return 'Succès Rare (< 10%)'
    return 'Standard (> 10%)'
  })

  const currentEffectName = computed(() => {
    const found = visualEffectsList.find((e) => e.id === (theme.value.visualEffect || 'none'))
    return found ? found.name : 'Aucun'
  })

  const selectedPreviewTierName = computed(() => {
    return selectedPreviewTier.value === ACHIEVEMENT_TIERS_KEYS.MASTER
      ? '100% Platine'
      : (selectedPreviewTier.value === ACHIEVEMENT_TIERS_KEYS.RARE ? 'Succès Rare < 10%' : 'Succès Standard')
  })

  function selectEditingTier(tier) {
    selectedEditingTier.value = tier
    selectedPreviewTier.value = tier
  }

  function hasTierCustomization(tier) {
    if (!theme.value.tiers || !theme.value.tiers[tier]) return false
    const t = theme.value.tiers[tier]
    return Boolean((t.html && t.html !== theme.value.html) || t.css || t.audioPath)
  }

  function enableTierCustomization(tier) {
    if (!theme.value.tiers) {
      theme.value.tiers = {}
    }
    if (!theme.value.tiers[tier]) {
      theme.value.tiers[tier] = {
        html: theme.value.html || '',
        css: '',
        audioPath: null
      }
    }
    selectedEditingTier.value = tier
    selectedPreviewTier.value = tier
    showStatus(`Personnalisation activée pour le tier ${selectedEditingTierName.value} ⚡`)
  }

  function resetTierCustomization(tier) {
    if (theme.value.tiers && theme.value.tiers[tier]) {
      delete theme.value.tiers[tier]
      showStatus(`Tier ${tier} réinitialisé : hérite désormais du modèle standard ↩`)
    }
  }

  function handleEditTierFromEffects(tier) {
    selectEditingTier(tier)
    if (!hasTierCustomization(tier) && tier !== ACHIEVEMENT_TIERS_KEYS.COMMON) {
      enableTierCustomization(tier)
    }
    activeTab.value = 'css'
  }

  const currentEditingHtml = computed({
    get() {
      if (selectedEditingTier.value === ACHIEVEMENT_TIERS_KEYS.COMMON) {
        return theme.value.html
      }
      return theme.value.tiers?.[selectedEditingTier.value]?.html ?? theme.value.html
    },
    set(val) {
      if (selectedEditingTier.value === ACHIEVEMENT_TIERS_KEYS.COMMON) {
        theme.value.html = val
      } else {
        if (!theme.value.tiers) theme.value.tiers = {}
        if (!theme.value.tiers[selectedEditingTier.value]) {
          theme.value.tiers[selectedEditingTier.value] = {}
        }
        theme.value.tiers[selectedEditingTier.value].html = val
      }
    }
  })

  const currentEditingCss = computed({
    get() {
      if (selectedEditingTier.value === ACHIEVEMENT_TIERS_KEYS.COMMON) {
        return theme.value.css
      }
      return theme.value.tiers?.[selectedEditingTier.value]?.css ?? ''
    },
    set(val) {
      if (selectedEditingTier.value === ACHIEVEMENT_TIERS_KEYS.COMMON) {
        theme.value.css = val
      } else {
        if (!theme.value.tiers) theme.value.tiers = {}
        if (!theme.value.tiers[selectedEditingTier.value]) {
          theme.value.tiers[selectedEditingTier.value] = {}
        }
        theme.value.tiers[selectedEditingTier.value].css = val
      }
    }
  })

  const currentEditingAudioPath = computed({
    get() {
      if (selectedEditingTier.value === ACHIEVEMENT_TIERS_KEYS.COMMON) {
        return theme.value.audioPath
      }
      return theme.value.tiers?.[selectedEditingTier.value]?.audioPath ?? theme.value.audioPath
    },
    set(val) {
      if (selectedEditingTier.value === ACHIEVEMENT_TIERS_KEYS.COMMON) {
        theme.value.audioPath = val
      } else {
        if (!theme.value.tiers) theme.value.tiers = {}
        if (!theme.value.tiers[selectedEditingTier.value]) {
          theme.value.tiers[selectedEditingTier.value] = {}
        }
        theme.value.tiers[selectedEditingTier.value].audioPath = val
      }
    }
  })

  const computedPreviewCss = computed(() => {
    const baseCss = theme.value.css || ''
    const tierCss = (selectedPreviewTier.value !== ACHIEVEMENT_TIERS_KEYS.COMMON && theme.value.tiers?.[selectedPreviewTier.value]?.css)
      ? `\n/* Override Spécifique ${selectedPreviewTier.value.toUpperCase()} */\n` + theme.value.tiers[selectedPreviewTier.value].css
      : ''
    return baseCss + tierCss
  })

  function selectVisualEffect(fxId) {
    theme.value.visualEffect = fxId
    saveCustomization()
    showStatus(`Effet appliqué : ${currentEffectName.value} ✔`)
  }

  // Synchronise le thème édité dès que targetTheme change
  watch(
    () => props.targetTheme,
    (newTheme) => {
      if (newTheme) {
        theme.value = {
          ...DEFAULT_THEME,
          ...JSON.parse(JSON.stringify(newTheme)),
          visualEffect: newTheme.visualEffect || 'none',
          audioDeviceId: newTheme.audioDeviceId || 'default',
          tiers: newTheme.tiers ? JSON.parse(JSON.stringify(newTheme.tiers)) : {}
        }
      }
    },
    { immediate: true, deep: true }
  )

  // Calcul du HTML d'aperçu en direct avec effet visuel et tier
  const previewHtml = computed(() => {
    const activeTier = selectedPreviewTier.value
    const htmlTemplate = (activeTier !== ACHIEVEMENT_TIERS_KEYS.COMMON && theme.value.tiers?.[activeTier]?.html)
      ? theme.value.tiers[activeTier].html
      : theme.value.html

    if (!htmlTemplate) return '<div style="color: #8b9bb4; padding: 20px;">Aucun HTML défini.</div>'
    const tierMeta = ACHIEVEMENT_TIERS[activeTier] || ACHIEVEMENT_TIERS.common

    let icon = (tierMeta.icon || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg').toString().trim()
    if (icon.startsWith('http://') && (icon.includes('steamstatic.com') || icon.includes('akamaihd.net') || icon.includes('steampowered.com'))) {
      icon = icon.replace('http://', 'https://')
    }

    let html = htmlTemplate
      .replace(/\{title\}/gi, tierMeta.defaultTitle)
      .replace(/\{description\}/gi, tierMeta.defaultDesc)
      .replace(/\{icon\}/gi, icon)
      .replace(/\{iconUrl\}/gi, icon)
      .replace(/\{icon_url\}/gi, icon)
      .replace(/\{image\}/gi, icon)
      .replace(/\{img\}/gi, icon)
      .replace(/\{game\}/gi, tierMeta.defaultGame)
      .replace(/\{tier\}/gi, activeTier)
      .replace(/\{tierLabel\}/gi, tierMeta.defaultBadge)
      .replace(/\{rarity\}/gi, tierMeta.defaultPercent + '%')

    if (activeTier !== ACHIEVEMENT_TIERS_KEYS.COMMON) {
      html = html.replace(/SUCCÈS DÉBLOQUÉ/g, tierMeta.defaultBadge)
    }

    const enriched = enrichAchievementHtml(html, {
      tier: activeTier,
      visualEffect: theme.value.visualEffect || 'none'
    })

    return sanitizeAchievementHtml(enriched)
  })

  onMounted(async () => {
    if (!props.targetTheme) {
      try {
        const active = await steamAPI.getActiveTheme()
        if (active) {
          theme.value = {
            ...DEFAULT_THEME,
            ...active,
            visualEffect: active.visualEffect || 'none',
            audioDeviceId: active.audioDeviceId || 'default',
            tiers: active.tiers ? JSON.parse(JSON.stringify(active.tiers)) : {}
          }
        }
      } catch (err) {
        console.error('[useThemeEditor] Erreur chargement thème:', err)
      }
    }
  })

  function autoSaveThemeName() {
    if (theme.value.id) {
      steamAPI.saveTheme({ ...theme.value })
    }
  }

  function insertPlaceholder(placeholder) {
    const el = htmlTextarea.value
    if (!el) {
      currentEditingHtml.value += placeholder
      return
    }

    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const text = currentEditingHtml.value || ''
    currentEditingHtml.value = text.substring(0, start) + placeholder + text.substring(end)

    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + placeholder.length, start + placeholder.length)
    }, 10)
  }

  async function browseAudioFile() {
    try {
      const res = await steamAPI.selectAudioFile()
      if (res.success && res.filePath) {
        currentEditingAudioPath.value = res.filePath
        showStatus(`Fichier audio configuré pour ${selectedEditingTierName.value} ✔`)
        await saveCustomization()
        await playTestSound()
      }
    } catch (err) {
      console.error('[useThemeEditor] Erreur sélection audio:', err)
    }
  }

  async function removeAudioFile() {
    currentEditingAudioPath.value = null
    showStatus(`Son spécifique retiré pour ${selectedEditingTierName.value}`)
    await saveCustomization()
    await playTestSound()
  }

  async function playTestSound() {
    if (!theme.value.soundEnabled || isPlayingSound.value) return
    isPlayingSound.value = true

    try {
      await playAchievementSound({
        soundEnabled: true,
        soundVolume: theme.value.soundVolume,
        audioPath: currentEditingAudioPath.value,
        tiers: theme.value.tiers
      }, selectedEditingTier.value)
    } catch (err) {
      console.error('[useThemeEditor] Erreur test son:', err)
    } finally {
      setTimeout(() => {
        isPlayingSound.value = false
      }, 900)
    }
  }

  async function saveCustomization() {
    if (isSaving.value) return
    isSaving.value = true

    try {
      const res = await steamAPI.saveTheme({ ...theme.value })
      if (res.success) {
        showStatus('Thème sauvegardé avec succès ✔')
        if (emit) emit('saved', res.theme)
      }
    } catch (err) {
      console.error('[useThemeEditor] Erreur sauvegarde thème:', err)
      showStatus('Erreur de sauvegarde ✖')
    } finally {
      isSaving.value = false
    }
  }

  async function resetToDefault() {
    if (!confirm('Voulez-vous vraiment restaurer le template et le style par défaut pour ce thème ?')) return

    theme.value.html = DEFAULT_THEME.html
    theme.value.css = DEFAULT_THEME.css
    theme.value.audioPath = null
    theme.value.tiers = {}
    await saveCustomization()
    showStatus('Structure par défaut restaurée ✔')
  }

  async function triggerTierTest(tier = ACHIEVEMENT_TIERS_KEYS.COMMON) {
    if (isTesting.value) return
    isTesting.value = true

    const tierMeta = ACHIEVEMENT_TIERS[tier] || ACHIEVEMENT_TIERS.common

    playAchievementSound({
      soundEnabled: theme.value.soundEnabled,
      soundVolume: theme.value.soundVolume,
      audioPath: theme.value.audioPath,
      audioDeviceId: theme.value.audioDeviceId,
      tiers: theme.value.tiers
    }, tier)

    try {
      await steamAPI.broadcastTestAchievement({
        displayName: tierMeta.defaultTitle,
        description: tierMeta.defaultDesc,
        gameName: tierMeta.defaultGame,
        icon: tierMeta.icon,
        tier,
        rarityPercent: tierMeta.defaultPercent,
        previewTheme: {
          id: theme.value.id,
          name: theme.value.name,
          html: theme.value.html,
          css: theme.value.css,
          visualEffect: theme.value.visualEffect || 'none',
          audioPath: theme.value.audioPath,
          soundEnabled: theme.value.soundEnabled,
          soundVolume: theme.value.soundVolume,
          tiers: theme.value.tiers
        }
      })
      showStatus(`Alerte test (${tierMeta.name}) diffusée 🚀`)
    } catch (err) {
      console.error('[useThemeEditor] Erreur test notification:', err)
    } finally {
      setTimeout(() => {
        isTesting.value = false
      }, 1500)
    }
  }

  async function exportCurrentTheme() {
    if (!theme.value.id) return
    try {
      const res = await themeStorage.exportTheme(theme.value.id)
      if (res.success) {
        showStatus(`Thème exporté dans ${res.fileName} 💾`)
      } else {
        showStatus(res.error || 'Erreur lors de l\'export ✖')
      }
    } catch (err) {
      showStatus('Erreur export: ' + err.message)
    }
  }

  function showStatus(msg) {
    saveMessage.value = msg
    setTimeout(() => {
      if (saveMessage.value === msg) saveMessage.value = ''
    }, 3500)
  }

  return {
    theme,
    activeTab,
    selectedEditingTier,
    selectedEditingTierName,
    selectedPreviewTier,
    selectedPreviewTierName,
    currentEffectName,
    visualEffectsList,
    visualEffectsCss,
    currentEditingHtml,
    currentEditingCss,
    currentEditingAudioPath,
    computedPreviewCss,
    previewHtml,
    isSaving,
    isTesting,
    isPlayingSound,
    saveMessage,
    htmlTextarea,
    selectEditingTier,
    hasTierCustomization,
    enableTierCustomization,
    resetTierCustomization,
    handleEditTierFromEffects,
    selectVisualEffect,
    autoSaveThemeName,
    insertPlaceholder,
    browseAudioFile,
    removeAudioFile,
    playTestSound,
    saveCustomization,
    resetToDefault,
    triggerTierTest,
    exportCurrentTheme
  }
}
