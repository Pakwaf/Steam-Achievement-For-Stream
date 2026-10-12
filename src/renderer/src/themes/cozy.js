// Thème Pixel Art Cozy avec lucioles et battements de cœur
export const COZY_PIXEL_THEME = {
  id: 'theme-cozy-pixel',
  name: 'Pixel Art Cozy',
  html: `<div class="cozy-pixel-card">
  <div class="cozy-twilight-glow"></div>
  <div class="cozy-header">
    <div class="cozy-header-left">
      <span class="cozy-heart">♥</span>
      <span class="cozy-game-tag">{game}</span>
    </div>
    <span class="cozy-unlock-tag">★ SUCCÈS DÉBLOQUÉ</span>
  </div>
  <div class="cozy-body">
    <div class="cozy-icon-box">
      <img src="{icon}" alt="{title}" class="cozy-icon" />
      <div class="cozy-firefly f1">✦</div>
      <div class="cozy-firefly f2">✦</div>
    </div>
    <div class="cozy-content">
      <h3 class="cozy-title">{title}</h3>
      <p class="cozy-desc">{description}</p>
    </div>
  </div>
  <div class="cozy-progress-track">
    <div class="cozy-progress-bar"></div>
  </div>
</div>`,
  css: `.cozy-pixel-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 440px;
  max-width: calc(100vw - 60px);
  background: linear-gradient(145deg, rgba(30, 22, 48, 0.97) 0%, rgba(18, 13, 30, 0.98) 100%);
  border-radius: 14px;
  border: 1.5px solid rgba(255, 209, 102, 0.65);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 112, 166, 0.2), 0 0 12px rgba(255, 209, 102, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
  font-family: 'Outfit', -apple-system, sans-serif;
  color: #f7f3ff;
  user-select: none;
  z-index: 999999;
}
.cozy-twilight-glow {
  position: absolute;
  top: -30px;
  left: -20px;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255, 112, 166, 0.25) 0%, transparent 70%);
  pointer-events: none;
}
.cozy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: linear-gradient(90deg, rgba(45, 33, 72, 0.95) 0%, rgba(28, 20, 48, 0.95) 100%);
  border-bottom: 1px solid rgba(255, 209, 102, 0.25);
}
.cozy-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cozy-heart {
  font-size: 15px;
  color: #ff70a6;
  text-shadow: 0 0 8px rgba(255, 112, 166, 0.8);
  animation: cozy-heartbeat 1.8s ease-in-out infinite;
}
@keyframes cozy-heartbeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.22); }
  30% { transform: scale(1.05); }
  45% { transform: scale(1.26); }
  60% { transform: scale(1); }
}
.cozy-game-tag {
  font-size: 11.5px;
  font-weight: 700;
  color: #ffd166;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}
.cozy-unlock-tag {
  font-size: 11px;
  font-weight: 800;
  color: #ff9ebb;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.cozy-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.cozy-icon-box {
  position: relative;
  width: 62px;
  height: 62px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #150f22;
  border: 1.5px solid #ffd166;
  box-shadow: 0 0 14px rgba(255, 209, 102, 0.3);
}
.cozy-icon {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
  display: block;
}
.cozy-firefly {
  position: absolute;
  color: #ffd166;
  font-size: 12px;
  pointer-events: none;
  animation: cozy-float 2.2s ease-in-out infinite alternate;
}
.cozy-firefly.f1 { top: -6px; right: -6px; animation-delay: 0.2s; }
.cozy-firefly.f2 { bottom: -6px; left: -6px; animation-delay: 1.1s; }
@keyframes cozy-float {
  from { transform: translateY(0) scale(0.9); opacity: 0.5; }
  to { transform: translateY(-4px) scale(1.2); opacity: 1; text-shadow: 0 0 6px #ffd166; }
}
.cozy-content { flex: 1; min-width: 0; }
.cozy-title {
  font-size: 16.5px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
.cozy-desc {
  font-size: 12.5px;
  color: #cfc5e2;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cozy-progress-track {
  height: 3.5px;
  background: rgba(255, 255, 255, 0.08);
  width: 100%;
}
.cozy-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff70a6, #ffd166, #70d6ff);
  box-shadow: 0 0 8px rgba(255, 112, 166, 0.6);
  width: 100%;
  animation: cozy-countdown 5s linear forwards;
}
@keyframes cozy-countdown {
  from { width: 100%; }
  to { width: 0%; }
}
.animate-enter {
  animation: cozy-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-leave {
  animation: cozy-slide-down 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}
@keyframes cozy-slide-up {
  0% { opacity: 0; transform: translateY(35px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes cozy-slide-down {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(25px) scale(0.97); }
}`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}
