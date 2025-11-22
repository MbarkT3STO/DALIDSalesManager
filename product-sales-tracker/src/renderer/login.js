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
    console.log(`Attempting to load translations for language: ${language}`);
    console.log(`Fetching from: translations/${language}.json`);
    const response = await fetch(`translations/${language}.json`);
    console.log(`Response status: ${response.status}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    translations = await response.json();
    currentLanguage = language;
    console.log(`Translations loaded for language: ${language}`);
    console.log('Translations object:', translations);
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
    console.log('Applying translations...');
    console.log('Current language:', currentLanguage);
    console.log('Translations object:', translations);
    
    // Translate elements with data-translate attribute
    const translateElements = document.querySelectorAll('[data-translate]');
    console.log(`Found ${translateElements.length} elements to translate`);
    
    translateElements.forEach(element => {
      const key = element.getAttribute('data-translate');
      if (key) {
        const translatedText = t(key);
        console.log(`Translating element with key ${key} to: ${translatedText}`);
        element.textContent = translatedText;
      }
    });
    
    // Translate placeholders with data-translate-placeholder attribute
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    console.log(`Found ${placeholderElements.length} placeholder elements to translate`);
    
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-translate-placeholder');
      if (key) {
        const translatedText = t(key);
        console.log(`Translating placeholder with key ${key} to: ${translatedText}`);
        element.placeholder = translatedText;
      }
    });
    
    // Update the document title
    document.title = t('login.title');
    
    // Set RTL for Arabic
    const html = document.documentElement;
    if (currentLanguage === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', currentLanguage);
    }
    
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
    console.log('=== LOADING LANGUAGE ===');
    // Try to get language from Electron app settings first
    if (window.electronAPI && window.electronAPI.getAppSettings) {
      try {
        console.log('Attempting to load language from Electron IPC...');
        const result = await window.electronAPI.getAppSettings();
        console.log('Electron IPC result:', result);
        if (result.success && result.settings && result.settings.language) {
          console.log('Language from Electron IPC:', result.settings.language);
          await loadTranslations(result.settings.language);
          return;
        } else {
          console.log('No language found in Electron IPC settings');
        }
      } catch (error) {
        console.warn('Could not load language from Electron, falling back to localStorage');
      }
    } else {
      console.log('Electron API or getAppSettings not available');
    }
    
    // Fallback to localStorage
    console.log('Attempting to load language from localStorage...');
    const savedSettings = localStorage.getItem('appSettings');
    console.log('Raw localStorage appSettings:', savedSettings);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        console.log('Parsed localStorage settings:', settings);
        if (settings.language) {
          console.log('Language from localStorage:', settings.language);
          await loadTranslations(settings.language);
          return;
        } else {
          console.log('No language found in localStorage settings');
        }
      } catch (error) {
        console.error('Error parsing localStorage settings:', error);
      }
    } else {
      console.log('No appSettings found in localStorage');
    }
    
    // Default to English
    console.log('Using default language (English)');
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
  console.log('=== INITIALIZING LOGIN PAGE ===');
  
  // Load theme and language
  console.log('Calling loadTheme()...');
  await loadTheme();
  console.log('loadTheme() completed');
  
  watchSystemTheme();
  
  console.log('Calling loadLanguage()...');
  await loadLanguage();
  console.log('loadLanguage() completed');
  
  // Apply translations
  console.log('Calling applyTranslations()...');
  applyTranslations();
  console.log('applyTranslations() completed');
  
  // Add event listeners
  console.log('Adding event listeners...');
  loginForm.addEventListener('submit', handleLogin);
  console.log('Event listeners added');
  
  console.log('Login page initialized');
  console.log('=== INITIALIZATION COMPLETE ===');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initLoginPage);