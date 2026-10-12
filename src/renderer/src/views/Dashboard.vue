<template>
  <div class="dashboard-page">
    <!-- Pop-up Overlay Toast de Succès (Notification animée dans le dashboard) -->
    <transition name="achievement-pop">
      <div v-if="activeNotification" class="achievement-toast" role="alert">
        <div class="toast-glow-border"></div>
        <div class="toast-content">
          <!-- Icône du succès -->
          <div class="toast-icon-wrapper">
            <img
              :src="activeNotification.icon || fallbackIcon"
              :alt="activeNotification.displayName"
              class="achievement-icon"
              @error="onIconError"
            />
            <div class="icon-shine"></div>
          </div>

          <!-- Textes du succès -->
          <div class="toast-details">
            <div class="toast-header-row">
              <span class="game-tag">{{ activeNotification.gameName || 'Steam' }}</span>
              <span class="unlocked-title">SUCCÈS DÉBLOQUÉ !</span>
              <button class="btn-dismiss-toast" title="Fermer" @click="dismissToast">✕</button>
            </div>
            <h4 class="achievement-title">{{ activeNotification.displayName }}</h4>
            <p class="achievement-desc">{{ activeNotification.description }}</p>
          </div>
        </div>
        <!-- Barre de progression automatique du toast (5 secondes) -->
        <div class="toast-progress-bar"></div>
      </div>
    </transition>

    <!-- Barre supérieure de navigation / En-tête -->
    <header class="app-header">
      <div class="brand">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" class="steam-logo">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15c-.55-.26-1-.8-1-1.5 0-.83.67-1.5 1.5-1.5.15 0 .29.02.43.07L13.5 9.5C13.2 9.07 13 8.56 13 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3c-.56 0-1.07-.2-1.5-.5l-2.57 2.57c.05.14.07.28.07.43 0 .7-.45 1.24-1 1.5v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z"/>
          </svg>
        </div>
        <div class="brand-text">
          <h1>Steam Custom Achievements</h1>
        </div>
      </div>
      <div class="header-status-group">
        <!-- Tracker status -->
        <div class="tracker-status-chip" :class="{ active: trackerStatus?.isTracking }">
          <span class="chip-dot"></span>
          <span v-if="trackerStatus?.activeGameName">En jeu : {{ trackerStatus.activeGameName }}</span>
          <span v-else>{{ trackerStatus?.isTracking ? 'En attente de jeu' : 'Inactif' }}</span>
        </div>
        <!-- Auth status -->
        <div class="system-status">
          <span class="status-dot" :class="{ online: currentUser, offline: !currentUser }"></span>
          <span class="status-label">{{ currentUser ? currentUser.personaName : 'Déconnecté' }}</span>
        </div>
        <!-- Bouton Paramètres Généraux (Audio global, Port OBS, Overlay) -->
        <button class="btn-header-settings" title="Paramètres généraux de l'application" @click="openGeneralSettingsModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-gear-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Paramètres</span>
        </button>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="main-content">
      <!-- Alerte si ouvert dans un navigateur standard au lieu de l'application -->
      <div v-if="!isElectron" class="browser-warning-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div class="warning-text">
          <strong>Application ouverte dans un navigateur web standard.</strong>
          <p>L'application principale tourne sur le bureau. La source OBS est disponible sur <code>http://localhost:8080/obs</code>.</p>
        </div>
      </div>

      <!-- Écran de chargement initial (restauration de la session locale en cours) -->
      <div v-if="isInitializing" class="session-loading-splash">
        <div class="splash-spinner"></div>
        <p class="splash-title">Chargement de votre session Steam...</p>
        <span class="splash-subtitle">Vérification de votre configuration locale</span>
      </div>

      <!-- État 1 : Utilisateur non connecté (Configuration Clé API puis Connexion) -->
      <section v-else-if="!currentUser" class="auth-section">
        <!-- ÉTAPE 1 : Configuration initiale de la Clé Steam Web API -->
        <div v-if="authStep === 'apikey'" class="auth-card apikey-setup-card">
          <div class="auth-steps-header">
            <span class="step-chip active">1. Clé API</span>
            <span class="step-separator">➔</span>
            <span class="step-chip">2. Connexion</span>
          </div>

          <div class="auth-icon-wrapper apikey-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="key-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>

          <h2>Clé Steam Web API</h2>
          <p class="auth-description">
            Nécessaire pour récupérer les visuels et informations officielles de vos succès.
          </p>

          <!-- Notification de transparence et de confidentialité sur le stockage local -->
          <div class="local-privacy-notice-box">
            <div class="privacy-notice-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shield-notice-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div class="privacy-notice-text">
              <h4>Stockage 100% Local & Sauvegarde Automatique</h4>
              <p>
                Pour vous éviter d'avoir à remettre votre clé ou vous reconnecter à chaque lancement, vos identifiants sont sauvegardés <strong>exclusivement en local sur votre ordinateur</strong> (dans <code>%AppData%</code>).
                Aucune donnée n'est envoyée à des tiers : tout reste privé et confidentiel sur votre PC.
              </p>
            </div>
          </div>

          <!-- Bloc portail Steam -->
          <div class="apikey-portal-box">
            <div class="portal-info">
              <p>Générez gratuitement votre clé sur le portail officiel de Steam. <em>(Indiquez le nom de domaine de votre choix, ex : <code>overlay-stream</code>)</em></p>
            </div>
            <button class="btn-open-steam-portal" @click="openSteamApiKeyPortal">
              <span>Obtenir ma clé</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="external-link-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </button>
          </div>

          <!-- Champ pour coller la clé -->
          <div class="apikey-input-section">
            <label class="apikey-label">
              <span>Collez votre clé API (32 caractères)</span>
            </label>
            <div class="key-input-wrapper">
              <input
                v-model="steamApiKey"
                type="text"
                class="key-text-input"
                placeholder="Ex : 4B8A92FD7E83C1A4B02E9104..."
                spellcheck="false"
              />
              <button class="btn-paste-key" title="Coller depuis le presse-papier" @click="pasteApiKey">
                📋 Coller
              </button>
            </div>
          </div>

          <div v-if="keySavedMessage" class="success-banner">
            <span>{{ keySavedMessage }}</span>
          </div>

          <!-- Actions de navigation -->
          <div class="apikey-actions-footer">
            <button
              class="btn-save-key-next"
              :disabled="isSavingKey"
              @click="handleSaveApiKey"
            >
              <span>{{ isSavingKey ? 'Enregistrement...' : 'Continuer' }}</span>
            </button>

            <button class="btn-skip-key-step" @click="skipApiKeySetup">
              Passer cette étape
            </button>
          </div>
        </div>

        <!-- ÉTAPE 2 : Connexion Steam OpenID -->
        <div v-else class="auth-card">
          <div class="auth-steps-header">
            <button class="btn-back-step" title="Modifier la clé API Steam" @click="goToApiKeyStep">
              ← Clé API
            </button>
            <span class="step-chip active">2. Connexion</span>
          </div>

          <div class="auth-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="shield-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>

          <h2>Connexion Steam</h2>
          <p class="auth-description">
            Connectez votre compte pour synchroniser vos succès en temps réel.
          </p>

          <div class="session-persistence-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mini-save-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Votre session restera enregistrée sur ce PC pour vos prochains lancements.</span>
          </div>

          <div v-if="errorMessage" class="error-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div class="button-wrapper">
            <button
              id="btn-steam-login"
              class="steam-login-button"
              :disabled="isLoading"
              @click="handleLogin"
            >
              <div v-if="isLoading" class="spinner"></div>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" class="btn-steam-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15c-.55-.26-1-.8-1-1.5 0-.83.67-1.5 1.5-1.5.15 0 .29.02.43.07L13.5 9.5C13.2 9.07 13 8.56 13 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3c-.56 0-1.07-.2-1.5-.5l-2.57 2.57c.05.14.07.28.07.43 0 .7-.45 1.24-1 1.5v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z"/>
              </svg>
              <span>{{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}</span>
            </button>
          </div>

          <div class="security-notice" title="Connexion officielle Steam OpenID 2.0. Aucun mot de passe requis.">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p>Authentification sécurisée via <strong>Steam OpenID</strong>.</p>
          </div>
        </div>
      </section>

      <!-- État 2 : Utilisateur connecté -->
      <section v-else class="dashboard-section">
        <!-- 1. Carte Profil Utilisateur -->
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar-container">
              <img
                :src="currentUser.avatar"
                :alt="currentUser.personaName"
                class="user-avatar"
                @error="onAvatarError"
              />
              <span class="avatar-status-ring"></span>
            </div>

            <div class="user-meta">
              <div class="name-row">
                <h2 class="user-name">{{ currentUser.personaName }}</h2>
                <span class="user-state-pill">{{ currentUser.onlineState || 'En ligne' }}</span>
              </div>
              <div class="steam-id-box">
                <span class="label">SteamID64 :</span>
                <code class="id-value">{{ currentUser.steamId }}</code>
                <button class="btn-copy" title="Copier le SteamID" @click="copySteamId">
                  {{ copied ? 'Copié !' : 'Copier' }}
                </button>
              </div>
            </div>

            <div class="profile-actions-inline">
              <button class="btn-secondary btn-manage-key" title="Gérer ou modifier la clé Steam API" @click="openApiKeyModal">
                🔑 Clé API
              </button>
              <button class="btn-secondary" title="Ouvrir le profil Steam" @click="openSteamProfile">
                Profil Steam
              </button>
              <button class="btn-danger" title="Se déconnecter" @click="handleLogout">
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Panneau de Double Affichage (Overlay Desktop & OBS) -->
        <div class="display-systems-card">
          <div class="display-systems-header">
            <div class="icon-title-group">
              <div class="display-icon-glow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="screen-icon">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <div>
                <h3>Systèmes d'Affichage</h3>
                <p class="subtitle">Overlay transparent pour le joueur et source navigateur pour OBS</p>
              </div>
            </div>
          </div>

          <div class="display-grid">
            <!-- Colonne 1 : Overlay Desktop Transparent -->
            <div class="display-item-box">
              <div class="display-item-header">
                <div class="display-item-title">
                  <span class="item-badge-pill in-game">En Jeu</span>
                  <h4>Overlay Écran</h4>
                </div>
                <span class="status-indicator-pill active">Actif</span>
              </div>
              <p class="item-desc">
                Affichage transparent direct sur votre écran de jeu, sans bloquer vos clics ni votre gameplay.
              </p>
            </div>

            <!-- Colonne 2 : Serveur Local OBS Studio -->
            <div class="display-item-box obs-box">
              <div class="display-item-header">
                <div class="display-item-title">
                  <span class="item-badge-pill obs">OBS Studio</span>
                  <h4>Source OBS</h4>
                </div>
                <div class="obs-header-controls">
                  <button class="btn-port-config" title="Changer le port (ex: si Streamer.bot utilise 8080)" @click="openPortModal">
                    ⚙️ Port {{ obsStatus?.port || 8080 }}
                  </button>
                  <span class="status-indicator-pill" :class="{ active: obsStatus?.isRunning }">
                    {{ obsStatus?.isRunning ? 'En ligne' : 'Démarrage...' }}
                  </span>
                </div>
              </div>

              <!-- Bannière alerte conflit de port (ex: Streamer.bot sur 8080) -->
              <div v-if="obsStatus?.hasPortConflict" class="obs-conflict-alert">
                <span class="conflict-alert-icon">⚡</span>
                <div class="conflict-alert-body">
                  <strong>Port {{ obsStatus?.preferredPort || 8080 }} déjà utilisé</strong> (ex: Streamer.bot).
                  <p>L'overlay a basculé automatiquement sur le port <strong>{{ obsStatus?.port }}</strong> sans perturber vos autres applications !</p>
                </div>
              </div>

              <p class="item-desc">
                Source Navigateur à intégrer dans OBS Studio pour diffuser les succès sur votre stream :
              </p>

              <!-- Lien Principal Localhost / 127.0.0.1 -->
              <div class="obs-url-container">
                <div class="url-kind-header">
                  <span class="url-type-tag">Local (Même PC)</span>
                  <span class="url-type-hint">OBS installé sur ce PC</span>
                </div>
                <div class="url-action-bar">
                  <code class="obs-url-text">{{ obsUrl }}</code>
                  <div class="obs-url-actions">
                    <button class="btn-copy-obs" @click="copyObsUrl">
                      {{ obsCopied ? 'Copié !' : 'Copier' }}
                    </button>
                    <button class="btn-test-obs" @click="openObsInBrowser" title="Tester dans le navigateur">
                      Ouvrir ↗
                    </button>
                  </div>
                </div>
              </div>

              <!-- Vrai Lien Réseau Local (LAN IP pour Dual-PC ou OBS distant) -->
              <div v-if="obsStatus?.obsUrlLan" class="obs-url-container lan-highlight">
                <div class="url-kind-header">
                  <span class="url-type-tag lan">Réseau Local (LAN / 2e PC)</span>
                  <span class="url-type-hint">Vrai lien pour OBS sur PC de stream dédié</span>
                </div>
                <div class="url-action-bar">
                  <code class="obs-url-text lan-text">{{ obsStatus.obsUrlLan }}</code>
                  <div class="obs-url-actions">
                    <button class="btn-copy-obs btn-copy-lan" @click="copyObsUrlLan">
                      {{ obsLanCopied ? 'Copié !' : 'Copier' }}
                    </button>
                    <button class="btn-test-obs" @click="openObsLanInBrowser" title="Tester le lien LAN">
                      Ouvrir ↗
                    </button>
                  </div>
                </div>
              </div>

              <div class="obs-alt-url" title="Alternative localhost">
                <span class="alt-label">Alternative :</span>
                <code class="alt-code" @click="copyObsUrlLocalhost" title="Cliquer pour copier">
                  {{ obsStatus?.obsUrlLocalhost || `http://localhost:${obsStatus?.port || 8080}/obs` }}
                </code>
                <span v-if="obsLocalhostCopied" class="copied-badge">Copié !</span>
              </div>

              <div class="obs-meta-stats">
                <span>Sources connectées : <strong :class="{ 'connected-count': (obsStatus?.connectedClients || 0) > 0 }">{{ obsStatus?.connectedClients || 0 }}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Bibliothèque de Thèmes & Éditeur Modulaire -->
        <div v-if="currentView === 'editor'" class="editor-view-wrapper">
          <CustomizationEditor
            :target-theme="editingTheme"
            :is-active-theme="editingTheme?.id === themeLibrary.activeThemeId"
            @back="closeEditor"
            @saved="onEditorThemeSaved"
            @activate="handleActivateTheme"
          />
        </div>

        <div v-else class="library-section-card studio-theme-library">
          <!-- Input caché pour l'import de fichier thème .json -->
          <input
            ref="themeFileInput"
            type="file"
            accept=".json"
            style="display: none;"
            @change="handleThemeFileImport"
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
              <span v-if="libraryStatusMessage" class="lib-status-toast">{{ libraryStatusMessage }}</span>
              <button class="btn-import-theme" title="Importer un thème depuis un fichier .json" @click="triggerImportClick">
                <span>📥 Importer</span>
              </button>
              <button class="btn-export-all" title="Exporter tous vos thèmes dans une sauvegarde JSON" @click="handleExportLibrary">
                <span>📤 Sauvegarder tout</span>
              </button>
              <button class="btn-restore-themes" title="Restaurer les thèmes officiels (Steam Gold, Cozy, Horror, Dark Fantasy, Frutiger Aero)" @click="handleRestoreDefaultThemes">
                <span class="restore-icon">↺</span>
                <span>Restaurer</span>
              </button>
              <button class="btn-create-theme" title="Créer un nouveau thème" @click="handleCreateNewTheme">
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
                v-model="themeSearchQuery"
                type="text"
                class="studio-search-input"
                placeholder="Rechercher un thème par nom..."
              />
              <button
                v-if="themeSearchQuery"
                class="btn-clear-search"
                title="Effacer"
                @click="themeSearchQuery = ''"
              >
                ✕
              </button>
            </div>

            <div class="studio-filter-chips">
              <button
                class="filter-chip"
                :class="{ active: themeFilter === 'all' }"
                @click="themeFilter = 'all'"
              >
                Tous ({{ themeLibrary.themes.length }})
              </button>
              <button
                class="filter-chip"
                :class="{ active: themeFilter === 'active' }"
                @click="themeFilter = 'active'"
              >
                ★ Thème Actif
              </button>
              <button
                class="filter-chip"
                :class="{ active: themeFilter === 'fx' }"
                @click="themeFilter = 'fx'"
              >
                ✨ Avec Scintillement
              </button>
              <button
                class="filter-chip"
                :class="{ active: themeFilter === 'audio' }"
                @click="themeFilter = 'audio'"
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
            <button class="btn-secondary" @click="themeSearchQuery = ''; themeFilter = 'all'">
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
                  @click="handleActivateTheme(thm.id)"
                >
                  <span v-if="thm.id === themeLibrary.activeThemeId">✓ Actif</span>
                  <span v-else>Activer</span>
                </button>

                <!-- Bouton Éditer -->
                <button
                  class="btn-card-action btn-edit"
                  title="Modifier le code HTML, CSS, effets et audio"
                  @click="handleEditTheme(thm)"
                >
                  <span>✏️ Éditer</span>
                </button>

                <!-- Bouton Exporter -->
                <button
                  class="btn-card-action btn-export"
                  title="Télécharger ce thème individuel (.json)"
                  @click="handleExportTheme(thm.id)"
                >
                  <span>💾 Exporter</span>
                </button>

                <!-- Bouton Dupliquer -->
                <button
                  class="btn-card-action btn-duplicate"
                  title="Créer une copie exacte de ce thème"
                  @click="handleDuplicateTheme(thm.id)"
                >
                  <span>📑 Dupliquer</span>
                </button>

                <!-- Bouton Supprimer -->
                <button
                  class="btn-card-action btn-delete"
                  :disabled="themeLibrary.themes.length <= 1"
                  :title="themeLibrary.themes.length <= 1 ? 'Impossible de supprimer le seul thème restant' : 'Supprimer définitivement'"
                  @click="handleDeleteTheme(thm)"
                >
                  <span>🗑️</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Panneau de Contrôle & Diagnostic du Tracker -->
        <div class="tracker-card">
          <div class="tracker-card-header">
            <div class="tracker-title-box">
              <div class="tracker-pulse-icon">
                <span class="pulse-ring"></span>
                <span class="pulse-center"></span>
              </div>
              <div>
                <h3>Détection des succès</h3>
                <p class="tracker-subtitle">Surveillance continue des succès Steam</p>
              </div>
            </div>
            <span class="badge-active-tracker">
              {{ trackerStatus?.isTracking ? '● Prêt' : '○ Inactif' }}
            </span>
          </div>

          <!-- Informations système détectées -->
          <div class="tracker-diagnostics">
            <div class="diag-item">
              <span class="diag-label">Dossier Steam :</span>
              <span class="diag-value" :title="trackerStatus?.steamPath">
                {{ trackerStatus?.steamPath || 'Recherche automatique...' }}
              </span>
            </div>
            <div class="diag-item">
              <span class="diag-label">Fichier surveillé :</span>
              <span class="diag-value" :title="trackerStatus?.watchedFiles?.join(', ')">
                {{ trackerStatus?.watchedFiles?.[0] ? getFilename(trackerStatus.watchedFiles[0]) : 'stats_log.txt' }}
              </span>
            </div>
            <div class="diag-item">
              <span class="diag-label">Clé Steam Web API :</span>
              <span class="diag-value" :class="{ 'api-ok': trackerStatus?.hasApiKey, 'api-warn': !trackerStatus?.hasApiKey }">
                {{ trackerStatus?.hasApiKey ? 'Configurée ✔' : 'Non configurée (fallback)' }}
              </span>
            </div>
          </div>

          <!-- Section de Test & Simulation par Tier -->
          <div class="simulation-section">
            <div class="simulation-header">
              <div class="sim-title-group">
                <h4>Tester les Niveaux de Rareté (Tiers Steam)</h4>
                <span class="sim-badge">3 Tiers Disponibles</span>
              </div>
              <p>Simulez chaque niveau de rareté pour valider l'affichage visuel, le badge, et la signature sonore sur votre écran et OBS :</p>
            </div>

            <div class="sim-tiers-grid">
              <!-- Tier 1 : Standard -->
              <div class="sim-tier-card common">
                <div class="sim-tier-badge">🏅 Standard (&gt; 10%)</div>
                <div class="sim-tier-name">Tête de classe</div>
                <div class="sim-tier-game">Team Fortress 2 (42.5%)</div>
                <button
                  class="btn-sim-action common"
                  :disabled="isSimulating"
                  @click="triggerDashboardTierTest('common')"
                >
                  ▶ Tester Standard
                </button>
              </div>

              <!-- Tier 2 : Rare -->
              <div class="sim-tier-card rare">
                <div class="sim-tier-badge">★ Rare (&lt; 10%)</div>
                <div class="sim-tier-name">Guerre frontale</div>
                <div class="sim-tier-game">Left 4 Dead 2 (4.8%)</div>
                <button
                  class="btn-sim-action rare"
                  :disabled="isSimulating"
                  @click="triggerDashboardTierTest('rare')"
                >
                  ▶ Tester Rare (&lt; 10%)
                </button>
              </div>

              <!-- Tier 3 : 100% Platine -->
              <div class="sim-tier-card master">
                <div class="sim-tier-badge">🏆 Jeu Complété (100%)</div>
                <div class="sim-tier-name">Maître Incontesté</div>
                <div class="sim-tier-game">100% Tous les succès</div>
                <button
                  class="btn-sim-action master"
                  :disabled="isSimulating"
                  @click="triggerDashboardTierTest('master')"
                >
                  ▶ Tester 100% Platine
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Historique des succès de la session -->
        <div class="history-card">
          <div class="history-header">
            <h3>Succès récents ({{ unlockedHistory.length }})</h3>
            <span v-if="unlockedHistory.length > 0" class="btn-clear-history" @click="unlockedHistory = []">
              Effacer
            </span>
          </div>

          <div v-if="unlockedHistory.length === 0" class="history-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-trophy">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.072 0a5.25 5.25 0 00-6.072 0m6.072 0c.937.606 1.572 1.637 1.603 2.825m-7.675-2.825c-.937.606-1.572 1.637-1.603 2.825M12 3v9m0 0l-3-3m3 3l3-3" />
            </svg>
            <p>En attente du premier succès...</p>
            <span class="empty-sub">Lancez un jeu Steam ou utilisez les boutons de test ci-dessus.</span>
          </div>

          <div v-else class="history-list">
            <div
              v-for="(item, idx) in unlockedHistory"
              :key="idx"
              class="history-item"
            >
              <img :src="item.icon || fallbackIcon" :alt="item.displayName" class="history-icon" @error="onIconError" />
              <div class="history-info">
                <div class="history-top">
                  <span class="history-game">{{ item.gameName }}</span>
                  <span class="history-time">{{ formatTime(item.unlockedAt) }}</span>
                </div>
                <div class="history-name">{{ item.displayName }}</div>
                <div class="history-desc">{{ item.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal de Consultation / Modification de la Clé Steam API -->
      <div v-if="showApiKeyModal" class="api-key-modal-overlay" @click.self="closeApiKeyModal">
        <div class="api-key-modal-card">
          <div class="modal-card-header">
            <div class="modal-title-group">
              <span class="modal-key-icon">🔑</span>
              <h3>Configuration Clé Steam Web API</h3>
            </div>
            <button class="btn-close-modal" title="Fermer" @click="closeApiKeyModal">✕</button>
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
                v-model="modalApiKey"
                type="text"
                class="key-text-input"
                placeholder="Ex : 4B8A92FD7E83C1A4B02E9104..."
                spellcheck="false"
              />
              <button class="btn-paste-key" title="Coller depuis le presse-papier" @click="pasteModalApiKey">
                📋 Coller
              </button>
            </div>
          </div>

          <div v-if="modalKeySuccess" class="success-banner" style="margin-top: 1rem;">
            <span>{{ modalKeySuccess }}</span>
          </div>

          <div class="modal-actions-footer">
            <button class="btn-secondary" @click="closeApiKeyModal">Annuler</button>
            <button class="btn-save-modal-key" @click="saveApiKeyFromModal">
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de Configuration du Port OBS (Conflit Streamer.bot etc.) -->
      <div v-if="showPortModal" class="api-key-modal-overlay" @click.self="closePortModal">
        <div class="api-key-modal-card">
          <div class="modal-card-header">
            <div class="modal-title-group">
              <span class="modal-key-icon">🔌</span>
              <h3>Configuration du Port Serveur OBS</h3>
            </div>
            <button class="btn-close-modal" title="Fermer" @click="closePortModal">✕</button>
          </div>

          <p class="modal-desc">
            Si une autre application comme <strong>Streamer.bot</strong> occupe le port 8080 sur votre PC, vous pouvez choisir un port dédié (ex: 8085, 8888). Le serveur basculera automatiquement et mettra à jour votre lien OBS sans redémarrer le PC.
          </p>

          <div class="apikey-input-section" style="margin-top: 1rem;">
            <label class="apikey-label">
              <span>Port souhaité (1024 - 65535)</span>
            </label>
            <div class="key-input-wrapper">
              <input
                v-model.number="modalPortValue"
                type="number"
                min="1024"
                max="65535"
                class="key-text-input"
                placeholder="Ex : 8085"
              />
              <button class="btn-paste-key" title="Sélectionner 8085" @click="modalPortValue = 8085">
                8085
              </button>
              <button class="btn-paste-key" title="Sélectionner 8888" @click="modalPortValue = 8888">
                8888
              </button>
            </div>
          </div>

          <div v-if="portModalMessage" class="success-banner" style="margin-top: 1rem;">
            <span>{{ portModalMessage }}</span>
          </div>

          <div class="modal-actions-footer">
            <button class="btn-secondary" @click="closePortModal">Annuler</button>
            <button class="btn-save-modal-key" :disabled="isSavingPort" @click="saveCustomPort">
              {{ isSavingPort ? 'Application...' : 'Appliquer & Enregistrer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Paramètres Généraux (Sortie audio globale, Port OBS, etc.) -->
      <div v-if="showGeneralSettingsModal" class="api-key-modal-overlay" @click.self="closeGeneralSettingsModal">
        <div class="api-key-modal-card general-settings-modal">
          <div class="modal-card-header">
            <div class="modal-title-group">
              <span class="modal-key-icon">⚙️</span>
              <div>
                <h3>Paramètres Généraux de l'Application</h3>
                <p class="modal-subtitle-text">Gérez la sortie audio globale Windows, les volumes et vos flux OBS</p>
              </div>
            </div>
            <button class="btn-close-modal" title="Fermer" @click="closeGeneralSettingsModal">✕</button>
          </div>

          <div class="general-settings-body">
            <!-- 1. Sortie audio globale Windows -->
            <div class="settings-block">
              <div class="block-header-row">
                <span class="block-icon">🎧</span>
                <div>
                  <h4 class="block-title">Sortie Audio Globale (Windows)</h4>
                  <p class="block-sub">Règle le périphérique de sortie audio par défaut pour toutes vos alertes (ex : Elgato Wave Link SFX, Casque, Enceintes)</p>
                </div>
              </div>

              <div class="settings-field-row">
                <select
                  v-model="globalAudioSettings.deviceId"
                  class="device-select-global"
                >
                  <option v-for="dev in audioDevicesList" :key="dev.deviceId" :value="dev.deviceId">
                    {{ dev.label }}
                  </option>
                </select>
                <button class="btn-test-global-audio" :disabled="isPlayingGlobalTest" @click="testGlobalAudioOutput">
                  {{ isPlayingGlobalTest ? '🔊 Lecture...' : '▶ Tester la sortie' }}
                </button>
              </div>
            </div>

            <!-- 2. Volume sonore global et statut -->
            <div class="settings-block">
              <div class="block-header-row">
                <span class="block-icon">🔊</span>
                <div>
                  <h4 class="block-title">Volume et Lecture Sonore Globale</h4>
                  <p class="block-sub">Contrôlez l'activation et le volume général de notification des succès</p>
                </div>
              </div>

              <div class="settings-volume-controls">
                <label class="toggle-switch">
                  <input v-model="globalAudioSettings.soundEnabled" type="checkbox" />
                  <span class="slider"></span>
                  <span class="toggle-text">{{ globalAudioSettings.soundEnabled ? 'Sons Activés' : 'Mode Muet' }}</span>
                </label>

                <div class="global-volume-slider-box">
                  <span class="volume-pct">{{ Math.round(globalAudioSettings.soundVolume * 100) }}%</span>
                  <input
                    v-model.number="globalAudioSettings.soundVolume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    class="range-slider"
                    :disabled="!globalAudioSettings.soundEnabled"
                  />
                </div>
              </div>
            </div>

            <!-- 3. Port OBS et Réseau -->
            <div class="settings-block">
              <div class="block-header-row">
                <span class="block-icon">🔌</span>
                <div>
                  <h4 class="block-title">Port du Serveur Local OBS</h4>
                  <p class="block-sub">Port utilisé pour la source navigateur OBS (par défaut 8080, bascule automatique si Streamer.bot est actif)</p>
                </div>
              </div>

              <div class="settings-field-row">
                <input
                  v-model.number="modalPortValue"
                  type="number"
                  min="1024"
                  max="65535"
                  class="key-text-input port-input"
                  placeholder="8080"
                />
                <span class="port-status-badge" :class="{ conflict: obsStatus?.hasPortConflict }">
                  Port actif : {{ obsStatus?.port || 8080 }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="generalSettingsMessage" class="success-banner">
            <span>{{ generalSettingsMessage }}</span>
          </div>

          <div class="modal-actions-footer">
            <button class="btn-secondary" @click="closeGeneralSettingsModal">Fermer</button>
            <button class="btn-save-modal-key" @click="saveGeneralSettings">
              Enregistrer les Paramètres
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CustomizationEditor from '../components/CustomizationEditor.vue'
import ThemeCardPreview from '../components/ThemeCardPreview.vue'
import {
  playAchievementSound,
  playSynthesizedChime,
  getAudioOutputDevices,
  getGlobalAudioSettings,
  setGlobalAudioSettings
} from '../utils/soundPlayer.js'
import { themeStorage } from '../services/themeStorage.js'
import { VISUAL_EFFECTS, ACHIEVEMENT_TIERS } from '../utils/visualEffects.js'

const isInitializing = ref(true)
const currentUser = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)
const copied = ref(false)
const obsCopied = ref(false)
const obsLanCopied = ref(false)
const obsLocalhostCopied = ref(false)
const isElectron = ref(typeof window !== 'undefined' && !!window.steamAPI)

// Authentification et configuration Clé Steam API
const authStep = ref('apikey') // 'apikey' | 'login'
const steamApiKey = ref('')
const isSavingKey = ref(false)
const keySavedMessage = ref('')
const showApiKeyModal = ref(false)
const modalApiKey = ref('')
const modalKeySuccess = ref('')

// Configuration Port OBS & Préférences
const showPortModal = ref(false)
const modalPortValue = ref(8080)
const portModalMessage = ref('')
const isSavingPort = ref(false)
const appSettings = ref({
  obsPort: 8080,
  soundEnabled: true,
  soundVolume: 0.8,
  desktopOverlayEnabled: true
})

// État du tracker, de l'OBS et des succès
const trackerStatus = ref(null)
const obsStatus = ref({
  isRunning: true,
  port: 8080,
  preferredPort: 8080,
  hasPortConflict: false,
  connectedClients: 0,
  obsUrl: 'http://127.0.0.1:8080/obs',
  obsUrlLocalhost: 'http://localhost:8080/obs',
  obsUrlLan: null
})
const obsUrl = ref('http://127.0.0.1:8080/obs')
const activeNotification = ref(null)
const unlockedHistory = ref([])
const isSimulating = ref(false)
let toastTimer = null
let obsPollInterval = null

// Paramètres généraux et Audio global
const showGeneralSettingsModal = ref(false)
const generalSettingsMessage = ref('')
const isPlayingGlobalTest = ref(false)
const audioDevicesList = ref([{ deviceId: 'default', label: 'Périphérique Windows par défaut' }])
const globalAudioSettings = ref(getGlobalAudioSettings())

// État de la Bibliothèque de Thèmes (Phase 5 & Studio)
const currentView = ref('library') // 'library' | 'editor'
const editingTheme = ref(null)
const themeLibrary = ref({ activeThemeId: '', deletedThemeIds: [], themes: [] })
const libraryStatusMessage = ref('')
const themeSearchQuery = ref('')
const themeFilter = ref('all') // 'all' | 'active' | 'fx' | 'audio'
const themeFileInput = ref(null)

const filteredThemes = computed(() => {
  let list = themeLibrary.value.themes || []
  if (themeSearchQuery.value && themeSearchQuery.value.trim()) {
    const q = themeSearchQuery.value.toLowerCase().trim()
    list = list.filter((t) => (t.name || '').toLowerCase().includes(q))
  }
  if (themeFilter.value === 'active') {
    list = list.filter((t) => t.id === themeLibrary.value.activeThemeId)
  } else if (themeFilter.value === 'fx') {
    list = list.filter((t) => t.visualEffect && t.visualEffect !== 'none')
  } else if (themeFilter.value === 'audio') {
    list = list.filter((t) => Boolean(t.audioPath))
  }
  return list
})

function getEffectLabel(effectId) {
  const found = VISUAL_EFFECTS.find((e) => e.id === effectId)
  return found ? found.name : 'Aucun'
}

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

// Initialisation au montage
onMounted(async () => {
  isElectron.value = typeof window !== 'undefined' && !!window.steamAPI
  if (window.steamAPI) {
    try {
      // 0. Récupération parallèle instantanée de la clé Steam API et de l'utilisateur sauvegardé
      const [keyRes, userRes] = await Promise.all([
        window.steamAPI.getSteamApiKey ? window.steamAPI.getSteamApiKey().catch(() => ({ apiKey: '' })) : Promise.resolve({ apiKey: '' }),
        window.steamAPI.getCurrentUser ? window.steamAPI.getCurrentUser().catch(() => null) : Promise.resolve(null)
      ])

      // Restauration de la clé API
      let rawKey = typeof keyRes === 'string' ? keyRes : (keyRes?.apiKey || '')
      if (!rawKey && typeof localStorage !== 'undefined') {
        rawKey = localStorage.getItem('steam_api_key') || ''
      }
      const trimmedKey = (rawKey || '').trim()
      if (trimmedKey && trimmedKey.length >= 8) {
        steamApiKey.value = trimmedKey
        authStep.value = 'login'
      } else {
        steamApiKey.value = ''
        authStep.value = 'apikey'
      }

      // Restauration de l'utilisateur connecté
      let user = userRes
      if (!user && typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('steam_user')
          if (stored) user = JSON.parse(stored)
        } catch {
          // ignore
        }
      }
      if (user) {
        currentUser.value = user
      }

      // Statut du tracker de log
      const status = await window.steamAPI.getTrackerStatus()
      trackerStatus.value = status

      // Statut initial du serveur OBS
      if (window.steamAPI.getObsStatus) {
        const obs = await window.steamAPI.getObsStatus()
        if (obs) {
          obsStatus.value = obs
          if (obs.obsUrl) obsUrl.value = obs.obsUrl
        }
      }

      // Chargement des paramètres d'application (port préféré, etc.)
      if (window.steamAPI.getAppSettings) {
        try {
          const s = await window.steamAPI.getAppSettings()
          if (s) {
            appSettings.value = { ...appSettings.value, ...s }
            modalPortValue.value = s.obsPort || 8080
          }
        } catch (e) {
          console.warn('[Dashboard] Erreur chargement settings:', e)
        }
      }

      // Chargement de la bibliothèque de thèmes modulaires
      await fetchThemeLibrary()
    } catch (err) {
      console.error('Erreur initialisation dashboard:', err)
    } finally {
      isInitializing.value = false
    }

    // Écoute des mises à jour d'authentification
    if (window.steamAPI.onAuthStatusChanged) {
      window.steamAPI.onAuthStatusChanged((user) => {
        currentUser.value = user
      })
    }

    // Écoute des modifications de la bibliothèque de thèmes en temps réel
    if (window.steamAPI.onThemeLibraryUpdated) {
      window.steamAPI.onThemeLibraryUpdated((lib) => {
        if (lib) {
          themeLibrary.value = lib
        }
      })
    }

    // Écoute des succès débloqués en temps réel (réels)
    window.steamAPI.onAchievementUnlocked(async (achievement) => {
      // Les notifications de test ne doivent s'afficher que sur OBS et sur l'Écran (Desktop Overlay)
      if (achievement?.isTest) return

      triggerAchievementToast(achievement)
      try {
        let theme = null
        if (achievement.previewTheme) {
          theme = achievement.previewTheme
        } else if (window.steamAPI?.getActiveTheme) {
          theme = await window.steamAPI.getActiveTheme()
        } else if (window.steamAPI?.getCustomization) {
          theme = await window.steamAPI.getCustomization()
        }
        await playAchievementSound(theme || {})
      } catch (err) {
        console.warn('[Dashboard] Erreur lecture audio succès:', err)
      }
    })

    // Écoute en temps réel des connexions/déconnexions de sources OBS
    if (window.steamAPI.onObsStatusChanged) {
      window.steamAPI.onObsStatusChanged((obs) => {
        if (obs) {
          obsStatus.value = obs
          if (obs.obsUrl) obsUrl.value = obs.obsUrl
        }
      })
    }

    // Polling de secours toutes les 2.5 secondes pour synchronisation instantanée (OBS + Tracker jeu)
    obsPollInterval = setInterval(async () => {
      if (window.steamAPI?.getObsStatus) {
        try {
          const obs = await window.steamAPI.getObsStatus()
          if (obs) obsStatus.value = obs
        } catch {
          // ignore
        }
      }

      if (window.steamAPI?.getTrackerStatus) {
        try {
          const st = await window.steamAPI.getTrackerStatus()
          if (st) trackerStatus.value = st
        } catch {
          // ignore
        }
      }
    }, 2500)
  }
})

// Récupération de la bibliothèque complète
async function fetchThemeLibrary() {
  if (window.steamAPI?.getThemeLibrary) {
    try {
      const lib = await window.steamAPI.getThemeLibrary()
      if (lib) {
        themeLibrary.value = lib
      }
    } catch (err) {
      console.error('Erreur chargement bibliothèque de thèmes:', err)
    }
  }
}

// Active un thème pour les overlays
async function handleActivateTheme(themeId) {
  if (!window.steamAPI?.setActiveTheme) return
  try {
    const res = await window.steamAPI.setActiveTheme(themeId)
    if (res.success) {
      themeLibrary.value = res.library
      showLibraryStatus(`Thème "${res.activeTheme?.name}" activé pour vos overlays ! ⚡`)
    }
  } catch (err) {
    console.error('Erreur activation thème:', err)
  }
}

// Ouvre l'éditeur pour ce thème précis
function handleEditTheme(theme) {
  editingTheme.value = JSON.parse(JSON.stringify(theme))
  currentView.value = 'editor'
}

// Crée une copie exacte d'un thème
async function handleDuplicateTheme(themeId) {
  if (!window.steamAPI?.duplicateTheme) return
  try {
    const res = await window.steamAPI.duplicateTheme(themeId)
    if (res.success) {
      themeLibrary.value = res.library
      showLibraryStatus(`Copie créée : "${res.duplicatedTheme?.name}" ✔`)
    }
  } catch (err) {
    console.error('Erreur duplication thème:', err)
  }
}

// Supprime un thème avec confirmation
async function handleDeleteTheme(theme) {
  if (themeLibrary.value.themes.length <= 1) {
    alert('Impossible de supprimer le seul thème restant dans la bibliothèque.')
    return
  }

  const confirmMsg = `Êtes-vous sûr de vouloir supprimer définitivement le thème "${theme.name}" ?`
  if (!confirm(confirmMsg)) return

  if (!window.steamAPI?.deleteTheme) return
  try {
    const res = await window.steamAPI.deleteTheme(theme.id)
    if (res.success) {
      themeLibrary.value = res.library
      showLibraryStatus(`Thème "${theme.name}" supprimé ✔`)
    } else if (res.error) {
      alert(res.error)
    }
  } catch (err) {
    console.error('Erreur suppression thème:', err)
  }
}

// Restaure tous les thèmes officiels par défaut (Steam Gold, Cozy, Horror, Dark Fantasy, Frutiger Aero)
async function handleRestoreDefaultThemes() {
  if (!confirm('Voulez-vous restaurer tous les thèmes officiels par défaut (Steam Gold, Cozy Pixel, Horror, Dark Fantasy, Frutiger Aero) ? Vos thèmes créés seront conservés.')) return

  try {
    if (window.steamAPI?.restoreDefaultThemes) {
      const res = await window.steamAPI.restoreDefaultThemes()
      if (res.success) {
        themeLibrary.value = res.library
        showLibraryStatus('Thèmes officiels par défaut restaurés avec succès ✔')
      }
    }
  } catch (err) {
    console.error('Erreur restauration thèmes:', err)
  }
}

// -------------------------------------------------------------
// SYSTÈME SIMPLE D'IMPORT / EXPORT DE THÈMES (UNIS OU BIBLIOTHÈQUE)
// -------------------------------------------------------------

function triggerImportClick() {
  if (themeFileInput.value) {
    themeFileInput.value.value = ''
    themeFileInput.value.click()
  }
}

async function handleThemeFileImport(event) {
  const file = event?.target?.files?.[0]
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

// -------------------------------------------------------------
// PARAMÈTRES GÉNÉRAUX & SORTIE AUDIO GLOBALE (WINDOWS)
// -------------------------------------------------------------

async function openGeneralSettingsModal() {
  showGeneralSettingsModal.value = true
  generalSettingsMessage.value = ''
  await refreshGlobalAudioDevices()
}

function closeGeneralSettingsModal() {
  showGeneralSettingsModal.value = false
  generalSettingsMessage.value = ''
}

async function refreshGlobalAudioDevices() {
  try {
    const devs = await getAudioOutputDevices(true)
    if (devs && devs.length > 0) {
      audioDevicesList.value = devs
    }
  } catch (err) {
    console.warn('[Dashboard] refreshGlobalAudioDevices error:', err)
  }
}

async function testGlobalAudioOutput() {
  if (isPlayingGlobalTest.value) return
  isPlayingGlobalTest.value = true
  try {
    await playSynthesizedChime(
      globalAudioSettings.value.soundVolume,
      globalAudioSettings.value.deviceId,
      'common'
    )
  } catch (err) {
    console.error('[Dashboard] Erreur test audio global:', err)
  } finally {
    setTimeout(() => {
      isPlayingGlobalTest.value = false
    }, 850)
  }
}

async function saveGeneralSettings() {
  try {
    // 1. Mise à jour de la configuration globale locale
    setGlobalAudioSettings({
      deviceId: globalAudioSettings.value.deviceId,
      soundEnabled: globalAudioSettings.value.soundEnabled,
      soundVolume: globalAudioSettings.value.soundVolume
    })

    // 2. Persistance dans le backend AppSettings
    const newSettings = {
      obsPort: modalPortValue.value || 8080,
      soundEnabled: globalAudioSettings.value.soundEnabled,
      soundVolume: globalAudioSettings.value.soundVolume,
      audioDeviceId: globalAudioSettings.value.deviceId,
      desktopOverlayEnabled: appSettings.value.desktopOverlayEnabled ?? true
    }

    if (window.steamAPI?.saveAppSettings) {
      await window.steamAPI.saveAppSettings(newSettings)
    }

    generalSettingsMessage.value = 'Paramètres généraux enregistrés ✔'
    setTimeout(() => {
      closeGeneralSettingsModal()
    }, 1100)
  } catch (err) {
    generalSettingsMessage.value = `Erreur : ${err.message}`
  }
}

// -------------------------------------------------------------
// SIMULATION ET TESTS DES 3 TIERS STEAM (COMMON, RARE, PLATINE)
// -------------------------------------------------------------

async function triggerDashboardTierTest(tier = 'common') {
  if (isSimulating.value) return
  isSimulating.value = true

  const meta = ACHIEVEMENT_TIERS[tier] || ACHIEVEMENT_TIERS.common

  // 1. Jouer immédiatement le son avec la tonalité / carillon du Tier dans l'app
  let activeThm = null
  if (window.steamAPI?.getActiveTheme) {
    activeThm = await window.steamAPI.getActiveTheme().catch(() => null)
  }
  playAchievementSound(activeThm || {}, tier)

  // 2. Diffuser l'alerte de test complète vers DesktopOverlay et OBS
  try {
    if (window.steamAPI?.broadcastTestAchievement) {
      await window.steamAPI.broadcastTestAchievement({
        appId: tier === 'rare' ? '550' : (tier === 'master' ? '1794680' : '440'),
        achievementCode: tier === 'rare' ? 'ACH_FINISH_CAMPAIGN_MELEE_ONLY' : (tier === 'master' ? '100_PERCENT_MASTER' : 'TF_PLAY_GAME_EVERYCLASS'),
        displayName: meta.defaultTitle,
        description: meta.defaultDesc,
        gameName: meta.defaultGame,
        icon: meta.icon,
        tier: tier,
        rarityPercent: meta.defaultPercent,
        isTest: false // Déclenche également le toast de prévisualisation dans le dashboard
      })
      showLibraryStatus(`Simulation de test "${meta.name}" diffusée ! 🚀`)
    }
  } catch (err) {
    console.error('[Dashboard] Erreur simulation tier:', err)
  } finally {
    setTimeout(() => {
      isSimulating.value = false
    }, 1200)
  }
}

// Crée un nouveau thème et ouvre l'éditeur
async function handleCreateNewTheme() {
  if (!window.steamAPI?.createTheme) return
  try {
    const defaultName = `Nouveau Thème (${themeLibrary.value.themes.length + 1})`
    const res = await window.steamAPI.createTheme({ name: defaultName })
    if (res.success) {
      themeLibrary.value = res.library
      editingTheme.value = res.theme
      currentView.value = 'editor'
      showLibraryStatus(`Nouveau thème créé : "${res.theme.name}" !`)
    }
  } catch (err) {
    console.error('Erreur création thème:', err)
  }
}

// Retour à la vue bibliothèque
function closeEditor() {
  currentView.value = 'library'
  editingTheme.value = null
  fetchThemeLibrary()
}

// Réception de l'enregistrement depuis l'éditeur
function onEditorThemeSaved(savedTheme) {
  if (savedTheme) {
    const idx = themeLibrary.value.themes.findIndex((t) => t.id === savedTheme.id)
    if (idx !== -1) {
      themeLibrary.value.themes[idx] = savedTheme
    }
  }
  fetchThemeLibrary()
}

function showLibraryStatus(msg) {
  libraryStatusMessage.value = msg
  setTimeout(() => {
    if (libraryStatusMessage.value === msg) libraryStatusMessage.value = ''
  }, 4000)
}

onUnmounted(() => {
  if (obsPollInterval) clearInterval(obsPollInterval)
  if (toastTimer) clearTimeout(toastTimer)
})

// Déclenche l'affichage du toast de notification de preview dans le dashboard
function triggerAchievementToast(achievement) {
  activeNotification.value = achievement
  unlockedHistory.value.unshift(achievement)

  // Annule le timer précédent si un succès arrive à la suite
  if (toastTimer) clearTimeout(toastTimer)

  // Disparition automatique après 5 secondes
  toastTimer = setTimeout(() => {
    activeNotification.value = null
  }, 5000)
}

function dismissToast() {
  if (toastTimer) clearTimeout(toastTimer)
  activeNotification.value = null
}

// Déclenche une simulation via le pont IPC
async function simulateAchievement(appId, achievementCode) {
  if (!window.steamAPI || isSimulating.value) return
  isSimulating.value = true
  try {
    await window.steamAPI.simulateAchievement({ appId, achievementCode })
  } catch (err) {
    console.error('Erreur simulation:', err)
  } finally {
    isSimulating.value = false
  }
}

// Configuration et gestion de la clé Steam API
function openSteamApiKeyPortal() {
  const portalUrl = 'https://steamcommunity.com/dev/apikey'
  if (window.steamAPI?.openExternal) {
    window.steamAPI.openExternal(portalUrl)
  } else {
    window.open(portalUrl, '_blank')
  }
}

async function pasteApiKey() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      steamApiKey.value = text.trim()
    }
  } catch (err) {
    console.warn('[Dashboard] Impossible de lire le presse-papier:', err)
  }
}

async function handleSaveApiKey() {
  if (isSavingKey.value) return
  isSavingKey.value = true
  try {
    const keyToSave = typeof steamApiKey.value === 'string' ? steamApiKey.value.trim() : ''
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('steam_api_key', keyToSave)
    }
    if (window.steamAPI?.saveSteamApiKey) {
      await window.steamAPI.saveSteamApiKey(keyToSave)
    }
    keySavedMessage.value = 'Clé API enregistrée avec succès ! Redirection...'
    setTimeout(() => {
      keySavedMessage.value = ''
      authStep.value = 'login'
    }, 750)
  } catch (err) {
    console.error('[Dashboard] Erreur enregistrement clé Steam API:', err)
  } finally {
    isSavingKey.value = false
  }
}

function skipApiKeySetup() {
  authStep.value = 'login'
}

function goToApiKeyStep() {
  authStep.value = 'apikey'
}

// Connexion Steam
async function handleLogin() {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = null

  try {
    if (!window.steamAPI) {
      throw new Error("L'API Steam n'est pas disponible dans un navigateur standard. Veuillez utiliser la fenêtre de l'application de bureau.")
    }

    const result = await window.steamAPI.login()
    if (result.success) {
      currentUser.value = result.user
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('steam_user', JSON.stringify(result.user))
      }
    } else {
      errorMessage.value = result.error || 'Connexion échouée.'
    }
  } catch (err) {
    errorMessage.value = err.message || 'Une erreur inattendue est survenue.'
  } finally {
    isLoading.value = false
  }
}

// Déconnexion
async function handleLogout() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('steam_user')
    }
    if (window.steamAPI) {
      await window.steamAPI.logout()
    }
    currentUser.value = null
    errorMessage.value = null
    authStep.value = steamApiKey.value ? 'login' : 'apikey'
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }
}

// Gestion de la Clé API depuis le modal
function openApiKeyModal() {
  modalApiKey.value = steamApiKey.value || ''
  modalKeySuccess.value = ''
  showApiKeyModal.value = true
}

function closeApiKeyModal() {
  showApiKeyModal.value = false
}

async function pasteModalApiKey() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      modalApiKey.value = text.trim()
    }
  } catch (err) {
    console.warn('[Dashboard] Impossible de lire le presse-papier:', err)
  }
}

async function saveApiKeyFromModal() {
  const clean = (modalApiKey.value || '').trim()
  steamApiKey.value = clean
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('steam_api_key', clean)
  }
  if (window.steamAPI?.saveSteamApiKey) {
    await window.steamAPI.saveSteamApiKey(clean)
  }
  modalKeySuccess.value = 'Clé API enregistrée avec succès dans votre configuration locale !'
  setTimeout(() => {
    modalKeySuccess.value = ''
    showApiKeyModal.value = false
  }, 1000)
}

function openSteamProfile() {
  if (currentUser.value?.profileUrl && window.steamAPI) {
    window.steamAPI.openExternal(currentUser.value.profileUrl)
  }
}

function copySteamId() {
  if (currentUser.value?.steamId) {
    navigator.clipboard.writeText(currentUser.value.steamId)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function copyObsUrl() {
  navigator.clipboard.writeText(obsUrl.value)
  obsCopied.value = true
  setTimeout(() => {
    obsCopied.value = false
  }, 2000)
}

function copyObsUrlLocalhost() {
  const localUrl = obsStatus.value?.obsUrlLocalhost || `http://localhost:${obsStatus.value?.port || 8080}/obs`
  navigator.clipboard.writeText(localUrl)
  obsLocalhostCopied.value = true
  setTimeout(() => {
    obsLocalhostCopied.value = false
  }, 2000)
}

function copyObsUrlLan() {
  if (obsStatus.value?.obsUrlLan) {
    navigator.clipboard.writeText(obsStatus.value.obsUrlLan)
    obsLanCopied.value = true
    setTimeout(() => {
      obsLanCopied.value = false
    }, 2000)
  }
}

function openObsLanInBrowser() {
  if (obsStatus.value?.obsUrlLan) {
    if (window.steamAPI?.openExternal) {
      window.steamAPI.openExternal(obsStatus.value.obsUrlLan)
    } else {
      window.open(obsStatus.value.obsUrlLan, '_blank')
    }
  }
}

function openPortModal() {
  modalPortValue.value = obsStatus.value?.preferredPort || obsStatus.value?.port || 8080
  portModalMessage.value = ''
  showPortModal.value = true
}

function closePortModal() {
  showPortModal.value = false
  portModalMessage.value = ''
}

async function saveCustomPort() {
  const p = Number(modalPortValue.value)
  if (!p || p < 1024 || p > 65535) {
    alert('Veuillez entrer un numéro de port valide entre 1024 et 65535.')
    return
  }

  isSavingPort.value = true
  try {
    if (window.steamAPI?.setObsPort) {
      const updatedStatus = await window.steamAPI.setObsPort(p)
      if (updatedStatus) {
        obsStatus.value = updatedStatus
        if (updatedStatus.obsUrl) obsUrl.value = updatedStatus.obsUrl
      }
    }
    appSettings.value.obsPort = p
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_settings', JSON.stringify(appSettings.value))
    }
    portModalMessage.value = `Port mis à jour sur ${p} avec succès !`
    setTimeout(() => {
      closePortModal()
    }, 1200)
  } catch (err) {
    console.error('Erreur setObsPort:', err)
    alert('Erreur lors du changement de port: ' + err)
  } finally {
    isSavingPort.value = false
  }
}

function openObsInBrowser() {
  if (window.steamAPI?.openExternal) {
    window.steamAPI.openExternal(obsUrl.value)
  } else {
    window.open(obsUrl.value, '_blank')
  }
}

function getFilename(fullPath) {
  if (!fullPath) return ''
  return fullPath.split(/\\|\//).pop()
}

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function onAvatarError(e) {
  e.target.src = fallbackIcon
}

function onIconError(e) {
  e.target.src = fallbackIcon
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

/* ========================================================
   TOAST NOTIFICATION (PREVIEW DANS DASHBOARD)
   ======================================================== */
.achievement-toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  width: 440px;
  background: rgba(18, 26, 38, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 14px;
  border: 1px solid rgba(240, 195, 48, 0.5);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 25px rgba(240, 195, 48, 0.25);
  overflow: hidden;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
}

.toast-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #f0c330;
  box-shadow: 0 0 14px rgba(240, 195, 48, 0.4);
}

.achievement-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #0b0e14;
}

.toast-details {
  flex: 1;
  min-width: 0;
}

.toast-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.game-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #66c0f4;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.unlocked-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #f0c330;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(240, 195, 48, 0.4);
}

.btn-dismiss-toast {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.btn-dismiss-toast:hover {
  color: #fff;
}

.achievement-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.achievement-desc {
  font-size: 0.8rem;
  color: #9cb0c9;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toast-progress-bar {
  height: 3px;
  background: linear-gradient(90deg, #f0c330, #ffdd77);
  animation: countdown 5s linear forwards;
}

@keyframes countdown {
  from { width: 100%; }
  to { width: 0%; }
}

.achievement-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.achievement-pop-leave-active {
  transition: all 0.3s ease-in;
}
.achievement-pop-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.92);
}
.achievement-pop-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

/* ========================================================
   EN-TÊTE & NAVIGATION
   ======================================================== */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1rem 2.5rem;
  background: rgba(14, 20, 27, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1b2838 0%, #171a21 100%);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.steam-logo {
  width: 26px;
  height: 26px;
  color: var(--steam-blue);
}

.brand-text h1 {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #fff;
}

.badge-phase {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  color: #a1cd44;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 2px;
}

.header-status-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tracker-status-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: rgba(22, 32, 47, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--steam-text-muted);
}

.tracker-status-chip.active {
  border-color: rgba(92, 126, 16, 0.5);
  color: #a1cd44;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff5555;
}

.tracker-status-chip.active .chip-dot {
  background: #a1cd44;
  box-shadow: 0 0 8px #a1cd44;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(22, 32, 47, 0.6);
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  font-size: 0.8rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background-color: var(--steam-online);
  box-shadow: 0 0 8px var(--steam-online);
}

.status-dot.offline {
  background-color: #6c757d;
}

.status-label {
  font-weight: 500;
  color: var(--steam-text-main);
}

/* ========================================================
   CONTENU PRINCIPAL
   ======================================================== */
.main-content {
  flex: 1;
  max-width: 1040px;
  width: 100%;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.browser-warning-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(235, 87, 87, 0.12);
  border: 1px solid rgba(235, 87, 87, 0.4);
  border-radius: 12px;
  margin-bottom: 2rem;
  color: #ff9494;
  font-size: 0.85rem;
}

.warning-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* ========================================================
   SECTION AUTHENTIFICATION
   ======================================================== */
.auth-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 55vh;
}

.auth-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 480px;
  text-align: center;
  box-shadow: var(--shadow-card);
}

.apikey-setup-card {
  max-width: 580px;
}

.auth-steps-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.step-chip {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--steam-text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  border: 1px solid transparent;
}

.step-chip.active {
  color: #66c0f4;
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.4);
}

.step-separator {
  color: rgba(255, 255, 255, 0.25);
  font-size: 0.8rem;
}

.btn-back-step {
  background: none;
  border: none;
  color: #66c0f4;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  transition: var(--transition-smooth);
}

.btn-back-step:hover {
  background: rgba(102, 192, 244, 0.1);
  text-decoration: underline;
}

.apikey-glow {
  background: rgba(240, 195, 48, 0.1) !important;
  border-color: rgba(240, 195, 48, 0.3) !important;
}

.key-icon {
  width: 32px;
  height: 32px;
  color: #f0c330;
}

.apikey-portal-box {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.portal-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
  font-size: 0.86rem;
  color: #c5d4e8;
  line-height: 1.45;
}

.portal-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #f0c330;
  background: rgba(240, 195, 48, 0.15);
  border: 1px solid rgba(240, 195, 48, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
}

.portal-info code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-family: monospace;
  color: #fff;
}

.btn-open-steam-portal {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, rgba(102, 192, 244, 0.2) 0%, rgba(27, 40, 56, 0.6) 100%);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-open-steam-portal:hover {
  background: #66c0f4;
  color: #0b0e14;
  box-shadow: 0 0 16px rgba(102, 192, 244, 0.35);
}

.external-link-icon {
  width: 18px;
  height: 18px;
}

.apikey-input-section {
  text-align: left;
  margin-bottom: 1.5rem;
}

.apikey-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--steam-text-main);
  margin-bottom: 0.5rem;
}

.key-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.key-text-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  color: #ffffff;
  font-family: monospace;
  font-size: 0.88rem;
  letter-spacing: 0.05em;
  transition: var(--transition-smooth);
}

.key-text-input:focus {
  outline: none;
  border-color: #f0c330;
  box-shadow: 0 0 12px rgba(240, 195, 48, 0.3);
}

.btn-paste-key {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c5d4e8;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: var(--transition-smooth);
}

.btn-paste-key:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.success-banner {
  background: rgba(161, 205, 68, 0.15);
  border: 1px solid rgba(161, 205, 68, 0.4);
  color: #a1cd44;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  text-align: center;
}

.apikey-actions-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-save-key-next {
  width: 100%;
  padding: 0.95rem 1.25rem;
  background: linear-gradient(135deg, #f0c330 0%, #b89118 100%);
  color: #0b0e14;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(240, 195, 48, 0.35);
  transition: var(--transition-smooth);
}

.btn-save-key-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(240, 195, 48, 0.5);
  background: linear-gradient(135deg, #ffd34e 0%, #ca9e1a 100%);
}

.btn-save-key-next:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-skip-key-step {
  background: transparent;
  border: none;
  color: var(--steam-text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: var(--transition-smooth);
}

.btn-skip-key-step:hover {
  color: #c5d4e8;
  text-decoration: underline;
}

.auth-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem auto;
  background: rgba(102, 192, 244, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(102, 192, 244, 0.2);
}

.shield-icon {
  width: 32px;
  height: 32px;
  color: var(--steam-blue);
}

.auth-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.auth-description {
  color: var(--steam-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: rgba(235, 87, 87, 0.15);
  border: 1px solid rgba(235, 87, 87, 0.4);
  border-radius: 10px;
  color: #ff8080;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.button-wrapper {
  margin-bottom: 2rem;
}

.steam-login-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #1999e3 0%, #125688 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(25, 153, 227, 0.35);
  transition: var(--transition-smooth);
}

.steam-login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(25, 153, 227, 0.5);
  background: linear-gradient(135deg, #2cb0fd 0%, #176fae 100%);
}

.steam-login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-steam-icon {
  width: 22px;
  height: 22px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.security-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--steam-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
  text-align: left;
}

.lock-icon {
  width: 18px;
  height: 18px;
  color: var(--steam-blue);
  flex-shrink: 0;
}

/* ========================================================
   SECTION DASHBOARD CONNECTÉ
   ======================================================== */
.dashboard-section {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* 1. Profil */
.profile-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow-card);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.avatar-container {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(102, 192, 244, 0.4);
}

.avatar-status-ring {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background-color: var(--steam-online);
  border: 3px solid var(--bg-secondary);
  border-radius: 50%;
}

.user-meta {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.4rem;
}

.user-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
}

.user-state-pill {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(87, 203, 222, 0.15);
  color: var(--steam-online);
  font-weight: 600;
}

.steam-id-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--steam-text-muted);
}

.id-value {
  background: rgba(0, 0, 0, 0.35);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-family: monospace;
  color: var(--steam-blue);
}

.btn-copy {
  background: rgba(102, 192, 244, 0.1);
  border: 1px solid rgba(102, 192, 244, 0.25);
  color: var(--steam-blue);
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-copy:hover {
  background: rgba(102, 192, 244, 0.2);
}

.profile-actions-inline {
  display: flex;
  gap: 0.75rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-danger {
  background: rgba(235, 87, 87, 0.15);
  border: 1px solid rgba(235, 87, 87, 0.3);
  color: #ff8080;
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-danger:hover {
  background: rgba(235, 87, 87, 0.25);
}

/* ========================================================
   2. CARTE DOUBLE AFFICHAGE (PHASE 3)
   ======================================================== */
.display-systems-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(102, 192, 244, 0.25);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow-card);
}

.display-systems-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.icon-title-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.display-icon-glow {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(102, 192, 244, 0.1);
  border: 1px solid rgba(102, 192, 244, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--steam-blue);
}

.screen-icon {
  width: 24px;
  height: 24px;
}

.display-systems-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.2rem;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--steam-text-muted);
}

.badge-phase-tag {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: rgba(240, 195, 48, 0.15);
  color: #f0c330;
  border: 1px solid rgba(240, 195, 48, 0.4);
}

.display-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 1.25rem;
}

.display-item-box {
  background: rgba(11, 16, 24, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.display-item-box.obs-box {
  border-color: rgba(102, 192, 244, 0.25);
  background: rgba(14, 24, 38, 0.75);
}

.display-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.display-item-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.item-badge-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.item-badge-pill.in-game {
  background: rgba(161, 205, 68, 0.18);
  color: #a1cd44;
}

.item-badge-pill.obs {
  background: rgba(102, 192, 244, 0.2);
  color: #66c0f4;
}

.display-item-title h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
}

.status-indicator-pill {
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--steam-text-muted);
}

.status-indicator-pill.active {
  background: rgba(92, 126, 16, 0.2);
  color: #a1cd44;
  border: 1px solid rgba(92, 126, 16, 0.4);
}

.item-desc {
  font-size: 0.8rem;
  color: #a4b4cc;
  line-height: 1.45;
}

.item-properties-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
}

.prop-chip {
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: #9cb0c9;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.obs-header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-port-config {
  background: rgba(102, 192, 244, 0.12);
  color: #66c0f4;
  border: 1px solid rgba(102, 192, 244, 0.35);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-port-config:hover {
  background: rgba(102, 192, 244, 0.25);
  border-color: #66c0f4;
  color: #fff;
}

/* Bannière de détection de conflit de port */
.obs-conflict-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: rgba(240, 195, 48, 0.12);
  border: 1px solid rgba(240, 195, 48, 0.45);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  font-size: 0.78rem;
  color: #f7d56e;
  line-height: 1.4;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.conflict-alert-icon {
  font-size: 1.15rem;
  flex-shrink: 0;
  line-height: 1;
}

.conflict-alert-body strong {
  color: #fff;
}

.conflict-alert-body p {
  margin: 0.2rem 0 0 0;
  font-size: 0.74rem;
  color: #fce8a6;
}

.obs-url-container {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  background: rgba(0, 0, 0, 0.45);
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(102, 192, 244, 0.25);
  transition: var(--transition-smooth);
}

.obs-url-container.lan-highlight {
  border-color: rgba(161, 205, 68, 0.35);
  background: rgba(15, 26, 20, 0.55);
}

.url-kind-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.url-type-tag {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: rgba(102, 192, 244, 0.2);
  color: #66c0f4;
}

.url-type-tag.lan {
  background: rgba(161, 205, 68, 0.2);
  color: #a1cd44;
}

.url-type-hint {
  font-size: 0.7rem;
  color: var(--steam-text-muted);
}

.url-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.obs-url-text {
  font-family: monospace;
  font-size: 0.85rem;
  color: #66c0f4;
  word-break: break-all;
}

.obs-url-text.lan-text {
  color: #bbf359;
}

.obs-url-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.btn-copy-obs {
  background: var(--steam-blue);
  color: #0b0e14;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-copy-obs:hover {
  background: #88d4ff;
}

.btn-copy-lan {
  background: #739e1a !important;
  color: #fff !important;
}

.btn-copy-lan:hover {
  background: #8cb929 !important;
}

.btn-restore-themes {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #c7d5e0;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-restore-themes:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.restore-icon {
  font-size: 1rem;
  line-height: 1;
}

.btn-test-obs {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.75rem;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
}

.btn-test-obs:hover {
  background: rgba(255, 255, 255, 0.2);
}

.obs-alt-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: var(--steam-text-muted);
}

.alt-code {
  font-family: monospace;
  color: #66c0f4;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px dashed rgba(102, 192, 244, 0.25);
  transition: var(--transition-smooth);
}

.alt-code:hover {
  border-color: var(--steam-blue);
  color: #fff;
}

.copied-badge {
  color: #a1cd44;
  font-weight: 700;
  font-size: 0.7rem;
}

.obs-meta-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--steam-text-muted);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.6rem;
}

.obs-meta-stats strong {
  color: #fff;
}

.obs-meta-stats strong.connected-count {
  color: #a1cd44;
  text-shadow: 0 0 8px rgba(161, 205, 68, 0.5);
}

/* ========================================================
   3. PANNEAU DE CONTRÔLE DU TRACKER
   ======================================================== */
.tracker-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow-card);
}

.tracker-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.tracker-title-box {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tracker-pulse-icon {
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-center {
  width: 10px;
  height: 10px;
  background-color: #a1cd44;
  border-radius: 50%;
}

.pulse-ring {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #a1cd44;
  animation: pulse-ring-anim 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring-anim {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}

.tracker-card-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.2rem;
}

.tracker-subtitle {
  font-size: 0.8rem;
  color: var(--steam-text-muted);
}

.badge-active-tracker {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: rgba(92, 126, 16, 0.2);
  color: #a1cd44;
  border: 1px solid rgba(92, 126, 16, 0.4);
}

.tracker-diagnostics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  background: rgba(11, 16, 24, 0.6);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1.75rem;
}

.diag-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.diag-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--steam-text-muted);
  letter-spacing: 0.04em;
  font-weight: 600;
}

.diag-value {
  font-size: 0.85rem;
  color: #fff;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-ok {
  color: #a1cd44;
}
.api-warn {
  color: #f0c330;
}

.simulation-section {
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.simulation-header h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.25rem;
}

.simulation-header p {
  font-size: 0.8rem;
  color: var(--steam-text-muted);
  margin-bottom: 1rem;
}

.sim-buttons-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.btn-sim {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(22, 32, 47, 0.8);
  border: 1px solid rgba(102, 192, 244, 0.25);
  color: #fff;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-sim:hover:not(:disabled) {
  background: rgba(27, 40, 56, 1);
  border-color: var(--steam-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn-sim:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sim-game-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: rgba(102, 192, 244, 0.2);
  color: var(--steam-blue);
}

/* ========================================================
   4. HISTORIQUE DE LA SESSION
   ======================================================== */
.history-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow-card);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.history-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
}

.btn-clear-history {
  font-size: 0.75rem;
  color: var(--steam-text-muted);
  cursor: pointer;
  transition: color 0.2s;
}

.btn-clear-history:hover {
  color: #ff8080;
}

.history-empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--steam-text-muted);
}

.empty-trophy {
  width: 42px;
  height: 42px;
  margin: 0 auto 0.75rem auto;
  opacity: 0.4;
}

.history-empty p {
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.empty-sub {
  font-size: 0.8rem;
  opacity: 0.7;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(11, 16, 24, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 0.85rem 1.1rem;
  transition: var(--transition-smooth);
}

.history-item:hover {
  border-color: rgba(240, 195, 48, 0.3);
  transform: translateX(4px);
}

.history-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid rgba(240, 195, 48, 0.5);
  object-fit: cover;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
}

.history-game {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--steam-blue);
  text-transform: uppercase;
}

.history-time {
  font-size: 0.72rem;
  color: var(--steam-text-muted);
}

.history-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.2rem;
}

.history-desc {
  font-size: 0.8rem;
  color: var(--steam-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========================================================
   PHASE 5 : BIBLIOTHÈQUE DE THÈMES (CARDS MODULAIRES)
   ======================================================== */
.editor-view-wrapper {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

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

.library-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.btn-create-theme {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  color: #0b0e14;
  font-weight: 800;
  font-size: 0.88rem;
  padding: 0.75rem 1.35rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(240, 195, 48, 0.35);
  transition: var(--transition-smooth);
}

.btn-create-theme:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #ffd859 0%, #e6a722 100%);
  box-shadow: 0 8px 24px rgba(240, 195, 48, 0.55);
}

.plus-icon {
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1;
}

/* Grille de Thèmes */
.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.theme-card {
  background: rgba(14, 20, 29, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.theme-card:hover {
  transform: translateY(-3px);
  border-color: rgba(102, 192, 244, 0.4);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(102, 192, 244, 0.15);
}

/* Carte active : mise en évidence visuelle forte */
.theme-card.is-active-theme {
  border: 2px solid #a1cd44;
  background: rgba(18, 28, 38, 0.9);
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.7),
    0 0 24px rgba(161, 205, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.card-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(161, 205, 68, 0.18);
  border: 1px solid rgba(161, 205, 68, 0.6);
  color: #a1cd44;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  box-shadow: 0 0 10px rgba(161, 205, 68, 0.25);
}

.active-sparkle {
  color: #ffe680;
  font-size: 0.8rem;
}

.inactive-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #72849c;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  letter-spacing: 0.04em;
}

.card-audio-indicator {
  font-size: 0.7rem;
}

.audio-chip {
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-weight: 600;
}

.audio-chip.custom {
  background: rgba(161, 205, 68, 0.15);
  color: #a1cd44;
  border: 1px solid rgba(161, 205, 68, 0.3);
}

.audio-chip.default {
  background: rgba(255, 255, 255, 0.05);
  color: #8b9bb4;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.card-main-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.theme-card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-id-sub {
  font-size: 0.7rem;
  font-family: monospace;
  color: #6a7c93;
}

/* Mini Rendu Mockup */
.card-preview-mockup {
  background: #090d13;
  border-radius: 10px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mockup-frame {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mockup-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  border: 1.5px solid rgba(240, 195, 48, 0.6);
  overflow: hidden;
  background: #000;
  flex-shrink: 0;
}

.mockup-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mockup-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mockup-top-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1px;
}

.mockup-game {
  font-size: 0.65rem;
  font-weight: 700;
  color: #66c0f4;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mockup-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: #f0c330;
}

.mockup-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mockup-desc {
  font-size: 0.7rem;
  color: #8b9bb4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Actions Toolbar */
.card-actions-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-card-action {
  border: none;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-activate {
  flex: 1;
  background: linear-gradient(135deg, rgba(161, 205, 68, 0.25) 0%, rgba(121, 165, 38, 0.25) 100%);
  border: 1px solid rgba(161, 205, 68, 0.6);
  color: #a1cd44;
}

.btn-activate:hover:not(:disabled) {
  background: #a1cd44;
  color: #0b0e14;
  box-shadow: 0 0 12px rgba(161, 205, 68, 0.4);
}

.btn-activate.already-active {
  background: rgba(161, 205, 68, 0.12);
  border-color: rgba(161, 205, 68, 0.4);
  color: #a1cd44;
  opacity: 0.8;
  cursor: default;
}

.btn-edit {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
}

.btn-edit:hover {
  background: #66c0f4;
  color: #0b0e14;
}

.btn-duplicate {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #c5d4e8;
}

.btn-duplicate:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.btn-delete {
  background: rgba(235, 87, 87, 0.08);
  border: 1px solid rgba(235, 87, 87, 0.2);
  color: #ff8080;
  padding: 0.45rem 0.6rem;
}

.btn-delete:hover:not(:disabled) {
  background: rgba(235, 87, 87, 0.3);
  border-color: #ff8080;
  color: #fff;
}

.btn-delete:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Écran de chargement initial (restauration de session) */
.session-loading-splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  text-align: center;
  gap: 12px;
}

.splash-spinner {
  width: 44px;
  height: 44px;
  border: 3.5px solid rgba(102, 192, 244, 0.2);
  border-top-color: #66c0f4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.splash-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.splash-subtitle {
  font-size: 0.88rem;
  color: #8f98a0;
}

/* Bannière de Transparence Stockage Local & Confidentialité */
.local-privacy-notice-box {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: rgba(102, 192, 244, 0.08);
  border: 1px solid rgba(102, 192, 244, 0.3);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin: 1.25rem 0 1.5rem 0;
  text-align: left;
}

.privacy-notice-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(102, 192, 244, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #66c0f4;
  margin-top: 2px;
}

.shield-notice-icon {
  width: 18px;
  height: 18px;
}

.privacy-notice-text h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #66c0f4;
  margin: 0 0 4px 0;
}

.privacy-notice-text p {
  font-size: 0.85rem;
  color: #c7d5e0;
  line-height: 1.45;
  margin: 0;
}

.privacy-notice-text code {
  background: rgba(0, 0, 0, 0.35);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.82rem;
  color: #ffd166;
}

/* Badge persistance session sur Step 2 */
.session-persistence-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(161, 205, 68, 0.1);
  border: 1px solid rgba(161, 205, 68, 0.3);
  color: #a1cd44;
  font-size: 0.84rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  margin: 1rem auto;
}

.mini-save-icon {
  width: 14px;
  height: 14px;
}

/* Modal Gestion Clé API */
.api-key-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.api-key-modal-card {
  width: 100%;
  max-width: 520px;
  background: #171d25;
  border: 1px solid rgba(102, 192, 244, 0.3);
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(102, 192, 244, 0.2);
  padding: 1.75rem;
  color: #fff;
}

.modal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-key-icon {
  font-size: 1.3rem;
}

.modal-card-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #8f98a0;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close-modal:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.modal-desc {
  font-size: 0.88rem;
  color: #8f98a0;
  line-height: 1.45;
  margin: 0 0 1rem 0;
}

.modal-desc code {
  color: #66c0f4;
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 4px;
  border-radius: 4px;
}

.modal-actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 1.5rem;
}

.btn-save-modal-key {
  background: linear-gradient(135deg, #4c9ee3 0%, #2f6cb3 100%);
  color: #fff;
  border: none;
  font-weight: 700;
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(76, 158, 227, 0.35);
  transition: all 0.2s;
}

.btn-save-modal-key:hover {
  filter: brightness(1.15);
  box-shadow: 0 6px 18px rgba(76, 158, 227, 0.5);
}

/* Bouton Paramètres dans le Header */
.btn-header-settings {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c7d5e0;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-header-settings:hover {
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.45);
  color: #66c0f4;
  transform: translateY(-1px);
}

.settings-gear-icon {
  width: 15px;
  height: 15px;
}

/* Studio & Galerie de Thèmes (Refonte Visuelle) */
.studio-theme-library {
  position: relative;
  overflow: hidden;
}

.studio-glow {
  background: radial-gradient(circle, rgba(102, 192, 244, 0.3) 0%, transparent 70%);
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

.studio-filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  margin-bottom: 1.25rem;
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
  background: transparent;
  border: none;
  color: #fff;
  font-size: 0.82rem;
  width: 100%;
  outline: none;
}

.btn-clear-search {
  background: transparent;
  border: none;
  color: #8b9bb4;
  font-size: 0.8rem;
  cursor: pointer;
}

.studio-filter-chips {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.filter-chip {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8b9bb4;
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
  border-color: #66c0f4;
  color: #66c0f4;
  font-weight: 700;
}

.studio-empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.studio-empty-state .empty-icon {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.studio-empty-state h4 {
  margin: 0 0 0.4rem 0;
  color: #fff;
}

.studio-empty-state p {
  margin: 0 0 1rem 0;
  color: #8b9bb4;
  font-size: 0.85rem;
}

.studio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.studio-card {
  background: linear-gradient(180deg, rgba(20, 29, 43, 0.85) 0%, rgba(13, 19, 29, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  display: flex;
  flex-direction: column;
}

.studio-card:hover {
  transform: translateY(-3px);
  border-color: rgba(102, 192, 244, 0.4);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(102, 192, 244, 0.1);
}

.studio-card.is-active-theme {
  border-color: rgba(240, 195, 48, 0.7);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 24px rgba(240, 195, 48, 0.2);
}

.studio-card-header {
  padding: 0.8rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.studio-active-badge {
  background: linear-gradient(135deg, rgba(240, 195, 48, 0.25) 0%, rgba(255, 219, 101, 0.15) 100%);
  border: 1px solid rgba(240, 195, 48, 0.6);
  color: #ffd644;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.inactive-badge-pill {
  font-size: 0.7rem;
  color: #69788f;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.card-badges-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.effect-badge-pill {
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.45);
  color: #d8b4fe;
  padding: 0.18rem 0.45rem;
  border-radius: 4px;
}

.studio-info {
  padding: 0.85rem 1rem 0.4rem 1rem;
}

.studio-preview-frame {
  margin: 0.4rem 1rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #080d13;
}

.studio-actions-bar {
  padding: 0.8rem 1rem;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.btn-card-action.btn-export {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #c7d5e0;
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-card-action.btn-export:hover {
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.4);
  color: #66c0f4;
}

/* Modal Paramètres Généraux */
.general-settings-modal {
  max-width: 580px;
  width: 95vw;
}

.modal-subtitle-text {
  margin: 0.2rem 0 0 0;
  font-size: 0.78rem;
  color: #8b9bb4;
}

.general-settings-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 1.25rem 0;
}

.settings-block {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.block-header-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.block-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.block-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
}

.block-sub {
  margin: 0.2rem 0 0 0;
  font-size: 0.74rem;
  color: #8b9bb4;
  line-height: 1.35;
}

.settings-field-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.device-select-global {
  flex: 1;
  background: rgba(16, 24, 34, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  outline: none;
}

.device-select-global:focus {
  border-color: #66c0f4;
}

.btn-test-global-audio {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  padding: 0.55rem 0.95rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-test-global-audio:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.28);
  box-shadow: 0 0 12px rgba(102, 192, 244, 0.3);
}

.settings-volume-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.global-volume-slider-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 200px;
}

.volume-pct {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f0c330;
  min-width: 42px;
}

.port-input {
  width: 140px;
}

.port-status-badge {
  font-size: 0.76rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  color: #9cb3ce;
}

.port-status-badge.conflict {
  border-color: #f0c330;
  color: #ffd644;
}

/* Grille de Simulation des 3 Tiers */
.sim-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.sim-badge {
  font-size: 0.68rem;
  font-weight: 800;
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.sim-tiers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.sim-tier-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.sim-tier-card:hover {
  transform: translateY(-2px);
}

.sim-tier-card.common {
  border-color: rgba(240, 195, 48, 0.3);
  background: linear-gradient(180deg, rgba(240, 195, 48, 0.04) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.sim-tier-card.rare {
  border-color: rgba(168, 85, 247, 0.35);
  background: linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.sim-tier-card.master {
  border-color: rgba(56, 189, 248, 0.35);
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.sim-tier-badge {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.sim-tier-card.common .sim-tier-badge { color: #f0c330; }
.sim-tier-card.rare .sim-tier-badge { color: #c084fc; }
.sim-tier-card.master .sim-tier-badge { color: #38bdf8; }

.sim-tier-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #fff;
}

.sim-tier-game {
  font-size: 0.72rem;
  color: #8b9bb4;
  margin-bottom: 0.4rem;
}

.btn-sim-action {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-sim-action.common {
  background: rgba(240, 195, 48, 0.15);
  border-color: rgba(240, 195, 48, 0.45);
  color: #ffd644;
}

.btn-sim-action.common:hover:not(:disabled) {
  background: rgba(240, 195, 48, 0.3);
  box-shadow: 0 0 12px rgba(240, 195, 48, 0.25);
}

.btn-sim-action.rare {
  background: rgba(168, 85, 247, 0.18);
  border-color: rgba(168, 85, 247, 0.5);
  color: #d8b4fe;
}

.btn-sim-action.rare:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.35);
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
}

.btn-sim-action.master {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.5);
  color: #7dd3fc;
}

.btn-sim-action.master:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}
</style>
