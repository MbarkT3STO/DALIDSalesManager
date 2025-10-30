// Type definitions
declare const Chart: any;

// Type definitions
interface Product {
  name: string;
  quantity: number;
  buyPrice: number;
  salePrice: number;
  reorderLevel?: number;
}

interface Payment {
  paymentId: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: string;
  notes: string;
}

interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface Sale {
  date: string;
  invoiceId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  profit: number;
}

interface Invoice {
  invoiceId: string;
  date: string;
  customerName: string;
  totalAmount: number;
  totalProfit: number;
  status: string;
  items: Sale[];
}

interface InventoryMovement {
  date: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reference: string;
  notes: string;
  balanceAfter: number;
}

interface WorkbookData {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  invoices: Invoice[];
  inventory: InventoryMovement[];
  payments: Payment[];
}

// Global state
let workbookData: WorkbookData = {
  products: [],
  customers: [],
  sales: [],
  invoices: [],
  inventory: [],
  payments: []
};

// Localization
let currentLanguage = 'en';
let translations: any = {};

// Settings
interface AppSettings {
  language: string;
  theme: string;
  fontSize: string;
  currency: string;
  autoBackup: boolean;
  backupRetention: number;
  lowStockNotifications: boolean;
  soundNotifications: boolean;
  startupBehavior: string;
  autoRefresh: boolean;
  accountingEnabled?: boolean;
}

let appSettings: AppSettings = {
  language: 'en',
  theme: 'light',
  fontSize: 'medium',
  currency: 'USD',
  autoBackup: true,
  backupRetention: 5,
  lowStockNotifications: true,
  soundNotifications: true,
  startupBehavior: 'lastWorkbook',
  autoRefresh: false,
  accountingEnabled: false
};

let currentEditingProduct: string | null = null;
let currentEditingCustomer: string | null = null;
let currentInvoiceItems: Sale[] = [];
let selectedProductForItem: Product | null = null;

// Access the API
const api = (window as any).electronAPI;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  // Open DevTools to inspect console for the reported tab issue
  try { api.openDevTools(); } catch {}
});

// Localization functions
async function loadTranslations(language: string) {
  try {
    const response = await fetch(`translations/${language}.json`);
    translations = await response.json();
    currentLanguage = language;
    applyTranslations();
  } catch (error) {
    console.error('Failed to load translations:', error);
    // Fallback to English
    if (language !== 'en') {
      await loadTranslations('en');
    }
  }
}

function t(key: string, fallback?: string): string {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || fallback || key;
}

function applyTranslations() {
  // Update navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const tabName = tab.getAttribute('data-tab');
    if (tabName) {
      const textElement = tab.querySelector('span[data-translate]');
      if (textElement) {
        textElement.textContent = t(`navigation.${tabName}`, textElement.textContent);
      }
    }
  });

  // Update all elements with data-translate attribute
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    if (key) {
      element.textContent = t(key);
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
    const key = element.getAttribute('data-translate-placeholder');
    if (key && element instanceof HTMLInputElement) {
      element.placeholder = t(key);
    }
  });

  // Update titles
  document.querySelectorAll('[data-translate-title]').forEach(element => {
    const key = element.getAttribute('data-translate-title');
    if (key && element instanceof HTMLElement) {
      element.title = t(key);
    }
  });

  // Update user role badge
  const userRoleBadge = document.querySelector('.user-role');
  if (userRoleBadge) {
    const role = userRoleBadge.getAttribute('data-role');
    if (role) {
      const roleMap: { [key: string]: string } = {
        'Admin': t('users.admin'),
        'Manager': t('users.manager'),
        'Staff': t('users.staff'),
        'Cashier': t('users.cashier')
      };
      userRoleBadge.textContent = roleMap[role] || role;
    }
  }

  // Update button texts
  document.querySelectorAll('button').forEach(button => {
    const textContent = button.textContent?.trim();
    if (textContent) {
      // Common button translations
      if (textContent === 'Add Product' || textContent === 'إضافة منتج' || textContent === 'Ajouter un produit') {
        button.textContent = t('products.addProduct');
      } else if (textContent === 'Add Customer' || textContent === 'إضافة عميل' || textContent === 'Ajouter un client') {
        button.textContent = t('customers.addCustomer');
      } else if (textContent === 'New Invoice' || textContent === 'فاتورة جديدة' || textContent === 'Nouvelle facture') {
        button.textContent = t('sales.newInvoice');
      } else if (textContent === 'Save' || textContent === 'حفظ' || textContent === 'Enregistrer') {
        button.textContent = t('common.save');
      } else if (textContent === 'Cancel' || textContent === 'إلغاء' || textContent === 'Annuler') {
        button.textContent = t('common.cancel');
      } else if (textContent === 'Delete' || textContent === 'حذف' || textContent === 'Supprimer') {
        button.textContent = t('common.delete');
      } else if (textContent === 'Edit' || textContent === 'تعديل' || textContent === 'Modifier') {
        button.textContent = t('common.edit');
      } else if (textContent === 'Search' || textContent === 'بحث' || textContent === 'Rechercher') {
        button.textContent = t('common.search');
      } else if (textContent === 'Export' || textContent === 'تصدير' || textContent === 'Exporter') {
        button.textContent = t('common.export');
      } else if (textContent === 'Print' || textContent === 'طباعة' || textContent === 'Imprimer') {
        button.textContent = t('common.print');
      }
    }
  });

  // Update table headers
  document.querySelectorAll('th').forEach(th => {
    const textContent = th.textContent?.trim();
    if (textContent) {
      if (textContent === 'Product Name' || textContent === 'اسم المنتج' || textContent === 'Nom du produit') {
        th.textContent = t('products.productName');
      } else if (textContent === 'Quantity' || textContent === 'الكمية' || textContent === 'Quantité') {
        th.textContent = t('products.quantity');
      } else if (textContent === 'Buy Price' || textContent === 'سعر الشراء' || textContent === 'Prix d\'achat') {
        th.textContent = t('products.buyPrice');
      } else if (textContent === 'Sale Price' || textContent === 'سعر البيع' || textContent === 'Prix de vente') {
        th.textContent = t('products.salePrice');
      } else if (textContent === 'Customer Name' || textContent === 'اسم العميل' || textContent === 'Nom du client') {
        th.textContent = t('customers.customerName');
      } else if (textContent === 'Phone' || textContent === 'الهاتف' || textContent === 'Téléphone') {
        th.textContent = t('customers.phone');
      } else if (textContent === 'Email' || textContent === 'البريد الإلكتروني' || textContent === 'Email') {
        th.textContent = t('customers.email');
      } else if (textContent === 'Address' || textContent === 'العنوان' || textContent === 'Adresse') {
        th.textContent = t('customers.address');
      } else if (textContent === 'Actions' || textContent === 'الإجراءات' || textContent === 'Actions') {
        th.textContent = t('common.actions');
      } else if (textContent === 'Date' || textContent === 'التاريخ' || textContent === 'Date') {
        th.textContent = t('sales.date');
      } else if (textContent === 'Status' || textContent === 'الحالة' || textContent === 'Statut') {
        th.textContent = t('sales.status');
      }
    }
  });

  // Update form labels
  document.querySelectorAll('label').forEach(label => {
    const textContent = label.textContent?.trim();
    if (textContent) {
      if (textContent === 'Product Name:' || textContent === 'اسم المنتج:' || textContent === 'Nom du produit:') {
        label.textContent = t('products.productName') + ':';
      } else if (textContent === 'Quantity:' || textContent === 'الكمية:' || textContent === 'Quantité:') {
        label.textContent = t('products.quantity') + ':';
      } else if (textContent === 'Buy Price:' || textContent === 'سعر الشراء:' || textContent === 'Prix d\'achat:') {
        label.textContent = t('products.buyPrice') + ':';
      } else if (textContent === 'Sale Price:' || textContent === 'سعر البيع:' || textContent === 'Prix de vente:') {
        label.textContent = t('products.salePrice') + ':';
      } else if (textContent === 'Customer Name:' || textContent === 'اسم العميل:' || textContent === 'Nom du client:') {
        label.textContent = t('customers.customerName') + ':';
      } else if (textContent === 'Phone:' || textContent === 'الهاتف:' || textContent === 'Téléphone:') {
        label.textContent = t('customers.phone') + ':';
      } else if (textContent === 'Email:' || textContent === 'البريد الإلكتروني:' || textContent === 'Email:') {
        label.textContent = t('customers.email') + ':';
      } else if (textContent === 'Address:' || textContent === 'العنوان:' || textContent === 'Adresse:') {
        label.textContent = t('customers.address') + ':';
      }
    }
  });

  // Update headings
  document.querySelectorAll('h1, h2, h3').forEach(heading => {
    const textContent = heading.textContent?.trim();
    if (textContent) {
      if (textContent === 'Dashboard' || textContent === 'لوحة التحكم' || textContent === 'Tableau de bord') {
        heading.textContent = t('dashboard.title');
      } else if (textContent === 'Products' || textContent === 'المنتجات' || textContent === 'Produits') {
        heading.textContent = t('products.title');
      } else if (textContent === 'Customers' || textContent === 'العملاء' || textContent === 'Clients') {
        heading.textContent = t('customers.title');
      } else if (textContent === 'Sales & Invoices' || textContent === 'المبيعات والفواتير' || textContent === 'Ventes et Factures') {
        heading.textContent = t('sales.title');
      } else if (textContent === 'Inventory' || textContent === 'المخزون' || textContent === 'Inventaire') {
        heading.textContent = t('inventory.title');
      } else if (textContent === 'Analytics' || textContent === 'التحليلات' || textContent === 'Analyses') {
        heading.textContent = t('analytics.title');
      } else if (textContent === 'Reports' || textContent === 'التقارير' || textContent === 'Rapports') {
        heading.textContent = t('reports.title');
      } else if (textContent === 'User Management' || textContent === 'إدارة المستخدمين' || textContent === 'Gestion des utilisateurs') {
        heading.textContent = t('users.title');
      } else if (textContent === 'Settings' || textContent === 'الإعدادات' || textContent === 'Paramètres') {
        heading.textContent = t('settings.title');
      }
    }
  });

  // Apply RTL for Arabic
  if (currentLanguage === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', currentLanguage);
  }
}

// Settings functions
function loadSettings() {
  const saved = localStorage.getItem('appSettings');
  if (saved) {
    try {
      appSettings = { ...appSettings, ...JSON.parse(saved) };
    } catch (error) {
      console.error('Failed to parse saved settings:', error);
    }
  }
}

function saveSettings() {
  localStorage.setItem('appSettings', JSON.stringify(appSettings));
}

function applySettings() {
  // Apply theme
  if (appSettings.theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', appSettings.theme);
  }

  // Apply font size
  document.documentElement.setAttribute('data-font-size', appSettings.fontSize);

  // Apply language
  loadTranslations(appSettings.language);

  // Show/hide Accounting tab
  const accountingTabBtn = document.querySelector('.nav-tab[data-tab="accounting"]') as HTMLElement | null;
  if (accountingTabBtn) {
    accountingTabBtn.style.display = appSettings.accountingEnabled ? '' : 'none';
  }

  // If accounting disabled and currently on accounting, switch to dashboard
  const accountingContent = document.getElementById('accountingTab');
  if (!appSettings.accountingEnabled && accountingContent?.classList.contains('active')) {
    switchTab('dashboard');
  }
}

function renderSettings() {
  // Populate settings form
  (document.getElementById('languageSelect') as HTMLSelectElement).value = appSettings.language;
  (document.getElementById('currencySelect') as HTMLSelectElement).value = appSettings.currency;
  (document.getElementById('themeSelect') as HTMLSelectElement).value = appSettings.theme;
  (document.getElementById('fontSizeSelect') as HTMLSelectElement).value = appSettings.fontSize;
  (document.getElementById('autoBackupToggle') as HTMLInputElement).checked = appSettings.autoBackup;
  (document.getElementById('backupRetentionSelect') as HTMLSelectElement).value = appSettings.backupRetention.toString();
  (document.getElementById('lowStockNotificationsToggle') as HTMLInputElement).checked = appSettings.lowStockNotifications;
  (document.getElementById('soundNotificationsToggle') as HTMLInputElement).checked = appSettings.soundNotifications;
  (document.getElementById('startupBehaviorSelect') as HTMLSelectElement).value = appSettings.startupBehavior;
  (document.getElementById('autoRefreshToggle') as HTMLInputElement).checked = appSettings.autoRefresh;
  const accToggle = document.getElementById('accountingEnabledToggle') as HTMLInputElement | null;
  if (accToggle) accToggle.checked = !!appSettings.accountingEnabled;
  
  // Populate GDPR customer dropdowns
  populateGDPRCustomerDropdowns();
  
  // Set default dates for audit logs (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  (document.getElementById('auditStartDate') as HTMLInputElement).value = thirtyDaysAgo.toISOString().split('T')[0];
  (document.getElementById('auditEndDate') as HTMLInputElement).value = today.toISOString().split('T')[0];
}

// Populate GDPR customer dropdowns
function populateGDPRCustomerDropdowns() {
  const exportSelect = document.getElementById('gdprExportCustomerSelect') as HTMLSelectElement;
  const deleteSelect = document.getElementById('gdprDeleteCustomerSelect') as HTMLSelectElement;
  
  if (!exportSelect || !deleteSelect || !workbookData) return;
  
  // Clear existing options (except first placeholder)
  exportSelect.innerHTML = `<option value="">${t('gdpr.selectCustomerPlaceholder')}</option>`;
  deleteSelect.innerHTML = `<option value="">${t('gdpr.selectCustomerPlaceholder')}</option>`;
  
  // Add customers
  workbookData.customers.forEach(customer => {
    const option1 = document.createElement('option');
    option1.value = customer.name;
    option1.textContent = customer.name;
    exportSelect.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = customer.name;
    option2.textContent = customer.name;
    deleteSelect.appendChild(option2);
  });
}

// GDPR: Export Customer Data
async function handleGDPRExport() {
  const select = document.getElementById('gdprExportCustomerSelect') as HTMLSelectElement;
  const customerName = select.value;
  
  if (!customerName) {
    showToast(t('gdpr.selectCustomer'), 'error');
    return;
  }
  
  try {
    const result = await api.gdprExportCustomerData(customerName);
    if (result.success) {
      showToast(t('gdpr.dataExported'), 'success');
    } else {
      showToast(result.message || 'Export failed', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Export failed', 'error');
  }
}

// GDPR: Delete Customer Data
async function handleGDPRDelete() {
  const select = document.getElementById('gdprDeleteCustomerSelect') as HTMLSelectElement;
  const reasonInput = document.getElementById('gdprDeleteReason') as HTMLInputElement;
  const customerName = select.value;
  const reason = reasonInput.value.trim();
  
  if (!customerName) {
    showToast(t('gdpr.selectCustomer'), 'error');
    return;
  }
  
  if (!reason) {
    showToast(t('gdpr.deleteReason'), 'error');
    return;
  }
  
  // Confirm deletion
  const confirmed = confirm(t('gdpr.confirmDeleteMsg'));
  if (!confirmed) return;
  
  try {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const result = await api.gdprDeleteCustomerData(customerName, reason, currentUser.username || 'unknown');
    
    if (result.success) {
      showToast(t('gdpr.dataDeleted'), 'success');
      reasonInput.value = '';
      select.value = '';
      // Reload data
      await loadWorkbookData();
    } else {
      showToast(result.message || 'Deletion failed', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Deletion failed', 'error');
  }
}

// Audit: View Logs
async function handleAuditViewLogs() {
  const startDateInput = document.getElementById('auditStartDate') as HTMLInputElement;
  const endDateInput = document.getElementById('auditEndDate') as HTMLInputElement;
  const container = document.getElementById('auditLogsContainer') as HTMLElement;
  const tbody = document.getElementById('auditLogsTableBody') as HTMLTableSectionElement;
  
  if (!startDateInput.value || !endDateInput.value) {
    showToast(t('audit.startDate') + ' and ' + t('audit.endDate') + ' required', 'error');
    return;
  }
  
  try {
    const result = await api.auditGetLogs({
      startDate: new Date(startDateInput.value),
      endDate: new Date(endDateInput.value)
    });
    
    if (result.success) {
      tbody.innerHTML = '';
      
      if (result.logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">${t('audit.noLogs')}</td></tr>`;
      } else {
        result.logs.forEach((log: any) => {
          const row = tbody.insertRow();
          row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.userName}</td>
            <td>${log.action}</td>
            <td>${log.entityType}: ${log.entityId}</td>
          `;
        });
      }
      
      container.style.display = 'block';
    } else {
      showToast(result.message || 'Failed to load logs', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Failed to load logs', 'error');
  }
}

// Audit: Generate Report
async function handleAuditGenerateReport() {
  const startDateInput = document.getElementById('auditStartDate') as HTMLInputElement;
  const endDateInput = document.getElementById('auditEndDate') as HTMLInputElement;
  
  if (!startDateInput.value || !endDateInput.value) {
    showToast(t('audit.startDate') + ' and ' + t('audit.endDate') + ' required', 'error');
    return;
  }
  
  try {
    const result = await api.auditGenerateReport(startDateInput.value, endDateInput.value);
    
    if (result.success) {
      // Display report summary
      const summary = result.report.summary;
      const message = `${t('audit.reportGenerated')}\n\n` +
                     `${t('audit.totalActions')}: ${summary.totalActions}\n` +
                     `${t('audit.uniqueUsers')}: ${summary.uniqueUsers}\n` +
                     `${t('audit.entitiesModified')}: ${summary.entitiesModified}`;
      alert(message);
    } else {
      showToast(result.message || 'Failed to generate report', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Failed to generate report', 'error');
  }
}

// Audit: Export Logs (JSON)
async function handleAuditExportJSON() {
  const startDateInput = document.getElementById('auditStartDate') as HTMLInputElement;
  const endDateInput = document.getElementById('auditEndDate') as HTMLInputElement;
  
  if (!startDateInput.value || !endDateInput.value) {
    showToast(t('audit.startDate') + ' and ' + t('audit.endDate') + ' required', 'error');
    return;
  }
  
  try {
    const result = await api.auditExportLogs(startDateInput.value, endDateInput.value, 'json');
    
    if (result.success) {
      showToast(t('audit.logsExported'), 'success');
    } else {
      showToast(result.message || 'Export failed', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Export failed', 'error');
  }
}

// Audit: Export Logs (CSV)
async function handleAuditExportCSV() {
  const startDateInput = document.getElementById('auditStartDate') as HTMLInputElement;
  const endDateInput = document.getElementById('auditEndDate') as HTMLInputElement;
  
  if (!startDateInput.value || !endDateInput.value) {
    showToast(t('audit.startDate') + ' and ' + t('audit.endDate') + ' required', 'error');
    return;
  }
  
  try {
    const result = await api.auditExportLogs(startDateInput.value, endDateInput.value, 'csv');
    
    if (result.success) {
      showToast(t('audit.logsExported'), 'success');
    } else {
      showToast(result.message || 'Export failed', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Export failed', 'error');
  }
}

async function initializeApp() {
  loadSettings();
  applySettings();
  setupEventListeners();
  // Automatically use default workbook
  await autoLoadDefaultWorkbook();
}

// Auto-load default workbook
async function autoLoadDefaultWorkbook() {
  const setupModal = document.getElementById('setupModal');
  const app = document.getElementById('app');
  
  // Hide setup modal immediately
  if (setupModal) setupModal.style.display = 'none';
  if (app) app.style.display = 'flex';

  // Use default workbook automatically
  const result = await api.useDefaultWorkbook();
  if (result.success) {
    await loadWorkbookData();
  } else {
    showToast('Failed to load workbook: ' + result.message, 'error');
  }
}

// Load workbook data
async function loadWorkbookData() {
  try {
    const result = await api.readWorkbook();
    if (result.success) {
      workbookData = result.data;
      updateWorkbookPath();
      renderAllData();
      checkLowStockAndNotify();
      showToast('Data loaded successfully', 'success');
    } else {
      showToast(result.message || 'Failed to load data', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Error loading data', 'error');
  }
}

async function updateWorkbookPath() {
  const result = await api.getWorkbookPath();
  const pathElement = document.getElementById('workbookPath');
  if (pathElement) {
    if (result.success) {
      const fileName = result.path.split('/').pop() || result.path;
      pathElement.textContent = fileName;
      pathElement.removeAttribute('data-translate');
    } else {
      pathElement.textContent = t('common.noWorkbook');
      pathElement.setAttribute('data-translate', 'common.noWorkbook');
    }
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Refresh button
  document.getElementById('refreshBtn')?.addEventListener('click', loadWorkbookData);

  // Settings header button
  document.getElementById('settingsHeaderBtn')?.addEventListener('click', () => {
    switchTab('settings');
  });

  // Users header button
  document.getElementById('usersHeaderBtn')?.addEventListener('click', () => {
    switchTab('users');
  });

  // Ensure Accounting tab switches reliably
  document.getElementById('accountingNavBtn')?.addEventListener('click', () => {
    if (appSettings.accountingEnabled) switchTab('accounting');
  });

  // File menu: download workbook copy
  document.getElementById('fileMenuBtn')?.addEventListener('click', async () => {
    try {
      const result = await api.exportWorkbookCopy();
      if (result.success) {
        showToast('Workbook saved to: ' + result.path, 'success');
      } else {
        if (result.message !== 'Export cancelled') {
          showToast(result.message || 'Failed to save workbook copy', 'error');
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Error saving workbook copy', 'error');
    }
  });

  // Product management
  document.getElementById('addProductBtn')?.addEventListener('click', () => openProductModal());
  document.getElementById('productForm')?.addEventListener('submit', handleProductSubmit);
  document.getElementById('productSearch')?.addEventListener('input', filterProducts);

  // Customer management
  document.getElementById('addCustomerBtn')?.addEventListener('click', () => openCustomerModal());
  document.getElementById('customerForm')?.addEventListener('submit', handleCustomerSubmit);
  document.getElementById('customerSearch')?.addEventListener('input', filterCustomers);

  // Invoice management
  document.getElementById('newInvoiceBtn')?.addEventListener('click', openInvoiceModal);
  document.getElementById('addItemBtn')?.addEventListener('click', addInvoiceItem);
  document.getElementById('saveInvoiceBtn')?.addEventListener('click', saveInvoice);

  // Invoice form inputs
  document.getElementById('invoiceCustomer')?.addEventListener('input', handleCustomerAutocomplete);
  document.getElementById('itemProduct')?.addEventListener('input', handleProductAutocomplete);
  document.getElementById('itemQuantity')?.addEventListener('input', updateItemTotal);

  // Modal close handlers
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = (e.target as HTMLElement).closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });

  // Report filters
  document.getElementById('filterReportBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    filterReports();
    showToast(t('reports.applyFilter', 'Apply Filter') + ' ✓', 'success');
  });
  document.getElementById('exportReportBtn')?.addEventListener('click', exportReport);

  // Settings
  document.getElementById('saveSettingsBtn')?.addEventListener('click', handleSaveSettings);
  document.getElementById('resetSettingsBtn')?.addEventListener('click', handleResetSettings);
  document.getElementById('languageSelect')?.addEventListener('change', handleLanguageChange);
  document.getElementById('themeSelect')?.addEventListener('change', handleThemeChange);
  document.getElementById('fontSizeSelect')?.addEventListener('change', handleFontSizeChange);
  
  // GDPR & Audit
  document.getElementById('gdprExportBtn')?.addEventListener('click', handleGDPRExport);
  document.getElementById('gdprDeleteBtn')?.addEventListener('click', handleGDPRDelete);
  document.getElementById('auditViewLogsBtn')?.addEventListener('click', handleAuditViewLogs);
  document.getElementById('auditGenerateReportBtn')?.addEventListener('click', handleAuditGenerateReport);
  document.getElementById('auditExportJSONBtn')?.addEventListener('click', handleAuditExportJSON);
  document.getElementById('auditExportCSVBtn')?.addEventListener('click', handleAuditExportCSV);

  // Set default date for invoice
  const today = new Date().toISOString().split('T')[0];
  const invoiceDateInput = document.getElementById('invoiceDate') as HTMLInputElement;
  if (invoiceDateInput) invoiceDateInput.value = today;

  // Set default date range for reports
  const reportToDate = document.getElementById('reportToDate') as HTMLInputElement;
  const reportFromDate = document.getElementById('reportFromDate') as HTMLInputElement;
  if (reportToDate) reportToDate.value = today;
  if (reportFromDate) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    reportFromDate.value = thirtyDaysAgo.toISOString().split('T')[0];
  }

  // Accounting events
  document.getElementById('tbRefreshBtn')?.addEventListener('click', () => {
    renderTrialBalance();
  });
  document.getElementById('jeAddLineBtn')?.addEventListener('click', addJournalLineRow);
  document.getElementById('jeSubmitBtn')?.addEventListener('click', handlePostJournal);
  document.getElementById('fsIncomeBtn')?.addEventListener('click', renderIncomeStatement);
  document.getElementById('fsBalanceBtn')?.addEventListener('click', renderBalanceSheet);
  document.getElementById('tbExportCsvBtn')?.addEventListener('click', exportTrialBalanceCSV);
  document.getElementById('tbExportPdfBtn')?.addEventListener('click', exportTrialBalancePDF);
  document.getElementById('fsExportCsvBtn')?.addEventListener('click', exportFinancialsCSV);
  document.getElementById('fsExportPdfBtn')?.addEventListener('click', exportFinancialsPDF);

  // Fix custom toggle switches to toggle when clicking the slider area
  bindCustomToggle('autoBackupToggle');
  bindCustomToggle('lowStockNotificationsToggle');
  bindCustomToggle('soundNotificationsToggle');
  bindCustomToggle('autoRefreshToggle');
  bindCustomToggle('accountingEnabledToggle');
}

function bindCustomToggle(inputId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (!input) return;
  const container = input.closest('.toggle-switch') as HTMLElement | null;
  const slider = input.nextElementSibling as HTMLElement | null;
  const target = slider || container;
  if (!target) return;
  target.style.cursor = 'pointer';
  target.addEventListener('click', (e) => {
    e.preventDefault();
    input.checked = !input.checked;
  });
}

// Tab switching
function switchTab(tabName: string | null) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  const activeContent = document.getElementById(`${tabName}Tab`);

  if (activeTab) activeTab.classList.add('active');
  if (activeContent) activeContent.classList.add('active');

  // Refresh data when switching to certain tabs
  if (tabName === 'dashboard') renderDashboard();
  if (tabName === 'reports') renderReports();
  if (tabName === 'users') renderUsers();
  if (tabName === 'settings') renderSettings();
  if (tabName === 'accounting') renderAccounting();
}

// Theme toggle
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);

  const themeIcon = document.querySelector('#themeToggle .icon');
  if (themeIcon) {
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  }

  localStorage.setItem('theme', newTheme);
}

// ============= Accounting (Renderer) =============
async function renderAccounting() {
  // Set defaults if empty
  const today = new Date().toISOString().split('T')[0];
  const tbTo = document.getElementById('tbTo') as HTMLInputElement;
  const fsTo = document.getElementById('fsTo') as HTMLInputElement;
  if (tbTo && !tbTo.value) tbTo.value = today;
  if (fsTo && !fsTo.value) fsTo.value = today;

  await populateAccountsDatalist();
  await renderTrialBalance();
}

function addJournalLineRow() {
  const tbody = document.getElementById('jeLinesBody');
  if (!tbody) return;
  const lineCount = tbody.querySelectorAll('tr').length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${lineCount}</td>
    <td><input class="form-control je-account" placeholder="Account (code)" list="accountsDatalist"></td>
    <td><input type="number" class="form-control je-debit" min="0" step="0.01"></td>
    <td><input type="number" class="form-control je-credit" min="0" step="0.01"></td>
    <td><button class="btn btn-secondary btn-small" onclick="this.closest('tr').remove()">Remove</button></td>
  `;
  tbody.appendChild(tr);
}

async function populateAccountsDatalist() {
  const dl = document.getElementById('accountsDatalist');
  if (!dl) return;
  try {
    const res = await api.accListAccounts();
    if (!res.success) return;
    const accounts = res.accounts as Array<{ code: string; name: string; type: string; isActive: boolean }>;
    (dl as HTMLElement).innerHTML = accounts.filter(a => a.isActive).map(a => `<option value="${a.code}">${a.code} - ${a.name}</option>`).join('');
  } catch {}
}

async function handlePostJournal() {
  const date = (document.getElementById('jeDate') as HTMLInputElement)?.value || new Date().toISOString().split('T')[0];
  const description = (document.getElementById('jeDesc') as HTMLInputElement)?.value || '';
  const reference = (document.getElementById('jeRef') as HTMLInputElement)?.value || '';
  const rows = Array.from(document.querySelectorAll('#jeLinesBody tr')) as HTMLTableRowElement[];
  const lines = rows.map((row, idx) => {
    const account = (row.querySelector('.je-account') as HTMLInputElement)?.value?.trim();
    const debit = parseFloat((row.querySelector('.je-debit') as HTMLInputElement)?.value || '0');
    const credit = parseFloat((row.querySelector('.je-credit') as HTMLInputElement)?.value || '0');
    return { lineNumber: idx + 1, accountCode: account, debit: isNaN(debit) ? 0 : debit, credit: isNaN(credit) ? 0 : credit };
  }).filter(l => l.accountCode && (l.debit > 0 || l.credit > 0));

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const totalsSpan = document.getElementById('jeTotals');
  if (totalsSpan) totalsSpan.textContent = `Debit: ${totalDebit.toFixed(2)} | Credit: ${totalCredit.toFixed(2)}`;

  if (lines.length === 0) { showToast('Add at least one journal line', 'error'); return; }
  if (Math.abs(totalDebit - totalCredit) > 0.0001) { showToast('Entry must be balanced', 'error'); return; }

  const entry = {
    entryId: 'JE-' + Date.now(),
    date,
    description,
    reference,
    lines
  };

  try {
    const res = await api.accAddJournalEntry(entry);
    if (res.success) {
      showToast('Journal posted', 'success');
      // Clear lines except first row
      const tbody = document.getElementById('jeLinesBody');
      if (tbody) tbody.innerHTML = `
        <tr>
          <td>1</td>
          <td><input class="form-control je-account" placeholder="Account (code)" list="accountsDatalist"></td>
          <td><input type="number" class="form-control je-debit" min="0" step="0.01"></td>
          <td><input type="number" class="form-control je-credit" min="0" step="0.01"></td>
          <td><button class="btn btn-secondary btn-small" id="jeAddLineBtn">Add</button></td>
        </tr>`;
      // Re-bind add button in the recreated row
      document.getElementById('jeAddLineBtn')?.addEventListener('click', addJournalLineRow);
      await populateAccountsDatalist();
      await renderTrialBalance();
    } else {
      showToast(res.message || 'Failed to post journal', 'error');
    }
  } catch (e: any) {
    showToast(e.message || 'Error posting journal', 'error');
  }
}

async function renderTrialBalance() {
  const from = (document.getElementById('tbFrom') as HTMLInputElement)?.value || undefined;
  const to = (document.getElementById('tbTo') as HTMLInputElement)?.value || undefined;
  const tbody = document.getElementById('tbBody');
  if (!tbody) return;
  try {
    const res = await api.accGetTrialBalance(from, to);
    if (!res.success) throw new Error(res.message || 'Failed');
    const rows = res.data as Array<{ accountCode: string; accountName: string; type: string; debit: number; credit: number; balance: number }>;
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state" data-translate="common.noData">No data</td></tr>';
      return;
    }
    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.accountCode}</td>
        <td>${r.accountName}</td>
        <td>${r.type}</td>
        <td>${formatCurrency(r.debit)}</td>
        <td>${formatCurrency(r.credit)}</td>
        <td>${formatCurrency(r.balance)}</td>
      </tr>
    `).join('') + `
      <tr>
        <td colspan="3" style="text-align:right"><strong>${t('reports.totals','Totals')}</strong></td>
        <td><strong>${formatCurrency(totalDebit)}</strong></td>
        <td><strong>${formatCurrency(totalCredit)}</strong></td>
        <td></td>
      </tr>`;
  } catch (e: any) {
    showToast(e.message || 'Failed to load trial balance', 'error');
  }
}

function buildTrialBalanceCSV(rows: Array<{ accountCode: string; accountName: string; type: string; debit: number; credit: number; balance: number }>): string {
  const header = 'Code,Account,Type,Debit,Credit,Balance';
  const lines = rows.map(r => [r.accountCode, r.accountName, r.type, r.debit.toFixed(2), r.credit.toFixed(2), r.balance.toFixed(2)].join(','));
  const totals = rows.reduce((acc, r) => { acc.debit += r.debit; acc.credit += r.credit; return acc; }, { debit: 0, credit: 0 });
  const footer = ["", "Totals", "", totals.debit.toFixed(2), totals.credit.toFixed(2), ""].join(',');
  return [header, ...lines, footer].join('\n');
}

async function exportTrialBalanceCSV() {
  const from = (document.getElementById('tbFrom') as HTMLInputElement)?.value || undefined;
  const to = (document.getElementById('tbTo') as HTMLInputElement)?.value || undefined;
  try {
    const res = await api.accGetTrialBalance(from, to);
    if (!res.success) throw new Error(res.message || 'Failed');
    const csv = buildTrialBalanceCSV(res.data);
    const name = `trial-balance${from ? '-' + from : ''}${to ? '-' + to : ''}.csv`;
    const out = await api.accExportCSV(name, csv);
    if (out.success) showToast('Trial Balance exported', 'success');
  } catch (e: any) {
    showToast(e.message || 'Failed to export', 'error');
  }
}

async function exportTrialBalancePDF() {
  const table = document.querySelector('#accountingTab .table-container') as HTMLElement;
  if (!table) return;
  const html = `<!doctype html><html><head><meta charset='utf-8'><title>Trial Balance</title>
    <style>body{font-family:Arial,Helvetica,sans-serif;padding:16px;color:#111}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;text-align:left}
    th{background:#f3f4f6}</style></head><body><h2>Trial Balance</h2>${table.innerHTML}</body></html>`;
  const name = 'trial-balance.pdf';
  try {
    const out = await api.exportHtmlToPDF(html, name);
    if (out.success) showToast('Trial Balance PDF exported', 'success');
  } catch (e: any) {
    showToast(e.message || 'Failed to export PDF', 'error');
  }
}

function buildIncomeStatementCSV(report: any): string {
  const revHeader = 'Revenue,,Amount';
  const revLines = report.revenue.map((x: any) => [x.accountCode, x.name, x.amount.toFixed(2)].join(','));
  const revTotal = ["Total Revenue", "", report.totalRevenue.toFixed(2)].join(',');
  const expHeader = 'Expenses,,Amount';
  const expLines = report.expenses.map((x: any) => [x.accountCode, x.name, x.amount.toFixed(2)].join(','));
  const expTotal = ["Total Expenses", "", report.totalExpenses.toFixed(2)].join(',');
  const net = ["Net Income", "", report.netIncome.toFixed(2)].join(',');
  return [revHeader, ...revLines, revTotal, '', expHeader, ...expLines, expTotal, '', net].join('\n');
}

function buildBalanceSheetCSV(report: any): string {
  const aHeader = 'Assets,,Amount';
  const aLines = report.assets.map((x: any) => [x.accountCode, x.name, x.amount.toFixed(2)].join(','));
  const aTotal = ["Total Assets", "", report.totalAssets.toFixed(2)].join(',');
  const lHeader = 'Liabilities,,Amount';
  const lLines = report.liabilities.map((x: any) => [x.accountCode, x.name, x.amount.toFixed(2)].join(','));
  const eHeader = 'Equity,,Amount';
  const eLines = report.equity.map((x: any) => [x.accountCode, x.name, x.amount.toFixed(2)].join(','));
  const leTotal = ["Total L + E", "", (report.totalLiabilities + report.totalEquity).toFixed(2)].join(',');
  return [aHeader, ...aLines, aTotal, '', lHeader, ...lLines, '', eHeader, ...eLines, leTotal].join('\n');
}

async function exportFinancialsCSV() {
  const from = (document.getElementById('fsFrom') as HTMLInputElement)?.value || undefined;
  const to = (document.getElementById('fsTo') as HTMLInputElement)?.value || undefined;
  try {
    // Create both and ask two saves (simple approach)
    const isRes = await api.accGetIncomeStatement(from, to);
    if (isRes.success) {
      const csv = buildIncomeStatementCSV(isRes.report);
      await api.accExportCSV(`income-statement${from?'-'+from:''}${to?'-'+to:''}.csv`, csv);
    }
    const bsRes = await api.accGetBalanceSheet(to);
    if (bsRes.success) {
      const csv2 = buildBalanceSheetCSV(bsRes.report);
      await api.accExportCSV(`balance-sheet${to?'-'+to:''}.csv`, csv2);
    }
    showToast('Financial statements exported', 'success');
  } catch (e: any) {
    showToast(e.message || 'Failed to export', 'error');
  }
}

async function exportFinancialsPDF() {
  const from = (document.getElementById('fsFrom') as HTMLInputElement)?.value || undefined;
  const to = (document.getElementById('fsTo') as HTMLInputElement)?.value || undefined;
  try {
    const isRes = await api.accGetIncomeStatement(from, to);
    const bsRes = await api.accGetBalanceSheet(to);
    let body = `<h2>${t('accounting.incomeStatement','Income Statement')}</h2>`;
    if (isRes.success) {
      const r = isRes.report;
      const revRows = r.revenue.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style=\"text-align:right\">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan=\"3\">${t('accounting.noRevenue','No revenue')}</td></tr>`;
      const expRows = r.expenses.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style=\"text-align:right\">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan=\"3\">${t('accounting.noExpenses','No expenses')}</td></tr>`;
      body += `<table><thead><tr><th colspan=3>${t('accounting.revenue','Revenue')}</th></tr></thead><tbody>${revRows}</tbody><tfoot><tr><td colspan=2>${t('accounting.totalRevenue','Total Revenue')}</td><td style=\"text-align:right\">${formatCurrency(r.totalRevenue)}</td></tr></tfoot></table>`;
      body += `<table><thead><tr><th colspan=3>${t('accounting.expenses','Expenses')}</th></tr></thead><tbody>${expRows}</tbody><tfoot><tr><td colspan=2>${t('accounting.totalExpenses','Total Expenses')}</td><td style=\"text-align:right\">${formatCurrency(r.totalExpenses)}</td></tr></tfoot></table>`;
      body += `<div style=\"text-align:right;margin:8px 0\"><strong>${t('accounting.netIncome','Net Income')}: ${formatCurrency(r.netIncome)}</strong></div>`;
    }
    body += `<h2 style=\"margin-top:16px\">${t('accounting.balanceSheet','Balance Sheet')}</h2>`;
    if (bsRes.success) {
      const r2 = bsRes.report;
      const a = r2.assets.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style=\"text-align:right\">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan=\"3\">${t('accounting.noAssets','No assets')}</td></tr>`;
      const l = r2.liabilities.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style=\"text-align:right\">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan=\"3\">${t('accounting.noLiabilities','No liabilities')}</td></tr>`;
      const e = r2.equity.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style=\"text-align:right\">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan=\"3\">${t('accounting.noEquity','No equity')}</td></tr>`;
      body += `<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:12px\">`;
      body += `<table><thead><tr><th colspan=3>${t('accounting.assets','Assets')}</th></tr></thead><tbody>${a}</tbody><tfoot><tr><td colspan=2>${t('accounting.totalAssets','Total Assets')}</td><td style=\"text-align:right\">${formatCurrency(r2.totalAssets)}</td></tr></tfoot></table>`;
      body += `<table><thead><tr><th colspan=3>${t('accounting.liabilitiesEquity','Liabilities & Equity')}</th></tr></thead><tbody>${l}${e}</tbody><tfoot><tr><td colspan=2>${t('accounting.totalLE','Total L + E')}</td><td style=\"text-align:right\">${formatCurrency(r2.totalLiabilities + r2.totalEquity)}</td></tr></tfoot></table>`;
      body += `</div>`;
    }
    const html = `<!doctype html><html><head><meta charset='utf-8'><title>Financial Statements</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:16px;color:#111}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f3f4f6}</style>
      </head><body>${body}</body></html>`;
    const out = await api.exportHtmlToPDF(html, `financial-statements${from?'-'+from:''}${to?'-'+to:''}.pdf`);
    if (out.success) showToast('Financial statements PDF exported', 'success');
  } catch (e: any) {
    showToast(e.message || 'Failed to export PDF', 'error');
  }
}

async function renderIncomeStatement() {
  const from = (document.getElementById('fsFrom') as HTMLInputElement)?.value || undefined;
  const to = (document.getElementById('fsTo') as HTMLInputElement)?.value || undefined;
  const container = document.getElementById('fsOutput');
  if (!container) return;
  try {
    const res = await api.accGetIncomeStatement(from, to);
    if (!res.success) throw new Error(res.message || 'Failed');
    const r = res.report;
    const revRows = r.revenue.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style="text-align:right">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan="3" class="empty-state">${t('accounting.noRevenue','No revenue')}</td></tr>`;
    const expRows = r.expenses.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style="text-align:right">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan="3" class="empty-state">${t('accounting.noExpenses','No expenses')}</td></tr>`;
    container.innerHTML = `
      <div class="table-container">
        <h3>${t('accounting.incomeStatement','Income Statement')}</h3>
        <table class="data-table"><thead><tr><th colspan="3">${t('accounting.revenue','Revenue')}</th></tr></thead><tbody>${revRows}</tbody>
          <tfoot><tr><td colspan="2"><strong>${t('accounting.totalRevenue','Total Revenue')}</strong></td><td style="text-align:right"><strong>${formatCurrency(r.totalRevenue)}</strong></td></tr></tfoot>
        </table>
        <table class="data-table" style="margin-top:10px"><thead><tr><th colspan="3">${t('accounting.expenses','Expenses')}</th></tr></thead><tbody>${expRows}</tbody>
          <tfoot><tr><td colspan="2"><strong>${t('accounting.totalExpenses','Total Expenses')}</strong></td><td style="text-align:right"><strong>${formatCurrency(r.totalExpenses)}</strong></td></tr></tfoot>
        </table>
        <div style="text-align:right; margin-top:10px;"><strong>${t('accounting.netIncome','Net Income')}: ${formatCurrency(r.netIncome)}</strong></div>
      </div>`;
  } catch (e: any) {
    showToast(e.message || 'Failed to load income statement', 'error');
  }
}

async function renderBalanceSheet() {
  const asOf = (document.getElementById('fsTo') as HTMLInputElement)?.value || undefined;
  const container = document.getElementById('fsOutput');
  if (!container) return;
  try {
    const res = await api.accGetBalanceSheet(asOf);
    if (!res.success) throw new Error(res.message || 'Failed');
    const r = res.report;
    const assets = r.assets.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style=\"text-align:right\">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan=\"3\" class=\"empty-state\">${t('accounting.noAssets','No assets')}</td></tr>`;
    const liab = r.liabilities.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style=\"text-align:right\">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan=\"3\" class=\"empty-state\">${t('accounting.noLiabilities','No liabilities')}</td></tr>`;
    const eq = r.equity.map((x: any) => `<tr><td>${x.accountCode}</td><td>${x.name}</td><td style=\"text-align:right\">${formatCurrency(x.amount)}</td></tr>`).join('') || `<tr><td colspan=\"3\" class=\"empty-state\">${t('accounting.noEquity','No equity')}</td></tr>`;
    container.innerHTML = `
      <div class="table-container">
        <h3>${t('accounting.balanceSheet','Balance Sheet')}</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <table class="data-table"><thead><tr><th colspan="3">${t('accounting.assets','Assets')}</th></tr></thead><tbody>${assets}</tbody>
            <tfoot><tr><td colspan="2"><strong>${t('accounting.totalAssets','Total Assets')}</strong></td><td style="text-align:right"><strong>${formatCurrency(r.totalAssets)}</strong></td></tr></tfoot>
          </table>
          <table class="data-table"><thead><tr><th colspan="3">${t('accounting.liabilitiesEquity','Liabilities & Equity')}</th></tr></thead>
            <tbody>${liab}${eq}</tbody>
            <tfoot><tr><td colspan="2"><strong>${t('accounting.totalLE','Total L + E')}</strong></td><td style="text-align:right"><strong>${formatCurrency(r.totalLiabilities + r.totalEquity)}</strong></td></tr></tfoot>
          </table>
        </div>
      </div>`;
  } catch (e: any) {
    showToast(e.message || 'Failed to load balance sheet', 'error');
  }
}

// Load saved theme
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeIcon = document.querySelector('#themeToggle .icon');
  if (themeIcon) {
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}

// Render all data
function renderAllData() {
  renderDashboard();
  renderProducts();
  renderCustomers();
  renderInvoices();
  renderInventory();
  renderAnalytics();
  renderReports();
  renderUsers();
  // Initialize accounting visuals lazily when tab is opened
}

// Dashboard rendering
function renderDashboard() {
  // Calculate statistics (exclude cancelled invoices)
  const activeInvoices = workbookData.invoices.filter(inv => inv.status !== 'Cancelled');
  const totalSales = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalProfit = activeInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
  const totalProducts = workbookData.products.length;
  const totalCustomers = workbookData.customers.length;

  // Update stat cards
  updateElement('totalSales', formatCurrency(totalSales));
  updateElement('totalProfit', formatCurrency(totalProfit));
  updateElement('totalProducts', totalProducts.toString());
  updateElement('totalCustomers', totalCustomers.toString());

  // Render recent invoices
  renderRecentInvoices();

  // Render low stock alert
  renderLowStockAlert();
}

// Helper function to translate status
function translateStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'Paid': t('sales.paid'),
    'Pending': t('sales.pending'),
    'Cancelled': t('sales.cancelled')
  };
  return statusMap[status] || status;
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'DZD': 'د.ج',
    'SAR': 'ر.س',
    'AED': 'د.إ',
    'MAD': 'د.م.'
  };
  
  const symbol = currencySymbols[appSettings.currency] || appSettings.currency;
  const formattedAmount = amount.toFixed(2);
  
  // For Arabic currencies, put symbol after the amount
  if (appSettings.currency === 'SAR' || appSettings.currency === 'AED' || appSettings.currency === 'MAD' || appSettings.currency === 'DZD') {
    return `${formattedAmount} ${symbol}`;
  }
  
  return `${symbol}${formattedAmount}`;
}

function renderRecentInvoices() {
  const tbody = document.getElementById('recentInvoicesBody');
  if (!tbody) return;

  const recentInvoices = [...workbookData.invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (recentInvoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No invoices yet</td></tr>';
    return;
  }

  tbody.innerHTML = recentInvoices.map(inv => `
    <tr>
      <td>${inv.invoiceId}</td>
      <td>${formatDate(inv.date)}</td>
      <td>${inv.customerName}</td>
      <td>${formatCurrency(inv.totalAmount)}</td>
      <td>${formatCurrency(inv.totalProfit)}</td>
      <td><span class="badge badge-${getStatusBadgeClass(inv.status)}">${translateStatus(inv.status)}</span></td>
    </tr>
  `).join('');
}

function renderLowStockAlert() {
  const container = document.getElementById('lowStockAlert');
  if (!container) return;

  const lowStockProducts = workbookData.products.filter(p => p.quantity < 10);

  if (lowStockProducts.length === 0) {
    container.innerHTML = `<p class="empty-state">${t('dashboard.allProductsStocked')}</p>`;
    return;
  }

  container.innerHTML = lowStockProducts.map(p => `
    <div class="alert-item">
      <strong>${p.name}</strong> - ${t('dashboard.only')} ${p.quantity} ${t('dashboard.unitsRemaining')}
    </div>
  `).join('');
}

// Products rendering
function renderProducts() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  if (workbookData.products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No products found</td></tr>';
    return;
  }

  tbody.innerHTML = workbookData.products.map(product => {
    const profitMargin = ((product.salePrice - product.buyPrice) / product.buyPrice * 100).toFixed(1);
    return `
      <tr>
        <td><strong>${product.name}</strong></td>
        <td>${product.quantity}</td>
        <td>${formatCurrency(product.buyPrice)}</td>
        <td>${formatCurrency(product.salePrice)}</td>
        <td>${profitMargin}%</td>
        <td>
          <button class="btn-icon" onclick="editProduct('${escapeHtml(product.name)}')" title="${t('common.edit')}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon" onclick="deleteProduct('${escapeHtml(product.name)}')" title="${t('common.delete')}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProducts() {
  const searchInput = document.getElementById('productSearch') as HTMLInputElement;
  const searchTerm = searchInput?.value.toLowerCase() || '';

  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  const filteredProducts = workbookData.products.filter(p =>
    p.name.toLowerCase().includes(searchTerm)
  );

  if (filteredProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No products found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredProducts.map(product => {
    const profitMargin = ((product.salePrice - product.buyPrice) / product.buyPrice * 100).toFixed(1);
    return `
      <tr>
        <td><strong>${product.name}</strong></td>
        <td>${product.quantity}</td>
        <td>${formatCurrency(product.buyPrice)}</td>
        <td>${formatCurrency(product.salePrice)}</td>
        <td>${profitMargin}%</td>
        <td>
          <button class="btn-icon" onclick="editProduct('${escapeHtml(product.name)}')" title="${t('common.edit')}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon" onclick="deleteProduct('${escapeHtml(product.name)}')" title="${t('common.delete')}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Product modal
function openProductModal(productName?: string) {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm') as HTMLFormElement;
  const title = document.getElementById('productModalTitle');

  if (!modal || !form) return;

  form.reset();
  currentEditingProduct = null;

  if (productName) {
    const product = workbookData.products.find(p => p.name === productName);
    if (product) {
      (document.getElementById('productName') as HTMLInputElement).value = product.name;
      (document.getElementById('productQuantity') as HTMLInputElement).value = product.quantity.toString();
      (document.getElementById('productBuyPrice') as HTMLInputElement).value = product.buyPrice.toString();
      (document.getElementById('productSalePrice') as HTMLInputElement).value = product.salePrice.toString();
      currentEditingProduct = productName;
      if (title) title.textContent = t('products.editProduct');
    }
  } else {
    if (title) title.textContent = t('products.addProduct');
  }

  modal.classList.add('active');
}

async function handleProductSubmit(e: Event) {
  e.preventDefault();

  const name = (document.getElementById('productName') as HTMLInputElement).value;
  const quantity = parseFloat((document.getElementById('productQuantity') as HTMLInputElement).value);
  const buyPrice = parseFloat((document.getElementById('productBuyPrice') as HTMLInputElement).value);
  const salePrice = parseFloat((document.getElementById('productSalePrice') as HTMLInputElement).value);

  const product: Product = { name, quantity, buyPrice, salePrice };

  try {
    let result;
    if (currentEditingProduct) {
      result = await api.updateProduct(currentEditingProduct, product);
    } else {
      result = await api.addProduct(product);
    }

    if (result.success) {
      showToast(`Product ${currentEditingProduct ? 'updated' : 'added'} successfully`, 'success');
      closeModal('productModal');
      await loadWorkbookData();
    } else {
      showToast(result.message || 'Failed to save product', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Error saving product', 'error');
  }
}

(window as any).editProduct = function(productName: string) {
  openProductModal(productName);
};

(window as any).deleteProduct = async function(productName: string) {
  const confirmed = await api.showConfirm({
    title: 'Delete Product',
    message: `Are you sure you want to delete "${productName}"?`
  });

  if (!confirmed.confirmed) return;

  try {
    const result = await api.deleteProduct(productName);
    if (result.success) {
      showToast('Product deleted successfully', 'success');
      await loadWorkbookData();
    } else {
      showToast(result.message || 'Failed to delete product', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Error deleting product', 'error');
  }
};

// Customers rendering
function renderCustomers() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  if (workbookData.customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No customers found</td></tr>';
    return;
  }

  tbody.innerHTML = workbookData.customers.map(customer => `
    <tr>
      <td><strong>${customer.name}</strong></td>
      <td>${customer.phone}</td>
      <td>${customer.email}</td>
      <td>${customer.address}</td>
      <td>
        <button class="btn-icon" onclick="viewCustomerHistory('${escapeHtml(customer.name)}')" title="${t('customers.viewHistory')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </button>
        <button class="btn-icon" onclick="editCustomer('${escapeHtml(customer.name)}')" title="${t('common.edit')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon" onclick="deleteCustomer('${escapeHtml(customer.name)}')" title="${t('common.delete')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterCustomers() {
  const searchInput = document.getElementById('customerSearch') as HTMLInputElement;
  const searchTerm = searchInput?.value.toLowerCase() || '';

  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  const filteredCustomers = workbookData.customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm) ||
    c.phone.includes(searchTerm)
  );

  if (filteredCustomers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No customers found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredCustomers.map(customer => `
    <tr>
      <td><strong>${customer.name}</strong></td>
      <td>${customer.phone}</td>
      <td>${customer.email}</td>
      <td>${customer.address}</td>
      <td>
        <button class="btn-icon" onclick="viewCustomerHistory('${escapeHtml(customer.name)}')" title="${t('customers.viewHistory')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </button>
        <button class="btn-icon" onclick="editCustomer('${escapeHtml(customer.name)}')" title="${t('common.edit')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon" onclick="deleteCustomer('${escapeHtml(customer.name)}')" title="${t('common.delete')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// Customer modal
function openCustomerModal(customerName?: string) {
  const modal = document.getElementById('customerModal');
  const form = document.getElementById('customerForm') as HTMLFormElement;
  const title = document.getElementById('customerModalTitle');

  if (!modal || !form) return;

  form.reset();
  currentEditingCustomer = null;

  if (customerName) {
    const customer = workbookData.customers.find(c => c.name === customerName);
    if (customer) {
      (document.getElementById('customerName') as HTMLInputElement).value = customer.name;
      (document.getElementById('customerPhone') as HTMLInputElement).value = customer.phone;
      (document.getElementById('customerEmail') as HTMLInputElement).value = customer.email;
      (document.getElementById('customerAddress') as HTMLTextAreaElement).value = customer.address;
      currentEditingCustomer = customerName;
      if (title) title.textContent = t('customers.editCustomer');
    }
  } else {
    if (title) title.textContent = t('customers.addCustomer');
  }

  modal.classList.add('active');
}

async function handleCustomerSubmit(e: Event) {
  e.preventDefault();

  const name = (document.getElementById('customerName') as HTMLInputElement).value;
  const phone = (document.getElementById('customerPhone') as HTMLInputElement).value;
  const email = (document.getElementById('customerEmail') as HTMLInputElement).value;
  const address = (document.getElementById('customerAddress') as HTMLTextAreaElement).value;

  const customer: Customer = { name, phone, email, address };

  try {
    let result;
    if (currentEditingCustomer) {
      result = await api.updateCustomer(currentEditingCustomer, customer);
    } else {
      result = await api.addCustomer(customer);
    }

    if (result.success) {
      showToast(`Customer ${currentEditingCustomer ? 'updated' : 'added'} successfully`, 'success');
      closeModal('customerModal');
      await loadWorkbookData();
    } else {
      showToast(result.message || 'Failed to save customer', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Error saving customer', 'error');
  }
}

(window as any).editCustomer = function(customerName: string) {
  openCustomerModal(customerName);
};

(window as any).deleteCustomer = async function(customerName: string) {
  const confirmed = await api.showConfirm({
    title: 'Delete Customer',
    message: `Are you sure you want to delete "${customerName}"?`
  });

  if (!confirmed.confirmed) return;

  try {
    const result = await api.deleteCustomer(customerName);
    if (result.success) {
      showToast('Customer deleted successfully', 'success');
      await loadWorkbookData();
    } else {
      showToast(result.message || 'Failed to delete customer', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Error deleting customer', 'error');
  }
};

// Customer History
let customerHistoryChart: any = null;
let currentCustomerName: string = '';
let currentCustomerInvoices: Invoice[] = [];

(window as any).viewCustomerHistory = function(customerName: string) {
  currentCustomerName = customerName;
  const modal = document.getElementById('customerHistoryModal');
  const title = document.getElementById('customerHistoryTitle');
  
  if (!modal || !title) return;
  
  title.textContent = `${customerName} - ${t('customers.customerHistory')}`;
  
  // Get customer invoices (exclude cancelled)
  const customerInvoices = workbookData.invoices.filter(
    inv => inv.customerName === customerName && inv.status !== 'Cancelled'
  );
  currentCustomerInvoices = customerInvoices;
  
  // Calculate analytics
  const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalInvoices = customerInvoices.length;
  const avgOrder = totalInvoices > 0 ? totalSpent / totalInvoices : 0;
  
  // Get last purchase date
  const sortedInvoices = [...customerInvoices].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastPurchase = sortedInvoices.length > 0 ? formatDate(sortedInvoices[0].date) : '-';
  
  // Update analytics cards
  updateElement('customerTotalSpent', formatCurrency(totalSpent));
  updateElement('customerTotalInvoices', totalInvoices.toString());
  updateElement('customerLastPurchase', lastPurchase);
  updateElement('customerAvgOrder', formatCurrency(avgOrder));
  
  // Render purchase trend chart
  renderCustomerPurchaseTrendChart(customerInvoices);
  
  // Render invoices table
  renderCustomerInvoicesTable(customerInvoices);
  
  modal.classList.add('active');
};

function renderCustomerPurchaseTrendChart(invoices: Invoice[]) {
  const canvas = document.getElementById('customerPurchaseTrendChart') as any;
  if (!canvas) return;
  
  // Destroy existing chart
  if (customerHistoryChart) {
    customerHistoryChart.destroy();
  }
  
  // Group sales by date
  const salesByDate: any = {};
  invoices.forEach(inv => {
    const date = inv.date;
    salesByDate[date] = (salesByDate[date] || 0) + inv.totalAmount;
  });
  
  const dates = Object.keys(salesByDate).sort();
  const values = dates.map(date => salesByDate[date]);
  
  customerHistoryChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates.map(d => formatDate(d)),
      datasets: [{
        label: 'Purchase Amount',
        data: values,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return '$' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

function renderCustomerInvoicesTable(invoices: Invoice[]) {
  const tbody = document.getElementById('customerInvoicesTableBody');
  if (!tbody) return;
  
  if (invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No invoices found</td></tr>';
    return;
  }
  
  // Sort by date descending
  const sortedInvoices = [...invoices].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  tbody.innerHTML = sortedInvoices.map(invoice => `
    <tr>
      <td><strong>${invoice.invoiceId}</strong></td>
      <td>${formatDate(invoice.date)}</td>
      <td>${formatCurrency(invoice.totalAmount)}</td>
      <td>${formatCurrency(invoice.totalProfit)}</td>
      <td><span class="badge badge-${getStatusBadgeClass(invoice.status)}">${translateStatus(invoice.status)}</span></td>
      <td>
        <button class="btn-icon" onclick="viewInvoice('${invoice.invoiceId}')" title="${t('common.view')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="btn-icon" onclick="printInvoice('${invoice.invoiceId}')" title="${t('common.print')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// Export Customer History Functions
(window as any).exportCustomerHistoryPDF = async function() {
  if (!currentCustomerName || currentCustomerInvoices.length === 0) {
    showToast(t('customers.exportError'), 'error');
    return;
  }

  try {
    const totalSpent = currentCustomerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalProfit = currentCustomerInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
    const avgOrder = currentCustomerInvoices.length > 0 ? totalSpent / currentCustomerInvoices.length : 0;
    
    const sortedInvoices = [...currentCustomerInvoices].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastPurchase = sortedInvoices.length > 0 ? sortedInvoices[0].date : '-';

    const data = {
      customerName: currentCustomerName,
      totalSpent: formatCurrency(totalSpent),
      totalInvoices: currentCustomerInvoices.length,
      avgOrder: formatCurrency(avgOrder),
      totalProfit: formatCurrency(totalProfit),
      lastPurchase: formatDate(lastPurchase),
      currency: appSettings.currency,
      invoices: sortedInvoices.map(inv => ({
        invoiceId: inv.invoiceId,
        date: formatDate(inv.date),
        amount: formatCurrency(inv.totalAmount),
        profit: formatCurrency(inv.totalProfit),
        status: translateStatus(inv.status)
      }))
    };

    const result = await api.exportCustomerHistoryPDF(data);
    if (result.success) {
      showToast(t('customers.exportSuccess'), 'success');
    } else {
      showToast(result.message || t('customers.exportError'), 'error');
    }
  } catch (error: any) {
    showToast(error.message || t('customers.exportError'), 'error');
  }
};

(window as any).exportCustomerHistoryExcel = async function() {
  if (!currentCustomerName || currentCustomerInvoices.length === 0) {
    showToast(t('customers.exportError'), 'error');
    return;
  }

  try {
    const totalSpent = currentCustomerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalProfit = currentCustomerInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
    const avgOrder = currentCustomerInvoices.length > 0 ? totalSpent / currentCustomerInvoices.length : 0;
    
    const sortedInvoices = [...currentCustomerInvoices].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastPurchase = sortedInvoices.length > 0 ? sortedInvoices[0].date : '-';

    const data = {
      customerName: currentCustomerName,
      totalSpent,
      totalInvoices: currentCustomerInvoices.length,
      avgOrder,
      totalProfit,
      lastPurchase,
      currency: appSettings.currency,
      invoices: sortedInvoices.map(inv => ({
        invoiceId: inv.invoiceId,
        date: inv.date,
        amount: inv.totalAmount,
        profit: inv.totalProfit,
        status: inv.status,
        items: inv.items
      }))
    };

    const result = await api.exportCustomerHistoryExcel(data);
    if (result.success) {
      showToast(t('customers.exportSuccess'), 'success');
    } else {
      showToast(result.message || t('customers.exportError'), 'error');
    }
  } catch (error: any) {
    showToast(error.message || t('customers.exportError'), 'error');
  }
};

// Invoices rendering
let currentStatusFilter = 'all';
let currentCustomerFilter = 'all';
let currentDateFilter = '';

function renderInvoices() {
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  // Populate customer filter dropdown
  populateCustomerFilter();

  // Filter invoices
  let filteredInvoices = workbookData.invoices;
  
  // Filter by status
  if (currentStatusFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter(inv => inv.status === currentStatusFilter);
  }
  
  // Filter by customer
  if (currentCustomerFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter(inv => inv.customerName === currentCustomerFilter);
  }
  
  // Filter by date
  if (currentDateFilter) {
    filteredInvoices = filteredInvoices.filter(inv => inv.date === currentDateFilter);
  }

  if (filteredInvoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No invoices found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredInvoices.map(invoice => `
    <tr>
      <td><strong>${invoice.invoiceId}</strong></td>
      <td>${formatDate(invoice.date)}</td>
      <td>${invoice.customerName}</td>
      <td>${formatCurrency(invoice.totalAmount)}</td>
      <td>${formatCurrency(invoice.totalProfit)}</td>
      <td><span class="badge badge-${getStatusBadgeClass(invoice.status)}">${translateStatus(invoice.status)}</span></td>
      <td>
        <button class="btn-icon" onclick="viewInvoice('${invoice.invoiceId}')" title="${t('common.view')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="btn-icon" onclick="editInvoiceStatus('${escapeHtml(invoice.invoiceId)}', '${escapeHtml(invoice.customerName)}', '${invoice.status}')" title="${t('sales.editStatus')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon" onclick="printInvoice('${invoice.invoiceId}')" title="${t('common.print')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// Populate customer filter dropdown
function populateCustomerFilter() {
  const customerFilter = (document as any).getElementById('invoiceCustomerFilter');
  if (!customerFilter) return;

  // Get unique customers from invoices
  const uniqueCustomers = [...new Set(workbookData.invoices.map(inv => inv.customerName))].sort();
  
  const currentValue = customerFilter.value;
  customerFilter.innerHTML = '<option value="all">All Customers</option>' +
    uniqueCustomers.map(customer => `<option value="${escapeHtml(customer)}">${escapeHtml(customer)}</option>`).join('');
  
  // Restore previous selection if it still exists
  if (currentValue && uniqueCustomers.includes(currentValue)) {
    customerFilter.value = currentValue;
  }
}

// Invoice status filter
const invoiceStatusFilter = (document as any).getElementById('invoiceStatusFilter');
invoiceStatusFilter?.addEventListener('change', (e: any) => {
  currentStatusFilter = e.target.value;
  renderInvoices();
});

// Invoice customer filter
const invoiceCustomerFilter = (document as any).getElementById('invoiceCustomerFilter');
invoiceCustomerFilter?.addEventListener('change', (e: any) => {
  currentCustomerFilter = e.target.value;
  renderInvoices();
});

// Invoice date filter
const invoiceDateFilter = (document as any).getElementById('invoiceDateFilter');
invoiceDateFilter?.addEventListener('change', (e: any) => {
  currentDateFilter = e.target.value;
  renderInvoices();
});

// Clear all filters
const clearInvoiceFilters = (document as any).getElementById('clearInvoiceFilters');
clearInvoiceFilters?.addEventListener('click', () => {
  currentStatusFilter = 'all';
  currentCustomerFilter = 'all';
  currentDateFilter = '';
  
  ((document as any).getElementById('invoiceStatusFilter') as any).value = 'all';
  ((document as any).getElementById('invoiceCustomerFilter') as any).value = 'all';
  ((document as any).getElementById('invoiceDateFilter') as any).value = '';
  
  renderInvoices();
});

// Invoice modal
function openInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  if (!modal) return;

  // Reset form
  (document.getElementById('invoiceCustomer') as HTMLInputElement).value = '';
  (document.getElementById('invoiceStatus') as HTMLSelectElement).value = 'Pending';
  const today = new Date().toISOString().split('T')[0];
  (document.getElementById('invoiceDate') as HTMLInputElement).value = today;

  // Reset items
  currentInvoiceItems = [];
  renderInvoiceItems();
  updateInvoiceSummary();

  // Reset item form
  (document.getElementById('itemProduct') as HTMLInputElement).value = '';
  (document.getElementById('itemQuantity') as HTMLInputElement).value = '1';
  (document.getElementById('itemUnitPrice') as HTMLInputElement).value = '';
  (document.getElementById('itemTotal') as HTMLInputElement).value = '';

  modal.classList.add('active');
}

function handleCustomerAutocomplete(e: Event) {
  const input = e.target as HTMLInputElement;
  const dropdown = document.getElementById('customerAutocomplete');
  if (!dropdown) return;

  const searchTerm = input.value.toLowerCase();

  if (searchTerm.length < 1) {
    dropdown.classList.remove('active');
    return;
  }

  const matches = workbookData.customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm)
  );

  if (matches.length === 0) {
    dropdown.classList.remove('active');
    return;
  }

  dropdown.innerHTML = matches.map(c => `
    <div class="autocomplete-item" data-value="${escapeHtml(c.name)}">
      <strong>${highlightMatch(c.name, searchTerm)}</strong><br>
      <small>${c.phone} - ${c.email}</small>
    </div>
  `).join('');

  dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      input.value = item.getAttribute('data-value') || '';
      dropdown.classList.remove('active');
    });
  });

  dropdown.classList.add('active');
}

function handleProductAutocomplete(e: Event) {
  const input = e.target as HTMLInputElement;
  const dropdown = document.getElementById('productAutocomplete');
  if (!dropdown) return;

  const searchTerm = input.value.toLowerCase();

  if (searchTerm.length < 1) {
    dropdown.classList.remove('active');
    return;
  }

  const matches = workbookData.products.filter(p =>
    p.name.toLowerCase().includes(searchTerm)
  );

  if (matches.length === 0) {
    dropdown.classList.remove('active');
    return;
  }

  dropdown.innerHTML = matches.map(p => `
    <div class="autocomplete-item" data-product='${JSON.stringify(p)}'>
      <strong>${highlightMatch(p.name, searchTerm)}</strong><br>
      <small>Stock: ${p.quantity} | Price: ${formatCurrency(p.salePrice)}</small>
    </div>
  `).join('');

  dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const productData = item.getAttribute('data-product');
      if (productData) {
        selectedProductForItem = JSON.parse(productData);
        input.value = selectedProductForItem!.name;
        (document.getElementById('itemUnitPrice') as HTMLInputElement).value = selectedProductForItem!.salePrice.toString();
        updateItemTotal();
        dropdown.classList.remove('active');
      }
    });
  });

  dropdown.classList.add('active');
}

function updateItemTotal() {
  const quantity = parseFloat((document.getElementById('itemQuantity') as HTMLInputElement).value) || 0;
  const unitPrice = parseFloat((document.getElementById('itemUnitPrice') as HTMLInputElement).value) || 0;
  const total = quantity * unitPrice;
  (document.getElementById('itemTotal') as HTMLInputElement).value = total.toFixed(2);
}

function addInvoiceItem() {
  const productInput = document.getElementById('itemProduct') as HTMLInputElement;
  const quantityInput = document.getElementById('itemQuantity') as HTMLInputElement;
  const unitPriceInput = document.getElementById('itemUnitPrice') as HTMLInputElement;

  const productName = productInput.value;
  const quantity = parseFloat(quantityInput.value);
  const unitPrice = parseFloat(unitPriceInput.value);

  if (!productName || !quantity || !unitPrice) {
    showToast('Please fill all item fields', 'warning');
    return;
  }

  const product = workbookData.products.find(p => p.name === productName);
  if (!product) {
    showToast('Product not found', 'error');
    return;
  }

  // Check stock
  if (quantity > product.quantity) {
    showToast(`Warning: Insufficient stock. Available: ${product.quantity}`, 'warning');
  }

  const total = quantity * unitPrice;
  const profit = (unitPrice - product.buyPrice) * quantity;

  const item: Sale = {
    date: (document.getElementById('invoiceDate') as HTMLInputElement).value,
    invoiceId: '', // Will be set when saving
    productName,
    quantity,
    unitPrice,
    total,
    profit
  };

  currentInvoiceItems.push(item);
  renderInvoiceItems();
  updateInvoiceSummary();

  // Reset item form
  productInput.value = '';
  quantityInput.value = '1';
  unitPriceInput.value = '';
  (document.getElementById('itemTotal') as HTMLInputElement).value = '';
  selectedProductForItem = null;
}

function renderInvoiceItems() {
  const tbody = document.getElementById('invoiceItemsBody');
  if (!tbody) return;

  if (currentInvoiceItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No items added yet</td></tr>';
    return;
  }

  tbody.innerHTML = currentInvoiceItems.map((item, index) => `
    <tr>
      <td>${item.productName}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.unitPrice)}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${formatCurrency(item.profit)}</td>
      <td>
        <button class="btn btn-small btn-danger" onclick="removeInvoiceItem(${index})">Remove</button>
      </td>
    </tr>
  `).join('');
}

(window as any).removeInvoiceItem = function(index: number) {
  currentInvoiceItems.splice(index, 1);
  renderInvoiceItems();
  updateInvoiceSummary();
};

function updateInvoiceSummary() {
  const totalAmount = currentInvoiceItems.reduce((sum, item) => sum + item.total, 0);
  const totalProfit = currentInvoiceItems.reduce((sum, item) => sum + item.profit, 0);

  updateElement('invoiceTotalAmount', formatCurrency(totalAmount));
  updateElement('invoiceTotalProfit', formatCurrency(totalProfit));
}

async function saveInvoice() {
  const customerName = (document.getElementById('invoiceCustomer') as HTMLInputElement).value;
  const date = (document.getElementById('invoiceDate') as HTMLInputElement).value;
  const status = (document.getElementById('invoiceStatus') as HTMLSelectElement).value;

  if (!customerName) {
    showToast('Please select a customer', 'warning');
    return;
  }

  if (currentInvoiceItems.length === 0) {
    showToast('Please add at least one item', 'warning');
    return;
  }

  // Generate invoice ID
  const invoiceId = generateInvoiceId();

  // Set invoice ID for all items
  const items = currentInvoiceItems.map(item => ({
    ...item,
    invoiceId,
    date
  }));

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);

  const invoice: Invoice = {
    invoiceId,
    date,
    customerName,
    totalAmount,
    totalProfit,
    status,
    items
  };

  try {
    const result = await api.saveInvoice(invoice);
    if (result.success) {
      showToast('Invoice saved successfully', 'success');
      closeModal('invoiceModal');
      await loadWorkbookData();
    } else {
      showToast(result.message || 'Failed to save invoice', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Error saving invoice', 'error');
  }
}

function generateInvoiceId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}${day}-${random}`;
}

(window as any).viewInvoice = function(invoiceId: string) {
  const invoice = workbookData.invoices.find(inv => inv.invoiceId === invoiceId);
  if (!invoice) return;

  const html = generateInvoiceHTML(invoice);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

(window as any).printInvoice = async function(invoiceId: string) {
  const invoice = workbookData.invoices.find(inv => inv.invoiceId === invoiceId);
  if (!invoice) return;

  const html = generateInvoiceHTML(invoice);
  
  try {
    const result = await api.printInvoice(html);
    if (result.success) {
      if (result.action === 'printed') {
        showToast('Invoice sent to printer', 'success');
      } else if (result.action === 'saved') {
        showToast('Invoice saved as PDF', 'success');
      }
    }
  } catch (error: any) {
    showToast(error.message || 'Error printing invoice', 'error');
  }
};

function generateInvoiceHTML(invoice: Invoice): string {
  const customer = workbookData.customers.find(c => c.name === invoice.customerName);
  const isRTL = currentLanguage === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';
  
  return `
    <!DOCTYPE html>
    <html dir="${dir}">
    <head>
      <meta charset="UTF-8">
      <title>${t('sales.invoice')} ${invoice.invoiceId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          direction: ${dir};
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #4f46e5;
          margin: 0;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-box {
          flex: 1;
          text-align: ${isRTL ? 'right' : 'left'};
        }
        .info-box h3 {
          margin-top: 0;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 12px;
          text-align: ${isRTL ? 'right' : 'left'};
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #333;
        }
        .total-section {
          text-align: ${isRTL ? 'left' : 'right'};
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: ${isRTL ? 'flex-start' : 'flex-end'};
          padding: 8px 0;
        }
        .total-row span:first-child {
          ${isRTL ? 'margin-left' : 'margin-right'}: 40px;
          font-weight: bold;
        }
        .grand-total {
          font-size: 1.2em;
          color: #4f46e5;
          border-top: 2px solid #4f46e5;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
        }
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${t('sales.invoice').toUpperCase()}</h1>
        <p>${t('sales.invoiceId')}: ${invoice.invoiceId}</p>
        <p>${t('common.date')}: ${formatDate(invoice.date)}</p>
      </div>

      <div class="info-section">
        <div class="info-box">
          <h3>${t('sales.customerInformation')}</h3>
          <p><strong>${invoice.customerName}</strong></p>
          ${customer ? `
            <p>${customer.phone}</p>
            <p>${customer.email}</p>
            <p>${customer.address}</p>
          ` : ''}
        </div>
        <div class="info-box">
          <h3>${t('sales.invoiceDetails')}</h3>
          <p><strong>${t('common.status')}:</strong> ${translateStatus(invoice.status)}</p>
          <p><strong>${t('common.date')}:</strong> ${formatDate(invoice.date)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>${t('common.product')}</th>
            <th>${t('common.quantity')}</th>
            <th>${t('sales.unitPrice')}</th>
            <th>${t('common.total')}</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row grand-total">
          <span>${t('sales.total').toUpperCase()}:</span>
          <span>${formatCurrency(invoice.totalAmount)}</span>
        </div>
      </div>

      <div class="footer">
        <p>${t('sales.thankYou')}</p>
      </div>
    </body>
    </html>
  `;
}

// Reports rendering
function renderReports() {
  filterReports();
}

// Users rendering
async function renderUsers() {
  console.log('renderUsers called');
  
  // Check if Users tab is visible
  const usersTab = (document as any).getElementById('usersTab');
  if (usersTab) {
    const isVisible = usersTab.classList.contains('active');
    const displayStyle = window.getComputedStyle(usersTab).display;
    console.log('Users tab active:', isVisible, 'display:', displayStyle);
  }
  
  const tbody = (document as any).getElementById('usersTableBody');
  if (!tbody) {
    console.log('usersTableBody not found');
    return;
  }
  
  console.log('tbody element:', tbody);
  console.log('tbody visible:', tbody.offsetParent !== null);

  try {
    console.log('Calling api.getUsers()');
    const result = await api.getUsers();
    console.log('getUsers result:', result);
    
    if (!result.success || !result.users) {
      console.log('Failed to load users or no users in result');
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load users</td></tr>';
      return;
    }

    const users = result.users;
    console.log('Users array:', users);

    if (users.length === 0) {
      console.log('No users found in array');
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
      return;
    }

    const html = users.map((user: any) => {
      // Translate role
      const roleMap: { [key: string]: string } = {
        'Admin': t('users.admin'),
        'Manager': t('users.manager'),
        'Staff': t('users.staff')
      };
      const translatedRole = roleMap[user.role] || user.role;
      
      // Translate active status
      const statusText = user.isActive ? t('users.active') : t('users.inactive');
      
      return `
        <tr>
          <td>${user.username}</td>
          <td>${user.fullName}</td>
          <td><span class="badge badge-${user.role.toLowerCase()}">${translatedRole}</span></td>
          <td>${user.email || '-'}</td>
          <td>${user.createdDate}</td>
          <td><span class="badge ${user.isActive ? 'badge-success' : 'badge-danger'}">${statusText}</span></td>
          <td>
            <button class="btn-icon" onclick="editUser('${user.username}')" title="${t('common.edit')}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon btn-danger" onclick="deleteUser('${user.username}')" title="${t('common.delete')}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    console.log('Generated HTML:', html);
    tbody.innerHTML = html;
    console.log('tbody.innerHTML set, rows count:', tbody.querySelectorAll('tr').length);
  } catch (error) {
    console.error('Error in renderUsers:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Error loading users</td></tr>';
  }
}

// User modal functions
(window as any).editUser = async (username: string) => {
  const result = await api.getUsers();
  if (!result.success) return;

  const user = result.users.find((u: any) => u.username === username);
  if (!user) return;

  const modal = (document as any).getElementById('userModal');
  const modalTitle = (document as any).getElementById('userModalTitle');
  const form = (document as any).getElementById('userForm');

  modalTitle.textContent = t('users.editUser');
  (document as any).getElementById('userUsername').value = user.username;
  (document as any).getElementById('userUsername').disabled = true;
  (document as any).getElementById('userPassword').value = user.password;
  (document as any).getElementById('userFullName').value = user.fullName;
  (document as any).getElementById('userRole').value = user.role;
  (document as any).getElementById('userEmail').value = user.email || '';
  (document as any).getElementById('userIsActive').checked = user.isActive;

  form.dataset.mode = 'edit';
  form.dataset.originalUsername = username;
  modal.style.display = 'flex';
};

(window as any).deleteUser = async (username: string) => {
  const confirmed = await api.showConfirm({
    title: 'Delete User',
    message: `Are you sure you want to delete user "${username}"?`
  });

  if (confirmed) {
    const result = await api.deleteUser(username);
    if (result.success) {
      showToast('User deleted successfully');
      await loadWorkbookData();
    } else {
      showToast(result.message || 'Failed to delete user', 'error');
    }
  }
};

// Add user button handler
(document as any).getElementById('addUserBtn')?.addEventListener('click', () => {
  const modal = (document as any).getElementById('userModal');
  const modalTitle = (document as any).getElementById('userModalTitle');
  const form = (document as any).getElementById('userForm');

  modalTitle.textContent = t('users.addUser');
  form.reset();
  (document as any).getElementById('userUsername').disabled = false;
  (document as any).getElementById('userIsActive').checked = true;
  form.dataset.mode = 'add';
  modal.style.display = 'flex';
});

// User modal close handlers
const userModal = (document as any).getElementById('userModal');
if (userModal) {
  // Close button (X)
  const closeBtn = userModal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      userModal.style.display = 'none';
    });
  }
  
  // Cancel button
  const cancelBtn = userModal.querySelector('.modal-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      userModal.style.display = 'none';
    });
  }
  
  // Click outside to close
  userModal.addEventListener('click', (e: any) => {
    if (e.target === userModal) {
      userModal.style.display = 'none';
    }
  });
}

// User form submit handler
(document as any).getElementById('userForm')?.addEventListener('submit', async (e: any) => {
  e.preventDefault();

  const form = e.target;
  const mode = form.dataset.mode;

  const user = {
    username: (document as any).getElementById('userUsername').value,
    password: (document as any).getElementById('userPassword').value,
    fullName: (document as any).getElementById('userFullName').value,
    role: (document as any).getElementById('userRole').value,
    email: (document as any).getElementById('userEmail').value,
    createdDate: new Date().toISOString().split('T')[0],
    isActive: (document as any).getElementById('userIsActive').checked
  };

  let result;
  if (mode === 'edit') {
    const originalUsername = form.dataset.originalUsername;
    result = await api.updateUser(originalUsername, user);
  } else {
    result = await api.addUser(user);
  }

  if (result.success) {
    showToast(`User ${mode === 'edit' ? 'updated' : 'added'} successfully`);
    (document as any).getElementById('userModal').style.display = 'none';
    await loadWorkbookData();
  } else {
    showToast(result.message || 'Failed to save user', 'error');
  }
});

function filterReports() {
  const fromDateInput = document.getElementById('reportFromDate') as HTMLInputElement;
  const toDateInput = document.getElementById('reportToDate') as HTMLInputElement;

  const fromDate = fromDateInput?.value ? new Date(fromDateInput.value) : null;
  const toDate = toDateInput?.value ? new Date(toDateInput.value) : null;

  // Filter invoices by date range (exclude cancelled invoices)
  const filteredInvoices = workbookData.invoices.filter(inv => {
    if (inv.status === 'Cancelled') return false;
    const invDate = new Date(inv.date);
    if (fromDate && invDate < fromDate) return false;
    if (toDate && invDate > toDate) return false;
    return true;
  });

  // Calculate totals
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalProfit = filteredInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
  const invoiceCount = filteredInvoices.length;

  // Update summary
  updateElement('reportTotalSales', formatCurrency(totalSales));
  updateElement('reportTotalProfit', formatCurrency(totalProfit));
  updateElement('reportInvoiceCount', invoiceCount.toString());

  // Render sales by product
  renderSalesByProduct(filteredInvoices);
}

function renderSalesByProduct(invoices: Invoice[]) {
  const tbody = document.getElementById('salesByProductBody');
  if (!tbody) return;

  // Aggregate sales by product
  const productSales: { [key: string]: { quantity: number; sales: number; profit: number } } = {};

  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = { quantity: 0, sales: 0, profit: 0 };
      }
      productSales[item.productName].quantity += item.quantity;
      productSales[item.productName].sales += item.total;
      productSales[item.productName].profit += item.profit;
    });
  });

  const products = Object.entries(productSales).sort((a, b) => b[1].sales - a[1].sales);

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No data available</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(([name, data]) => `
    <tr>
      <td><strong>${name}</strong></td>
      <td>${data.quantity}</td>
      <td>${formatCurrency(data.sales)}</td>
      <td>${formatCurrency(data.profit)}</td>
    </tr>
  `).join('');
}

async function exportReport() {
  try {
    const result = await api.exportSheet('Sales');
    if (result.success) {
      showToast('Report exported successfully', 'success');
    } else {
      showToast(result.message || 'Failed to export report', 'error');
    }
  } catch (error: any) {
    showToast(error.message || 'Error exporting report', 'error');
  }
}

// Utility functions
function closeModal(modalId: string) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function updateElement(id: string, value: string) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // For Arabic and French, use simple dd/MM/YYYY format
  if (currentLanguage === 'ar' || currentLanguage === 'fr') {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // For English, use locale format
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'warning';
  }
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function highlightMatch(text: string, search: string): string {
  const regex = new RegExp(`(${search})`, 'gi');
  return text.replace(regex, '<strong>$1</strong>');
}

function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Close autocomplete dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.autocomplete-wrapper')) {
    document.querySelectorAll('.autocomplete-dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  }
});

// Keyboard navigation for autocomplete
document.addEventListener('keydown', (e) => {
  const activeDropdown = document.querySelector('.autocomplete-dropdown.active');
  if (!activeDropdown) return;

  const items = activeDropdown.querySelectorAll('.autocomplete-item');
  const selectedItem = activeDropdown.querySelector('.autocomplete-item.selected');
  let currentIndex = -1;

  if (selectedItem) {
    currentIndex = Array.from(items).indexOf(selectedItem);
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === nextIndex);
    });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === prevIndex);
    });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedItem) {
      (selectedItem as HTMLElement).click();
    }
  } else if (e.key === 'Escape') {
    activeDropdown.classList.remove('active');
  }
});

// Inventory Management
function renderInventory() {
  // Render inventory statistics
  const totalStockItems = workbookData.products.reduce((sum, p) => sum + p.quantity, 0);
  const totalStockValue = workbookData.products.reduce((sum, p) => sum + (p.quantity * p.buyPrice), 0);
  const lowStockCount = workbookData.products.filter(p => p.quantity < 10).length;

  (document as any).getElementById('totalStockItems').textContent = totalStockItems;
  (document as any).getElementById('totalStockValue').textContent = formatCurrency(totalStockValue);
  (document as any).getElementById('lowStockCount').textContent = lowStockCount;

  // Render inventory movements table
  const tbody = (document as any).getElementById('inventoryTableBody');
  if (!tbody) return;

  if (workbookData.inventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${t('inventory.noMovements')}</td></tr>`;
    return;
  }

  // Show last 50 movements, most recent first
  const recentMovements = [...workbookData.inventory].reverse().slice(0, 50);

  tbody.innerHTML = recentMovements.map(movement => `
    <tr>
      <td>${movement.date}</td>
      <td><strong>${movement.productName}</strong></td>
      <td><span class="badge badge-${movement.type === 'IN' ? 'success' : movement.type === 'OUT' ? 'danger' : 'warning'}">${movement.type}</span></td>
      <td>${movement.quantity}</td>
      <td>${movement.reference || '-'}</td>
      <td><strong>${movement.balanceAfter}</strong></td>
      <td>${movement.notes || '-'}</td>
    </tr>
  `).join('');
}

// Setup inventory modal
const addStockBtn = (document as any).getElementById('addStockBtn');
const inventoryModal = (document as any).getElementById('inventoryModal');
const inventoryForm = (document as any).getElementById('inventoryForm');
const movementProductSelect = (document as any).getElementById('movementProduct');
const movementTypeSelect = (document as any).getElementById('movementType');
const currentStockSpan = (document as any).getElementById('currentStock');

addStockBtn?.addEventListener('click', () => {
  // Populate product dropdown
  movementProductSelect.innerHTML = '<option value="">Select Product</option>' +
    workbookData.products.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)} (Stock: ${p.quantity})</option>`).join('');
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  ((document as any).getElementById('movementDate') as any).value = today;
  
  inventoryModal.classList.add('active');
});

// Update current stock when product is selected
movementProductSelect?.addEventListener('change', () => {
  const selectedProduct = workbookData.products.find(p => p.name === movementProductSelect.value);
  if (selectedProduct) {
    currentStockSpan.textContent = selectedProduct.quantity;
  } else {
    currentStockSpan.textContent = '0';
  }
});

// Handle inventory form submission
inventoryForm?.addEventListener('submit', async (e: any) => {
  e.preventDefault();

  const productName = ((document as any).getElementById('movementProduct') as any).value;
  const type = ((document as any).getElementById('movementType') as any).value;
  const quantity = parseInt(((document as any).getElementById('movementQuantity') as any).value);
  const date = ((document as any).getElementById('movementDate') as any).value;
  const reference = ((document as any).getElementById('movementReference') as any).value;
  const notes = ((document as any).getElementById('movementNotes') as any).value;

  if (!productName) {
    showToast('Please select a product', 'error');
    return;
  }

  const movement = {
    date,
    productName,
    type,
    quantity,
    reference,
    notes
  };

  const result = await api.addInventoryMovement(movement);
  if (result.success) {
    showToast('Stock movement recorded successfully', 'success');
    inventoryModal.classList.remove('active');
    inventoryForm.reset();
    await loadWorkbookData();
  } else {
    showToast(result.message || 'Failed to record movement', 'error');
  }
});

// Analytics & Charts
let analyticsCharts: any = {};

function renderAnalytics() {
  // Calculate key metrics (exclude cancelled invoices)
  const activeInvoices = workbookData.invoices.filter(inv => inv.status !== 'Cancelled');
  const totalSales = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalProfit = activeInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
  const avgOrderValue = activeInvoices.length > 0 ? totalSales / activeInvoices.length : 0;
  const totalProductsSold = workbookData.sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  // Calculate today's profit
  const today = new Date().toISOString().split('T')[0];
  const todayInvoices = activeInvoices.filter(inv => inv.date === today);
  const todayProfit = todayInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Calculate yesterday's profit
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split('T')[0];
  const yesterdayInvoices = activeInvoices.filter(inv => inv.date === yesterdayDate);
  const yesterdayProfit = yesterdayInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);

  // Update metrics
  updateElement('todayProfitValue', formatCurrency(todayProfit));
  updateElement('todayProfitChange', todayInvoices.length > 0 ? `${todayInvoices.length} orders` : 'No sales today');
  updateElement('yesterdayProfitValue', formatCurrency(yesterdayProfit));
  updateElement('yesterdayProfitChange', yesterdayInvoices.length > 0 ? `${yesterdayInvoices.length} orders` : 'No sales');
  updateElement('avgOrderValue', formatCurrency(avgOrderValue));
  updateElement('totalCustomersMetric', workbookData.customers.length.toString());
  updateElement('totalProductsSold', totalProductsSold.toString());
  updateElement('profitMarginMetric', `${profitMargin.toFixed(1)}%`);
  updateElement('productsSoldChange', `${totalProductsSold} units`);

  // Destroy existing charts
  Object.values(analyticsCharts).forEach((chart: any) => {
    if (chart) chart.destroy();
  });
  analyticsCharts = {};

  // Render charts
  renderSalesTrendChart();
  renderProfitTrendChart();
  renderTopProductsChart();
  renderProductCategoriesChart();
  renderTopCustomersChart();
  renderInventoryStatusChart();
}

function renderSalesTrendChart() {
  const canvas = (document as any).getElementById('salesTrendChart');
  if (!canvas) return;

  // Group sales by date (exclude cancelled invoices)
  const salesByDate: any = {};
  workbookData.invoices.filter(inv => inv.status !== 'Cancelled').forEach(inv => {
    const date = inv.date;
    salesByDate[date] = (salesByDate[date] || 0) + inv.totalAmount;
  });

  const dates = Object.keys(salesByDate).sort();
  const values = dates.map(date => salesByDate[date]);

  analyticsCharts.salesTrend = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Sales',
        data: values,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return '$' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

function renderProfitTrendChart() {
  const canvas = (document as any).getElementById('profitTrendChart');
  if (!canvas) return;

  // Group profit by date (exclude cancelled invoices)
  const profitByDate: any = {};
  workbookData.invoices.filter(inv => inv.status !== 'Cancelled').forEach(inv => {
    const date = inv.date;
    profitByDate[date] = (profitByDate[date] || 0) + inv.totalProfit;
  });

  const dates = Object.keys(profitByDate).sort();
  const values = dates.map(date => profitByDate[date]);

  analyticsCharts.profitTrend = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Profit',
        data: values,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return '$' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

function renderTopProductsChart() {
  const canvas = (document as any).getElementById('topProductsChart');
  if (!canvas) return;

  // Calculate sales by product
  const productSales: any = {};
  workbookData.sales.forEach(sale => {
    productSales[sale.productName] = (productSales[sale.productName] || 0) + sale.quantity;
  });

  // Get top 10 products
  const sortedProducts = Object.entries(productSales)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 10);

  analyticsCharts.topProducts = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sortedProducts.map((p: any) => p[0]),
      datasets: [{
        label: 'Units Sold',
        data: sortedProducts.map((p: any) => p[1]),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

function renderProductCategoriesChart() {
  const canvas = (document as any).getElementById('productCategoriesChart');
  if (!canvas) return;

  // Calculate revenue by product
  const productRevenue: any = {};
  workbookData.sales.forEach(sale => {
    productRevenue[sale.productName] = (productRevenue[sale.productName] || 0) + sale.total;
  });

  // Get top 8 products
  const sortedProducts = Object.entries(productRevenue)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 8);

  const colors = [
    'rgba(99, 102, 241, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(20, 184, 166, 0.8)'
  ];

  analyticsCharts.productCategories = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: sortedProducts.map((p: any) => p[0]),
      datasets: [{
        data: sortedProducts.map((p: any) => p[1]),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function renderTopCustomersChart() {
  const canvas = (document as any).getElementById('topCustomersChart');
  if (!canvas) return;

  // Calculate purchases by customer (exclude cancelled invoices)
  const customerPurchases: any = {};
  workbookData.invoices.filter(inv => inv.status !== 'Cancelled').forEach(inv => {
    customerPurchases[inv.customerName] = (customerPurchases[inv.customerName] || 0) + inv.totalAmount;
  });

  // Get top 10 customers
  const sortedCustomers = Object.entries(customerPurchases)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 10);

  analyticsCharts.topCustomers = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sortedCustomers.map((c: any) => c[0]),
      datasets: [{
        label: 'Total Purchases',
        data: sortedCustomers.map((c: any) => c[1]),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return '$' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

function renderInventoryStatusChart() {
  const canvas = (document as any).getElementById('inventoryStatusChart');
  if (!canvas) return;

  // Categorize products by stock level
  const lowStock = workbookData.products.filter(p => p.quantity < 10).length;
  const mediumStock = workbookData.products.filter(p => p.quantity >= 10 && p.quantity < 50).length;
  const highStock = workbookData.products.filter(p => p.quantity >= 50).length;

  analyticsCharts.inventoryStatus = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['Low Stock (<10)', 'Medium Stock (10-49)', 'High Stock (50+)'],
      datasets: [{
        data: [lowStock, mediumStock, highStock],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Analytics period filter
const analyticsPeriodSelect = (document as any).getElementById('analyticsPeriod');
analyticsPeriodSelect?.addEventListener('change', () => {
  renderAnalytics();
});

// Edit Invoice Status
let currentEditInvoiceId = '';

(window as any).editInvoiceStatus = (invoiceId: string, customerName: string, currentStatus: string) => {
  const modal = (document as any).getElementById('editStatusModal');
  if (!modal) return;

  currentEditInvoiceId = invoiceId;
  
  ((document as any).getElementById('editStatusInvoiceId') as any).value = invoiceId;
  ((document as any).getElementById('editStatusCustomer') as any).value = customerName;
  ((document as any).getElementById('editStatusSelect') as any).value = currentStatus;

  modal.classList.add('active');
};

// Edit status form submission
const editStatusForm = (document as any).getElementById('editStatusForm');
const editStatusModal = (document as any).getElementById('editStatusModal');

editStatusForm?.addEventListener('submit', async (e: any) => {
  e.preventDefault();

  const newStatus = ((document as any).getElementById('editStatusSelect') as any).value;
  
  // Find the invoice to get its current status and items
  const invoice = workbookData.invoices.find(inv => inv.invoiceId === currentEditInvoiceId);
  if (!invoice) {
    showToast('Invoice not found', 'error');
    return;
  }
  
  const oldStatus = invoice.status;
  
  // Handle inventory adjustments based on status change
  if (oldStatus !== newStatus) {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // If changing TO cancelled, return items to stock
    if (newStatus === 'Cancelled') {
      for (const item of invoice.items) {
        await api.addInventoryMovement({
          productName: item.productName,
          type: 'IN',
          quantity: item.quantity,
          date: currentDate,
          reference: `Invoice ${currentEditInvoiceId} cancelled`,
          notes: `Returned to stock due to invoice cancellation`
        });
      }
    }
    
    // If changing FROM cancelled TO paid/pending, deduct from stock
    if (oldStatus === 'Cancelled' && (newStatus === 'Paid' || newStatus === 'Pending')) {
      for (const item of invoice.items) {
        await api.addInventoryMovement({
          productName: item.productName,
          type: 'OUT',
          quantity: item.quantity,
          date: currentDate,
          reference: `Invoice ${currentEditInvoiceId} reactivated`,
          notes: `Deducted from stock due to invoice status change to ${newStatus}`
        });
      }
    }
  }

  const result = await api.updateInvoiceStatus(currentEditInvoiceId, newStatus);
  
  if (result.success) {
    showToast('Invoice status updated successfully', 'success');
    editStatusModal.classList.remove('active');
    await loadWorkbookData();
  } else {
    showToast(result.message || 'Failed to update status', 'error');
  }
});

// ============================================
// PAYMENT TRACKING FEATURE
// ============================================

// View invoice with payment tracking
(window as any).viewInvoiceWithPayments = async (invoiceId: string) => {
  const invoice = workbookData.invoices.find(inv => inv.invoiceId === invoiceId);
  if (!invoice) return;

  const modal = (document as any).getElementById('invoiceDetailsModal');
  if (!modal) return;

  // Get payments for this invoice
  const paymentsResult = await api.getPaymentsByInvoice(invoiceId);
  const payments = paymentsResult.success ? paymentsResult.payments : [];

  // Calculate payment summary
  const totalPaid = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
  const balance = invoice.totalAmount - totalPaid;

  // Populate invoice details
  ((document as any).getElementById('detailInvoiceId') as any).textContent = invoice.invoiceId;
  ((document as any).getElementById('detailDate') as any).textContent = formatDate(invoice.date);
  ((document as any).getElementById('detailCustomer') as any).textContent = invoice.customerName;
  ((document as any).getElementById('detailTotal') as any).textContent = formatCurrency(invoice.totalAmount);
  ((document as any).getElementById('detailProfit') as any).textContent = formatCurrency(invoice.totalProfit);
  ((document as any).getElementById('detailStatus') as any).innerHTML = `<span class="badge badge-${getStatusBadgeClass(invoice.status)}">${invoice.status}</span>`;
  
  // Payment summary
  ((document as any).getElementById('detailTotalPaid') as any).textContent = formatCurrency(totalPaid);
  ((document as any).getElementById('detailBalance') as any).textContent = formatCurrency(balance);
  ((document as any).getElementById('detailBalance') as any).style.color = balance > 0 ? '#ef4444' : '#22c55e';

  // Render invoice items
  const itemsBody = (document as any).getElementById('invoiceItemsBody');
  if (itemsBody) {
    itemsBody.innerHTML = invoice.items.map((item: Sale) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.unitPrice)}</td>
        <td>${formatCurrency(item.total)}</td>
        <td>${formatCurrency(item.profit)}</td>
      </tr>
    `).join('');
  }

  // Render payment history
  const paymentsBody = (document as any).getElementById('paymentHistoryBody');
  if (paymentsBody) {
    if (payments.length === 0) {
      paymentsBody.innerHTML = '<tr><td colspan="5" class="empty-state">No payments recorded</td></tr>';
    } else {
      paymentsBody.innerHTML = payments.map((payment: Payment) => `
        <tr>
          <td>${payment.paymentId}</td>
          <td>${formatDate(payment.date)}</td>
          <td>${formatCurrency(payment.amount)}</td>
          <td>${payment.method}</td>
          <td>${payment.notes || '-'}</td>
        </tr>
      `).join('');
    }
  }

  // Store current invoice ID for adding payments
  (window as any).currentInvoiceForPayment = invoiceId;

  modal.classList.add('active');
};

// Add payment to invoice
(window as any).openAddPaymentModal = () => {
  const modal = (document as any).getElementById('addPaymentModal');
  if (!modal) return;

  const today = new Date().toISOString().split('T')[0];
  ((document as any).getElementById('paymentDate') as any).value = today;
  ((document as any).getElementById('paymentAmount') as any).value = '';
  ((document as any).getElementById('paymentMethod') as any).value = 'Cash';
  ((document as any).getElementById('paymentNotes') as any).value = '';

  modal.classList.add('active');
};

// Handle payment form submission
const addPaymentForm = (document as any).getElementById('addPaymentForm');
addPaymentForm?.addEventListener('submit', async (e: any) => {
  e.preventDefault();

  const invoiceId = (window as any).currentInvoiceForPayment;
  if (!invoiceId) {
    showToast('No invoice selected', 'error');
    return;
  }

  const date = ((document as any).getElementById('paymentDate') as any).value;
  const amount = parseFloat(((document as any).getElementById('paymentAmount') as any).value);
  const method = ((document as any).getElementById('paymentMethod') as any).value;
  const notes = ((document as any).getElementById('paymentNotes') as any).value;

  if (!date || isNaN(amount) || amount <= 0) {
    showToast('Please enter valid payment details', 'error');
    return;
  }

  // Generate payment ID
  const paymentId = `PAY-${Date.now()}`;

  const payment: Payment = {
    paymentId,
    invoiceId,
    date,
    amount,
    method,
    notes
  };

  const result = await api.addPayment(payment);

  if (result.success) {
    showToast('Payment added successfully', 'success');
    ((document as any).getElementById('addPaymentModal') as any).classList.remove('active');
    await loadWorkbookData();
    // Refresh the invoice details modal
    (window as any).viewInvoiceWithPayments(invoiceId);
  } else {
    showToast(result.message || 'Failed to add payment', 'error');
  }
});

// ============================================
// STOCK ALERTS & NOTIFICATIONS FEATURE
// ============================================

// Check low stock and show notifications
async function checkLowStockAndNotify() {
  const result = await api.getLowStockProducts();
  if (!result.success) return;

  const lowStockProducts = result.products;
  
  if (lowStockProducts.length > 0) {
    // Show desktop notification
    const productNames = lowStockProducts.map((p: Product) => p.name).slice(0, 3).join(', ');
    const notificationText = lowStockProducts.length > 3 
      ? `${productNames} and ${lowStockProducts.length - 3} more products are low on stock`
      : `${productNames} ${lowStockProducts.length === 1 ? 'is' : 'are'} low on stock`;

    await api.showNotification({
      title: '⚠️ Low Stock Alert',
      body: notificationText
    });
  }
}

// Update product form to include reorder level
const originalOpenProductModal = (window as any).openProductModal;
(window as any).openProductModal = (productName?: string) => {
  if (originalOpenProductModal) {
    originalOpenProductModal(productName);
  }
  
  // Add reorder level field if editing
  if (productName) {
    const product = workbookData.products.find(p => p.name === productName);
    if (product && product.reorderLevel !== undefined) {
      const reorderInput = (document as any).getElementById('productReorderLevel');
      if (reorderInput) {
        reorderInput.value = product.reorderLevel;
      }
    }
  }
};

// Note: handleProductSubmit is already defined earlier in the file and has been
// updated to support reorder level through the form's productReorderLevel field

// ============================================
// SETTINGS HANDLERS
// ============================================

function handleSaveSettings() {
  // Update settings from form
  appSettings.language = (document.getElementById('languageSelect') as HTMLSelectElement).value;
  appSettings.currency = (document.getElementById('currencySelect') as HTMLSelectElement).value;
  appSettings.theme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
  appSettings.fontSize = (document.getElementById('fontSizeSelect') as HTMLSelectElement).value;
  appSettings.autoBackup = (document.getElementById('autoBackupToggle') as HTMLInputElement).checked;
  appSettings.backupRetention = parseInt((document.getElementById('backupRetentionSelect') as HTMLSelectElement).value);
  appSettings.lowStockNotifications = (document.getElementById('lowStockNotificationsToggle') as HTMLInputElement).checked;
  appSettings.soundNotifications = (document.getElementById('soundNotificationsToggle') as HTMLInputElement).checked;
  appSettings.startupBehavior = (document.getElementById('startupBehaviorSelect') as HTMLSelectElement).value;
  appSettings.autoRefresh = (document.getElementById('autoRefreshToggle') as HTMLInputElement).checked;
  const accToggle = document.getElementById('accountingEnabledToggle') as HTMLInputElement | null;
  if (accToggle) appSettings.accountingEnabled = accToggle.checked;

  // Save and apply settings
  saveSettings();
  applySettings();
  
  showToast(t('settings.settingsSaved', 'Settings saved successfully'), 'success');
}

function handleResetSettings() {
  // Reset to defaults
  appSettings = {
    language: 'en',
    theme: 'light',
    fontSize: 'medium',
    currency: 'USD',
    autoBackup: true,
    backupRetention: 5,
    lowStockNotifications: true,
    soundNotifications: true,
    startupBehavior: 'lastWorkbook',
    autoRefresh: false,
    accountingEnabled: false
  };

  // Save and apply settings
  saveSettings();
  applySettings();
  renderSettings();
  
  showToast(t('settings.settingsReset', 'Settings reset to defaults'), 'success');
}

function handleLanguageChange() {
  const newLanguage = (document.getElementById('languageSelect') as HTMLSelectElement).value;
  appSettings.language = newLanguage;
  saveSettings();
  loadTranslations(newLanguage).then(() => {
    applyTranslations();
    renderAllData(); // Re-render all content with new language
    updateWorkbookPath(); // Update workbook path with new language
  });
}

function handleThemeChange() {
  const newTheme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
  appSettings.theme = newTheme;
  saveSettings();
  applySettings();
}

function handleFontSizeChange() {
  const newFontSize = (document.getElementById('fontSizeSelect') as HTMLSelectElement).value;
  appSettings.fontSize = newFontSize;
  saveSettings();
  applySettings();
}

// ============================================
// ANALYTICS PDF EXPORT FEATURE
// ============================================

async function exportAnalyticsToPDF() {
  try {
    // Show loading state
    const exportBtn = document.getElementById('exportAnalyticsPdfBtn') as HTMLButtonElement;
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.innerHTML = '<span>Generating PDF...</span>';
    }

    // Get period label
    const periodSelect = document.getElementById('analyticsPeriod') as HTMLSelectElement;
    const periodValue = periodSelect?.value || '30';
    const periodLabels: { [key: string]: string } = {
      '7': 'Last 7 Days',
      '30': 'Last 30 Days',
      '90': 'Last 90 Days',
      '365': 'Last Year',
      'all': 'All Time'
    };
    const periodLabel = periodLabels[periodValue] || 'Last 30 Days';

    // Collect analytics data
    const totalSales = workbookData.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalProfit = workbookData.invoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
    const avgOrderValue = workbookData.invoices.length > 0 ? totalSales / workbookData.invoices.length : 0;
    const totalProductsSold = workbookData.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    // Calculate today's profit
    const today = new Date().toISOString().split('T')[0];
    const todayInvoices = workbookData.invoices.filter(inv => inv.date === today);
    const todayProfit = todayInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);

    // Calculate yesterday's profit
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayInvoices = workbookData.invoices.filter(inv => inv.date === yesterdayDate);
    const yesterdayProfit = yesterdayInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);

    // Convert charts to base64 images
    const getChartImage = (chartId: string): string | null => {
      const canvas = document.getElementById(chartId) as HTMLCanvasElement;
      if (canvas) {
        try {
          return canvas.toDataURL('image/png');
        } catch (error) {
          console.error(`Error converting chart ${chartId} to image:`, error);
          return null;
        }
      }
      return null;
    };

    const analyticsData = {
      periodLabel,
      todayProfit: `$${todayProfit.toFixed(2)}`,
      yesterdayProfit: `$${yesterdayProfit.toFixed(2)}`,
      avgOrderValue: `$${avgOrderValue.toFixed(2)}`,
      totalCustomers: workbookData.customers.length.toString(),
      productsSold: `${totalProductsSold} units`,
      profitMargin: `${profitMargin.toFixed(1)}%`,
      salesTrendChart: getChartImage('salesTrendChart'),
      profitTrendChart: getChartImage('profitTrendChart'),
      topProductsChart: getChartImage('topProductsChart'),
      productCategoriesChart: getChartImage('productCategoriesChart'),
      topCustomersChart: getChartImage('topCustomersChart'),
      inventoryStatusChart: getChartImage('inventoryStatusChart')
    };

    // Call the export API
    const result = await api.exportAnalyticsPDF(analyticsData);

    if (result.success) {
      showToast(`Analytics report saved successfully!`, 'success');
    } else {
      showToast(result.message || 'Failed to export analytics to PDF', 'error');
    }
  } catch (error: any) {
    console.error('Error exporting analytics to PDF:', error);
    showToast(error.message || 'An error occurred while exporting', 'error');
  } finally {
    // Restore button state
    const exportBtn = document.getElementById('exportAnalyticsPdfBtn') as HTMLButtonElement;
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span data-translate="analytics.exportPdf">Export to PDF</span>
      `;
    }
  }
}

// Add event listener for export analytics button
const exportAnalyticsPdfBtn = document.getElementById('exportAnalyticsPdfBtn');
exportAnalyticsPdfBtn?.addEventListener('click', exportAnalyticsToPDF);
