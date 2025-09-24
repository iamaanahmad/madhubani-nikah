import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
  trimWhitespace?: boolean;
  removeEmptyLines?: boolean;
  normalizeUnicode?: boolean;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'boolean';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  custom?: (value: any) => string | null;
}

export interface SanitizationResult {
  sanitized: any;
  wasModified: boolean;
  removedContent?: string[];
  warnings?: string[];
}

export class InputSanitizer {
  private static readonly DANGEROUS_PATTERNS = [
    // Script injection
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    // Event handlers
    /on\w+\s*=\s*["'][^"']*["']/gi,
    // JavaScript URLs
    /javascript:/gi,
    // Data URLs with scripts
    /data:text\/html/gi,
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    // Command injection
    /[;&|`$(){}[\]]/g,
    // Path traversal
    /\.\.[\/\\]/g
  ];

  private static readonly PHONE_PATTERNS = {
    indian: /^(\+91|91)?[6-9]\d{9}$/,
    international: /^\+?[1-9]\d{1,14}$/
  };

  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

  static sanitizeString(
    input: string,
    options: SanitizationOptions = {}
  ): SanitizationResult {
    if (typeof input !== 'string') {
      return {
        sanitized: '',
        wasModified: true,
        warnings: ['Input was not a string, converted to empty string']
      };
    }

    let sanitized = input;
    let wasModified = false;
    const removedContent: string[] = [];
    const warnings: string[] = [];

    // Normalize unicode if requested
    if (options.normalizeUnicode) {
      const normalized = sanitized.normalize('NFC');
      if (normalized !== sanitized) {
        sanitized = normalized;
        wasModified = true;
      }
    }

    // Trim whitespace
    if (options.trimWhitespace !== false) {
      const trimmed = sanitized.trim();
      if (trimmed !== sanitized) {
        sanitized = trimmed;
        wasModified = true;
      }
    }

    // Remove empty lines
    if (options.removeEmptyLines) {
      const withoutEmptyLines = sanitized.replace(/^\s*[\r\n]/gm, '');
      if (withoutEmptyLines !== sanitized) {
        sanitized = withoutEmptyLines;
        wasModified = true;
      }
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        removedContent.push(...matches);
        sanitized = sanitized.replace(pattern, '');
        wasModified = true;
        warnings.push('Potentially dangerous content removed');
      }
    }

    // HTML sanitization
    if (options.allowHtml) {
      const purifyConfig: any = {};
      
      if (options.allowedTags) {
        purifyConfig.ALLOWED_TAGS = options.allowedTags;
      }
      
      if (options.allowedAttributes) {
        purifyConfig.ALLOWED_ATTR = options.allowedAttributes;
      }

      const purified = DOMPurify.sanitize(sanitized, purifyConfig);
      if (purified !== sanitized) {
        sanitized = purified;
        wasModified = true;
        warnings.push('HTML content was sanitized');
      }
    } else {
      // Strip all HTML tags
      const withoutHtml = sanitized.replace(/<[^>]*>/g, '');
      if (withoutHtml !== sanitized) {
        sanitized = withoutHtml;
        wasModified = true;
        warnings.push('HTML tags were removed');
      }
    }

    // Enforce maximum length
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
      wasModified = true;
      warnings.push(`Content was truncated to ${options.maxLength} characters`);
    }

    return {
      sanitized,
      wasModified,
      removedContent: removedContent.length > 0 ? removedContent : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static sanitizeObject(
    obj: Record<string, any>,
    fieldOptions: Record<string, SanitizationOptions> = {}
  ): {
    sanitized: Record<string, any>;
    wasModified: boolean;
    fieldWarnings: Record<string, string[]>;
  } {
    const sanitized: Record<string, any> = {};
    let wasModified = false;
    const fieldWarnings: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(obj)) {
      const options = fieldOptions[key] || {};
      
      if (typeof value === 'string') {
        const result = this.sanitizeString(value, options);
        sanitized[key] = result.sanitized;
        
        if (result.wasModified) {
          wasModified = true;
        }
        
        if (result.warnings) {
          fieldWarnings[key] = result.warnings;
        }
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' 
            ? this.sanitizeString(item, options).sanitized 
            : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return {
      sanitized,
      wasModified,
      fieldWarnings
    };
  }

  static validateInput(value: any, rules: ValidationRule): string | null {
    // Required check
    if (rules.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // Type validation
    if (rules.type) {
      const typeError = this.validateType(value, rules.type);
      if (typeError) return typeError;
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Must be at least ${rules.minLength} characters long`;
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        return `Must not exceed ${rules.maxLength} characters`;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return 'Invalid format';
    }

    // Allowed values validation
    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
      return `Must be one of: ${rules.allowedValues.join(', ')}`;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) return customError;
    }

    return null;
  }

  private static validateType(value: any, type: ValidationRule['type']): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return 'Must be a string';
        }
        break;
        
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return 'Must be a valid number';
        }
        break;
        
      case 'email':
        if (typeof value !== 'string' || !this.EMAIL_PATTERN.test(value)) {
          return 'Must be a valid email address';
        }
        break;
        
      case 'phone':
        if (typeof value !== 'string' || !this.PHONE_PATTERNS.indian.test(value)) {
          return 'Must be a valid Indian phone number';
        }
        break;
        
      case 'url':
        if (typeof value !== 'string' || !this.URL_PATTERN.test(value)) {
          return 'Must be a valid URL';
        }
        break;
        
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Must be a valid date';
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          return 'Must be true or false';
        }
        break;
    }
    
    return null;
  }

  // Specialized sanitizers for common use cases
  static sanitizeProfileData(profileData: any): {
    sanitized: any;
    warnings: string[];
  } {
    const fieldOptions: Record<string, SanitizationOptions> = {
      name: { maxLength: 50, trimWhitespace: true },
      bio: { maxLength: 500, allowHtml: false, removeEmptyLines: true },
      education: { maxLength: 100, trimWhitespace: true },
      occupation: { maxLength: 100, trimWhitespace: true },
      district: { maxLength: 50, trimWhitespace: true },
      block: { maxLength: 50, trimWhitespace: true },
      village: { maxLength: 50, trimWhitespace: true },
      familyBackground: { maxLength: 200, allowHtml: false }
    };

    const result = this.sanitizeObject(profileData, fieldOptions);
    const allWarnings: string[] = [];
    
    Object.values(result.fieldWarnings).forEach(warnings => {
      allWarnings.push(...warnings);
    });

    return {
      sanitized: result.sanitized,
      warnings: allWarnings
    };
  }

  static sanitizeSearchQuery(query: string): string {
    const result = this.sanitizeString(query, {
      maxLength: 100,
      trimWhitespace: true,
      allowHtml: false
    });
    
    return result.sanitized;
  }

  static sanitizeMessage(message: string): string {
    const result = this.sanitizeString(message, {
      maxLength: 500,
      trimWhitespace: true,
      allowHtml: false,
      removeEmptyLines: true
    });
    
    return result.sanitized;
  }

  // File name sanitization
  static sanitizeFileName(fileName: string): string {
    const result = this.sanitizeString(fileName, {
      maxLength: 255,
      trimWhitespace: true,
      allowHtml: false
    });

    // Remove dangerous characters for file names
    let sanitized = result.sanitized
      .replace(/[<>:"/\\|?*]/g, '') // Windows forbidden characters
      .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Control characters
      .replace(/^\.+/, '') // Leading dots
      .replace(/\.+$/, ''); // Trailing dots

    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'file';
    }

    return sanitized;
  }

  // URL parameter sanitization
  static sanitizeUrlParam(param: string): string {
    const result = this.sanitizeString(param, {
      maxLength: 200,
      trimWhitespace: true,
      allowHtml: false
    });

    // URL encode the result
    return encodeURIComponent(result.sanitized);
  }

  // Check if content contains suspicious patterns
  static containsSuspiciousContent(content: string): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        reasons.push('Contains potentially dangerous patterns');
        break;
      }
    }

    // Check for excessive special characters
    const specialCharCount = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (specialCharCount > content.length * 0.3) {
      reasons.push('Contains excessive special characters');
    }

    // Check for repeated patterns (potential spam)
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 10 && uniqueWords.size < words.length * 0.5) {
      reasons.push('Contains repetitive content');
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons
    };
  }
}