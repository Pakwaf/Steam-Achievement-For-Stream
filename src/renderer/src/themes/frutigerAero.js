// Thème Frutiger Aero - Esthétique 2000s glossy, verre aquatique, bulles et reflets lumineux
export const FRUTIGER_AERO_THEME = {
  id: 'theme-frutiger-aero',
  name: 'Frutiger Aero (Glossy 2000s)',
  html: `<div class="aero-achievement-card">
  <div class="aero-water-shimmer"></div>
  <div class="aero-top-glass-shine"></div>
  <div class="aero-bubble b1"></div>
  <div class="aero-bubble b2"></div>
  <div class="aero-bubble b3"></div>
  
  <div class="aero-header">
    <div class="aero-header-left">
      <div class="aero-orb-status">
        <div class="aero-orb-glow"></div>
      </div>
      <span class="aero-game-tag">{game}</span>
    </div>
    <div class="aero-badge">
      <span class="aero-sparkle-symbol">✧</span>
      <span class="aero-tag-text">SUCCÈS DÉBLOQUÉ</span>
    </div>
  </div>

  <div class="aero-body">
    <div class="aero-icon-container">
      <img src="{icon}" alt="{title}" class="aero-icon" />
      <div class="aero-icon-gloss"></div>
      <div class="aero-icon-ring"></div>
    </div>
    <div class="aero-content">
      <h3 class="aero-title">{title}</h3>
      <p class="aero-desc">{description}</p>
    </div>
  </div>

  <div class="aero-progress-track">
    <div class="aero-progress-bar">
      <div class="aero-progress-glint"></div>
    </div>
  </div>
</div>`,

  css: `.aero-achievement-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 450px;
  max-width: calc(100vw - 60px);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.88) 0%, rgba(6, 182, 212, 0.82) 40%, rgba(16, 185, 129, 0.85) 100%);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border-radius: 20px;
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  box-shadow: 
    0 24px 50px rgba(0, 75, 120, 0.45),
    0 0 35px rgba(56, 189, 248, 0.4),
    inset 0 1.5px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1.5px 1px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #ffffff;
  user-select: none;
  z-index: 999999;
}

/* Reflet de dôme en verre courbé caractéristique du Frutiger Aero */
.aero-top-glass-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.15) 80%, rgba(255, 255, 255, 0) 100%);
  border-radius: 20px 20px 100px 100px / 20px 20px 25px 25px;
  pointer-events: none;
  z-index: 2;
}

/* Miroitement aquatique en fond */
.aero-water-shimmer {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}

/* Bulles flottantes translucides */
.aero-bubble {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.1) 70%, rgba(56, 189, 248, 0.4) 100%);
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.8), 0 0 6px rgba(255, 255, 255, 0.4);
  pointer-events: none;
  z-index: 3;
}
.aero-bubble.b1 {
  width: 14px;
  height: 14px;
  top: 18px;
  right: 80px;
  animation: aero-float-b1 4s ease-in-out infinite alternate;
}
.aero-bubble.b2 {
  width: 9px;
  height: 9px;
  bottom: 22px;
  left: 65px;
  animation: aero-float-b2 3.5s ease-in-out infinite alternate;
}
.aero-bubble.b3 {
  width: 18px;
  height: 18px;
  top: 45px;
  right: 25px;
  animation: aero-float-b1 5s ease-in-out infinite alternate-reverse;
}

@keyframes aero-float-b1 {
  from { transform: translateY(0) scale(0.9); opacity: 0.7; }
  to { transform: translateY(-8px) scale(1.1); opacity: 1; }
}
@keyframes aero-float-b2 {
  from { transform: translateY(0) scale(1); opacity: 0.6; }
  to { transform: translateY(-6px) scale(1.15); opacity: 0.95; }
}

/* En-tête */
.aero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 18px 9px 18px;
  position: relative;
  z-index: 4;
}

.aero-header-left {
  display: flex;
  align-items: center;
  gap: 9px;
}

.aero-orb-status {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffffff 0%, #38bdf8 45%, #0284c7 100%);
  box-shadow: 0 0 8px #38bdf8, 0 1px 3px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.aero-orb-glow {
  position: absolute;
  top: 1px;
  left: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffffff;
}

.aero-game-tag {
  font-size: 11.5px;
  font-weight: 800;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 4px rgba(0, 40, 80, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.aero-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  padding: 3px 10px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 50, 100, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.aero-sparkle-symbol {
  font-size: 11px;
  color: #fef08a;
  text-shadow: 0 0 6px #fef08a;
}

.aero-tag-text {
  font-size: 10.5px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 2px rgba(0, 30, 60, 0.4);
}

/* Corps de notification */
.aero-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px 16px 20px;
  position: relative;
  z-index: 4;
}

.aero-icon-container {
  position: relative;
  width: 66px;
  height: 66px;
  flex-shrink: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1));
  padding: 3px;
  box-shadow: 
    0 8px 18px rgba(0, 50, 90, 0.35),
    0 0 14px rgba(255, 255, 255, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.9);
  border: 1.5px solid rgba(255, 255, 255, 0.8);
}

.aero-icon {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
  display: block;
}

.aero-icon-gloss {
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  height: 48%;
  border-radius: 12px 12px 40px 40px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.1) 100%);
  pointer-events: none;
}

.aero-content {
  flex: 1;
  min-width: 0;
}

.aero-title {
  font-size: 17px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 4px rgba(0, 30, 70, 0.6), 0 0 12px rgba(255, 255, 255, 0.3);
}

.aero-desc {
  font-size: 12.5px;
  font-weight: 500;
  color: #e0f2fe;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 30, 60, 0.4);
}

/* Barre de progression avec éclat glossy */
.aero-progress-track {
  height: 5px;
  background: rgba(0, 30, 60, 0.25);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  width: 100%;
  position: relative;
  z-index: 4;
}

.aero-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8 0%, #ffffff 50%, #4ade80 100%);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.8), 0 0 6px #38bdf8;
  width: 100%;
  position: relative;
  animation: aero-countdown 5s linear forwards;
}

@keyframes aero-countdown {
  from { width: 100%; }
  to { width: 0%; }
}

/* Animations d'entrée / sortie de la notification */
.animate-enter {
  animation: aero-bubble-enter 0.52s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards;
}

.animate-leave {
  animation: aero-bubble-leave 0.36s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes aero-bubble-enter {
  0% { opacity: 0; transform: translateY(50px) scale(0.88); filter: blur(4px); }
  70% { opacity: 1; transform: translateY(-6px) scale(1.02); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes aero-bubble-leave {
  from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  to { opacity: 0; transform: translateY(35px) scale(0.92); filter: blur(3px); }
}`,

  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}
