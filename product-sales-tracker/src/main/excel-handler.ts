import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { Sale } from '../shared/types';

export { Sale };

export class ExcelHandler {
  private workbookPath: string;

  constructor(workbookPath: string) {
    this.workbookPath = workbookPath;
  }

  async ensureWorkbook(): Promise<void> {
    if (!fs.existsSync(this.workbookPath)) {
      await this.createDefaultWorkbook();
    }
  }

  private async createDefaultWorkbook(): Promise<void> {
    const workbook = new ExcelJS.Workbook();

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

  async readWorkbook(): Promise<{ sales: Sale[] }> {
    await this.ensureWorkbook();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.workbookPath);

    // Read sales
    const salesSheet = workbook.getWorksheet('Sales');
    const sales: Sale[] = [];
    
    if (salesSheet) {
      salesSheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber === 1) return; // Skip header row
        
        // Read the data from the row by column index (1-based)
        const date = row.getCell(1).value?.toString() || '';
        const saleId = row.getCell(2).value?.toString() || '';
        const productName = row.getCell(3).value?.toString() || '';
        const buyPrice = parseFloat(row.getCell(4).value?.toString() || '0');
        const salePrice = parseFloat(row.getCell(5).value?.toString() || '0');
        const quantity = parseInt(row.getCell(6).value?.toString() || '0');
        const total = parseFloat(row.getCell(7).value?.toString() || '0');
        const profit = parseFloat(row.getCell(8).value?.toString() || '0');
        
        const sale: Sale = {
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

  async addSale(sale: Sale): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.workbookPath);

      const salesSheet = workbook.getWorksheet('Sales');
      if (!salesSheet) {
        throw new Error('Sales sheet not found');
      }

      // Add new sale by column index to ensure proper placement
      const newRow = [
        sale.date,           // Column 1: Date
        sale.saleId,         // Column 2: SaleID
        sale.productName,    // Column 3: Product
        sale.buyPrice || 0,  // Column 4: BuyPrice
        sale.unitPrice,      // Column 5: SalePrice
        sale.quantity,       // Column 6: Quantity
        sale.total,          // Column 7: Total
        sale.profit          // Column 8: Profit
      ];
      
      salesSheet.addRow(newRow);
      await workbook.xlsx.writeFile(this.workbookPath);
    } catch (error) {
      console.error('Error in addSale:', error);
      throw error;
    }
  }

  async getDailySalesReport(date: string): Promise<{ 
    date: string; 
    totalSales: number; 
    totalProfit: number; 
    totalUnitsSold: number; 
    salesCount: number;
    productDetails: Array<{ 
      productName: string; 
      unitsSold: number; 
      salesValue: number; 
      profit: number 
    }> 
  }> {
    const { sales } = await this.readWorkbook();
    
    // Filter sales for the specific date
    const dailySales = sales.filter(sale => sale.date === date);
    
    // Calculate totals
    let totalSales = 0;
    let totalProfit = 0;
    let totalUnitsSold = 0;
    
    // Group by product
    const productMap = new Map<string, { unitsSold: number; salesValue: number; profit: number }>();
    
    for (const sale of dailySales) {
      totalSales += sale.total;
      totalProfit += sale.profit;
      totalUnitsSold += sale.quantity;
      
      if (productMap.has(sale.productName)) {
        const productData = productMap.get(sale.productName)!;
        productData.unitsSold += sale.quantity;
        productData.salesValue += sale.total;
        productData.profit += sale.profit;
      } else {
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

  async deleteSale(saleId: string): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.workbookPath);

      const salesSheet = workbook.getWorksheet('Sales');
      if (!salesSheet) {
        throw new Error('Sales sheet not found');
      }

      // Find and remove the row with the matching sale ID
      let rowNumberToDelete: number | null = null;
      salesSheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber === 1) return; // Skip header row
        
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
      } else {
        throw new Error(`Sale with ID ${saleId} not found`);
      }
    } catch (error) {
      console.error('Error in deleteSale:', error);
      throw error;
    }
  }

  getWorkbookPath(): string {
    return this.workbookPath;
  }
}