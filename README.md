<div align="center">

# 🤖 Grok Bot System Tray (Close-to-Tray) 📌

**Minimize Grok Desktop (xAI) to the Windows System Tray on Close (X)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6.svg?logo=windows)](https://github.com/gmzoztr/grok-bot-tray)
[![Supports: Electron](https://img.shields.io/badge/Engine-Electron%20%2F%20.NET-informational.svg)](https://github.com/gmzoztr/grok-bot-tray)
[![Star on GitHub](https://img.shields.io/github/stars/gmzoztr/grok-bot-tray?style=social)](https://github.com/gmzoztr/grok-bot-tray)

*A lightweight, native companion and dynamic patcher that keeps Grok Bot running in your system notification area when you click the Close (X) button.*

---

### ⭐ Support the Project / Projeyi Destekleyin
> **If this tool saves you time and makes your Grok Bot experience better, please give this repository a ⭐ STAR!**  
> *Bu araç işinize yaradıysa ve Grok Bot deneyiminizi iyileştirdiyse, lütfen depoya bir ⭐ **YILDIZ** vererek destek olun!*

---

[English](#-english) • [Türkçe](#-t%C3%BCrk%C3%A7e) • [Message for xAI / Grok Team](#-a-message-to-the-xai--grok-team)

</div>

---

## 🇬🇧 English

### Why this project?
The official **Grok Desktop** application for Windows (powered by Electron) currently lacks a native *"Minimize to Tray on Close"* setting. When users click the **Close (X)** button, the app terminates entirely rather than staying ready in the background like Telegram, Discord, or Slack.

This repository provides an automated, update-resilient patch and a lightweight C# companion (`160 KB`) that adds seamless system tray support to Grok Bot.

### Features
* **Close to Tray:** Clicking the **X** button hides Grok Bot to the system tray instead of closing it.
* **Instant Restore:** Left-click or double-click the tray icon to bring Grok Bot back to focus instantly.
* **Smart Single-Instance:** Clicking the desktop shortcut while Grok Bot is in the tray automatically restores and focuses the window.
* **Balloon Notification:** Shows a brief, non-intrusive notification when minimized for the first time.
* **Update-Resilient:** The patcher dynamically analyzes minified JavaScript variables (`watchRenderer`), automatically adapting to new official Grok Bot updates!
* **100% Reversible:** Revert back to official factory state anytime with a single click.

---

### 🚀 Quick Installation

#### Prerequisites
* Windows 10 or Windows 11 (64-bit)
* [Node.js](https://nodejs.org) (v18+)
* Official [Grok Bot](https://grok.com) installed in default directory (`C:\Program Files\Grok Bot`)

#### One-Click Install
1. Clone or download this repository.
2. Right-click **`install.ps1`** and select **"Run with PowerShell"** (it will automatically ask for Administrator permissions if required).
3. Grok Bot will be patched and restarted automatically.

---

### 🔄 How to Handle Grok Bot Updates
When Grok Bot updates itself, its core files are refreshed by the official installer. To re-apply the tray feature:
Simply run **`install.ps1`** again! The dynamic patcher automatically detects any changed variable names in the new version and re-patches in 5 seconds.

---

### 🧹 How to Uninstall / Restore
To completely remove the patch and revert Grok Bot to 100% factory original state:
Run **`restore.ps1`**.

---

<br>

## 🇹🇷 Türkçe

### Bu Proje Neden Geliştirildi?
Resmi **Grok Bot** masaüstü uygulamasında (Electron tabanlı) şu anda kapatma (X) butonuna basıldığında uygulamanın sağ alt sistem tepsisine (system tray) küçülmesi seçeneği bulunmamaktadır. Kullanıcılar X butonuna bastığında uygulama arka planda açık kalmak yerine tamamen kapanmaktadır.

Bu proje, Grok Bot'a hafif (160 KB) bir C# tepsi yardımcısı ve dinamik bir JavaScript yamalayıcısı ekleyerek X butonuna basıldığında uygulamanın sağ alt köşede arka planda çalışmaya devam etmesini sağlar.

### Özellikler
* **Tepsiye Küçültme:** X butonuna basıldığında uygulama kapanmaz, sağ alttaki sistem tepsisine gizlenir.
* **Anında Geri Açma:** Tepsideki Grok simgesine tıklayarak veya çift tıklayarak pencereyi anında öne getirebilirsiniz.
* **Akıllı Kısayol Desteği:** Grok Bot tepside gizliyken masaüstündeki kısayoluna çift tıklarsanız yeni kopya açmaya çalışmak yerine gizli pencereyi doğrudan ekrana getirir.
* **Güncellemelere Dayanıklı (Dinamik Regex):** Yamalayıcı, kod içerisindeki sıkıştırılmış (minified) değişken isimlerini otomatik olarak tespit eder; böylece resmi güncellemeler gelse dahi kolayca yeniden uygulanabilir.
* **%100 Güvenli ve Geri Alınabilir:** İstediğiniz an tek tıkla Grok Bot'u orijinal fabrika ayarlarına döndürebilirsiniz.

---

### 🚀 Kurulum

1. Bu depoyu indirin veya klonlayın:
   ```powershell
   git clone https://github.com/gmzoztr/grok-bot-tray.git
   cd grok-bot-tray
   ```
2. **`install.ps1`** dosyasına sağ tıklayıp **"PowerShell ile Çalıştır"** deyin (Gerekli yönetici yetkisini kendisi isteyecektir).
3. İşlem 5-10 saniye içinde tamamlanacak ve Grok Bot tepsi desteğiyle otomatik olarak açılacaktır.

---

### 🔄 Güncelleme Geldiğinde Ne Yapılır?
Grok Bot otomatik güncellendiğinde X'e basınca tekrar doğrudan kapanmaya başlarsa:
Yalnızca **`install.ps1`** dosyasını tekrar çalıştırmanız yeterlidir. Yeni sürümün değişkenlerini otomatik algılayıp 5 saniyede yeniden yamalar.

---

### 🧹 Kaldırma (Orijinale Dönüş)
Yamayı kaldırmak ve Grok Bot'u tamamen ilk günkü orijinal haline döndürmek için:
**`restore.ps1`** dosyasını çalıştırmanız yeterlidir.

---

<br>

## 💡 A Message to the xAI / Grok Team

> **Dear xAI Engineers & Grok Product Team,**  
> We love Grok and use the Desktop application daily! The desktop community genuinely misses a native *"Close to Tray"* feature.  
> 
> In this repository, we demonstrated how this can be implemented:
> 1. In your `main-core.cjs` (or TypeScript Electron main process), intercept `mainWindow.on('close', (e) => { if (!isQuitting) { e.preventDefault(); mainWindow.hide(); } })`.
> 2. On Windows 10/11, implement an Electron `Tray` instance with fallback to prevent the known Chromium `Shell_NotifyIcon` bug.
> 3. Ensure your `second-instance` handler calls `mainWindow.show(); mainWindow.focus();` when the window is hidden.
> 
> We hope to see this natively integrated in an upcoming official release of Grok Bot so community patches are no longer needed! ❤️

---

### 📄 License
This project is open-source under the [MIT License](LICENSE).  
*Disclaimer: This is an unofficial, community-made enhancement tool. Grok and xAI are trademarks of their respective owners.*
