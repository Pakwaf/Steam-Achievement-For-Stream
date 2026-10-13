<template>
  <div class="desktop-overlay-container">
    <!-- Style CSS universel (effets, tiers) + CSS utilisateur injecté dynamiquement -->
    <component :is="'style'">
      {{ visualEffectsCss }}
      {{ activePreviewTheme?.css || currentTheme.css || DEFAULT_THEME.css }}
      {{ currentTierOverrideCss }}
    </component>

    <!-- Zone de rendu plein écran pour la notification de succès sur l'écran du joueur -->
    <div
      ref="slotRef"
      class="desktop-achievement-slot"
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

.desktop-achievement-slot {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  pointer-events: none;
  overflow: hidden;
}
</style>
