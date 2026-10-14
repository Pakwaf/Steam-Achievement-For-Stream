/**
 * Constantes pour les événements et commandes Tauri IPC.
 * Élimine toute "Magic String" dans le code frontend.
 */

export const IPC_EVENTS = Object.freeze({
  AUTH_STATUS_CHANGED: 'steam:auth-status-changed',
  ACHIEVEMENT_UNLOCKED: 'steam:achievement-unlocked',
  OBS_STATUS_CHANGED: 'obs:status-changed',
  CUSTOMIZATION_UPDATED: 'customization:updated'
})

export const IPC_COMMANDS = Object.freeze({
  LOGIN: 'login',
  LOGOUT: 'logout',
  GET_CURRENT_USER: 'get_current_user',
  OPEN_EXTERNAL: 'open_external',
  GET_TRACKER_STATUS: 'get_tracker_status',
  SIMULATE_ACHIEVEMENT: 'simulate_achievement',
  GET_OBS_STATUS: 'get_obs_status',
  BROADCAST_TEST_ACHIEVEMENT: 'broadcast_test_achievement',
  BROADCAST_DRAFT_ACHIEVEMENT: 'broadcast_draft_achievement',
  SELECT_AUDIO_FILE: 'select_audio_file',
  GET_AUDIO_DATA: 'get_audio_data',
  GET_STEAM_API_KEY: 'get_steam_api_key',
  SAVE_STEAM_API_KEY: 'save_steam_api_key',
  GET_APP_SETTINGS: 'get_app_settings',
  SAVE_APP_SETTINGS: 'save_app_settings',
  SET_OBS_PORT: 'set_obs_port',
  GET_THEME_LIBRARY: 'get_theme_library',
  SAVE_THEME_LIBRARY: 'save_theme_library',
  UPDATE_CUSTOMIZATION: 'update_customization'
})
