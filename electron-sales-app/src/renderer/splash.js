// Modern Splash Screen JavaScript - Enhanced Version with Theme Support and Translations
document.addEventListener('DOMContentLoaded', () => {
    const progressFill = document.getElementById('progress-fill');
    const loadingText = document.querySelector('.loading-text');
    const backgroundElementsContainer = document.getElementById('background-elements');
    
    // Get current language from localStorage
    let currentLanguage = 'en';
    try {
        const settings = localStorage.getItem('appSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            currentLanguage = parsed.language || 'en';
        }
    } catch (error) {
        console.error('Failed to get language setting:', error);
    }
    
    // Load translations
    let translations = {};
    fetch(`translations/${currentLanguage}.json`)
        .then(response => response.json())
        .then(data => {
            translations = data;
            // Start the loading process with translated messages
            startLoadingProcess();
        })
        .catch(error => {
            console.error('Failed to load translations:', error);
            // Fallback to English
            if (currentLanguage !== 'en') {
                fetch('translations/en.json')
                    .then(response => response.json())
                    .then(data => {
                        translations = data;
                        // Start the loading process with translated messages
                        startLoadingProcess();
                    })
                    .catch(err => {
                        console.error('Failed to load English translations:', err);
                        // Use default English messages
                        translations = {
                            splash: {
                                initializing: 'Initializing core components...',
                                loadingResources: 'Loading essential resources...',
                                settingUp: 'Setting up secure workspace...',
                                preparing: 'Preparing dashboard interface...',
                                finalizing: 'Finalizing application launch...',
                                launching: 'Launching application...'
                            }
                        };
                        startLoadingProcess();
                    });
            } else {
                // Use default English messages
                translations = {
                    splash: {
                        initializing: 'Initializing core components...',
                        loadingResources: 'Loading essential resources...',
                        settingUp: 'Setting up secure workspace...',
                        preparing: 'Preparing dashboard interface...',
                        finalizing: 'Finalizing application launch...',
                        launching: 'Launching application...'
                    }
                };
                startLoadingProcess();
            }
        });
    
    // Start the loading process with translated messages
    function startLoadingProcess() {
        // Create particle background after translations are loaded
        createParticles();
        
        // Create background elements (names and icons)
        createBackgroundElements();
        
        // Modern loading messages from translations
        const messages = [
            translations.splash.initializing,
            translations.splash.loadingResources,
            translations.splash.settingUp,
            translations.splash.preparing,
            translations.splash.finalizing
        ];
        
        let messageIndex = 0;
        let progress = 0;
        
        // Update loading text with smooth transitions
        const updateText = () => {
            if (loadingText) {
                loadingText.style.opacity = '0';
                loadingText.style.transform = 'translateY(10px)';
                loadingText.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    loadingText.textContent = messages[messageIndex];
                    loadingText.style.opacity = '1';
                    loadingText.style.transform = 'translateY(0)';
                    messageIndex = (messageIndex + 1) % messages.length;
                }, 300);
            }
        };
        
        // Initial text update
        updateText();
        
        // Update text periodically
        const textInterval = setInterval(updateText, 2000);
        
        // Animate progress with easing
        const progressInterval = setInterval(() => {
            // Use easing for more natural progress
            const increment = Math.random() * 3 + 1;
            progress = Math.min(progress + increment, 100);
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                clearInterval(textInterval);
                
                if (loadingText) {
                    loadingText.style.opacity = '0';
                    loadingText.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        loadingText.textContent = translations.splash.launching;
                        loadingText.style.opacity = '1';
                        loadingText.style.transform = 'translateY(0)';
                    }, 300);
                }
                
                // Success animation
                if (progressFill) {
                    progressFill.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
                    progressFill.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.7)';
                }
                
                // Logo success animation
                const logoCircle = document.querySelector('.logo-circle');
                if (logoCircle) {
                    logoCircle.style.animation = 'none';
                    logoCircle.style.boxShadow = '0 0 0 0 rgba(16, 185, 129, 0.3), 0 0 30px rgba(16, 185, 129, 0.5)';
                    // Add pulsing success effect
                    setTimeout(() => {
                        logoCircle.style.transition = 'box-shadow 0.5s ease';
                        logoCircle.style.boxShadow = '0 0 0 20px rgba(16, 185, 129, 0), 0 0 30px rgba(16, 185, 129, 0.5)';
                    }, 100);
                }
            }
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
        }, 80);
        
        // Create particle background
        function createParticles() {
            const particlesContainer = document.getElementById('particles-js');
            if (!particlesContainer) return;
            
            // Get current theme to determine particle colors
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            
            // Create 30 particles
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                
                // Random size
                const size = Math.random() * 10 + 2;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                // Random position
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                
                // Random animation delay and duration
                particle.style.animationDelay = `${Math.random() * 5}s`;
                particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
                
                particlesContainer.appendChild(particle);
            }
        }
        
        // Create background elements (names and icons)
        function createBackgroundElements() {
            if (!backgroundElementsContainer) return;
            
            // Names to display
            const names = ['DALID', 'Leroy', 'Nima', 'Siket', 'MBVRK'];
            
            // Improved Icon SVGs with better knife design
            const icons = [
                // Improved Knife icon
                '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path d="M6.5 2C6.5 2 7 3 8 4C9 5 10 6 11 7C12 8 13 9 14 10C15 11 16 12 17 13C18 14 19 15 19.5 16C20 17 20 18 20 18L18 19L17 18L5 6L4 5L6.5 2ZM17.5 17L18.5 16L12.5 10L11.5 11L17.5 17Z" fill="currentColor"/></svg>',
                // Shotgun icon
                '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path d="M2 12H4V14H2V12M5 11H8V13H5V11M9 10H12V14H9V10M13 9H16V15H13V9M17 8H20V16H17V8M21 7H22V17H21V7Z" fill="currentColor"/></svg>',
                // Riot Shield icon
                '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path d="M12,2L2,7V10C2,16 6,20.5 12,22C18,20.5 22,16 22,10V7L12,2Z" fill="currentColor"/></svg>'
            ];
            
            // Create 30 elements total with more knives
            for (let i = 0; i < 30; i++) {
                const element = document.createElement('div');
                element.classList.add('background-element');
                
                // Random position
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                element.style.left = `${left}%`;
                element.style.top = `${top}%`;
                
                // Random size
                const size = Math.random() * 0.5 + 0.8; // 0.8 to 1.3 times original size
                element.style.transform = `scale(${size})`;
                
                // Random rotation
                const rotation = Math.random() * 360; // 0 to 360 degrees for more variation
                element.style.transform += ` rotate(${rotation}deg)`;
                
                // Random animation delay and duration
                element.style.animationDelay = `${Math.random() * 5}s`;
                element.style.animationDuration = `${Math.random() * 10 + 15}s`;
                
                // Increase the number of knives - 50% chance for knife, 25% for other icons, 25% for names
                const rand = Math.random();
                if (rand < 0.5) { // Knife (50%)
                    const knifeIcon = icons[0]; // Knife is the first icon
                    element.innerHTML = knifeIcon;
                    element.classList.add('icon-element');
                } else if (rand < 0.75) { // Other icons (25%)
                    // Randomly select between shotgun and shield
                    const randomIcon = icons[Math.floor(Math.random() * 2) + 1]; // Index 1 or 2
                    element.innerHTML = randomIcon;
                    element.classList.add('icon-element');
                } else { // Names (25%)
                    const randomName = names[Math.floor(Math.random() * names.length)];
                    element.textContent = randomName;
                    element.style.fontSize = `${Math.random() * 10 + 20}px`; // 20px to 30px
                }
                
                backgroundElementsContainer.appendChild(element);
            }
        }
        
        // Simulate app ready after 4 seconds for testing
        setTimeout(() => {
            if (typeof window.electronAPI !== 'undefined') {
                window.electronAPI.onAppReady(() => {
                    // Complete progress and close
                    if (progressFill) {
                        progressFill.style.width = '100%';
                    }
                    
                    // Add fade out effect
                    setTimeout(() => {
                        document.body.style.opacity = '0';
                        document.body.style.transition = 'opacity 0.8s ease-out';
                        setTimeout(() => {
                            if (window.close) {
                                window.close();
                            }
                        }, 800);
                    }, 1000);
                });
            }
        }, 4000);
    }
});