import { readTextFile, writeTextFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs'
import { invoke } from '@tauri-apps/api/core'
import { DEFAULT_THEME } from '../utils/defaultTheme.js'

const THEMES_FILENAME = 'themes.json'

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

export const MINIMAL_THEME = {
  id: 'theme-minimal-dark',
  name: 'Minimaliste Sombre',
  html: `<div class="mini-card">
  <img src="{icon}" alt="{title}" class="mini-icon" />
  <div class="mini-content">
    <span class="mini-game">{game}</span>
    <h4 class="mini-title">{title}</h4>
    <p class="mini-desc">{description}</p>
  </div>
</div>`,
  css: `.mini-card {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px;
  background: rgba(18, 18, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #fff;
  font-family: 'Outfit', sans-serif;
  z-index: 999999;
}
.mini-icon {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}
.mini-content { flex: 1; min-width: 0; }
.mini-game { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600; display: block; }
.mini-title { margin: 0 0 2px 0; font-size: 14px; font-weight: 600; }
.mini-desc { margin: 0; font-size: 11.5px; color: #bbb; }`,
  audioPath: null,
  audioDeviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
}

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

export const BUILTIN_THEMES = [
  DEFAULT_THEME,
  POKEMON_THEME,
  COZY_PIXEL_THEME,
  HORROR_THEME,
  DARK_FANTASY_THEME,
  WII_THEME,
  CYBERPUNK_THEME,
  MINIMAL_THEME
]

class ThemeStorageService {
  constructor() {
    this.cachedLibrary = null
    this.libraryListeners = new Set()
    this.customizationListeners = new Set()
  }

  isTauriAvailable() {
    return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__)
  }

  async ensureDirectory() {
    if (!this.isTauriAvailable()) return
    try {
      await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true })
    } catch {
      // Ignore si le dossier existe déjà
    }
  }

  async loadLibrary() {
    if (this.cachedLibrary) {
      return this.cachedLibrary
    }

    let loaded = null

    // 1. Essai de chargement via le backend Rust natif (direct, zéro contrainte de permissions)
    if (this.isTauriAvailable()) {
      try {
        const nativeLib = await invoke('get_theme_library')
        if (nativeLib && Array.isArray(nativeLib.themes) && nativeLib.themes.length > 0) {
          loaded = nativeLib
        }
      } catch (err) {
        console.warn('[ThemeStorage] get_theme_library erreur:', err)
      }
    }

    // 2. Essai de chargement via localStorage (cache synchrone rapide)
    if (!loaded && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('steam_overlay_themes_v2') || localStorage.getItem('steam_overlay_themes')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && Array.isArray(parsed.themes) && parsed.themes.length > 0) {
            loaded = parsed
          }
        }
      } catch (err) {
        console.warn('[ThemeStorage] Lecture localStorage:', err)
      }
    }

    // 3. Essai de chargement via plugin FS Tauri
    if (!loaded && this.isTauriAvailable()) {
      try {
        await this.ensureDirectory()
        const fileExists = await exists(THEMES_FILENAME, { baseDir: BaseDirectory.AppData })
        if (fileExists) {
          const content = await readTextFile(THEMES_FILENAME, { baseDir: BaseDirectory.AppData })
          const parsed = JSON.parse(content)
          if (parsed && Array.isArray(parsed.themes) && parsed.themes.length > 0) {
            loaded = parsed
          }
        }
      } catch (err) {
        // ignore
      }
    }

    if (loaded) {
      // Fusion automatique : s'assurer que les nouveaux thèmes par défaut (Pokemon, Cozy, Horror, Dark Fantasy, Wii)
      // sont bien présents dans la bibliothèque même si l'utilisateur avait une ancienne sauvegarde
      const existingIds = new Set(loaded.themes.map((t) => t.id))
      for (const builtin of BUILTIN_THEMES) {
        if (!existingIds.has(builtin.id)) {
          loaded.themes.push({
            ...builtin,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }
      this.cachedLibrary = loaded
    } else {
      // Premier lancement : créer la bibliothèque avec tous les thèmes par défaut
      this.cachedLibrary = {
        activeThemeId: DEFAULT_THEME.id,
        themes: BUILTIN_THEMES.map((t) => ({
          ...t,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      }
    }

    await this.persistLibrary()
    return this.cachedLibrary
  }

  async persistLibrary() {
    if (!this.cachedLibrary) return

    const json = JSON.stringify(this.cachedLibrary, null, 2)

    // 1. Sauvegarde instantanée dans localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('steam_overlay_themes_v2', json)
      } catch (e) {
        console.warn('[ThemeStorage] Erreur sauvegarde localStorage:', e)
      }
    }

    // 2. Sauvegarde via le backend natif Rust (écrit dans AppData sans limitation de permissions)
    if (this.isTauriAvailable()) {
      try {
        await invoke('save_theme_library', { library: this.cachedLibrary })
      } catch (err) {
        console.warn('[ThemeStorage] save_theme_library erreur:', err)
      }

      // 3. Sauvegarde plugin FS de secours
      try {
        await this.ensureDirectory()
        await writeTextFile(THEMES_FILENAME, json, { baseDir: BaseDirectory.AppData })
      } catch {
        // ignore
      }
    }

    // Synchroniser avec OBS Server
    const active = this.getActiveThemeSync()
    if (active && this.isTauriAvailable()) {
      try {
        await invoke('update_customization', { theme: active })
      } catch (err) {
        console.warn('[ThemeStorage] Erreur synchronisation customization:', err)
      }
    }

    this.notifyLibraryUpdated()
    if (active) {
      this.notifyCustomizationUpdated(active)
    }
  }

  async getLibrary() {
    return await this.loadLibrary()
  }

  getActiveThemeSync() {
    if (!this.cachedLibrary) return DEFAULT_THEME
    const target = this.cachedLibrary.themes.find((t) => t.id === this.cachedLibrary.activeThemeId)
    return target || this.cachedLibrary.themes[0] || DEFAULT_THEME
  }

  async getActiveTheme() {
    await this.loadLibrary()
    return this.getActiveThemeSync()
  }

  async setActiveTheme(id) {
    const lib = await this.loadLibrary()
    const found = lib.themes.find((t) => t.id === id)
    if (!found) {
      return { success: false, error: 'Thème introuvable' }
    }

    lib.activeThemeId = id
    await this.persistLibrary()

    return {
      success: true,
      activeTheme: { ...found },
      library: { ...lib }
    }
  }

  async saveTheme(themeData) {
    if (!themeData) return { success: false, error: 'Données invalides' }

    const lib = await this.loadLibrary()
    const index = lib.themes.findIndex((t) => t.id === themeData.id)
    const now = new Date().toISOString()

    let updated = null
    if (index !== -1) {
      lib.themes[index] = {
        ...lib.themes[index],
        ...themeData,
        updatedAt: now
      }
      updated = lib.themes[index]
    } else {
      const newId = themeData.id || `theme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      updated = {
        id: newId,
        name: themeData.name || `Thème ${lib.themes.length + 1}`,
        html: themeData.html || DEFAULT_THEME.html,
        css: themeData.css || DEFAULT_THEME.css,
        audioPath: themeData.audioPath || null,
        audioDeviceId: themeData.audioDeviceId || 'default',
        soundEnabled: themeData.soundEnabled ?? true,
        soundVolume: typeof themeData.soundVolume === 'number' ? themeData.soundVolume : 0.8,
        createdAt: now,
        updatedAt: now
      }
      lib.themes.push(updated)
    }

    await this.persistLibrary()

    return {
      success: true,
      theme: { ...updated },
      library: { ...lib }
    }
  }

  async createTheme(initial = {}) {
    const lib = await this.loadLibrary()
    const newId = `theme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const newTheme = {
      id: newId,
      name: initial.name || `Nouveau Thème ${lib.themes.length + 1}`,
      html: initial.html || DEFAULT_THEME.html,
      css: initial.css || DEFAULT_THEME.css,
      audioPath: initial.audioPath || null,
      audioDeviceId: initial.audioDeviceId || 'default',
      soundEnabled: initial.soundEnabled ?? true,
      soundVolume: typeof initial.soundVolume === 'number' ? initial.soundVolume : 0.8,
      createdAt: now,
      updatedAt: now
    }

    lib.themes.unshift(newTheme)
    await this.persistLibrary()

    return {
      success: true,
      theme: { ...newTheme },
      library: { ...lib }
    }
  }

  async duplicateTheme(id) {
    const lib = await this.loadLibrary()
    const source = lib.themes.find((t) => t.id === id)
    if (!source) {
      return { success: false, error: 'Thème source introuvable' }
    }

    const newId = `theme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const duplicated = {
      ...source,
      id: newId,
      name: `${source.name} (Copie)`,
      createdAt: now,
      updatedAt: now
    }

    const idx = lib.themes.findIndex((t) => t.id === id)
    lib.themes.splice(idx + 1, 0, duplicated)
    await this.persistLibrary()

    return {
      success: true,
      duplicatedTheme: { ...duplicated },
      library: { ...lib }
    }
  }

  async deleteTheme(id) {
    const lib = await this.loadLibrary()
    if (lib.themes.length <= 1) {
      return { success: false, error: 'Impossible de supprimer le dernier thème restant' }
    }

    const idx = lib.themes.findIndex((t) => t.id === id)
    if (idx === -1) {
      return { success: false, error: 'Thème introuvable' }
    }

    lib.themes.splice(idx, 1)

    if (lib.activeThemeId === id) {
      lib.activeThemeId = lib.themes[0].id
    }

    await this.persistLibrary()

    return {
      success: true,
      activeTheme: this.getActiveThemeSync(),
      library: { ...lib }
    }
  }

  notifyLibraryUpdated() {
    if (!this.cachedLibrary) return
    const clone = { ...this.cachedLibrary }
    for (const cb of this.libraryListeners) {
      try {
        cb(clone)
      } catch (e) {
        console.error(e)
      }
    }
  }

  notifyCustomizationUpdated(theme) {
    const clone = { ...theme }
    for (const cb of this.customizationListeners) {
      try {
        cb(clone)
      } catch (e) {
        console.error(e)
      }
    }
  }

  onLibraryUpdated(callback) {
    this.libraryListeners.add(callback)
    return () => this.libraryListeners.delete(callback)
  }

  onCustomizationUpdated(callback) {
    this.customizationListeners.add(callback)
    return () => this.customizationListeners.delete(callback)
  }
}

export const themeStorage = new ThemeStorageService()
