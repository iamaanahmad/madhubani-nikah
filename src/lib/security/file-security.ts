export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  requireImageDimensions?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  scanForMalware?: boolean;
  checkImageIntegrity?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    size: number;
    type: string;
    extension: string;
    dimensions?: { width: number; height: number };
    hash?: string;
  };
}

export interface SecureFileInfo {
  originalName: string;
  sanitizedName: string;
  size: number;
  type: string;
  extension: string;
  hash: string;
  isImage: boolean;
  dimensions?: { width: number; height: number };
  securityScore: number; // 0-100, higher is safer
}

export class FileSecurityValidator {
  private static readonly DANGEROUS_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'php', 'asp', 'aspx', 'jsp', 'py', 'rb', 'pl', 'sh', 'ps1'
  ];

  private static readonly SAFE_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  private static readonly SAFE_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  private static readonly MAX_FILE_SIZE = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    default: 2 * 1024 * 1024 // 2MB
  };

  static async validateFile(
    file: File,
    options: FileValidationOptions = {}
  ): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic file checks
    if (!file || !(file instanceof File)) {
      errors.push('Invalid file object');
      return { isValid: false, errors, warnings };
    }

    const extension = this.getFileExtension(file.name);
    const metadata = {
      size: file.size,
      type: file.type,
      extension,
      hash: await this.calculateFileHash(file)
    };

    // Size validation
    const maxSize = options.maxSize || this.getMaxSizeForType(file.type);
    if (file.size > maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Extension validation
    if (this.DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
      errors.push(`File extension '${extension}' is not allowed for security reasons`);
    }

    if (options.allowedExtensions && !options.allowedExtensions.includes(extension.toLowerCase())) {
      errors.push(`File extension '${extension}' is not in the allowed list: ${options.allowedExtensions.join(', ')}`);
    }

    // MIME type validation
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`File type '${file.type}' is not allowed`);
    }

    // Check MIME type vs extension consistency
    const mimeExtensionMatch = this.validateMimeExtensionConsistency(file.type, extension);
    if (!mimeExtensionMatch) {
      warnings.push('File extension does not match MIME type - possible file type spoofing');
    }

    // Image-specific validation
    if (this.isImageFile(file.type)) {
      try {
        const dimensions = await this.getImageDimensions(file);
        metadata.dimensions = dimensions;

        if (options.requireImageDimensions) {
          const dimErrors = this.validateImageDimensions(dimensions, options.requireImageDimensions);
          errors.push(...dimErrors);
        }

        if (options.checkImageIntegrity) {
          const integrityCheck = await this.checkImageIntegrity(file);
          if (!integrityCheck.isValid) {
            errors.push('Image file appears to be corrupted or invalid');
          }
        }
      } catch (error) {
        errors.push('Failed to process image file - file may be corrupted');
      }
    }

    // Malware scanning (placeholder - would integrate with actual scanner)
    if (options.scanForMalware) {
      const malwareResult = await this.scanForMalware(file);
      if (!malwareResult.isClean) {
        errors.push('File failed malware scan');
      }
    }

    // Check for embedded scripts in images
    if (this.isImageFile(file.type)) {
      const hasEmbeddedScript = await this.checkForEmbeddedScripts(file);
      if (hasEmbeddedScript) {
        errors.push('Image contains embedded scripts or suspicious content');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  static async generateSecureFileInfo(file: File): Promise<SecureFileInfo> {
    const extension = this.getFileExtension(file.name);
    const sanitizedName = this.sanitizeFileName(file.name);
    const hash = await this.calculateFileHash(file);
    const isImage = this.isImageFile(file.type);
    
    let dimensions: { width: number; height: number } | undefined;
    if (isImage) {
      try {
        dimensions = await this.getImageDimensions(file);
      } catch (error) {
        // Ignore dimension errors for security score calculation
      }
    }

    const securityScore = this.calculateSecurityScore(file, extension, isImage);

    return {
      originalName: file.name,
      sanitizedName,
      size: file.size,
      type: file.type,
      extension,
      hash,
      isImage,
      dimensions,
      securityScore
    };
  }

  private static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.slice(lastDot + 1) : '';
  }

  private static sanitizeFileName(fileName: string): string {
    // Remove path separators and dangerous characters
    let sanitized = fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/^\.+/, '')
      .replace(/\.+$/, '')
      .trim();

    // Limit length
    if (sanitized.length > 255) {
      const extension = this.getFileExtension(sanitized);
      const nameWithoutExt = sanitized.slice(0, sanitized.lastIndexOf('.'));
      const maxNameLength = 255 - extension.length - 1;
      sanitized = nameWithoutExt.slice(0, maxNameLength) + '.' + extension;
    }

    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'file';
    }

    return sanitized;
  }

  private static async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static getMaxSizeForType(mimeType: string): number {
    if (this.SAFE_IMAGE_TYPES.includes(mimeType)) {
      return this.MAX_FILE_SIZE.image;
    }
    if (this.SAFE_DOCUMENT_TYPES.includes(mimeType)) {
      return this.MAX_FILE_SIZE.document;
    }
    return this.MAX_FILE_SIZE.default;
  }

  private static isImageFile(mimeType: string): boolean {
    return this.SAFE_IMAGE_TYPES.includes(mimeType);
  }

  private static validateMimeExtensionConsistency(mimeType: string, extension: string): boolean {
    const mimeExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
    };

    const expectedExtensions = mimeExtensionMap[mimeType];
    return expectedExtensions ? expectedExtensions.includes(extension.toLowerCase()) : true;
  }

  private static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  private static validateImageDimensions(
    dimensions: { width: number; height: number },
    requirements: NonNullable<FileValidationOptions['requireImageDimensions']>
  ): string[] {
    const errors: string[] = [];

    if (requirements.minWidth && dimensions.width < requirements.minWidth) {
      errors.push(`Image width (${dimensions.width}px) is less than minimum required (${requirements.minWidth}px)`);
    }

    if (requirements.maxWidth && dimensions.width > requirements.maxWidth) {
      errors.push(`Image width (${dimensions.width}px) exceeds maximum allowed (${requirements.maxWidth}px)`);
    }

    if (requirements.minHeight && dimensions.height < requirements.minHeight) {
      errors.push(`Image height (${dimensions.height}px) is less than minimum required (${requirements.minHeight}px)`);
    }

    if (requirements.maxHeight && dimensions.height > requirements.maxHeight) {
      errors.push(`Image height (${dimensions.height}px) exceeds maximum allowed (${requirements.maxHeight}px)`);
    }

    return errors;
  }

  private static async checkImageIntegrity(file: File): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Try to create an image element and load the file
      const dimensions = await this.getImageDimensions(file);
      return { isValid: dimensions.width > 0 && dimensions.height > 0 };
    } catch (error) {
      return { isValid: false, error: 'Image integrity check failed' };
    }
  }

  private static async scanForMalware(file: File): Promise<{ isClean: boolean; threats?: string[] }> {
    // Basic file validation - in production, integrate with a malware scanning service
    // For now, we perform basic checks on file type and size
    
    // Basic checks for suspicious patterns in file content
    const buffer = await file.arrayBuffer();
    const content = new TextDecoder().decode(buffer.slice(0, Math.min(1024, buffer.byteLength)));
    
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i
    ];

    const threats: string[] = [];
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious script content detected');
        break;
      }
    }

    return {
      isClean: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined
    };
  }

  private static async checkForEmbeddedScripts(file: File): Promise<boolean> {
    try {
      const buffer = await file.arrayBuffer();
      const content = new TextDecoder().decode(buffer);
      
      // Check for common script patterns in image files
      const scriptPatterns = [
        /<script/i,
        /javascript:/i,
        /eval\(/i,
        /document\./i,
        /window\./i
      ];

      return scriptPatterns.some(pattern => pattern.test(content));
    } catch (error) {
      return false; // If we can't read the file, assume it's safe
    }
  }

  private static calculateSecurityScore(file: File, extension: string, isImage: boolean): number {
    let score = 100;

    // Deduct points for dangerous extensions
    if (this.DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
      score -= 50;
    }

    // Deduct points for large files
    const maxSize = this.getMaxSizeForType(file.type);
    if (file.size > maxSize * 0.8) {
      score -= 10;
    }

    // Deduct points for unknown MIME types
    if (!this.SAFE_IMAGE_TYPES.includes(file.type) && !this.SAFE_DOCUMENT_TYPES.includes(file.type)) {
      score -= 20;
    }

    // Add points for safe image types
    if (isImage && this.SAFE_IMAGE_TYPES.includes(file.type)) {
      score += 10;
    }

    // Deduct points for suspicious file names
    const suspiciousNamePatterns = [
      /\.(exe|bat|cmd|scr)$/i,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
      /[<>:"|?*]/
    ];

    if (suspiciousNamePatterns.some(pattern => pattern.test(file.name))) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Predefined validation configurations
  static readonly VALIDATION_CONFIGS = {
    PROFILE_PICTURE: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      requireImageDimensions: {
        minWidth: 200,
        maxWidth: 2000,
        minHeight: 200,
        maxHeight: 2000
      },
      checkImageIntegrity: true
    },
    VERIFICATION_DOCUMENT: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      scanForMalware: true
    },
    GENERAL_DOCUMENT: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      allowedExtensions: ['pdf', 'doc', 'docx', 'txt'],
      scanForMalware: true
    }
  };
}