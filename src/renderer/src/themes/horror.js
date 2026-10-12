// Thème Horreur / VHS avec scanlines, voyant REC et ambiance glitch
export const HORROR_THEME = {
  id: 'theme-horror',
  name: 'Horreur / VHS',
  html: `<div class="horror-card">
  <div class="horror-scanlines"></div>
  <div class="horror-ambient-glow"></div>
  <div class="horror-header">
    <div class="horror-cam-data">
      <span class="horror-rec-dot"></span>
      <span class="horror-rec-label">REC</span>
      <span class="horror-game-tag">{game}</span>
    </div>
    <span class="horror-alert-tag">⚠️ SUCCÈS DÉBLOQUÉ</span>
  </div>
  <div class="horror-body">
    <div class="horror-icon-box">
      <img src="{icon}" alt="{title}" class="horror-icon" />
      <div class="horror-static-layer"></div>
      <div class="horror-frame-corners"></div>
    </div>
    <div class="horror-content">
      <div class="horror-title-row">
        <h3 class="horror-title">{title}</h3>
      </div>
      <p class="horror-desc">{description}</p>
    </div>
  </div>
  <div class="horror-life-track">
    <div class="horror-life-bar"></div>
  </div>
</div>`,
  css: `.horror-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 440px;
  max-width: calc(100vw - 60px);
  background: linear-gradient(135deg, rgba(14, 5, 5, 0.98) 0%, rgba(6, 6, 8, 0.99) 100%);
  border-radius: 10px;
  border: 1px solid rgba(220, 38, 38, 0.7);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(220, 20, 20, 0.45), inset 0 0 30px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 60, 60, 0.2);
  overflow: hidden;
  font-family: 'Outfit', 'Courier New', monospace, sans-serif;
  color: #e5e5e5;
  user-select: none;
  z-index: 999999;
}
.horror-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px);
  pointer-events: none;
  z-index: 3;
}
.horror-ambient-glow {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%);
  pointer-events: none;
}
.horror-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(26, 8, 8, 0.95);
  border-bottom: 1px solid rgba(220, 38, 38, 0.4);
  position: relative;
  z-index: 4;
}
.horror-cam-data {
  display: flex;
  align-items: center;
  gap: 8px;
}
.horror-rec-dot {
  width: 10px;
  height: 10px;
  background: #ff1e1e;
  border-radius: 50%;
  box-shadow: 0 0 8px #ff1e1e;
  animation: rec-blink 1s ease-in-out infinite alternate;
}
@keyframes rec-blink {
  0% { opacity: 0.2; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1.15); box-shadow: 0 0 12px #ff1e1e; }
}
.horror-rec-label {
  font-size: 11px;
  font-weight: 900;
  color: #ff3333;
  letter-spacing: 0.12em;
}
.horror-game-tag {
  font-size: 11px;
  font-weight: 700;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.horror-alert-tag {
  font-size: 10.5px;
  font-weight: 800;
  color: #ff4d4d;
  letter-spacing: 0.08em;
  text-shadow: 0 0 8px rgba(255, 30, 30, 0.7);
  white-space: nowrap;
}
.horror-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  position: relative;
  z-index: 4;
}
.horror-icon-box {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  background: #000000;
  border: 1px solid #7f1d1d;
  box-shadow: 0 0 16px rgba(220, 38, 38, 0.4);
  overflow: hidden;
}
.horror-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: contrast(115%) saturate(85%);
}
.horror-static-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
}
.horror-frame-corners::before,
.horror-frame-corners::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 2px solid #ef4444;
  pointer-events: none;
}
.horror-frame-corners::before { top: 2px; left: 2px; border-right: none; border-bottom: none; }
.horror-frame-corners::after { bottom: 2px; right: 2px; border-left: none; border-top: none; }
.horror-content { flex: 1; min-width: 0; }
.horror-title-row { margin-bottom: 4px; }
.horror-title {
  font-size: 16.5px;
  font-weight: 800;
  color: #fff1f2;
  margin: 0;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
}
.horror-desc {
  font-size: 12.5px;
  color: #a8a29e;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.horror-life-track {
  height: 4px;
  background: #1c0a0a;
  width: 100%;
  position: relative;
  z-index: 4;
}
.horror-life-bar {
  height: 100%;
  background: linear-gradient(90deg, #991b1b, #ef4444, #ffffff);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.9);
  width: 100%;
  animation: horror-fadeout 5s linear forwards;
}
@keyframes horror-fadeout {
  from { width: 100%; }
  to { width: 0%; }
}
.animate-enter {
  animation: horror-jumpscare 0.45s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
}
.animate-leave {
  animation: horror-glitch-out 0.35s ease-in forwards;
}
@keyframes horror-jumpscare {
  0% { opacity: 0; transform: translateY(50px) scale(0.92) skewX(2deg); filter: brightness(2.5) contrast(150%); }
  30% { opacity: 1; transform: translateY(-4px) scale(1.02) skewX(-2deg); filter: brightness(1.2); }
  60% { transform: translateY(2px) scale(0.99) skewX(1deg); filter: brightness(1); }
  100% { opacity: 1; transform: translateY(0) scale(1) skewX(0); }
}
@keyframes horror-glitch-out {
  0% { opacity: 1; transform: translateY(0); }
  50% { opacity: 0.8; transform: translateY(10px) scale(0.97) skewX(3deg); filter: brightness(2); }
  100% { opacity: 0; transform: translateY(30px) scale(0.94); filter: brightness(0); }
}`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}
