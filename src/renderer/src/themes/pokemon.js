// Thème Pokémon Pokéball avec animations d'EXP et de capture
export const POKEMON_THEME = {
  id: 'theme-pokemon',
  name: 'Pokémon Pokéball',
  html: `<div class="poke-achievement-card">
  <div class="poke-watermark"></div>
  <div class="poke-top-banner">
    <div class="poke-header-left">
      <div class="pokeball-mini">
        <div class="pokeball-top"></div>
        <div class="pokeball-bottom"></div>
        <div class="pokeball-band"></div>
        <div class="pokeball-btn"></div>
      </div>
      <span class="poke-game-tag">{game}</span>
    </div>
    <span class="poke-catch-tag">★ SUCCÈS ATTRAPÉ !</span>
  </div>
  <div class="poke-body">
    <div class="poke-icon-container">
      <img src="{icon}" alt="{title}" class="poke-icon" />
      <div class="poke-icon-sheen"></div>
      <div class="poke-sparkle s1">✦</div>
      <div class="poke-sparkle s2">✦</div>
    </div>
    <div class="poke-content">
      <div class="poke-title-row">
        <h3 class="poke-title">{title}</h3>
        <span class="poke-exp-badge">+100 EXP</span>
      </div>
      <p class="poke-desc">{description}</p>
    </div>
  </div>
  <div class="poke-exp-track">
    <div class="poke-exp-bar"></div>
  </div>
</div>`,
  css: `.poke-achievement-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 450px;
  max-width: calc(100vw - 60px);
  background: linear-gradient(145deg, rgba(22, 27, 46, 0.97) 0%, rgba(12, 14, 26, 0.98) 100%);
  border-radius: 16px;
  border: 2px solid rgba(255, 203, 5, 0.8);
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(238, 21, 21, 0.3), 0 0 15px rgba(255, 203, 5, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  overflow: hidden;
  font-family: 'Outfit', -apple-system, sans-serif;
  color: #ffffff;
  user-select: none;
  z-index: 999999;
}
.poke-watermark {
  position: absolute;
  right: -30px;
  bottom: -40px;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  border: 14px solid rgba(255, 255, 255, 0.035);
  pointer-events: none;
}
.poke-watermark::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.035);
  transform: translateY(-50%);
}
.poke-top-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: linear-gradient(90deg, rgba(238, 21, 21, 0.9) 0%, rgba(186, 12, 12, 0.95) 100%);
  border-bottom: 2px solid #111424;
}
.poke-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pokeball-mini {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  overflow: hidden;
  background: #ffffff;
  animation: pokeball-wiggle 3.5s ease-in-out infinite;
}
.pokeball-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: #ff2a42;
}
.pokeball-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: #f0f0f0;
}
.pokeball-band {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 3px;
  background: #222;
  transform: translateY(-50%);
}
.pokeball-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  background: #ffffff;
  border: 2px solid #222;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: 0 0 3px rgba(255, 255, 255, 0.8);
}
@keyframes pokeball-wiggle {
  0%, 80%, 100% { transform: rotate(0deg); }
  85% { transform: rotate(-18deg); }
  90% { transform: rotate(18deg); }
  95% { transform: rotate(-8deg); }
}
.poke-game-tag {
  font-size: 11.5px;
  font-weight: 800;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.poke-catch-tag {
  font-size: 11px;
  font-weight: 900;
  color: #ffcb05;
  letter-spacing: 0.08em;
  text-shadow: 0 0 12px rgba(255, 203, 5, 0.8);
  white-space: nowrap;
}
.poke-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.poke-icon-container {
  position: relative;
  width: 66px;
  height: 66px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #090b14;
  border: 2px solid #ffcb05;
  box-shadow: 0 0 18px rgba(255, 203, 5, 0.45);
  overflow: visible;
}
.poke-icon {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
  display: block;
}
.poke-icon-sheen {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.4) 50%, transparent 60%);
  animation: poke-sheen 3.5s infinite;
  pointer-events: none;
}
@keyframes poke-sheen {
  0% { transform: translate(-80%, -80%); }
  30%, 100% { transform: translate(80%, 80%); }
}
.poke-sparkle {
  position: absolute;
  color: #ffea79;
  font-size: 14px;
  pointer-events: none;
  text-shadow: 0 0 8px #ffcb05;
  animation: poke-twinkle 1.8s infinite ease-in-out;
}
.poke-sparkle.s1 { top: -8px; right: -8px; animation-delay: 0.2s; }
.poke-sparkle.s2 { bottom: -8px; left: -8px; animation-delay: 0.9s; }
@keyframes poke-twinkle {
  0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.4; }
  50% { transform: scale(1.2) rotate(45deg); opacity: 1; }
}
.poke-content { flex: 1; min-width: 0; }
.poke-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.poke-title {
  font-size: 16.5px;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}
.poke-exp-badge {
  font-size: 10px;
  font-weight: 800;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.5);
  padding: 2px 7px;
  border-radius: 20px;
  white-space: nowrap;
}
.poke-desc {
  font-size: 12.5px;
  color: #c0cadb;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.poke-exp-track {
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  width: 100%;
}
.poke-exp-bar {
  height: 100%;
  background: linear-gradient(90deg, #3866df, #00d2ff, #22c55e);
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.6);
  width: 100%;
  animation: poke-countdown 5s linear forwards;
}
@keyframes poke-countdown {
  from { width: 100%; }
  to { width: 0%; }
}
.animate-enter {
  animation: poke-ball-bounce 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
.animate-leave {
  animation: poke-slide-away 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}
@keyframes poke-ball-bounce {
  0% { opacity: 0; transform: translateY(60px) scale(0.85); }
  65% { opacity: 1; transform: translateY(-8px) scale(1.03); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes poke-slide-away {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(40px) scale(0.92); }
}`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}
