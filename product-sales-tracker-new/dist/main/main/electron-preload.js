"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const electron_1 = require("electron");
// Create the API object
const api = {
    testConnection: () => electron_1.ipcRenderer.invoke('test-connection')
};
exports.api = api;
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
//# sourceMappingURL=electron-preload.js.map