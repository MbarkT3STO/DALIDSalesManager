import { IElectronAPI } from '../main/electron-preload';
declare global {
    interface Window {
        electronAPI: IElectronAPI;
        showSuccess: (title: string, message: string, duration?: number) => void;
        showError: (title: string, message: string, duration?: number) => void;
        showWarning: (title: string, message: string, duration?: number) => void;
        showInfo: (title: string, message: string, duration?: number) => void;
    }
}
//# sourceMappingURL=renderer.d.ts.map