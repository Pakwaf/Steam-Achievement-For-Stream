<template>
  <div class="theme-card-preview-viewport">
    <component is="style" type="text/css">
      {{ safeCss }}
    </component>
    <div class="theme-preview-scale-wrapper">
      <div v-html="processedHtml" class="achievement-preview-render"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeSoft, sanitizeCss } from '../utils/sanitizeSoft.js'

const props = defineProps({
  html: {
    type: String,
    default: ''
  },
  css: {
    type: String,
    default: ''
  }
})

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

const dummyData = {
  title: 'Tête de classe',
  description: 'Jouez un round entier avec chaque classe.',
  game: 'Team Fortress 2',
  icon: fallbackIcon
}

function escapeHtml(text) {
  if (!text) return ''
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return text.toString().replace(/[&<>"']/g, (m) => map[m])
}

const renderedHtml = computed(() => {
  if (!props.html) return '<div style="color: #6a7c93; font-size: 13px;">Aucun HTML défini</div>'
  return props.html
    .replace(/\{title\}/gi, escapeHtml(dummyData.title))
    .replace(/\{description\}/gi, escapeHtml(dummyData.description))
    .replace(/\{icon\}/gi, dummyData.icon)
    .replace(/\{iconUrl\}/gi, dummyData.icon)
    .replace(/\{icon_url\}/gi, dummyData.icon)
    .replace(/\{image\}/gi, dummyData.icon)
    .replace(/\{img\}/gi, dummyData.icon)
    .replace(/\{game\}/gi, escapeHtml(dummyData.game))
})

const processedHtml = computed(() => {
  return sanitizeSoft(renderedHtml.value)
})

const safeCss = computed(() => {
  return sanitizeCss(props.css || '')
})
</script>

<style scoped>
.theme-card-preview-viewport {
  width: 100%;
  height: 110px;
  background: #070a0f;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
}

.theme-preview-scale-wrapper {
  width: 440px;
  transform: scale(0.66);
  transform-origin: center center;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Neutralisation du positionnement fixe pour affichage parfait centré dans la vignette */
.theme-card-preview-viewport :deep(.custom-achievement-card),
.theme-card-preview-viewport :deep(.cyber-achievement-card),
.theme-card-preview-viewport :deep(.minimal-achievement-card),
.theme-card-preview-viewport :deep(div[class*="achievement-card"]),
.theme-card-preview-viewport :deep(div[class*="card"]) {
  position: relative !important;
  top: auto !important;
  bottom: auto !important;
  left: auto !important;
  right: auto !important;
  margin: 0 auto !important;
  transform: none !important;
}

.theme-card-preview-viewport :deep(img),
.theme-card-preview-viewport :deep(.ach-icon),
.theme-card-preview-viewport :deep(.mini-icon),
.theme-card-preview-viewport :deep(.cyber-icon) {
  max-width: 64px !important;
  max-height: 64px !important;
  object-fit: cover !important;
  border-radius: 8px !important;
}
</style>
