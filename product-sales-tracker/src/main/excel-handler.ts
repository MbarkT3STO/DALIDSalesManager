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

  // Generate sample sales data for testing
  async generateSampleData(recordsPerDay: number = 20): Promise<{ success: boolean; message?: string; count?: number }> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.workbookPath);

      const salesSheet = workbook.getWorksheet('Sales');
      if (!salesSheet) {
        throw new Error('Sales sheet not found');
      }

      // Get the current date and create dates for the past 10 days
      const dates: string[] = [];
      const today = new Date();
      
      for (let i = 10; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      // Sample products
      const products = [
        'Laptop Computer', 'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', 
        'External SSD', 'Bluetooth Headphones', 'Smartphone', 'Tablet', 
        'Smart Watch', 'Gaming Console', 'Camera', 'Printer', 
        'Router', 'Monitor', 'Speaker', 'Charger', 
        'Power Bank', 'Webcam', 'Microphone', 'Docking Station'
      ];
      
      // Sample categories
      const categories = ['Electronics', 'Computers', 'Audio', 'Mobile', 'Accessories'];
      
      let totalRecords = 0;
      
      // Generate data for each date
      for (const date of dates) {
        for (let i = 0; i < recordsPerDay; i++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const category = categories[Math.floor(Math.random() * categories.length)];
          const quantity = Math.floor(Math.random() * 10) + 1;
          const buyPrice = parseFloat((Math.random() * 500 + 50).toFixed(2));
          const salePrice = parseFloat((buyPrice * (1 + Math.random() * 0.5 + 0.1)).toFixed(2));
          const total = parseFloat((salePrice * quantity).toFixed(2));
          const profit = parseFloat((total - (buyPrice * quantity)).toFixed(2));
          
          // Generate a unique sale ID
          const saleId = `SL-${date.replace(/-/g, '')}-${String(totalRecords + 1).padStart(4, '0')}`;
          
          // Add new sale by column index to ensure proper placement
          const newRow = [
            date,           // Column 1: Date
            saleId,         // Column 2: SaleID
            `${product} ${category}`,    // Column 3: Product
            buyPrice || 0,  // Column 4: BuyPrice
            salePrice,      // Column 5: SalePrice
            quantity,       // Column 6: Quantity
            total,          // Column 7: Total
            profit          // Column 8: Profit
          ];
          
          salesSheet.addRow(newRow);
          totalRecords++;
        }
      }
      
      await workbook.xlsx.writeFile(this.workbookPath);
      
      return { success: true, count: totalRecords, message: `Generated ${totalRecords} sample records for ${dates.length} days` };
    } catch (error) {
      console.error('Error in generateSampleData:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  // Export daily sales report to PDF
  async exportReportToPDF(report: any, date: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Show save dialog to get output path
      const { dialog } = require('electron');
      const result = await dialog.showSaveDialog({
        title: 'Export Report to PDF',
        defaultPath: `daily-sales-report-${date}.pdf`,
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, message: 'Export cancelled' };
      }

      const outputPath = result.filePath;
      
      // Generate HTML content for the report
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Daily Sales Report - ${date}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .report-title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .report-date { 
              font-size: 18px; 
              color: #666;
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 15px; 
              margin-bottom: 30px;
            }
            .summary-card { 
              border: 1px solid #ddd; 
              border-radius: 8px; 
              padding: 15px; 
              text-align: center;
              background-color: #f8f9fa;
            }
            .summary-label { 
              font-size: 14px; 
              color: #666; 
              margin-bottom: 5px;
            }
            .summary-value { 
              font-size: 20px; 
              font-weight: bold;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left;
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              font-size: 12px; 
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="report-title">Daily Sales Report</div>
            <div class="report-date">${date}</div>
          </div>
          
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total Sales</div>
              <div class="summary-value">$${report.totalSales.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Profit</div>
              <div class="summary-value">$${report.totalProfit.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Sales Count</div>
              <div class="summary-value">${report.salesCount}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Units Sold</div>
              <div class="summary-value">${report.totalUnitsSold}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Sales Value</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Add product details
      for (const product of report.productDetails) {
        htmlContent += `
          <tr>
            <td>${product.productName}</td>
            <td>${product.unitsSold}</td>
            <td>$${product.salesValue.toFixed(2)}</td>
            <td>$${product.profit.toFixed(2)}</td>
          </tr>
        `;
      }

      htmlContent += `
            </tbody>
          </table>
          
          <div class="footer">
            Generated by Product Sales Tracker on ${new Date().toLocaleDateString()}
          </div>
        </body>
        </html>
      `;

      // Write HTML to a temporary file
      const tempHtmlPath = outputPath.replace('.pdf', '.html');
      require('fs').writeFileSync(tempHtmlPath, htmlContent);

      // Convert HTML to PDF using electron-pdf
      const { BrowserWindow } = require('electron');
      const pdfWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false
      });

      await pdfWindow.loadFile(tempHtmlPath);
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdfData = await pdfWindow.webContents.printToPDF({});
      require('fs').writeFileSync(outputPath, pdfData);
      
      // Clean up temporary HTML file
      require('fs').unlinkSync(tempHtmlPath);
      
      // Clean up window
      pdfWindow.destroy();
      
      return { success: true, message: `Report exported successfully to ${outputPath}` };
    } catch (error) {
      console.error('Error exporting report to PDF:', error);
      return { success: false, message: `Failed to export report: ${(error as Error).message}` };
    }
  }

  // Export sales data to Excel file
  async exportToExcel(sales: Sale[], outputPath: string): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Data');
      
      // Define columns
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Sale ID', key: 'saleId', width: 20 },
        { header: 'Product', key: 'productName', width: 30 },
        { header: 'Quantity', key: 'quantity', width: 12 },
        { header: 'Unit Price', key: 'unitPrice', width: 15 },
        { header: 'Buy Price', key: 'buyPrice', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Profit', key: 'profit', width: 15 },
        { header: 'Profit Per Unit', key: 'profitPerUnit', width: 15 }
      ];
      
      // Add data
      sales.forEach(sale => {
        // Calculate profit per unit
        const profitPerUnit = sale.quantity > 0 ? sale.profit / sale.quantity : 0;
        
        worksheet.addRow({
          date: sale.date,
          saleId: sale.saleId,
          productName: sale.productName,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          buyPrice: sale.buyPrice || 0,
          total: sale.total,
          profit: sale.profit,
          profitPerUnit: profitPerUnit
        });
      });
      
      // Format headers
      worksheet.getRow(1).font = { bold: true };
      
      // Write to file
      await workbook.xlsx.writeFile(outputPath);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }
}