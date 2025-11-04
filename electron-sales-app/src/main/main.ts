import { app, BrowserWindow, ipcMain, dialog, Notification, Menu, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { ExcelHandler, Product, Customer, Invoice, Payment, User, Account, JournalEntry, Sale } from './excel-handler';
import { ExportHandler } from './export-handler';
import { GDPRHandler } from './gdpr-handler';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let excelHandler: ExcelHandler | null = null;
let gdprHandler: GDPRHandler | null = null;
let secretWindow: BrowserWindow | null = null;

// Performance optimization: Cache for expensive operations
const operationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCached<T>(key: string): T | null {
  const cached = operationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  operationCache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  operationCache.set(key, { data, timestamp: Date.now() });
  // Limit cache size
  if (operationCache.size > 100) {
    const firstKey = operationCache.keys().next().value;
    if (firstKey) {
      operationCache.delete(firstKey);
    }
  }
}

function invalidateCache(pattern?: string) {
  if (!pattern) {
    operationCache.clear();
  } else {
    for (const key of operationCache.keys()) {
      if (key.includes(pattern)) {
        operationCache.delete(key);
      }
    }
  }
}

// Debounce helper for file operations
const pendingOperations = new Map<string, NodeJS.Timeout>();
function debounceOperation(key: string, operation: () => Promise<any>, delay: number = 100): Promise<any> {
  return new Promise((resolve, reject) => {
    const existing = pendingOperations.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timeout = setTimeout(async () => {
      pendingOperations.delete(key);
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
    pendingOperations.set(key, timeout);
  });
}

// ================= Activation Manager =================
const ACTIVATION_FILE = '.activation.json';
const ACTIVATION_SECRET = 'DALID_SALES_MANAGER_PROD_SECRET_v1';
const ACTIVATION_SIG_SECRET = 'DALID_SALES_MANAGER_SIG_v1';

function getDeviceFingerprint(): string {
  try {
    const nets = os.networkInterfaces();
    const macs: string[] = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') macs.push(net.mac);
      }
    }
    const base = [
      os.hostname(),
      os.platform(),
      os.arch(),
      (os.cpus()?.[0]?.model) || '',
      macs.sort().join('-')
    ].join('|');
    return crypto.createHash('sha256').update(base).digest('hex').toUpperCase();
  } catch {
    return crypto.createHash('sha256').update(os.hostname()).digest('hex').toUpperCase();
  }
}

function expectedActivationKey(deviceId: string): string {
  const raw = crypto.createHmac('sha256', ACTIVATION_SECRET).update(deviceId).digest('hex').toUpperCase();
  // Group into XXXX-XXXX-XXXX-XXXX-XXXX
  return raw.slice(0, 20).match(/.{1,4}/g)!.join('-');
}

function getActivationFilePath(): string {
  return path.join(app.getPath('userData'), ACTIVATION_FILE);
}

function isActivated(): boolean {
  try {
    const p = getActivationFilePath();
    if (!fs.existsSync(p)) return false;
    const raw = fs.readFileSync(p, 'utf-8');
    const data = JSON.parse(raw);
    const deviceId = getDeviceFingerprint();
    const expected = expectedActivationKey(deviceId);
    // verify signature to prevent file copy/tamper
    const body = `${data?.deviceId}|${data?.key}|${data?.activatedAt}`;
    const sig = crypto.createHmac('sha256', ACTIVATION_SIG_SECRET).update(body).digest('hex');
    const valid = data?.deviceId === deviceId && data?.key === expected && data?.sig === sig;
    if (!valid) {
      // Invalidate suspicious file
      try { fs.unlinkSync(p); } catch {}
    }
    return valid;
  } catch {
    return false;
  }
}

function saveActivation(key: string): boolean {
  const deviceId = getDeviceFingerprint();
  const expected = expectedActivationKey(deviceId);
  if (key.replace(/\s/g, '').toUpperCase() === expected.replace(/\s/g, '').toUpperCase()) {
    const activatedAt = new Date().toISOString();
    const body = `${deviceId}|${expected}|${activatedAt}`;
    const sig = crypto.createHmac('sha256', ACTIVATION_SIG_SECRET).update(body).digest('hex');
    const payload = { deviceId, key: expected, activatedAt, sig };
    const filePath = getActivationFilePath();
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    try {
      // tighten permissions where supported
      if (process.platform !== 'win32') fs.chmodSync(filePath, 0o600);
    } catch {}
    return true;
  }
  return false;
}

function createWindow(): void {
  // Create the splash window first
  splashWindow = new BrowserWindow({
    width: 550,
    height: 500,
    transparent: false,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'splash-preload.js')
    },
    title: 'Loading...',
    backgroundColor: '#0f172a'
  });

  // Load splash screen
  splashWindow.loadFile(path.join(__dirname, '../../src/renderer/splash.html'));
  
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
    title: 'Sales Manager',
    backgroundColor: '#f5f5f5',
    show: false // Hide main window until splash is done
  });

  // Remove the default menu
  Menu.setApplicationMenu(null);

  // Show splash window
  splashWindow.once('ready-to-show', () => {
    splashWindow?.show();
    
    // After splash duration, notify splash and show main window
    setTimeout(() => {
      // Notify splash screen that app is ready
      splashWindow?.webContents.send('app-ready');
      
      // Give splash screen time to show completion
      setTimeout(() => {
        // Close splash window
        if (splashWindow) {
          splashWindow.close();
          splashWindow = null;
        }
        
        // Show main window and load content
        mainWindow?.show();
        if (isActivated()) {
          mainWindow?.loadFile(path.join(__dirname, '../../src/renderer/login.html'));
        } else {
          mainWindow?.loadFile(path.join(__dirname, '../../src/renderer/activation.html'));
        }
      }, 1500);
    }, 4000); // Show splash for 4 seconds
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

app.whenReady().then(() => {
  // Remove menu for all platforms including macOS
  Menu.setApplicationMenu(null);
  
  createWindow();

  // Secret shortcut to open activation modal (Command/Ctrl+Shift+A)
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (!mainWindow) return;
    mainWindow.webContents.send('open-activation-modal');
  });

  // NEW: Secret shortcut to open the secret data insertion window (Command/Ctrl+Shift+D)
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    createSecretWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// DevTools opener removed

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
// Activation IPC
ipcMain.handle('get-activation-status', async () => {
  try {
    const deviceId = getDeviceFingerprint();
    return { success: true, activated: isActivated(), deviceId };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('activate-app', async (event, key: string) => {
  try {
    const ok = saveActivation(key);
    if (ok && mainWindow) {
      await mainWindow.loadFile(path.join(__dirname, '../../src/renderer/login.html'));
    }
    return { success: ok, activated: ok };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-activation-key', async () => {
  try {
    const deviceId = getDeviceFingerprint();
    const key = expectedActivationKey(deviceId);
    return { success: true, deviceId, key };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});


// Export a copy of the current workbook
ipcMain.handle('export-workbook-copy', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const sourcePath = excelHandler.getWorkbookPath();
    const defaultName = path.basename(sourcePath) || 'sales-data.xlsx';

    const result = await dialog.showSaveDialog({
      title: 'Save a Copy of Workbook',
      defaultPath: defaultName,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    fs.copyFileSync(sourcePath, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

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
      defaultPath: 'sales-data.xlsx',
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
    const defaultPath = path.join(app.getPath('userData'), 'sales-data.xlsx');
    excelHandler = new ExcelHandler(defaultPath);
    await excelHandler.ensureWorkbook();

    return { success: true, path: defaultPath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('use-workbook', async (event, filePath: string) => {
  try {
    if (!filePath) {
      return { success: false, message: 'Invalid path' };
    }
    excelHandler = new ExcelHandler(filePath);
    await excelHandler.ensureWorkbook();
    return { success: true, path: filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('read-workbook', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    // Check cache first
    const cacheKey = 'workbook-data';
    const cached = getCached(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const data = await excelHandler.readWorkbook();
    setCache(cacheKey, data);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('add-product', async (event, product: Product) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.addProduct(product);
    invalidateCache('workbook'); // Invalidate workbook cache
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('update-product', async (event, oldName: string, product: Product) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.updateProduct(oldName, product);
    invalidateCache('workbook');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-product', async (event, productName: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.deleteProduct(productName);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('restore-product', async (event, productName: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.restoreProduct(productName);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('add-customer', async (event, customer: Customer) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.addCustomer(customer);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('update-customer', async (event, oldName: string, customer: Customer) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.updateCustomer(oldName, customer);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-customer', async (event, customerName: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.deleteCustomer(customerName);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('save-invoice', async (event, invoice: Invoice) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.saveInvoice(invoice);
    invalidateCache('workbook');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('update-invoice-status', async (event, invoiceId: string, status: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.updateInvoiceStatus(invoiceId, status);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-sheet', async (event, sheetName: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const result = await dialog.showSaveDialog({
      title: `Export ${sheetName} Sheet`,
      defaultPath: `${sheetName.toLowerCase()}-export.xlsx`,
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'CSV Files', extensions: ['csv'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export canceled' };
    }

    await excelHandler.exportSheet(sheetName, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('print-invoice', async (event, html: string) => {
  try {
    if (!mainWindow) {
      return { success: false, message: 'No window available' };
    }

    // Create a hidden window for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Print or save as PDF
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Print', 'Save as PDF', 'Cancel'],
      defaultId: 0,
      title: 'Print Invoice',
      message: 'How would you like to output the invoice?'
    });

    if (result.response === 0) {
      // Print
      await printWindow.webContents.print({});
      printWindow.close();
      return { success: true, action: 'printed' };
    } else if (result.response === 1) {
      // Save as PDF
      const saveResult = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Invoice as PDF',
        defaultPath: 'invoice.pdf',
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      });

      if (!saveResult.canceled && saveResult.filePath) {
        const data = await printWindow.webContents.printToPDF({});
        fs.writeFileSync(saveResult.filePath, data);
        printWindow.close();
        return { success: true, action: 'saved', path: saveResult.filePath };
      }
    }

    printWindow.close();
    return { success: false, message: 'Print canceled' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('add-inventory-movement', async (event, movement: any) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.addInventoryMovement(movement);
    return { success: true };
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

ipcMain.handle('show-message', async (event, options: { type: string; title: string; message: string }) => {
  try {
    if (!mainWindow) {
      return { success: false };
    }

    await dialog.showMessageBox(mainWindow, {
      type: options.type as any,
      title: options.title,
      message: options.message
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('show-confirm', async (event, options: { title: string; message: string }) => {
  try {
    if (!mainWindow) {
      return { success: false, confirmed: false };
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: options.title,
      message: options.message
    });

    return { success: true, confirmed: result.response === 0 };
  } catch (error: any) {
    return { success: false, confirmed: false, message: error.message };
  }
});

// Payment handlers
ipcMain.handle('add-payment', async (event, payment: Payment) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.addPayment(payment);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-payments-by-invoice', async (event, invoiceId: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const payments = await excelHandler.getPaymentsByInvoice(invoiceId);
    return { success: true, payments };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Stock alert handlers
ipcMain.handle('get-low-stock-products', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const products = await excelHandler.getLowStockProducts();
    return { success: true, products };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('show-notification', async (event, options: { title: string; body: string }) => {
  try {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: options.title,
        body: options.body
      });
      notification.show();
      return { success: true };
    }
    return { success: false, message: 'Notifications not supported' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Export and Print handlers
ipcMain.handle('export-invoice-pdf', async (event, invoice: Invoice, style: 'classical' | 'modern' | 'blackwhite' = 'classical') => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export Invoice to PDF',
      defaultPath: `invoice-${invoice.invoiceId}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    // For complete consistency with view/print, we should generate HTML and convert to PDF
    // However, since the HTML generation logic is in the renderer process, we'll need to
    // either duplicate it here or refactor it into a shared module
    // For now, we'll keep the existing PDF export but note this limitation
    await ExportHandler.exportInvoiceToPDF(invoice, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// ============= Accounting IPC Handlers =============
ipcMain.handle('acc-list-accounts', async () => {
  try {
    if (!excelHandler) return { success: false, message: 'No workbook loaded' };
    const accounts = await excelHandler.listAccounts();
    return { success: true, accounts };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('acc-add-account', async (event, account: Account) => {
  try {
    if (!excelHandler) return { success: false, message: 'No workbook loaded' };
    await excelHandler.addAccount(account);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('acc-update-account', async (event, code: string, account: Account) => {
  try {
    if (!excelHandler) return { success: false, message: 'No workbook loaded' };
    await excelHandler.updateAccount(code, account);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('acc-add-journal-entry', async (event, entry: JournalEntry) => {
  try {
    if (!excelHandler) return { success: false, message: 'No workbook loaded' };
    await excelHandler.addJournalEntry(entry);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('acc-get-trial-balance', async (event, startDate?: string, endDate?: string) => {
  try {
    if (!excelHandler) return { success: false, message: 'No workbook loaded' };
    const data = await excelHandler.getTrialBalance(startDate, endDate);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('acc-get-income-statement', async (event, startDate?: string, endDate?: string) => {
  try {
    if (!excelHandler) return { success: false, message: 'No workbook loaded' };
    const report = await excelHandler.getIncomeStatement(startDate, endDate);
    return { success: true, report };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('acc-get-balance-sheet', async (event, asOfDate?: string) => {
  try {
    if (!excelHandler) return { success: false, message: 'No workbook loaded' };
    const report = await excelHandler.getBalanceSheet(asOfDate);
    return { success: true, report };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Accounting exports: CSV
ipcMain.handle('acc-export-csv', async (event, defaultFileName: string, csvContent: string) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export CSV',
      defaultPath: defaultFileName,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    if (result.canceled || !result.filePath) return { success: false, message: 'Export cancelled' };
    fs.writeFileSync(result.filePath, csvContent, 'utf8');
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Generic HTML to PDF export
ipcMain.handle('export-html-to-pdf', async (event, html: string, defaultFileName: string) => {
  try {
    const win = new BrowserWindow({ 
      show: false, 
      webPreferences: { 
        nodeIntegration: false, 
        contextIsolation: true,
        offscreen: true
      } 
    });
    
    // Wait for the page to be fully loaded before generating PDF
    const loadPromise = new Promise<void>((resolve) => {
      win.webContents.on('did-finish-load', () => {
        // Wait for all resources to be loaded
        setTimeout(() => resolve(), 1000);
      });
    });
    
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await loadPromise;
    
    const result = await dialog.showSaveDialog({
      title: 'Export to PDF',
      defaultPath: defaultFileName,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });
    if (result.canceled || !result.filePath) { win.close(); return { success: false, message: 'Export cancelled' }; }
    
    // Use printToPDF with options to preserve background graphics
    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4'
    });
    
    fs.writeFileSync(result.filePath, pdfBuffer);
    win.close();
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-analytics-pdf', async (event, analyticsData: any) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const result = await dialog.showSaveDialog({
      title: 'Export Analytics to PDF',
      defaultPath: `analytics-report-${timestamp}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    await ExportHandler.exportAnalyticsToPDF(analyticsData, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-customer-history-pdf', async (event, data: any) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const customerNameSafe = data.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const result = await dialog.showSaveDialog({
      title: 'Export Customer History to PDF',
      defaultPath: `customer-history-${customerNameSafe}-${timestamp}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    await ExportHandler.exportCustomerHistoryPDF(result.filePath, data);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-customer-history-excel', async (event, data: any) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const customerNameSafe = data.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const result = await dialog.showSaveDialog({
      title: 'Export Customer History to Excel',
      defaultPath: `customer-history-${customerNameSafe}-${timestamp}.xlsx`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    await excelHandler.exportCustomerHistoryExcel(result.filePath, data);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-products-csv', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const result = await dialog.showSaveDialog({
      title: 'Export Products to CSV',
      defaultPath: 'products.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    const data = await excelHandler.readWorkbook();
    await ExportHandler.exportProductsToCSV(data.products, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-customers-csv', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const result = await dialog.showSaveDialog({
      title: 'Export Customers to CSV',
      defaultPath: 'customers.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    const data = await excelHandler.readWorkbook();
    await ExportHandler.exportCustomersToCSV(data.customers, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-sales-csv', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const result = await dialog.showSaveDialog({
      title: 'Export Sales to CSV',
      defaultPath: 'sales.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    const data = await excelHandler.readWorkbook();
    await ExportHandler.exportSalesToCSV(data.sales, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-invoices-csv', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const result = await dialog.showSaveDialog({
      title: 'Export Invoices to CSV',
      defaultPath: 'invoices.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    const data = await excelHandler.readWorkbook();
    await ExportHandler.exportInvoicesToCSV(data.invoices, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-all-csv', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const result = await dialog.showOpenDialog({
      title: 'Select Export Directory',
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: 'Export cancelled' };
    }

    const data = await excelHandler.readWorkbook();
    await ExportHandler.exportAllDataToCSV(data, result.filePaths[0]);
    return { success: true, path: result.filePaths[0] };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}); 

ipcMain.handle('print-invoice-pdf', async (event, invoice: Invoice) => {
  try {
    if (!mainWindow) {
      return { success: false, message: 'No window available' };
    }

    // Create a temporary PDF for printing
    const tempPath = path.join(app.getPath('temp'), `invoice-${invoice.invoiceId}-temp.pdf`);
    await ExportHandler.exportInvoiceToPDF(invoice, tempPath);

    // Open print dialog
    mainWindow.webContents.print({ silent: false, printBackground: true }, (success, errorType) => {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Backup Management Handlers
ipcMain.handle('list-backups', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const backups = await excelHandler.listBackups();
    return { success: true, backups };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('restore-backup', async (event, backupPath: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.restoreBackup(backupPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-backup', async (event, backupPath: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.deleteBackup(backupPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('create-manual-backup', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const backupPath = await excelHandler.createManualBackup();
    return { success: true, path: backupPath };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Currency conversion handler
ipcMain.handle('convert-currency', async (event, amount: number, fromCurrency: string, toCurrency: string) => {
  try {
    const convertedAmount = ExportHandler.convertCurrency(amount, fromCurrency, toCurrency);
    return { success: true, amount: convertedAmount };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Users: list all users
ipcMain.handle('get-users', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const data = await excelHandler.readWorkbook();
    return { success: true, users: data.users };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Users: authenticate
ipcMain.handle('authenticate-user', async (event, username: string, password: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const user = await excelHandler.authenticateUser(username, password);
    return { success: true, user };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('add-user', async (event, user: User) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.addUser(user);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('update-user', async (event, username: string, user: User) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.updateUser(username, user);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-user', async (event, username: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.deleteUser(username);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// GDPR & Audit Handlers

// Initialize GDPR handler when workbook is loaded
ipcMain.on('init-gdpr-handler', () => {
  if (excelHandler && !gdprHandler) {
    gdprHandler = new GDPRHandler(excelHandler);
  }
});

// GDPR: Export customer data
ipcMain.handle('gdpr-export-customer-data', async (event, customerId: string) => {
  try {
    if (!gdprHandler) {
      if (excelHandler) {
        gdprHandler = new GDPRHandler(excelHandler);
      } else {
        return { success: false, message: 'No workbook loaded' };
      }
    }

    const data = await gdprHandler.exportCustomerData(customerId);
    
    // Save to file
    const result = await dialog.showSaveDialog({
      title: 'Export Customer Data (GDPR)',
      defaultPath: `customer-data-${customerId}-${Date.now()}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, path: result.filePath, data };
    }

    return { success: false, message: 'Export cancelled' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// GDPR: Delete customer data (Right to be Forgotten)
ipcMain.handle('gdpr-delete-customer-data', async (event, customerId: string, reason: string, performedBy: string) => {
  try {
    if (!gdprHandler) {
      if (excelHandler) {
        gdprHandler = new GDPRHandler(excelHandler);
      } else {
        return { success: false, message: 'No workbook loaded' };
      }
    }

    const result = await gdprHandler.deleteCustomerData(customerId, reason, performedBy);
    return { success: result };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// GDPR: Record consent
ipcMain.handle('gdpr-record-consent', async (event, consent: any) => {
  try {
    if (!gdprHandler) {
      if (excelHandler) {
        gdprHandler = new GDPRHandler(excelHandler);
      } else {
        return { success: false, message: 'No workbook loaded' };
      }
    }

    gdprHandler.recordConsent(consent);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// GDPR: Get customer consents
ipcMain.handle('gdpr-get-customer-consents', async (event, customerId: string) => {
  try {
    if (!gdprHandler) {
      if (excelHandler) {
        gdprHandler = new GDPRHandler(excelHandler);
      } else {
        return { success: false, message: 'No workbook loaded' };
      }
    }

    const consents = gdprHandler.getCustomerConsents(customerId);
    return { success: true, consents };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Audit: Log action
ipcMain.handle('audit-log', async (event, log: any) => {
  try {
    if (!gdprHandler) {
      if (excelHandler) {
        gdprHandler = new GDPRHandler(excelHandler);
      } else {
        return { success: false, message: 'No workbook loaded' };
      }
    }

    gdprHandler.logAudit(log);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Audit: Get logs
ipcMain.handle('audit-get-logs', async (event, filters: any) => {
  try {
    if (!gdprHandler) {
      if (excelHandler) {
        gdprHandler = new GDPRHandler(excelHandler);
      } else {
        return { success: false, message: 'No workbook loaded' };
      }
    }

    const logs = gdprHandler.getAuditLogs(filters);
    return { success: true, logs };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Audit: Generate report
ipcMain.handle('audit-generate-report', async (event, startDate: string, endDate: string) => {
  try {
    if (!gdprHandler) {
      if (excelHandler) {
        gdprHandler = new GDPRHandler(excelHandler);
      } else {
        return { success: false, message: 'No workbook loaded' };
      }
    }

    const report = await gdprHandler.generateAuditReport(new Date(startDate), new Date(endDate));
    return { success: true, report };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Audit: Export logs
ipcMain.handle('audit-export-logs', async (event, startDate: string, endDate: string, format: 'json' | 'csv') => {
  try {
    if (!gdprHandler) {
      if (excelHandler) {
        gdprHandler = new GDPRHandler(excelHandler);
      } else {
        return { success: false, message: 'No workbook loaded' };
      }
    }

    const data = await gdprHandler.exportAuditLogs(new Date(startDate), new Date(endDate), format);
    
    // Save to file
    const extension = format === 'json' ? 'json' : 'csv';
    const result = await dialog.showSaveDialog({
      title: 'Export Audit Logs',
      defaultPath: `audit-logs-${Date.now()}.${extension}`,
      filters: [{ name: format.toUpperCase() + ' Files', extensions: [extension] }]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, data);
      return { success: true, path: result.filePath };
    }

    return { success: false, message: 'Export cancelled' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Add this function to create the secret window
function createSecretWindow(): void {
  // Close existing secret window if it exists
  if (secretWindow) {
    secretWindow.close();
  }

  secretWindow = new BrowserWindow({
    width: 700,
    height: 600,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    title: 'Secret Data Insertion Tool',
    backgroundColor: '#1e1e1e'
  });

  // Load the secret window HTML file
  secretWindow.loadFile(path.join(__dirname, '../../src/renderer/secret-window.html'));

  secretWindow.on('closed', () => {
    secretWindow = null;
  });
}

// Add this IPC handler for inserting sample data
ipcMain.handle('insert-sample-data', async () => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    // Generate and insert sample data
    const count = await insertSampleData(excelHandler);
    return { success: true, count };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Helper function to generate and insert sample data
async function insertSampleData(handler: ExcelHandler): Promise<number> {
  let insertedCount = 0;
  
  // Sample products
  const sampleProducts: Product[] = [
    { name: 'Laptop Dell XPS 15', quantity: 12, buyPrice: 1200, salePrice: 1800, reorderLevel: 5 },
    { name: 'iPhone 15 Pro', quantity: 20, buyPrice: 999, salePrice: 1399, reorderLevel: 5 },
    { name: 'Samsung Galaxy S24', quantity: 18, buyPrice: 800, salePrice: 1199, reorderLevel: 5 },
    { name: 'iPad Pro 12.9"', quantity: 15, buyPrice: 900, salePrice: 1299, reorderLevel: 5 },
    { name: 'MacBook Air M2', quantity: 10, buyPrice: 1099, salePrice: 1599, reorderLevel: 3 },
    { name: 'AirPods Max', quantity: 25, buyPrice: 450, salePrice: 649, reorderLevel: 8 },
    { name: 'Sony WH-1000XM5', quantity: 30, buyPrice: 280, salePrice: 399, reorderLevel: 10 },
    { name: 'Logitech MX Master 3S', quantity: 40, buyPrice: 70, salePrice: 99, reorderLevel: 15 },
    { name: 'Dell UltraSharp Monitor', quantity: 8, buyPrice: 400, salePrice: 599, reorderLevel: 3 },
    { name: 'Mechanical Gaming Keyboard', quantity: 35, buyPrice: 85, salePrice: 129, reorderLevel: 10 },
    { name: 'Wireless Gaming Mouse', quantity: 50, buyPrice: 45, salePrice: 79, reorderLevel: 15 },
    { name: 'External SSD 1TB', quantity: 22, buyPrice: 120, salePrice: 179, reorderLevel: 8 },
    { name: '4K Webcam', quantity: 17, buyPrice: 150, salePrice: 229, reorderLevel: 5 },
    { name: 'Noise Cancelling Headphones', quantity: 28, buyPrice: 180, salePrice: 279, reorderLevel: 8 },
    { name: 'Smart Watch', quantity: 33, buyPrice: 250, salePrice: 379, reorderLevel: 10 }
  ];

  // Sample customers
  const sampleCustomers: Customer[] = [
    { name: 'John Smith', phone: '555-0101', email: 'john.smith@email.com', address: '123 Main St, New York, NY 10001' },
    { name: 'Sarah Johnson', phone: '555-0102', email: 'sarah.j@email.com', address: '456 Oak Ave, Los Angeles, CA 90001' },
    { name: 'Michael Brown', phone: '555-0103', email: 'mbrown@email.com', address: '789 Pine Rd, Chicago, IL 60601' },
    { name: 'Emily Davis', phone: '555-0104', email: 'emily.davis@email.com', address: '321 Elm St, Houston, TX 77001' },
    { name: 'David Wilson', phone: '555-0105', email: 'dwilson@email.com', address: '654 Maple Dr, Phoenix, AZ 85001' },
    { name: 'Jennifer Martinez', phone: '555-0106', email: 'jmartinez@email.com', address: '987 Cedar Ln, Philadelphia, PA 19101' },
    { name: 'Robert Taylor', phone: '555-0107', email: 'rtaylor@email.com', address: '147 Birch Ct, San Antonio, TX 78201' },
    { name: 'Lisa Anderson', phone: '555-0108', email: 'landerson@email.com', address: '258 Spruce Way, San Diego, CA 92101' },
    { name: 'James Thomas', phone: '555-0109', email: 'jthomas@email.com', address: '369 Willow St, Dallas, TX 75201' },
    { name: 'Patricia Jackson', phone: '555-0110', email: 'pjackson@email.com', address: '741 Poplar Ave, San Jose, CA 95101' }
  ];

  // Insert products
  for (const product of sampleProducts) {
    try {
      await handler.addProduct(product);
      insertedCount++;
    } catch (error) {
      // Product might already exist, continue with others
      console.warn(`Could not add product ${product.name}:`, error);
    }
  }

  // Insert customers
  for (const customer of sampleCustomers) {
    try {
      await handler.addCustomer(customer);
      insertedCount++;
    } catch (error) {
      // Customer might already exist, continue with others
      console.warn(`Could not add customer ${customer.name}:`, error);
    }
  }

  // Generate sample invoices and sales
  const invoicePrefix = 'INV-' + new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
  let invoiceCounter = 1;
  
  // Generate 50 sample invoices
  for (let i = 0; i < 50; i++) {
    const randomCustomer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const invoiceDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    const invoiceId = `${invoicePrefix}-${String(invoiceCounter++).padStart(3, '0')}`;
    
    // Random number of items per invoice (1-5)
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items: Sale[] = [];
    let totalAmount = 0;
    let totalProfit = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const unitPrice = randomProduct.salePrice;
      const total = quantity * unitPrice;
      const profit = quantity * (unitPrice - randomProduct.buyPrice);
      
      items.push({
        date: invoiceDate.toISOString().split('T')[0],
        invoiceId,
        productName: randomProduct.name,
        quantity,
        unitPrice,
        total,
        profit
      });
      
      totalAmount += total;
      totalProfit += profit;
    }
    
    const invoice: Invoice = {
      invoiceId,
      date: invoiceDate.toISOString().split('T')[0],
      customerName: randomCustomer.name,
      totalAmount,
      totalProfit,
      status: Math.random() > 0.3 ? 'Paid' : (Math.random() > 0.5 ? 'Pending' : 'Partial'),
      items
    };
    
    try {
      await handler.saveInvoice(invoice);
      insertedCount += items.length + 1; // +1 for the invoice itself
    } catch (error) {
      console.warn(`Could not save invoice ${invoiceId}:`, error);
    }
  }
  
  return insertedCount;
}
