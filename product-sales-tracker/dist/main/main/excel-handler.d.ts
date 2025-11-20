import { Sale } from '../shared/types';
export { Sale };
export declare class ExcelHandler {
    private workbookPath;
    constructor(workbookPath: string);
    ensureWorkbook(): Promise<void>;
    private createDefaultWorkbook;
    readWorkbook(): Promise<{
        sales: Sale[];
    }>;
    addSale(sale: Sale): Promise<void>;
    getDailySalesReport(date: string): Promise<{
        date: string;
        totalSales: number;
        totalProfit: number;
        totalUnitsSold: number;
        salesCount: number;
        productDetails: Array<{
            productName: string;
            unitsSold: number;
            salesValue: number;
            profit: number;
        }>;
    }>;
    deleteSale(saleId: string): Promise<void>;
    getWorkbookPath(): string;
}
//# sourceMappingURL=excel-handler.d.ts.map