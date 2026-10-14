<template>
  <div class="desktop-overlay-container">
    <!-- Style CSS universel (effets, tiers) + CSS utilisateur injecté dynamiquement -->
    <component :is="'style'">
      {{ visualEffectsCss }}
      {{ activePreviewTheme?.css || currentTheme.css || DEFAULT_THEME.css }}
      {{ currentTierOverrideCss }}
    </component>

    <!-- Zone de rendu de la notification de succès sur l'écran du joueur (forcée en bas à droite) -->
    <div
      ref="slotRef"
      class="desktop-achievement-slot master-overlay-container"
      v-html="renderedHtml"
    ></div>
  </div>
</template>

<script setup>
import { DEFAULT_THEME } from '../utils/defaultTheme.js'
import { getVisualEffectsCss } from '../utils/visualEffects.js'
import { useDesktopOverlay } from '../composables/useDesktopOverlay.js'

const visualEffectsCss = getVisualEffectsCss()

const {
  currentTheme,
  activePreviewTheme,
  currentTierOverrideCss,
  renderedHtml,
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
  bottom: 40px;
  right: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  z-index: 9999;
  pointer-events: none;
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>
