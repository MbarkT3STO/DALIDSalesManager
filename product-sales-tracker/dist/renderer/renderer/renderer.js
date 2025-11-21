// Global variables
let sales = [];
let currentWorkbookPath = '';
let currentLanguage = 'en';
let translations = {};
// DOM Elements
let views = {};
let modals = {};
// Theme variables
let currentTheme = 'auto';
// Default settings
const DEFAULT_SETTINGS = {
    theme: 'auto',
    currency: 'USD',
    language: 'en'
};
// Load settings from localStorage
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
    }
    catch (error) {
        console.error('Error loading settings:', error);
    }
    return DEFAULT_SETTINGS;
}
// Save settings to localStorage
function saveSettings(settings) {
    try {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        console.log('Settings saved:', settings);
    }
    catch (error) {
        console.error('Error saving settings:', error);
    }
}
// Initialize all application settings
async function initAppSettings() {
    try {
        const settings = loadSettings();
        // Initialize theme
        currentTheme = settings.theme;
        // Set theme select value
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = settings.theme;
        }
        // Set currency select value
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.value = settings.currency || 'USD';
        }
        // Set language select value
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = settings.language || 'en';
        }
        // Initialize language
        currentLanguage = settings.language || 'en';
        // Load translations
        await loadTranslations(currentLanguage);
        // Apply theme
        setTheme(settings.theme);
        // Initialize other settings as needed
        if (settings.workbookPath) {
            currentWorkbookPath = settings.workbookPath;
            // We'll update the display later when the DOM is ready
        }
        console.log('App settings initialized');
    }
    catch (error) {
        console.error('Error initializing app settings:', error);
    }
}
// Initialize theme (deprecated - use initAppSettings instead)
function initTheme() {
    initAppSettings();
}
// Toggle theme
function toggleTheme() {
    try {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            setTheme('light');
        }
        else {
            setTheme('dark');
        }
        // Update theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = html.getAttribute('data-theme') || 'light';
        }
        console.log(`Theme toggled to: ${html.getAttribute('data-theme')}`);
    }
    catch (error) {
        console.error('Error toggling theme:', error);
    }
}
// Set theme
function setTheme(theme) {
    try {
        const html = document.documentElement;
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
        else {
            html.setAttribute('data-theme', theme);
        }
        currentTheme = theme;
        // Save theme setting
        const settings = loadSettings();
        settings.theme = theme;
        saveSettings(settings);
        // Update icons
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        if (sunIcon && moonIcon) {
            if (html.getAttribute('data-theme') === 'dark') {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            }
            else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        }
        console.log(`Theme set to: ${theme}`);
    }
    catch (error) {
        console.error('Error setting theme:', error);
    }
}
// Setup Event Listeners
function setupEventListeners() {
    try {
        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const typedLink = link;
            if (typedLink.dataset && typedLink.dataset.view) {
                // Skip adding event listener for hidden settings tab
                if (typedLink.dataset.view !== 'settings' || !typedLink.classList.contains('hidden')) {
                    typedLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        console.log('Direct nav link clicked, view:', this.dataset?.view);
                        if (this.dataset?.view) {
                            showView(this.dataset.view);
                        }
                    });
                }
            }
        });
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggleBtn');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
            console.log('themeToggleBtn event listener added');
        }
        // Settings header button
        const settingsHeaderBtn = document.getElementById('settingsHeaderBtn');
        if (settingsHeaderBtn) {
            settingsHeaderBtn.addEventListener('click', () => showView('settings'));
            console.log('settingsHeaderBtn event listener added');
        }
        // Workbook buttons
        const createWorkbookBtn = document.getElementById('createWorkbookBtn');
        if (createWorkbookBtn) {
            createWorkbookBtn.addEventListener('click', createNewWorkbook);
            console.log('createWorkbookBtn event listener added');
        }
        const openWorkbookBtn = document.getElementById('openWorkbookBtn');
        if (openWorkbookBtn) {
            openWorkbookBtn.addEventListener('click', openExistingWorkbook);
            console.log('openWorkbookBtn event listener added');
        }
        const useDefaultWorkbookBtn = document.getElementById('useDefaultWorkbookBtn');
        if (useDefaultWorkbookBtn) {
            useDefaultWorkbookBtn.addEventListener('click', useDefaultWorkbook);
            console.log('useDefaultWorkbookBtn event listener added');
        }
        const changeWorkbookBtn = document.getElementById('changeWorkbookBtn');
        if (changeWorkbookBtn) {
            changeWorkbookBtn.addEventListener('click', useDefaultWorkbook);
            console.log('changeWorkbookBtn event listener added');
        }
        // Sale management buttons
        const addSaleBtn = document.getElementById('addSaleBtn');
        console.log('addSaleBtn element:', addSaleBtn);
        if (addSaleBtn) {
            addSaleBtn.addEventListener('click', () => showModal('addSaleModal'));
            console.log('addSaleBtn event listener added');
        }
        const saveSaleBtn = document.getElementById('saveSaleBtn');
        console.log('saveSaleBtn element:', saveSaleBtn);
        if (saveSaleBtn) {
            saveSaleBtn.addEventListener('click', saveSale);
            console.log('saveSaleBtn event listener added');
        }
        // Delete confirmation button
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', deleteSale);
            console.log('confirmDeleteBtn event listener added');
        }
        // Form inputs
        const saleProduct = document.getElementById('saleProduct');
        if (saleProduct) {
            saleProduct.addEventListener('input', updateSaleDetails);
            console.log('saleProduct event listener added');
        }
        const saleQuantity = document.getElementById('saleQuantity');
        if (saleQuantity) {
            saleQuantity.addEventListener('input', updateSaleTotals);
            console.log('saleQuantity event listener added');
        }
        const saleUnitPrice = document.getElementById('saleUnitPrice');
        if (saleUnitPrice) {
            saleUnitPrice.addEventListener('input', updateSaleTotals);
            console.log('saleUnitPrice event listener added');
        }
        const buyPrice = document.getElementById('buyPrice');
        if (buyPrice) {
            buyPrice.addEventListener('input', updateSaleTotals);
            console.log('buyPrice event listener added');
        }
        // Theme select in settings
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const target = e.target;
                setTheme(target.value);
            });
            console.log('themeSelect event listener added');
        }
        // Currency select in settings
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                const target = e.target;
                const settings = loadSettings();
                settings.currency = target.value;
                saveSettings(settings);
                // Update UI to reflect the new currency
                updateDashboard();
                renderSales();
            });
            console.log('currencySelect event listener added');
        }
        // Language select in settings
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', async (e) => {
                const target = e.target;
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
            });
            console.log('languageSelect event listener added');
        }
        // Settings header button for collapsible behavior
        const settingsViewHeaderBtn = document.querySelector('#settings-view .section-header');
        if (settingsViewHeaderBtn) {
            settingsViewHeaderBtn.addEventListener('click', function () {
                const content = this.nextElementSibling;
                if (content) {
                    content.style.display = content.style.display === 'none' ? 'block' : 'none';
                }
            });
            console.log('settingsViewHeaderBtn event listener added');
        }
        // Add event listeners for modal close buttons
        const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
        modalCloseButtons.forEach(button => {
            button.addEventListener('click', closeModal);
            console.log('Modal close button event listener added');
        });
        // Add event listener for clicking outside modal to close it
        const modalElements = document.querySelectorAll('.modal');
        modalElements.forEach(modal => {
            modal.addEventListener('click', function (e) {
                if (e.target === this) {
                    closeModal();
                }
            });
            console.log('Modal background click event listener added');
        });
        console.log('All event listeners set up successfully');
    }
    catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}
// Show a specific view
function showView(viewName) {
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
                const currentWorkbookPathElement = document.getElementById('currentWorkbookPath');
                if (currentWorkbookPathElement) {
                    currentWorkbookPathElement.value = currentWorkbookPath;
                }
            }
        }
        else {
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
    }
    catch (error) {
        console.error(`Error showing view ${viewName}:`, error);
    }
}
// Show a modal
function showModal(modalName) {
    try {
        const modal = modals[modalName];
        if (modal) {
            modal.classList.add('show');
            // Generate a new sale ID when opening the add sale modal
            if (modalName === 'addSaleModal') {
                const saleIdInput = document.getElementById('saleId');
                if (saleIdInput) {
                    saleIdInput.value = generateSaleId();
                }
            }
            console.log(`Modal ${modalName} shown`);
        }
        else {
            console.warn(`Modal ${modalName} not found`);
        }
    }
    catch (error) {
        console.error(`Error showing modal ${modalName}:`, error);
    }
}
// Close modal
function closeModal() {
    try {
        Object.values(modals).forEach(modal => {
            if (modal) {
                modal.classList.remove('show');
            }
        });
        console.log('Modals closed');
    }
    catch (error) {
        console.error('Error closing modals:', error);
    }
}
// Generate a unique sale ID
function generateSaleId() {
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
async function loadDefaultWorkbook() {
    try {
        const result = await window.electronAPI.useDefaultWorkbook();
        if (result.success && result.path) {
            currentWorkbookPath = result.path;
            updateWorkbookPathDisplay(result.path);
            // Load data from the workbook
            await loadData();
        }
        else {
            window.showError('Loading Error', result.message || 'Failed to load default workbook');
        }
    }
    catch (error) {
        console.error('Error loading default workbook:', error);
        window.showError('Loading Error', error.message);
    }
}
// Create new workbook
async function createNewWorkbook() {
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
        }
        else {
            window.showError(t('notifications.createError'), result.message || t('notifications.createError'));
        }
    }
    catch (error) {
        console.error('Error creating new workbook:', error);
        window.showError(t('notifications.createError'), error.message);
    }
}
// Open existing workbook
async function openExistingWorkbook() {
    try {
        const result = await window.electronAPI.openWorkbook();
        if (result.success && result.path) {
            currentWorkbookPath = result.path;
            updateWorkbookPathDisplay(result.path);
            window.showSuccess(t('notifications.workbookOpened'), t('notifications.workbookOpenedMessage'));
            // Load data from the workbook
            await loadData();
        }
        else {
            window.showError(t('notifications.openError'), result.message || t('notifications.openError'));
        }
    }
    catch (error) {
        console.error('Error opening workbook:', error);
        window.showError(t('notifications.openError'), error.message);
    }
}
// Use default workbook
async function useDefaultWorkbook() {
    try {
        const result = await window.electronAPI.useDefaultWorkbook();
        if (result.success && result.path) {
            currentWorkbookPath = result.path;
            updateWorkbookPathDisplay(result.path);
            window.showSuccess(t('notifications.usingDefault'), t('notifications.usingDefaultMessage'));
            // Load data from the workbook
            await loadData();
        }
        else {
            window.showError(t('notifications.error'), result.message || t('notifications.error'));
        }
    }
    catch (error) {
        console.error('Error using default workbook:', error);
        window.showError(t('notifications.error'), error.message);
    }
}
// Load data from workbook
async function loadData() {
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
        }
        else {
            window.showError(t('notifications.loadingError'), dataResult.message || t('notifications.loadingError'));
        }
    }
    catch (error) {
        console.error('Error loading data:', error);
        window.showError(t('notifications.loadingError'), error.message);
    }
}
// Update workbook path display
function updateWorkbookPathDisplay(path) {
    try {
        // Update the workbook path in the header
        const workbookPathElement = document.getElementById('workbookPath');
        if (workbookPathElement) {
            workbookPathElement.textContent = path;
        }
        // Update the current workbook path in settings
        const currentWorkbookPathElement = document.getElementById('currentWorkbookPath');
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
    }
    catch (error) {
        console.error('Error updating workbook path display:', error);
    }
}
// Save sale
async function saveSale() {
    try {
        // Get form values
        const product = document.getElementById('saleProduct').value.trim();
        const buyPrice = parseFloat(document.getElementById('buyPrice').value) || 0;
        const unitPrice = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
        const quantity = parseInt(document.getElementById('saleQuantity').value) || 0;
        const date = document.getElementById('saleDate').value;
        const saleId = document.getElementById('saleId').value;
        const total = parseFloat(document.getElementById('saleTotal').value) || 0;
        const profit = parseFloat(document.getElementById('saleProfit').value) || 0;
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
        const sale = {
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
            document.getElementById('saleProduct').value = '';
            document.getElementById('buyPrice').value = '';
            document.getElementById('saleUnitPrice').value = '';
            document.getElementById('saleQuantity').value = '1';
            document.getElementById('saleDate').value = '';
            document.getElementById('saleTotal').value = '';
            document.getElementById('saleProfit').value = '';
            // Generate new sale ID for next sale
            document.getElementById('saleId').value = generateSaleId();
            // Reload data
            await loadData();
        }
        else {
            window.showError(t('notifications.saveFailed'), result.message || t('notifications.saveFailed'));
        }
    }
    catch (error) {
        console.error('Error saving sale:', error);
        window.showError(t('notifications.saveFailed'), error.message);
    }
}
// Update sale details when product is selected
function updateSaleDetails() {
    try {
        // For now, we'll just clear the unit price since we don't have product data
        const unitPriceInput = document.getElementById('saleUnitPrice');
        if (unitPriceInput) {
            unitPriceInput.value = '';
        }
        // Update totals
        updateSaleTotals();
    }
    catch (error) {
        console.error('Error updating sale details:', error);
    }
}
// Update sale totals when quantity changes
function updateSaleTotals() {
    try {
        const quantity = parseInt(document.getElementById('saleQuantity').value) || 1;
        const unitPrice = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
        const buyPrice = parseFloat(document.getElementById('buyPrice').value) || 0;
        // Calculate totals
        const total = unitPrice * quantity;
        const profit = (unitPrice - buyPrice) * quantity;
        // Update display
        const totalInput = document.getElementById('saleTotal');
        const profitInput = document.getElementById('saleProfit');
        if (totalInput)
            totalInput.value = total.toFixed(2);
        if (profitInput)
            profitInput.value = profit.toFixed(2);
    }
    catch (error) {
        console.error('Error updating sale totals:', error);
    }
}
// Render sales table
function renderSales() {
    try {
        const tbody = document.getElementById('salesBody');
        if (!tbody) {
            console.warn('Sales tbody not found');
            return;
        }
        if (sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No sales yet</td></tr>';
            return;
        }
        tbody.innerHTML = sales.map(sale => `
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
            button.addEventListener('click', function () {
                const saleId = this.getAttribute('data-sale-id');
                if (saleId) {
                    showDeleteConfirmation(saleId);
                }
            });
        });
    }
    catch (error) {
        console.error('Error rendering sales:', error);
    }
}
// Show delete confirmation modal
function showDeleteConfirmation(saleId) {
    try {
        const deleteItemType = document.getElementById('deleteItemType');
        const deleteItemName = document.getElementById('deleteItemName');
        if (deleteItemType)
            deleteItemType.value = 'sale';
        if (deleteItemName)
            deleteItemName.value = saleId;
        showModal('confirmDeleteModal');
    }
    catch (error) {
        console.error('Error showing delete confirmation:', error);
    }
}
// Delete sale
async function deleteSale() {
    try {
        const saleId = document.getElementById('deleteItemName').value;
        if (!saleId) {
            window.showError(t('notifications.validationError'), t('notifications.saleIdRequired'));
            return;
        }
        const result = await window.electronAPI.deleteSale(saleId);
        if (result.success) {
            window.showSuccess(t('notifications.success'), t('notifications.saleRecordedMessage'));
            closeModal();
            await loadData();
        }
        else {
            window.showError(t('notifications.error'), result.message || t('notifications.error'));
        }
    }
    catch (error) {
        console.error('Error deleting sale:', error);
        window.showError(t('notifications.error'), error.message);
    }
}
// Update dashboard
function updateDashboard() {
    try {
        // Update KPIs
        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
        const totalSalesCount = sales.length;
        const totalSalesElement = document.getElementById('totalSales');
        const totalProfitElement = document.getElementById('totalProfit');
        const totalSalesCountElement = document.getElementById('totalSalesCount');
        if (totalSalesElement)
            totalSalesElement.textContent = formatCurrency(totalSales);
        if (totalProfitElement)
            totalProfitElement.textContent = formatCurrency(totalProfit);
        if (totalSalesCountElement)
            totalSalesCountElement.textContent = totalSalesCount.toString();
        // Update recent sales
        const recentSalesBody = document.getElementById('recentSalesBody');
        if (recentSalesBody) {
            const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
            if (recentSales.length === 0) {
                recentSalesBody.innerHTML = '<tr><td colspan="6" class="empty-state">No sales yet</td></tr>';
            }
            else {
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
    }
    catch (error) {
        console.error('Error updating dashboard:', error);
    }
}
// Load daily report
async function loadDailyReport() {
    try {
        const date = document.getElementById('reportDate').value;
        if (!date) {
            return;
        }
        const result = await window.electronAPI.getDailySalesReport(date);
        if (result.success && result.report) {
            renderDailyReport(result.report);
        }
        else {
            window.showError('Report Error', result.message || 'Failed to load report');
        }
    }
    catch (error) {
        console.error('Error loading daily report:', error);
        window.showError('Report Error', error.message);
    }
}
// Render daily report
function renderDailyReport(report) {
    try {
        const reportContent = document.getElementById('reportContent');
        if (!reportContent) {
            console.warn('Report content element not found');
            return;
        }
        if (report.productDetails.length === 0) {
            reportContent.innerHTML = '<div class="empty-state">No sales for this date</div>';
            return;
        }
        reportContent.innerHTML = `
      <div class="report-summary">
        <h3>Daily Summary for ${report.date}</h3>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-content">
              <h4>Total Sales</h4>
              <p class="kpi-value">${formatCurrency(report.totalSales)}</p>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-content">
              <h4>Total Profit</h4>
              <p class="kpi-value">${formatCurrency(report.totalProfit)}</p>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-content">
              <h4>Sales Count</h4>
              <p class="kpi-value">${report.salesCount}</p>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-content">
              <h4>Sold Units</h4>
              <p class="kpi-value">${report.totalUnitsSold}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Units Sold</th>
              <th>Sales Value</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${report.productDetails.map(sale => `
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
    }
    catch (error) {
        console.error('Error rendering daily report:', error);
    }
}
// Load translations for the specified language
async function loadTranslations(language) {
    try {
        const response = await fetch(`translations/${language}.json`);
        translations = await response.json();
        currentLanguage = language;
        console.log(`Translations loaded for language: ${language}`);
    }
    catch (error) {
        console.error(`Error loading translations for ${language}:`, error);
        // Fallback to English
        if (language !== 'en') {
            await loadTranslations('en');
        }
    }
}
// Get translated text by key
function t(key, fallback) {
    try {
        // Navigate through the translations object using the key
        const keys = key.split('.');
        let value = translations;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                // Return fallback or the key itself if translation not found
                return fallback || key;
            }
        }
        return value;
    }
    catch (error) {
        console.error(`Error translating key ${key}:`, error);
        return fallback || key;
    }
}
// Apply translations to the UI
function applyTranslations() {
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
        window.t = t;
        console.log('Translations applied to UI');
    }
    catch (error) {
        console.error('Error applying translations:', error);
    }
}
// Format currency value based on selected currency
function formatCurrency(value) {
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
    }
    catch (error) {
        console.error('Error formatting currency:', error);
        // Fallback to USD format
        return `$${value.toFixed(2)}`;
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
        const reportDateInput = document.getElementById('reportDate');
        if (reportDateInput) {
            reportDateInput.value = today;
            reportDateInput.addEventListener('change', loadDailyReport);
        }
        // Set up sale date to today by default
        const saleDateInput = document.getElementById('saleDate');
        if (saleDateInput) {
            saleDateInput.value = today;
        }
        // Generate a default sale ID
        const saleIdInput = document.getElementById('saleId');
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
                }
                else {
                    // Fall back to default workbook
                    await loadDefaultWorkbook();
                }
            }
            catch (error) {
                console.error('Error loading saved workbook:', error);
                // Fall back to default workbook
                await loadDefaultWorkbook();
            }
        }
        else {
            // Load default workbook
            await loadDefaultWorkbook();
        }
        // Set up all event listeners
        setupEventListeners();
        // Show dashboard by default
        showView('dashboard');
        console.log('Application initialized successfully');
    }
    catch (error) {
        console.error('Error initializing application:', error);
        window.showError('Error', error.message);
    }
});
// Close modal when clicking close button or background
document.addEventListener('click', (e) => {
    const target = e.target;
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
export {};
//# sourceMappingURL=renderer.js.map