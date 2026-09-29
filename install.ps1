# Grok Bot Tray Installer
# Requires Administrator privileges (will auto-elevate if needed)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Yönetici yetkisi gerekiyor, yükseltiliyor..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"")
    exit
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     Grok Bot Sistem Tepsisi (Tray) Kurulum Aracı           " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Node.js kontrolü
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "[HATA] Node.js sisteminizde kurulu bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen https://nodejs.org adresinden Node.js kurun." -ForegroundColor Yellow
    pause
    exit 1
}

# Grok Bot dizin izinlerini ayarla
$appDir = "C:\Program Files\Grok Bot"
if (Test-Path $appDir) {
    Write-Host "[1/3] Klasör yazma izinleri ayarlanıyor..." -ForegroundColor Gray
    icacls $appDir /grant Users:(OI)(CI)F /t /c /q | Out-Null
}

# Yamayı çalıştır
Write-Host "[2/3] Sistem tepsisi yaması uygulanıyor..." -ForegroundColor Gray
node "$ScriptDir\patcher\patch.cjs"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[3/3] Grok Bot başlatılıyor..." -ForegroundColor Green
    Start-Process "$appDir\Grok Bot.exe"
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  TEBRİKLER! Grok Bot başarıyla güncellendi ve başlatıldı.  " -ForegroundColor Green
    Write-Host "  Pencereyi kapatmak (X) için bastığınızda sağ alta inecektir." -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Eğer bu araç işinize yaradıysa, lütfen GitHub'da Yıldız (Star ⭐) vermeyi unutmayın!" -ForegroundColor Yellow
    Write-Host "GitHub: https://github.com/gmzoztr/grok-bot-tray" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[HATA] Yama işlemi sırasında bir hata oluştu!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Çıkmak için bir tuşa basın..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
