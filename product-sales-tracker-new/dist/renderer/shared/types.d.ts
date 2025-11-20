export interface Product {
    name: string;
    quantity: number;
    buyPrice: number;
    salePrice: number;
    reorderLevel?: number;
    isActive?: boolean;
}
export interface Sale {
    date: string;
    saleId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    profit: number;
}
export interface DailySalesReport {
    date: string;
    totalSales: number;
    totalProfit: number;
    totalUnitsSold: number;
    salesCount: number;
    productDetails: {
        productName: string;
        unitsSold: number;
        salesValue: number;
        profit: number;
    }[];
}
//# sourceMappingURL=types.d.ts.map