/**
 * Constantes pour les clés de persistance LocalStorage.
 * Élimine toute "Magic String" dans le stockage local du navigateur/webview.
 */

export const STORAGE_KEYS = Object.freeze({
  THEMES: 'steam_overlay_themes_v2',
  GLOBAL_AUDIO: 'steam_overlay_global_audio',
  STEAM_API_KEY: 'steam_api_key',
  STEAM_USER: 'steam_user',
  APP_SETTINGS: 'app_settings'
})
