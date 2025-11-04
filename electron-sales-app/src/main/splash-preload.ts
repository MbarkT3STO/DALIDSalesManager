import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for splash screen
export interface SplashAPI {
  onAppReady: (handler: () => void) => void;
}

// Expose protected methods for the splash screen
contextBridge.exposeInMainWorld('electronAPI', {
  onAppReady: (handler: () => void) => {
    ipcRenderer.removeAllListeners('app-ready');
    ipcRenderer.on('app-ready', () => {
      try { 
        handler(); 
      } catch (error) {
        console.error('Error in app-ready handler:', error);
      }
    });
  }
} as SplashAPI);