import { app, BrowserWindow, ipcMain, dialog, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ExcelHandler, Product, Customer, Invoice, Payment, User } from './excel-handler';
import { ExportHandler } from './export-handler';

let mainWindow: BrowserWindow | null = null;
let excelHandler: ExcelHandler | null = null;

function createWindow(): void {
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
    backgroundColor: '#f5f5f5'
  });

  // Load login page first
  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/login.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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

ipcMain.handle('add-product', async (event, product: Product) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    await excelHandler.addProduct(product);
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
ipcMain.handle('export-invoice-pdf', async (event, invoice: Invoice) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export Invoice to PDF',
      defaultPath: `invoice-${invoice.invoiceId}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Export cancelled' };
    }

    await ExportHandler.exportInvoiceToPDF(invoice, result.filePath);
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

// Currency conversion handler
ipcMain.handle('convert-currency', async (event, amount: number, fromCurrency: string, toCurrency: string) => {
  try {
    const convertedAmount = ExportHandler.convertCurrency(amount, fromCurrency, toCurrency);
    return { success: true, amount: convertedAmount };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// User Management handlers
ipcMain.handle('authenticate-user', async (event, username: string, password: string) => {
  try {
    if (!excelHandler) {
      return { success: false, message: 'No workbook loaded' };
    }

    const user = await excelHandler.authenticateUser(username, password);
    if (user) {
      return { success: true, user };
    } else {
      return { success: false, message: 'Invalid credentials' };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

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
