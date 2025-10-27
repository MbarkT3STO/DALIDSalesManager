import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

export interface Product {
  name: string;
  quantity: number;
  buyPrice: number;
  salePrice: number;
  reorderLevel?: number;
  category?: string;
  sku?: string;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Sale {
  date: string;
  invoiceId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  profit: number;
}

export interface Invoice {
  invoiceId: string;
  date: string;
  customerName: string;
  totalAmount: number;
  totalProfit: number;
  status: string;
  items: Sale[];
}

export interface InventoryMovement {
  date: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reference: string;
  notes: string;
  balanceAfter: number;
}

export interface WorkbookData {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  invoices: Invoice[];
  inventory: InventoryMovement[];
}

export class ExcelHandler {
  private workbookPath: string;
  private maxBackups = 5;

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

    // Products sheet
    const productsSheet = workbook.addWorksheet('Products');
    productsSheet.columns = [
      { header: 'ProductName', key: 'name', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'BuyPrice', key: 'buyPrice', width: 12 },
      { header: 'SalePrice', key: 'salePrice', width: 12 }
    ];
    productsSheet.getRow(1).font = { bold: true };

    // Customers sheet
    const customersSheet = workbook.addWorksheet('Customers');
    customersSheet.columns = [
      { header: 'CustomerName', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Address', key: 'address', width: 35 }
    ];
    customersSheet.getRow(1).font = { bold: true };

    // Sales sheet
    const salesSheet = workbook.addWorksheet('Sales');
    salesSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'InvoiceID', key: 'invoiceId', width: 15 },
      { header: 'ProductName', key: 'productName', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'UnitPrice', key: 'unitPrice', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Profit', key: 'profit', width: 12 }
    ];
    salesSheet.getRow(1).font = { bold: true };

    // Invoices sheet
    const invoicesSheet = workbook.addWorksheet('Invoices');
    invoicesSheet.columns = [
      { header: 'InvoiceID', key: 'invoiceId', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'CustomerName', key: 'customerName', width: 25 },
      { header: 'TotalAmount', key: 'totalAmount', width: 15 },
      { header: 'TotalProfit', key: 'totalProfit', width: 15 },
      { header: 'Status', key: 'status', width: 12 }
    ];
    invoicesSheet.getRow(1).font = { bold: true };

    // Inventory Movements sheet
    const inventorySheet = workbook.addWorksheet('Inventory');
    inventorySheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'ProductName', key: 'productName', width: 25 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Reference', key: 'reference', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'BalanceAfter', key: 'balanceAfter', width: 15 }
    ];
    inventorySheet.getRow(1).font = { bold: true };

    await workbook.xlsx.writeFile(this.workbookPath);
  }

  async readWorkbook(): Promise<WorkbookData> {
    await this.ensureWorkbook();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.workbookPath);

    const products = this.readProducts(workbook);
    const customers = this.readCustomers(workbook);
    const sales = this.readSales(workbook);
    const invoices = this.readInvoices(workbook, sales);
    const inventory = this.readInventory(workbook);

    return { products, customers, sales, invoices, inventory };
  }

  private readProducts(workbook: ExcelJS.Workbook): Product[] {
    const sheet = workbook.getWorksheet('Products');
    if (!sheet) return [];

    const products: Product[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const name = this.getCellValue(row, 1);
      if (!name) return;

      products.push({
        name: String(name),
        quantity: this.getNumericValue(row, 2),
        buyPrice: this.getNumericValue(row, 3),
        salePrice: this.getNumericValue(row, 4)
      });
    });

    return products;
  }

  private readCustomers(workbook: ExcelJS.Workbook): Customer[] {
    const sheet = workbook.getWorksheet('Customers');
    if (!sheet) return [];

    const customers: Customer[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const name = this.getCellValue(row, 1);
      if (!name) return;

      customers.push({
        name: String(name),
        phone: String(this.getCellValue(row, 2) || ''),
        email: String(this.getCellValue(row, 3) || ''),
        address: String(this.getCellValue(row, 4) || '')
      });
    });

    return customers;
  }

  private readSales(workbook: ExcelJS.Workbook): Sale[] {
    const sheet = workbook.getWorksheet('Sales');
    if (!sheet) return [];

    const sales: Sale[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const date = this.getCellValue(row, 1);
      const invoiceId = this.getCellValue(row, 2);
      const productName = this.getCellValue(row, 3);

      if (!date || !invoiceId || !productName) return;

      sales.push({
        date: String(date),
        invoiceId: String(invoiceId),
        productName: String(productName),
        quantity: this.getNumericValue(row, 4),
        unitPrice: this.getNumericValue(row, 5),
        total: this.getNumericValue(row, 6),
        profit: this.getNumericValue(row, 7)
      });
    });

    return sales;
  }

  private readInvoices(workbook: ExcelJS.Workbook, sales: Sale[]): Invoice[] {
    const sheet = workbook.getWorksheet('Invoices');
    if (!sheet) return [];

    const invoices: Invoice[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const invoiceId = this.getCellValue(row, 1);
      if (!invoiceId) return;

      const invoiceIdStr = String(invoiceId);
      const invoiceSales = sales.filter(s => s.invoiceId === invoiceIdStr);

      invoices.push({
        invoiceId: invoiceIdStr,
        date: String(this.getCellValue(row, 2) || ''),
        customerName: String(this.getCellValue(row, 3) || ''),
        totalAmount: this.getNumericValue(row, 4),
        totalProfit: this.getNumericValue(row, 5),
        status: String(this.getCellValue(row, 6) || 'Pending'),
        items: invoiceSales
      });
    });

    return invoices;
  }

  private readInventory(workbook: ExcelJS.Workbook): InventoryMovement[] {
    const sheet = workbook.getWorksheet('Inventory');
    if (!sheet) return [];

    const inventory: InventoryMovement[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const productName = this.getCellValue(row, 2);
      if (!productName) return;

      inventory.push({
        date: String(this.getCellValue(row, 1) || ''),
        productName: String(productName),
        type: String(this.getCellValue(row, 3) || 'ADJUSTMENT') as 'IN' | 'OUT' | 'ADJUSTMENT',
        quantity: this.getNumericValue(row, 4),
        reference: String(this.getCellValue(row, 5) || ''),
        notes: String(this.getCellValue(row, 6) || ''),
        balanceAfter: this.getNumericValue(row, 7)
      });
    });

    return inventory;
  }

  private getCellValue(row: ExcelJS.Row, colNumber: number): any {
    const cell = row.getCell(colNumber);
    return cell.value;
  }

  private getNumericValue(row: ExcelJS.Row, colNumber: number): number {
    const value = this.getCellValue(row, colNumber);
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  async addProduct(product: Product): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Products');
    
    if (!sheet) {
      throw new Error('Products sheet not found');
    }

    sheet.addRow([product.name, product.quantity, product.buyPrice, product.salePrice]);
    await this.saveWorkbook(workbook);
  }

  async updateProduct(oldName: string, product: Product): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Products');
    
    if (!sheet) {
      throw new Error('Products sheet not found');
    }

    let found = false;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === oldName) {
        row.getCell(1).value = product.name;
        row.getCell(2).value = product.quantity;
        row.getCell(3).value = product.buyPrice;
        row.getCell(4).value = product.salePrice;
        found = true;
      }
    });

    if (!found) {
      throw new Error(`Product "${oldName}" not found`);
    }

    await this.saveWorkbook(workbook);
  }

  async deleteProduct(productName: string): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Products');
    
    if (!sheet) {
      throw new Error('Products sheet not found');
    }

    let rowToDelete: number | null = null;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === productName) {
        rowToDelete = rowNumber;
      }
    });

    if (rowToDelete === null) {
      throw new Error(`Product "${productName}" not found`);
    }

    sheet.spliceRows(rowToDelete, 1);
    await this.saveWorkbook(workbook);
  }

  async addCustomer(customer: Customer): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Customers');
    
    if (!sheet) {
      throw new Error('Customers sheet not found');
    }

    sheet.addRow([customer.name, customer.phone, customer.email, customer.address]);
    await this.saveWorkbook(workbook);
  }

  async updateCustomer(oldName: string, customer: Customer): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Customers');
    
    if (!sheet) {
      throw new Error('Customers sheet not found');
    }

    let found = false;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === oldName) {
        row.getCell(1).value = customer.name;
        row.getCell(2).value = customer.phone;
        row.getCell(3).value = customer.email;
        row.getCell(4).value = customer.address;
        found = true;
      }
    });

    if (!found) {
      throw new Error(`Customer "${oldName}" not found`);
    }

    await this.saveWorkbook(workbook);
  }

  async deleteCustomer(customerName: string): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Customers');
    
    if (!sheet) {
      throw new Error('Customers sheet not found');
    }

    let rowToDelete: number | null = null;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === customerName) {
        rowToDelete = rowNumber;
      }
    });

    if (rowToDelete === null) {
      throw new Error(`Customer "${customerName}" not found`);
    }

    sheet.spliceRows(rowToDelete, 1);
    await this.saveWorkbook(workbook);
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    const workbook = await this.loadWorkbook();
    
    // Add invoice header
    const invoicesSheet = workbook.getWorksheet('Invoices');
    if (!invoicesSheet) {
      throw new Error('Invoices sheet not found');
    }

    invoicesSheet.addRow([
      invoice.invoiceId,
      invoice.date,
      invoice.customerName,
      invoice.totalAmount,
      invoice.totalProfit,
      invoice.status
    ]);

    // Add sales items
    const salesSheet = workbook.getWorksheet('Sales');
    if (!salesSheet) {
      throw new Error('Sales sheet not found');
    }

    for (const item of invoice.items) {
      salesSheet.addRow([
        item.date,
        item.invoiceId,
        item.productName,
        item.quantity,
        item.unitPrice,
        item.total,
        item.profit
      ]);

      // Update product stock
      await this.updateProductStock(workbook, item.productName, -item.quantity);
    }

    await this.saveWorkbook(workbook);
  }

  private async updateProductStock(workbook: ExcelJS.Workbook, productName: string, quantityChange: number): Promise<void> {
    const sheet = workbook.getWorksheet('Products');
    if (!sheet) return;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === productName) {
        const currentQty = this.getNumericValue(row, 2);
        row.getCell(2).value = currentQty + quantityChange;
      }
    });
  }

  async addInventoryMovement(movement: Omit<InventoryMovement, 'balanceAfter'>): Promise<void> {
    const workbook = await this.loadWorkbook();
    const inventorySheet = workbook.getWorksheet('Inventory');
    const productsSheet = workbook.getWorksheet('Products');
    
    if (!inventorySheet || !productsSheet) {
      throw new Error('Required sheets not found');
    }

    // Get current product balance
    let currentBalance = 0;
    productsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === movement.productName) {
        currentBalance = this.getNumericValue(row, 2);
      }
    });

    // Calculate new balance based on movement type
    let quantityChange = 0;
    if (movement.type === 'IN') {
      quantityChange = movement.quantity;
    } else if (movement.type === 'OUT') {
      quantityChange = -movement.quantity;
    } else if (movement.type === 'ADJUSTMENT') {
      quantityChange = movement.quantity - currentBalance;
    }

    const newBalance = currentBalance + quantityChange;

    // Add inventory movement record
    inventorySheet.addRow([
      movement.date,
      movement.productName,
      movement.type,
      movement.quantity,
      movement.reference,
      movement.notes,
      newBalance
    ]);

    // Update product quantity
    await this.updateProductStock(workbook, movement.productName, quantityChange);

    await this.saveWorkbook(workbook);
  }

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Invoices');
    
    if (!sheet) {
      throw new Error('Invoices sheet not found');
    }

    let found = false;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === invoiceId) {
        row.getCell(6).value = status;
        found = true;
      }
    });

    if (!found) {
      throw new Error(`Invoice "${invoiceId}" not found`);
    }

    await this.saveWorkbook(workbook);
  }

  private async loadWorkbook(): Promise<ExcelJS.Workbook> {
    await this.ensureWorkbook();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.workbookPath);
    return workbook;
  }

  private async saveWorkbook(workbook: ExcelJS.Workbook): Promise<void> {
    // Create backup
    await this.createBackup();

    // Atomic save: write to temp file first
    const tempPath = this.workbookPath + '.tmp';
    await workbook.xlsx.writeFile(tempPath);

    // Replace original file
    fs.renameSync(tempPath, this.workbookPath);
  }

  private async createBackup(): Promise<void> {
    if (!fs.existsSync(this.workbookPath)) return;

    const dir = path.dirname(this.workbookPath);
    const basename = path.basename(this.workbookPath, '.xlsx');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dir, `${basename}.${timestamp}.bak.xlsx`);

    fs.copyFileSync(this.workbookPath, backupPath);

    // Clean old backups
    await this.cleanOldBackups(dir, basename);
  }

  private async cleanOldBackups(dir: string, basename: string): Promise<void> {
    const files = fs.readdirSync(dir);
    const backups = files
      .filter(f => f.startsWith(basename) && f.endsWith('.bak.xlsx'))
      .map(f => ({
        name: f,
        path: path.join(dir, f),
        time: fs.statSync(path.join(dir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Keep only the latest maxBackups
    for (let i = this.maxBackups; i < backups.length; i++) {
      fs.unlinkSync(backups[i].path);
    }
  }

  async exportSheet(sheetName: string, outputPath: string): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet(sheetName);

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    const newWorkbook = new ExcelJS.Workbook();
    const newSheet = newWorkbook.addWorksheet(sheetName);

    // Copy data
    sheet.eachRow((row, rowNumber) => {
      const newRow = newSheet.getRow(rowNumber);
      row.eachCell((cell, colNumber) => {
        newRow.getCell(colNumber).value = cell.value;
      });
    });

    await newWorkbook.xlsx.writeFile(outputPath);
  }

  getWorkbookPath(): string {
    return this.workbookPath;
  }

  setWorkbookPath(newPath: string): void {
    this.workbookPath = newPath;
  }
}
