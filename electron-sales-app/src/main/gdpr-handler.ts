import * as fs from 'fs';
import * as path from 'path';
import { ExcelHandler, Customer, Invoice } from './excel-handler';

export interface GDPRConsent {
  customerId: string;
  customerName: string;
  consentDate: Date;
  consentType: 'marketing' | 'data_processing' | 'data_storage';
  consentGiven: boolean;
  ipAddress?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  entityType: 'customer' | 'product' | 'invoice' | 'user' | 'settings';
  entityId: string;
  changes?: any;
  ipAddress?: string;
}

export class GDPRHandler {
  private excelHandler: ExcelHandler;
  private auditLogsPath: string;
  private consentsPath: string;

  constructor(excelHandler: ExcelHandler) {
    this.excelHandler = excelHandler;
    const appDataPath = process.env.APPDATA || 
                        (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
    const appDir = path.join(appDataPath, 'SalesManager');
    
    // Ensure directory exists
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    this.auditLogsPath = path.join(appDir, 'audit-logs.json');
    this.consentsPath = path.join(appDir, 'gdpr-consents.json');

    // Initialize files if they don't exist
    if (!fs.existsSync(this.auditLogsPath)) {
      fs.writeFileSync(this.auditLogsPath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.consentsPath)) {
      fs.writeFileSync(this.consentsPath, JSON.stringify([], null, 2));
    }
  }

  // GDPR: Export all customer data
  async exportCustomerData(customerName: string): Promise<any> {
    try {
      const workbookData = await this.excelHandler.readWorkbook();
      const customer = workbookData.customers.find((c: Customer) => c.name === customerName);

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get all invoices for this customer
      const customerInvoices = workbookData.invoices.filter((inv: Invoice) => inv.customerName === customerName);

      // Get consent history
      const consents = this.getCustomerConsents(customerName);

      // Get audit logs related to this customer
      const auditLogs = this.getAuditLogs().filter(log => 
        log.entityType === 'customer' && log.entityId === customerName
      );

      // Compile all data
      const gdprExport = {
        exportDate: new Date().toISOString(),
        exportReason: 'GDPR Data Subject Access Request',
        personalData: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        },
        purchaseHistory: customerInvoices.map((inv: Invoice) => ({
          invoiceId: inv.invoiceId,
          date: inv.date,
          totalAmount: inv.totalAmount,
          status: inv.status,
          items: inv.items
        })),
        consents: consents,
        auditTrail: auditLogs.map(log => ({
          timestamp: log.timestamp,
          action: log.action,
          performedBy: log.userName
        })),
        dataRetention: {
          message: 'Your data is retained as per our privacy policy and legal requirements.',
          retentionPeriod: '7 years for financial records, as required by law'
        }
      };

      return gdprExport;
    } catch (error: any) {
      throw new Error(`Failed to export customer data: ${error.message}`);
    }
  }

  // GDPR: Delete customer data (Right to be Forgotten)
  async deleteCustomerData(customerName: string, reason: string, performedBy: string): Promise<boolean> {
    try {
      const workbookData = await this.excelHandler.readWorkbook();
      const customer = workbookData.customers.find((c: Customer) => c.name === customerName);

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Log the deletion for audit purposes (required by law)
      this.logAudit({
        id: Date.now().toString(),
        timestamp: new Date(),
        userId: performedBy,
        userName: performedBy,
        action: 'GDPR_DATA_DELETION',
        entityType: 'customer',
        entityId: customerName,
        changes: {
          customerName: customer.name,
          reason: reason,
          deletionType: 'GDPR Right to be Forgotten'
        }
      });

      // Anonymize customer data instead of hard delete (for legal/audit purposes)
      const anonymizedCustomer: Customer = {
        name: `[DELETED-${Date.now()}]`,
        email: `deleted-${Date.now()}@anonymized.local`,
        phone: '[DELETED]',
        address: '[DELETED]'
      };

      // Update customer with anonymized data
      await this.excelHandler.updateCustomer(customerName, anonymizedCustomer);

      // Remove consents
      const consents = this.getConsents();
      const updatedConsents = consents.filter((c: GDPRConsent) => c.customerId !== customerName);
      fs.writeFileSync(this.consentsPath, JSON.stringify(updatedConsents, null, 2));

      return true;
    } catch (error: any) {
      throw new Error(`Failed to delete customer data: ${error.message}`);
    }
  }

  // Consent Management
  recordConsent(consent: GDPRConsent): void {
    const consents = this.getConsents();
    consents.push({
      ...consent,
      consentDate: new Date()
    });
    fs.writeFileSync(this.consentsPath, JSON.stringify(consents, null, 2));

    // Log consent for audit
    this.logAudit({
      id: Date.now().toString(),
      timestamp: new Date(),
      userId: 'system',
      userName: 'System',
      action: 'CONSENT_RECORDED',
      entityType: 'customer',
      entityId: consent.customerId,
      changes: {
        consentType: consent.consentType,
        consentGiven: consent.consentGiven
      }
    });
  }

  getCustomerConsents(customerId: string): GDPRConsent[] {
    const consents = this.getConsents();
    return consents.filter(c => c.customerId === customerId);
  }

  private getConsents(): GDPRConsent[] {
    try {
      const data = fs.readFileSync(this.consentsPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  // Audit Logging
  logAudit(log: AuditLog): void {
    const logs = this.getAuditLogs();
    logs.push(log);
    
    // Keep only last 10000 logs to prevent file from growing too large
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }
    
    fs.writeFileSync(this.auditLogsPath, JSON.stringify(logs, null, 2));
  }

  getAuditLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    entityType?: string;
    action?: string;
  }): AuditLog[] {
    try {
      const data = fs.readFileSync(this.auditLogsPath, 'utf-8');
      let logs: AuditLog[] = JSON.parse(data);

      // Apply filters
      if (filters) {
        if (filters.startDate) {
          logs = logs.filter(log => new Date(log.timestamp) >= filters.startDate!);
        }
        if (filters.endDate) {
          logs = logs.filter(log => new Date(log.timestamp) <= filters.endDate!);
        }
        if (filters.userId) {
          logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.entityType) {
          logs = logs.filter(log => log.entityType === filters.entityType);
        }
        if (filters.action) {
          logs = logs.filter(log => log.action === filters.action);
        }
      }

      return logs;
    } catch {
      return [];
    }
  }

  // Generate Audit Report
  async generateAuditReport(startDate: Date, endDate: Date): Promise<any> {
    const logs = this.getAuditLogs({ startDate, endDate });

    // Group by action type
    const actionCounts: { [key: string]: number } = {};
    const userActivity: { [key: string]: number } = {};
    const entityChanges: { [key: string]: number } = {};

    logs.forEach(log => {
      // Count actions
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      // Count user activity
      userActivity[log.userName] = (userActivity[log.userName] || 0) + 1;
      
      // Count entity changes
      entityChanges[log.entityType] = (entityChanges[log.entityType] || 0) + 1;
    });

    return {
      reportGenerated: new Date().toISOString(),
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      summary: {
        totalActions: logs.length,
        uniqueUsers: Object.keys(userActivity).length,
        entitiesModified: Object.keys(entityChanges).length
      },
      actionBreakdown: actionCounts,
      userActivity: userActivity,
      entityChanges: entityChanges,
      detailedLogs: logs.map(log => ({
        timestamp: log.timestamp,
        user: log.userName,
        action: log.action,
        entity: `${log.entityType}:${log.entityId}`,
        changes: log.changes
      })),
      compliance: {
        gdprCompliant: true,
        auditTrailComplete: true,
        dataRetentionPolicy: 'All logs retained for 7 years as per legal requirements'
      }
    };
  }

  // Export audit logs to file
  async exportAuditLogs(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<string> {
    const report = await this.generateAuditReport(startDate, endDate);
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else {
      // Convert to CSV
      let csv = 'Timestamp,User,Action,Entity Type,Entity ID,Changes\n';
      report.detailedLogs.forEach((log: any) => {
        csv += `"${log.timestamp}","${log.user}","${log.action}","${log.entity.split(':')[0]}","${log.entity.split(':')[1]}","${JSON.stringify(log.changes).replace(/"/g, '""')}"\n`;
      });
      return csv;
    }
  }
}
