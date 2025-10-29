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
  addPayment: (payment: any) => Promise<any>;
  getPaymentsByInvoice: (invoiceId: string) => Promise<any>;
  getLowStockProducts: () => Promise<any>;
  showNotification: (options: { title: string; body: string }) => Promise<any>;
  exportInvoicePDF: (invoice: any) => Promise<any>;
  exportAnalyticsPDF: (analyticsData: any) => Promise<any>;
  exportProductsCSV: () => Promise<any>;
  exportCustomersCSV: () => Promise<any>;
  exportSalesCSV: () => Promise<any>;
  exportInvoicesCSV: () => Promise<any>;
  exportAllCSV: () => Promise<any>;
  printInvoicePDF: (invoice: any) => Promise<any>;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => Promise<any>;
  exportWorkbookCopy: () => Promise<any>;
  authenticateUser: (username: string, password: string) => Promise<any>;
  getUsers: () => Promise<any>;
  addUser: (user: any) => Promise<any>;
  updateUser: (username: string, user: any) => Promise<any>;
  deleteUser: (username: string) => Promise<any>;
  // GDPR & Audit
  initGDPRHandler: () => void;
  gdprExportCustomerData: (customerId: string) => Promise<any>;
  gdprDeleteCustomerData: (customerId: string, reason: string, performedBy: string) => Promise<any>;
  gdprRecordConsent: (consent: any) => Promise<any>;
  gdprGetCustomerConsents: (customerId: string) => Promise<any>;
  auditLog: (log: any) => Promise<any>;
  auditGetLogs: (filters: any) => Promise<any>;
  auditGenerateReport: (startDate: string, endDate: string) => Promise<any>;
  auditExportLogs: (startDate: string, endDate: string, format: 'json' | 'csv') => Promise<any>;
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
  showConfirm: (options: { title: string; message: string }) => ipcRenderer.invoke('show-confirm', options),
  addPayment: (payment: any) => ipcRenderer.invoke('add-payment', payment),
  getPaymentsByInvoice: (invoiceId: string) => ipcRenderer.invoke('get-payments-by-invoice', invoiceId),
  getLowStockProducts: () => ipcRenderer.invoke('get-low-stock-products'),
  showNotification: (options: { title: string; body: string }) => ipcRenderer.invoke('show-notification', options),
  exportInvoicePDF: (invoice: any) => ipcRenderer.invoke('export-invoice-pdf', invoice),
  exportAnalyticsPDF: (analyticsData: any) => ipcRenderer.invoke('export-analytics-pdf', analyticsData),
  exportProductsCSV: () => ipcRenderer.invoke('export-products-csv'),
  exportCustomersCSV: () => ipcRenderer.invoke('export-customers-csv'),
  exportSalesCSV: () => ipcRenderer.invoke('export-sales-csv'),
  exportInvoicesCSV: () => ipcRenderer.invoke('export-invoices-csv'),
  exportAllCSV: () => ipcRenderer.invoke('export-all-csv'),
  printInvoicePDF: (invoice: any) => ipcRenderer.invoke('print-invoice-pdf', invoice),
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => ipcRenderer.invoke('convert-currency', amount, fromCurrency, toCurrency),
  exportWorkbookCopy: () => ipcRenderer.invoke('export-workbook-copy'),
  authenticateUser: (username: string, password: string) => ipcRenderer.invoke('authenticate-user', username, password),
  getUsers: () => ipcRenderer.invoke('get-users'),
  addUser: (user: any) => ipcRenderer.invoke('add-user', user),
  updateUser: (username: string, user: any) => ipcRenderer.invoke('update-user', username, user),
  deleteUser: (username: string) => ipcRenderer.invoke('delete-user', username),
  // GDPR & Audit
  initGDPRHandler: () => ipcRenderer.send('init-gdpr-handler'),
  gdprExportCustomerData: (customerId: string) => ipcRenderer.invoke('gdpr-export-customer-data', customerId),
  gdprDeleteCustomerData: (customerId: string, reason: string, performedBy: string) => ipcRenderer.invoke('gdpr-delete-customer-data', customerId, reason, performedBy),
  gdprRecordConsent: (consent: any) => ipcRenderer.invoke('gdpr-record-consent', consent),
  gdprGetCustomerConsents: (customerId: string) => ipcRenderer.invoke('gdpr-get-customer-consents', customerId),
  auditLog: (log: any) => ipcRenderer.invoke('audit-log', log),
  auditGetLogs: (filters: any) => ipcRenderer.invoke('audit-get-logs', filters),
  auditGenerateReport: (startDate: string, endDate: string) => ipcRenderer.invoke('audit-generate-report', startDate, endDate),
  // Customer History Export
  exportCustomerHistoryPDF: (data: any) => ipcRenderer.invoke('export-customer-history-pdf', data),
  exportCustomerHistoryExcel: (data: any) => ipcRenderer.invoke('export-customer-history-excel', data),
  auditExportLogs: (startDate: string, endDate: string, format: 'json' | 'csv') => ipcRenderer.invoke('audit-export-logs', startDate, endDate, format)
} as ElectronAPI);
