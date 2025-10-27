// Type definitions
interface Product {
  name: string;
  quantity: number;
  buyPrice: number;
  salePrice: number;
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
}

// Global state
let workbookData: WorkbookData = {
  products: [],
  customers: [],
  sales: [],
  invoices: [],
  inventory: []
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
});

async function initializeApp() {
  setupEventListeners();
  loadSavedTheme();
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
  if (result.success) {
    const pathElement = document.getElementById('workbookPath');
    if (pathElement) {
      const fileName = result.path.split('/').pop() || result.path;
      pathElement.textContent = fileName;
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
  document.getElementById('filterReportBtn')?.addEventListener('click', filterReports);
  document.getElementById('exportReportBtn')?.addEventListener('click', exportReport);

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
  renderReports();
}

// Dashboard rendering
function renderDashboard() {
  // Calculate statistics
  const totalSales = workbookData.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalProfit = workbookData.invoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
  const totalProducts = workbookData.products.length;
  const totalCustomers = workbookData.customers.length;

  // Update stat cards
  updateElement('totalSales', `$${totalSales.toFixed(2)}`);
  updateElement('totalProfit', `$${totalProfit.toFixed(2)}`);
  updateElement('totalProducts', totalProducts.toString());
  updateElement('totalCustomers', totalCustomers.toString());

  // Render recent invoices
  renderRecentInvoices();

  // Render low stock alert
  renderLowStockAlert();
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
      <td>$${inv.totalAmount.toFixed(2)}</td>
      <td>$${inv.totalProfit.toFixed(2)}</td>
      <td><span class="badge badge-${getStatusBadgeClass(inv.status)}">${inv.status}</span></td>
    </tr>
  `).join('');
}

function renderLowStockAlert() {
  const container = document.getElementById('lowStockAlert');
  if (!container) return;

  const lowStockProducts = workbookData.products.filter(p => p.quantity < 10);

  if (lowStockProducts.length === 0) {
    container.innerHTML = '<p class="empty-state">All products are well stocked</p>';
    return;
  }

  container.innerHTML = lowStockProducts.map(p => `
    <div class="alert-item">
      <strong>${p.name}</strong> - Only ${p.quantity} units remaining
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
        <td>$${product.buyPrice.toFixed(2)}</td>
        <td>$${product.salePrice.toFixed(2)}</td>
        <td>${profitMargin}%</td>
        <td>
          <button class="btn btn-small btn-secondary" onclick="editProduct('${escapeHtml(product.name)}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteProduct('${escapeHtml(product.name)}')">Delete</button>
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
        <td>$${product.buyPrice.toFixed(2)}</td>
        <td>$${product.salePrice.toFixed(2)}</td>
        <td>${profitMargin}%</td>
        <td>
          <button class="btn btn-small btn-secondary" onclick="editProduct('${escapeHtml(product.name)}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteProduct('${escapeHtml(product.name)}')">Delete</button>
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
      if (title) title.textContent = 'Edit Product';
    }
  } else {
    if (title) title.textContent = 'Add Product';
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
        <button class="btn btn-small btn-secondary" onclick="editCustomer('${escapeHtml(customer.name)}')">Edit</button>
        <button class="btn btn-small btn-danger" onclick="deleteCustomer('${escapeHtml(customer.name)}')">Delete</button>
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
        <button class="btn btn-small btn-secondary" onclick="editCustomer('${escapeHtml(customer.name)}')">Edit</button>
        <button class="btn btn-small btn-danger" onclick="deleteCustomer('${escapeHtml(customer.name)}')">Delete</button>
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
      if (title) title.textContent = 'Edit Customer';
    }
  } else {
    if (title) title.textContent = 'Add Customer';
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

// Invoices rendering
function renderInvoices() {
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  if (workbookData.invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No invoices found</td></tr>';
    return;
  }

  tbody.innerHTML = workbookData.invoices.map(invoice => `
    <tr>
      <td><strong>${invoice.invoiceId}</strong></td>
      <td>${formatDate(invoice.date)}</td>
      <td>${invoice.customerName}</td>
      <td>$${invoice.totalAmount.toFixed(2)}</td>
      <td>$${invoice.totalProfit.toFixed(2)}</td>
      <td><span class="badge badge-${getStatusBadgeClass(invoice.status)}">${invoice.status}</span></td>
      <td>
        <button class="btn btn-small btn-secondary" onclick="viewInvoice('${invoice.invoiceId}')">View</button>
        <button class="btn btn-small btn-primary" onclick="printInvoice('${invoice.invoiceId}')">Print</button>
      </td>
    </tr>
  `).join('');
}

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
      <small>Stock: ${p.quantity} | Price: $${p.salePrice.toFixed(2)}</small>
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
      <td>$${item.unitPrice.toFixed(2)}</td>
      <td>$${item.total.toFixed(2)}</td>
      <td>$${item.profit.toFixed(2)}</td>
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

  updateElement('invoiceTotalAmount', `$${totalAmount.toFixed(2)}`);
  updateElement('invoiceTotalProfit', `$${totalProfit.toFixed(2)}`);
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
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
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
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #333;
        }
        .total-section {
          text-align: right;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: flex-end;
          padding: 8px 0;
        }
        .total-row span:first-child {
          margin-right: 40px;
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
        <h1>INVOICE</h1>
        <p>Invoice #: ${invoice.invoiceId}</p>
        <p>Date: ${formatDate(invoice.date)}</p>
      </div>

      <div class="info-section">
        <div class="info-box">
          <h3>Customer Information</h3>
          <p><strong>${invoice.customerName}</strong></p>
          ${customer ? `
            <p>${customer.phone}</p>
            <p>${customer.email}</p>
            <p>${customer.address}</p>
          ` : ''}
        </div>
        <div class="info-box">
          <h3>Invoice Details</h3>
          <p><strong>Status:</strong> ${invoice.status}</p>
          <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPrice.toFixed(2)}</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>$${invoice.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Sales Manager - Professional Invoice System</p>
      </div>
    </body>
    </html>
  `;
}

// Reports rendering
function renderReports() {
  filterReports();
}

function filterReports() {
  const fromDateInput = document.getElementById('reportFromDate') as HTMLInputElement;
  const toDateInput = document.getElementById('reportToDate') as HTMLInputElement;

  const fromDate = fromDateInput?.value ? new Date(fromDateInput.value) : null;
  const toDate = toDateInput?.value ? new Date(toDateInput.value) : null;

  // Filter invoices by date range
  const filteredInvoices = workbookData.invoices.filter(inv => {
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
  updateElement('reportTotalSales', `$${totalSales.toFixed(2)}`);
  updateElement('reportTotalProfit', `$${totalProfit.toFixed(2)}`);
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
      <td>$${data.sales.toFixed(2)}</td>
      <td>$${data.profit.toFixed(2)}</td>
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
  (document as any).getElementById('totalStockValue').textContent = `$${totalStockValue.toFixed(2)}`;
  (document as any).getElementById('lowStockCount').textContent = lowStockCount;

  // Render inventory movements table
  const tbody = (document as any).getElementById('inventoryTableBody');
  if (!tbody) return;

  if (workbookData.inventory.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No inventory movements yet</td></tr>';
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
