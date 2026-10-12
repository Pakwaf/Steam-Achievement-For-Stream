// Thème Dark Fantasy / Soulslike avec dorures antiques et braises ardentes
export const DARK_FANTASY_THEME = {
  id: 'theme-dark-fantasy',
  name: 'Dark Fantasy',
  html: `<div class="souls-card">
  <div class="souls-ember-glow"></div>
  <div class="souls-header">
    <div class="souls-header-left">
      <span class="souls-rune-symbol">⚔</span>
      <span class="souls-game-tag">{game}</span>
    </div>
    <span class="souls-status-tag">⚜ EXPLOIT LÉGENDAIRE ⚜</span>
  </div>
  <div class="souls-body">
    <div class="souls-relic-box">
      <div class="souls-relic-flame"></div>
      <div class="souls-icon-frame">
        <img src="{icon}" alt="{title}" class="souls-icon" />
        <div class="souls-icon-sheen"></div>
      </div>
      <div class="souls-corner tl"></div>
      <div class="souls-corner tr"></div>
      <div class="souls-corner bl"></div>
      <div class="souls-corner br"></div>
    </div>
    <div class="souls-content">
      <h3 class="souls-title">{title}</h3>
      <div class="souls-divider">
        <span class="souls-gem">◆</span>
      </div>
      <p class="souls-desc">{description}</p>
    </div>
  </div>
  <div class="souls-ember-track">
    <div class="souls-ember-bar"></div>
  </div>
</div>`,
  css: `.souls-card {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 450px;
  max-width: calc(100vw - 60px);
  background: linear-gradient(135deg, rgba(16, 15, 20, 0.98) 0%, rgba(8, 8, 11, 0.99) 100%);
  border-radius: 10px;
  border: 1.5px solid rgba(212, 175, 55, 0.6);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(255, 130, 20, 0.25), 0 0 15px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 220, 140, 0.2);
  overflow: hidden;
  font-family: 'Cinzel', 'Outfit', 'Georgia', serif;
  color: #e4d8c5;
  user-select: none;
  z-index: 999999;
}
.souls-ember-glow {
  position: absolute;
  top: -25px;
  right: -25px;
  width: 130px;
  height: 130px;
  background: radial-gradient(circle, rgba(245, 120, 20, 0.25) 0%, transparent 70%);
  pointer-events: none;
}
.souls-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: linear-gradient(90deg, rgba(32, 28, 36, 0.95) 0%, rgba(18, 16, 22, 0.95) 100%);
  border-bottom: 1px solid rgba(212, 175, 55, 0.35);
}
.souls-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.souls-rune-symbol {
  font-size: 13px;
  color: #d4af37;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.8);
}
.souls-game-tag {
  font-size: 11px;
  font-weight: 700;
  color: #c5a059;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}
.souls-status-tag {
  font-size: 10.5px;
  font-weight: 800;
  color: #f3d078;
  letter-spacing: 0.12em;
  text-shadow: 0 0 10px rgba(243, 208, 120, 0.6);
  white-space: nowrap;
}
.souls-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.souls-relic-box {
  position: relative;
  width: 66px;
  height: 66px;
  flex-shrink: 0;
  background: #09090c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.souls-relic-flame {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 140, 30, 0.3) 0%, transparent 70%);
  animation: ember-pulse 3s infinite alternate ease-in-out;
  pointer-events: none;
}
@keyframes ember-pulse {
  from { transform: scale(0.9); opacity: 0.5; }
  to { transform: scale(1.3); opacity: 1; }
}
.souls-icon-frame {
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: 4px;
  border: 1px solid #c5a059;
  box-shadow: 0 0 14px rgba(212, 175, 55, 0.4);
  overflow: hidden;
  z-index: 1;
}
.souls-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.souls-icon-sheen {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(135deg, transparent 40%, rgba(255, 230, 150, 0.35) 50%, transparent 60%);
  animation: souls-sheen 4s infinite;
  pointer-events: none;
}
@keyframes souls-sheen {
  0% { transform: translate(-80%, -80%); }
  35%, 100% { transform: translate(80%, 80%); }
}
.souls-corner {
  position: absolute;
  width: 7px;
  height: 7px;
  border: 2px solid #d4af37;
  pointer-events: none;
  z-index: 2;
}
.souls-corner.tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.souls-corner.tr { top: 0; right: 0; border-left: none; border-bottom: none; }
.souls-corner.bl { bottom: 0; left: 0; border-right: none; border-top: none; }
.souls-corner.br { bottom: 0; right: 0; border-left: none; border-top: none; }
.souls-content { flex: 1; min-width: 0; }
.souls-title {
  font-size: 16.5px;
  font-weight: 700;
  color: #fff6e5;
  margin: 0 0 4px 0;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
}
.souls-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.souls-divider::before,
.souls-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent);
}
.souls-gem {
  font-size: 7px;
  color: #d4af37;
  text-shadow: 0 0 6px #d4af37;
}
.souls-desc {
  font-size: 12.5px;
  color: #b5a895;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.souls-ember-track {
  height: 3px;
  background: rgba(0, 0, 0, 0.6);
  width: 100%;
}
.souls-ember-bar {
  height: 100%;
  background: linear-gradient(90deg, #993d00, #ff7700, #ffdd88);
  box-shadow: 0 0 10px rgba(255, 120, 0, 0.8);
  width: 100%;
  animation: souls-burnout 5s linear forwards;
}
@keyframes souls-burnout {
  from { width: 100%; }
  to { width: 0%; }
}
.animate-enter {
  animation: souls-emerge 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-leave {
  animation: souls-dissolve 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}
@keyframes souls-emerge {
  0% { opacity: 0; transform: translateY(45px) scale(0.93); filter: brightness(2) contrast(120%); }
  60% { opacity: 1; transform: translateY(-4px) scale(1.01); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); }
}
@keyframes souls-dissolve {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(30px) scale(0.96); }
}`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}
