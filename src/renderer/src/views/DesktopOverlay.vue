<template>
  <div
    class="master-overlay-container"
    v-show="isDisplaying"
    :class="{ 'animate-enter': isEntering, 'animate-leave': isLeaving }"
  >
    <iframe
      ref="themeIframe"
      sandbox="allow-same-origin"
      frameborder="0"
      scrolling="no"
      class="theme-iframe"
    ></iframe>
  </div>
</template>

<script setup>
import { useDesktopOverlay } from '../composables/useDesktopOverlay.js'

const {
  themeIframe,
  isDisplaying,
  isEntering,
  isLeaving
} = useDesktopOverlay()
</script>

<style scoped>
.master-overlay-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  background: transparent !important;
  overflow: hidden;
  pointer-events: none;
  z-index: 999999;
}

.theme-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent !important;
  pointer-events: none;
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
