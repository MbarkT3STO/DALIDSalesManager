import { contextBridge, ipcRenderer } from 'electron';
// Create the API object
const api = {
    openWorkbook: () => ipcRenderer.invoke('open-workbook'),
    createWorkbook: () => ipcRenderer.invoke('create-workbook'),
    useDefaultWorkbook: () => ipcRenderer.invoke('use-default-workbook'),
    readWorkbook: () => ipcRenderer.invoke('read-workbook'),
    addSale: (sale) => ipcRenderer.invoke('add-sale', sale),
    deleteSale: (saleId) => ipcRenderer.invoke('delete-sale', saleId),
    getDailySalesReport: (date) => ipcRenderer.invoke('get-daily-sales-report', date),
    getWorkbookPath: () => ipcRenderer.invoke('get-workbook-path')
};
// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);
// Export for TypeScript type checking
export { api };
//# sourceMappingURL=electron-preload.js.map