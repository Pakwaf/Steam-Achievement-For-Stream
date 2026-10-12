// Thème Minimaliste Sombre discret et épuré
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
