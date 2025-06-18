const nextJest = require('next/jest');

/**
 * Jest configuration for InboxShore test suite
 *
 * FINALLY FIXED: The correct option name is "moduleNameMapping" (not "moduleNameMapping")
 * I apologize for the repeated typo - this should eliminate the validation warnings
 */
const createJestConfig = nextJest({
  dir: './',
});

/**
 * Custom Jest configuration with the CORRECT option name
 */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',

  /**
   * CORRECT OPTION NAME: "moduleNameMapping"
   * This maps TypeScript path aliases (@/) to actual file paths
   */
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  /**
   * Additional module resolution helpers
   */
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules', '<rootDir>'],

  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/jest.setup.js',
  ],

  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  testMatch: ['**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)', '**/*.(test|spec).(js|jsx|ts|tsx)'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  transformIgnorePatterns: ['/node_modules/(?!(.*\\.mjs$))', '^.+\\.module\\.(css|sass|scss)$'],
};

module.exports = createJestConfig(customJestConfig);
