<template>
  <div class="desktop-overlay-container">
    <!-- Injection du CSS de manière isolée et sécurisée -->
    <component is="style" type="text/css">
      {{ currentThemeCss }}
    </component>

    <!-- Zone de rendu fixe pour la notification de succès en bas à droite -->
    <div class="master-overlay-container">
      <div
        ref="slotRef"
        class="desktop-achievement-slot"
        v-html="sanitizedHtml"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { useDesktopOverlay } from '../composables/useDesktopOverlay.js'

const {
  currentThemeCss,
  sanitizedHtml,
  slotRef
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
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  pointer-events: none;
}

.desktop-achievement-slot {
  pointer-events: none;
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Neutralisation du positionnement fixe hérité du thème pour respecter le master-overlay-container */
.master-overlay-container :deep(.custom-achievement-card),
.master-overlay-container :deep(.cyber-achievement-card),
.master-overlay-container :deep(.minimal-achievement-card),
.master-overlay-container :deep(div[class*="achievement-card"]),
.master-overlay-container :deep(div[class*="card"]) {
  position: relative !important;
  top: auto !important;
  bottom: auto !important;
  left: auto !important;
  right: auto !important;
  margin: 0 !important;
}
</style>
