<template>
  <div class="desktop-overlay-container">
    <!-- Bannière de succès animée (5 secondes) -->
    <AchievementBanner
      :achievement="currentAchievement"
      :duration="5000"
      position="bottom-right"
      @dismiss="onDismiss"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AchievementBanner from '../components/AchievementBanner.vue'

const currentAchievement = ref(null)
let unsubscribe = null

onMounted(() => {
  // S'assurer que le body est 100% transparent pour l'overlay de jeu
  document.body.classList.add('transparent-view')
  document.documentElement.classList.add('transparent-view')

  if (window.steamAPI?.onAchievementUnlocked) {
    console.log('[DesktopOverlay] Écouteur IPC activé pour les succès')
    unsubscribe = window.steamAPI.onAchievementUnlocked((achievement) => {
      console.log('[DesktopOverlay] Succès reçu via IPC:', achievement.displayName)
      currentAchievement.value = achievement
    })
  } else {
    console.warn('[DesktopOverlay] API Electron non disponible dans ce contexte')
  }
})

function onDismiss() {
  currentAchievement.value = null
}

onUnmounted(() => {
  document.body.classList.remove('transparent-view')
  document.documentElement.classList.remove('transparent-view')
  if (typeof unsubscribe === 'function') {
    unsubscribe()
  }
})
</script>

<style scoped>
.desktop-overlay-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: transparent !important;
  overflow: hidden;
  pointer-events: none; /* Laisse passer tous les clics vers le jeu */
  position: relative;
}
</style>
