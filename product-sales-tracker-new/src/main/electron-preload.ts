import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
export interface IElectronAPI {
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

// Create the API object
const api: IElectronAPI = {
  testConnection: () => ipcRenderer.invoke('test-connection')
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

// Export for TypeScript type checking
export { api };