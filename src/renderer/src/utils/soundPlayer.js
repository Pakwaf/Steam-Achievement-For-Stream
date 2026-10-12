// Moteur audio universel haute fiabilité pour Electron (Web Audio API + AudioContext + Fallback HTML5)
let sharedAudioCtx = null
let persistentAudioEl = null

/**
 * Initialise ou réactive le contexte audio Web Audio API
 */
export async function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx()
  }

  if (sharedAudioCtx.state === 'suspended') {
    try {
      await sharedAudioCtx.resume()
    } catch {
      // Ignorer si verrouillé temporairement
    }
  }

  return sharedAudioCtx
}

/**
 * Récupère la liste des périphériques de sortie audio disponibles sous Windows
 * (ex: Sortie par défaut, Elgato Wave Link SFX, Casque, Enceintes, etc.)
 */
export async function getAudioOutputDevices(forcePrompt = false) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return [{ deviceId: 'default', label: 'Périphérique Windows par défaut' }]
  }

  try {
    let devices = await navigator.mediaDevices.enumerateDevices()
    let outputs = devices.filter((d) => d.kind === 'audiooutput')

    // Si les étiquettes sont masquées par WebView2 ou si seul 'default' apparaît, débloquer l'accès
    const hasLabels = outputs.some((d) => d.label && d.label.trim().length > 0)
    if ((!hasLabels || outputs.length <= 1 || forcePrompt) && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
        devices = await navigator.mediaDevices.enumerateDevices()
        outputs = devices.filter((d) => d.kind === 'audiooutput')
      } catch (err) {
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
    console.warn('[SoundPlayer] Impossible d\'énumérer les périphériques audio:', err)
    return [{ deviceId: 'default', label: 'Périphérique Windows par défaut' }]
  }
}

/**
 * Obtient ou crée un élément <audio> persistant dans le DOM (immunisé au Garbage Collector de V8)
 */
function getPersistentAudioElement() {
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
 * Convertit une chaîne Base64 en ArrayBuffer pour décodage direct en mémoire
 */
function base64ToArrayBuffer(base64) {
  const clean = (base64 || '').replace(/[\s\r\n]+/g, '')
  const binaryString = window.atob(clean)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// Configuration globale du son (partagée par tous les thèmes et configurable dans les paramètres généraux)
let globalAudioSettings = {
  deviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}

// Charger les paramètres audio globaux depuis le stockage local si disponible
if (typeof localStorage !== 'undefined') {
  try {
    const saved = localStorage.getItem('steam_overlay_global_audio')
    if (saved) {
      globalAudioSettings = { ...globalAudioSettings, ...JSON.parse(saved) }
    }
  } catch {
    // ignore
  }
}

export function getGlobalAudioSettings() {
  return { ...globalAudioSettings }
}

export function setGlobalAudioSettings(settings = {}) {
  globalAudioSettings = {
    ...globalAudioSettings,
    ...settings
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('steam_overlay_global_audio', JSON.stringify(globalAudioSettings))
    } catch {
      // ignore
    }
  }
  return { ...globalAudioSettings }
}

/**
 * Joue le carillon synthétique par défaut avec Web Audio API adapté au TIER
 * - 'common' : Chime classique Ré-La (D5 + A5)
 * - 'rare'   : Arpège céleste étincelant Mi-Sol#-Do (E5 + G#5 + C6)
 * - 'master' : Fanfare triomphante 4 notes 100% Platine (C5 + E5 + G5 + C6)
 */
export async function playSynthesizedChime(volume = 0.8, deviceId = 'default', tier = 'common') {
  try {
    const ctx = await getAudioContext()
    if (!ctx) return false

    // Priorité au périphérique global si configuré et si deviceId est 'default'
    const targetDevice = (deviceId && deviceId !== 'default') ? deviceId : globalAudioSettings.deviceId

    if (targetDevice && targetDevice !== 'default' && typeof ctx.setSinkId === 'function') {
      try {
        await ctx.setSinkId(targetDevice)
      } catch (e) {
        console.warn('[SoundPlayer] setSinkId non supporté ou ignoré pour le carillon:', e)
      }
    }

    const now = ctx.currentTime
    const vol = Math.min(1, Math.max(0, volume)) * 0.35

    if (tier === 'master') {
      // Fanfare triomphante Platine / 100% (Do5 -> Mi5 -> Sol5 -> Do6 avec résonance d'accords)
      const notes = [
        { f: 523.25, t: 0.00, dur: 0.35, v: 0.8 }, // C5
        { f: 659.25, t: 0.12, dur: 0.40, v: 0.85 }, // E5
        { f: 783.99, t: 0.24, dur: 0.45, v: 0.9 }, // G5
        { f: 1046.50, t: 0.36, dur: 0.90, v: 1.2 } // C6 (triomphe)
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
    } else if (tier === 'rare') {
      // Arpège mystique / rare (< 10%) étincelant (Mi5 -> Sol#5 -> Do6)
      const notes = [
        { f: 659.25, t: 0.00, dur: 0.40, v: 0.85 }, // E5
        { f: 830.61, t: 0.11, dur: 0.45, v: 0.95 }, // G#5
        { f: 1046.50, t: 0.22, dur: 0.75, v: 1.1 }  // C6
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
    console.warn('[SoundPlayer] Échec carillon synthétisé:', err)
    return false
  }
}

/**
 * Joue le son de notification configuré pour un succès
 * Tente d'abord le décodage direct en mémoire PCM (Web Audio), puis HTML5 Audio persistant, puis carillon par défaut
 * @param {Object} themeData - { soundEnabled, soundVolume, audioPath, audioDeviceId }
 * @param {String} tier - 'common' | 'rare' | 'master'
 */
export async function playAchievementSound(themeData = {}, tier = 'common') {
  const isEnabled = themeData.soundEnabled ?? globalAudioSettings.soundEnabled ?? true
  if (!isEnabled) return

  const volume = typeof themeData.soundVolume === 'number'
    ? themeData.soundVolume
    : (globalAudioSettings.soundVolume ?? 0.8)

  // Priorité au périphérique global si configuré et si le thème n'a pas surchargé
  const deviceId = (themeData.audioDeviceId && themeData.audioDeviceId !== 'default')
    ? themeData.audioDeviceId
    : (globalAudioSettings.deviceId || 'default')

  // Si un fichier personnalisé est configuré
  let customAudioPath = themeData.audioPath
  if (customAudioPath === undefined && window.steamAPI?.getActiveTheme) {
    try {
      const active = await window.steamAPI.getActiveTheme()
      customAudioPath = active?.audioPath || null
    } catch {
      // ignore
    }
  }

  if (customAudioPath && window.steamAPI?.getAudioData) {
    try {
      const audioInfo = await window.steamAPI.getAudioData(customAudioPath)

      if (audioInfo?.hasAudio && audioInfo.dataUrl) {
        // --- ÉTAPE 1 : Décodage Web Audio API (haute fidélité, zéro latence, immunisé au GC) ---
        try {
          const ctx = await getAudioContext()
          if (ctx) {
            // Routage périphérique de sortie si configuré
            if (deviceId && deviceId !== 'default' && typeof ctx.setSinkId === 'function') {
              try {
                await ctx.setSinkId(deviceId)
              } catch (e) {
                console.warn('[SoundPlayer] Échec setSinkId AudioContext:', e)
              }
            }

            // Extraction du buffer binaire
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
          console.warn('[SoundPlayer] Échec Web Audio, essai HTML5 persistant:', webAudioErr.message)
        }

        // --- ÉTAPE 2 : Élément HTML5 Audio persistant dans le DOM (avec setSinkId) ---
        try {
          const audioEl = getPersistentAudioElement()
          if (audioEl) {
            if (deviceId && deviceId !== 'default' && typeof audioEl.setSinkId === 'function') {
              try {
                await audioEl.setSinkId(deviceId)
              } catch (e) {
                console.warn('[SoundPlayer] Échec setSinkId HTML5 Audio:', e)
              }
            }
            audioEl.volume = Math.min(1, Math.max(0, volume))
            audioEl.src = audioInfo.dataUrl
            await audioEl.play()
            return true
          }
        } catch (html5Err) {
          console.warn('[SoundPlayer] Échec HTML5 Audio, essai OBS stream fallback:', html5Err.message)
        }

        // --- ÉTAPE 3 : Streaming HTTP local via le serveur OBS intégré ---
        try {
          const fallbackAudio = new Audio('http://127.0.0.1:8080/audio/custom?_t=' + Date.now())
          fallbackAudio.volume = Math.min(1, Math.max(0, volume))
          if (deviceId && deviceId !== 'default' && typeof fallbackAudio.setSinkId === 'function') {
            await fallbackAudio.setSinkId(deviceId).catch(() => {})
          }
          await fallbackAudio.play()
          return true
        } catch (obsStreamErr) {
          console.warn('[SoundPlayer] Échec OBS stream fallback:', obsStreamErr.message)
        }
      }
    } catch (err) {
      console.warn('[SoundPlayer] Erreur chargement données audio personnalisées:', err)
    }
  }

  // --- ÉTAPE 3 : Fallback Carillon synthétisé par défaut (adapté au tier standard, rare ou 100%) ---
  return await playSynthesizedChime(volume, deviceId, tier)
}
