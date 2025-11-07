import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';
import { app, BrowserWindow } from 'electron';

export interface GitHubSyncConfig {
  accessToken: string;
  repoOwner: string;
  repoName: string;
  filePath: string;
  autoSyncInterval: number; // in minutes
  lastSync: string; // ISO date string
  enabled: boolean;
}

export interface GitHubSyncHistoryItem {
  timestamp: string; // ISO date string
  operation: 'upload' | 'download' | 'auto-sync';
  success: boolean;
  message?: string;
}

export interface GitHubSyncStatus {
  connected: boolean;
  lastSync: string | null;
  nextSync: string | null;
  error: string | null;
}

export class GitHubHandler {
  private octokit: Octokit | null = null;
  private config: GitHubSyncConfig | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private workbookPath: string;
  private syncHistory: GitHubSyncHistoryItem[] = [];

  constructor(workbookPath: string) {
    this.workbookPath = workbookPath;
    // Load sync history from file if it exists
    this.loadSyncHistory();
  }

  /**
   * Get sync history file path
   */
  private getSyncHistoryPath(): string {
    if (!app) return '';
    return path.join(app.getPath('userData'), 'github-sync-history.json');
  }

  /**
   * Load sync history from file
   */
  private loadSyncHistory(): void {
    try {
      const historyPath = this.getSyncHistoryPath();
      if (fs.existsSync(historyPath)) {
        const raw = fs.readFileSync(historyPath, 'utf-8');
        this.syncHistory = JSON.parse(raw);
        // Keep only the last 50 entries
        if (this.syncHistory.length > 50) {
          this.syncHistory = this.syncHistory.slice(-50);
        }
      }
    } catch (error) {
      console.error('Failed to load sync history:', error);
      this.syncHistory = [];
    }
  }

  /**
   * Save sync history to file
   */
  private saveSyncHistory(): void {
    try {
      const historyPath = this.getSyncHistoryPath();
      fs.writeFileSync(historyPath, JSON.stringify(this.syncHistory, null, 2));
    } catch (error) {
      console.error('Failed to save sync history:', error);
    }
  }

  /**
   * Add an entry to sync history
   */
  private addSyncHistory(operation: 'upload' | 'download' | 'auto-sync', success: boolean, message?: string): void {
    const entry: GitHubSyncHistoryItem = {
      timestamp: new Date().toISOString(),
      operation,
      success,
      message
    };
    
    this.syncHistory.unshift(entry);
    
    // Keep only the last 50 entries
    if (this.syncHistory.length > 50) {
      this.syncHistory = this.syncHistory.slice(0, 50);
    }
    
    // Save to file
    this.saveSyncHistory();
    
    // Send notification
    this.sendSyncNotification(operation, success, message);
  }
  
  /**
   * Send sync notification to renderer
   */
  private sendSyncNotification(operation: 'upload' | 'download' | 'auto-sync', success: boolean, message?: string): void {
    try {
      // Get the main window
      const windows = BrowserWindow.getAllWindows();
      const mainWindow = windows.length > 0 ? windows[0] : null;
      
      if (mainWindow) {
        let title = '';
        let desc = '';
        let type = success ? 'success' : 'error';
        
        if (operation === 'upload') {
          title = success ? 'GitHub Upload' : 'GitHub Upload Failed';
          desc = success ? 'Workbook uploaded to GitHub' : `Upload failed: ${message || 'Unknown error'}`;
        } else if (operation === 'download') {
          title = success ? 'GitHub Download' : 'GitHub Download Failed';
          desc = success ? 'Workbook downloaded from GitHub' : `Download failed: ${message || 'Unknown error'}`;
        } else if (operation === 'auto-sync') {
          title = success ? 'GitHub Auto-Sync' : 'GitHub Auto-Sync Failed';
          desc = success ? 'Workbook synced to GitHub' : `Auto-sync failed: ${message || 'Unknown error'}`;
        }
        
        mainWindow.webContents.send('add-notification', {
          title,
          desc,
          type,
          category: 'github'
        });
      }
    } catch (error) {
      console.error('Failed to send sync notification:', error);
    }
  }

  /**
   * Get sync history
   */
  public getSyncHistory(): GitHubSyncHistoryItem[] {
    return [...this.syncHistory];
  }

  /**
   * Clear sync history
   */
  public clearSyncHistory(): void {
    this.syncHistory = [];
    this.saveSyncHistory();
  }

  /**
   * Initialize GitHub handler with configuration
   */
  async init(config: GitHubSyncConfig): Promise<void> {
    this.config = config;
    this.octokit = new Octokit({ auth: config.accessToken });
    
    // Start auto-sync if enabled
    if (config.enabled && config.autoSyncInterval > 0) {
      this.startAutoSync();
    }
  }

  /**
   * Test connection to GitHub repository
   */
  async testConnection(accessToken: string, repoOwner: string, repoName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const octokit = new Octokit({ auth: accessToken });
      await octokit.rest.repos.get({
        owner: repoOwner,
        repo: repoName
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload workbook to GitHub repository
   */
  async uploadWorkbook(): Promise<{ success: boolean; error?: string }> {
    if (!this.octokit || !this.config) {
      this.addSyncHistory('upload', false, 'GitHub handler not initialized');
      return { success: false, error: 'GitHub handler not initialized' };
    }

    try {
      // Read the workbook file
      const fileContent = fs.readFileSync(this.workbookPath);
      const base64Content = fileContent.toString('base64');

      // Check if file already exists and get its SHA
      let sha: string | undefined;
      try {
        const response = await this.octokit.rest.repos.getContent({
          owner: this.config.repoOwner,
          repo: this.config.repoName,
          path: this.config.filePath
        });
        
        if ('sha' in response.data) {
          sha = response.data.sha;
        }
      } catch (error: any) {
        // File doesn't exist, which is fine
        // We'll create it without a SHA
        sha = undefined;
      }

      // Upload/Update the file
      try {
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.config.repoOwner,
          repo: this.config.repoName,
          path: this.config.filePath,
          message: `Update sales workbook ${new Date().toISOString()}`,
          content: base64Content,
          sha: sha
        });

        // Update last sync time
        this.config.lastSync = new Date().toISOString();
        
        // Add to sync history
        this.addSyncHistory('upload', true);
        
        return { success: true };
      } catch (uploadError: any) {
        // Handle specific GitHub conflict errors
        if (uploadError.status === 422 && uploadError.message && uploadError.message.includes('does not match')) {
          // This is a conflict error - the file has been modified on GitHub
          // Let's try to get the latest SHA and retry
          try {
            const response = await this.octokit.rest.repos.getContent({
              owner: this.config.repoOwner,
              repo: this.config.repoName,
              path: this.config.filePath
            });
            
            if ('sha' in response.data) {
              const newSha = response.data.sha;
              
              // Retry with the correct SHA
              await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.config.repoOwner,
                repo: this.config.repoName,
                path: this.config.filePath,
                message: `Update sales workbook ${new Date().toISOString()}`,
                content: base64Content,
                sha: newSha
              });
              
              // Update last sync time
              this.config.lastSync = new Date().toISOString();
              
              // Add to sync history
              this.addSyncHistory('upload', true, 'Successfully resolved conflict and uploaded');
              
              return { success: true };
            }
          } catch (retryError: any) {
            // If retry also fails, report the original error
            this.addSyncHistory('upload', false, `Conflict resolution failed: ${uploadError.message}`);
            return { success: false, error: `Conflict resolution failed: ${uploadError.message}` };
          }
        }
        
        // For all other errors, just report them
        this.addSyncHistory('upload', false, uploadError.message);
        return { success: false, error: uploadError.message };
      }
    } catch (error: any) {
      // Add to sync history
      this.addSyncHistory('upload', false, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download workbook from GitHub repository
   */
  async downloadWorkbook(): Promise<{ success: boolean; error?: string }> {
    if (!this.octokit || !this.config) {
      this.addSyncHistory('download', false, 'GitHub handler not initialized');
      return { success: false, error: 'GitHub handler not initialized' };
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.repoOwner,
        repo: this.config.repoName,
        path: this.config.filePath
      });

      if (!('content' in response.data)) {
        this.addSyncHistory('download', false, 'Invalid file content');
        return { success: false, error: 'Invalid file content' };
      }

      // Decode base64 content
      const buffer = Buffer.from(response.data.content, 'base64');
      
      // Backup current workbook before replacing
      const backupPath = this.workbookPath + '.backup.' + Date.now();
      fs.copyFileSync(this.workbookPath, backupPath);
      
      // Write new content to workbook
      fs.writeFileSync(this.workbookPath, buffer);
      
      // Update last sync time
      this.config.lastSync = new Date().toISOString();
      
      // Add to sync history
      this.addSyncHistory('download', true);
      
      return { success: true };
    } catch (error: any) {
      // Add to sync history
      this.addSyncHistory('download', false, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start auto-sync based on configured interval
   */
  startAutoSync(): void {
    if (!this.config || this.config.autoSyncInterval <= 0) {
      return;
    }

    // Clear existing interval if any
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Convert minutes to milliseconds
    const intervalMs = this.config.autoSyncInterval * 60 * 1000;
    
    // Start new interval
    this.syncInterval = setInterval(async () => {
      try {
        const result = await this.uploadWorkbook();
        if (!result.success) {
          this.addSyncHistory('auto-sync', false, result.error);
        }
      } catch (error: any) {
        console.error('Auto-sync failed:', error);
        this.addSyncHistory('auto-sync', false, error.message);
      }
    }, intervalMs);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): GitHubSyncStatus {
    const status: GitHubSyncStatus = {
      connected: this.octokit !== null,
      lastSync: this.config?.lastSync || null,
      nextSync: null,
      error: null
    };

    if (this.config && this.config.enabled && this.config.autoSyncInterval > 0) {
      const lastSyncTime = this.config.lastSync ? new Date(this.config.lastSync).getTime() : Date.now();
      const nextSyncTime = lastSyncTime + (this.config.autoSyncInterval * 60 * 1000);
      status.nextSync = new Date(nextSyncTime).toISOString();
    }

    return status;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: GitHubSyncConfig): void {
    const oldInterval = this.config?.autoSyncInterval;
    this.config = newConfig;
    
    // Restart auto-sync if interval changed
    if (oldInterval !== newConfig.autoSyncInterval) {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
      
      if (newConfig.enabled && newConfig.autoSyncInterval > 0) {
        this.startAutoSync();
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoSync();
    this.octokit = null;
    this.config = null;
  }
}