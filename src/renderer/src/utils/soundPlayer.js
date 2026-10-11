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
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Joue le carillon synthétique par défaut avec Web Audio API (D5 + A5 harmonisés)
 */
export async function playSynthesizedChime(volume = 0.8, deviceId = 'default') {
  try {
    const ctx = await getAudioContext()
    if (!ctx) return false

    // Routage vers le périphérique spécifique si supporté
    if (deviceId && deviceId !== 'default' && typeof ctx.setSinkId === 'function') {
      try {
        await ctx.setSinkId(deviceId)
      } catch (e) {
        console.warn('[SoundPlayer] setSinkId non supporté ou ignoré pour le carillon:', e)
      }
    }

    const now = ctx.currentTime
    const vol = Math.min(1, Math.max(0, volume)) * 0.35 // Volume agréable et bien audible

    // Note 1 : Ré (D5) 587.33 Hz
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

    // Note 2 : La (A5) 880.00 Hz
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
 */
export async function playAchievementSound(themeData = {}) {
  const isEnabled = themeData.soundEnabled ?? true
  if (!isEnabled) return

  const volume = typeof themeData.soundVolume === 'number' ? themeData.soundVolume : 0.8
  const deviceId = themeData.audioDeviceId || 'default'

  // Si un fichier personnalisé est configuré
  if (themeData.audioPath && window.steamAPI?.getAudioData) {
    try {
      const audioInfo = await window.steamAPI.getAudioData()

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
          console.warn('[SoundPlayer] Échec HTML5 Audio:', html5Err.message)
        }
      }
    } catch (err) {
      console.warn('[SoundPlayer] Erreur chargement données audio personnalisées:', err)
    }
  }

  // --- ÉTAPE 3 : Fallback Carillon synthétisé par défaut ---
  return await playSynthesizedChime(volume, deviceId)
}
