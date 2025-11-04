// Modern Splash Screen JavaScript - Enhanced Version with Theme Support and Translations
document.addEventListener('DOMContentLoaded', () => {
    const progressFill = document.getElementById('progress-fill');
    const loadingText = document.querySelector('.loading-text');
    
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