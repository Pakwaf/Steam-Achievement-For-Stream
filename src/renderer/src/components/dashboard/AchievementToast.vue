<template>
  <transition name="achievement-pop">
    <div v-if="notification" class="achievement-toast" role="alert">
      <div class="toast-glow-border"></div>
      <div class="toast-content">
        <!-- Icône du succès -->
        <div class="toast-icon-wrapper">
          <img
            :src="notification.icon || fallbackIcon"
            :alt="notification.displayName"
            class="achievement-icon"
            @error="$emit('icon-error', $event)"
          />
          <div class="icon-shine"></div>
        </div>

        <!-- Textes du succès -->
        <div class="toast-details">
          <div class="toast-header-row">
            <span class="game-tag">{{ notification.gameName || 'Steam' }}</span>
            <span class="unlocked-title">SUCCÈS DÉBLOQUÉ !</span>
            <button class="btn-dismiss-toast" title="Fermer" @click="$emit('dismiss')">✕</button>
          </div>
          <h4 class="achievement-title">{{ notification.displayName }}</h4>
          <p class="achievement-desc">{{ notification.description }}</p>
        </div>
      </div>
      <!-- Barre de progression automatique du toast (5 secondes) -->
      <div class="toast-progress-bar"></div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  notification: {
    type: Object,
    default: null
  },
  fallbackIcon: {
    type: String,
    default: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
  }
})

defineEmits(['dismiss', 'icon-error'])
</script>

<style scoped>
.achievement-toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  width: 440px;
  background: rgba(18, 26, 38, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 14px;
  border: 1px solid rgba(240, 195, 48, 0.5);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 25px rgba(240, 195, 48, 0.25);
  overflow: hidden;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
}

.toast-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #f0c330;
  box-shadow: 0 0 14px rgba(240, 195, 48, 0.4);
}

.achievement-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #0b0e14;
}

.toast-details {
  flex: 1;
  min-width: 0;
}

.toast-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.game-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #66c0f4;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.unlocked-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #f0c330;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(240, 195, 48, 0.4);
}

.btn-dismiss-toast {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.btn-dismiss-toast:hover {
  color: #fff;
}

.achievement-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.achievement-desc {
  font-size: 0.8rem;
  color: #9cb0c9;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toast-progress-bar {
  height: 3px;
  background: linear-gradient(90deg, #f0c330, #ffdd77);
  animation: countdown 5s linear forwards;
}

@keyframes countdown {
  from { width: 100%; }
  to { width: 0%; }
}

.achievement-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.achievement-pop-leave-active {
  transition: all 0.3s ease-in;
}
.achievement-pop-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.92);
}
.achievement-pop-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
</style>
