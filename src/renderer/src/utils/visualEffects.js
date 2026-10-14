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
    defaultPlaytime: 142.5,
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

.theme-effect-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  overflow: hidden;
  z-index: 10;
}

/* 1. Effet : Étoiles Scintillantes */
.fx-stars {
  position: relative;
}
.fx-stars .theme-effect-layer::before,
.fx-stars .theme-effect-layer::after {
  content: '';
  position: absolute;
  inset: -6px;
  pointer-events: none;
  background-image:
    radial-gradient(ellipse at 12% 22%, #ffffff 0%, #ffd700 30%, rgba(255, 215, 0, 0) 65%),
    radial-gradient(ellipse at 42% 12%, #ffffff 0%, #ffe066 25%, rgba(255, 224, 102, 0) 60%),
    radial-gradient(ellipse at 78% 28%, #ffffff 0%, #ffd700 35%, rgba(255, 215, 0, 0) 70%),
    radial-gradient(ellipse at 22% 78%, #ffffff 0%, #ffc837 30%, rgba(255, 200, 55, 0) 65%),
    radial-gradient(ellipse at 62% 88%, #ffffff 0%, #ffd700 35%, rgba(255, 215, 0, 0) 65%),
    radial-gradient(ellipse at 88% 70%, #ffffff 0%, #ffeaa7 25%, rgba(255, 234, 167, 0) 60%),
    radial-gradient(circle at 50% 4%, #ffd700 0%, rgba(255, 215, 0, 0) 55%),
    radial-gradient(circle at 96% 45%, #ffffff 0%, #ffd700 35%, rgba(255, 215, 0, 0) 65%);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.45));
  animation: fx-super-stars-dance 2.6s infinite ease-in-out alternate;
  z-index: 10;
}
.fx-stars .theme-effect-layer::after {
  animation-delay: -1.3s;
  animation-duration: 3s;
  transform: rotate(180deg) scale(0.96);
  filter: drop-shadow(0 0 4px rgba(112, 214, 255, 0.5));
}
@keyframes fx-super-stars-dance {
  0% { opacity: 0.2; transform: scale(0.96); }
  50% { opacity: 0.75; transform: scale(1.02); filter: drop-shadow(0 0 7px rgba(255, 215, 0, 0.65)); }
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
  background: conic-gradient(
    from var(--neon-angle, 0deg),
    rgba(255, 0, 85, 0.75) 0%,
    rgba(255, 183, 3, 0.75) 20%,
    rgba(0, 242, 254, 0.75) 40%,
    rgba(114, 9, 183, 0.75) 60%,
    rgba(0, 255, 135, 0.75) 80%,
    rgba(255, 0, 85, 0.75) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: fx-super-neon-spin 3.4s linear infinite;
  filter: drop-shadow(0 0 6px rgba(0, 242, 254, 0.45)) drop-shadow(0 0 12px rgba(255, 0, 85, 0.3));
  z-index: 12;
}
.fx-neon-contour .theme-effect-layer::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 1px solid rgba(0, 242, 254, 0.25);
  box-shadow: 0 0 14px rgba(0, 242, 254, 0.25), inset 0 0 10px rgba(255, 0, 85, 0.15);
  animation: fx-neon-pulse-glow 2.2s infinite alternate ease-in-out;
  pointer-events: none;
  z-index: 9;
}
@property --neon-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes fx-super-neon-spin {
  to { --neon-angle: 360deg; }
}
@keyframes fx-neon-pulse-glow {
  0% { opacity: 0.25; transform: scale(0.995); }
  100% { opacity: 0.75; transform: scale(1.01); box-shadow: 0 0 20px rgba(0, 242, 254, 0.45), inset 0 0 14px rgba(255, 0, 85, 0.25); }
}

/* 3. Effet : Shimmer Doré Balayant */
.fx-golden-shimmer {
  position: relative;
}
.fx-golden-shimmer .theme-effect-layer::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 14px rgba(255, 215, 0, 0.22), 0 0 10px rgba(255, 193, 7, 0.15);
  pointer-events: none;
  z-index: 8;
}
.fx-golden-shimmer .theme-effect-layer::after {
  content: '';
  position: absolute;
  top: -75%;
  left: -75%;
  width: 250%;
  height: 250%;
  background: linear-gradient(
    115deg,
    transparent 20%,
    rgba(255, 215, 0, 0.08) 32%,
    rgba(255, 235, 120, 0.35) 45%,
    rgba(255, 255, 255, 0.65) 50%,
    rgba(255, 235, 120, 0.35) 55%,
    rgba(255, 180, 0, 0.18) 66%,
    transparent 80%
  );
  transform: rotate(26deg);
  animation: fx-super-shimmer-sweep 3s infinite ease-in-out;
  pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.4));
  mix-blend-mode: screen;
  z-index: 15;
}
@keyframes fx-super-shimmer-sweep {
  0% { transform: translateX(-160%) rotate(26deg); opacity: 0.05; }
  15% { opacity: 0.75; }
  45% { transform: translateX(160%) rotate(26deg); opacity: 0.75; }
  46%, 100% { transform: translateX(160%) rotate(26deg); opacity: 0; }
}

/* 4. Effet : Braises Flottantes */
.fx-embers {
  position: relative;
}
.fx-embers .theme-effect-layer::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 -18px 25px rgba(255, 69, 0, 0.35), 0 0 16px rgba(255, 87, 34, 0.25);
  animation: fx-embers-glow 2.4s infinite alternate ease-in-out;
  z-index: 8;
}
.fx-embers .theme-effect-layer::after {
  content: '';
  position: absolute;
  inset: -8px;
  background-image:
    radial-gradient(circle at 18% 92%, #ffffff 0%, #ff5722 40%, rgba(255, 87, 34, 0) 75%),
    radial-gradient(circle at 45% 96%, #fff275 0%, #ff3d00 45%, rgba(255, 61, 0, 0) 80%),
    radial-gradient(circle at 74% 90%, #ffffff 0%, #ff9800 40%, rgba(255, 152, 0, 0) 75%),
    radial-gradient(circle at 30% 70%, #ffea00 0%, #d90429 50%, rgba(217, 4, 41, 0) 75%),
    radial-gradient(circle at 62% 65%, #ffffff 0%, #ff5722 45%, rgba(255, 87, 34, 0) 80%),
    radial-gradient(circle at 88% 75%, #fff275 0%, #ff3d00 45%, rgba(255, 61, 0, 0) 75%),
    radial-gradient(circle at 50% 40%, #ffea00 0%, #d90429 45%, rgba(217, 4, 41, 0) 75%);
  background-size: 100% 100%;
  animation: fx-super-embers-rise 2.8s infinite linear;
  filter: drop-shadow(0 0 6px rgba(255, 87, 34, 0.45));
  z-index: 12;
}
@keyframes fx-super-embers-rise {
  0% { transform: translateY(12px) scale(0.97); opacity: 0.15; }
  35% { opacity: 0.75; }
  100% { transform: translateY(-32px) scale(1.02); opacity: 0; filter: drop-shadow(0 0 4px rgba(255, 61, 0, 0.4)) blur(1px); }
}
@keyframes fx-embers-glow {
  0% { opacity: 0.4; }
  100% { opacity: 0.8; box-shadow: inset 0 -24px 30px rgba(255, 69, 0, 0.45), 0 0 20px rgba(255, 87, 34, 0.35); }
}

/* 5. Effet : Aura Cybernétique */
.fx-cyber-glitch {
  position: relative;
}
.fx-cyber-glitch .theme-effect-layer::before {
  content: '';
  position: absolute;
  inset: -1.5px;
  border-radius: inherit;
  box-shadow:
    inset 0 0 16px rgba(0, 242, 254, 0.3),
    0 0 14px rgba(0, 242, 254, 0.35),
    0 0 22px rgba(247, 37, 133, 0.2);
  animation: fx-super-cyber-pulse 2.2s infinite alternate ease-in-out;
  z-index: 10;
}
.fx-cyber-glitch .theme-effect-layer::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 242, 254, 0.15) 50%,
    transparent 100%
  );
  background-size: 100% 8px;
  animation: fx-scanline-sweep 3.2s linear infinite;
  pointer-events: none;
  mix-blend-mode: overlay;
  z-index: 12;
}
@keyframes fx-super-cyber-pulse {
  0% { opacity: 0.3; transform: scale(0.995); }
  100% { opacity: 0.75; transform: scale(1.008); box-shadow: inset 0 0 24px rgba(0, 242, 254, 0.45), 0 0 22px rgba(0, 242, 254, 0.5), 0 0 32px rgba(247, 37, 133, 0.35); }
}
@keyframes fx-scanline-sweep {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* ========================================================
   STYLES SPÉCIFIQUES PAR TIER STEAM
   ======================================================== */

/* Tier Rare (< 10%) */
.tier-rare {
  border-color: rgba(168, 85, 247, 0.7) !important;
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.85),
    0 0 20px rgba(168, 85, 247, 0.35),
    inset 0 0 14px rgba(192, 132, 252, 0.2) !important;
}
.tier-rare .card-glow {
  background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%) !important;
}
.tier-rare .unlock-tag {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%) !important;
  color: #e9d5ff !important;
  border-color: rgba(168, 85, 247, 0.55) !important;
  font-weight: 700 !important;
  text-shadow: 0 0 6px rgba(168, 85, 247, 0.5) !important;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.3) !important;
}
.tier-rare .icon-container {
  border-color: #a855f7 !important;
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.45), inset 0 0 8px rgba(192, 132, 252, 0.3) !important;
}
.tier-rare .progress-countdown {
  background: linear-gradient(90deg, #a855f7, #c084fc) !important;
}

/* Tier Master / Platine (100% Jeu Complété) */
.tier-master {
  border-color: rgba(56, 189, 248, 0.75) !important;
  box-shadow:
    0 20px 45px rgba(0, 0, 0, 0.9),
    0 0 24px rgba(56, 189, 248, 0.45),
    0 0 14px rgba(255, 215, 0, 0.3),
    inset 0 0 18px rgba(56, 189, 248, 0.25) !important;
}
.tier-master .card-glow {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(255, 215, 0, 0.18) 50%, transparent 75%) !important;
}
.tier-master .unlock-tag {
  background: linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #f59e0b 100%) !important;
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 800 !important;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.7), 0 1px 3px rgba(0, 0, 0, 0.4) !important;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.5), 0 0 8px rgba(255, 215, 0, 0.4) !important;
}
.tier-master .icon-container {
  border-color: #38bdf8 !important;
  box-shadow:
    0 0 18px rgba(56, 189, 248, 0.5),
    0 0 10px rgba(255, 215, 0, 0.4),
    inset 0 0 12px rgba(56, 189, 248, 0.35) !important;
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
