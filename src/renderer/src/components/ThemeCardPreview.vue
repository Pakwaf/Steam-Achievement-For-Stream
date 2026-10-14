<template>
  <div class="theme-card-preview-viewport">
    <iframe
      :srcdoc="srcDoc"
      class="preview-iframe"
      sandbox=""
      tabindex="-1"
      scrolling="no"
    ></iframe>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { buildThemeIframeDocument } from '../utils/themeDocument.js'

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
    .replace(/\{game\}/gi, escapeHtml(dummyData.game))
})

const srcDoc = computed(() => {
  return buildThemeIframeDocument({
    html: renderedHtml.value,
    css: props.css || '',
    center: true
  })
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

.preview-iframe {
  width: 440px;
  height: 130px;
  border: none;
  background: transparent !important;
  transform: scale(0.66);
  transform-origin: center center;
  pointer-events: none;
}
</style>
