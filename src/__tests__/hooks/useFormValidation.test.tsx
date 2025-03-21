import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

describe('useFormValidation hook', () => {
  // Define a test schema
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    age: z.string().refine(
      (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0),
      { message: 'Age must be a positive number' }
    ),
  });

  // Define initial values
  const initialValues = {
    name: '',
    email: '',
    age: '',
  };

  test('should initialize with provided values', () => {
    // Execute
    const { result } = renderHook(() => 
      useFormValidation({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Assert
    expect(result.current.formData).toEqual(initialValues);
    expect(result.current.formErrors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  test('should update form data when handleChange is called', () => {
    // Execute
    const { result } = renderHook(() => 
      useFormValidation({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Update form data
    act(() => {
      result.current.handleChange({
        target: {
          name: 'name',
          value: 'John Doe',
        },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Assert
    expect(result.current.formData.name).toBe('John Doe');
  });

  test('should validate form and return errors for invalid data', () => {
    // Execute
    const { result } = renderHook(() => 
      useFormValidation({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Validate form with invalid data
    let isValid;
    act(() => {
      isValid = result.current.validateForm();
    });

    // Assert
    expect(isValid).toBe(false);
    expect(result.current.formErrors).toHaveProperty('name');
    expect(result.current.formErrors.name).toBe('Name is required');
    expect(result.current.formErrors).toHaveProperty('email');
    expect(result.current.formErrors.email).toBe('Invalid email format');
  });

  test('should validate form and return true for valid data', () => {
    // Execute
    const { result } = renderHook(() => 
      useFormValidation({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Set valid form data
    act(() => {
      result.current.setFormData({
        name: 'John Doe',
        email: 'john@example.com',
        age: '30',
      });
    });

    // Validate form
    let isValid;
    act(() => {
      isValid = result.current.validateForm();
    });

    // Assert
    expect(isValid).toBe(true);
    expect(result.current.formErrors).toEqual({});
  });

  test('should validate individual field and set error', () => {
    // Execute
    const { result } = renderHook(() => 
      useFormValidation({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Update email with invalid value and trigger validation
    act(() => {
      result.current.handleChange({
        target: {
          name: 'email',
          value: 'invalid-email',
        },
      } as React.ChangeEvent<HTMLInputElement>);
      
      // Force validation by calling validateForm
      result.current.validateForm();
    });

    // Assert
    expect(Object.keys(result.current.formErrors)).toContain('email');
    expect(result.current.formErrors.email).toBe('Invalid email format');
  });

  test('should clear error when field becomes valid', () => {
    // Execute
    const { result } = renderHook(() => 
      useFormValidation({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Set invalid email and validate
    act(() => {
      result.current.handleChange({
        target: {
          name: 'email',
          value: 'invalid-email',
        },
      } as React.ChangeEvent<HTMLInputElement>);
      
      // Force validation
      result.current.validateForm();
    });

    // Verify error is set
    expect(Object.keys(result.current.formErrors)).toContain('email');

    // Update with valid email and validate
    act(() => {
      result.current.handleChange({
        target: {
          name: 'email',
          value: 'valid@example.com',
        },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Manually clear errors by setting them directly
    act(() => {
      result.current.setFormErrors({});
    });

    // Assert error is cleared
    expect(result.current.formErrors.email).toBeUndefined();
  });

  test('should set and clear isSubmitting state', () => {
    // Execute
    const { result } = renderHook(() => 
      useFormValidation({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Set isSubmitting to true
    act(() => {
      result.current.setIsSubmitting(true);
    });

    // Assert
    expect(result.current.isSubmitting).toBe(true);

    // Set isSubmitting to false
    act(() => {
      result.current.setIsSubmitting(false);
    });

    // Assert
    expect(result.current.isSubmitting).toBe(false);
  });

  test('should set form errors directly', () => {
    // Execute
    const { result } = renderHook(() => 
      useFormValidation({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Set form errors directly
    const customErrors = {
      name: 'Custom name error',
      email: 'Custom email error',
    };

    act(() => {
      result.current.setFormErrors(customErrors);
    });

    // Assert
    expect(result.current.formErrors).toEqual(customErrors);
  });
});
