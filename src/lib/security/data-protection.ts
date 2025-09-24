export interface PrivacySettings {
  profileVisibility: 'public' | 'members' | 'private';
  photoVisibility: 'visible' | 'blurred' | 'hidden';
  contactInfoVisibility: 'hidden' | 'after_interest' | 'after_mutual_interest';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowProfileViews: boolean;
  allowDirectMessages: boolean;
  showInSearchResults: boolean;
}

export interface DataAccessLog {
  id: string;
  userId: string;
  accessedBy: string;
  dataType: 'profile' | 'contact' | 'photo' | 'document';
  action: 'view' | 'download' | 'share' | 'export';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
}

export interface ConsentRecord {
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing';
  granted: boolean;
  timestamp: string;
  version: string;
  ipAddress?: string;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriodDays: number;
  autoDelete: boolean;
  requiresUserConsent: boolean;
  description: string;
}

export class DataProtectionManager {
  private static readonly ENCRYPTION_KEY_LENGTH = 32;
  private static readonly SALT_LENGTH = 16;

  // Data retention policies
  private static readonly RETENTION_POLICIES: DataRetentionPolicy[] = [
    {
      dataType: 'profile_data',
      retentionPeriodDays: 365 * 2, // 2 years after account deletion
      autoDelete: true,
      requiresUserConsent: true,
      description: 'User profile information including personal details'
    },
    {
      dataType: 'interest_history',
      retentionPeriodDays: 365, // 1 year
      autoDelete: true,
      requiresUserConsent: false,
      description: 'History of sent and received interests'
    },
    {
      dataType: 'chat_messages',
      retentionPeriodDays: 365 * 3, // 3 years
      autoDelete: false,
      requiresUserConsent: true,
      description: 'Private messages between users'
    },
    {
      dataType: 'verification_documents',
      retentionPeriodDays: 365 * 7, // 7 years (legal requirement)
      autoDelete: false,
      requiresUserConsent: false,
      description: 'Identity verification documents'
    },
    {
      dataType: 'access_logs',
      retentionPeriodDays: 90, // 3 months
      autoDelete: true,
      requiresUserConsent: false,
      description: 'System access and activity logs'
    },
    {
      dataType: 'analytics_data',
      retentionPeriodDays: 365, // 1 year
      autoDelete: true,
      requiresUserConsent: true,
      description: 'Anonymized usage analytics'
    }
  ];

  // Default privacy settings for new users
  static readonly DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
    profileVisibility: 'members',
    photoVisibility: 'blurred',
    contactInfoVisibility: 'after_mutual_interest',
    showOnlineStatus: true,
    showLastSeen: false,
    allowProfileViews: true,
    allowDirectMessages: true,
    showInSearchResults: true
  };

  // Check if user can access another user's data
  static canAccessUserData(
    requestingUserId: string,
    targetUserId: string,
    dataType: 'profile' | 'contact' | 'photo',
    targetUserPrivacy: PrivacySettings,
    relationshipStatus?: 'none' | 'interest_sent' | 'interest_received' | 'mutual_interest'
  ): { allowed: boolean; reason?: string } {
    // Users can always access their own data
    if (requestingUserId === targetUserId) {
      return { allowed: true };
    }

    switch (dataType) {
      case 'profile':
        return this.checkProfileAccess(targetUserPrivacy, relationshipStatus);
      case 'contact':
        return this.checkContactAccess(targetUserPrivacy, relationshipStatus);
      case 'photo':
        return this.checkPhotoAccess(targetUserPrivacy, relationshipStatus);
      default:
        return { allowed: false, reason: 'Unknown data type' };
    }
  }

  private static checkProfileAccess(
    privacy: PrivacySettings,
    relationshipStatus?: string
  ): { allowed: boolean; reason?: string } {
    if (!privacy.allowProfileViews) {
      return { allowed: false, reason: 'Profile views disabled by user' };
    }

    switch (privacy.profileVisibility) {
      case 'public':
        return { allowed: true };
      case 'members':
        return { allowed: true }; // Assuming requesting user is a member
      case 'private':
        return relationshipStatus === 'mutual_interest'
          ? { allowed: true }
          : { allowed: false, reason: 'Profile is private' };
      default:
        return { allowed: false, reason: 'Invalid privacy setting' };
    }
  }

  private static checkContactAccess(
    privacy: PrivacySettings,
    relationshipStatus?: string
  ): { allowed: boolean; reason?: string } {
    switch (privacy.contactInfoVisibility) {
      case 'hidden':
        return { allowed: false, reason: 'Contact information is hidden' };
      case 'after_interest':
        return relationshipStatus && relationshipStatus !== 'none'
          ? { allowed: true }
          : { allowed: false, reason: 'Contact info available only after expressing interest' };
      case 'after_mutual_interest':
        return relationshipStatus === 'mutual_interest'
          ? { allowed: true }
          : { allowed: false, reason: 'Contact info available only after mutual interest' };
      default:
        return { allowed: false, reason: 'Invalid privacy setting' };
    }
  }

  private static checkPhotoAccess(
    privacy: PrivacySettings,
    relationshipStatus?: string
  ): { allowed: boolean; reason?: string } {
    switch (privacy.photoVisibility) {
      case 'visible':
        return { allowed: true };
      case 'blurred':
        return { allowed: true }; // Blurred version is allowed
      case 'hidden':
        return relationshipStatus === 'mutual_interest'
          ? { allowed: true }
          : { allowed: false, reason: 'Photos are hidden' };
      default:
        return { allowed: false, reason: 'Invalid privacy setting' };
    }
  }

  // Log data access for audit purposes
  static async logDataAccess(
    userId: string,
    accessedBy: string,
    dataType: DataAccessLog['dataType'],
    action: DataAccessLog['action'],
    additionalInfo?: {
      ipAddress?: string;
      userAgent?: string;
      purpose?: string;
    }
  ): Promise<DataAccessLog> {
    const log: DataAccessLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      accessedBy,
      dataType,
      action,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    };

    // In a real implementation, this would be stored in the database
    console.log('Data Access Log:', log);
    
    return log;
  }

  // Record user consent
  static async recordConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    version: string,
    ipAddress?: string
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      userId,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
      version,
      ipAddress
    };

    // In a real implementation, this would be stored in the database
    console.log('Consent Record:', consent);
    
    return consent;
  }

  // Check if user has given consent for specific data processing
  static async hasValidConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    currentVersion: string
  ): Promise<boolean> {
    // In a real implementation, this would query the database
    // For now, return true as placeholder
    return true;
  }

  // Anonymize user data for analytics
  static anonymizeUserData(userData: any): any {
    const anonymized = { ...userData };
    
    // Remove or hash personally identifiable information
    const piiFields = [
      'name', 'email', 'phone', 'address', 'village',
      'fatherName', 'motherName', 'familyBackground'
    ];

    piiFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = this.hashString(anonymized[field]);
      }
    });

    // Keep only necessary demographic data
    const allowedFields = [
      'age', 'gender', 'district', 'block', 'education',
      'occupation', 'sect', 'maritalStatus', 'createdAt'
    ];

    const filtered: any = {};
    allowedFields.forEach(field => {
      if (anonymized[field] !== undefined) {
        filtered[field] = anonymized[field];
      }
    });

    return filtered;
  }

  // Hash sensitive strings for anonymization
  private static hashString(input: string): string {
    // Simple hash function for demonstration
    // In production, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  // Encrypt sensitive data
  static async encryptSensitiveData(data: string, key?: string): Promise<{
    encrypted: string;
    salt: string;
    iv: string;
  }> {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    // Use provided key or generate one
    const keyMaterial = key 
      ? new TextEncoder().encode(key)
      : crypto.getRandomValues(new Uint8Array(this.ENCRYPTION_KEY_LENGTH));

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt data
    const encodedData = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedData
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      salt: this.arrayBufferToBase64(salt),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  // Decrypt sensitive data
  static async decryptSensitiveData(
    encryptedData: string,
    salt: string,
    iv: string,
    key: string
  ): Promise<string> {
    // Convert base64 back to ArrayBuffer
    const encrypted = this.base64ToArrayBuffer(encryptedData);
    const saltBuffer = this.base64ToArrayBuffer(salt);
    const ivBuffer = this.base64ToArrayBuffer(iv);

    // Import key
    const keyMaterial = new TextEncoder().encode(key);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      cryptoKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Generate data export for user (GDPR compliance)
  static async generateDataExport(userId: string): Promise<{
    profile: any;
    interests: any[];
    messages: any[];
    accessLogs: DataAccessLog[];
    consents: ConsentRecord[];
    exportedAt: string;
  }> {
    // In a real implementation, this would query all user data from the database
    return {
      profile: {}, // User profile data
      interests: [], // Interest history
      messages: [], // Chat messages
      accessLogs: [], // Data access logs
      consents: [], // Consent records
      exportedAt: new Date().toISOString()
    };
  }

  // Delete user data (GDPR right to be forgotten)
  static async deleteUserData(
    userId: string,
    dataTypes: string[] = ['all']
  ): Promise<{
    deleted: string[];
    retained: Array<{ type: string; reason: string; retentionPeriod: number }>;
  }> {
    const deleted: string[] = [];
    const retained: Array<{ type: string; reason: string; retentionPeriod: number }> = [];

    for (const policy of this.RETENTION_POLICIES) {
      if (dataTypes.includes('all') || dataTypes.includes(policy.dataType)) {
        if (policy.autoDelete && !this.hasLegalRetentionRequirement(policy.dataType)) {
          // Delete immediately
          deleted.push(policy.dataType);
        } else {
          // Mark for retention
          retained.push({
            type: policy.dataType,
            reason: this.getRetentionReason(policy.dataType),
            retentionPeriod: policy.retentionPeriodDays
          });
        }
      }
    }

    return { deleted, retained };
  }

  private static hasLegalRetentionRequirement(dataType: string): boolean {
    // Verification documents must be retained for legal compliance
    return dataType === 'verification_documents';
  }

  private static getRetentionReason(dataType: string): string {
    const reasons: Record<string, string> = {
      verification_documents: 'Legal compliance requirement',
      chat_messages: 'Dispute resolution and safety',
      access_logs: 'Security monitoring'
    };
    
    return reasons[dataType] || 'Business requirement';
  }

  // Check data retention compliance
  static async checkRetentionCompliance(): Promise<{
    compliant: boolean;
    issues: Array<{
      dataType: string;
      issue: string;
      recordCount: number;
      oldestRecord: string;
    }>;
  }> {
    const issues: Array<{
      dataType: string;
      issue: string;
      recordCount: number;
      oldestRecord: string;
    }> = [];

    // In a real implementation, this would check the database for retention violations
    // For now, return compliant status
    return {
      compliant: issues.length === 0,
      issues
    };
  }

  // Get privacy settings recommendations based on user profile
  static getPrivacyRecommendations(
    userProfile: any,
    currentSettings: PrivacySettings
  ): Array<{
    setting: keyof PrivacySettings;
    currentValue: any;
    recommendedValue: any;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const recommendations: Array<{
      setting: keyof PrivacySettings;
      currentValue: any;
      recommendedValue: any;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Recommend blurred photos for new users
    if (currentSettings.photoVisibility === 'visible' && this.isNewUser(userProfile)) {
      recommendations.push({
        setting: 'photoVisibility',
        currentValue: 'visible',
        recommendedValue: 'blurred',
        reason: 'Blurred photos provide better privacy while still showing your appearance',
        priority: 'medium'
      });
    }

    // Recommend hiding contact info until mutual interest
    if (currentSettings.contactInfoVisibility === 'after_interest') {
      recommendations.push({
        setting: 'contactInfoVisibility',
        currentValue: 'after_interest',
        recommendedValue: 'after_mutual_interest',
        reason: 'Sharing contact info only after mutual interest provides better privacy',
        priority: 'high'
      });
    }

    return recommendations;
  }

  private static isNewUser(userProfile: any): boolean {
    if (!userProfile.createdAt) return true;
    const createdDate = new Date(userProfile.createdAt);
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < 30; // Consider users new for first 30 days
  }
}