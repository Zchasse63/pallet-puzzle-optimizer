import { useState, useCallback } from 'react';
import { z } from 'zod';

interface FormValidationOptions<T> {
  initialValues: T;
  validationSchema: z.ZodType<T>;
}

/**
 * Custom hook for form validation using Zod
 * 
 * @param options - Configuration options including schema and initial values
 * @returns Form state and handlers
 */
export function useFormValidation<T extends Record<string, any>>(options: FormValidationOptions<T>) {
  const { initialValues, validationSchema } = options;
  

  const [formData, setFormData] = useState<T>(initialValues);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  /**
   * Validates the form data against the schema
   * @returns Whether the form is valid
   */
  const validateForm = useCallback((): boolean => {
    try {
      validationSchema.parse(formData);
      setFormErrors({});
      setGeneralError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof T] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  }, [formData, validationSchema]);

  /**
   * Handles input changes and clears related errors
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field-specific error when user types
    if (formErrors[name as keyof T]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear general error when form data changes
    if (generalError) {
      setGeneralError(null);
    }
  }, [formErrors, generalError]);

  /**
   * Sets a specific form value
   */
  const setFormValue = useCallback((name: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field-specific error
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [formErrors]);

  /**
   * Resets the form to initial values
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setFormErrors({});
    setGeneralError(null);
  }, [initialValues]);

  return {
    formData,
    formErrors,
    isSubmitting,
    generalError,
    setFormData,
    setFormErrors,
    setIsSubmitting,
    setGeneralError,
    validateForm,
    handleChange,
    setFormValue,
    resetForm
  };
}

export default useFormValidation;
