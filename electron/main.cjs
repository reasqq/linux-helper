const { app, BrowserWindow, shell, session } = require('electron');
const path = require('node:path');

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 920,
    minHeight: 650,
    backgroundColor: '#0c1222',
    title: 'Linux Helper',
    icon: path.join(__dirname, '../assets/icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const target = new URL(url);
      const trustedHosts = new Set([
        'github.com', 'www.pravo.gov.ru', 'www.consultant.ru', 'mintrud.gov.ru',
        'publication.pravo.gov.ru', 'csrc.nist.gov', 'owasp.org', 'asvs.owasp.org',
        'www.iso.org', 'eur-lex.europa.eu', 'www.legislation.gov.uk', 'uscode.house.gov',
      ]);
      if (target.protocol === 'https:' && trustedHosts.has(target.hostname)) shell.openExternal(url);
    } catch { /* Ignore malformed links. */ }
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event) => event.preventDefault());

  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
