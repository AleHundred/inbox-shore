import '@testing-library/jest-dom';

/**
 * Enhanced test setup for InboxShore with careful module mocking
 *
 * The principle here is to mock only what we absolutely need at the global level,
 * and to be defensive about modules that might not be resolvable during setup.
 * This approach prevents setup failures while still providing the mocks we need.
 */

/**
 * Polyfill for Request and Response APIs needed by Next.js
 *
 * These are web standards that Node.js doesn't have by default, but Next.js API routes
 * expect them to be available. We create minimal implementations that provide just
 * enough functionality for our tests to run successfully.
 */
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

/**
 * Mock Next.js Image component
 *
 * This is safe to mock globally because Next.js Image is always available
 * when Next.js is installed, which it is in our project.
 */
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

/**
 * Mock Lucide React icons
 *
 * Icon libraries are external dependencies that are safe to mock globally
 * because they're listed in package.json and always available.
 */
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid='chevron-left' />,
  ChevronRight: () => <span data-testid='chevron-right' />,
  Search: () => <span data-testid='search-icon' />,
  User: () => <span data-testid='user-icon' />,
  LogOut: () => <span data-testid='logout-icon' />,
}));

/**
 * Mock Sonner toast library
 *
 * External dependencies like toast libraries are safe to mock globally
 * since they're always available through package.json.
 */
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

/**
 * Global fetch mock setup
 *
 * Fetch is a web API that's safe to mock globally because it's either
 * provided by the environment or polyfilled by Next.js.
 */
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
);

/**
 * Test environment setup that runs before each test
 *
 * This ensures each test starts with a clean environment and consistent configuration.
 */
beforeEach(() => {
  // Set consistent environment variables for all tests
  process.env.NEXT_PUBLIC_USE_MOCK_API = 'true';
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
  process.env.NODE_ENV = 'test';

  // Clear all mock function calls and instances
  jest.clearAllMocks();
});

/**
 * Global error handler for unhandled promise rejections
 */
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection in tests:', error);
});
