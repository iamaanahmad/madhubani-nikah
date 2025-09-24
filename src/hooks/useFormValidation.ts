'use client';

import { useState, useCallback, useEffect } from 'react';
import { FormValidator, RealTimeValidator, ValidationError, FieldValidation, FormValidationResult } from '@/lib/validation/form-validator';
import { AppwriteErrorHandler } from '@/lib/appwrite-errors';
import { useErrorToast } from '@/components/error/error-toast';

export interface UseFormValidationOptions {
  validationRules: FieldValidation;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceDelay?: number;
  showToastOnError?: boolean;
}

export interface FormValidationState {
  errors: Record<string, ValidationError[]>;
  isValid: boolean;
  isValidating: boolean;
  touchedFields: Set<string>;
  hasBeenSubmitted: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  options: UseFormValidationOptions
) {
  const { showError } = useErrorToast();
  const [data, setData] = useState<T>(initialData);
  const [validationState, setValidationState] = useState<FormValidationState>({
    errors: {},
    isValid: true,
    isValidating: false,
    touchedFields: new Set(),
    hasBeenSubmitted: false
  });

  const validateField = useCallback((fieldName: string, value: any) => {
    const rule = options.validationRules[fieldName];
    if (!rule) return [];

    return FormValidator.validateField(fieldName, value, rule);
  }, [options.validationRules]);

  const validateForm = useCallback((formData: T): FormValidationResult => {
    return FormValidator.validateForm(formData, options.validationRules);
  }, [options.validationRules]);

  const updateFieldValidation = useCallback((fieldName: string, errors: ValidationError[]) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      if (errors.length > 0) {
        newErrors[fieldName] = errors;
      } else {
        delete newErrors[fieldName];
      }

      const isValid = Object.keys(newErrors).length === 0;

      return {
        ...prev,
        errors: newErrors,
        isValid
      };
    });
  }, []);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setData(prev => ({ ...prev, [fieldName]: value }));

    if (options.validateOnChange) {
      if (options.debounceDelay && options.debounceDelay > 0) {
        setValidationState(prev => ({ ...prev, isValidating: true }));
        
        RealTimeValidator.validateFieldWithDebounce(
          fieldName,
          value,
          options.validationRules[fieldName],
          (errors) => {
            updateFieldValidation(fieldName, errors);
            setValidationState(prev => ({ ...prev, isValidating: false }));
          },
          options.debounceDelay
        );
      } else {
        const errors = validateField(fieldName, value);
        updateFieldValidation(fieldName, errors);
      }
    }
  }, [options.validateOnChange, options.debounceDelay, options.validationRules, validateField, updateFieldValidation]);

  const handleFieldBlur = useCallback((fieldName: string) => {
    setValidationState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, fieldName])
    }));

    if (options.validateOnBlur) {
      const value = data[fieldName];
      const errors = validateField(fieldName, value);
      updateFieldValidation(fieldName, errors);
    }
  }, [options.validateOnBlur, data, validateField, updateFieldValidation]);

  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<void> | void,
    onError?: (errors: ValidationError[]) => void
  ) => {
    setValidationState(prev => ({ 
      ...prev, 
      hasBeenSubmitted: true,
      isValidating: true
    }));

    try {
      // Validate entire form
      const validationResult = validateForm(data);
      
      if (!validationResult.isValid) {
        // Update all field errors
        const errorsByField: Record<string, ValidationError[]> = {};
        validationResult.errors.forEach(error => {
          if (!errorsByField[error.field]) {
            errorsByField[error.field] = [];
          }
          errorsByField[error.field].push(error);
        });

        setValidationState(prev => ({
          ...prev,
          errors: errorsByField,
          isValid: false,
          isValidating: false
        }));

        if (options.showToastOnError) {
          const errorResponse = AppwriteErrorHandler.createBusinessLogicError(
            'Form validation failed',
            'Please correct the errors in the form and try again'
          );
          showError(errorResponse);
        }

        if (onError) {
          onError(validationResult.errors);
        }
        return;
      }

      // Clear any existing errors
      setValidationState(prev => ({
        ...prev,
        errors: {},
        isValid: true,
        isValidating: false
      }));

      // Submit the form
      await onSubmit(data);
    } catch (error) {
      setValidationState(prev => ({ ...prev, isValidating: false }));
      
      if (options.showToastOnError) {
        const errorResponse = AppwriteErrorHandler.handleError(error as Error);
        showError(errorResponse);
      }
      throw error;
    }
  }, [data, validateForm, options.showToastOnError, showError]);

  const resetForm = useCallback((newData?: Partial<T>) => {
    if (newData) {
      setData(prev => ({ ...prev, ...newData }));
    } else {
      setData(initialData);
    }
    
    setValidationState({
      errors: {},
      isValid: true,
      isValidating: false,
      touchedFields: new Set(),
      hasBeenSubmitted: false
    });

    // Clear any pending debounced validations
    Object.keys(options.validationRules).forEach(fieldName => {
      RealTimeValidator.clearDebounceTimer(fieldName);
    });
  }, [initialData, options.validationRules]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    handleFieldChange(fieldName, value);
  }, [handleFieldChange]);

  const setFieldError = useCallback((fieldName: string, error: string) => {
    const validationError: ValidationError = {
      field: fieldName,
      message: error,
      code: 'CUSTOM_ERROR',
      value: data[fieldName]
    };
    updateFieldValidation(fieldName, [validationError]);
  }, [data, updateFieldValidation]);

  const clearFieldError = useCallback((fieldName: string) => {
    updateFieldValidation(fieldName, []);
  }, [updateFieldValidation]);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    const errors = validationState.errors[fieldName];
    return errors && errors.length > 0 ? errors[0].message : undefined;
  }, [validationState.errors]);

  const isFieldTouched = useCallback((fieldName: string): boolean => {
    return validationState.touchedFields.has(fieldName);
  }, [validationState.touchedFields]);

  const shouldShowFieldError = useCallback((fieldName: string): boolean => {
    return (
      validationState.hasBeenSubmitted || 
      isFieldTouched(fieldName)
    ) && !!getFieldError(fieldName);
  }, [validationState.hasBeenSubmitted, isFieldTouched, getFieldError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(options.validationRules).forEach(fieldName => {
        RealTimeValidator.clearDebounceTimer(fieldName);
      });
    };
  }, [options.validationRules]);

  return {
    // Data
    data,
    
    // Validation state
    errors: validationState.errors,
    isValid: validationState.isValid,
    isValidating: validationState.isValidating,
    hasBeenSubmitted: validationState.hasBeenSubmitted,
    
    // Field helpers
    setFieldValue,
    setFieldError,
    clearFieldError,
    getFieldError,
    isFieldTouched,
    shouldShowFieldError,
    
    // Event handlers
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    
    // Form actions
    resetForm,
    validateForm: () => validateForm(data),
    validateField
  };
}

// Specialized hooks for common forms
export function useProfileValidation(initialData: any) {
  return useFormValidation(initialData, {
    validationRules: {
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
      district: { required: true, minLength: 2 },
      block: { required: true, minLength: 2 },
      education: { required: true, minLength: 2 },
      occupation: { required: true, minLength: 2 },
      sect: {
        required: true,
        custom: (value) => {
          if (!['Sunni', 'Shia', 'Other'].includes(value)) {
            return 'Sect must be Sunni, Shia, or Other';
          }
          return null;
        }
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceDelay: 300,
    showToastOnError: true
  });
}

export function useAuthValidation(initialData: any, type: 'login' | 'register') {
  const rules: FieldValidation = {
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
    rules.name = {
      required: true,
      minLength: 2,
      maxLength: 50
    };
    rules.confirmPassword = {
      required: true,
      custom: (value) => {
        if (value !== initialData.password) {
          return 'Passwords do not match';
        }
        return null;
      }
    };
  }

  return useFormValidation(initialData, {
    validationRules: rules,
    validateOnChange: true,
    validateOnBlur: true,
    debounceDelay: 300,
    showToastOnError: true
  });
}