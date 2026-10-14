/**
 * Générateur de document HTML complet pour l'isolation en Iframe Sandboxée.
 * Combine de manière étanche le HTML, le CSS du thème et les effets visuels universels.
 * 
 * Sécurité :
 * Le document est injecté directement dans l'iframe via iframeDoc.open() / iframeDoc.write() / iframeDoc.close().
 * L'attribut sandbox="allow-same-origin" (SANS allow-scripts) garantit :
 * 1. Accès JS complet pour le composant Vue parent à l'intérieur de l'iframe.
 * 2. Chargement sans restriction des images CDN (Steam) et des polices.
 * 3. Blocage absolu de toute exécution de script malveillant (XSS) dans le thème.
 */

export function buildThemeIframeDocument({
  html = '',
  css = '',
  visualEffectsCss = '',
  tierClass = '',
  fxClass = '',
  center = false
} = {}) {
  const centerStyles = center
    ? `
    html, body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .custom-achievement-card,
    .cyber-achievement-card,
    .minimal-achievement-card,
    div[class*="achievement-card"],
    div[class*="card"] {
      position: relative !important;
      top: auto !important;
      bottom: auto !important;
      left: auto !important;
      right: auto !important;
      margin: 0 auto !important;
      transform: none !important;
    }
    img, .ach-icon, .mini-icon, .cyber-icon {
      max-width: 64px !important;
      max-height: 64px !important;
      object-fit: cover !important;
      border-radius: 8px !important;
    }
    `
    : ''

  const layerClassList = ['theme-effect-layer', tierClass, fxClass].filter(Boolean).join(' ')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent !important;
      overflow: hidden;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
    }

    /* Styles et keyframes des effets visuels universels (étoiles, néon, shimmer...) */
    ${visualEffectsCss || ''}

    /* Styles personnalisés du thème actif */
    ${css || ''}

    ${centerStyles}
  </style>
</head>
<body>
  <div class="${layerClassList}">
    ${html || ''}
  </div>
</body>
</html>`
}

/**
 * Injection synchrone et sécurisée dans le document d'une iframe sandboxée allow-same-origin.
 */
export function writeHtmlToIframe(iframeEl, fullHtml) {
  if (!iframeEl) return false
  try {
    const iframeDoc = iframeEl.contentWindow?.document || iframeEl.contentDocument
    if (!iframeDoc) return false
    iframeDoc.open()
    iframeDoc.write(fullHtml || '<!DOCTYPE html><html><body style="background:transparent;"></body></html>')
    iframeDoc.close()
    return true
  } catch (err) {
    console.error('[writeHtmlToIframe] Erreur lors de l\'injection dans l\'iframe:', err)
    return false
  }
}
