import { ValidationError, FormValidationResult, AppwriteErrorType } from '../appwrite-errors';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  phone?: boolean;
  age?: { min: number; max: number };
  fileSize?: number; // in bytes
  fileTypes?: string[];
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

export class FormValidator {
  private static emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static phonePattern = /^(\+91|91)?[6-9]\d{9}$/;

  static validateForm(data: Record<string, any>, rules: FieldValidation): FormValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const [fieldName, rule] of Object.entries(rules)) {
      const value = data[fieldName];
      const fieldErrors = this.validateField(fieldName, value, rule);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateField(fieldName: string, value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required validation
    if (rule.required && this.isEmpty(value)) {
      errors.push({
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} is required`,
        code: 'REQUIRED',
        value
      });
      return errors; // Don't continue if required field is empty
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !rule.required) {
      return errors;
    }

    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be at least ${rule.minLength} characters`,
          code: 'MIN_LENGTH',
          value
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must not exceed ${rule.maxLength} characters`,
          code: 'MAX_LENGTH',
          value
        });
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} format is invalid`,
        code: 'INVALID_FORMAT',
        value
      });
    }

    // Email validation
    if (rule.email && typeof value === 'string' && !this.emailPattern.test(value)) {
      errors.push({
        field: fieldName,
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL',
        value
      });
    }

    // Phone validation
    if (rule.phone && typeof value === 'string' && !this.phonePattern.test(value)) {
      errors.push({
        field: fieldName,
        message: 'Please enter a valid Indian phone number',
        code: 'INVALID_PHONE',
        value
      });
    }

    // Age validation
    if (rule.age && typeof value === 'number') {
      if (value < rule.age.min) {
        errors.push({
          field: fieldName,
          message: `Age must be at least ${rule.age.min} years`,
          code: 'MIN_AGE',
          value
        });
      }
      if (value > rule.age.max) {
        errors.push({
          field: fieldName,
          message: `Age must not exceed ${rule.age.max} years`,
          code: 'MAX_AGE',
          value
        });
      }
    }

    // File size validation
    if (rule.fileSize && value instanceof File && value.size > rule.fileSize) {
      errors.push({
        field: fieldName,
        message: `File size must not exceed ${this.formatFileSize(rule.fileSize)}`,
        code: 'FILE_SIZE_EXCEEDED',
        value: value.size
      });
    }

    // File type validation
    if (rule.fileTypes && value instanceof File) {
      const fileExtension = value.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !rule.fileTypes.includes(fileExtension)) {
        errors.push({
          field: fieldName,
          message: `File type must be one of: ${rule.fileTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE',
          value: fileExtension
        });
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push({
          field: fieldName,
          message: customError,
          code: 'CUSTOM_VALIDATION',
          value
        });
      }
    }

    return errors;
  }

  static validateProfileData(profileData: any): FormValidationResult {
    const rules: FieldValidation = {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/
      },
      email: {
        required: true,
        email: true
      },
      age: {
        required: true,
        age: { min: 18, max: 60 }
      },
      gender: {
        required: true,
        custom: (value) => {
          if (!['male', 'female'].includes(value)) {
            return 'Gender must be either male or female';
          }
          return null;
        }
      },
      district: {
        required: true,
        minLength: 2,
        maxLength: 50
      },
      block: {
        required: true,
        minLength: 2,
        maxLength: 50
      },
      education: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      occupation: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      sect: {
        required: true,
        custom: (value) => {
          if (!['Sunni', 'Shia', 'Other'].includes(value)) {
            return 'Sect must be Sunni, Shia, or Other';
          }
          return null;
        }
      },
      bio: {
        maxLength: 500
      },
      phone: {
        phone: true
      }
    };

    return this.validateForm(profileData, rules);
  }

  static validateAuthData(authData: any, type: 'login' | 'register'): FormValidationResult {
    const baseRules: FieldValidation = {
      email: {
        required: true,
        email: true
      },
      password: {
        required: true,
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      }
    };

    if (type === 'register') {
      baseRules.name = {
        required: true,
        minLength: 2,
        maxLength: 50
      };
      baseRules.confirmPassword = {
        required: true,
        custom: (value) => {
          if (value !== authData.password) {
            return 'Passwords do not match';
          }
          return null;
        }
      };
    }

    return this.validateForm(authData, baseRules);
  }

  private static isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0);
  }

  private static formatFieldName(fieldName: string): string {
    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Real-time validation hook for React components
export class RealTimeValidator {
  private static debounceTimers = new Map<string, NodeJS.Timeout>();

  static validateFieldWithDebounce(
    fieldName: string,
    value: any,
    rule: ValidationRule,
    callback: (errors: ValidationError[]) => void,
    delay: number = 300
  ): void {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(fieldName);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      const errors = FormValidator.validateField(fieldName, value, rule);
      callback(errors);
      this.debounceTimers.delete(fieldName);
    }, delay);

    this.debounceTimers.set(fieldName, timer);
  }

  static clearDebounceTimer(fieldName: string): void {
    const timer = this.debounceTimers.get(fieldName);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(fieldName);
    }
  }
}