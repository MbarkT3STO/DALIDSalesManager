"use strict";
// Global variables
let currentView = 'dashboard';
// DOM Elements
const views = {
    dashboard: document.getElementById('dashboard-view'),
    products: document.getElementById('products-view'),
    sales: document.getElementById('sales-view'),
    reports: document.getElementById('reports-view'),
    settings: document.getElementById('settings-view')
};
const modals = {
    addProduct: document.getElementById('addProductModal')
};
// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initialized');
    // Set up event listeners
    setupEventListeners();
    // Show dashboard by default
    showView('dashboard');
});
// Set up all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    // Navigation links - using event delegation
    const appNav = document.querySelector('.app-nav');
    if (appNav) {
        appNav.addEventListener('click', (e) => {
            const target = e.target;
            const navLink = target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const view = navLink.getAttribute('data-view');
                if (view) {
                    showView(view);
                }
            }
        });
    }
    // Theme toggle button
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    // Theme selection
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            setTheme(theme);
        });
    }
    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(button => {
        button.addEventListener('click', closeModal);
    });
    // Modal background click to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
    // Product buttons
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => showModal('addProduct'));
    }
    const saveProductBtn = document.getElementById('saveProductBtn');
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', saveProduct);
    }
    console.log('All event listeners set up successfully');
}
// Show a specific view
function showView(viewName) {
    console.log('Showing view:', viewName);
    // Hide all views
    Object.values(views).forEach(view => {
        if (view) {
            view.classList.remove('active');
        }
    });
    // Show selected view
    const viewToShow = views[viewName];
    if (viewToShow) {
        viewToShow.classList.add('active');
        currentView = viewName;
        console.log(`View ${viewName} displayed`);
    }
    else {
        console.warn(`View ${viewName} not found`);
    }
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-view="${viewName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        console.log(`Nav link for ${viewName} activated`);
    }
    console.log(`View switched to: ${viewName}`);
}
// Toggle theme
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    if (currentTheme === 'dark') {
        setTheme('light');
    }
    else {
        setTheme('dark');
    }
}
// Set theme
function setTheme(theme) {
    const html = document.documentElement;
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    else {
        html.setAttribute('data-theme', theme);
    }
    // Update theme select
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = theme;
    }
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
// Show a modal
function showModal(modalName) {
    const modal = modals[modalName];
    if (modal) {
        modal.classList.add('show');
        console.log(`Modal ${modalName} shown`);
    }
    else {
        console.warn(`Modal ${modalName} not found`);
    }
}
// Close modal
function closeModal() {
    Object.values(modals).forEach(modal => {
        if (modal) {
            modal.classList.remove('show');
        }
    });
    console.log('Modals closed');
}
// Save product
function saveProduct() {
    console.log('Saving product...');
    closeModal();
    showSuccess('Product Saved', 'The product has been saved successfully');
}
// Notification functions
function showSuccess(title, message) {
    showNotification(title, message, 'success');
}
function showError(title, message) {
    showNotification(title, message, 'error');
}
function showWarning(title, message) {
    showNotification(title, message, 'warning');
}
function showInfo(title, message) {
    showNotification(title, message, 'info');
}
function showNotification(title, message, type = 'info') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
    container.appendChild(toast);
    // Add close event
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}
//# sourceMappingURL=renderer.js.map