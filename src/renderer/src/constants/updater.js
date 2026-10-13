/**
 * Constantes pour le système de mise à jour automatique (Tauri Auto-Updater).
 */

export const UPDATER_STATUS = Object.freeze({
  IDLE: 'IDLE',
  CHECKING: 'CHECKING',
  AVAILABLE: 'AVAILABLE',
  UP_TO_DATE: 'UP_TO_DATE',
  DOWNLOADING: 'DOWNLOADING',
  READY: 'READY',
  ERROR: 'ERROR'
})
