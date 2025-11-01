# Soft Delete Feature for Products

## Overview
Implemented a soft delete feature for products that allows products to be marked as inactive instead of being permanently removed from the database. This ensures that historical invoices remain intact while allowing users to manage their active product catalog.

## Changes Made

### 1. Backend Changes (Excel Handler)

#### File: `src/main/excel-handler.ts`
- **Added `isActive` field** to the `Product` interface
- **Updated Excel sheet structure** to include an `IsActive` column (column 7)
- **Modified `readProducts()`** to read the isActive status from Excel, defaulting to `true` for backward compatibility
- **Modified `addProduct()`** to set isActive to `true` for new products
- **Modified `updateProduct()`** to preserve isActive status when updating
- **Changed `deleteProduct()`** from hard delete (removing row) to soft delete (setting isActive to false)
- **Added `restoreProduct()`** function to reactivate deleted products
- **Added `ensureProductsIsActiveColumn()`** to handle migration of existing workbooks

#### File: `src/main/main.ts`
- **Added IPC handler** for `restore-product` operation

#### File: `src/main/electron-preload.ts`
- **Added `restoreProduct()` function** to the ElectronAPI interface
- **Exposed restore functionality** to the renderer process

### 2. Frontend Changes (Renderer)

#### File: `src/renderer/renderer.ts`
- **Added `isActive` field** to the Product interface
- **Updated all product filters** to show only active products (`isActive !== false`):
  - Dashboard statistics (total products count)
  - Low stock alerts
  - Products table rendering
  - Product search/filtering
  - Product autocomplete in invoice creation
  - Inventory statistics
  - Inventory stock movement dropdown
  - Analytics inventory status chart
- **Added `openDeletedProductsModal()`** function to display deleted products
- **Added `restoreProduct()`** window function to restore deleted products
- **Added event listener** for the "View Deleted" button

#### File: `src/renderer/index.html`
- **Added "View Deleted" button** to the Products tab header
- **Created Deleted Products Modal** with table showing:
  - Product name
  - Quantity
  - Buy price
  - Sale price
  - Restore action button

### 3. Translation Updates

#### Files: `src/renderer/translations/en.json`, `fr.json`, `ar.json`
- **Added new translation keys**:
  - `products.viewDeleted`: "View Deleted"
  - `products.deletedProductsTitle`: "Deleted Products"
  - `products.noDeletedProducts`: "No deleted products"
  - `products.restoreProduct`: "Restore Product"
  - `products.restore`: "Restore"
  - `products.productRestored`: "Product restored successfully"

## Features Implemented

### ✅ Soft Delete
- When a user deletes a product, it is marked as inactive (`isActive = false`)
- The product row remains in the Excel file but is hidden from the UI
- All existing data (quantity, prices, etc.) is preserved

### ✅ Filter Active Products
Products are filtered in:
- **Products List**: Only active products are shown
- **Product Search**: Only searches active products
- **Invoice Product Selection**: Only active products appear in autocomplete
- **Inventory Management**: Only active products in stock movement dropdown
- **Statistics**: Dashboard and inventory stats count only active products
- **Low Stock Alerts**: Only active products are checked for low stock
- **Analytics Charts**: Inventory status chart only includes active products

### ✅ Preserve Historical Data
- **Invoices remain intact**: All invoices continue to show deleted products in their items
- **Sales history preserved**: Historical sales data is not affected
- **Inventory movements**: Past movements remain visible even for deleted products

### ✅ Restore Functionality
- **View Deleted Products**: New button to view all deleted products
- **Restore Action**: Users can restore deleted products with one click
- **Confirmation Dialog**: Asks for confirmation before restoring
- **Success Notification**: Shows toast message when product is restored

### ✅ Backward Compatibility
- **Automatic Migration**: Existing workbooks automatically get the `IsActive` column
- **Default Value**: Existing products default to `isActive = true`
- **No Data Loss**: All existing data is preserved during migration

## User Workflow

### To Delete a Product:
1. Go to Products tab
2. Click the delete (trash) icon next to a product
3. Confirm the deletion
4. Product is marked as inactive and removed from the active list

### To Restore a Product:
1. Go to Products tab
2. Click "View Deleted" button
3. In the modal, click "Restore" next to the product you want to reactivate
4. Confirm the restoration
5. Product becomes active again and appears in the products list

## Technical Details

### Data Storage
- Products are stored in the Excel file's "Products" sheet
- Column structure:
  1. ProductName
  2. Quantity
  3. BuyPrice
  4. SalePrice
  5. ReorderLevel
  6. Currency
  7. **IsActive** (new column)

### Filtering Logic
- Active products: `product.isActive !== false`
- Deleted products: `product.isActive === false`
- This handles both explicitly set false values and undefined values (for backward compatibility)

### Migration Strategy
- When opening an existing workbook, `ensureProductsIsActiveColumn()` is called
- If the IsActive column doesn't exist, it's added
- All existing products get `isActive = true` by default
- New products automatically get `isActive = true`

## Benefits

1. **Data Integrity**: Historical invoices remain accurate
2. **Flexibility**: Products can be reactivated if deleted by mistake
3. **Clean UI**: Inactive products don't clutter the interface
4. **Statistics Accuracy**: Only active products count in inventory statistics
5. **Audit Trail**: Deleted products can be reviewed before permanent removal (if needed in future)

## Future Enhancements (Optional)

- Add a permanent delete option for admins
- Add deletion date tracking
- Add user tracking (who deleted the product)
- Add bulk restore functionality
- Add filters to view deleted products by date range
