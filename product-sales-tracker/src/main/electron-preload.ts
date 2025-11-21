import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Sale, DailySalesReport } from '../shared/types';

// Define the API interface
export interface IElectronAPI {
  openWorkbook: () => Promise<{ success: boolean; path?: string; message?: string }>;
  createWorkbook: () => Promise<{ success: boolean; path?: string; message?: string }>;
  useDefaultWorkbook: () => Promise<{ success: boolean; path?: string; message?: string }>;
  loadWorkbook: (path: string) => Promise<{ success: boolean; path?: string; message?: string }>;
  readWorkbook: () => Promise<{ success: boolean; data?: { sales: Sale[] }; message?: string }>;
  addSale: (sale: Sale) => Promise<{ success: boolean; message?: string }>;
  deleteSale: (saleId: string) => Promise<{ success: boolean; message?: string }>;
  getDailySalesReport: (date: string) => Promise<{ success: boolean; report?: DailySalesReport; message?: string }>;
  getWorkbookPath: () => Promise<{ success: boolean; path?: string; message?: string }>;
  navigateToMainApp: () => Promise<{ success: boolean; message?: string }>;
  getAppSettings: () => Promise<{ success: boolean; settings?: any; message?: string }>;
}

// Create the API object
const api: IElectronAPI = {
  openWorkbook: () => ipcRenderer.invoke('open-workbook'),
  createWorkbook: () => ipcRenderer.invoke('create-workbook'),
  useDefaultWorkbook: () => ipcRenderer.invoke('use-default-workbook'),
  loadWorkbook: (path: string) => ipcRenderer.invoke('load-workbook', path),
  readWorkbook: () => ipcRenderer.invoke('read-workbook'),
  addSale: (sale: Sale) => ipcRenderer.invoke('add-sale', sale),
  deleteSale: (saleId: string) => ipcRenderer.invoke('delete-sale', saleId),
  getDailySalesReport: (date: string) => ipcRenderer.invoke('get-daily-sales-report', date),
  getWorkbookPath: () => ipcRenderer.invoke('get-workbook-path'),
  navigateToMainApp: () => ipcRenderer.invoke('navigate-to-main-app'),
  getAppSettings: () => ipcRenderer.invoke('get-app-settings')
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

// Export for TypeScript type checking
export { api };