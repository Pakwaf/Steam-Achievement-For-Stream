import { ref, onMounted, onUnmounted } from 'vue'
import { steamAPI } from '../services/steamApi.js'
import { themeStorage } from '../services/themeStorage.js'

/**
 * Composable réactif pour la gestion de la bibliothèque de thèmes (Studio),
 * les opérations CRUD, l'import/export et la sélection du thème actif.
 */
export function useThemeLibrary() {
  const currentView = ref('library') // 'library' | 'editor'
  const editingTheme = ref(null)
  const themeLibrary = ref({ activeThemeId: '', deletedThemeIds: [], themes: [] })
  const libraryStatusMessage = ref('')

  let unsubs = []

  function showLibraryStatus(msg) {
    libraryStatusMessage.value = msg
    setTimeout(() => {
      if (libraryStatusMessage.value === msg) {
        libraryStatusMessage.value = ''
      }
    }, 4000)
  }

  async function fetchThemeLibrary() {
    try {
      const lib = await steamAPI.getThemeLibrary()
      if (lib) {
        themeLibrary.value = lib
      }
    } catch (err) {
      console.error('[useThemeLibrary] Erreur chargement bibliothèque:', err)
    }
  }

  async function handleActivateTheme(themeId) {
    try {
      const res = await steamAPI.setActiveTheme(themeId)
      if (res.success) {
        themeLibrary.value = res.library
        showLibraryStatus(`Thème "${res.activeTheme?.name}" activé pour vos overlays ! ⚡`)
      }
    } catch (err) {
      console.error('[useThemeLibrary] Erreur activation thème:', err)
    }
  }

  function handleEditTheme(theme) {
    editingTheme.value = JSON.parse(JSON.stringify(theme))
    currentView.value = 'editor'
  }

  async function handleDuplicateTheme(themeId) {
    try {
      const res = await steamAPI.duplicateTheme(themeId)
      if (res.success) {
        themeLibrary.value = res.library
        showLibraryStatus(`Copie créée : "${res.duplicatedTheme?.name}" ✔`)
      }
    } catch (err) {
      console.error('[useThemeLibrary] Erreur duplication thème:', err)
    }
  }

  async function handleDeleteTheme(theme) {
    if (themeLibrary.value.themes.length <= 1) {
      alert('Impossible de supprimer le seul thème restant dans la bibliothèque.')
      return
    }

    const confirmMsg = `Êtes-vous sûr de vouloir supprimer définitivement le thème "${theme.name}" ?`
    if (!confirm(confirmMsg)) return

    try {
      const res = await steamAPI.deleteTheme(theme.id)
      if (res.success) {
        themeLibrary.value = res.library
        showLibraryStatus(`Thème "${theme.name}" supprimé ✔`)
      } else if (res.error) {
        alert(res.error)
      }
    } catch (err) {
      console.error('[useThemeLibrary] Erreur suppression thème:', err)
    }
  }

  async function handleRestoreDefaultThemes() {
    if (!confirm('Voulez-vous restaurer tous les thèmes officiels par défaut (Steam Gold, Cozy Pixel, Horror, Dark Fantasy, Frutiger Aero) ? Vos thèmes créés seront conservés.')) return

    try {
      const res = await steamAPI.restoreDefaultThemes()
      if (res.success) {
        themeLibrary.value = res.library
        showLibraryStatus('Thèmes officiels par défaut restaurés avec succès ✔')
      }
    } catch (err) {
      console.error('[useThemeLibrary] Erreur restauration thèmes:', err)
    }
  }

  async function handleThemeFileImport(file) {
    if (!file) return
    try {
      const text = await file.text()
      const res = await themeStorage.importTheme(text)
      if (res.success) {
        themeLibrary.value = res.library
        showLibraryStatus(`Thème "${res.importedTheme?.name}" importé avec succès ! 🎉`)
      } else {
        alert(res.error || 'Erreur lors de l\'importation du fichier')
      }
    } catch (err) {
      alert(`Erreur de lecture du fichier : ${err.message}`)
    }
  }

  async function handleExportTheme(themeId) {
    try {
      const res = await themeStorage.exportTheme(themeId)
      if (res.success) {
        showLibraryStatus(`Thème exporté dans ${res.fileName} 💾`)
      } else {
        showLibraryStatus(res.error || 'Erreur lors de l\'export')
      }
    } catch (err) {
      showLibraryStatus('Erreur export: ' + err.message)
    }
  }

  async function handleExportLibrary() {
    try {
      const res = await themeStorage.exportLibrary()
      if (res.success) {
        showLibraryStatus(`${res.count} thèmes sauvegardés dans ${res.fileName} 💾`)
      } else {
        showLibraryStatus(res.error || 'Erreur lors de la sauvegarde de la bibliothèque')
      }
    } catch (err) {
      showLibraryStatus('Erreur export: ' + err.message)
    }
  }

  async function handleCreateNewTheme() {
    try {
      const defaultName = `Nouveau Thème (${themeLibrary.value.themes.length + 1})`
      const res = await steamAPI.createTheme({ name: defaultName })
      if (res.success) {
        themeLibrary.value = res.library
        editingTheme.value = res.theme
        currentView.value = 'editor'
        showLibraryStatus(`Nouveau thème créé : "${res.theme.name}" !`)
      }
    } catch (err) {
      console.error('[useThemeLibrary] Erreur création thème:', err)
    }
  }

  function closeEditor() {
    currentView.value = 'library'
    editingTheme.value = null
    fetchThemeLibrary()
  }

  function onEditorThemeSaved(savedTheme) {
    if (savedTheme) {
      const idx = themeLibrary.value.themes.findIndex((t) => t.id === savedTheme.id)
      if (idx !== -1) {
        themeLibrary.value.themes[idx] = savedTheme
      }
    }
    fetchThemeLibrary()
  }

  onMounted(() => {
    fetchThemeLibrary()

    const unsubLib = steamAPI.onThemeLibraryUpdated((lib) => {
      if (lib) {
        themeLibrary.value = lib
      }
    })
    unsubs.push(unsubLib)
  })

  onUnmounted(() => {
    for (const unsub of unsubs) {
      if (typeof unsub === 'function') unsub()
    }
    unsubs = []
  })

  return {
    currentView,
    editingTheme,
    themeLibrary,
    libraryStatusMessage,
    showLibraryStatus,
    fetchThemeLibrary,
    handleActivateTheme,
    handleEditTheme,
    handleDuplicateTheme,
    handleDeleteTheme,
    handleRestoreDefaultThemes,
    handleThemeFileImport,
    handleExportTheme,
    handleExportLibrary,
    handleCreateNewTheme,
    closeEditor,
    onEditorThemeSaved
  }
}
