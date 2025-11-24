"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const excel_handler_1 = require("./excel-handler");
// Disable network features for offline operation
electron_1.app.commandLine.appendSwitch('no-proxy-server');
electron_1.app.commandLine.appendSwitch('disable-http-cache');
electron_1.app.commandLine.appendSwitch('disable-web-security', 'false'); // Keep web security enabled
let mainWindow = null;
let excelHandler = null;
function createWindow() {
    // Create main window
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        title: 'Daily Sales Tracker',
        backgroundColor: '#f8fafc',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron-preload.js'),
            // Disable web security features that might access network
            webSecurity: true, // Keep enabled for security
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            // Disable network-related features
            partition: 'persist:offline',
        }
    });
    // Remove the default menu
    electron_1.Menu.setApplicationMenu(null);
    // Load login page first
    mainWindow.loadFile(path.join(__dirname, '../../renderer/login.html'));
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    // Remove menu for all platforms including macOS
    electron_1.Menu.setApplicationMenu(null);
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC Handlers
electron_1.ipcMain.handle('open-workbook', async () => {
    try {
        const result = await electron_1.dialog.showOpenDialog({
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
        excelHandler = new excel_handler_1.ExcelHandler(filePath);
        await excelHandler.ensureWorkbook();
        return { success: true, path: filePath };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
electron_1.ipcMain.handle('create-workbook', async () => {
    try {
        const result = await electron_1.dialog.showSaveDialog({
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
        excelHandler = new excel_handler_1.ExcelHandler(filePath);
        await excelHandler.ensureWorkbook();
        return { success: true, path: filePath };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
electron_1.ipcMain.handle('use-default-workbook', async () => {
    try {
        const defaultPath = path.join(electron_1.app.getPath('userData'), 'daily-sales-data.xlsx');
        excelHandler = new excel_handler_1.ExcelHandler(defaultPath);
        await excelHandler.ensureWorkbook();
        return { success: true, path: defaultPath };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
electron_1.ipcMain.handle('load-workbook', async (event, workbookPath) => {
    try {
        if (!workbookPath) {
            return { success: false, message: 'No workbook path provided' };
        }
        excelHandler = new excel_handler_1.ExcelHandler(workbookPath);
        await excelHandler.ensureWorkbook();
        return { success: true, path: workbookPath };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
electron_1.ipcMain.handle('read-workbook', async () => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        const data = await excelHandler.readWorkbook();
        return { success: true, data };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
electron_1.ipcMain.handle('add-sale', async (event, sale) => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        await excelHandler.addSale(sale);
        return { success: true };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
electron_1.ipcMain.handle('delete-sale', async (event, saleId) => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        await excelHandler.deleteSale(saleId);
        return { success: true };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
electron_1.ipcMain.handle('get-daily-sales-report', async (event, date) => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        const report = await excelHandler.getDailySalesReport(date);
        return { success: true, report };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
// IPC handler to export daily sales report to PDF
electron_1.ipcMain.handle('export-report-to-pdf', async (event, report, date) => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        const result = await excelHandler.exportReportToPDF(report, date);
        return result;
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
electron_1.ipcMain.handle('get-workbook-path', async () => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        return { success: true, path: excelHandler.getWorkbookPath() };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
// New IPC handler to navigate to main app after login
electron_1.ipcMain.handle('navigate-to-main-app', async () => {
    if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
        return { success: true };
    }
    return { success: false, message: 'Main window not available' };
});
// IPC handler to get app settings
electron_1.ipcMain.handle('get-app-settings', async () => {
    try {
        const settingsPath = path.join(electron_1.app.getPath('userData'), 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            return { success: true, settings };
        }
        return { success: false, message: 'No settings file found' };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
// IPC handler to save app settings
electron_1.ipcMain.handle('save-settings', async (event, settings) => {
    try {
        const settingsPath = path.join(electron_1.app.getPath('userData'), 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return { success: true };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
// IPC handler to open secret window
electron_1.ipcMain.handle('open-secret-window', async () => {
    try {
        // Create secret window
        const secretWindow = new electron_1.BrowserWindow({
            width: 800,
            height: 600,
            minWidth: 600,
            minHeight: 500,
            title: 'Secret Administration Panel',
            backgroundColor: '#f8fafc',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'electron-preload.js'),
                // Disable web security features that might access network
                webSecurity: true, // Keep enabled for security
                allowRunningInsecureContent: false,
                experimentalFeatures: false,
                // Disable network-related features
                partition: 'persist:offline',
            }
        });
        // Load secret window HTML
        secretWindow.loadFile(path.join(__dirname, '../../renderer/secret-window.html'));
        // Handle window close
        secretWindow.on('closed', () => {
            // Clean up if needed
        });
        return { success: true };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
// IPC handler to generate sample data
electron_1.ipcMain.handle('generate-sample-data', async (event, recordsPerDay) => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        const result = await excelHandler.generateSampleData(recordsPerDay);
        return result;
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
// Helper function to export sales to CSV
async function exportSalesToCSV(sales, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            // CSV headers
            const headers = ['Date', 'SaleID', 'Product', 'Quantity', 'UnitPrice', 'Total', 'Profit', 'BuyPrice'];
            // Create CSV rows
            const csvRows = [];
            // Add headers
            csvRows.push(headers.join(','));
            // Add data rows
            sales.forEach(sale => {
                const values = [
                    `"${sale.date}"`,
                    `"${sale.saleId}"`,
                    `"${sale.productName}"`,
                    sale.quantity,
                    sale.unitPrice,
                    sale.total,
                    sale.profit,
                    sale.buyPrice || 0
                ];
                csvRows.push(values.join(','));
            });
            fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
            resolve();
        }
        catch (error) {
            reject(error);
        }
    });
}
// IPC handler to export sales data to CSV
electron_1.ipcMain.handle('export-sales-csv', async () => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        // Show save dialog
        const result = await electron_1.dialog.showSaveDialog({
            title: 'Export Sales Data to CSV',
            defaultPath: 'sales-data.csv',
            filters: [
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });
        if (result.canceled || !result.filePath) {
            return { success: false, message: 'Export cancelled' };
        }
        const outputPath = result.filePath;
        // Get sales data
        const { sales } = await excelHandler.readWorkbook();
        // Export to CSV
        await exportSalesToCSV(sales, outputPath);
        return { success: true, path: outputPath, message: 'Sales data exported to CSV successfully' };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
// IPC handler to export sales data to Excel
electron_1.ipcMain.handle('export-sales-excel', async () => {
    try {
        if (!excelHandler) {
            return { success: false, message: 'No workbook loaded' };
        }
        // Show save dialog
        const result = await electron_1.dialog.showSaveDialog({
            title: 'Export Sales Data to Excel',
            defaultPath: 'sales-data.xlsx',
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] }
            ]
        });
        if (result.canceled || !result.filePath) {
            return { success: false, message: 'Export cancelled' };
        }
        const outputPath = result.filePath;
        // Get sales data
        const { sales } = await excelHandler.readWorkbook();
        // Export to Excel
        await excelHandler.exportToExcel(sales, outputPath);
        return { success: true, path: outputPath, message: 'Sales data exported to Excel successfully' };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
});
//# sourceMappingURL=main.js.map