<template>
  <header class="app-header">
    <div class="brand">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="currentColor" class="steam-logo">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15c-.55-.26-1-.8-1-1.5 0-.83.67-1.5 1.5-1.5.15 0 .29.02.43.07L13.5 9.5C13.2 9.07 13 8.56 13 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3c-.56 0-1.07-.2-1.5-.5l-2.57 2.57c.05.14.07.28.07.43 0 .7-.45 1.24-1 1.5v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z"/>
        </svg>
      </div>
      <div class="brand-text">
        <h1>Steam Custom Achievements</h1>
      </div>
    </div>
    <div class="header-status-group">
      <!-- Tracker status -->
      <div class="tracker-status-chip" :class="{ active: trackerStatus?.isTracking }">
        <span class="chip-dot"></span>
        <span v-if="trackerStatus?.activeGameName">En jeu : {{ trackerStatus.activeGameName }}</span>
        <span v-else>{{ trackerStatus?.isTracking ? 'En attente de jeu' : 'Inactif' }}</span>
      </div>
      <!-- Auth status -->
      <div class="system-status">
        <span class="status-dot" :class="{ online: currentUser, offline: !currentUser }"></span>
        <span class="status-label">{{ currentUser ? currentUser.personaName : 'Déconnecté' }}</span>
      </div>
      <!-- Bouton Paramètres Généraux (Audio global, Port OBS, Overlay) -->
      <button class="btn-header-settings" title="Paramètres généraux de l'application" @click="$emit('open-settings')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-gear-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Paramètres</span>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  trackerStatus: {
    type: Object,
    default: null
  },
  currentUser: {
    type: Object,
    default: null
  }
})

defineEmits(['open-settings'])
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1rem 2.5rem;
  background: rgba(14, 20, 27, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1b2838 0%, #171a21 100%);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.steam-logo {
  width: 26px;
  height: 26px;
  color: var(--steam-blue);
}

.brand-text h1 {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #fff;
  margin: 0;
}

.header-status-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tracker-status-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: rgba(22, 32, 47, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--steam-text-muted);
}

.tracker-status-chip.active {
  border-color: rgba(92, 126, 16, 0.5);
  color: #a1cd44;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff5555;
}

.tracker-status-chip.active .chip-dot {
  background: #a1cd44;
  box-shadow: 0 0 8px #a1cd44;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(22, 32, 47, 0.6);
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  font-size: 0.8rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background-color: var(--steam-online);
  box-shadow: 0 0 8px var(--steam-online);
}

.status-dot.offline {
  background-color: #6c757d;
}

.status-label {
  font-weight: 500;
  color: var(--steam-text-main);
}

.btn-header-settings {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c7d5e0;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-header-settings:hover {
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  transform: translateY(-1px);
}

.settings-gear-icon {
  width: 16px;
  height: 16px;
}
</style>
