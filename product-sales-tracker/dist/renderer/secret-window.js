// Secret Window JavaScript

// DOM Elements
const closeSecretWindowBtn = document.getElementById('closeSecretWindow');
const generateSampleDataBtn = document.getElementById('generateSampleData');
const resetWorkbookBtn = document.getElementById('resetWorkbook');
const exportAllDataBtn = document.getElementById('exportAllData');
const sampleDataCountInput = document.getElementById('sampleDataCount');

// Close window
if (closeSecretWindowBtn) {
    closeSecretWindowBtn.addEventListener('click', () => {
        window.close();
    });
}

// Generate sample data
if (generateSampleDataBtn) {
    generateSampleDataBtn.addEventListener('click', async () => {
        const count = parseInt(sampleDataCountInput.value) || 20;
        await generateSampleSalesData(count);
    });
}

// Reset workbook
if (resetWorkbookBtn) {
    resetWorkbookBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset the workbook? This will delete all data.')) {
            try {
                // This would require implementation in the main process
                window.showSuccess('Success', 'Workbook reset functionality would be implemented here');
            } catch (error) {
                window.showError('Error', 'Failed to reset workbook');
            }
        }
    });
}

// Export all data
if (exportAllDataBtn) {
    exportAllDataBtn.addEventListener('click', async () => {
        try {
            // This would require implementation in the main process
            window.showSuccess('Success', 'Export functionality would be implemented here');
        } catch (error) {
            window.showError('Error', 'Failed to export data');
        }
    });
}

// Generate sample sales data
async function generateSampleSalesData(recordsPerDay) {
    try {
        // Show loading state
        generateSampleDataBtn.disabled = true;
        generateSampleDataBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg> Generating...';
        
        // Call the main process to generate sample data
        const result = await window.electronAPI.generateSampleData(recordsPerDay);
        
        if (result.success) {
            // Reset button
            generateSampleDataBtn.disabled = false;
            generateSampleDataBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> Generate Sample Data';
            
            window.showSuccess('Success', result.message || `Generated ${result.count} sample records`);
        } else {
            throw new Error(result.message || 'Failed to generate sample data');
        }
    } catch (error) {
        console.error('Error generating sample data:', error);
        generateSampleDataBtn.disabled = false;
        generateSampleDataBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> Generate Sample Data';
        window.showError('Error', error.message || 'Failed to generate sample data');
    }
}

// Initialize window
document.addEventListener('DOMContentLoaded', () => {
    // Set focus to the input field
    if (sampleDataCountInput) {
        sampleDataCountInput.focus();
    }
    
    // Close window with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.close();
        }
    });
    
    // Show notification system if available
    if (typeof window.showSuccess !== 'function') {
        // Create simple notification system
        window.showSuccess = (title, message) => {
            const notification = document.createElement('div');
            notification.className = 'secret-notification success';
            notification.innerHTML = `
                <div class="secret-notification-content">
                    <strong>${title}</strong>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
        };
        
        window.showError = (title, message) => {
            const notification = document.createElement('div');
            notification.className = 'secret-notification error';
            notification.innerHTML = `
                <div class="secret-notification-content">
                    <strong>${title}</strong>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
        };
    }
});