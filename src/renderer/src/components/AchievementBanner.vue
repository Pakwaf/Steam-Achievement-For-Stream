<template>
  <transition name="achievement-slide">
    <div v-if="visible && current" class="achievement-banner" :class="[positionClass]" role="alert">
      <!-- Lueur d'ambiance dorée -->
      <div class="banner-ambient-glow"></div>
      
      <div class="banner-content">
        <!-- Cadre de l'icône du succès -->
        <div class="icon-frame">
          <img
            :src="current.icon || fallbackIcon"
            :alt="current.displayName"
            class="banner-icon"
            @error="onIconError"
          />
          <div class="icon-sheen"></div>
        </div>

        <!-- Informations textuelles -->
        <div class="details">
          <div class="meta-row">
            <span class="game-name" :title="current.gameName">{{ current.gameName || 'Steam' }}</span>
            <span class="badge-unlocked">SUCCÈS DÉBLOQUÉ !</span>
          </div>
          <h3 class="achievement-title" :title="current.displayName">{{ current.displayName }}</h3>
          <p class="achievement-desc" :title="current.description">{{ current.description || 'Succès obtenu' }}</p>
        </div>
      </div>

      <!-- Barre de progression (compte à rebours 5 secondes) -->
      <div class="countdown-bar" :style="{ animationDuration: `${duration}ms` }"></div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  achievement: {
    type: Object,
    default: null
  },
  duration: {
    type: Number,
    default: 5000 // 5 secondes
  },
  position: {
    type: String,
    default: 'bottom-right' // 'bottom-right', 'top-right', 'bottom-center'
  }
})

const emit = defineEmits(['dismiss'])

const current = ref(null)
const visible = ref(false)
let hideTimer = null

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

const positionClass = `pos-${props.position}`

watch(() => props.achievement, (newVal) => {
  if (newVal) {
    showAchievement(newVal)
  }
}, { immediate: true })

function showAchievement(item) {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  current.value = item
  visible.value = true

  // Disparition automatique après 5 secondes
  hideTimer = setTimeout(() => {
    visible.value = false
    emit('dismiss')
  }, props.duration)
}

function onIconError(e) {
  e.target.src = fallbackIcon
}

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped>
/* ========================================================
   CONTENEUR PRINCIPAL DU BANNER OVERLAY
   ======================================================== */
.achievement-banner {
  position: fixed;
  z-index: 999999;
  width: 440px;
  max-width: calc(100vw - 2rem);
  background: rgba(14, 20, 29, 0.96);
  backdrop-filter: blur(16px);
  border-radius: 12px;
  border: 1px solid rgba(240, 195, 48, 0.55);
  box-shadow: 
    0 16px 40px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(240, 195, 48, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  overflow: hidden;
  pointer-events: auto;
  user-select: none;
}

/* Positions configurables */
.pos-bottom-right {
  bottom: 2rem;
  right: 2rem;
}

.pos-top-right {
  top: 2rem;
  right: 2rem;
}

.pos-bottom-center {
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
}

/* Lueur d'ambiance */
.banner-ambient-glow {
  position: absolute;
  top: -30px;
  left: -30px;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(240, 195, 48, 0.3) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(10px);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 1rem 1.25rem;
}

/* Cadre de l'icône Steam */
.icon-frame {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #f0c330;
  box-shadow: 0 0 16px rgba(240, 195, 48, 0.45);
  background: #090d13;
}

.banner-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.icon-sheen {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    135deg,
    transparent 40%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 60%
  );
  animation: shine 4s infinite;
  pointer-events: none;
}

@keyframes shine {
  0% { transform: translate(-80%, -80%); }
  35%, 100% { transform: translate(80%, 80%); }
}

/* Détails textuels */
.details {
  flex: 1;
  min-width: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.game-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: #66c0f4;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.badge-unlocked {
  font-size: 0.72rem;
  font-weight: 800;
  color: #f0c330;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(240, 195, 48, 0.45);
  white-space: nowrap;
}

.achievement-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.2rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.achievement-desc {
  font-size: 0.8rem;
  color: #a4b4cc;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Compte à rebours progressif de 5 secondes */
.countdown-bar {
  height: 3px;
  background: linear-gradient(90deg, #f0c330, #ffe680);
  width: 100%;
  animation-name: countdown;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes countdown {
  from { width: 100%; }
  to { width: 0%; }
}

/* ========================================================
   ANIMATION CSS D'ENTRÉE ET SORTIE (5 SECONDES)
   Slide-Up & Fade-In à l'arrivée / Slide-Down & Fade-Out au départ
   ======================================================== */
.achievement-slide-enter-active {
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.achievement-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.7, 0, 0.84, 0);
}

.achievement-slide-enter-from {
  opacity: 0;
  transform: translateY(35px) scale(0.94);
}

.achievement-slide-leave-to {
  opacity: 0;
  transform: translateY(25px) scale(0.96);
}
</style>
