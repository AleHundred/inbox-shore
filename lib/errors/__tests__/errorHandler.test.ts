import { AppError, ErrorCategory } from '@/lib/utils/AppError';

/**
 * Tests for the ErrorHandler class
 * These tests validate error transformation and handling across the application
 */
describe('Error Handling Core Functionality', () => {
  /**
   * Tests AppError construction and basic functionality
   * This validates the foundation of our error handling system
   */
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', {
      category: ErrorCategory.AUTH,
      userMessage: 'Please log in again',
    });

    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Test error');
    expect(error.category).toBe(ErrorCategory.AUTH);
    expect(error.userMessage).toBe('Please log in again');
  });

  /**
   * Tests AppError static factory methods
   * These are the primary ways errors get created in the application
   */
  it('should create auth errors using static factory', () => {
    const authError = AppError.auth('Authentication failed');

    expect(authError.category).toBe(ErrorCategory.AUTH);
    expect(authError.message).toBe('Authentication failed');
    expect(authError).toBeInstanceOf(AppError);
  });

  /**
   * Tests AppError validation factory
   * Validates creation of validation errors for forms and input
   */
  it('should create validation errors using static factory', () => {
    const validationError = AppError.validation('Invalid input');

    expect(validationError.category).toBe(ErrorCategory.VALIDATION);
    expect(validationError.message).toBe('Invalid input');
    expect(validationError).toBeInstanceOf(AppError);
  });

  /**
   * Tests error serialization
   * Important for logging and debugging
   */
  it('should serialize errors to JSON correctly', () => {
    const error = new AppError('Test error', {
      category: ErrorCategory.NETWORK,
      metadata: { requestId: '123' },
    });

    const serialized = error.toJSON();

    expect(serialized['message']).toBe('Test error');
    expect(serialized['category']).toBe(ErrorCategory.NETWORK);
    expect(serialized['metadata']).toEqual({ requestId: '123' });
  });
});
