import DOMPurify from 'dompurify'

/**
 * Configuration stricte de purification HTML pour les templates de succès.
 * Empêche formellement l'injection de scripts, d'iframes, de formulaires et de handlers d'événements.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'strong', 'em', 'b', 'i', 'small', 'br', 'hr',
    'ul', 'ol', 'li', 'section', 'article', 'header', 'footer'
  ],
  ALLOWED_ATTR: [
    'class', 'id', 'style', 'src', 'alt', 'width', 'height', 'title'
  ],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'base', 'meta', 'svg'],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onmouseenter',
    'onmouseleave', 'onkeydown', 'onkeyup', 'formaction', 'srcdoc'
  ],
  ALLOW_DATA_ATTR: false,
  FORCE_BODY: false
}

function getSanitizer() {
  if (typeof DOMPurify?.sanitize === 'function') {
    return DOMPurify
  }
  if (typeof DOMPurify === 'function' && typeof window !== 'undefined') {
    return DOMPurify(window)
  }
  return null
}

/**
 * Nettoie et sécurise un fragment de HTML de succès contre les attaques XSS.
 * @param {string|null|undefined} rawHtml HTML brut à assainir
 * @returns {string} HTML sécurisé
 */
export function sanitizeAchievementHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return ''
  const sanitizer = getSanitizer()
  if (sanitizer && typeof sanitizer.sanitize === 'function') {
    return sanitizer.sanitize(rawHtml, SANITIZE_CONFIG)
  }
  // Fallback sécurisé en environnement non-DOM (Node / SSR)
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\son\w+=\S+/gi, '')
    .replace(/javascript:[^"'\s]*/gi, '')
}
