/**
 * soundPlayer.js - Façade de rétro-compatibilité
 * Toutes les fonctionnalités Web Audio API, routage setSinkId, oscillateurs et décodage PCM
 * sont désormais encapsulées de façon modulaire dans le composable useAudioEngine.js.
 */

export {
  getAudioContext,
  base64ToArrayBuffer,
  getPersistentAudioElement,
  getAudioOutputDevices,
  getGlobalAudioSettings,
  setGlobalAudioSettings,
  playSynthesizedChime,
  playAchievementSound
} from '../composables/useAudioEngine.js'
