<template>
  <div class="history-card">
    <div class="history-header">
      <h3>Succès récents ({{ unlockedHistory.length }})</h3>
      <span v-if="unlockedHistory.length > 0" class="btn-clear-history" @click="$emit('clear-history')">
        Effacer
      </span>
    </div>

    <div v-if="unlockedHistory.length === 0" class="history-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-trophy">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.072 0a5.25 5.25 0 00-6.072 0m6.072 0c.937.606 1.572 1.637 1.603 2.825m-7.675-2.825c-.937.606-1.572 1.637-1.603 2.825M12 3v9m0 0l-3-3m3 3l3-3" />
      </svg>
      <p>En attente du premier succès...</p>
      <span class="empty-sub">Lancez un jeu Steam ou utilisez les boutons de test ci-dessus.</span>
    </div>

    <div v-else class="history-list">
      <div
        v-for="(item, idx) in unlockedHistory"
        :key="idx"
        class="history-item"
      >
        <img
          :src="item.icon || fallbackIcon"
          :alt="item.displayName"
          class="history-icon"
          @error="onIconError"
        />
        <div class="history-info">
          <div class="history-top">
            <span class="history-game">{{ item.gameName }}</span>
            <span class="history-time">{{ formatTime(item.unlockedAt) }}</span>
          </div>
          <div class="history-name">{{ item.displayName }}</div>
          <div class="history-desc">{{ item.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  unlockedHistory: {
    type: Array,
    default: () => []
  },
  fallbackIcon: {
    type: String,
    default: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
  }
})

defineEmits(['clear-history'])

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function onIconError(e) {
  e.target.src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
}
</script>

<style scoped>
.history-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow-card);
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.history-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.btn-clear-history {
  font-size: 0.8rem;
  color: var(--steam-text-muted);
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.btn-clear-history:hover {
  color: #ff8080;
  background: rgba(235, 87, 87, 0.1);
}

.history-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--steam-text-muted);
}

.empty-trophy {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.history-empty p {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.3rem;
}

.empty-sub {
  font-size: 0.8rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 0.85rem 1rem;
}

.history-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.2rem;
  font-size: 0.75rem;
}

.history-game {
  color: #66c0f4;
  font-weight: 600;
}

.history-time {
  color: var(--steam-text-muted);
}

.history-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-desc {
  font-size: 0.78rem;
  color: #9cb0c9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
