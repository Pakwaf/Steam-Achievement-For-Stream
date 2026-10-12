<template>
  <div class="profile-card">
    <div class="profile-header">
      <div class="avatar-container">
        <img
          :src="currentUser?.avatar || fallbackIcon"
          :alt="currentUser?.personaName || 'Utilisateur Steam'"
          class="user-avatar"
          @error="onAvatarError"
        />
        <span class="avatar-status-ring"></span>
      </div>

      <div class="user-meta">
        <div class="name-row">
          <h2 class="user-name">{{ currentUser?.personaName }}</h2>
          <span class="user-state-pill">{{ currentUser?.onlineState || 'En ligne' }}</span>
        </div>
        <div class="steam-id-box">
          <span class="label">SteamID64 :</span>
          <code class="id-value">{{ currentUser?.steamId }}</code>
          <button class="btn-copy" title="Copier le SteamID" @click="$emit('copy-steam-id')">
            {{ copied ? 'Copié !' : 'Copier' }}
          </button>
        </div>
      </div>

      <div class="profile-actions-inline">
        <button class="btn-secondary btn-manage-key" title="Gérer ou modifier la clé Steam API" @click="$emit('open-api-key-modal')">
          🔑 Clé API
        </button>
        <button class="btn-secondary" title="Ouvrir le profil Steam" @click="$emit('open-steam-profile')">
          Profil Steam
        </button>
        <button class="btn-danger" title="Se déconnecter" @click="$emit('logout')">
          Déconnexion
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentUser: {
    type: Object,
    required: true
  },
  copied: {
    type: Boolean,
    default: false
  },
  fallbackIcon: {
    type: String,
    default: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
  }
})

defineEmits(['copy-steam-id', 'open-api-key-modal', 'open-steam-profile', 'logout'])

function onAvatarError(e) {
  e.target.src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
}
</script>

<style scoped>
.profile-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-card);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.avatar-container {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.avatar-status-ring {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background-color: var(--steam-online);
  border: 2px solid #1b2838;
  border-radius: 50%;
}

.user-meta {
  flex: 1;
  min-width: 200px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.user-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.user-state-pill {
  font-size: 0.75rem;
  color: var(--steam-online);
  background: rgba(87, 203, 244, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 500;
}

.steam-id-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--steam-text-muted);
}

.id-value {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: #c5d4e8;
  font-family: monospace;
}

.btn-copy {
  background: none;
  border: none;
  color: #66c0f4;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
}

.btn-copy:hover {
  text-decoration: underline;
}

.profile-actions-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--steam-text-main);
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-danger {
  background: rgba(235, 87, 87, 0.15);
  border: 1px solid rgba(235, 87, 87, 0.3);
  color: #ff8080;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-danger:hover {
  background: rgba(235, 87, 87, 0.25);
  border-color: rgba(235, 87, 87, 0.5);
}
</style>
