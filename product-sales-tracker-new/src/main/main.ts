import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create main window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    title: 'Product Sales Tracker',
    backgroundColor: '#f8fafc'
  });

  // Remove the default menu
  Menu.setApplicationMenu(null);

  // Load main application
  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Remove menu for all platforms including macOS
  Menu.setApplicationMenu(null);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Simple IPC handlers for testing
ipcMain.handle('test-connection', async () => {
  return { success: true, message: 'Connection successful' };
});