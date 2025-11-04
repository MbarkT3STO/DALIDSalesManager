// Modern Splash Screen JavaScript - Enhanced Version with Theme Support
document.addEventListener('DOMContentLoaded', () => {
    const progressFill = document.getElementById('progress-fill');
    const loadingText = document.querySelector('.loading-text');
    
    // Create particle background
    createParticles();
    
    // Modern loading messages
    const messages = [
        'Initializing core components...',
        'Loading essential resources...',
        'Setting up secure workspace...',
        'Preparing dashboard interface...',
        'Finalizing application launch...'
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
                    loadingText.textContent = 'Launching application...';
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
});