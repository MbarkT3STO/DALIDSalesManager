import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Invoice, Product, Customer, Sale, WorkbookData } from './excel-handler';

export class ExportHandler {
  // Currency conversion rates (base: USD)
  private static currencyRates: { [key: string]: number } = {
    'USD': 1.0,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 149.50,
    'CNY': 7.24,
    'INR': 83.12,
    'AUD': 1.53,
    'CAD': 1.36,
    'CHF': 0.88,
    'MXN': 17.08,
    'BRL': 4.97,
    'ZAR': 18.65,
    'AED': 3.67,
    'SAR': 3.75,
    'TRY': 32.15,
    'RUB': 92.50,
    'KRW': 1340.00,
    'SGD': 1.34,
    'HKD': 7.82,
    'SEK': 10.58,
    'NOK': 10.82,
    'DKK': 6.86,
    'PLN': 4.02,
    'THB': 35.50,
    'MYR': 4.72,
    'IDR': 15750.00,
    'PHP': 56.25,
    'VND': 24500.00,
    'EGP': 48.75,
    'NGN': 1550.00,
    'KES': 129.50,
    'MAD': 10.15
  };

  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    const from = fromCurrency || 'USD';
    const to = toCurrency || 'USD';
    
    if (from === to) return amount;
    
    const fromRate = this.currencyRates[from] || 1;
    const toRate = this.currencyRates[to] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  static getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
      'INR': '₹', 'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'MXN': 'MX$',
      'BRL': 'R$', 'ZAR': 'R', 'AED': 'د.إ', 'SAR': '﷼', 'TRY': '₺',
      'RUB': '₽', 'KRW': '₩', 'SGD': 'S$', 'HKD': 'HK$', 'SEK': 'kr',
      'NOK': 'kr', 'DKK': 'kr', 'PLN': 'zł', 'THB': '฿', 'MYR': 'RM',
      'IDR': 'Rp', 'PHP': '₱', 'VND': '₫', 'EGP': 'E£', 'NGN': '₦',
      'KES': 'KSh', 'MAD': 'د.م.'
    };
    return symbols[currency] || currency;
  }

  static async exportInvoiceToPDF(invoice: Invoice, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        const currency = invoice.currency || 'USD';
        const symbol = this.getCurrencySymbol(currency);

        // Header
        doc.fontSize(24).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice details
        doc.fontSize(10);
        doc.text(`Invoice #: ${invoice.invoiceId}`, 50, 120);
        doc.text(`Date: ${invoice.date}`, 50, 135);
        doc.text(`Customer: ${invoice.customerName}`, 50, 150);
        doc.text(`Status: ${invoice.status}`, 50, 165);
        doc.text(`Currency: ${currency}`, 50, 180);

        // Line items table
        const tableTop = 220;
        doc.fontSize(12).text('Items', 50, tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table headers
        const headerY = tableTop + 25;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Product', 50, headerY);
        doc.text('Qty', 300, headerY);
        doc.text('Unit Price', 350, headerY);
        doc.text('Total', 450, headerY);

        // Table rows
        doc.font('Helvetica');
        let yPosition = headerY + 20;
        invoice.items.forEach((item: Sale) => {
          doc.text(item.productName, 50, yPosition, { width: 240 });
          doc.text(item.quantity.toString(), 300, yPosition);
          doc.text(`${symbol}${item.unitPrice.toFixed(2)}`, 350, yPosition);
          doc.text(`${symbol}${item.total.toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });

        // Totals
        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Total Amount:', 350, yPosition);
        doc.text(`${symbol}${invoice.totalAmount.toFixed(2)}`, 450, yPosition);
        
        yPosition += 20;
        doc.text('Total Profit:', 350, yPosition);
        doc.text(`${symbol}${invoice.totalProfit.toFixed(2)}`, 450, yPosition);

        // Footer
        doc.fontSize(8).font('Helvetica').text(
          'Thank you for your business!',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async exportToCSV(data: any[], headers: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const csvRows: string[] = [];
        
        // Add headers
        csvRows.push(headers.join(','));
        
        // Add data rows
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header.toLowerCase().replace(/\s/g, '')];
            // Escape commas and quotes
            if (value === undefined || value === null) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          });
          csvRows.push(values.join(','));
        });

        fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async exportProductsToCSV(products: Product[], outputPath: string): Promise<void> {
    const headers = ['Name', 'Quantity', 'BuyPrice', 'SalePrice', 'ReorderLevel', 'Currency'];
    const data = products.map(p => ({
      name: p.name,
      quantity: p.quantity,
      buyprice: p.buyPrice,
      saleprice: p.salePrice,
      reorderlevel: p.reorderLevel || 10,
      currency: p.currency || 'USD'
    }));
    return this.exportToCSV(data, headers, outputPath);
  }

  static async exportCustomersToCSV(customers: Customer[], outputPath: string): Promise<void> {
    const headers = ['Name', 'Phone', 'Email', 'Address'];
    const data = customers.map(c => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address
    }));
    return this.exportToCSV(data, headers, outputPath);
  }

  static async exportSalesToCSV(sales: Sale[], outputPath: string): Promise<void> {
    const headers = ['Date', 'InvoiceID', 'ProductName', 'Quantity', 'UnitPrice', 'Total', 'Profit', 'Currency'];
    const data = sales.map(s => ({
      date: s.date,
      invoiceid: s.invoiceId,
      productname: s.productName,
      quantity: s.quantity,
      unitprice: s.unitPrice,
      total: s.total,
      profit: s.profit,
      currency: s.currency || 'USD'
    }));
    return this.exportToCSV(data, headers, outputPath);
  }

  static async exportInvoicesToCSV(invoices: Invoice[], outputPath: string): Promise<void> {
    const headers = ['InvoiceID', 'Date', 'CustomerName', 'TotalAmount', 'TotalProfit', 'Status', 'Currency'];
    const data = invoices.map(i => ({
      invoiceid: i.invoiceId,
      date: i.date,
      customername: i.customerName,
      totalamount: i.totalAmount,
      totalprofit: i.totalProfit,
      status: i.status,
      currency: i.currency || 'USD'
    }));
    return this.exportToCSV(data, headers, outputPath);
  }

  static async exportAllDataToCSV(workbookData: WorkbookData, outputDir: string): Promise<void> {
    await this.exportProductsToCSV(workbookData.products, path.join(outputDir, 'products.csv'));
    await this.exportCustomersToCSV(workbookData.customers, path.join(outputDir, 'customers.csv'));
    await this.exportSalesToCSV(workbookData.sales, path.join(outputDir, 'sales.csv'));
    await this.exportInvoicesToCSV(workbookData.invoices, path.join(outputDir, 'invoices.csv'));
  }
}
