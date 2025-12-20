/**
 * Type definitions for the bulletproof reply detection system v3.0
 * Now with multi-provider support and health tracking
 */

// Supported email providers
export type EmailProvider = 'gmail' | 'outlook' | 'yahoo';

// Types for detection layers
export type DetectionLayer = 
  | 'enhanced_thread' 
  | 'message_id' 
  | 'inbox_sweep_exact' 
  | 'inbox_sweep_domain'
  | 'inbox_sweep_alias'
  | 'inbox_sweep_name'
  | 'gmail-history'
  | 'alias-intelligence'
  | 'parallel-all'
  | 'history_api'
  | 'outlook-delta'
  | 'yahoo-imap';

// Health status for a detection layer
export interface LayerHealthStatus {
  layer: DetectionLayer | string;
  healthy: boolean;
  lastCheckedAt: Date;
  errorMessage?: string;
  responseTimeMs?: number;
}

// Individual reply found during detection
export interface DetectedReply {
  gmailMessageId: string;
  gmailThreadId?: string;
  subject?: string;
  content: string;
  receivedAt: Date;
  detectedAlias?: string;
  provider?: EmailProvider;
}

// Search metadata for audit and debugging
export interface SearchMetadata {
  layer: string;
  queriesRun: string[];
  pagesChecked: number;
  messagesScanned: number;
  notes?: string;
  healthStatus?: LayerHealthStatus;
}

// Normalized detection result - ALL layers must return this exact format
export interface DetectionResult {
  found: boolean;
  replies?: DetectedReply[];
  searchMetadata?: SearchMetadata;
  layerHealth?: LayerHealthStatus;
}

// Comprehensive detection result with quorum info
export interface ComprehensiveDetectionResult extends DetectionResult {
  quorumMet: boolean;
  healthyLayersCount: number;
  totalLayersChecked: number;
  pendingReview: boolean;
  layerResults: { layer: string; found: boolean; healthy: boolean }[];
}

export interface EnhancedThreadCheckOptions {
  userId: number;
  provider: EmailProvider;
  threadId: string;
  originalMessageId: string;
  sentAt: Date;
  recipientEmail: string;
  sentEmailId?: number;
  contactId?: number;
  checkCcBcc?: boolean;
}

export interface ComprehensiveDetectionOptions {
  userId: number;
  provider: EmailProvider;
  sentEmailId: number;
  contactId: number;
  contactEmail: string;
  contactName?: string;
  companyName?: string;
  subject?: string;
  sentAt: Date;
  gmailThreadId?: string;
  gmailMessageId?: string;
  userEmail?: string;
}

// Provider adapter interface - all providers must implement this
export interface EmailProviderAdapter {
  provider: EmailProvider;
  
  // Health check
  checkHealth(userId: number): Promise<LayerHealthStatus>;
  
  // Get user's email address
  getUserEmail(userId: number): Promise<string | null>;
  
  // Fetch a thread/conversation
  fetchThread(userId: number, threadId: string): Promise<{
    messages: ProviderMessage[];
    threadId: string;
  } | null>;
  
  // Search messages
  searchMessages(userId: number, query: string, options?: {
    maxResults?: number;
    afterDate?: Date;
  }): Promise<ProviderMessage[]>;
  
  // Check if token is valid
  isTokenValid(userId: number): Promise<boolean>;
}

// Normalized message format from any provider
export interface ProviderMessage {
  id: string;
  threadId?: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  receivedAt: Date;
  headers: Record<string, string>;
  isAutoReply: boolean;
  provider: EmailProvider;
}

// Quorum configuration
export interface QuorumConfig {
  minHealthyLayers: number;  // Default: 3
  minConfirmingLayers: number;  // Default: 2 for "found", 3 for "not found"
  markPendingOnQuorumFailure: boolean;  // Default: true
}

// Detection audit entry (for database logging)
export interface DetectionAuditEntry {
  sentEmailId: number;
  contactId: number;
  userId: number;
  provider: EmailProvider;
  timestamp: Date;
  layersChecked: string[];
  layersHealthy: string[];
  layersFound: string[];
  quorumMet: boolean;
  finalResult: 'found' | 'not_found' | 'pending_review';
  processingTimeMs: number;
  notes?: string;
}
