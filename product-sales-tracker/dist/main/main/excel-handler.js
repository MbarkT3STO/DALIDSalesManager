"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelHandler = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const fs = __importStar(require("fs"));
class ExcelHandler {
    constructor(workbookPath) {
        this.workbookPath = workbookPath;
    }
    async ensureWorkbook() {
        if (!fs.existsSync(this.workbookPath)) {
            await this.createDefaultWorkbook();
        }
    }
    async createDefaultWorkbook() {
        const workbook = new exceljs_1.default.Workbook();
        // Single Sales sheet with all required information
        const salesSheet = workbook.addWorksheet('Sales');
        salesSheet.columns = [
            { header: 'Date', key: 'date', width: 12 },
            { header: 'SaleID', key: 'saleId', width: 15 },
            { header: 'Product', key: 'product', width: 25 },
            { header: 'BuyPrice', key: 'buyPrice', width: 12 },
            { header: 'SalePrice', key: 'salePrice', width: 12 },
            { header: 'Quantity', key: 'quantity', width: 12 },
            { header: 'Total', key: 'total', width: 12 },
            { header: 'Profit', key: 'profit', width: 12 }
        ];
        salesSheet.getRow(1).font = { bold: true };
        await workbook.xlsx.writeFile(this.workbookPath);
    }
    async readWorkbook() {
        await this.ensureWorkbook();
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.readFile(this.workbookPath);
        // Read sales
        const salesSheet = workbook.getWorksheet('Sales');
        const sales = [];
        if (salesSheet) {
            salesSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1)
                    return; // Skip header row
                // Read the data from the row by column index (1-based)
                const date = row.getCell(1).value?.toString() || '';
                const saleId = row.getCell(2).value?.toString() || '';
                const productName = row.getCell(3).value?.toString() || '';
                const buyPrice = parseFloat(row.getCell(4).value?.toString() || '0');
                const salePrice = parseFloat(row.getCell(5).value?.toString() || '0');
                const quantity = parseInt(row.getCell(6).value?.toString() || '0');
                const total = parseFloat(row.getCell(7).value?.toString() || '0');
                const profit = parseFloat(row.getCell(8).value?.toString() || '0');
                const sale = {
                    date,
                    saleId,
                    productName,
                    quantity,
                    unitPrice: salePrice,
                    total,
                    profit,
                    buyPrice
                };
                if (sale.saleId) {
                    sales.push(sale);
                }
            });
        }
        return { sales };
    }
    async addSale(sale) {
        try {
            const workbook = new exceljs_1.default.Workbook();
            await workbook.xlsx.readFile(this.workbookPath);
            const salesSheet = workbook.getWorksheet('Sales');
            if (!salesSheet) {
                throw new Error('Sales sheet not found');
            }
            // Add new sale by column index to ensure proper placement
            const newRow = [
                sale.date, // Column 1: Date
                sale.saleId, // Column 2: SaleID
                sale.productName, // Column 3: Product
                sale.buyPrice || 0, // Column 4: BuyPrice
                sale.unitPrice, // Column 5: SalePrice
                sale.quantity, // Column 6: Quantity
                sale.total, // Column 7: Total
                sale.profit // Column 8: Profit
            ];
            salesSheet.addRow(newRow);
            await workbook.xlsx.writeFile(this.workbookPath);
        }
        catch (error) {
            console.error('Error in addSale:', error);
            throw error;
        }
    }
    async getDailySalesReport(date) {
        const { sales } = await this.readWorkbook();
        // Filter sales for the specific date
        const dailySales = sales.filter(sale => sale.date === date);
        // Calculate totals
        let totalSales = 0;
        let totalProfit = 0;
        let totalUnitsSold = 0;
        // Group by product
        const productMap = new Map();
        for (const sale of dailySales) {
            totalSales += sale.total;
            totalProfit += sale.profit;
            totalUnitsSold += sale.quantity;
            if (productMap.has(sale.productName)) {
                const productData = productMap.get(sale.productName);
                productData.unitsSold += sale.quantity;
                productData.salesValue += sale.total;
                productData.profit += sale.profit;
            }
            else {
                productMap.set(sale.productName, {
                    unitsSold: sale.quantity,
                    salesValue: sale.total,
                    profit: sale.profit
                });
            }
        }
        // Convert map to array
        const productDetails = Array.from(productMap.entries()).map(([productName, data]) => ({
            productName,
            unitsSold: data.unitsSold,
            salesValue: data.salesValue,
            profit: data.profit
        }));
        return {
            date,
            totalSales,
            totalProfit,
            totalUnitsSold,
            salesCount: dailySales.length,
            productDetails
        };
    }
    async deleteSale(saleId) {
        try {
            const workbook = new exceljs_1.default.Workbook();
            await workbook.xlsx.readFile(this.workbookPath);
            const salesSheet = workbook.getWorksheet('Sales');
            if (!salesSheet) {
                throw new Error('Sales sheet not found');
            }
            // Find and remove the row with the matching sale ID
            let rowNumberToDelete = null;
            salesSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1)
                    return; // Skip header row
                // Get the sale ID from column 2 (SaleID)
                const currentSaleId = row.getCell(2).value?.toString() || '';
                if (currentSaleId === saleId) {
                    rowNumberToDelete = rowNumber;
                }
            });
            if (rowNumberToDelete) {
                // Remove the row
                salesSheet.spliceRows(rowNumberToDelete, 1);
                await workbook.xlsx.writeFile(this.workbookPath);
            }
            else {
                throw new Error(`Sale with ID ${saleId} not found`);
            }
        }
        catch (error) {
            console.error('Error in deleteSale:', error);
            throw error;
        }
    }
    getWorkbookPath() {
        return this.workbookPath;
    }
}
exports.ExcelHandler = ExcelHandler;
//# sourceMappingURL=excel-handler.js.map