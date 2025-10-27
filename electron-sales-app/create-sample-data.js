const ExcelJS = require('exceljs');
const path = require('path');

async function createSampleData() {
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

  // Add sample products
  const products = [
    { name: 'Laptop Dell XPS 13', quantity: 15, buyPrice: 800, salePrice: 1200 },
    { name: 'iPhone 14 Pro', quantity: 25, buyPrice: 900, salePrice: 1300 },
    { name: 'Samsung Galaxy S23', quantity: 20, buyPrice: 700, salePrice: 1000 },
    { name: 'iPad Air', quantity: 18, buyPrice: 450, salePrice: 650 },
    { name: 'MacBook Pro 14"', quantity: 8, buyPrice: 1800, salePrice: 2400 },
    { name: 'AirPods Pro', quantity: 50, buyPrice: 180, salePrice: 249 },
    { name: 'Sony WH-1000XM5', quantity: 30, buyPrice: 280, salePrice: 399 },
    { name: 'Logitech MX Master 3', quantity: 40, buyPrice: 70, salePrice: 99 },
    { name: 'Dell Monitor 27"', quantity: 12, buyPrice: 250, salePrice: 350 },
    { name: 'Mechanical Keyboard', quantity: 5, buyPrice: 80, salePrice: 129 }
  ];

  products.forEach(product => {
    productsSheet.addRow(product);
  });

  // Customers sheet
  const customersSheet = workbook.addWorksheet('Customers');
  customersSheet.columns = [
    { header: 'CustomerName', key: 'name', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Address', key: 'address', width: 35 }
  ];
  customersSheet.getRow(1).font = { bold: true };

  // Add sample customers
  const customers = [
    { name: 'John Smith', phone: '555-0101', email: 'john.smith@email.com', address: '123 Main St, New York, NY 10001' },
    { name: 'Sarah Johnson', phone: '555-0102', email: 'sarah.j@email.com', address: '456 Oak Ave, Los Angeles, CA 90001' },
    { name: 'Michael Brown', phone: '555-0103', email: 'mbrown@email.com', address: '789 Pine Rd, Chicago, IL 60601' },
    { name: 'Emily Davis', phone: '555-0104', email: 'emily.davis@email.com', address: '321 Elm St, Houston, TX 77001' },
    { name: 'David Wilson', phone: '555-0105', email: 'dwilson@email.com', address: '654 Maple Dr, Phoenix, AZ 85001' },
    { name: 'Jennifer Martinez', phone: '555-0106', email: 'jmartinez@email.com', address: '987 Cedar Ln, Philadelphia, PA 19101' },
    { name: 'Robert Taylor', phone: '555-0107', email: 'rtaylor@email.com', address: '147 Birch Ct, San Antonio, TX 78201' },
    { name: 'Lisa Anderson', phone: '555-0108', email: 'landerson@email.com', address: '258 Spruce Way, San Diego, CA 92101' }
  ];

  customers.forEach(customer => {
    customersSheet.addRow(customer);
  });

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

  // Add sample sales
  const sales = [
    { date: '2025-10-20', invoiceId: 'INV-20251020-001', productName: 'Laptop Dell XPS 13', quantity: 2, unitPrice: 1200, total: 2400, profit: 800 },
    { date: '2025-10-20', invoiceId: 'INV-20251020-001', productName: 'Logitech MX Master 3', quantity: 2, unitPrice: 99, total: 198, profit: 58 },
    { date: '2025-10-21', invoiceId: 'INV-20251021-002', productName: 'iPhone 14 Pro', quantity: 1, unitPrice: 1300, total: 1300, profit: 400 },
    { date: '2025-10-21', invoiceId: 'INV-20251021-002', productName: 'AirPods Pro', quantity: 1, unitPrice: 249, total: 249, profit: 69 },
    { date: '2025-10-22', invoiceId: 'INV-20251022-003', productName: 'MacBook Pro 14"', quantity: 1, unitPrice: 2400, total: 2400, profit: 600 },
    { date: '2025-10-23', invoiceId: 'INV-20251023-004', productName: 'Samsung Galaxy S23', quantity: 3, unitPrice: 1000, total: 3000, profit: 900 },
    { date: '2025-10-24', invoiceId: 'INV-20251024-005', productName: 'iPad Air', quantity: 2, unitPrice: 650, total: 1300, profit: 400 },
    { date: '2025-10-24', invoiceId: 'INV-20251024-005', productName: 'Sony WH-1000XM5', quantity: 1, unitPrice: 399, total: 399, profit: 119 },
    { date: '2025-10-25', invoiceId: 'INV-20251025-006', productName: 'Dell Monitor 27"', quantity: 2, unitPrice: 350, total: 700, profit: 200 },
    { date: '2025-10-26', invoiceId: 'INV-20251026-007', productName: 'Mechanical Keyboard', quantity: 1, unitPrice: 129, total: 129, profit: 49 }
  ];

  sales.forEach(sale => {
    salesSheet.addRow(sale);
  });

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

  // Add sample invoices
  const invoices = [
    { invoiceId: 'INV-20251020-001', date: '2025-10-20', customerName: 'John Smith', totalAmount: 2598, totalProfit: 858, status: 'Paid' },
    { invoiceId: 'INV-20251021-002', date: '2025-10-21', customerName: 'Sarah Johnson', totalAmount: 1549, totalProfit: 469, status: 'Paid' },
    { invoiceId: 'INV-20251022-003', date: '2025-10-22', customerName: 'Michael Brown', totalAmount: 2400, totalProfit: 600, status: 'Paid' },
    { invoiceId: 'INV-20251023-004', date: '2025-10-23', customerName: 'Emily Davis', totalAmount: 3000, totalProfit: 900, status: 'Paid' },
    { invoiceId: 'INV-20251024-005', date: '2025-10-24', customerName: 'David Wilson', totalAmount: 1699, totalProfit: 519, status: 'Pending' },
    { invoiceId: 'INV-20251025-006', date: '2025-10-25', customerName: 'Jennifer Martinez', totalAmount: 700, totalProfit: 200, status: 'Paid' },
    { invoiceId: 'INV-20251026-007', date: '2025-10-26', customerName: 'Robert Taylor', totalAmount: 129, totalProfit: 49, status: 'Pending' }
  ];

  invoices.forEach(invoice => {
    invoicesSheet.addRow(invoice);
  });

  // Save the workbook
  const filePath = path.join(__dirname, 'sample-sales-data.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Sample data created successfully: ${filePath}`);
}

createSampleData().catch(err => {
  console.error('❌ Error creating sample data:', err);
  process.exit(1);
});
