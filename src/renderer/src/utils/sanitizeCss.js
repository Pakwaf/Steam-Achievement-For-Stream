/**
 * Neutralise les tentatives de fermeture prématurée de la balise <style>.
 */
export function sanitizeCss(cssString) {
  if (!cssString || typeof cssString !== 'string') return ''
  return cssString.replace(/<\/style/gi, '<\\/style')
}
