import { contextBridge, ipcRenderer } from 'electron';
// Create the API object
const api = {
    openWorkbook: () => ipcRenderer.invoke('open-workbook'),
    createWorkbook: () => ipcRenderer.invoke('create-workbook'),
    useDefaultWorkbook: () => ipcRenderer.invoke('use-default-workbook'),
    loadWorkbook: (path) => ipcRenderer.invoke('load-workbook', path),
    readWorkbook: () => ipcRenderer.invoke('read-workbook'),
    addSale: (sale) => ipcRenderer.invoke('add-sale', sale),
    deleteSale: (saleId) => ipcRenderer.invoke('delete-sale', saleId),
    getDailySalesReport: (date) => ipcRenderer.invoke('get-daily-sales-report', date),
    getWorkbookPath: () => ipcRenderer.invoke('get-workbook-path'),
    navigateToMainApp: () => ipcRenderer.invoke('navigate-to-main-app'),
    getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
    exportSalesCSV: () => ipcRenderer.invoke('export-sales-csv'),
    exportSalesExcel: () => ipcRenderer.invoke('export-sales-excel'),
    openSecretWindow: () => ipcRenderer.invoke('open-secret-window'),
    generateSampleData: (recordsPerDay) => ipcRenderer.invoke('generate-sample-data', recordsPerDay)
};
// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);
// Export for TypeScript type checking
export { api };
//# sourceMappingURL=electron-preload.js.map