import { ref, onMounted } from 'vue'
import { steamAPI } from '../services/steamApi.js'
import { STORAGE_KEYS, ACHIEVEMENT_TIERS_KEYS } from '../constants/index.js'

// Singleton AudioContext partagé
let sharedAudioCtx = null
let persistentAudioEl = null

/**
 * Initialise ou réactive le contexte audio Web Audio API
 */
export async function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx()
  }

  if (sharedAudioCtx.state === 'suspended') {
    try {
      await sharedAudioCtx.resume()
    } catch {
      // Ignoré si verrouillé temporairement par la politique de lecture automatique
    }
  }

  return sharedAudioCtx
}

/**
 * Convertit une chaîne Base64 en ArrayBuffer pour décodage direct en mémoire
 */
export function base64ToArrayBuffer(base64) {
  const clean = (base64 || '').replace(/[\s\r\n]+/g, '')
  const binaryString = window.atob(clean)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Récupère ou crée un élément <audio> persistant dans le DOM (immunisé au Garbage Collector)
 */
export function getPersistentAudioElement() {
  if (typeof document === 'undefined') return null
  if (!persistentAudioEl) {
    persistentAudioEl = document.getElementById('global-achievement-audio-element')
    if (!persistentAudioEl && document.body) {
      persistentAudioEl = document.createElement('audio')
      persistentAudioEl.id = 'global-achievement-audio-element'
      persistentAudioEl.style.display = 'none'
      persistentAudioEl.preload = 'auto'
      document.body.appendChild(persistentAudioEl)
    }
  }
  return persistentAudioEl
}

/**
 * Récupère la liste des périphériques de sortie audio disponibles sous Windows
 */
export async function getAudioOutputDevices(forcePrompt = false) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return [{ deviceId: 'default', label: 'Périphérique Windows par défaut' }]
  }

  try {
    let devices = await navigator.mediaDevices.enumerateDevices()
    let outputs = devices.filter((d) => d.kind === 'audiooutput')

    // Si les étiquettes sont masquées par WebView2, demander la permission audio
    const hasLabels = outputs.some((d) => d.label && d.label.trim().length > 0)
    if ((!hasLabels || outputs.length <= 1 || forcePrompt) && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
        devices = await navigator.mediaDevices.enumerateDevices()
        outputs = devices.filter((d) => d.kind === 'audiooutput')
      } catch {
        // En cas de refus ou d'absence de micro, continuer avec les périphériques obtenus
      }
    }

    const mapped = outputs
      .map((d, index) => {
        let label = d.label ? d.label.trim() : ''
        if (!label) {
          label = d.deviceId === 'default' ? 'Périphérique Windows par défaut' : `Sortie audio #${index + 1}`
        }
        return {
          deviceId: d.deviceId,
          label
        }
      })
      .filter((d) => Boolean(d.deviceId))

    if (!mapped.some((d) => d.deviceId === 'default')) {
      mapped.unshift({
        deviceId: 'default',
        label: 'Périphérique Windows par défaut'
      })
    }

    // Dédupliquer par deviceId
    const seen = new Set()
    const unique = []
    for (const item of mapped) {
      if (!seen.has(item.deviceId)) {
        seen.add(item.deviceId)
        unique.push(item)
      }
    }

    return unique
  } catch (err) {
    console.warn('[useAudioEngine] Impossible d\'énumérer les périphériques audio:', err)
    return [{ deviceId: 'default', label: 'Périphérique Windows par défaut' }]
  }
}

// Paramètres audio globaux persistants en mémoire et LocalStorage
let globalAudioConfig = {
  deviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}

if (typeof localStorage !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GLOBAL_AUDIO)
    if (saved) {
      globalAudioConfig = { ...globalAudioConfig, ...JSON.parse(saved) }
    }
  } catch {
    // ignore
  }
}

export function getGlobalAudioSettings() {
  return { ...globalAudioConfig }
}

export function setGlobalAudioSettings(settings = {}) {
  globalAudioConfig = {
    ...globalAudioConfig,
    ...settings
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_AUDIO, JSON.stringify(globalAudioConfig))
    } catch {
      // ignore
    }
  }
  return { ...globalAudioConfig }
}

/**
 * Joue le carillon synthétique Web Audio API avec oscillateurs et enveloppes ADSR
 * @param {number} volume - Volume de 0 à 1
 * @param {string} deviceId - ID du périphérique de sortie
 * @param {string} tier - 'common' | 'rare' | 'master'
 */
export async function playSynthesizedChime(volume = 0.8, deviceId = 'default', tier = ACHIEVEMENT_TIERS_KEYS.COMMON) {
  try {
    const ctx = await getAudioContext()
    if (!ctx) return false

    const targetDevice = (deviceId && deviceId !== 'default') ? deviceId : globalAudioConfig.deviceId

    if (targetDevice && targetDevice !== 'default' && typeof ctx.setSinkId === 'function') {
      try {
        await ctx.setSinkId(targetDevice)
      } catch (e) {
        console.warn('[useAudioEngine] setSinkId non supporté ou ignoré pour AudioContext:', e)
      }
    }

    const now = ctx.currentTime
    const vol = Math.min(1, Math.max(0, volume)) * 0.35

    if (tier === ACHIEVEMENT_TIERS_KEYS.MASTER) {
      // Fanfare triomphante Platine / 100% : C5 -> E5 -> G5 -> C6
      const notes = [
        { f: 523.25, t: 0.00, dur: 0.35, v: 0.8 },
        { f: 659.25, t: 0.12, dur: 0.40, v: 0.85 },
        { f: 783.99, t: 0.24, dur: 0.45, v: 0.9 },
        { f: 1046.50, t: 0.36, dur: 0.90, v: 1.2 }
      ]
      for (const note of notes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = note.f > 800 ? 'sine' : 'triangle'
        osc.frequency.setValueAtTime(note.f, now + note.t)
        gain.gain.setValueAtTime(vol * note.v, now + note.t)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.dur)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + note.t)
        osc.stop(now + note.t + note.dur + 0.05)
      }
    } else if (tier === ACHIEVEMENT_TIERS_KEYS.RARE) {
      // Arpège mystique rare (< 10%) : E5 -> G#5 -> C6
      const notes = [
        { f: 659.25, t: 0.00, dur: 0.40, v: 0.85 },
        { f: 830.61, t: 0.11, dur: 0.45, v: 0.95 },
        { f: 1046.50, t: 0.22, dur: 0.75, v: 1.1 }
      ]
      for (const note of notes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(note.f, now + note.t)
        gain.gain.setValueAtTime(vol * note.v, now + note.t)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.dur)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + note.t)
        osc.stop(now + note.t + note.dur + 0.05)
      }
    } else {
      // Standard (> 10%) : Ré (D5) -> La (A5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(587.33, now)
      gain1.gain.setValueAtTime(vol * 0.9, now)
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.46)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(880.00, now + 0.1)
      gain2.gain.setValueAtTime(vol * 1.0, now + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.1)
      osc2.stop(now + 0.76)
    }

    return true
  } catch (err) {
    console.warn('[useAudioEngine] Échec carillon synthétisé:', err)
    return false
  }
}

/**
 * Joue le son d'un succès (Web Audio API PCM -> HTML5 Audio persistant -> Streaming local OBS -> Carillon)
 */
export async function playAchievementSound(themeData = {}, tier = ACHIEVEMENT_TIERS_KEYS.COMMON) {
  const isEnabled = themeData.soundEnabled ?? globalAudioConfig.soundEnabled ?? true
  if (!isEnabled) return false

  const volume = typeof themeData.soundVolume === 'number'
    ? themeData.soundVolume
    : (globalAudioConfig.soundVolume ?? 0.8)

  const deviceId = (themeData.audioDeviceId && themeData.audioDeviceId !== 'default')
    ? themeData.audioDeviceId
    : (globalAudioConfig.deviceId || 'default')

  let customAudioPath = themeData.tiers?.[tier]?.audioPath || themeData.audioPath
  if (customAudioPath === undefined) {
    try {
      const active = await steamAPI.getActiveTheme()
      customAudioPath = active?.tiers?.[tier]?.audioPath || active?.audioPath || null
    } catch {
      // ignore
    }
  }

  if (customAudioPath) {
    try {
      const audioInfo = await steamAPI.getAudioData(customAudioPath)
      if (audioInfo?.hasAudio && audioInfo.dataUrl) {
        // --- ÉTAPE 1 : Décodage PCM Web Audio API ---
        try {
          const ctx = await getAudioContext()
          if (ctx) {
            if (deviceId && deviceId !== 'default' && typeof ctx.setSinkId === 'function') {
              try {
                await ctx.setSinkId(deviceId)
              } catch (e) {
                console.warn('[useAudioEngine] Échec setSinkId AudioContext:', e)
              }
            }

            let arrayBuf = null
            if (audioInfo.rawBuffer) {
              arrayBuf = audioInfo.rawBuffer
            } else if (audioInfo.dataUrl.includes('base64,')) {
              const base64Data = audioInfo.dataUrl.split('base64,')[1]
              arrayBuf = base64ToArrayBuffer(base64Data)
            }

            if (arrayBuf) {
              const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0))
              const source = ctx.createBufferSource()
              source.buffer = audioBuffer

              const gainNode = ctx.createGain()
              gainNode.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime)

              source.connect(gainNode)
              gainNode.connect(ctx.destination)
              source.start(0)
              return true
            }
          }
        } catch (webAudioErr) {
          console.warn('[useAudioEngine] Échec Web Audio, essai HTML5:', webAudioErr.message)
        }

        // --- ÉTAPE 2 : HTML5 Audio persistant ---
        try {
          const audioEl = getPersistentAudioElement()
          if (audioEl) {
            if (deviceId && deviceId !== 'default' && typeof audioEl.setSinkId === 'function') {
              try {
                await audioEl.setSinkId(deviceId)
              } catch (e) {
                console.warn('[useAudioEngine] Échec setSinkId HTML5 Audio:', e)
              }
            }
            audioEl.volume = Math.min(1, Math.max(0, volume))
            audioEl.src = audioInfo.dataUrl
            await audioEl.play()
            return true
          }
        } catch (html5Err) {
          console.warn('[useAudioEngine] Échec HTML5 Audio, essai OBS stream:', html5Err.message)
        }

        // --- ÉTAPE 3 : Streaming OBS HTTP local ---
        try {
          const fallbackAudio = new Audio('http://127.0.0.1:8080/audio/custom?_t=' + Date.now())
          fallbackAudio.volume = Math.min(1, Math.max(0, volume))
          if (deviceId && deviceId !== 'default' && typeof fallbackAudio.setSinkId === 'function') {
            await fallbackAudio.setSinkId(deviceId).catch(() => {})
          }
          await fallbackAudio.play()
          return true
        } catch (obsStreamErr) {
          console.warn('[useAudioEngine] Échec OBS stream fallback:', obsStreamErr.message)
        }
      }
    } catch (err) {
      console.warn('[useAudioEngine] Erreur chargement audio:', err)
    }
  }

  // Fallback carillon synthétisé par défaut
  return await playSynthesizedChime(volume, deviceId, tier)
}

/**
 * Composable Vue 3 réactif pour le contrôle de l'audio dans les composants
 */
export function useAudioEngine() {
  const isPlayingSound = ref(false)
  const audioDevices = ref([
    { deviceId: 'default', label: 'Périphérique Windows par défaut' }
  ])

  const globalSettings = getGlobalAudioSettings()
  const soundEnabled = ref(globalSettings.soundEnabled ?? true)
  const soundVolume = ref(globalSettings.soundVolume ?? 0.8)
  const selectedAudioDevice = ref(globalSettings.deviceId || 'default')

  async function refreshAudioDevices(forcePrompt = false) {
    try {
      const outputs = await getAudioOutputDevices(forcePrompt)
      if (outputs && outputs.length > 0) {
        audioDevices.value = outputs
      }
    } catch (err) {
      console.warn('[useAudioEngine] Erreur refreshAudioDevices:', err)
    }
  }

  function updateGlobalAudio(settings = {}) {
    if (typeof settings.soundEnabled === 'boolean') {
      soundEnabled.value = settings.soundEnabled
    }
    if (typeof settings.soundVolume === 'number') {
      soundVolume.value = settings.soundVolume
    }
    if (settings.deviceId) {
      selectedAudioDevice.value = settings.deviceId
    }

    return setGlobalAudioSettings({
      soundEnabled: soundEnabled.value,
      soundVolume: soundVolume.value,
      deviceId: selectedAudioDevice.value,
      ...settings
    })
  }

  async function playSound(themeData = {}, tier = ACHIEVEMENT_TIERS_KEYS.COMMON) {
    if (isPlayingSound.value || !soundEnabled.value) return false
    isPlayingSound.value = true

    try {
      return await playAchievementSound({
        soundEnabled: soundEnabled.value,
        soundVolume: soundVolume.value,
        audioDeviceId: selectedAudioDevice.value,
        ...themeData
      }, tier)
    } catch (err) {
      console.error('[useAudioEngine] Erreur playSound:', err)
      return false
    } finally {
      setTimeout(() => {
        isPlayingSound.value = false
      }, 900)
    }
  }

  async function playChime(tier = ACHIEVEMENT_TIERS_KEYS.COMMON) {
    if (isPlayingSound.value || !soundEnabled.value) return false
    isPlayingSound.value = true

    try {
      return await playSynthesizedChime(soundVolume.value, selectedAudioDevice.value, tier)
    } catch (err) {
      console.error('[useAudioEngine] Erreur playChime:', err)
      return false
    } finally {
      setTimeout(() => {
        isPlayingSound.value = false
      }, 900)
    }
  }

  onMounted(() => {
    refreshAudioDevices()
  })

  return {
    soundEnabled,
    soundVolume,
    selectedAudioDevice,
    audioDevices,
    isPlayingSound,
    refreshAudioDevices,
    updateGlobalAudio,
    playSound,
    playChime
  }
}
