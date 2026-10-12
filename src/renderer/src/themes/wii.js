// Thème Nintendo Wii avec fente bleue lumineuse, reflet gloss et style chaîne Wii
export const WII_THEME = {
  id: 'theme-wii',
  name: 'Nintendo Wii',
  html: `<div class="wii-achievement-card">
  <div class="wii-gloss-overlay"></div>
  <div class="wii-header">
    <div class="wii-header-left">
      <div class="wii-disc-slot" title="Wii Disc Slot"></div>
      <span class="wii-brand">Wii</span>
      <span class="wii-game-tag">{game}</span>
    </div>
    <div class="wii-mail-badge">
      <span class="wii-envelope-icon">✉</span>
      <span class="wii-msg-tag">SUCCÈS DÉBLOQUÉ</span>
    </div>
  </div>
  <div class="wii-body">
    <div class="wii-channel-box">
      <img src="{icon}" alt="{title}" class="wii-icon" />
      <div class="wii-channel-reflection"></div>
    </div>
    <div class="wii-content">
      <h3 class="wii-title">{title}</h3>
      <p class="wii-desc">{description}</p>
    </div>
  </div>
  <div class="wii-progress-track">
    <div class="wii-progress-bar"></div>
  </div>
</div>`,
  css: `.wii-achievement-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 440px;
  max-width: calc(100vw - 60px);
  background: linear-gradient(180deg, #ffffff 0%, #f3f6fa 100%);
  border-radius: 18px;
  border: 2px solid #dce4ef;
  box-shadow: 0 20px 48px rgba(0, 70, 140, 0.22), 0 0 25px rgba(0, 180, 255, 0.25), inset 0 1px 0 #ffffff;
  overflow: hidden;
  font-family: 'Outfit', -apple-system, sans-serif;
  color: #2b3545;
  user-select: none;
  z-index: 999999;
}
.wii-gloss-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 45%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  z-index: 2;
}
.wii-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: linear-gradient(180deg, #f9fbfe 0%, #e8edf5 100%);
  border-bottom: 1.5px solid #d6e0ed;
  position: relative;
  z-index: 3;
}
.wii-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.wii-disc-slot {
  width: 16px;
  height: 4px;
  background: #00b4ff;
  border-radius: 4px;
  box-shadow: 0 0 8px #00b4ff, 0 0 14px rgba(0, 180, 255, 0.8);
  animation: wii-slot-pulse 2.2s ease-in-out infinite alternate;
}
@keyframes wii-slot-pulse {
  0% { opacity: 0.5; box-shadow: 0 0 6px #00b4ff; }
  100% { opacity: 1; box-shadow: 0 0 12px #00b4ff, 0 0 18px rgba(0, 180, 255, 0.9); }
}
.wii-brand {
  font-size: 14px;
  font-weight: 800;
  color: #7b8798;
  letter-spacing: -0.02em;
}
.wii-game-tag {
  font-size: 11px;
  font-weight: 700;
  color: #008dd4;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.wii-mail-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #d0d9e7;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.wii-envelope-icon {
  font-size: 11px;
  color: #008dd4;
}
.wii-msg-tag {
  font-size: 10px;
  font-weight: 800;
  color: #4a5568;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.wii-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  position: relative;
  z-index: 3;
}
.wii-channel-box {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 14px;
  background: #ffffff;
  border: 2px solid #b8c8dc;
  box-shadow: 0 4px 12px rgba(0, 70, 140, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
}
.wii-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.wii-channel-reflection {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}
.wii-content { flex: 1; min-width: 0; }
.wii-title {
  font-size: 16.5px;
  font-weight: 800;
  color: #1a2332;
  margin: 0 0 3px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wii-desc {
  font-size: 12.5px;
  color: #616e82;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.wii-progress-track {
  height: 4px;
  background: #e2e8f0;
  width: 100%;
  position: relative;
  z-index: 3;
}
.wii-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0090e0, #00b4ff, #80dfff);
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.8);
  width: 100%;
  animation: wii-countdown 5s linear forwards;
}
@keyframes wii-countdown {
  from { width: 100%; }
  to { width: 0%; }
}
.animate-enter {
  animation: wii-channel-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
.animate-leave {
  animation: wii-channel-close 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}
@keyframes wii-channel-pop {
  0% { opacity: 0; transform: translateY(45px) scale(0.9); }
  65% { opacity: 1; transform: translateY(-6px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes wii-channel-close {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(30px) scale(0.95); }
}`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}
