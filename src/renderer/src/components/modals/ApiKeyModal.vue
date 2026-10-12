<template>
  <div v-if="isOpen" class="api-key-modal-overlay" @click.self="$emit('close')">
    <div class="api-key-modal-card">
      <div class="modal-card-header">
        <div class="modal-title-group">
          <span class="modal-key-icon">🔑</span>
          <h3>Configuration Clé Steam Web API</h3>
        </div>
        <button class="btn-close-modal" title="Fermer" @click="$emit('close')">✕</button>
      </div>

      <p class="modal-desc">
        Votre clé est enregistrée localement dans <code>%AppData%</code>. Elle permet de récupérer les icônes officielles et noms de succès.
      </p>

      <div class="apikey-input-section" style="margin-top: 1rem;">
        <label class="apikey-label">
          <span>Clé API Steam (32 caractères)</span>
        </label>
        <div class="key-input-wrapper">
          <input
            v-model="internalKey"
            type="text"
            class="key-text-input"
            placeholder="Ex : 4B8A92FD7E83C1A4B02E9104..."
            spellcheck="false"
          />
          <button class="btn-paste-key" title="Coller depuis le presse-papier" @click="pasteKey">
            📋 Coller
          </button>
        </div>
      </div>

      <div v-if="successMessage" class="success-banner" style="margin-top: 1rem;">
        <span>{{ successMessage }}</span>
      </div>

      <div class="modal-actions-footer">
        <button class="btn-secondary" @click="$emit('close')">Annuler</button>
        <button class="btn-save-modal-key" @click="handleSave">
          Enregistrer les modifications
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  apiKey: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'save'])

const internalKey = ref('')
const successMessage = ref('')

watch(
  () => props.apiKey,
  (val) => {
    internalKey.value = val || ''
  },
  { immediate: true }
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      internalKey.value = props.apiKey || ''
      successMessage.value = ''
    }
  }
)

async function pasteKey() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      internalKey.value = text.trim()
    }
  } catch (err) {
    console.warn('[ApiKeyModal] Impossible de lire le presse-papier:', err)
  }
}

function handleSave() {
  emit('save', internalKey.value.trim())
}
</script>

<style scoped>
.api-key-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem;
}

.api-key-modal-card {
  background: #171d25;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 2rem;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-key-icon {
  font-size: 1.4rem;
}

.modal-title-group h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.btn-close-modal {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  line-height: 1;
}

.btn-close-modal:hover {
  color: #fff;
}

.modal-desc {
  font-size: 0.84rem;
  color: #9cb0c9;
  line-height: 1.45;
  margin: 0;
}

.modal-desc code {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  color: #66c0f4;
}

.apikey-input-section {
  text-align: left;
}

.apikey-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #c5d4e8;
  margin-bottom: 0.5rem;
}

.key-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.key-text-input {
  flex: 1;
  background: rgba(15, 21, 29, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-family: monospace;
  font-size: 0.85rem;
}

.key-text-input:focus {
  outline: none;
  border-color: #66c0f4;
  box-shadow: 0 0 10px rgba(102, 192, 244, 0.2);
}

.btn-paste-key {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  color: #fff;
  padding: 0 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-paste-key:hover {
  background: rgba(255, 255, 255, 0.15);
}

.success-banner {
  background: rgba(92, 126, 16, 0.25);
  border: 1px solid rgba(161, 205, 68, 0.5);
  color: #c7eb74;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.modal-actions-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--steam-text-main);
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-save-modal-key {
  background: linear-gradient(135deg, #66c0f4 0%, #1999e3 100%);
  border: none;
  color: #fff;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(102, 192, 244, 0.3);
}

.btn-save-modal-key:hover {
  background: linear-gradient(135deg, #7ad0ff 0%, #20a7f5 100%);
}
</style>
