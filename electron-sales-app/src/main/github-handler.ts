import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';

export interface GitHubSyncConfig {
  accessToken: string;
  repoOwner: string;
  repoName: string;
  filePath: string;
  autoSyncInterval: number; // in minutes
  lastSync: string; // ISO date string
  enabled: boolean;
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

  constructor(workbookPath: string) {
    this.workbookPath = workbookPath;
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
      return { success: false, error: 'GitHub handler not initialized' };
    }

    try {
      // Read the workbook file
      const fileContent = fs.readFileSync(this.workbookPath);
      const base64Content = fileContent.toString('base64');

      // Check if file already exists
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
      } catch (error) {
        // File doesn't exist, which is fine
        sha = undefined;
      }

      // Upload/Update the file
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
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download workbook from GitHub repository
   */
  async downloadWorkbook(): Promise<{ success: boolean; error?: string }> {
    if (!this.octokit || !this.config) {
      return { success: false, error: 'GitHub handler not initialized' };
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.repoOwner,
        repo: this.config.repoName,
        path: this.config.filePath
      });

      if (!('content' in response.data)) {
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
      
      return { success: true };
    } catch (error: any) {
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
        await this.uploadWorkbook();
      } catch (error) {
        console.error('Auto-sync failed:', error);
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

    if (this.config && this.config.enabled && this.config.autoSyncInterval > 0 && this.syncInterval) {
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