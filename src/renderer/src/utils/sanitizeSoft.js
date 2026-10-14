/**
 * Sanitisation douce (Safe HTML) pour le moteur de rendu natif de Vue 3.
 * Neutralise les vecteurs d'exécution active (XSS) sans altérer les balises HTML légitimes,
 * les attributs de styles inline, les SVG complexes, ni la structure CSS des thèmes.
 */
export function sanitizeSoft(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return ''

  let safe = htmlString

  // 1. Suppression stricte des balises d'exécution de code et d'embarquement externe
  safe = safe.replace(/<\/?(script|iframe|object|embed|applet|base)[^>]*>/gi, '')

  // 2. Suppression des gestionnaires d'événements inline (onclick, onerror, onload, onmouseover, onfocus, etc.)
  safe = safe.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  // 3. Neutralisation des pseudo-protocoles d'exécution dans les liens et sources
  safe = safe.replace(/href\s*=\s*["']?\s*javascript:[^"'>]*["']?/gi, 'href="#"')
  safe = safe.replace(/src\s*=\s*["']?\s*javascript:[^"'>]*["']?/gi, 'src=""')
  safe = safe.replace(/href\s*=\s*["']?\s*data:text\/html[^"'>]*["']?/gi, 'href="#"')

  return safe
}

/**
 * Neutralise les tentatives de fermeture prématurée de la balise <style>.
 */
export function sanitizeCss(cssString) {
  if (!cssString || typeof cssString !== 'string') return ''
  return cssString.replace(/<\/style/gi, '<\\/style')
}
