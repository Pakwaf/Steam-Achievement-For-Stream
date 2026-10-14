<template>
  <div class="library-section-card studio-theme-library">
    <!-- Input caché pour l'import de fichier thème .json -->
    <input
      ref="themeFileInput"
      type="file"
      accept=".json"
      style="display: none;"
      @change="onFileImport"
    />

    <!-- En-tête Studio -->
    <div class="library-header studio-header">
      <div class="library-title-group">
        <div class="library-icon-glow studio-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="lib-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" />
          </svg>
        </div>
        <div>
          <div class="title-with-pill">
            <h3>Studio & Galerie de Thèmes</h3>
            <span class="theme-count-pill">{{ filteredThemes.length }} / {{ themeLibrary.themes.length }}</span>
          </div>
          <p class="subtitle">Gérez vos overlays, exportez/importez vos créations et prévisualisez vos animations</p>
        </div>
      </div>

      <!-- Boutons d'actions principaux de la bibliothèque -->
      <div class="library-header-actions studio-actions">
        <span v-if="statusMessage" class="lib-status-toast">{{ statusMessage }}</span>
        <button class="btn-import-theme" title="Importer un thème depuis un fichier .json" @click="triggerImportClick">
          <span>📥 Importer</span>
        </button>
        <button class="btn-export-all" title="Exporter tous vos thèmes dans une sauvegarde JSON" @click="$emit('export-library')">
          <span>📤 Sauvegarder tout</span>
        </button>
        <button class="btn-restore-themes" title="Restaurer le thème officiel Steam Gold" @click="$emit('restore-default-themes')">
          <span class="restore-icon">↺</span>
          <span>Restaurer</span>
        </button>
        <button class="btn-create-theme" title="Créer un nouveau thème" @click="$emit('create-new-theme')">
          <span class="plus-icon">+</span>
          <span>Nouveau thème</span>
        </button>
      </div>
    </div>

    <!-- Barre d'outils et de filtres Studio -->
    <div class="studio-filter-toolbar">
      <div class="studio-search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="studio-search-input"
          placeholder="Rechercher un thème par nom..."
        />
        <button
          v-if="searchQuery"
          class="btn-clear-search"
          title="Effacer"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <div class="studio-filter-chips">
        <button
          class="filter-chip"
          :class="{ active: currentFilter === 'all' }"
          @click="currentFilter = 'all'"
        >
          Tous ({{ themeLibrary.themes.length }})
        </button>
        <button
          class="filter-chip"
          :class="{ active: currentFilter === 'active' }"
          @click="currentFilter = 'active'"
        >
          ★ Thème Actif
        </button>
        <button
          class="filter-chip"
          :class="{ active: currentFilter === 'fx' }"
          @click="currentFilter = 'fx'"
        >
          ✨ Avec Scintillement
        </button>
        <button
          class="filter-chip"
          :class="{ active: currentFilter === 'audio' }"
          @click="currentFilter = 'audio'"
        >
          🎵 Son Personnalisé
        </button>
      </div>
    </div>

    <!-- État si aucun thème ne correspond au filtre/recherche -->
    <div v-if="filteredThemes.length === 0" class="studio-empty-state">
      <div class="empty-icon">🎨</div>
      <h4>Aucun thème ne correspond à votre recherche</h4>
      <p>Essayez de modifier vos filtres ou créez un nouveau design en un clic.</p>
      <button class="btn-secondary" @click="searchQuery = ''; currentFilter = 'all'">
        Réinitialiser les filtres
      </button>
    </div>

    <!-- Grille de Cartes Studio Haut de Gamme -->
    <div v-else class="themes-grid studio-grid">
      <div
        v-for="thm in filteredThemes"
        :key="thm.id"
        class="theme-card studio-card"
        :class="{ 'is-active-theme': thm.id === themeLibrary.activeThemeId }"
      >
        <!-- En-tête de la carte : Statut Live & Badges visuels -->
        <div class="card-status-bar studio-card-header">
          <div v-if="thm.id === themeLibrary.activeThemeId" class="active-badge studio-active-badge">
            <span class="active-sparkle pulse">★</span>
            <span>EN LIVE</span>
          </div>
          <div v-else class="inactive-badge-pill">
            <span>Prêt</span>
          </div>

          <!-- Badges de caractéristiques -->
          <div class="card-badges-row">
            <span v-if="thm.visualEffect && thm.visualEffect !== 'none'" class="effect-badge-pill" :title="`Effet visuel : ${getEffectLabel(thm.visualEffect)}`">
              ✨ {{ getEffectLabel(thm.visualEffect) }}
            </span>
            <span v-if="thm.audioPath" class="audio-chip custom" title="Fichier audio personnalisé configuré">
              🎵 Son perso
            </span>
            <span v-else class="audio-chip default" title="Carillon sonore par défaut">
              🔔 Standard
            </span>
          </div>
        </div>

        <!-- Informations sur le thème -->
        <div class="card-main-info studio-info">
          <h4 class="theme-card-title">{{ thm.name }}</h4>
          <span class="theme-id-sub">{{ thm.id }}</span>
        </div>

        <!-- Rendu Visuel Réel dans un cadre Studio -->
        <div class="studio-preview-frame">
          <ThemeCardPreview :html="thm.html" :css="thm.css" />
        </div>

        <!-- Actions Studio sur la carte -->
        <div class="card-actions-toolbar studio-actions-bar">
          <!-- Bouton Activer -->
          <button
            class="btn-card-action btn-activate"
            :class="{ 'already-active': thm.id === themeLibrary.activeThemeId }"
            :disabled="thm.id === themeLibrary.activeThemeId"
            :title="thm.id === themeLibrary.activeThemeId ? 'Thème actuellement actif sur l\'overlay' : 'Activer pour l\'écran et OBS'"
            @click="$emit('activate-theme', thm.id)"
          >
            <span v-if="thm.id === themeLibrary.activeThemeId">✓ Actif</span>
            <span v-else>Activer</span>
          </button>

          <!-- Bouton Éditer -->
          <button
            class="btn-card-action btn-edit"
            title="Modifier le code HTML, CSS, effets et audio"
            @click="$emit('edit-theme', thm)"
          >
            <span>✏️ Éditer</span>
          </button>

          <!-- Bouton Exporter -->
          <button
            class="btn-card-action btn-export"
            title="Télécharger ce thème individuel (.json)"
            @click="$emit('export-theme', thm.id)"
          >
            <span>💾 Exporter</span>
          </button>

          <!-- Bouton Dupliquer -->
          <button
            class="btn-card-action btn-duplicate"
            title="Créer une copie exacte de ce thème"
            @click="$emit('duplicate-theme', thm.id)"
          >
            <span>📑 Dupliquer</span>
          </button>

          <!-- Bouton Supprimer -->
          <button
            class="btn-card-action btn-delete"
            :disabled="themeLibrary.themes.length <= 1"
            :title="themeLibrary.themes.length <= 1 ? 'Impossible de supprimer le seul thème restant' : 'Supprimer définitivement'"
            @click="$emit('delete-theme', thm)"
          >
            <span>🗑️</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ThemeCardPreview from '../ThemeCardPreview.vue'
import { VISUAL_EFFECTS } from '../../utils/visualEffects.js'

const props = defineProps({
  themeLibrary: {
    type: Object,
    required: true
  },
  statusMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'activate-theme',
  'edit-theme',
  'duplicate-theme',
  'delete-theme',
  'restore-default-themes',
  'export-theme',
  'export-library',
  'import-theme-file',
  'create-new-theme'
])

const themeFileInput = ref(null)
const searchQuery = ref('')
const currentFilter = ref('all') // 'all' | 'active' | 'fx' | 'audio'

const filteredThemes = computed(() => {
  let list = props.themeLibrary.themes || []
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter((t) => (t.name || '').toLowerCase().includes(q))
  }
  if (currentFilter.value === 'active') {
    list = list.filter((t) => t.id === props.themeLibrary.activeThemeId)
  } else if (currentFilter.value === 'fx') {
    list = list.filter((t) => t.visualEffect && t.visualEffect !== 'none')
  } else if (currentFilter.value === 'audio') {
    list = list.filter((t) => Boolean(t.audioPath))
  }
  return list
})

function getEffectLabel(effectId) {
  const found = VISUAL_EFFECTS.find((e) => e.id === effectId)
  return found ? found.name : 'Aucun'
}

function triggerImportClick() {
  if (themeFileInput.value) {
    themeFileInput.value.value = ''
    themeFileInput.value.click()
  }
}

function onFileImport(event) {
  const file = event?.target?.files?.[0]
  if (file) {
    emit('import-theme-file', file)
  }
}
</script>

<style scoped>
.library-section-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.library-title-group {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.library-icon-glow {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(102, 192, 244, 0.18) 0%, rgba(27, 40, 56, 0.8) 100%);
  border: 1px solid rgba(102, 192, 244, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #66c0f4;
  box-shadow: 0 0 20px rgba(102, 192, 244, 0.25);
  flex-shrink: 0;
}

.studio-glow {
  background: radial-gradient(circle, rgba(102, 192, 244, 0.3) 0%, transparent 70%);
}

.lib-icon {
  width: 26px;
  height: 26px;
}

.title-with-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.2rem;
}

.title-with-pill h3 {
  font-size: 1.35rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
  margin: 0;
}

.theme-count-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #66c0f4;
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.35);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--steam-text-muted);
  margin: 0;
}

.library-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.lib-status-toast {
  font-size: 0.8rem;
  color: #a1cd44;
  font-weight: 600;
  background: rgba(161, 205, 68, 0.12);
  border: 1px solid rgba(161, 205, 68, 0.4);
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

.btn-import-theme,
.btn-export-all {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c7d5e0;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-import-theme:hover,
.btn-export-all:hover {
  background: rgba(240, 195, 48, 0.12);
  border-color: rgba(240, 195, 48, 0.4);
  color: #f0c330;
  transform: translateY(-1px);
}

.btn-restore-themes {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #9cb0c9;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-restore-themes:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.restore-icon {
  font-size: 0.95rem;
}

.btn-create-theme {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  color: #0b0e14;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(240, 195, 48, 0.3);
  transition: var(--transition-smooth);
}

.btn-create-theme:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #ffd859 0%, #e6a722 100%);
  box-shadow: 0 6px 18px rgba(240, 195, 48, 0.5);
}

.plus-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.studio-filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
}

.studio-search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  width: 260px;
}

.studio-search-box:focus-within {
  border-color: #66c0f4;
  box-shadow: 0 0 10px rgba(102, 192, 244, 0.2);
}

.search-icon {
  font-size: 0.85rem;
  opacity: 0.7;
}

.studio-search-input {
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-size: 0.82rem;
  width: 100%;
}

.btn-clear-search {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0 2px;
}

.btn-clear-search:hover {
  color: #fff;
}

.studio-filter-chips {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9cb0c9;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.filter-chip.active {
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.45);
  color: #66c0f4;
}

.studio-empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.studio-empty-state h4 {
  color: #fff;
  font-size: 1.1rem;
  margin: 0 0 0.4rem 0;
}

.studio-empty-state p {
  color: #8b9bb4;
  font-size: 0.85rem;
  margin: 0 0 1.25rem 0;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--steam-text-main);
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.theme-card {
  background: rgba(15, 22, 31, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.theme-card:hover {
  transform: translateY(-3px);
  border-color: rgba(102, 192, 244, 0.3);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
}

.theme-card.is-active-theme {
  border-color: rgba(240, 195, 48, 0.5);
  background: linear-gradient(180deg, rgba(240, 195, 48, 0.05) 0%, rgba(15, 22, 31, 0.9) 100%);
  box-shadow: 0 0 25px rgba(240, 195, 48, 0.15);
}

.card-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, rgba(240, 195, 48, 0.2) 0%, rgba(216, 158, 27, 0.1) 100%);
  border: 1px solid rgba(240, 195, 48, 0.5);
  color: #ffd859;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.active-sparkle {
  color: #f0c330;
}

.inactive-badge-pill {
  font-size: 0.68rem;
  color: var(--steam-text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.card-badges-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.effect-badge-pill {
  font-size: 0.68rem;
  font-weight: 700;
  color: #ffd859;
  background: rgba(240, 195, 48, 0.12);
  border: 1px solid rgba(240, 195, 48, 0.35);
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.audio-chip {
  font-size: 0.66rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.audio-chip.custom {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #c084fc;
}

.audio-chip.default {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #8b9bb4;
}

.card-main-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.theme-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-id-sub {
  font-size: 0.7rem;
  color: #6c7d93;
  font-family: monospace;
}

.studio-preview-frame {
  height: 140px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-actions-toolbar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.btn-card-action {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #c5d4e8;
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-card-action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.btn-activate {
  background: rgba(102, 192, 244, 0.12);
  border-color: rgba(102, 192, 244, 0.35);
  color: #66c0f4;
  font-weight: 700;
}

.btn-activate:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.25);
}

.btn-activate.already-active {
  background: rgba(240, 195, 48, 0.15);
  border-color: rgba(240, 195, 48, 0.45);
  color: #ffd859;
  cursor: default;
}

.btn-delete:hover:not(:disabled) {
  background: rgba(235, 87, 87, 0.2);
  border-color: rgba(235, 87, 87, 0.4);
}
</style>
