import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates required environment variables for production
 */
function validateEnvironment() {
  const requiredVars = ['JWT_SECRET'];
  const missingVars = [];

  if (process.env.NODE_ENV === 'production') {
    requiredVars.forEach((varName) => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables in production: ${missingVars.join(', ')}`
      );
    }
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters long for security');
  }
}

/**
 * Environment configuration with validation
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
};

/**
 * Initialize environment validation
 */
export function initializeEnvironment() {
  try {
    validateEnvironment();
    console.error(`Environment: ${env.NODE_ENV}`);
    console.error(`Port: ${env.PORT}`);
    return env;
  } catch (error) {
    console.error('Environment validation failed:', error.message);
    process.exit(1);
  }
}
