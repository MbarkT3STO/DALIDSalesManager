// Login functionality
const api = window.electronAPI;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const togglePasswordBtn = document.getElementById('togglePassword');
const eyeIcon = document.getElementById('eyeIcon');

// Toggle password visibility
togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    
    if (type === 'text') {
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
});

// Check for remembered user
window.addEventListener('DOMContentLoaded', () => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        usernameInput.value = rememberedUser;
        rememberMeCheckbox.checked = true;
        passwordInput.focus();
    } else {
        usernameInput.focus();
    }
});

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;
    
    // Hide error message
    errorMessage.style.display = 'none';
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.querySelector('.btn-text').style.display = 'none';
    loginBtn.querySelector('.btn-loader').style.display = 'inline-flex';
    
    try {
        // Ensure workbook is loaded first
        const workbookResult = await api.useDefaultWorkbook();
        if (!workbookResult.success) {
            throw new Error('Failed to load workbook');
        }
        
        // Authenticate user with database
        const result = await api.authenticateUser(username, password);
    
    if (result.success && result.user) {
        const user = result.user;
        // Save user session
        sessionStorage.setItem('currentUser', JSON.stringify({
            username: user.username,
            role: user.role,
            fullName: user.fullName,
            loginTime: new Date().toISOString()
        }));
        
        // Remember user if checkbox is checked
        if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        // Success animation
        loginBtn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
        loginBtn.querySelector('.btn-loader').innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        `;
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } else {
        // Show error
        errorText.textContent = 'Invalid username or password';
        errorMessage.style.display = 'flex';
        
        // Reset button
        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').style.display = 'inline';
        loginBtn.querySelector('.btn-loader').style.display = 'none';
        
        // Shake animation
        loginForm.style.animation = 'none';
        setTimeout(() => {
            loginForm.style.animation = '';
        }, 10);
        
        // Clear password
        passwordInput.value = '';
        passwordInput.focus();
    }
    } catch (error) {
        // Show error
        errorText.textContent = error.message || 'An error occurred during login';
        errorMessage.style.display = 'flex';
        
        // Reset button
        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').style.display = 'inline';
        loginBtn.querySelector('.btn-loader').style.display = 'none';
        
        // Clear password
        passwordInput.value = '';
        passwordInput.focus();
    }
});

// Handle Enter key on inputs
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});

// Add input animation
[usernameInput, passwordInput].forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.style.transform = 'scale(1.02)';
        input.parentElement.style.transition = 'transform 0.2s ease';
    });
    
    input.addEventListener('blur', () => {
        input.parentElement.style.transform = 'scale(1)';
    });
});

// Prevent default behavior on demo links
document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
    });
});
