// Thème Cyberpunk Néon avec néons cyan & magenta et accents angulaires
export const CYBERPUNK_THEME = {
  id: 'theme-cyberpunk-neon',
  name: 'Cyberpunk Néon',
  html: `<div class="cyber-achievement-card">
  <div class="cyber-glow-bar"></div>
  <div class="cyber-body">
    <div class="cyber-icon-box">
      <img src="{icon}" alt="{title}" class="cyber-icon" />
      <div class="cyber-corner tr"></div>
      <div class="cyber-corner bl"></div>
    </div>
    <div class="cyber-details">
      <div class="cyber-top-line">
        <span class="cyber-game">{game}</span>
        <span class="cyber-tag">ACHIEVEMENT UNLOCKED</span>
      </div>
      <h3 class="cyber-title">{title}</h3>
      <p class="cyber-desc">{description}</p>
    </div>
  </div>
  <div class="cyber-progress"></div>
</div>`,
  css: `/* Conteneur Cyberpunk */
.cyber-achievement-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 440px;
  max-width: calc(100vw - 60px);
  background: rgba(10, 11, 26, 0.95);
  border-radius: 12px;
  border: 1px solid #00f3ff;
  box-shadow: 
    0 18px 45px rgba(0, 0, 0, 0.9),
    0 0 24px rgba(0, 243, 255, 0.35),
    inset 0 0 16px rgba(255, 0, 85, 0.15);
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  color: #fff;
  user-select: none;
  z-index: 999999;
}
.cyber-glow-bar {
  height: 3px;
  background: linear-gradient(90deg, #ff0055, #00f3ff, #ff0055);
}
.cyber-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.cyber-icon-box {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  background: #03040a;
  border: 1px solid #ff0055;
  box-shadow: 0 0 12px rgba(255, 0, 85, 0.4);
}
.cyber-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cyber-corner {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #00f3ff;
}
.cyber-corner.tr { top: -2px; right: -2px; }
.cyber-corner.bl { bottom: -2px; left: -2px; }
.cyber-details { flex: 1; min-width: 0; }
.cyber-top-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.cyber-game {
  font-size: 11px;
  color: #00f3ff;
  font-weight: 700;
  text-transform: uppercase;
}
.cyber-tag {
  font-size: 10px;
  color: #ff0055;
  font-weight: 800;
}
.cyber-title {
  margin: 0 0 3px 0;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}
.cyber-desc {
  margin: 0;
  font-size: 12px;
  color: #a4b4cc;
}
.cyber-progress {
  height: 3px;
  background: linear-gradient(90deg, #00f3ff, #ff0055);
  animation: cyber-prog 5s linear forwards;
}
@keyframes cyber-prog {
  from { width: 100%; }
  to { width: 0%; }
}`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}
