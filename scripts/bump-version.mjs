import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const packageJsonPath = resolve(rootDir, 'package.json')
const tauriConfPath = resolve(rootDir, 'src-tauri', 'tauri.conf.json')
const cargoTomlPath = resolve(rootDir, 'src-tauri', 'Cargo.toml')

// 1. Lire la version actuelle
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const currentVersion = packageJson.version || '1.0.0'

const args = process.argv.slice(2)
const mode = args[0] || 'patch'

function incrementVersion(version, type) {
  const parts = version.split('.').map((n) => parseInt(n, 10))
  if (parts.length < 3) {
    while (parts.length < 3) parts.push(0)
  }

  if (type === 'major') {
    parts[0] += 1
    parts[1] = 0
    parts[2] = 0
  } else if (type === 'minor') {
    parts[1] += 1
    parts[2] = 0
  } else if (type === 'patch') {
    parts[2] += 1
  } else if (/^\d+\.\d+\.\d+$/.test(type)) {
    return type
  } else {
    // Par défaut, patch
    parts[2] += 1
  }

  return parts.join('.')
}

const newVersion = incrementVersion(currentVersion, mode)

console.log(`[Version Bump] ${currentVersion} -> ${newVersion}`)

// 2. Mettre à jour package.json
packageJson.version = newVersion
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')

// 3. Mettre à jour src-tauri/tauri.conf.json
if (readFileSync(tauriConfPath)) {
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'))
  tauriConf.version = newVersion
  writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf-8')
}

// 4. Mettre à jour src-tauri/Cargo.toml
const cargoContent = readFileSync(cargoTomlPath, 'utf-8')
const updatedCargo = cargoContent.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`)
writeFileSync(cargoTomlPath, updatedCargo, 'utf-8')

console.log(`✔ Synchronisation terminée : package.json, tauri.conf.json et Cargo.toml sont sur la version ${newVersion}`)
