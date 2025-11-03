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
          // Show custom price indicator if applicable
          const priceText = item.customUnitPrice && item.customUnitPrice > 0 ? 
            `${symbol}${item.unitPrice.toFixed(2)} (Custom)` : 
            `${symbol}${item.unitPrice.toFixed(2)}`;
          
          doc.text(item.productName, 50, yPosition, { width: 240 });
          doc.text(item.quantity.toString(), 300, yPosition);
          doc.text(priceText, 350, yPosition);
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

  static async exportAnalyticsToPDF(analyticsData: any, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 40,
          size: 'A4',
          bufferPages: true
        });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        const primaryColor = '#4F46E5'; // Indigo
        const accentColor = '#6366F1'; // Light indigo
        const textColor = '#1F2937'; // Gray-800
        const lightGray = '#F3F4F6'; // Gray-100
        const mediumGray = '#9CA3AF'; // Gray-400

        // Helper function to draw a gradient-like header
        const drawHeader = () => {
          doc.rect(0, 0, doc.page.width, 120).fill('#4F46E5');
          
          // Title
          doc.fontSize(28).fillColor('white').font('Helvetica-Bold')
             .text('Analytics Report', 40, 35);
          
          // Subtitle
          doc.fontSize(12).fillColor('#DCDCFF').font('Helvetica')
             .text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 40, 70);
          
          // Period info
          doc.fontSize(11).fillColor('#C8C8FF')
             .text(`Period: ${analyticsData.periodLabel || 'All Time'}`, 40, 90);
        };

        // Draw header
        drawHeader();

        let yPosition = 140;

        // Key Metrics Section
        doc.fontSize(18).fillColor(textColor).font('Helvetica-Bold')
           .text('Key Performance Metrics', 40, yPosition);
        
        yPosition += 30;

        // Draw metric cards in a grid (2 columns)
        const metrics = [
          { label: "Today's Profit", value: analyticsData.todayProfit },
          { label: "Yesterday's Profit", value: analyticsData.yesterdayProfit },
          { label: 'Average Order Value', value: analyticsData.avgOrderValue },
          { label: 'Total Customers', value: analyticsData.totalCustomers },
          { label: 'Products Sold', value: analyticsData.productsSold },
          { label: 'Profit Margin', value: analyticsData.profitMargin }
        ];

        const cardWidth = 240;
        const cardHeight = 65;
        const cardGap = 20;
        const cardsPerRow = 2;

        metrics.forEach((metric, index) => {
          const col = index % cardsPerRow;
          const row = Math.floor(index / cardsPerRow);
          const x = 40 + col * (cardWidth + cardGap);
          const y = yPosition + row * (cardHeight + cardGap);

          // Card background with border
          doc.roundedRect(x, y, cardWidth, cardHeight, 5)
             .lineWidth(1)
             .stroke(mediumGray);

          // Colored left border accent
          doc.rect(x, y + 5, 4, cardHeight - 10)
             .fill(primaryColor);

          // Label - ensure clean text rendering
          doc.font('Helvetica')
             .fontSize(9)
             .fillColor(mediumGray);
          doc.text(metric.label, x + 15, y + 15, { 
            width: cardWidth - 25, 
            lineBreak: false,
            continued: false
          });

          // Value - ensure clean text rendering
          doc.font('Helvetica-Bold')
             .fontSize(18)
             .fillColor(textColor);
          doc.text(String(metric.value || '0'), x + 15, y + 35, { 
            width: cardWidth - 25, 
            lineBreak: false,
            continued: false
          });
        });

        yPosition += Math.ceil(metrics.length / cardsPerRow) * (cardHeight + cardGap) + 40;

        // Check if we need a new page
        if (yPosition > doc.page.height - 200) {
          doc.addPage();
          yPosition = 40;
        }

        // Charts Section
        doc.fontSize(18).fillColor(textColor).font('Helvetica-Bold')
           .text('Visual Analytics', 40, yPosition);
        
        yPosition += 30;

        // Chart images
        const charts = [
          { title: 'Sales Trend', subtitle: 'Revenue over time', image: analyticsData.salesTrendChart },
          { title: 'Profit Trend', subtitle: 'Profit over time', image: analyticsData.profitTrendChart },
          { title: 'Top Products', subtitle: 'Best selling products', image: analyticsData.topProductsChart },
          { title: 'Sales by Product', subtitle: 'Revenue distribution', image: analyticsData.productCategoriesChart },
          { title: 'Top Customers', subtitle: 'By total purchases', image: analyticsData.topCustomersChart },
          { title: 'Inventory Status', subtitle: 'Stock levels', image: analyticsData.inventoryStatusChart }
        ];

        for (let i = 0; i < charts.length; i++) {
          const chart = charts[i];
          
          // Skip if no image data
          if (!chart.image) {
            continue;
          }

          // Check if we need a new page (need space for title + image)
          const spaceNeeded = 300;
          if (yPosition > doc.page.height - spaceNeeded) {
            doc.addPage();
            yPosition = 40;
          }

          // Chart title
          doc.fontSize(14).fillColor(textColor).font('Helvetica-Bold')
             .text(chart.title, 40, yPosition);
          
          // Chart subtitle
          doc.fontSize(10).fillColor(mediumGray).font('Helvetica')
             .text(chart.subtitle, 40, yPosition + 18);

          yPosition += 40;

          // Chart image
          try {
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(chart.image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            const imageWidth = 500;
            const imageHeight = 250;
            
            doc.image(imageBuffer, 40, yPosition, {
              width: imageWidth,
              height: imageHeight
            });
            
            yPosition += imageHeight + 30;
          } catch (error) {
            console.error('Error adding chart image:', error);
            doc.fontSize(10).fillColor(mediumGray)
               .text('Chart image not available', 40, yPosition);
            yPosition += 30;
          }
        }

        // Add page numbers
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(9).fillColor(mediumGray).font('Helvetica')
             .text(
               `Page ${i + 1} of ${pageCount}`,
               40,
               doc.page.height - 30,
               { align: 'center', width: doc.page.width - 80 }
             );
        }

        // Footer on last page
        doc.switchToPage(pageCount - 1);
        doc.fontSize(8).fillColor(mediumGray).font('Helvetica-Oblique')
           .text(
             'Generated by DALID Sales Manager - Confidential Business Analytics',
             40,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 80 }
           );

        doc.end();
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  static exportCustomerHistoryPDF(filePath: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const primaryColor = '#4F46E5';
        const darkGray = '#1F2937';
        const mediumGray = '#6B7280';
        const lightGray = '#F3F4F6';

        // Header
        doc.fontSize(24).fillColor(primaryColor).font('Helvetica-Bold')
           .text('Customer History Report', { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(16).fillColor(darkGray).font('Helvetica')
           .text(data.customerName, { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor(mediumGray).font('Helvetica')
           .text(`Generated: ${new Date().toLocaleDateString()} | Currency: ${data.currency || 'USD'}`, { align: 'center' });
        
        doc.moveDown(2);

        // Summary Cards
        const cardY = doc.y;
        const cardWidth = 120;
        const cardHeight = 80;
        const cardSpacing = 15;

        const cards = [
          { label: 'Total Spent', value: data.totalSpent },
          { label: 'Total Invoices', value: data.totalInvoices },
          { label: 'Average Order', value: data.avgOrder },
          { label: 'Last Purchase', value: data.lastPurchase }
        ];

        cards.forEach((card, index) => {
          const x = 50 + (index * (cardWidth + cardSpacing));
          
          doc.rect(x, cardY, cardWidth, cardHeight)
             .fillAndStroke(lightGray, primaryColor);
          
          doc.fontSize(10).fillColor(mediumGray).font('Helvetica')
             .text(card.label, x + 10, cardY + 15, { width: cardWidth - 20, align: 'center' });
          
          doc.fontSize(14).fillColor(darkGray).font('Helvetica-Bold')
             .text(card.value, x + 10, cardY + 40, { width: cardWidth - 20, align: 'center' });
        });

        doc.y = cardY + cardHeight + 30;

        // Invoice History Table
        doc.fontSize(14).fillColor(darkGray).font('Helvetica-Bold')
           .text('Invoice History', 50, doc.y);
        
        doc.moveDown(1);

        // Table Header
        const tableTop = doc.y;
        const colWidths = [80, 80, 100, 100, 80];
        const headers = ['Invoice ID', 'Date', 'Amount', 'Profit', 'Status'];
        
        let xPos = 50;
        headers.forEach((header, i) => {
          doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold')
             .rect(xPos, tableTop, colWidths[i], 25)
             .fill(primaryColor)
             .fillColor('#FFFFFF')
             .text(header, xPos + 5, tableTop + 8, { width: colWidths[i] - 10 });
          xPos += colWidths[i];
        });

        // Table Rows
        let yPos = tableTop + 25;
        data.invoices.forEach((invoice: any, index: number) => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          const rowColor = index % 2 === 0 ? '#FFFFFF' : lightGray;
          xPos = 50;
          
          doc.rect(50, yPos, colWidths.reduce((a, b) => a + b, 0), 20).fill(rowColor);
          
          const rowData = [invoice.invoiceId, invoice.date, invoice.amount, invoice.profit, invoice.status];
          rowData.forEach((data, i) => {
            doc.fontSize(9).fillColor(darkGray).font('Helvetica')
               .text(data, xPos + 5, yPos + 5, { width: colWidths[i] - 10 });
            xPos += colWidths[i];
          });
          
          yPos += 20;
        });

        // Footer
        doc.fontSize(8).fillColor(mediumGray).font('Helvetica-Oblique')
           .text(
             'Generated by DALID Sales Manager',
             50,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 100 }
           );

        doc.end();
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}
