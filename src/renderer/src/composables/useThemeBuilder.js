import { ref, computed, watch, onMounted } from 'vue'
import { steamAPI } from '../services/steamApi.js'
import { VISUAL_EFFECTS } from '../utils/visualEffects.js'

export const STORAGE_KEY_PALETTES = 'SAVED_PALETTES'

export const GRADIENT_PRESETS = [
  { id: 'steam-blue', name: 'Bleu Steam', gradient: 'linear-gradient(135deg, #1b2838 0%, #171a21 100%)', primary: '#1b2838', accent: '#66c0f4' },
  { id: 'gold-prestige', name: 'Or Prestige', gradient: 'linear-gradient(135deg, #2a1f07 0%, #141008 100%)', primary: '#2a1f07', accent: '#f0c330' },
  { id: 'cyber-neon', name: 'Cyber Néon', gradient: 'linear-gradient(135deg, #240b38 0%, #0d0e1c 100%)', primary: '#240b38', accent: '#00ffee' },
  { id: 'sunset-purple', name: 'Sunset Pourpre', gradient: 'linear-gradient(135deg, #381228 0%, #150a1d 100%)', primary: '#381228', accent: '#ec4899' },
  { id: 'royal-emerald', name: 'Émeraude Royale', gradient: 'linear-gradient(135deg, #092c1d 0%, #061510 100%)', primary: '#092c1d', accent: '#10b981' },
  { id: 'ruby-red', name: 'Rouge Rubis', gradient: 'linear-gradient(135deg, #330b0b 0%, #140505 100%)', primary: '#330b0b', accent: '#f43f5e' },
  { id: 'carbon-dark', name: 'Gris Carbone', gradient: 'linear-gradient(135deg, #18191c 0%, #0e0f11 100%)', primary: '#18191c', accent: '#94a3b8' }
]

export const GOOGLE_FONTS = [
  { family: 'Outfit', label: 'Outfit (Moderne & Arrondi)' },
  { family: 'Inter', label: 'Inter (Épuré & Précis)' },
  { family: 'Poppins', label: 'Poppins (Géométrique)' },
  { family: 'Cinzel', label: 'Cinzel (Épique & Médiéval)' },
  { family: 'Orbitron', label: 'Orbitron (Futuriste / Sci-Fi)' }
]

export function useThemeBuilder(emit = null) {
  // États réactifs principaux
  const themeName = ref('Mon Thème Rapide')
  const selectedPresetId = ref('steam-blue')
  const primaryColor = ref('#1b2838')
  const accentColor = ref('#66c0f4')
  const backgroundOpacity = ref(85)
  const selectedFont = ref('Outfit')
  const selectedAnimation = ref('slide-up')

  // Combos de couleurs sauvegardés
  const savedPalettes = ref([])

  function loadSavedPalettes() {
    try {
      if (typeof localStorage === 'undefined') return
      const raw = localStorage.getItem(STORAGE_KEY_PALETTES)
      if (raw) {
        savedPalettes.value = JSON.parse(raw)
      } else {
        savedPalettes.value = [
          { id: 'p1', name: 'Néon Violet', primary: '#240b38', accent: '#00ffee', opacity: 85 },
          { id: 'p2', name: 'Ambre Chaud', primary: '#291807', accent: '#f59e0b', opacity: 90 }
        ]
      }
    } catch (err) {
      console.warn('[useThemeBuilder] Erreur lecture localStorage palettes:', err)
      savedPalettes.value = []
    }
  }

  function saveCurrentPalette() {
    const newPalette = {
      id: `palette-${Date.now()}`,
      name: `Combo ${savedPalettes.value.length + 1}`,
      primary: primaryColor.value,
      accent: accentColor.value,
      opacity: backgroundOpacity.value
    }
    savedPalettes.value.unshift(newPalette)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PALETTES, JSON.stringify(savedPalettes.value))
      }
      saveMessage.value = 'Combo de couleurs sauvegardé !'
      setTimeout(() => {
        if (saveMessage.value.includes('Combo')) saveMessage.value = ''
      }, 2500)
    } catch (err) {
      console.error('[useThemeBuilder] Erreur écriture SAVED_PALETTES:', err)
    }
  }

  function applySavedPalette(p) {
    selectedPresetId.value = 'custom'
    primaryColor.value = p.primary
    accentColor.value = p.accent
    if (p.opacity) backgroundOpacity.value = p.opacity
  }

  function removeSavedPalette(id) {
    savedPalettes.value = savedPalettes.value.filter((p) => p.id !== id)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PALETTES, JSON.stringify(savedPalettes.value))
      }
    } catch (err) {
      console.error('[useThemeBuilder] Erreur suppression palette:', err)
    }
  }

  // Configuration des Tiers
  const commonColor = ref('#66c0f4')
  const rareColor = ref('#c084fc')
  const masterColor = ref('#ffd700')

  // Audio & Effets
  const selectedEffect = ref('none')
  const useCustomAudio = ref(false)
  const customAudioPath = ref(null)
  const audioFileName = ref('')

  // Aperçu en temps réel
  const previewTier = ref('common') // 'common' | 'rare' | 'master'
  const isSaving = ref(false)
  const isTestingDraft = ref(false)
  const saveMessage = ref('')
  const animKey = ref(0)

  // Déclenche l'animation dans le preview lors d'un changement
  watch([selectedAnimation, previewTier], () => {
    animKey.value++
  })

  function applyPreset(preset) {
    selectedPresetId.value = preset.id
    primaryColor.value = preset.primary
    accentColor.value = preset.accent
  }

  const effectLabel = computed(() => {
    const fx = VISUAL_EFFECTS.find((e) => e.id === selectedEffect.value)
    return fx ? fx.name : 'Aucun'
  })

  const animationLabel = computed(() => {
    switch (selectedAnimation.value) {
      case 'slide-up': return 'Slide Up (Glissement)'
      case 'pop-in': return 'Pop In (Rebond)'
      case 'fade-in': return 'Fade In (Fondu)'
      case 'glitch': return 'Glitch (Cyber)'
      default: return 'Slide Up'
    }
  })

  function hexToRgba(hex, alphaPercent) {
    if (!hex || typeof hex !== 'string') return `rgba(27, 40, 56, ${alphaPercent / 100})`
    let c = hex.replace('#', '')
    if (c.length === 3) {
      c = c.split('').map((x) => x + x).join('')
    }
    const num = parseInt(c, 16)
    if (isNaN(num)) return `rgba(27, 40, 56, ${alphaPercent / 100})`
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgba(${r}, ${g}, ${b}, ${(alphaPercent / 100).toFixed(2)})`
  }

  const backgroundCssValue = computed(() => {
    const alpha = backgroundOpacity.value
    if (selectedPresetId.value !== 'custom') {
      const preset = GRADIENT_PRESETS.find((p) => p.id === selectedPresetId.value)
      if (preset) {
        return preset.gradient
      }
    }
    return hexToRgba(primaryColor.value, alpha)
  })

  const generatedCss = computed(() => {
    const bg = backgroundCssValue.value
    const accent = accentColor.value
    const primary = primaryColor.value
    const font = selectedFont.value
    const cColor = commonColor.value
    const rColor = rareColor.value
    const mColor = masterColor.value

    return `/* Thème généré via le Générateur Visuel SteamOverlayStream */
:root, .quick-theme-container {
  --theme-accent: ${accent};
  --theme-primary: ${primary};
  --theme-bg: ${bg};
}

.quick-theme-container {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--theme-bg, ${bg});
  border: 2px solid var(--theme-accent, ${accent});
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65), 0 0 20px ${accent}33;
  font-family: '${font}', -apple-system, sans-serif;
  color: #ffffff;
  max-width: 440px;
  min-width: 320px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  will-change: transform, opacity;
}

.quick-theme-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: var(--theme-accent, ${accent});
  box-shadow: 0 0 10px ${accent};
}

.quick-theme-icon-wrap {
  width: 58px;
  height: 58px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  background: #000;
}

.quick-theme-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.quick-theme-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-theme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b9bb4;
}

.quick-theme-app {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.quick-theme-time {
  opacity: 0.8;
  font-size: 0.68rem;
  white-space: nowrap;
}

.quick-theme-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-theme-desc {
  font-size: 0.8rem;
  color: #c7d5e0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animations d'apparition dynamiques */
.quick-theme-container.anim-slide-up {
  animation: qtbSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes qtbSlideUp {
  0% { transform: translateY(40px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.quick-theme-container.anim-pop-in {
  animation: qtbPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes qtbPopIn {
  0% { transform: scale(0.65); opacity: 0; }
  70% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.quick-theme-container.anim-fade-in {
  animation: qtbFadeIn 0.35s ease-out forwards;
}
@keyframes qtbFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.quick-theme-container.anim-glitch {
  animation: qtbGlitch 0.4s steps(2, start) forwards;
}
@keyframes qtbGlitch {
  0% { transform: translate(-4px, 2px) skewX(2deg); opacity: 0; }
  25% { transform: translate(4px, -2px) skewX(-2deg); opacity: 0.85; }
  50% { transform: translate(-2px, -1px) skewX(1deg); opacity: 1; }
  75% { transform: translate(2px, 1px) skewX(-1deg); }
  100% { transform: translate(0, 0); opacity: 1; }
}

/* Tier Standard */
.quick-theme-container.common-tier {
  border-color: ${cColor}77;
}
.quick-theme-container.common-tier::before {
  background: ${cColor};
}
.quick-theme-container.common-tier .quick-theme-title {
  color: #ffffff;
}

/* Tier Rare */
.quick-theme-container.rare-tier {
  border-color: ${rColor}aa;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 25px ${rColor}44;
}
.quick-theme-container.rare-tier::before {
  background: ${rColor};
}
.quick-theme-container.rare-tier .quick-theme-title {
  color: ${rColor};
}
.quick-theme-badge {
  background: ${rColor}25;
  border: 1px solid ${rColor}66;
  color: ${rColor};
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 800;
}

/* Tier Master (Platine 100%) */
.quick-theme-container.master-tier {
  border-color: ${mColor}cc;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.8), 0 0 35px ${mColor}55;
}
.quick-theme-container.master-tier::before {
  background: ${mColor};
}
.quick-theme-container.master-tier .quick-theme-title {
  color: ${mColor};
  text-shadow: 0 0 10px ${mColor}44;
}
.quick-master-playtime {
  margin-top: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${mColor};
  background: ${mColor}18;
  border: 1px solid ${mColor}55;
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-block;
  align-self: flex-start;
}`
  })

  const generatedCssPreview = computed(() => generatedCss.value)

  const htmlTemplateCommon = computed(() => `<div class="quick-theme-container common-tier anim-${selectedAnimation.value}">
  <div class="quick-theme-icon-wrap">
    <img src="{icon}" alt="{title}" class="quick-theme-icon" />
  </div>
  <div class="quick-theme-content">
    <div class="quick-theme-header">
      <span class="quick-theme-app">{game}</span>
      <span class="quick-theme-time">{unlockedAt}</span>
    </div>
    <div class="quick-theme-title">{title}</div>
    <div class="quick-theme-desc">{description}</div>
  </div>
</div>`)

  const htmlTemplateRare = computed(() => `<div class="quick-theme-container rare-tier anim-${selectedAnimation.value}">
  <div class="quick-theme-icon-wrap">
    <img src="{icon}" alt="{title}" class="quick-theme-icon" />
  </div>
  <div class="quick-theme-content">
    <div class="quick-theme-header">
      <span class="quick-theme-badge">★ RARE</span>
      <span class="quick-theme-app">{game}</span>
    </div>
    <div class="quick-theme-title">{title}</div>
    <div class="quick-theme-desc">{description}</div>
  </div>
</div>`)

  const htmlTemplateMaster = computed(() => `<div class="quick-theme-container master-tier anim-${selectedAnimation.value}">
  <div class="quick-theme-icon-wrap">
    <img src="{icon}" alt="{title}" class="quick-theme-icon" />
  </div>
  <div class="quick-theme-content">
    <div class="quick-theme-header">
      <span class="quick-theme-badge">🏆 PLATINE 100%</span>
      <span class="quick-theme-app">{game}</span>
    </div>
    <div class="quick-theme-title">{title}</div>
    <div class="quick-theme-desc">{description}</div>
    <div class="quick-master-playtime">Complété à 100% en {playtime}</div>
  </div>
</div>`)

  const previewSamples = {
    common: {
      title: 'Premier Sang',
      description: 'Éliminez votre premier adversaire dans une partie multijoueur classée.',
      icon: 'https://community.cloudflare.steamstatic.com/public/images/apps/440/e0d16c52a0a2df3087db8c0dc1c05d0cbcc52d2a.jpg',
      game: 'Team Fortress 2',
      unlockedAt: 'À l\'instant',
      playtime: '12h'
    },
    rare: {
      title: 'Légende Incontestée',
      description: 'Terminez la campagne solo en difficulté Maître sans subir de défaite.',
      icon: 'https://community.cloudflare.steamstatic.com/public/images/apps/440/d772960f2bb97f58e17db194680877a111a432ea.jpg',
      game: 'Team Fortress 2',
      unlockedAt: 'Rare (4.8%)',
      playtime: '48h'
    },
    master: {
      title: 'Perfectionniste Absolu',
      description: 'Débloquez l\'intégralité des succès et terminez tous les défis du jeu.',
      icon: 'https://community.cloudflare.steamstatic.com/public/images/apps/440/b84170564619a9f997c4033ee3ffaa7ea1cbcf8d.jpg',
      game: 'Team Fortress 2',
      unlockedAt: '100% Complété',
      playtime: '124 heures'
    }
  }

  const renderedHtmlPreview = computed(() => {
    let template = htmlTemplateCommon.value
    if (previewTier.value === 'rare') template = htmlTemplateRare.value
    if (previewTier.value === 'master') template = htmlTemplateMaster.value

    const s = previewSamples[previewTier.value] || previewSamples.common
    return template
      .replace(/{title}/g, s.title)
      .replace(/{description}/g, s.description)
      .replace(/{icon}/g, s.icon)
      .replace(/{game}/g, s.game)
      .replace(/{unlockedAt}/g, s.unlockedAt)
      .replace(/{playtime}/g, s.playtime)
  })

  async function handlePickAudio() {
    try {
      const res = await steamAPI.selectAudioFile()
      if (res.success && res.filePath) {
        customAudioPath.value = res.filePath
        audioFileName.value = res.filePath.split(/[\\/]/).pop() || res.filePath
      }
    } catch (err) {
      console.error('[useThemeBuilder] Erreur sélection audio:', err)
    }
  }

  function testAudioFile() {
    if (customAudioPath.value) {
      try {
        const audio = new Audio(customAudioPath.value)
        audio.volume = 0.8
        audio.play().catch(() => {})
      } catch {
        // ignore
      }
    }
  }

  async function testDraftLive() {
    if (isTestingDraft.value) return
    isTestingDraft.value = true
    saveMessage.value = ''

    try {
      const activeHtml = previewTier.value === 'master'
        ? htmlTemplateMaster.value
        : (previewTier.value === 'rare' ? htmlTemplateRare.value : htmlTemplateCommon.value)

      const res = await steamAPI.broadcastDraftAchievement({
        tier: previewTier.value,
        html: activeHtml,
        css: generatedCss.value,
        visualEffect: selectedEffect.value || 'none',
        displayName: previewSamples[previewTier.value]?.title || 'Succès de Brouillon',
        description: previewSamples[previewTier.value]?.description || 'Prévisualisation en direct de votre création.',
        tiers: {
          common: { html: htmlTemplateCommon.value },
          rare: { html: htmlTemplateRare.value },
          master: { html: htmlTemplateMaster.value }
        }
      })

      if (res.success) {
        saveMessage.value = '🚀 Brouillon diffusé en direct (5s) !'
        setTimeout(() => {
          if (saveMessage.value.includes('Brouillon')) saveMessage.value = ''
        }, 3500)
      } else {
        saveMessage.value = res.error || 'Erreur diffusion brouillon'
      }
    } catch (err) {
      console.error('[useThemeBuilder] Erreur test draft:', err)
      saveMessage.value = 'Erreur: ' + err.message
    } finally {
      setTimeout(() => {
        isTestingDraft.value = false
      }, 1200)
    }
  }

  async function saveQuickTheme() {
    isSaving.value = true
    saveMessage.value = ''

    try {
      const finalId = `theme-quick-${Date.now()}`
      const finalTheme = {
        id: finalId,
        name: themeName.value.trim() || 'Nouveau Thème Rapide',
        html: htmlTemplateCommon.value,
        css: generatedCss.value,
        visualEffect: selectedEffect.value || 'none',
        audioPath: useCustomAudio.value ? customAudioPath.value : null,
        soundEnabled: true,
        soundVolume: 0.8,
        tiers: {
          common: {
            html: htmlTemplateCommon.value,
            soundEnabled: true
          },
          rare: {
            html: htmlTemplateRare.value,
            soundEnabled: true
          },
          master: {
            html: htmlTemplateMaster.value,
            soundEnabled: true
          }
        }
      }

      const res = await steamAPI.saveTheme(finalTheme)
      if (res.success) {
        saveMessage.value = 'Thème enregistré avec succès ! 🎉'
        setTimeout(() => {
          if (emit) {
            emit('saved', res.theme || finalTheme)
            emit('back')
          }
        }, 700)
      } else {
        saveMessage.value = res.error || 'Erreur lors de la sauvegarde'
      }
    } catch (err) {
      saveMessage.value = `Erreur: ${err.message}`
    } finally {
      isSaving.value = false
    }
  }

  onMounted(() => {
    loadSavedPalettes()
  })

  return {
    themeName,
    selectedPresetId,
    primaryColor,
    accentColor,
    backgroundOpacity,
    selectedFont,
    selectedAnimation,
    savedPalettes,
    commonColor,
    rareColor,
    masterColor,
    selectedEffect,
    useCustomAudio,
    customAudioPath,
    audioFileName,
    previewTier,
    isSaving,
    isTestingDraft,
    saveMessage,
    animKey,
    GRADIENT_PRESETS,
    GOOGLE_FONTS,
    VISUAL_EFFECTS,
    effectLabel,
    animationLabel,
    backgroundCssValue,
    generatedCss,
    generatedCssPreview,
    htmlTemplateCommon,
    htmlTemplateRare,
    htmlTemplateMaster,
    previewSamples,
    renderedHtmlPreview,
    applyPreset,
    saveCurrentPalette,
    applySavedPalette,
    removeSavedPalette,
    handlePickAudio,
    testAudioFile,
    testDraftLive,
    saveQuickTheme
  }
}
