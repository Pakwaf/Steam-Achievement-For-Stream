<template>
  <div class="desktop-overlay-container">
    <!-- Zone de rendu fixe pour la notification de succès en bas à droite -->
    <div class="master-overlay-container">
      <!-- Injection du CSS de manière isolée et sécurisée -->
      <component is="style" type="text/css">
        {{ currentThemeCss }}
      </component>

      <!-- Le conteneur du thème qui englobe le HTML et force la boîte visuelle -->
      <div
        v-if="sanitizedHtml"
        ref="slotRef"
        class="theme-container theme-effect-layer-wrapper"
        :class="[tierClass, fxClass, { 'animate-enter': isEntering, 'animate-leave': isLeaving }]"
      >
        <!-- Calque d'effets visuels universel (étoiles, néon, shimmer...) -->
        <div class="theme-effect-layer"></div>

        <!-- Contenu du succès assaini via DOMPurify -->
        <div v-html="sanitizedHtml" class="achievement-content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDesktopOverlay } from '../composables/useDesktopOverlay.js'

const {
  currentThemeCss,
  sanitizedHtml,
  slotRef,
  tierClass,
  fxClass,
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
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  pointer-events: none;
}

/* Conteneur principal de la notification (force la boîte visuelle, fond, bordures) */
.theme-container {
  position: relative;
  width: 440px;
  max-width: calc(100vw - 60px);
  min-height: 84px;
  background: rgba(14, 20, 29, 0.96);
  border-radius: 14px;
  border: 1px solid rgba(240, 195, 48, 0.6);
  box-shadow: 
    0 20px 48px rgba(0, 0, 0, 0.85),
    0 0 32px rgba(240, 195, 48, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #fff;
  user-select: none;
  pointer-events: none;
  box-sizing: border-box;
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Couche de contenu interne */
.achievement-content {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
}

/* Neutralisation du positionnement fixe des cartes internes pour respecter le theme-container */
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
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Protection absolue des images d'icône : jamais géante, dimension 64x64 verrouillée */
.achievement-content :deep(img),
.achievement-content :deep(.ach-icon),
.achievement-content :deep(.mini-icon),
.achievement-content :deep(.cyber-icon) {
  width: 64px !important;
  height: 64px !important;
  min-width: 64px !important;
  min-height: 64px !important;
  max-width: 64px !important;
  max-height: 64px !important;
  object-fit: cover !important;
  border-radius: 10px !important;
  display: block !important;
  flex-shrink: 0 !important;
}

.achievement-content :deep(.icon-container),
.achievement-content :deep(.cyber-icon-box) {
  width: 64px !important;
  height: 64px !important;
  min-width: 64px !important;
  min-height: 64px !important;
  flex-shrink: 0 !important;
  border-radius: 10px !important;
  overflow: hidden !important;
}

/* Animations de transition */
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
