// Default credentials
const DEFAULT_CREDENTIALS = {
  username: 'walid',
  password: 'walid123'
};

// DOM elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const toast = document.getElementById('toast');

// Translations object
let translations = {};
let currentLanguage = 'en';

// Load translations for the specified language
async function loadTranslations(language) {
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
function t(key, fallback) {
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
    
    return value;
  } catch (error) {
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
    
    // Update the document title
    document.title = t('login.title');
    
    console.log('Translations applied to UI');
  } catch (error) {
    console.error('Error applying translations:', error);
  }
}

// Set theme based on saved settings
function setTheme(theme) {
  try {
    const html = document.documentElement;
    
    if (theme === 'auto') {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.setAttribute('data-theme', 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
      }
    } else {
      html.setAttribute('data-theme', theme);
    }
    
    console.log(`Theme set to: ${theme}`);
  } catch (error) {
    console.error('Error setting theme:', error);
  }
}

// Watch for system theme changes
function watchSystemTheme() {
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only update if theme is set to auto
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.theme === 'auto') {
          setTheme('auto');
        }
      }
    });
  } catch (error) {
    console.error('Error watching system theme:', error);
  }
}

// Load theme from settings
async function loadTheme() {
  try {
    // Try to get theme from Electron app settings first
    if (window.electronAPI && window.electronAPI.getAppSettings) {
      try {
        const result = await window.electronAPI.getAppSettings();
        if (result.success && result.settings && result.settings.theme) {
          setTheme(result.settings.theme);
          return;
        }
      } catch (error) {
        console.warn('Could not load settings from Electron, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.theme) {
        setTheme(settings.theme);
        return;
      }
    }
    
    // Default to system preference
    setTheme('auto');
  } catch (error) {
    console.error('Error loading theme:', error);
    // Fallback to light theme
    setTheme('light');
  }
}

// Load language from settings
async function loadLanguage() {
  try {
    // Try to get language from Electron app settings first
    if (window.electronAPI && window.electronAPI.getAppSettings) {
      try {
        const result = await window.electronAPI.getAppSettings();
        if (result.success && result.settings && result.settings.language) {
          await loadTranslations(result.settings.language);
          return;
        }
      } catch (error) {
        console.warn('Could not load language from Electron, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.language) {
        await loadTranslations(settings.language);
        return;
      }
    }
    
    // Default to English
    await loadTranslations('en');
  } catch (error) {
    console.error('Error loading language:', error);
    // Fallback to English
    await loadTranslations('en');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Validate credentials
function validateCredentials(username, password) {
  return username === DEFAULT_CREDENTIALS.username && password === DEFAULT_CREDENTIALS.password;
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  
  // Simple validation
  if (!username || !password) {
    showToast(t('notifications.validationError') || 'Please enter both username and password', 'error');
    return;
  }
  
  // Validate credentials
  if (validateCredentials(username, password)) {
    showToast(t('notifications.success') + ': ' + (t('login.successMessage') || 'Login successful! Redirecting...'), 'success');
    
    // Navigate to main app after a short delay
    setTimeout(async () => {
      try {
        // If we're in Electron, use IPC to navigate to main app
        if (window.electronAPI && window.electronAPI.navigateToMainApp) {
          await window.electronAPI.navigateToMainApp();
        } else {
          // Fallback for browser
          window.location.href = 'index.html';
        }
      } catch (error) {
        console.error('Error navigating to main app:', error);
        window.location.href = 'index.html';
      }
    }, 1500);
  } else {
    showToast(t('notifications.error') + ': ' + (t('login.invalidCredentials') || 'Invalid username or password'), 'error');
  }
}

// Initialize the login page
async function initLoginPage() {
  // Load theme and language
  await loadTheme();
  watchSystemTheme();
  await loadLanguage();
  
  // Apply translations
  applyTranslations();
  
  // Add event listeners
  loginForm.addEventListener('submit', handleLogin);
  
  console.log('Login page initialized');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initLoginPage);