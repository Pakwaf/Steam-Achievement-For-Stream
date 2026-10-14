<template>
  <div class="editor-pane-layout editor-html-tab">
    <div class="editor-column">
      <div class="code-editor-header">
        <span class="editor-label">Structure HTML — {{ selectedTierName }}</span>
        <span class="editor-hint">{{ tierHint }}</span>
      </div>
      <textarea
        ref="localTextarea"
        v-model="htmlContent"
        class="code-textarea html-mode"
        spellcheck="false"
        placeholder="<div>...</div>"
      ></textarea>
    </div>

    <div class="help-sidebar">
      <h4>Balises Disponibles</h4>
      <p class="help-sub">Ces variables seront automatiquement remplacées lors d'un déblocage de succès :</p>

      <div class="placeholders-list">
        <button
          v-for="p in PLACEHOLDERS"
          :key="p.tag"
          class="placeholder-chip"
          :title="`Cliquer pour insérer ${p.tag}`"
          type="button"
          @click="insertTag(p.tag)"
        >
          <code>{{ p.tag }}</code>
          <span>{{ p.desc }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const htmlContent = defineModel({ type: String, default: '' })

defineProps({
  selectedTierName: {
    type: String,
    default: 'Standard'
  },
  tierHint: {
    type: String,
    default: 'Modèle principal par défaut'
  }
})

const localTextarea = ref(null)

const PLACEHOLDERS = [
  { tag: '{title}', desc: 'Titre officiel du succès' },
  { tag: '{description}', desc: 'Description / objectif' },
  { tag: '{icon}', desc: "URL de l'image (icône 64x64)" },
  { tag: '{game}', desc: 'Nom du jeu Steam' },
  { tag: '{tier}', desc: 'common, rare ou master' },
  { tag: '{tierLabel}', desc: 'Badge texte (ex: SUCCÈS RARE)' },
  { tag: '{rarity}', desc: 'Rareté mondiale (ex: 4.8%)' },
  { tag: '{playtime}', desc: 'Temps de jeu Platine (ex: 142.5h)' }
]

function insertTag(tag) {
  const el = localTextarea.value
  if (!el) {
    htmlContent.value = (htmlContent.value || '') + tag
    return
  }

  const start = el.selectionStart || 0
  const end = el.selectionEnd || 0
  const text = htmlContent.value || ''
  htmlContent.value = text.substring(0, start) + tag + text.substring(end)

  setTimeout(() => {
    el.focus()
    el.setSelectionRange(start + tag.length, start + tag.length)
  }, 10)
}

defineExpose({
  textarea: localTextarea,
  insertTag
})
</script>

<style scoped>
.editor-pane-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .editor-pane-layout {
    grid-template-columns: 1fr;
  }
}

.editor-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.code-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.editor-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
}

.editor-hint {
  font-size: 0.78rem;
  color: #8b9bb4;
  font-style: italic;
}

.code-textarea {
  width: 100%;
  min-height: 400px;
  background: rgba(8, 12, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 14px 16px;
  color: #e6edf3;
  font-family: 'Fira Code', Consolas, Monaco, monospace;
  font-size: 0.88rem;
  line-height: 1.5;
  box-sizing: border-box;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.code-textarea:focus {
  outline: none;
  border-color: #66c0f4;
  box-shadow: 0 0 16px rgba(102, 192, 244, 0.2);
}

.help-sidebar {
  background: rgba(14, 20, 29, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.help-sidebar h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
}

.help-sub {
  margin: 0;
  font-size: 0.78rem;
  color: #8b9bb4;
  line-height: 1.35;
}

.placeholders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.placeholder-chip {
  background: rgba(8, 12, 18, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.placeholder-chip:hover {
  background: rgba(102, 192, 244, 0.12);
  border-color: #66c0f4;
  transform: translateX(2px);
}

.placeholder-chip code {
  color: #66c0f4;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: monospace;
}

.placeholder-chip span {
  font-size: 0.72rem;
  color: #a4b4cc;
}
</style>
