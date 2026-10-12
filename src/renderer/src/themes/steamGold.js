// Thème Officiel Steam Gold Classique
export const STEAM_GOLD_THEME = {
  id: 'theme-steam-gold',
  name: 'Steam Gold Classique',
  html: `<div class="custom-achievement-card">
  <div class="card-glow"></div>
  <div class="card-body">
    <div class="icon-container">
      <img src="{icon}" alt="{title}" class="ach-icon" />
      <div class="icon-sheen"></div>
    </div>
    <div class="text-content">
      <div class="meta-line">
        <span class="game-tag">{game}</span>
        <span class="unlock-tag">SUCCÈS DÉBLOQUÉ</span>
      </div>
      <h3 class="ach-title">{title}</h3>
      <p class="ach-desc">{description}</p>
    </div>
  </div>
  <div class="progress-countdown"></div>
</div>`,

  css: `/* Conteneur principal de la notification */
.custom-achievement-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 440px;
  max-width: calc(100vw - 60px);
  background: rgba(14, 20, 29, 0.96);
  border-radius: 14px;
  border: 1px solid rgba(240, 195, 48, 0.6);
  box-shadow: 
    0 20px 48px rgba(0, 0, 0, 0.85),
    0 0 32px rgba(240, 195, 48, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #fff;
  user-select: none;
  z-index: 999999;
}

/* Lueur d'ambiance */
.card-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, rgba(240, 195, 48, 0.3) 0%, transparent 70%);
  pointer-events: none;
}

/* Corps de la carte */
.card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

/* Cadre de l'icône */
.icon-container {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #f0c330;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.45);
  background: #090d13;
}

.ach-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.icon-sheen {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.35) 50%, transparent 60%);
  animation: ach-sheen 4s infinite;
  pointer-events: none;
}

@keyframes ach-sheen {
  0% { transform: translate(-80%, -80%); }
  35%, 100% { transform: translate(80%, 80%); }
}

/* Textes */
.text-content {
  flex: 1;
  min-width: 0;
}

.meta-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.game-tag {
  font-size: 11px;
  font-weight: 700;
  color: #66c0f4;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.unlock-tag {
  font-size: 11px;
  font-weight: 800;
  color: #f0c330;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(240, 195, 48, 0.5);
  white-space: nowrap;
}

.ach-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 3px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ach-desc {
  font-size: 12.5px;
  color: #a4b4cc;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Barre de progression (compte à rebours 5 secondes) */
.progress-countdown {
  height: 3px;
  background: linear-gradient(90deg, #f0c330, #ffe680);
  width: 100%;
  animation: ach-countdown 5s linear forwards;
}

@keyframes ach-countdown {
  from { width: 100%; }
  to { width: 0%; }
}

/* Animations d'entrée / sortie de la notification */
.animate-enter {
  animation: ach-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-leave {
  animation: ach-slide-down 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes ach-slide-up {
  from { opacity: 0; transform: translateY(40px) scale(0.94); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes ach-slide-down {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(30px) scale(0.96); }
}`,

  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}

export const DEFAULT_THEME = STEAM_GOLD_THEME
