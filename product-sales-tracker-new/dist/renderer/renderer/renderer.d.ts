declare let currentView: string;
declare const views: {
    [key: string]: HTMLElement | null;
};
declare const modals: {
    [key: string]: HTMLElement | null;
};
declare function setupEventListeners(): void;
declare function showView(viewName: string): void;
declare function toggleTheme(): void;
declare function setTheme(theme: 'light' | 'dark' | 'auto'): void;
declare function showModal(modalName: string): void;
declare function closeModal(): void;
declare function saveProduct(): void;
declare function showSuccess(title: string, message: string): void;
declare function showError(title: string, message: string): void;
declare function showWarning(title: string, message: string): void;
declare function showInfo(title: string, message: string): void;
declare function showNotification(title: string, message: string, type?: string): void;
declare function createToastContainer(): HTMLElement;
//# sourceMappingURL=renderer.d.ts.map