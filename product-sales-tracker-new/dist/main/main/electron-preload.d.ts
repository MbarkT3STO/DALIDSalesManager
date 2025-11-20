export interface IElectronAPI {
    testConnection: () => Promise<{
        success: boolean;
        message: string;
    }>;
}
declare const api: IElectronAPI;
export { api };
//# sourceMappingURL=electron-preload.d.ts.map