// Définition des effets visuels et du système de Tiers pour les overlays Steam

export const VISUAL_EFFECTS = [
  {
    id: 'none',
    name: 'Aucun effet',
    icon: '⚪',
    desc: 'Affichage épuré sans effet supplémentaire'
  },
  {
    id: 'stars',
    name: 'Étoiles Scintillantes',
    icon: '✨',
    desc: 'Étoiles dorées scintillantes qui dansent autour du cadre'
  },
  {
    id: 'neon_contour',
    name: 'Contour Néon Pulsant',
    icon: '⚡',
    desc: 'Bordure lumineuse sweep gradient qui pulse avec intensité'
  },
  {
    id: 'golden_shimmer',
    name: 'Shimmer Doré Balayant',
    icon: '🌟',
    desc: 'Rayon de lumière brillant balayant la carte à intervalles réguliers'
  },
  {
    id: 'embers',
    name: 'Braises Flottantes',
    icon: '🔥',
    desc: 'Particules rougeoyantes incandescentes qui s\'élèvent'
  },
  {
    id: 'cyber_glitch',
    name: 'Aura Cybernétique',
    icon: '🌌',
    desc: 'Halo holographique dynamique et pulsation technologique'
  }
]

export const ACHIEVEMENT_TIERS = {
  common: {
    id: 'common',
    name: 'Succès Standard',
    desc: 'Taux de déblocage mondial supérieur à 10%',
    defaultBadge: 'SUCCÈS DÉBLOQUÉ',
    defaultTitle: 'Tête de classe',
    defaultDesc: 'Jouez un round entier avec chaque classe.',
    defaultGame: 'Team Fortress 2',
    defaultPercent: 42.5,
    icon: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    color: '#f0c330'
  },
  rare: {
    id: 'rare',
    name: 'Succès Rare (< 10%)',
    desc: 'Succès difficile débloqué par moins de 10% des joueurs',
    defaultBadge: '★ SUCCÈS RARE (< 10%)',
    defaultTitle: 'Guerre frontale',
    defaultDesc: 'Terminez une campagne entière uniquement avec des armes de corps à corps.',
    defaultGame: 'Left 4 Dead 2',
    defaultPercent: 4.8,
    icon: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    color: '#a855f7'
  },
  master: {
    id: 'master',
    name: 'Jeu Complété (100% Platine)',
    desc: 'Dernier succès débloqué : 100% de tous les succès du jeu !',
    defaultBadge: '🏆 JEU COMPLÉTÉ (100%)',
    defaultTitle: 'Maître Incontesté (100%)',
    defaultDesc: 'Félicitations ! Vous avez débloqué tous les succès de ce jeu !',
    defaultGame: 'Vampire Survivors',
    defaultPercent: 1.2,
    icon: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    color: '#38bdf8'
  }
}

/**
 * Génère le CSS injecté automatiquement pour supporter les effets de scintillement et les tiers
 */
export function getVisualEffectsCss() {
  return `
/* ========================================================
   STYLES ET EFFETS VISUELS UNIVERSELS (TIERS & SCINTILLEMENTS)
   ======================================================== */

/* Conteneur décoratif d'effet injecté */
.theme-effect-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  overflow: hidden;
  z-index: 10;
}

/* 1. Effet : Étoiles Scintillantes */
.fx-stars .theme-effect-layer::before,
.fx-stars .theme-effect-layer::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-image: 
    radial-gradient(2px 2px at 15% 25%, #fff, rgba(255, 255, 255, 0)),
    radial-gradient(3px 3px at 45% 15%, #ffd700, rgba(255, 215, 0, 0)),
    radial-gradient(2.5px 2.5px at 75% 35%, #fff, rgba(255, 255, 255, 0)),
    radial-gradient(2px 2px at 25% 75%, #ffdb65, rgba(255, 219, 101, 0)),
    radial-gradient(3px 3px at 65% 85%, #fff, rgba(255, 255, 255, 0)),
    radial-gradient(2px 2px at 85% 65%, #ffd700, rgba(255, 215, 0, 0)),
    radial-gradient(1.5px 1.5px at 35% 50%, #fff, rgba(255, 255, 255, 0)),
    radial-gradient(2.5px 2.5px at 90% 20%, #ffd700, rgba(255, 215, 0, 0));
  background-repeat: no-repeat;
  animation: fx-sparkle-dance 2.2s infinite ease-in-out alternate;
  pointer-events: none;
}

.fx-stars .theme-effect-layer::after {
  animation-delay: -1.1s;
  animation-duration: 1.8s;
  transform: rotate(180deg);
}

@keyframes fx-sparkle-dance {
  0% { opacity: 0.2; transform: scale(0.95); }
  50% { opacity: 0.95; transform: scale(1.03); filter: drop-shadow(0 0 6px #ffd700); }
  100% { opacity: 0.3; transform: scale(0.98); }
}

/* 2. Effet : Contour Néon Pulsant */
.fx-neon-contour {
  position: relative;
}

.fx-neon-contour .theme-effect-layer::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(from var(--neon-angle, 0deg), #f0c330, #ff6b6b, #4facfe, #00f2fe, #f0c330);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: fx-neon-spin 3.5s linear infinite;
  filter: drop-shadow(0 0 8px rgba(240, 195, 48, 0.6));
}

@property --neon-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes fx-neon-spin {
  to { --neon-angle: 360deg; }
}

/* Fallback rotation si @property non supporté */
@keyframes fx-neon-spin-fallback {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

/* 3. Effet : Shimmer Doré Balayant */
.fx-golden-shimmer .theme-effect-layer::after {
  content: '';
  position: absolute;
  top: -60%;
  left: -60%;
  width: 220%;
  height: 220%;
  background: linear-gradient(
    115deg,
    transparent 25%,
    rgba(255, 235, 140, 0.05) 42%,
    rgba(255, 245, 180, 0.4) 48%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(255, 245, 180, 0.4) 52%,
    rgba(255, 235, 140, 0.05) 58%,
    transparent 75%
  );
  transform: rotate(25deg);
  animation: fx-shimmer-sweep 3.2s infinite ease-in-out;
  pointer-events: none;
}

@keyframes fx-shimmer-sweep {
  0% { transform: translateX(-150%) rotate(25deg); }
  35%, 100% { transform: translateX(150%) rotate(25deg); }
}

/* 4. Effet : Braises Flottantes */
.fx-embers .theme-effect-layer::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(2px 2px at 20% 80%, #ff5722, transparent),
    radial-gradient(3px 3px at 50% 90%, #ff9800, transparent),
    radial-gradient(2.5px 2.5px at 80% 85%, #ff3d00, transparent),
    radial-gradient(2px 2px at 30% 60%, #ffc107, transparent),
    radial-gradient(3px 3px at 70% 50%, #ff9800, transparent);
  animation: fx-embers-rise 2.5s infinite linear;
}

@keyframes fx-embers-rise {
  0% { transform: translateY(12px); opacity: 0; filter: blur(0px); }
  50% { opacity: 0.9; }
  100% { transform: translateY(-24px); opacity: 0; filter: blur(1.5px); }
}

/* 5. Effet : Aura Cybernétique */
.fx-cyber-glitch .theme-effect-layer::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 24px rgba(0, 242, 254, 0.35), 0 0 16px rgba(0, 242, 254, 0.25);
  animation: fx-cyber-pulse 2s infinite alternate ease-in-out;
}

@keyframes fx-cyber-pulse {
  0% { opacity: 0.3; }
  100% { opacity: 0.9; box-shadow: inset 0 0 32px rgba(0, 242, 254, 0.6), 0 0 24px rgba(0, 242, 254, 0.45); }
}

/* ========================================================
   STYLES SPÉCIFIQUES PAR TIER STEAM
   ======================================================== */

/* Tier Rare (< 10%) */
.tier-rare {
  border-color: rgba(168, 85, 247, 0.8) !important;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.85), 0 0 36px rgba(168, 85, 247, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
}

.tier-rare .card-glow {
  background: radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%) !important;
}

.tier-rare .unlock-tag {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%) !important;
  color: #c084fc !important;
  border-color: rgba(168, 85, 247, 0.5) !important;
  font-weight: 800 !important;
  letter-spacing: 0.06em !important;
}

.tier-rare .icon-container {
  border-color: #a855f7 !important;
  box-shadow: 0 0 18px rgba(168, 85, 247, 0.55) !important;
}

.tier-rare .progress-countdown {
  background: linear-gradient(90deg, #a855f7, #c084fc) !important;
}

/* Tier Master / Platine (100% Jeu Complété) */
.tier-master {
  border-color: rgba(56, 189, 248, 0.9) !important;
  box-shadow: 0 24px 54px rgba(0, 0, 0, 0.9), 0 0 45px rgba(56, 189, 248, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
}

.tier-master .card-glow {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, transparent 70%) !important;
}

.tier-master .unlock-tag {
  background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%) !important;
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.6) !important;
}

.tier-master .icon-container {
  border-color: #38bdf8 !important;
  box-shadow: 0 0 24px rgba(56, 189, 248, 0.7) !important;
}

.tier-master .progress-countdown {
  background: linear-gradient(90deg, #0284c7, #38bdf8, #bae6fd) !important;
}
`
}

/**
 * Prépare et enrichit le HTML final avec les classes d'effet et de tier
 */
export function enrichAchievementHtml(html, { tier = 'common', visualEffect = 'none' } = {}) {
  if (!html) return ''

  let processed = html
  const tierClass = tier === 'master' ? 'tier-master' : (tier === 'rare' ? 'tier-rare' : 'tier-common')
  const fxClass = visualEffect && visualEffect !== 'none' ? `fx-${visualEffect.replace(/_/g, '-')}` : ''

  // Insère le calque d'effet et les classes sur la carte racine
  if (!processed.includes('theme-effect-layer') && visualEffect && visualEffect !== 'none') {
    processed = processed.replace(/(<div[^>]*class=["'][^"']*card[^"']*["'][^>]*>)/i, '$1<div class="theme-effect-layer"></div>')
  }

  // Ajoute les classes de tier et fx sur le premier conteneur
  processed = processed.replace(/(class=["'])/i, `$1${tierClass} ${fxClass} `)

  return processed
}
