"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const electron_1 = require("electron");
// Create the API object
const api = {
    openWorkbook: () => electron_1.ipcRenderer.invoke('open-workbook'),
    createWorkbook: () => electron_1.ipcRenderer.invoke('create-workbook'),
    useDefaultWorkbook: () => electron_1.ipcRenderer.invoke('use-default-workbook'),
    loadWorkbook: (path) => electron_1.ipcRenderer.invoke('load-workbook', path),
    readWorkbook: () => electron_1.ipcRenderer.invoke('read-workbook'),
    addSale: (sale) => electron_1.ipcRenderer.invoke('add-sale', sale),
    deleteSale: (saleId) => electron_1.ipcRenderer.invoke('delete-sale', saleId),
    getDailySalesReport: (date) => electron_1.ipcRenderer.invoke('get-daily-sales-report', date),
    getWorkbookPath: () => electron_1.ipcRenderer.invoke('get-workbook-path'),
    navigateToMainApp: () => electron_1.ipcRenderer.invoke('navigate-to-main-app'),
    getAppSettings: () => electron_1.ipcRenderer.invoke('get-app-settings'),
    saveSettings: (settings) => electron_1.ipcRenderer.invoke('save-settings', settings),
    exportSalesCSV: () => electron_1.ipcRenderer.invoke('export-sales-csv'),
    exportSalesExcel: () => electron_1.ipcRenderer.invoke('export-sales-excel'),
    exportReportToPDF: (report, date) => electron_1.ipcRenderer.invoke('export-report-to-pdf', report, date),
    openSecretWindow: () => electron_1.ipcRenderer.invoke('open-secret-window'),
    generateSampleData: (recordsPerDay) => electron_1.ipcRenderer.invoke('generate-sample-data', recordsPerDay)
};
exports.api = api;
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
//# sourceMappingURL=electron-preload.js.map