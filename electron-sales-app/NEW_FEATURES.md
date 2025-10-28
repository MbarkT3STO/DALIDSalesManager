# New Features Added to DALID Sales Manager

## 🌍 Feature 1: Multi-Currency Support

### Overview
The application now supports multiple currencies for products, invoices, sales, and payments.

### Supported Currencies
- **USD** - US Dollar ($)
- **EUR** - Euro (€)
- **GBP** - British Pound (£)
- **JPY** - Japanese Yen (¥)
- **CNY** - Chinese Yuan (¥)
- **INR** - Indian Rupee (₹)
- **AUD** - Australian Dollar (A$)
- **CAD** - Canadian Dollar (C$)
- **CHF** - Swiss Franc (CHF)
- **MXN** - Mexican Peso (MX$)
- **BRL** - Brazilian Real (R$)
- **ZAR** - South African Rand (R)
- **AED** - UAE Dirham (د.إ)
- **SAR** - Saudi Riyal (﷼)
- **TRY** - Turkish Lira (₺)
- **RUB** - Russian Ruble (₽)
- **KRW** - South Korean Won (₩)
- **SGD** - Singapore Dollar (S$)
- **HKD** - Hong Kong Dollar (HK$)
- **SEK** - Swedish Krona (kr)
- **NOK** - Norwegian Krone (kr)
- **DKK** - Danish Krone (kr)
- **PLN** - Polish Zloty (zł)
- **THB** - Thai Baht (฿)
- **MYR** - Malaysian Ringgit (RM)
- **IDR** - Indonesian Rupiah (Rp)
- **PHP** - Philippine Peso (₱)
- **VND** - Vietnamese Dong (₫)
- **EGP** - Egyptian Pound (E£)
- **NGN** - Nigerian Naira (₦)
- **KES** - Kenyan Shilling (KSh)
- **MAD** - Moroccan Dirham (د.م.)

### Excel Structure Changes
New columns added to sheets:
- **Products Sheet**: Added `Currency` column (6th column)
- **Sales Sheet**: Added `Currency` column (8th column)
- **Invoices Sheet**: Added `Currency` column (7th column)
- **Payments Sheet**: Added `Currency` column (7th column)

### API Functions
```typescript
// Convert currency amounts
api.convertCurrency(amount: number, fromCurrency: string, toCurrency: string)
```

### Usage
1. When adding/editing products, select the currency for pricing
2. Invoices automatically inherit currency from products
3. Payments can be made in different currencies with automatic conversion
4. All reports and analytics show amounts in their respective currencies

---

## 🖨️ Feature 12: Print Functionality

### Overview
Professional invoice printing with customizable templates.

### Features
- **Print Invoices**: Print invoices directly from the app
- **PDF Generation**: Invoices are converted to PDF format for printing
- **Professional Layout**: Clean, professional invoice template
- **Multi-Currency Support**: Displays correct currency symbols
- **Itemized Details**: Shows all line items with quantities and prices

### API Functions
```typescript
// Print an invoice
api.printInvoiceDoc(invoice: Invoice)
```

### Invoice Template Includes
- Invoice number and date
- Customer information
- Itemized product list with quantities and prices
- Subtotals and totals
- Profit information
- Currency-specific formatting
- Professional footer

### Usage
1. View an invoice in the Sales & Invoices tab
2. Click the "Print" button
3. System print dialog will appear
4. Select printer and print settings
5. Print or save as PDF

---

## 📤 Feature 15: Data Export (PDF & CSV)

### Overview
Export your data to PDF and CSV formats for reporting, backup, and analysis.

### Export Options

#### 1. PDF Export
**Invoice to PDF**
- Export individual invoices as professional PDF documents
- Includes all invoice details, line items, and totals
- Perfect for sending to customers or archiving

```typescript
// Export invoice to PDF
api.exportInvoicePDF(invoice: Invoice)
```

#### 2. CSV Export
Export data tables to CSV format for use in Excel, Google Sheets, or other tools.

**Available Exports:**
- **Products**: Export all products with pricing and inventory
- **Customers**: Export customer contact information
- **Sales**: Export all sales transactions
- **Invoices**: Export invoice summaries
- **All Data**: Export everything to separate CSV files

```typescript
// Export functions
api.exportProductsCSV()      // Export products to CSV
api.exportCustomersCSV()     // Export customers to CSV
api.exportSalesCSV()         // Export sales to CSV
api.exportInvoicesCSV()      // Export invoices to CSV
api.exportAllCSV()           // Export all data to folder
```

### CSV File Structure

**products.csv**
```
Name,Quantity,BuyPrice,SalePrice,ReorderLevel,Currency
Product A,100,10.00,15.00,10,USD
```

**customers.csv**
```
Name,Phone,Email,Address
John Doe,123-456-7890,john@example.com,123 Main St
```

**sales.csv**
```
Date,InvoiceID,ProductName,Quantity,UnitPrice,Total,Profit,Currency
2024-01-15,INV-001,Product A,5,15.00,75.00,25.00,USD
```

**invoices.csv**
```
InvoiceID,Date,CustomerName,TotalAmount,TotalProfit,Status,Currency
INV-001,2024-01-15,John Doe,75.00,25.00,Paid,USD
```

### Usage

#### Export Single Invoice to PDF
1. Navigate to Sales & Invoices tab
2. View an invoice
3. Click "Export PDF" button
4. Choose save location
5. PDF is generated and saved

#### Export Data to CSV
1. Go to Reports tab
2. Click "Export" button
3. Select export type:
   - Products
   - Customers
   - Sales
   - Invoices
   - All Data
4. Choose save location
5. CSV file(s) are generated

### Use Cases
- **Backup**: Export all data regularly for backup purposes
- **Analysis**: Import CSV files into Excel for advanced analysis
- **Reporting**: Generate PDF invoices for customers
- **Migration**: Export data to move to another system
- **Sharing**: Share specific datasets with team members
- **Compliance**: Maintain PDF records for accounting/tax purposes

---

## 🔄 Currency Conversion

### Automatic Conversion
The system includes built-in currency conversion rates (based on USD):
- Rates are pre-configured for 33 major currencies
- Conversions happen automatically when needed
- All conversions use USD as the base currency

### Conversion Logic
```
1. Convert source currency to USD
2. Convert USD to target currency
Result = (Amount / SourceRate) * TargetRate
```

### Example
Converting 100 EUR to GBP:
```
100 EUR → USD: 100 / 0.92 = 108.70 USD
108.70 USD → GBP: 108.70 * 0.79 = 85.87 GBP
```

---

## 📊 Updated Data Structures

### Product Interface
```typescript
interface Product {
  name: string;
  quantity: number;
  buyPrice: number;
  salePrice: number;
  reorderLevel?: number;
  category?: string;
  sku?: string;
  currency?: string;  // NEW
}
```

### Invoice Interface
```typescript
interface Invoice {
  invoiceId: string;
  date: string;
  customerName: string;
  totalAmount: number;
  totalProfit: number;
  status: string;
  items: Sale[];
  currency?: string;  // NEW
}
```

### Payment Interface
```typescript
interface Payment {
  paymentId: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: string;
  notes: string;
  currency?: string;  // NEW
}
```

### Sale Interface
```typescript
interface Sale {
  date: string;
  invoiceId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  profit: number;
  currency?: string;  // NEW
}
```

---

## 🚀 Getting Started

### Using Multi-Currency
1. Open or create a workbook
2. When adding products, select currency from dropdown
3. Currency will be used for all transactions with that product
4. View reports in multiple currencies

### Printing Invoices
1. Navigate to Sales & Invoices
2. Click on an invoice to view details
3. Click "Print" button
4. Select printer and print

### Exporting Data
1. Go to Reports tab
2. Click "Export" dropdown
3. Select export format (PDF or CSV)
4. Choose what to export
5. Select save location

---

## 📝 Notes

- **Default Currency**: If no currency is specified, USD is used
- **Currency Rates**: Rates are fixed in the application (not live rates)
- **PDF Quality**: PDFs are generated at high quality for professional use
- **CSV Compatibility**: CSV files are compatible with Excel, Google Sheets, and most spreadsheet applications
- **File Locations**: 
  - Default workbook: `~/Library/Application Support/electron-sales-manager/sales-data.xlsx`
  - Exports: User-selected locations

---

## 🔧 Technical Details

### Dependencies Added
- `pdfkit`: PDF generation library
- `papaparse`: CSV parsing library (for future imports)

### New Files
- `src/main/export-handler.ts`: Handles all export and currency operations

### Modified Files
- `src/main/excel-handler.ts`: Added currency fields to interfaces
- `src/main/main.ts`: Added IPC handlers for export/print
- `src/main/electron-preload.ts`: Exposed new APIs to renderer

### IPC Handlers
- `export-invoice-pdf`: Export invoice to PDF
- `export-products-csv`: Export products to CSV
- `export-customers-csv`: Export customers to CSV
- `export-sales-csv`: Export sales to CSV
- `export-invoices-csv`: Export invoices to CSV
- `export-all-csv`: Export all data to CSV
- `print-invoice`: Print invoice
- `convert-currency`: Convert between currencies

---

## 🎯 Future Enhancements

Potential improvements for future versions:
- Live currency exchange rates via API
- Custom PDF templates
- Batch invoice printing
- Email invoices directly
- Import from CSV
- More export formats (JSON, XML)
- Custom currency rate configuration
- Multi-language support for invoices

---

## 📞 Support

For issues or questions about these features, please refer to the main documentation or contact support.

**Version**: 1.1.0  
**Last Updated**: October 2024
