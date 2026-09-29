# Grok Bot Tray Restore / Uninstaller
# Reverts Grok Bot to 100% factory original state

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Yönetici yetkisi gerekiyor, yükseltiliyor..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"")
    exit
}

$appDir = "C:\Program Files\Grok Bot"
$resourcesDir = "$appDir\resources"
$asarTarget = "$resourcesDir\app.asar"
$asarBackup = "$resourcesDir\app.asar.original"
$exeTarget = "$appDir\Grok Bot.exe"
$exeBackup = "$appDir\Grok Bot.exe.original"
$v8CacheDir = "$env:APPDATA\Grok Bot\v8-code-cache"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     Grok Bot Orijinal Sürüme Geri Yükleme Aracı            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Süreçleri durdur
Write-Host "[1/4] Çalışan süreçler kapatılıyor..." -ForegroundColor Gray
taskkill /F /IM "Grok Bot.exe" /T 2>$null
taskkill /F /IM "GrokBotTray.exe" /T 2>$null
Start-Sleep -Seconds 1

# 2. Orijinal dosyaları geri yükle
Write-Host "[2/4] Orijinal dosyalar geri yükleniyor..." -ForegroundColor Gray
if (Test-Path $asarBackup) {
    Copy-Item $asarBackup $asarTarget -Force
    Write-Host "  -> Orijinal app.asar geri yüklendi." -ForegroundColor Green
} else {
    Write-Host "  -> [UYARI] app.asar.original bulunamadı!" -ForegroundColor Yellow
}

if (Test-Path $exeBackup) {
    Copy-Item $exeBackup $exeTarget -Force
    Write-Host "  -> Orijinal Grok Bot.exe geri yüklendi." -ForegroundColor Green
} else {
    Write-Host "  -> [UYARI] Grok Bot.exe.original bulunamadı!" -ForegroundColor Yellow
}

# 3. Eklenen yardımcı dosyaları sil
Write-Host "[3/4] Ek dosyalar temizleniyor..." -ForegroundColor Gray
$extra = @("$resourcesDir\GrokBotTray.exe", "$resourcesDir\tray-icon.png")
foreach ($f in $extra) {
    if (Test-Path $f) { Remove-Item $f -Force; Write-Host "  -> Silindi: $(Split-Path -Leaf $f)" }
}

# 4. Önbelleği temizle
Write-Host "[4/4] V8 önbelleği temizleniyor..." -ForegroundColor Gray
if (Test-Path $v8CacheDir) {
    Get-ChildItem $v8CacheDir -Filter "main-core-*" | Remove-Item -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Grok Bot başarıyla tamamen orijinal haline döndürüldü!    " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Çıkmak için bir tuşa basın..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
