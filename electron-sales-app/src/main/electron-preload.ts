import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
export interface ElectronAPI {
  openWorkbook: () => Promise<any>;
  createWorkbook: () => Promise<any>;
  useDefaultWorkbook: () => Promise<any>;
  readWorkbook: () => Promise<any>;
  addProduct: (product: any) => Promise<any>;
  updateProduct: (oldName: string, product: any) => Promise<any>;
  deleteProduct: (productName: string) => Promise<any>;
  addCustomer: (customer: any) => Promise<any>;
  updateCustomer: (oldName: string, customer: any) => Promise<any>;
  deleteCustomer: (customerName: string) => Promise<any>;
  saveInvoice: (invoice: any) => Promise<any>;
  updateInvoiceStatus: (invoiceId: string, status: string) => Promise<any>;
  addInventoryMovement: (movement: any) => Promise<any>;
  exportSheet: (sheetName: string) => Promise<any>;
  printInvoice: (html: string) => Promise<any>;
  getWorkbookPath: () => Promise<any>;
  showMessage: (options: { type: string; title: string; message: string }) => Promise<any>;
  showConfirm: (options: { title: string; message: string }) => Promise<any>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openWorkbook: () => ipcRenderer.invoke('open-workbook'),
  createWorkbook: () => ipcRenderer.invoke('create-workbook'),
  useDefaultWorkbook: () => ipcRenderer.invoke('use-default-workbook'),
  readWorkbook: () => ipcRenderer.invoke('read-workbook'),
  addProduct: (product: any) => ipcRenderer.invoke('add-product', product),
  updateProduct: (oldName: string, product: any) => ipcRenderer.invoke('update-product', oldName, product),
  deleteProduct: (productName: string) => ipcRenderer.invoke('delete-product', productName),
  addCustomer: (customer: any) => ipcRenderer.invoke('add-customer', customer),
  updateCustomer: (oldName: string, customer: any) => ipcRenderer.invoke('update-customer', oldName, customer),
  deleteCustomer: (customerName: string) => ipcRenderer.invoke('delete-customer', customerName),
  saveInvoice: (invoice: any) => ipcRenderer.invoke('save-invoice', invoice),
  updateInvoiceStatus: (invoiceId: string, status: string) => ipcRenderer.invoke('update-invoice-status', invoiceId, status),
  addInventoryMovement: (movement: any) => ipcRenderer.invoke('add-inventory-movement', movement),
  exportSheet: (sheetName: string) => ipcRenderer.invoke('export-sheet', sheetName),
  printInvoice: (html: string) => ipcRenderer.invoke('print-invoice', html),
  getWorkbookPath: () => ipcRenderer.invoke('get-workbook-path'),
  showMessage: (options: { type: string; title: string; message: string }) => ipcRenderer.invoke('show-message', options),
  showConfirm: (options: { title: string; message: string }) => ipcRenderer.invoke('show-confirm', options)
} as ElectronAPI);
