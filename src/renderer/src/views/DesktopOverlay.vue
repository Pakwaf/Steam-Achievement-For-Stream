<template>
  <div class="desktop-overlay-container">
    <div
      v-if="isDisplaying && fullThemeDocument"
      class="master-overlay-container"
      :class="{ 'animate-enter': isEntering, 'animate-leave': isLeaving }"
    >
      <iframe
        :srcdoc="fullThemeDocument"
        sandbox=""
        frameborder="0"
        scrolling="no"
        class="theme-iframe"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { useDesktopOverlay } from '../composables/useDesktopOverlay.js'

const {
  fullThemeDocument,
  isDisplaying,
  isEntering,
  isLeaving
} = useDesktopOverlay()
</script>

<style scoped>
.desktop-overlay-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: transparent !important;
  overflow: hidden;
  pointer-events: none;
  position: relative;
}

.master-overlay-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 500px;
  height: 180px;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.theme-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent !important;
  pointer-events: none;
  overflow: hidden;
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
