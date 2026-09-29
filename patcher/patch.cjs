/**
 * Grok Bot Tray Patcher
 * Author: gmzoztr & Antigravity (DeepMind)
 * License: MIT
 * 
 * Dinamik olarak Grok Bot (xAI Desktop) uygulamasını yamalayarak
 * kapatma butonuna basıldığında sistem tepsisine (system tray) küçülmesini sağlar.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const APP_DIR = process.env.GROK_DIR || 'C:\\Program Files\\Grok Bot';
const RESOURCES_DIR = path.join(APP_DIR, 'resources');
const ASAR_TARGET = path.join(RESOURCES_DIR, 'app.asar');
const ASAR_BACKUP = path.join(RESOURCES_DIR, 'app.asar.original');
const EXE_TARGET = path.join(APP_DIR, 'Grok Bot.exe');
const EXE_BACKUP = path.join(APP_DIR, 'Grok Bot.exe.original');
const V8_CACHE_DIR = path.join(process.env.APPDATA, 'Grok Bot', 'v8-code-cache');

const ROOT_DIR = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(ROOT_DIR, '.tmp_extract');
const TEMP_ASAR = path.join(ROOT_DIR, '.tmp_patched.asar');
const TRAY_EXE_SRC = path.join(ROOT_DIR, 'bin', 'GrokBotTray.exe');
const TRAY_PNG_SRC = path.join(ROOT_DIR, 'bin', 'tray-icon.png');
const TRAY_EXE_DST = path.join(RESOURCES_DIR, 'GrokBotTray.exe');
const TRAY_PNG_DST = path.join(RESOURCES_DIR, 'tray-icon.png');

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

function writeFileWithRetry(filePath, data, maxRetries = 10, delayMs = 800) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      fs.writeFileSync(filePath, data);
      return;
    } catch (e) {
      if (i === maxRetries) throw e;
      console.log(`[Wait] ${path.basename(filePath)} serbest bırakılması bekleniyor (${i}/${maxRetries})...`);
      sleep(delayMs);
    }
  }
}

function copyFileWithRetry(src, dst, maxRetries = 10, delayMs = 800) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      fs.copyFileSync(src, dst);
      return;
    } catch (e) {
      if (i === maxRetries) throw e;
      console.log(`[Wait] ${path.basename(dst)} kopyalanması bekleniyor (${i}/${maxRetries})...`);
      sleep(delayMs);
    }
  }
}

function getAsarHeaderSha256(asarPath) {
  const fd = fs.openSync(asarPath, 'r');
  const sizeBuf = Buffer.alloc(16);
  fs.readSync(fd, sizeBuf, 0, 16, 0);
  const headerSize = sizeBuf.readUInt32LE(12);
  const headerBuf = Buffer.alloc(headerSize);
  fs.readSync(fd, headerBuf, 0, headerSize, 16);
  fs.closeSync(fd);
  return crypto.createHash('sha256').update(headerBuf).digest('hex');
}

console.log('===========================================================');
console.log('       Grok Bot System Tray Patcher - by @gmzoztr          ');
console.log('===========================================================');

if (!fs.existsSync(ASAR_TARGET) || !fs.existsSync(EXE_TARGET)) {
  console.error(`[HATA] Grok Bot dizini bulunamadı: ${APP_DIR}`);
  console.error('Lütfen Grok Bot uygulamasının kurulu olduğundan emin olun.');
  process.exit(1);
}

// 1. Çalışan süreçleri kapat
console.log('\n[1/7] Çalışan Grok Bot süreçleri kapatılıyor...');
try {
  execSync('taskkill /F /IM "Grok Bot.exe" /T 2>nul', { stdio: 'ignore' });
  execSync('taskkill /F /IM "GrokBotTray.exe" /T 2>nul', { stdio: 'ignore' });
} catch (e) {}
sleep(1500);

// 2. Orijinal dosyaların ilk yedeğini al (geri alma işlemi için)
console.log('[2/7] Orijinal dosya yedekleri kontrol ediliyor...');
if (!fs.existsSync(ASAR_BACKUP)) {
  fs.copyFileSync(ASAR_TARGET, ASAR_BACKUP);
  console.log('  -> app.asar.original oluşturuldu.');
}
if (!fs.existsSync(EXE_BACKUP)) {
  fs.copyFileSync(EXE_TARGET, EXE_BACKUP);
  console.log('  -> Grok Bot.exe.original oluşturuldu.');
}

// 3. Yardımcı tepsi dosyalarını kopyala
console.log('[3/7] Tepsi yardımcısı (GrokBotTray) kopyalanıyor...');
if (fs.existsSync(TRAY_EXE_SRC)) {
  copyFileWithRetry(TRAY_EXE_SRC, TRAY_EXE_DST);
} else {
  console.error(`[UYARI] ${TRAY_EXE_SRC} bulunamadı!`);
}
if (fs.existsSync(TRAY_PNG_SRC)) {
  copyFileWithRetry(TRAY_PNG_SRC, TRAY_PNG_DST);
}

// 4. app.asar ayıkla
console.log('[4/7] app.asar paketi ayıklanıyor...');
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}
execSync(`npx @electron/asar extract "${ASAR_TARGET}" "${TEMP_DIR}"`, { stdio: 'inherit' });

// 5. main-core.cjs dosyasını incele ve değişken isimlerini dinamik olarak tespit et
console.log('[5/7] JavaScript çekirdek kodu dinamik olarak analiz ediliyor...');
const mainCorePath = path.join(TEMP_DIR, 'dist', 'electron-main', 'main-core.cjs');
if (!fs.existsSync(mainCorePath)) {
  console.error('[HATA] main-core.cjs dosyası bulunamadı!');
  process.exit(1);
}

let code = fs.readFileSync(mainCorePath, 'utf8');

// Varsa önceki yamaları temizle (idempotent temizlik)
while (code.includes('__gb_isQuitting')) {
  code = code.replace(/(\.on\("closed",\(\)=>\{[a-zA-Z0-9_$]+\.markRendererNotReady\(\)\}\);)[\s\S]*?setTimeout\(__gb_startHelper,\s*1500\);/, '$1');
}

// Minified pattern arama: örn: Ch.watchRenderer(l.webContents),l.on("closed",()=>{Ch.markRendererNotReady()});
const anchorRegex = /([a-zA-Z0-9_$]+)\.watchRenderer\(([a-zA-Z0-9_$]+)\.webContents\),\2\.on\("closed",\(\)=>\{\1\.markRendererNotReady\(\)\}\);/;
const match = anchorRegex.exec(code);

if (!match) {
  console.error('[HATA] watchRenderer deseni main-core.cjs içinde bulunamadı!');
  console.error('Grok Bot mimarisinde büyük bir değişiklik olmuş olabilir.');
  process.exit(1);
}

const fullAnchor = match[0];
const rendererWatcherVar = match[1];
const windowVar = match[2];
console.log(`  -> Değişkenler tespit edildi: Pencere="${windowVar}", İzleyici="${rendererWatcherVar}"`);

const trayPatch = `${fullAnchor}
let __gb_isQuitting = false, __gb_hasShownBalloon = false, __gb_helperProc = null;
const __gb_electron = require("electron");
const __gb_net = require("node:net");
const __gb_pipeName = "\\\\\\\\.\\\\pipe\\\\grokbot_tray_pipe";

const __gb_showWindow = () => {
  if (${windowVar} && !${windowVar}.isDestroyed()) {
    if (${windowVar}.isMinimized()) ${windowVar}.restore();
    ${windowVar}.show();
    ${windowVar}.focus();
  }
};

__gb_electron.app.on("second-instance", () => {
  __gb_showWindow();
});

__gb_electron.app.on("before-quit", () => {
  __gb_isQuitting = true;
  try { if (__gb_server) __gb_server.close(); } catch(__e) {}
  if (__gb_helperProc) {
    try { __gb_helperProc.kill(); } catch(__e) {}
    __gb_helperProc = null;
  }
});

${windowVar}.on("close", (e) => {
  if (!__gb_isQuitting) {
    e.preventDefault();
    ${windowVar}.hide();
    if (!__gb_hasShownBalloon) {
      __gb_hasShownBalloon = true;
      try {
        const bConn = __gb_net.connect(__gb_pipeName + "_balloon", () => {});
        bConn.on("error", () => {});
      } catch(__e) {}
    }
    return false;
  }
});

let __gb_server = null;
try {
  __gb_server = __gb_net.createServer((socket) => {
    socket.on("data", (buf) => {
      const cmd = buf.toString().trim();
      if (cmd === "SHOW") {
        __gb_showWindow();
      } else if (cmd === "QUIT") {
        __gb_isQuitting = true;
        __gb_electron.app.quit();
      }
    });
    socket.on("error", () => {});
  });
  __gb_server.on("error", () => {});
  __gb_server.listen(__gb_pipeName);
} catch(__e) {}

function __gb_startHelper() {
  try {
    const __gb_cp = require("node:child_process");
    const __gb_path = require("node:path");
    const __gb_helperPath = __gb_path.join(process.resourcesPath, "GrokBotTray.exe");
    if (!require("node:fs").existsSync(__gb_helperPath)) return;
    __gb_helperProc = __gb_cp.spawn(__gb_helperPath, [String(process.pid), "grokbot_tray_pipe"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    __gb_helperProc.unref();
  } catch(__e) {}
}
setTimeout(__gb_startHelper, 1500);`;

code = code.replace(fullAnchor, trayPatch);
fs.writeFileSync(mainCorePath, code, 'utf8');
console.log('  -> Çekirdek koda sistem tepsisi özellikleri enjekte edildi.');

// 6. asar paketle ve bütünlük hashini güncelle
console.log('[6/7] Yeni app.asar paketleniyor...');
const packCmd = `npx @electron/asar pack "${TEMP_DIR}" "${TEMP_ASAR}" --unpack "*onepassword*" --unpack-dir "{dist/deps,dist/native}"`;
execSync(packCmd, { stdio: 'inherit' });

const newHeaderHash = getAsarHeaderSha256(TEMP_ASAR);
console.log(`  -> Yeni Hash: ${newHeaderHash}`);

let exeBuf = fs.readFileSync(EXE_TARGET);
const fusePrefix = '"resources\\\\app.asar","alg":"SHA256","value":"';
const prefixPos = exeBuf.indexOf(fusePrefix, 0, 'ascii');
if (prefixPos === -1) {
  console.error('[HATA] Electron fuse başlığı Grok Bot.exe içinde bulunamadı!');
  process.exit(1);
}
const hashPos = prefixPos + fusePrefix.length;
console.log(`  -> Grok Bot.exe içinde imza güncelleniyor (Offset: ${hashPos})...`);
exeBuf.write(newHeaderHash, hashPos, 'ascii');
writeFileWithRetry(EXE_TARGET, exeBuf);

copyFileWithRetry(TEMP_ASAR, ASAR_TARGET);

// Geçici dosyaları temizle
try {
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  if (fs.existsSync(TEMP_ASAR)) fs.unlinkSync(TEMP_ASAR);
} catch(e) {}

// 7. V8 önbelleği temizle
console.log('[7/7] V8 kod önbelleği temizleniyor...');
if (fs.existsSync(V8_CACHE_DIR)) {
  const files = fs.readdirSync(V8_CACHE_DIR);
  for (const f of files) {
    if (f.startsWith('main-core-')) {
      try { fs.unlinkSync(path.join(V8_CACHE_DIR, f)); } catch(e) {}
    }
  }
}

console.log('\n===========================================================');
console.log('  [BAŞARILI] Grok Bot sistem tepsisi yaması tamamlandı!');
console.log('  Artık çarpıya (X) bastığınızda sağ alta küçülecektir.');
console.log('===========================================================');
