# Script d'installation du certificat SteamOverlayStream dans les Autorités Racines de Confiance locales
$certPath = Join-Path $PSScriptRoot "..\SteamOverlayStream_cert.cer"

if (-not (Test-Path $certPath)) {
    Write-Error "Fichier certificat introuvable : $certPath"
    exit 1
}

Write-Host "Installation du certificat SteamOverlayStream dans les Autorites Racines de Confiance (CurrentUser)..." -ForegroundColor Cyan
try {
    $cert = Import-Certificate -FilePath $certPath -CertStoreLocation "Cert:\CurrentUser\Root"
    Write-Host "✔ Certificat installe avec succes ! (Thumbprint: $($cert.Thumbprint))" -ForegroundColor Green
    Write-Host "L'application et ses installateurs sont desormais reconnus comme 'Editeur Verifie : SteamOverlayStream' sur cette machine." -ForegroundColor Yellow
} catch {
    Write-Error "Erreur lors de l'installation du certificat : $_"
}
