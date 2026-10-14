/**
 * Générateur de document HTML complet pour l'isolation en Iframe Sandboxée.
 * Combine de manière étanche le HTML, le CSS du thème et les effets visuels universels.
 * 
 * Sécurité :
 * Le document est destiné à être injecté dans <iframe sandbox="" :srcdoc="...">.
 * L'attribut sandbox="" strict (sans allow-scripts) garantit une neutralisation absolue
 * de toute tentative d'injection XSS sans altérer le CSS, les SVG ou les animations.
 */

export function buildThemeIframeDocument({
  html = '',
  css = '',
  visualEffectsCss = '',
  center = false
} = {}) {
  const alignmentStyles = center
    ? `display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;`
    : `display: flex; align-items: flex-end; justify-content: flex-end; width: 100%; height: 100%; padding: 12px;`

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
      ${alignmentStyles}
    }

    /* Neutralisation du positionnement fixe hérité pour épouser parfaitement l'iframe */
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
      margin: ${center ? '0 auto' : '0'} !important;
      transform: none !important;
    }

    /* Styles et keyframes des effets visuels universels (étoiles, néon, shimmer...) */
    ${visualEffectsCss || ''}

    /* Styles personnalisés du thème actif */
    ${css || ''}
  </style>
</head>
<body>
  ${html || ''}
</body>
</html>`
}
