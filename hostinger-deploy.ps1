Param(
  [ValidateSet('staging','production')]
  [string]$Environment = 'production'
)

Write-Host "Deploiement CassKai vers Hostinger ($Environment)" -ForegroundColor Cyan

# Chargement des variables d'environnement requises
$required = @('HOSTINGER_HOST','HOSTINGER_USER','HOSTINGER_PATH')
$missing = @()
foreach ($name in $required) {
  if (-not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) { continue }
  $missing += $name
}
if ($missing.Count -gt 0) {
  Write-Error "Variables manquantes: $($missing -join ', '). Définissez-les avant de lancer le script."
  exit 1
}

# 1) Build
if ($Environment -eq 'production') {
  npm run build:production
} else {
  npm run build:staging
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2) Vérifier dist
if (-not (Test-Path -Path "dist")) {
  Write-Error "Le répertoire 'dist' est manquant."
  exit 1
}

# 3) Upload via scp (nécessite OpenSSH installé sous Windows)
$serverHost = [Environment]::GetEnvironmentVariable('HOSTINGER_HOST')
$serverUser = [Environment]::GetEnvironmentVariable('HOSTINGER_USER')
$remotePath = [Environment]::GetEnvironmentVariable('HOSTINGER_PATH')
$serverPort = [Environment]::GetEnvironmentVariable('HOSTINGER_PORT')
if ([string]::IsNullOrWhiteSpace($serverPort)) { $serverPort = '22' }

Write-Host ("Upload vers {0}@{1}:{2}" -f $serverUser, $serverHost, $remotePath) -ForegroundColor Yellow

# Crée le dossier cible s'il n'existe pas et nettoie l'ancien contenu
$dest = "$serverUser@$serverHost"
$remoteCmd = "mkdir -p '$remotePath' && rm -rf '$remotePath'/*"
& ssh -p $serverPort $dest $remoteCmd
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Copie les fichiers de dist
& scp -P $serverPort -r dist/* "$("$dest`:$remotePath/")"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploiement termine. Verifiez que .htaccess est en place pour la navigation SPA." -ForegroundColor Green
