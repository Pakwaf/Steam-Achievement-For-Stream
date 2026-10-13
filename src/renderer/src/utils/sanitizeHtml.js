import DOMPurify from 'dompurify'

/**
 * Configuration stricte de purification HTML pour les templates de succès.
 * Empêche formellement l'injection de scripts, d'iframes, de formulaires et de handlers d'événements.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'div', 'span', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'b', 'i', 'strong', 'em', 'small', 'br', 'hr', 'ul', 'ol', 'li',
    'section', 'article', 'header', 'footer',
    'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'g', 'defs', 'use'
  ],
  ALLOWED_ATTR: [
    'class', 'id', 'src', 'alt', 'style', 'width', 'height', 'title',
    'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'points', 'cx', 'cy', 'r', 'x', 'y', 'rx', 'ry', 'xmlns'
  ],
  ADD_URI_SAFE_ATTR: ['src'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$)|data:|{|%7B)/i,
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onmouseenter',
    'onmouseleave', 'onkeydown', 'onkeyup', 'formaction', 'srcdoc'
  ],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form']
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
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\son\w+=\S+/gi, '')
    .replace(/javascript:[^"'\s]*/gi, '')
}

export { DOMPurify, SANITIZE_CONFIG }
