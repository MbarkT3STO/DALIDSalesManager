// Import Electron API types
import { IElectronAPI } from '../main/electron-preload';
import type { Sale, DailySalesReport } from '../shared/types';

// Declare the global electronAPI and notification functions
declare global {
  interface Window {
    electronAPI: IElectronAPI;
    showSuccess: (title: string, message: string, duration?: number) => void;
    showError: (title: string, message: string, duration?: number) => void;
    showWarning: (title: string, message: string, duration?: number) => void;
    showInfo: (title: string, message: string, duration?: number) => void;
  }
}

// Global variables
let sales: Sale[] = [];
let currentWorkbookPath: string = '';
let currentLanguage: string = 'en';
let translations: any = {};

// DOM Elements
let views: { [key: string]: HTMLElement | null } = {};
let modals: { [key: string]: HTMLElement | null } = {};

// Theme variables
let currentTheme: 'light' | 'dark' | 'auto' = 'auto';

// Application settings interface
interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  // Add other settings here as needed
  workbookPath?: string;
  lastOpenedDate?: string;
  currency?: string;
  language?: string;
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  currency: 'USD',
  language: 'en'
};

// Load settings from localStorage
function loadSettings(): AppSettings {
  try {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage and file
async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));
    console.log('Settings saved to localStorage:', settings);
    
    // Also save to file via IPC if available
    if (window.electronAPI && window.electronAPI.saveSettings) {
      try {
        const result = await window.electronAPI.saveSettings(settings);
        if (result.success) {
          console.log('Settings saved to file:', settings);
        } else {
          console.error('Error saving settings to file:', result.message);
        }
      } catch (error) {
        console.error('Error saving settings to file:', error);
      }
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Initialize all application settings
async function initAppSettings(): Promise<void> {
  try {
    const settings = loadSettings();
    
    // Initialize theme
    currentTheme = settings.theme;
    
    // Set theme select value
    const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.value = settings.theme;
    }
    
    // Set currency select value
    const currencySelect = document.getElementById('currencySelect') as HTMLSelectElement;
    if (currencySelect) {
      currencySelect.value = settings.currency || 'USD';
    }
    
    // Set language select value
    const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
    if (languageSelect) {
      languageSelect.value = settings.language || 'en';
    }
    
    // Initialize language
    currentLanguage = settings.language || 'en';
    
    // Load translations
    await loadTranslations(currentLanguage);
    
    // Set RTL for Arabic
    const html = document.documentElement;
    if (currentLanguage === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', currentLanguage);
    }
    
    // Apply theme
    await setTheme(settings.theme);
    
    // Initialize other settings as needed
    if (settings.workbookPath) {
      currentWorkbookPath = settings.workbookPath;
      // We'll update the display later when the DOM is ready
    }
    
    console.log('App settings initialized');
  } catch (error) {
    console.error('Error initializing app settings:', error);
  }
}

// Initialize theme (deprecated - use initAppSettings instead)
function initTheme(): void {
  initAppSettings();
}

// Toggle theme
async function toggleTheme(): Promise<void> {
  try {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
      await setTheme('light');
    } else {
      await setTheme('dark');
    }
    
    
    // Update theme select
    const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.value = html.getAttribute('data-theme') || 'light';
    }
    
    console.log(`Theme toggled to: ${html.getAttribute('data-theme')}`);
  } catch (error) {
    console.error('Error toggling theme:', error);
  }
}

// Set theme
async function setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
  try {
    const html = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      html.setAttribute('data-theme', theme);
    }
    
    currentTheme = theme;
    
    // Save theme setting
    const settings = loadSettings();
    settings.theme = theme;
    await saveSettings(settings);
    
    // Update icons
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (sunIcon && moonIcon) {
      if (html.getAttribute('data-theme') === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    }
    
    console.log(`Theme set to: ${theme}`);
  } catch (error) {
    console.error('Error setting theme:', error);
  }
}

// Setup Event Listeners
function setupEventListeners(): void {
  try {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function(this: HTMLElement) {
        const viewName = this.getAttribute('data-view');
        if (viewName) {
          showView(viewName);
        }
      });
    });

    // Theme toggle button
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Refresh data button
    const refreshDataBtn = document.getElementById('refreshDataBtn');
    if (refreshDataBtn) {
      refreshDataBtn.addEventListener('click', async function() {
        try {
          // Show loading state
          const refreshIcon = refreshDataBtn.querySelector('svg');
          if (refreshIcon) {
            refreshIcon.innerHTML = `
              <path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/>
              <path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/>
              <path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
            `;
          }
          
          // Reload data from workbook
          await loadData();
          
          // Update UI to reflect current view
          const activeView = document.querySelector('.nav-link.active')?.getAttribute('data-view') || 'dashboard';
          if (activeView === 'sales') {
            renderSales();
          } else if (activeView === 'reports') {
            const reportDateInput = document.getElementById('reportDate') as HTMLInputElement;
            if (reportDateInput && reportDateInput.value) {
              await loadDailyReport(1);
            }
          } else {
            updateDashboard();
          }
          
          // Reset refresh icon
          if (refreshIcon) {
            refreshIcon.innerHTML = `
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            `;
          }
          
          window.showSuccess(t('notifications.success'), t('notifications.dataRefreshed'));
        } catch (error) {
          console.error('Error refreshing data:', error);
          window.showError(t('notifications.error'), (error as Error).message);
          
          // Reset refresh icon even on error
          const refreshIcon = refreshDataBtn.querySelector('svg');
          if (refreshIcon) {
            refreshIcon.innerHTML = `
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            `;
          }
        }
      });
    }

    // Theme select in settings
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', async function(this: HTMLSelectElement) {
        await setTheme(this.value as 'light' | 'dark' | 'auto');
      });
    }
    
    // Currency select in settings
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
      currencySelect.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement;
        const settings = loadSettings();
        settings.currency = target.value;
        await saveSettings(settings);
        // Update UI to reflect the new currency
        updateDashboard();
        renderSales();
      });
    }
    
    // Language select in settings
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement;
        const newLanguage = target.value;
        
        // Load translations for the new language
        await loadTranslations(newLanguage);
        
        // Update language setting
        const settings = loadSettings();
        settings.language = newLanguage;
        saveSettings(settings);
        
        // Apply translations to UI
        applyTranslations();
        
        // Update dashboard and sales to reflect the new language
        updateDashboard();
        renderSales();
        
        // Set RTL for Arabic
        const html = document.documentElement;
        if (newLanguage === 'ar') {
          html.setAttribute('dir', 'rtl');
          html.setAttribute('lang', 'ar');
        } else {
          html.setAttribute('dir', 'ltr');
          html.setAttribute('lang', newLanguage);
        }
      });
    }
    
    // Settings header button for collapsible behavior
    const settingsViewHeaderBtn = document.querySelector('#settings-view .section-header');
    if (settingsViewHeaderBtn) {
      settingsViewHeaderBtn.addEventListener('click', function(this: HTMLElement) {
        const content = this.nextElementSibling as HTMLElement;
        if (content) {
          content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
      });
    }
    
    // Add event listeners for modal close buttons
    const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
    modalCloseButtons.forEach(button => {
      button.addEventListener('click', closeModal);
    });
    
    // Add event listener for clicking outside modal to close it
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modal => {
      modal.addEventListener('click', function(this: HTMLElement, e: Event) {
        if (e.target === this) {
          closeModal();
        }
      });
    });
    
    // Add sale button
    const addSaleBtn = document.getElementById('addSaleBtn');
    if (addSaleBtn) {
      addSaleBtn.addEventListener('click', function() {
        // Set today's date by default
        const today = new Date().toISOString().split('T')[0];
        const saleDateInput = document.getElementById('saleDate') as HTMLInputElement;
        if (saleDateInput) {
          saleDateInput.value = today;
        }
        
        // Generate a new sale ID
        const saleIdInput = document.getElementById('saleId') as HTMLInputElement;
        if (saleIdInput) {
          saleIdInput.value = generateSaleId();
        }
        
        // Clear other fields
        const saleProductInput = document.getElementById('saleProduct') as HTMLInputElement;
        const buyPriceInput = document.getElementById('buyPrice') as HTMLInputElement;
        const saleUnitPriceInput = document.getElementById('saleUnitPrice') as HTMLInputElement;
        const saleQuantityInput = document.getElementById('saleQuantity') as HTMLInputElement;
        const saleTotalInput = document.getElementById('saleTotal') as HTMLInputElement;
        const saleProfitInput = document.getElementById('saleProfit') as HTMLInputElement;
        
        if (saleProductInput) saleProductInput.value = '';
        if (buyPriceInput) buyPriceInput.value = '';
        if (saleUnitPriceInput) saleUnitPriceInput.value = '';
        if (saleQuantityInput) saleQuantityInput.value = '1';
        if (saleTotalInput) saleTotalInput.value = '';
        if (saleProfitInput) saleProfitInput.value = '';
        
        showModal('addSaleModal');
      });
    }
    
    // Save sale button
    const saveSaleBtn = document.getElementById('saveSaleBtn');
    if (saveSaleBtn) {
      saveSaleBtn.addEventListener('click', saveSale);
    }
    
    // Settings header button
    const settingsHeaderBtn = document.getElementById('settingsHeaderBtn');
    if (settingsHeaderBtn) {
      settingsHeaderBtn.addEventListener('click', function() {
        showView('settings');
      });
    }

    console.log('All event listeners set up successfully');
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

// Show a specific view
function showView(viewName: string): void {
  try {
    console.log('showView called with:', viewName);
    console.log('Available views:', views);
    
    // Hide all views
    Object.values(views).forEach(view => {
      if (view) {
        view.style.display = 'none';
      }
    });

    // Show selected view
    const viewToShow = views[viewName];
    console.log('View to show:', viewToShow);
    
    if (viewToShow) {
      viewToShow.style.display = 'block';
      console.log(`View ${viewName} displayed`);
      
      // Special handling for settings view - update workbook path display
      if (viewName === 'settings') {
        const currentWorkbookPathElement = document.getElementById('currentWorkbookPath') as HTMLInputElement;
        if (currentWorkbookPathElement) {
          currentWorkbookPathElement.value = currentWorkbookPath;
        }
      }
      
      // Special handling for reports view - load today's report
      if (viewName === 'reports') {
        // Load the report for the currently selected date
        loadDailyReport(1); // Load first page
      }
    } else {
      console.warn(`View ${viewName} not found`);
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-view="${viewName}"]`);
    console.log('Active link:', activeLink);
    
    if (activeLink) {
      activeLink.classList.add('active');
      console.log(`Nav link for ${viewName} activated`);
    }

    console.log(`View switched to: ${viewName}`);
  } catch (error) {
    console.error(`Error showing view ${viewName}:`, error);
  }
}

// Show a modal
function showModal(modalName: string): void {
  try {
    const modal = modals[modalName];
    const backdrop = document.getElementById('modalBackdrop');
    
    if (modal) {
      modal.classList.add('show');
      
      // Show backdrop
      if (backdrop) {
        backdrop.classList.add('show');
      }
      
      // Generate a new sale ID when opening the add sale modal
      if (modalName === 'addSaleModal') {
        const saleIdInput = document.getElementById('saleId') as HTMLInputElement;
        if (saleIdInput) {
          saleIdInput.value = generateSaleId();
        }
      }
      
      console.log(`Modal ${modalName} shown`);
    } else {
      console.warn(`Modal ${modalName} not found`);
    }
  } catch (error) {
    console.error(`Error showing modal ${modalName}:`, error);
  }
}

// Close modal
function closeModal(): void {
  try {
    Object.values(modals).forEach(modal => {
      if (modal) {
        modal.classList.remove('show');
      }
    });
    
    // Hide backdrop
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('show');
    }
    
    console.log('Modals closed');
  } catch (error) {
    console.error('Error closing modals:', error);
  }
}

// Generate a unique sale ID
function generateSaleId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `SL-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

// Load default workbook
async function loadDefaultWorkbook(): Promise<void> {
  try {
    const result = await window.electronAPI.useDefaultWorkbook();
    
    if (result.success && result.path) {
      currentWorkbookPath = result.path;
      updateWorkbookPathDisplay(result.path);
      
      // Load data from the workbook
      await loadData();
    } else {
      window.showError('Loading Error', result.message || 'Failed to load default workbook');
    }
  } catch (error) {
    console.error('Error loading default workbook:', error);
    window.showError('Loading Error', (error as Error).message);
  }
}

// Create new workbook
async function createNewWorkbook(): Promise<void> {
  try {
    const result = await window.electronAPI.createWorkbook();
    
    if (result.success && result.path) {
      currentWorkbookPath = result.path;
      updateWorkbookPathDisplay(result.path);
      window.showSuccess(t('notifications.workbookCreated'), t('notifications.workbookCreatedMessage'));
      
      // Clear existing data
      sales = [];
      
      // Refresh UI
      renderSales();
    } else {
      window.showError(t('notifications.createError'), result.message || t('notifications.createError'));
    }
  } catch (error) {
    console.error('Error creating new workbook:', error);
    window.showError(t('notifications.createError'), (error as Error).message);
  }
}

// Open existing workbook
async function openExistingWorkbook(): Promise<void> {
  try {
    const result = await window.electronAPI.openWorkbook();
    
    if (result.success && result.path) {
      currentWorkbookPath = result.path;
      updateWorkbookPathDisplay(result.path);
      window.showSuccess(t('notifications.workbookOpened'), t('notifications.workbookOpenedMessage'));
      
      // Load data from the workbook
      await loadData();
    } else {
      window.showError(t('notifications.openError'), result.message || t('notifications.openError'));
    }
  } catch (error) {
    console.error('Error opening workbook:', error);
    window.showError(t('notifications.openError'), (error as Error).message);
  }
}

// Use default workbook
async function useDefaultWorkbook(): Promise<void> {
  try {
    const result = await window.electronAPI.useDefaultWorkbook();
    
    if (result.success && result.path) {
      currentWorkbookPath = result.path;
      updateWorkbookPathDisplay(result.path);
      window.showSuccess(t('notifications.usingDefault'), t('notifications.usingDefaultMessage'));
      
      // Load data from the workbook
      await loadData();
    } else {
      window.showError(t('notifications.error'), result.message || t('notifications.error'));
    }
  } catch (error) {
    console.error('Error using default workbook:', error);
    window.showError(t('notifications.error'), (error as Error).message);
  }
}

// Load data from workbook
async function loadData(): Promise<void> {
  try {
    if (!currentWorkbookPath) {
      return;
    }
    
    // Load sales
    const dataResult = await window.electronAPI.readWorkbook();
    
    if (dataResult.success && dataResult.data) {
      sales = dataResult.data.sales || [];
      renderSales();
      updateDashboard();
    } else {
      window.showError(t('notifications.loadingError'), dataResult.message || t('notifications.loadingError'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
    window.showError(t('notifications.loadingError'), (error as Error).message);
  }
}

// Update workbook path display
function updateWorkbookPathDisplay(path: string): void {
  try {
    // Update the workbook path in the header
    const workbookPathElement = document.getElementById('workbookPath');
    if (workbookPathElement) {
      workbookPathElement.textContent = path;
    }
    
    // Update the current workbook path in settings
    const currentWorkbookPathElement = document.getElementById('currentWorkbookPath') as HTMLInputElement;
    if (currentWorkbookPathElement) {
      currentWorkbookPathElement.value = path;
    }
    
    // Save workbook path to settings
    currentWorkbookPath = path;
    const settings = loadSettings();
    settings.workbookPath = path;
    const today = new Date().toISOString().split('T')[0];
    settings.lastOpenedDate = today;
    saveSettings(settings);
  } catch (error) {
    console.error('Error updating workbook path display:', error);
  }
}

// Save sale
async function saveSale(): Promise<void> {
  try {
    // Get form values
    const product = (document.getElementById('saleProduct') as HTMLInputElement).value.trim();
    const buyPrice = parseFloat((document.getElementById('buyPrice') as HTMLInputElement).value) || 0;
    const unitPrice = parseFloat((document.getElementById('saleUnitPrice') as HTMLInputElement).value) || 0;
    const quantity = parseInt((document.getElementById('saleQuantity') as HTMLInputElement).value) || 0;
    const date = (document.getElementById('saleDate') as HTMLInputElement).value;
    const saleId = (document.getElementById('saleId') as HTMLInputElement).value;
    const total = parseFloat((document.getElementById('saleTotal') as HTMLInputElement).value) || 0;
    const profit = parseFloat((document.getElementById('saleProfit') as HTMLInputElement).value) || 0;
    
    // Validate required fields
    if (!product) {
      window.showError(t('notifications.validationError'), t('notifications.productNameRequired'));
      return;
    }
    
    if (quantity <= 0) {
      window.showError(t('notifications.validationError'), t('notifications.quantityRequired'));
      return;
    }
    
    if (!date) {
      window.showError(t('notifications.validationError'), t('notifications.dateRequired'));
      return;
    }
    
    if (unitPrice <= 0) {
      window.showError(t('notifications.validationError'), t('notifications.salePriceRequired'));
      return;
    }
    
    if (!saleId) {
      window.showError(t('notifications.validationError'), t('notifications.saleIdRequired'));
      return;
    }
    
    // Create sale object
    const sale: Sale = {
      saleId: saleId,
      date,
      productName: product,
      quantity,
      unitPrice,
      total,
      profit,
      buyPrice
    };
    
    // Save to workbook
    const result = await window.electronAPI.addSale(sale);
    
    if (result.success) {
      window.showSuccess(t('notifications.saleRecorded'), t('notifications.saleRecordedMessage'));
      closeModal();
      
      // Reset form
      (document.getElementById('saleProduct') as HTMLInputElement).value = '';
      (document.getElementById('buyPrice') as HTMLInputElement).value = '';
      (document.getElementById('saleUnitPrice') as HTMLInputElement).value = '';
      (document.getElementById('saleQuantity') as HTMLInputElement).value = '1';
      (document.getElementById('saleDate') as HTMLInputElement).value = '';
      (document.getElementById('saleTotal') as HTMLInputElement).value = '';
      (document.getElementById('saleProfit') as HTMLInputElement).value = '';
      
      // Generate new sale ID for next sale
      (document.getElementById('saleId') as HTMLInputElement).value = generateSaleId();
      
      // Reload data
      await loadData();
    } else {
      window.showError(t('notifications.saveFailed'), result.message || t('notifications.saveFailed'));
    }
  } catch (error) {
    console.error('Error saving sale:', error);
    window.showError(t('notifications.saveFailed'), (error as Error).message);
  }
}

// Update sale details when product is selected
function updateSaleDetails(): void {
  try {
    // For now, we'll just clear the unit price since we don't have product data
    const unitPriceInput = document.getElementById('saleUnitPrice') as HTMLInputElement;
    if (unitPriceInput) {
      unitPriceInput.value = '';
    }
    
    // Update totals
    updateSaleTotals();
  } catch (error) {
    console.error('Error updating sale details:', error);
  }
}

// Update sale totals when quantity changes
function updateSaleTotals(): void {
  try {
    const quantity = parseInt((document.getElementById('saleQuantity') as HTMLInputElement).value) || 1;
    const unitPrice = parseFloat((document.getElementById('saleUnitPrice') as HTMLInputElement).value) || 0;
    const buyPrice = parseFloat((document.getElementById('buyPrice') as HTMLInputElement).value) || 0;
    
    // Calculate totals
    const total = unitPrice * quantity;
    const profit = (unitPrice - buyPrice) * quantity;
    
    // Update display
    const totalInput = document.getElementById('saleTotal') as HTMLInputElement;
    const profitInput = document.getElementById('saleProfit') as HTMLInputElement;
    
    if (totalInput) totalInput.value = total.toFixed(2);
    if (profitInput) profitInput.value = profit.toFixed(2);
  } catch (error) {
    console.error('Error updating sale totals:', error);
  }
}

// Render sales table with pagination
function renderSales(page = 1): void {
  try {
    const tbody = document.getElementById('salesBody');
    const salesTable = document.getElementById('salesTable');
    if (!tbody || !salesTable) {
      console.warn('Sales tbody or table not found');
      return;
    }
    
    // Pagination settings
    const itemsPerPage = 10;
    const totalPages = Math.ceil(sales.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sales.length);
    const paginatedSales = sales.slice(startIndex, endIndex);
    
    if (sales.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No sales yet</td></tr>';
      // Remove existing pagination if any
      const existingPagination = salesTable.parentNode?.querySelector('.pagination');
      if (existingPagination) {
        existingPagination.remove();
      }
      return;
    }
    
    tbody.innerHTML = paginatedSales.map(sale => `
      <tr>
        <td>${sale.saleId}</td>
        <td>${sale.date}</td>
        <td>${sale.productName}</td>
        <td>${sale.quantity}</td>
        <td>${formatCurrency(sale.unitPrice)}</td>
        <td>${formatCurrency(sale.total)}</td>
        <td>${formatCurrency(sale.profit)}</td>
        <td>
          <button class="btn btn-icon delete-sale-btn" data-sale-id="${sale.saleId}" title="Delete sale">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.delete-sale-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', function(this: HTMLElement) {
        const saleId = this.getAttribute('data-sale-id');
        if (saleId) {
          showDeleteConfirmation(saleId);
        }
      });
    });
    
    // Remove existing pagination if any
    const existingPagination = salesTable.parentNode?.querySelector('.pagination');
    if (existingPagination) {
      existingPagination.remove();
    }
    
    // Add pagination controls if needed
    if (totalPages > 1) {
      const paginationHTML = createPaginationHTML(page, totalPages, 'sales');
      const parentNode = salesTable.parentNode as HTMLElement | null;
      if (parentNode) {
        parentNode.insertAdjacentHTML('beforeend', paginationHTML);
      }
      
      // Add event listeners to pagination buttons
      const paginationContainer = parentNode?.querySelector('.pagination');
      if (paginationContainer) {
        const paginationButtons = paginationContainer.querySelectorAll('button');
        paginationButtons.forEach(button => {
          button.addEventListener('click', function(this: HTMLElement) {
            const pageAttr = this.getAttribute('data-page');
            const goToPage = this.getAttribute('data-go-to');
            let newPage = page;
            
            if (pageAttr) {
              newPage = parseInt(pageAttr);
            } else if (goToPage === 'first') {
              newPage = 1;
            } else if (goToPage === 'prev') {
              newPage = Math.max(1, page - 1);
            } else if (goToPage === 'next') {
              newPage = Math.min(totalPages, page + 1);
            } else if (goToPage === 'last') {
              newPage = totalPages;
            }
            
            renderSales(newPage);
          });
        });
      }
    }
  } catch (error) {
    console.error('Error rendering sales:', error);
  }
}

// Create pagination HTML
function createPaginationHTML(currentPage: number, totalPages: number, tableType: string): string {
  let paginationHTML = `<div class="pagination">`;
  
  // First button
  paginationHTML += `<button class="btn btn-secondary" data-go-to="first" ${currentPage === 1 ? 'disabled' : ''}>First</button>`;
  
  // Previous button
  paginationHTML += `<button class="btn btn-secondary" data-go-to="prev" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`;
  
  // Page numbers (show current page and nearby pages)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `<button class="btn btn-primary" disabled>${i}</button>`;
    } else {
      paginationHTML += `<button class="btn btn-secondary" data-page="${i}">${i}</button>`;
    }
  }
  
  // Next button
  paginationHTML += `<button class="btn btn-secondary" data-go-to="next" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
  
  // Last button
  paginationHTML += `<button class="btn btn-secondary" data-go-to="last" ${currentPage === totalPages ? 'disabled' : ''}>Last</button>`;
  
  // Page info
  paginationHTML += `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;
  
  paginationHTML += `</div>`;
  
  return paginationHTML;
}

// Show delete confirmation modal
function showDeleteConfirmation(saleId: string): void {
  try {
    const deleteItemType = document.getElementById('deleteItemType') as HTMLInputElement;
    const deleteItemName = document.getElementById('deleteItemName') as HTMLInputElement;
    
    if (deleteItemType) deleteItemType.value = 'sale';
    if (deleteItemName) deleteItemName.value = saleId;
    
    showModal('confirmDeleteModal');
  } catch (error) {
    console.error('Error showing delete confirmation:', error);
  }
}

// Delete sale
async function deleteSale(): Promise<void> {
  try {
    const saleId = (document.getElementById('deleteItemName') as HTMLInputElement).value;
    
    if (!saleId) {
      window.showError(t('notifications.validationError'), t('notifications.saleIdRequired'));
      return;
    }
    
    const result = await window.electronAPI.deleteSale(saleId);
    
    if (result.success) {
      window.showSuccess(t('notifications.success'), t('notifications.saleRecordedMessage'));
      closeModal();
      await loadData();
    } else {
      window.showError(t('notifications.error'), result.message || t('notifications.error'));
    }
  } catch (error) {
    console.error('Error deleting sale:', error);
    window.showError(t('notifications.error'), (error as Error).message);
  }
}

// Update dashboard
function updateDashboard(): void {
  try {
    // Update KPIs
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalSalesCount = sales.length;
    
    const totalSalesElement = document.getElementById('totalSales');
    const totalProfitElement = document.getElementById('totalProfit');
    const totalSalesCountElement = document.getElementById('totalSalesCount');
    
    if (totalSalesElement) totalSalesElement.textContent = formatCurrency(totalSales);
    if (totalProfitElement) totalProfitElement.textContent = formatCurrency(totalProfit);
    if (totalSalesCountElement) totalSalesCountElement.textContent = totalSalesCount.toString();
    
    // Update recent sales
    const recentSalesBody = document.getElementById('recentSalesBody');
    if (recentSalesBody) {
      const recentSales = [...sales].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5);
      
      if (recentSales.length === 0) {
        recentSalesBody.innerHTML = '<tr><td colspan="6" class="empty-state">No sales yet</td></tr>';
      } else {
        recentSalesBody.innerHTML = recentSales.map(sale => `
          <tr>
            <td>${sale.saleId}</td>
            <td>${sale.date}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>${formatCurrency(sale.total)}</td>
            <td>${formatCurrency(sale.profit)}</td>
          </tr>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
}

// Load daily report
async function loadDailyReport(page = 1): Promise<void> {
  try {
    const date = (document.getElementById('reportDate') as HTMLInputElement).value;
    if (!date) {
      return;
    }
    
    const result = await window.electronAPI.getDailySalesReport(date);
    
    if (result.success && result.report) {
      renderDailyReport(result.report, page);
    } else {
      window.showError(t('notifications.error'), result.message || t('reports.loadFailed'));
    }
  } catch (error) {
    console.error('Error loading daily report:', error);
    window.showError(t('notifications.error'), (error as Error).message);
  }
}

// Render daily report with pagination
function renderDailyReport(report: DailySalesReport, page = 1): void {
  try {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) {
      console.warn('Report content element not found');
      return;
    }
    
    // Pagination settings
    const itemsPerPage = 10;
    const totalPages = Math.ceil(report.productDetails.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, report.productDetails.length);
    const paginatedProducts = report.productDetails.slice(startIndex, endIndex);
    
    if (report.productDetails.length === 0) {
      reportContent.innerHTML = `<div class="empty-state" data-translate="reports.selectDateMessage">${t('reports.selectDateMessage')}</div>`;
      return;
    }
    
    let reportHTML = `
      <div class="report-summary">
        <h3>${t('reports.title')} for ${report.date}</h3>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-content">
              <h4 data-translate="sales.totalAmount">${t('sales.totalAmount')}</h4>
              <p class="kpi-value">${formatCurrency(report.totalSales)}</p>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-content">
              <h4 data-translate="dashboard.totalProfit">${t('dashboard.totalProfit')}</h4>
              <p class="kpi-value">${formatCurrency(report.totalProfit)}</p>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-content">
              <h4 data-translate="dashboard.salesCount">${t('dashboard.salesCount')}</h4>
              <p class="kpi-value">${report.salesCount}</p>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-content">
              <h4 data-translate="reports.soldUnits">${t('reports.soldUnits')}</h4>
              <p class="kpi-value">${report.totalUnitsSold}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th data-translate="sales.product">${t('sales.product')}</th>
              <th data-translate="reports.unitsSold">${t('reports.unitsSold')}</th>
              <th data-translate="reports.salesValue">${t('reports.salesValue')}</th>
              <th data-translate="dashboard.totalProfit">${t('dashboard.totalProfit')}</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedProducts.map(sale => `
              <tr>
                <td>${sale.productName}</td>
                <td>${sale.unitsSold}</td>
                <td>${formatCurrency(sale.salesValue)}</td>
                <td>${formatCurrency(sale.profit)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Add pagination controls if needed
    if (totalPages > 1) {
      reportHTML += createPaginationHTML(page, totalPages, 'reports');
    }
    
    reportContent.innerHTML = reportHTML;
    
    // Apply translations to the newly generated content
    const translateElements = reportContent.querySelectorAll('[data-translate]');
    translateElements.forEach(element => {
      const key = element.getAttribute('data-translate');
      if (key) {
        element.textContent = t(key);
      }
    });
    
    // Add event listeners to pagination buttons if pagination exists
    if (totalPages > 1) {
      const paginationButtons = reportContent.querySelectorAll('.pagination button');
      paginationButtons.forEach(button => {
        button.addEventListener('click', function(this: HTMLElement) {
          const pageAttr = this.getAttribute('data-page');
          const goToPage = this.getAttribute('data-go-to');
          let newPage = page;
          
          if (pageAttr) {
            newPage = parseInt(pageAttr);
          } else if (goToPage === 'first') {
            newPage = 1;
          } else if (goToPage === 'prev') {
            newPage = Math.max(1, page - 1);
          } else if (goToPage === 'next') {
            newPage = Math.min(totalPages, page + 1);
          } else if (goToPage === 'last') {
            newPage = totalPages;
          }
          
          renderDailyReport(report, newPage);
        });
      });
    }
  } catch (error) {
    console.error('Error rendering daily report:', error);
  }
}

// Load translations for the specified language
async function loadTranslations(language: string): Promise<void> {
  try {
    const response = await fetch(`translations/${language}.json`);
    translations = await response.json();
    currentLanguage = language;
    console.log(`Translations loaded for language: ${language}`);
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
    // Fallback to English
    if (language !== 'en') {
      await loadTranslations('en');
    }
  }
}

// Get translated text by key
function t(key: string, fallback?: string): string {
  try {
    // Navigate through the translations object using the key
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return fallback or the key itself if translation not found
        return fallback || key;
      }
    }
    
    return value as string;
  } catch (error) {
    console.error(`Error translating key ${key}:`, error);
    return fallback || key;
  }
}

// Apply translations to the UI
function applyTranslations(): void {
  try {
    // Translate elements with data-translate attribute
    const translateElements = document.querySelectorAll('[data-translate]');
    translateElements.forEach(element => {
      const key = element.getAttribute('data-translate');
      if (key) {
        element.textContent = t(key);
      }
    });
    
    // Translate elements with data-translate-title attribute (for tooltips)
    const translateTitleElements = document.querySelectorAll('[data-translate-title]');
    translateTitleElements.forEach(element => {
      const key = element.getAttribute('data-translate-title');
      if (key) {
        element.setAttribute('title', t(key));
      }
    });
    
    // Update the t function in the global scope for notifications
    (window as any).t = t;
    
    console.log('Translations applied to UI');
  } catch (error) {
    console.error('Error applying translations:', error);
  }
}

// Format currency value based on selected currency
function formatCurrency(value: number): string {
  try {
    const settings = loadSettings();
    const currency = settings.currency || 'USD';
    
    // Format the value with the selected currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback to USD format
    return `$${value.toFixed(2)}`;
  }
}

// Show secret window with password protection
async function showSecretWindow(): Promise<void> {
  try {
    // In a real implementation, we would show a password prompt
    // For now, we'll just open the secret window directly
    const result = await window.electronAPI.openSecretWindow();
    if (!result.success) {
      window.showError(t('notifications.error'), result.message || 'Failed to open secret window');
    }
  } catch (error) {
    console.error('Error opening secret window:', error);
    window.showError(t('notifications.error'), (error as Error).message);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize view elements
    views = {
      dashboard: document.getElementById('dashboard-view'),
      sales: document.getElementById('sales-view'),
      reports: document.getElementById('reports-view'),
      settings: document.getElementById('settings-view')
    };

    // Initialize modal elements
    modals = {
      addSaleModal: document.getElementById('addSaleModal'),
      confirmDeleteModal: document.getElementById('confirmDeleteModal')
    };

    // Initialize date inputs
    const today = new Date().toISOString().split('T')[0];
    const reportDateInput = document.getElementById('reportDate') as HTMLInputElement;
    if (reportDateInput) {
      reportDateInput.value = today;
      reportDateInput.addEventListener('change', () => loadDailyReport(1)); // Load first page when date changes
    }

    // Set up sale date to today by default
    const saleDateInput = document.getElementById('saleDate') as HTMLInputElement;
    if (saleDateInput) {
      saleDateInput.value = today;
    }

    // Generate a default sale ID
    const saleIdInput = document.getElementById('saleId') as HTMLInputElement;
    if (saleIdInput) {
      saleIdInput.value = generateSaleId();
    }

    // Initialize all application settings
    await initAppSettings();
    
    // Apply translations to UI
    applyTranslations();
    
    // Check if we have a saved workbook path and load it, otherwise load default
    const settings = loadSettings();
    if (settings.workbookPath) {
      // Load the saved workbook
      try {
        const result = await window.electronAPI.loadWorkbook(settings.workbookPath);
        if (result.success && result.path) {
          currentWorkbookPath = result.path;
          updateWorkbookPathDisplay(result.path);
          // Load data from the workbook
          await loadData();
        } else {
          // Fall back to default workbook
          await loadDefaultWorkbook();
        }
      } catch (error) {
        console.error('Error loading saved workbook:', error);
        // Fall back to default workbook
        await loadDefaultWorkbook();
      }
    } else {
      // Load default workbook
      await loadDefaultWorkbook();
    }

    // Set up all event listeners
    setupEventListeners();

    // Show dashboard by default
    showView('dashboard');

    // Add keyboard shortcut for secret window (Ctrl+Shift+L)
    document.addEventListener('keydown', async (e) => {
      // Check for Ctrl+Shift+L combination
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        await showSecretWindow();
      }
    });

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    window.showError('Error', (error as Error).message);
  }
});

// Close modal when clicking close button or background
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  
  // Close modal when clicking close button
  if (target.classList.contains('modal-close') || target.classList.contains('modal-close-btn')) {
    closeModal();
  }
  
  
  // Close modal when clicking outside modal content
  if (target.classList.contains('modal')) {
    closeModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});