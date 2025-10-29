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
  currency?: string;
}

export interface Payment {
  paymentId: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: string;
  notes: string;
  currency?: string;
}

export interface User {
  username: string;
  password: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  email?: string;
  createdDate: string;
  isActive: boolean;
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
  currency?: string;
}

export interface Invoice {
  invoiceId: string;
  date: string;
  customerName: string;
  totalAmount: number;
  totalProfit: number;
  status: string;
  items: Sale[];
  currency?: string;
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
  payments: Payment[];
  users: User[];
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
    } else {
      // Check if Users sheet exists, if not add it
      await this.ensureUsersSheet();
    }
  }

  private async ensureUsersSheet(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.workbookPath);
    
    const usersSheet = workbook.getWorksheet('Users');
    if (!usersSheet) {
      console.log('Users sheet not found, creating it...');
      
      // Create Users sheet
      const newUsersSheet = workbook.addWorksheet('Users');
      newUsersSheet.columns = [
        { header: 'Username', key: 'username', width: 20 },
        { header: 'Password', key: 'password', width: 20 },
        { header: 'FullName', key: 'fullName', width: 25 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'CreatedDate', key: 'createdDate', width: 15 },
        { header: 'IsActive', key: 'isActive', width: 10 }
      ];
      newUsersSheet.getRow(1).font = { bold: true };

      // Add default admin user
      newUsersSheet.addRow({
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrator',
        role: 'Admin',
        email: 'admin@salesmanager.com',
        createdDate: new Date().toISOString().split('T')[0],
        isActive: true
      });

      await workbook.xlsx.writeFile(this.workbookPath);
      console.log('Users sheet created with default admin user');
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
      { header: 'SalePrice', key: 'salePrice', width: 12 },
      { header: 'ReorderLevel', key: 'reorderLevel', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 }
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
      { header: 'Profit', key: 'profit', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 }
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
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 }
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

    // Payments sheet
    const paymentsSheet = workbook.addWorksheet('Payments');
    paymentsSheet.columns = [
      { header: 'PaymentID', key: 'paymentId', width: 15 },
      { header: 'InvoiceID', key: 'invoiceId', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Method', key: 'method', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Currency', key: 'currency', width: 10 }
    ];
    paymentsSheet.getRow(1).font = { bold: true };

    // Users sheet
    const usersSheet = workbook.addWorksheet('Users');
    usersSheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Password', key: 'password', width: 20 },
      { header: 'FullName', key: 'fullName', width: 25 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'CreatedDate', key: 'createdDate', width: 15 },
      { header: 'IsActive', key: 'isActive', width: 10 }
    ];
    usersSheet.getRow(1).font = { bold: true };

    // Add default admin user
    usersSheet.addRow({
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrator',
      role: 'Admin',
      email: 'admin@salesmanager.com',
      createdDate: new Date().toISOString().split('T')[0],
      isActive: true
    });

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
    const payments = this.readPayments(workbook);
    const users = this.readUsers(workbook);

    return { products, customers, sales, invoices, inventory, payments, users };
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
        salePrice: this.getNumericValue(row, 4),
        reorderLevel: this.getNumericValue(row, 5) || 10 // Default reorder level
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

  private readPayments(workbook: ExcelJS.Workbook): Payment[] {
    const sheet = workbook.getWorksheet('Payments');
    if (!sheet) return [];

    const payments: Payment[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const paymentId = this.getCellValue(row, 1);
      if (!paymentId) return;

      payments.push({
        paymentId: String(paymentId),
        invoiceId: String(this.getCellValue(row, 2) || ''),
        date: String(this.getCellValue(row, 3) || ''),
        amount: this.getNumericValue(row, 4),
        method: String(this.getCellValue(row, 5) || 'Cash'),
        notes: String(this.getCellValue(row, 6) || '')
      });
    });

    return payments;
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

    sheet.addRow([product.name, product.quantity, product.buyPrice, product.salePrice, product.reorderLevel || 10]);
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
        row.getCell(5).value = product.reorderLevel || 10;
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

  async addPayment(payment: Payment): Promise<void> {
    const workbook = await this.loadWorkbook();
    const paymentsSheet = workbook.getWorksheet('Payments');
    
    if (!paymentsSheet) {
      throw new Error('Payments sheet not found');
    }

    paymentsSheet.addRow([
      payment.paymentId,
      payment.invoiceId,
      payment.date,
      payment.amount,
      payment.method,
      payment.notes
    ]);

    // Update invoice status if fully paid
    await this.checkAndUpdateInvoicePaymentStatus(workbook, payment.invoiceId);

    await this.saveWorkbook(workbook);
  }

  private async checkAndUpdateInvoicePaymentStatus(workbook: ExcelJS.Workbook, invoiceId: string): Promise<void> {
    const invoicesSheet = workbook.getWorksheet('Invoices');
    const paymentsSheet = workbook.getWorksheet('Payments');
    
    if (!invoicesSheet || !paymentsSheet) return;

    // Get invoice total
    let invoiceTotal = 0;
    invoicesSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === invoiceId) {
        invoiceTotal = this.getNumericValue(row, 4);
      }
    });

    // Calculate total payments
    let totalPaid = 0;
    paymentsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(2).value) === invoiceId) {
        totalPaid += this.getNumericValue(row, 4);
      }
    });

    // Update invoice status
    invoicesSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === invoiceId) {
        if (totalPaid >= invoiceTotal) {
          row.getCell(6).value = 'Paid';
        } else if (totalPaid > 0) {
          row.getCell(6).value = 'Partial';
        } else {
          row.getCell(6).value = 'Pending';
        }
      }
    });
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const data = await this.readWorkbook();
    return data.payments.filter(p => p.invoiceId === invoiceId);
  }

  async getLowStockProducts(): Promise<Product[]> {
    const data = await this.readWorkbook();
    return data.products.filter(p => p.quantity <= (p.reorderLevel || 10));
  }

  // User Management Methods
  private readUsers(workbook: ExcelJS.Workbook): User[] {
    const sheet = workbook.getWorksheet('Users');
    if (!sheet) {
      console.log('Users sheet not found');
      return [];
    }

    const users: User[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const username = String(row.getCell(1).value || '');
      const password = String(row.getCell(2).value || '');
      
      // Only add users with valid username and password
      if (username && password) {
        users.push({
          username,
          password,
          fullName: String(row.getCell(3).value || ''),
          role: String(row.getCell(4).value || 'Cashier') as 'Admin' | 'Manager' | 'Cashier',
          email: String(row.getCell(5).value || ''),
          createdDate: String(row.getCell(6).value || ''),
          isActive: row.getCell(7).value === true || row.getCell(7).value === 'true' || row.getCell(7).value === 1
        });
      }
    });

    console.log(`Found ${users.length} users in database`);
    return users;
  }

  async addUser(user: User): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Users');
    
    if (!sheet) {
      throw new Error('Users sheet not found');
    }

    // Check if username already exists
    let exists = false;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === user.username) {
        exists = true;
      }
    });

    if (exists) {
      throw new Error(`Username "${user.username}" already exists`);
    }

    sheet.addRow([
      user.username,
      user.password,
      user.fullName,
      user.role,
      user.email || '',
      user.createdDate,
      user.isActive
    ]);
    
    await this.saveWorkbook(workbook);
  }

  async updateUser(username: string, user: User): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Users');
    
    if (!sheet) {
      throw new Error('Users sheet not found');
    }

    let found = false;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === username) {
        row.getCell(1).value = user.username;
        row.getCell(2).value = user.password;
        row.getCell(3).value = user.fullName;
        row.getCell(4).value = user.role;
        row.getCell(5).value = user.email || '';
        row.getCell(6).value = user.createdDate;
        row.getCell(7).value = user.isActive;
        found = true;
      }
    });

    if (!found) {
      throw new Error(`User "${username}" not found`);
    }

    await this.saveWorkbook(workbook);
  }

  async deleteUser(username: string): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('Users');
    
    if (!sheet) {
      throw new Error('Users sheet not found');
    }

    // Prevent deleting the last admin
    const users = this.readUsers(workbook);
    const admins = users.filter(u => u.role === 'Admin' && u.isActive);
    const userToDelete = users.find(u => u.username === username);
    
    if (userToDelete?.role === 'Admin' && admins.length === 1) {
      throw new Error('Cannot delete the last admin user');
    }

    let rowToDelete: number | null = null;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(1).value) === username) {
        rowToDelete = rowNumber;
      }
    });

    if (rowToDelete) {
      sheet.spliceRows(rowToDelete, 1);
      await this.saveWorkbook(workbook);
    } else {
      throw new Error(`User "${username}" not found`);
    }
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const data = await this.readWorkbook();
    console.log(`Authenticating user: ${username}`);
    console.log(`Total users in database: ${data.users.length}`);
    
    const user = data.users.find(u => {
      console.log(`Checking user: ${u.username}, active: ${u.isActive}`);
      return u.username === username && u.password === password && u.isActive;
    });
    
    if (user) {
      console.log(`Authentication successful for: ${username}`);
    } else {
      console.log(`Authentication failed for: ${username}`);
    }
    
    return user || null;
  }

  async exportCustomerHistoryExcel(filePath: string, data: any): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customer History');

    // Set column widths
    worksheet.columns = [
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    // Title
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Customer History Report';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF4F46E5' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Customer Name
    worksheet.mergeCells('A2:E2');
    const nameCell = worksheet.getCell('A2');
    nameCell.value = data.customerName;
    nameCell.font = { size: 14, bold: true };
    nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    // Generated Date and Currency
    worksheet.mergeCells('A3:E3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `Generated: ${new Date().toLocaleDateString()} | Currency: ${data.currency || 'USD'}`;
    dateCell.font = { size: 10, color: { argb: 'FF6B7280' } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Summary Section
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    const summaryHeaderRow = worksheet.getRow(5);
    summaryHeaderRow.font = { size: 12, bold: true };
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };

    worksheet.addRow(['Total Spent', data.totalSpent]);
    worksheet.addRow(['Total Invoices', data.totalInvoices]);
    worksheet.addRow(['Average Order', data.avgOrder]);
    worksheet.addRow(['Total Profit', data.totalProfit]);
    worksheet.addRow(['Last Purchase', data.lastPurchase]);

    // Invoice History Section
    worksheet.addRow([]);
    worksheet.addRow(['Invoice History']);
    const historyHeaderRow = worksheet.getRow(12);
    historyHeaderRow.font = { size: 12, bold: true };
    historyHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };

    // Invoice Table Headers
    const headerRow = worksheet.addRow(['Invoice ID', 'Date', 'Amount', 'Profit', 'Status']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Invoice Data
    data.invoices.forEach((invoice: any, index: number) => {
      const row = worksheet.addRow([
        invoice.invoiceId,
        invoice.date,
        invoice.amount,
        invoice.profit,
        invoice.status
      ]);

      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      row.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add borders to invoice table
    const invoiceTableStartRow = 13;
    const invoiceTableEndRow = 13 + data.invoices.length;
    for (let i = invoiceTableStartRow; i <= invoiceTableEndRow; i++) {
      for (let j = 1; j <= 5; j++) {
        const cell = worksheet.getCell(i, j);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }

    await workbook.xlsx.writeFile(filePath);
  }
}
