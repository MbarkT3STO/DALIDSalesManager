import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ExcelHandler, Sale } from './excel-handler';

let mainWindow: BrowserWindow | null = null;
let excelHandler: ExcelHandler | null = null;

function createWindow(): void {
  // Create main window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    title: 'Daily Sales Tracker',
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

// IPC Handlers
ipcMain.handle('open-workbook', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Open Excel Workbook',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: 'No file selected' };
    }

    const filePath = result.filePaths[0];
    excelHandler = new ExcelHandler(filePath);
    await excelHandler.ensureWorkbook();

    return { success: true, path: filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('create-workbook', async () => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Create New Workbook',
      defaultPath: 'daily-sales-data.xlsx',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'No file selected' };
    }

    const filePath = result.filePath;
    excelHandler = new ExcelHandler(filePath);
    await excelHandler.ensureWorkbook();

    return { success: true, path: filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('use-default-workbook', async () => {
  try {
    const defaultPath = path.join(app.getPath('userData'), 'daily-sales-data.xlsx');
    excelHandler = new ExcelHandler(defaultPath);
    await excelHandler.ensureWorkbook();

    return { success: true, path: defaultPath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('load-workbook', async (event, workbookPath: string) => {
  try {
    if (!workbookPath) {
      return { success: false, message: 'No workbook path provided' };
    }

    excelHandler = new ExcelHandler(workbookPath);
    await excelHandler.ensureWorkbook();

    return { success: true, path: workbookPath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('read-workbook', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const data = await excelHandler.readWorkbook();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('add-sale', async (event, sale: Sale) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.addSale(sale);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-sale', async (event, saleId: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.deleteSale(saleId);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-daily-sales-report', async (event, date: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const report = await excelHandler.getDailySalesReport(date);
    return { success: true, report };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-workbook-path', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    return { success: true, path: excelHandler.getWorkbookPath() };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});