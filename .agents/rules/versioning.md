# Règle d'Incrémentation Automatique de Version et Packaging

## 1. Synchronisation SemVer Obligatoire
À chaque nouveau commit Git, correction de bug ou ajout de fonctionnalité :
- Le numéro de version du projet doit être incrémenté (par défaut au niveau **patch** : ex. `1.0.0` -> `1.0.1`).
- La version doit rester strictement synchronisée dans les 3 fichiers de configuration :
  1. `package.json` (`version`)
  2. `src-tauri/tauri.conf.json` (`version`)
  3. `src-tauri/Cargo.toml` (`[package].version`)

## 2. Utilisation du Script Automatisé
Toujours exécuter avant le commit ou le build :
```bash
npm run bump          # Incrémentation patch (1.0.1 -> 1.0.2)
npm run bump:minor    # Incrémentation mineure (1.0.2 -> 1.1.0)
npm run bump:major    # Incrémentation majeure (1.1.0 -> 2.0.0)
```

## 3. Configuration des Langues d'Installation (Windows)
- Le package MSI (WiX) doit obligatoirement être configuré en français :
  `bundle.windows.wix.language = "fr-FR"`
- L'installateur NSIS (`.exe`) doit supporter le français en priorité :
  `bundle.windows.nsis.languages = ["French", "English"]`
- Ne jamais retirer ces configurations de langue dans `src-tauri/tauri.conf.json`.

## 4. Publication Systématique de Release sur GitHub
À chaque fois qu'un build est produit :
1. Fusionner sur `main` et créer le tag `v<VERSION>`.
2. Téléverser les fichiers installeurs (`.exe` et `.msi`) sur GitHub Releases via :
   ```bash
   gh release create v<VERSION> <chemins_vers_les_installateurs> --title "SteamOverlayStream v<VERSION>" --notes "<description_détaillée_des_ajouts>"
   ```
3. Inclure impérativement dans les `--notes` le changelog des nouveautés et corrections apportées par la version.

