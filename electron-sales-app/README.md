# Sales Manager - Electron Desktop Application

A modern desktop application for managing sales, inventory, customers, and invoices with Excel file integration.

## Features

- **Product Management**: Add, edit, and delete products with buy/sell prices and stock tracking
- **Customer Management**: Maintain customer database with contact information
- **Sales Recording**: Record sales with automatic stock updates and profit calculations
- **Invoice Generation**: Create multi-item invoices with printable layouts
- **Reporting**: Sales reports, profit analysis, and low-stock alerts
- **Excel Integration**: All data persisted in Excel file as single source of truth
- **Modern UI**: Clean, responsive design with light/dark theme support
- **Autocomplete**: Smart product and customer search
- **Data Integrity**: Automatic backups, validation, and atomic saves

## Technology Stack

- **Electron**: Desktop application framework
- **TypeScript**: Type-safe development
- **ExcelJS**: Excel file manipulation
- **Plain HTML/CSS**: No front-end frameworks, pure vanilla implementation

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Run in Development Mode

```bash
npm run dev
```

This will compile TypeScript and launch the Electron application.

### Watch Mode (Auto-rebuild)

```bash
npm run watch
```

In another terminal:
```bash
electron .
```

## Building

### Build for Current Platform

```bash
npm run dist
```

### Build for Specific Platforms

```bash
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

Built applications will be in the `release/` directory.

## Project Structure

```
electron-sales-app/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Main entry point
│   │   ├── electron-preload.ts # Preload script with IPC bridge
│   │   └── excel-handler.ts    # Excel file operations
│   └── renderer/               # Renderer process (UI)
│       ├── index.html          # Main HTML
│       ├── styles.css          # Styling
│       └── renderer.ts         # UI logic
├── dist/                       # Compiled JavaScript
├── release/                    # Built applications
├── package.json
├── tsconfig.json
└── README.md
```

## Excel File Structure

The application uses a single Excel file (`sales-data.xlsx` by default) with the following sheets:

### Products Sheet
| ProductName | Quantity | BuyPrice | SalePrice |
|-------------|----------|----------|-----------|
| Apple       | 100      | 1.50     | 3.00      |

### Customers Sheet
| CustomerName | Phone        | Email              | Address        |
|--------------|--------------|-------------------|----------------|
| John Doe     | 555-0100     | john@email.com    | 123 Main St    |

### Sales Sheet
| Date       | InvoiceID | ProductName | Quantity | UnitPrice | Total | Profit |
|------------|-----------|-------------|----------|-----------|-------|--------|
| 2025-10-27 | INV-001   | Apple       | 10       | 3.00      | 30.00 | 15.00  |

### Invoices Sheet
| InvoiceID | Date       | CustomerName | TotalAmount | TotalProfit | Status |
|-----------|------------|--------------|-------------|-------------|--------|
| INV-001   | 2025-10-27 | John Doe     | 30.00       | 15.00       | Paid   |

## Usage

### First Launch

On first launch, the app will:
1. Prompt you to select an existing Excel file, or
2. Create a new `sales-data.xlsx` file with default structure

### Managing Products

1. Navigate to the **Products** tab
2. Click **Add Product** to create new products
3. Edit or delete existing products
4. View current stock levels

### Managing Customers

1. Navigate to the **Customers** tab
2. Add customer information
3. Edit or delete customer records

### Creating Sales/Invoices

1. Navigate to the **Sales** tab
2. Click **New Invoice**
3. Select customer (with autocomplete)
4. Add products to the invoice:
   - Type product name (autocomplete enabled)
   - Enter quantity
   - Unit price auto-fills from product data
   - Total and profit calculated automatically
5. Add multiple items to the same invoice
6. Click **Save Invoice** to:
   - Record the sale
   - Update product stock
   - Generate invoice record
7. Print or save invoice as PDF

### Viewing Reports

1. Navigate to the **Reports** tab
2. Filter by date range
3. View:
   - Total sales and profit
   - Sales by product
   - Low stock alerts
   - Customer purchase history

## Data Persistence & Backups

- All changes are automatically saved to the Excel file
- Backup files are created after each save (`.bak.xlsx`)
- Up to 5 backup copies are maintained
- Atomic saves prevent data corruption

## Security

- Node integration disabled in renderer process
- Context isolation enabled
- All file operations performed in main process
- IPC communication via secure contextBridge API

## Keyboard Shortcuts

- **Ctrl/Cmd + N**: New invoice
- **Ctrl/Cmd + S**: Save current form
- **Ctrl/Cmd + P**: Print invoice
- **Ctrl/Cmd + F**: Focus search
- **Esc**: Close modals/dialogs

## Troubleshooting

### Excel File Locked

If the Excel file is open in another application:
1. Close the other application
2. Click **Retry** in the error dialog
3. Or select a different file

### Invalid Data

The app automatically validates and sanitizes data:
- Non-numeric quantities default to 0
- Negative prices are rejected
- Missing sheets are created automatically

### Low Stock Warning

When selling more than available stock:
1. A warning dialog appears
2. Choose to cancel or proceed
3. Stock can go negative if confirmed

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on the project repository.
