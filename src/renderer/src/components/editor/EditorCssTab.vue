<template>
  <div class="editor-column editor-css-tab">
    <div class="code-editor-header">
      <span class="editor-label">Styles CSS — {{ selectedTierName }}</span>
      <span class="editor-hint">{{ tierHint }}</span>
    </div>
    <textarea
      v-model="cssContent"
      class="code-textarea css-mode"
      spellcheck="false"
      placeholder=".achievement-card { ... }"
    ></textarea>
  </div>
</template>

<script setup>
const cssContent = defineModel({ type: String, default: '' })

defineProps({
  selectedTierName: {
    type: String,
    default: 'Standard'
  },
  tierHint: {
    type: String,
    default: 'Feuille de style principale du thème'
  }
})
</script>

<style scoped>
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
</style>
