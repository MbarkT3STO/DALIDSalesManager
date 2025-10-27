# 🚀 Quick Start Guide - Sales Manager

## Installation & Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd electron-sales-app
npm install
```

### Step 2: Build the Application
```bash
npm run build
```

### Step 3: Run the Application
```bash
npm start
```

---

## First Launch

When you first launch the application, you'll see a welcome screen with three options:

### Option 1: Open Existing File
- Click "Open Existing File"
- Navigate to `sample-sales-data.xlsx` (included in the project)
- This file contains 10 products, 8 customers, and 7 sample invoices

### Option 2: Create New File
- Click "Create New File"
- Choose a location and name for your Excel file
- Starts with empty sheets

### Option 3: Use Default Location
- Click "Use Default Location"
- Creates `sales-data.xlsx` in the app's data folder
- Starts with empty sheets

**Recommendation**: Use Option 1 with the sample data to explore features immediately!

---

## 5-Minute Tutorial

### 1. Explore the Dashboard (30 seconds)
- View total sales: $12,375
- Total profit: $3,595
- 10 products in inventory
- 8 customers in database
- Recent invoices list
- Low stock alerts

### 2. Browse Products (1 minute)
- Click "Products" tab
- See 10 pre-loaded electronics products
- Try the search box: type "laptop"
- Click "Edit" on any product to modify
- Notice profit margins calculated automatically

### 3. View Customers (30 seconds)
- Click "Customers" tab
- Browse 8 sample customers
- Search by name, email, or phone
- Click "Add Customer" to create new ones

### 4. Create Your First Invoice (2 minutes)
- Click "Sales & Invoices" tab
- Click "New Invoice" button
- **Select Customer**:
  - Type "John" in customer field
  - Autocomplete shows matching customers
  - Select "John Smith"
- **Add Products**:
  - Type "iPhone" in product field
  - Autocomplete shows stock: 25 units
  - Enter quantity: 1
  - Price auto-fills: $1,300
  - Click "Add Item"
- **Add More Items** (optional):
  - Type "AirPods"
  - Quantity: 1
  - Click "Add Item"
- **Save**:
  - Click "Save Invoice"
  - Success notification appears
  - Stock automatically updated

### 5. View Reports (1 minute)
- Click "Reports" tab
- See sales by product
- Adjust date range
- View total sales and profit
- Click "Export" to save report

---

## Key Features to Try

### 🎨 Theme Toggle
- Click the moon/sun icon in top-right
- Switches between dark and light mode
- Preference saved automatically

### 🔍 Smart Autocomplete
- Start typing in any autocomplete field
- Use arrow keys to navigate
- Press Enter to select
- Press Escape to close

### 📄 Invoice Printing
- Go to Sales & Invoices tab
- Click "View" on any invoice
- Opens in new window
- Click "Print" for professional invoice
- Option to save as PDF

### 📊 Low Stock Alerts
- Dashboard shows products with < 10 units
- Mechanical Keyboard: 5 units (after sample sales)
- MacBook Pro 14": 8 units

### 🔄 Data Refresh
- Click refresh icon (🔄) in header
- Reloads all data from Excel file
- Useful if file edited externally

---

## Common Tasks

### Adding a New Product
1. Products tab → "Add Product"
2. Enter: Name, Quantity, Buy Price, Sale Price
3. Click "Save"
4. Product appears in list immediately

### Creating a Multi-Item Invoice
1. Sales tab → "New Invoice"
2. Select customer
3. Add first product
4. Add second product
5. Add third product
6. Review totals
7. Click "Save Invoice"

### Checking Profit Margins
1. Products tab
2. Look at "Profit Margin" column
3. Calculated as: (Sale - Buy) / Buy × 100%
4. Example: Laptop has 50% margin

### Finding Low Stock Items
1. Dashboard tab
2. Scroll to "Low Stock Alert" section
3. Shows all products with < 10 units
4. Click product name to view details

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New invoice |
| `Ctrl/Cmd + S` | Save current form |
| `Ctrl/Cmd + P` | Print invoice |
| `Ctrl/Cmd + F` | Focus search |
| `Esc` | Close modals |
| `↑↓` | Navigate autocomplete |
| `Enter` | Select autocomplete item |

---

## Tips & Tricks

### 💡 Tip 1: Stock Warnings
When adding items to invoice, if quantity > available stock, you'll see a warning. You can still proceed if needed (e.g., for backorders).

### 💡 Tip 2: Invoice IDs
Invoice IDs are auto-generated: `INV-YYYYMMDD-XXX`
- Example: `INV-20251027-001`
- Unique and sortable

### 💡 Tip 3: Automatic Backups
Every time you save, a backup is created:
- Location: Same folder as Excel file
- Format: `filename.TIMESTAMP.bak.xlsx`
- Keeps last 5 backups

### 💡 Tip 4: Search Everything
All tables have search functionality:
- Products: Search by name
- Customers: Search by name, email, or phone
- Invoices: Visible in table

### 💡 Tip 5: Excel Integration
The Excel file is the single source of truth:
- You can edit it directly in Excel
- Click refresh (🔄) to reload changes
- Don't have both open simultaneously

---

## Troubleshooting

### ❌ "No workbook loaded" error
**Solution**: Click refresh or restart app, then select Excel file

### ❌ "Failed to save" error
**Solution**: Close Excel if file is open there, then retry

### ❌ App won't start
**Solution**: 
```bash
npm run build
npm start
```

### ❌ Missing data after restart
**Solution**: Check Excel file location, ensure it wasn't moved

---

## Sample Data Overview

### Products (10 items)
- Laptops: Dell XPS 13, MacBook Pro 14"
- Phones: iPhone 14 Pro, Samsung Galaxy S23
- Tablets: iPad Air
- Audio: AirPods Pro, Sony WH-1000XM5
- Accessories: Logitech Mouse, Monitor, Keyboard

### Customers (8 people)
- John Smith, Sarah Johnson, Michael Brown
- Emily Davis, David Wilson, Jennifer Martinez
- Robert Taylor, Lisa Anderson

### Invoices (7 transactions)
- Total value: $12,375
- Total profit: $3,595
- Date range: Oct 20-26, 2025
- Mix of paid and pending

---

## Next Steps

1. ✅ **Explore Sample Data**: Click through all tabs
2. ✅ **Create Test Invoice**: Practice the workflow
3. ✅ **Try Theme Toggle**: See dark mode
4. ✅ **View Reports**: Check analytics
5. ✅ **Print Invoice**: Test PDF generation

---

## Need Help?

- 📖 Read `README.md` for detailed documentation
- 📊 Check `PROJECT_SUMMARY.md` for technical details
- 🐛 Found a bug? Check console for error messages

---

## Development Commands

```bash
# Development with auto-reload
npm run watch          # Terminal 1: Watch TypeScript
npm start             # Terminal 2: Run Electron

# Build for production
npm run build
npm run dist

# Create platform-specific builds
npm run dist:mac
npm run dist:win
npm run dist:linux
```

---

**Happy Selling! 🎉**

The application is ready to use. Start with the sample data, explore the features, and then create your own products and customers!
