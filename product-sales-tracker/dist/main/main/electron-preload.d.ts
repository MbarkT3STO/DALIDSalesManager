import { Sale, DailySalesReport } from '../shared/types';
export interface IElectronAPI {
    openWorkbook: () => Promise<{
        success: boolean;
        path?: string;
        message?: string;
    }>;
    createWorkbook: () => Promise<{
        success: boolean;
        path?: string;
        message?: string;
    }>;
    useDefaultWorkbook: () => Promise<{
        success: boolean;
        path?: string;
        message?: string;
    }>;
    loadWorkbook: (path: string) => Promise<{
        success: boolean;
        path?: string;
        message?: string;
    }>;
    readWorkbook: () => Promise<{
        success: boolean;
        data?: {
            sales: Sale[];
        };
        message?: string;
    }>;
    addSale: (sale: Sale) => Promise<{
        success: boolean;
        message?: string;
    }>;
    deleteSale: (saleId: string) => Promise<{
        success: boolean;
        message?: string;
    }>;
    getDailySalesReport: (date: string) => Promise<{
        success: boolean;
        report?: DailySalesReport;
        message?: string;
    }>;
    getWorkbookPath: () => Promise<{
        success: boolean;
        path?: string;
        message?: string;
    }>;
    navigateToMainApp: () => Promise<{
        success: boolean;
        message?: string;
    }>;
    getAppSettings: () => Promise<{
        success: boolean;
        settings?: any;
        message?: string;
    }>;
    saveSettings: (settings: any) => Promise<{
        success: boolean;
        message?: string;
    }>;
    exportSalesCSV: () => Promise<{
        success: boolean;
        path?: string;
        message?: string;
    }>;
    exportSalesExcel: () => Promise<{
        success: boolean;
        path?: string;
        message?: string;
    }>;
    exportReportToPDF: (report: any, date: string) => Promise<{
        success: boolean;
        message?: string;
    }>;
    openSecretWindow: () => Promise<{
        success: boolean;
        message?: string;
    }>;
    generateSampleData: (recordsPerDay: number) => Promise<{
        success: boolean;
        message?: string;
        count?: number;
    }>;
}
declare const api: IElectronAPI;
export { api };
//# sourceMappingURL=electron-preload.d.ts.map