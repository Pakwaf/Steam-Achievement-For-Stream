<template>
  <div class="overlay-root">
    <!-- Le CSS global du thème est injecté ici de manière native -->
    <component is="style" type="text/css">
      {{ currentThemeCss }}
    </component>

    <div
      v-show="isDisplaying"
      class="master-overlay-container"
      :class="{ 'animate-enter': isEntering, 'animate-leave': isLeaving }"
    >
      <!-- Le rendu du HTML du thème, encapsulé pour ne pas casser la vue -->
      <div class="theme-wrapper" :class="[tierClass, fxClass]">
        <div v-html="processedHtml" class="achievement-render-box achievement-card"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDesktopOverlay } from '../composables/useDesktopOverlay.js'

const {
  currentThemeCss,
  processedHtml,
  tierClass,
  fxClass,
  isDisplaying,
  isEntering,
  isLeaving
} = useDesktopOverlay()
</script>

<style scoped>
.master-overlay-container {
  /* Fixé en bas à droite pour l'overlay In-Game */
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  will-change: transform, opacity;
  transform: translateZ(0);
}

.theme-wrapper {
  position: relative;
  /* Permet au CSS du thème de s'appliquer correctement dans cette boîte */
}

/* Animations de transition fluide */
.animate-enter {
  animation: ach-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-leave {
  animation: ach-slide-down 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes ach-slide-up {
  from { opacity: 0; transform: translateY(40px) scale(0.94); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes ach-slide-down {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(30px) scale(0.96); }
}
</style>
