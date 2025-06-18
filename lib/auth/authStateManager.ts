/**
 * Manages authentication initialization state to prevent race conditions
 * Uses a singleton pattern with proper cleanup and promise management
 */
class AuthStateManager {
  private static instance: AuthStateManager;
  private initializationPromise: Promise<void> | null = null;
  private abortController: AbortController | null = null;

  private constructor() {}

  /**
   * Gets the singleton instance of AuthStateManager
   */
  static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }

  /**
   * Initializes authentication state with race condition protection
   * Returns existing promise if initialization is already in progress
   */
  async initialize(callback: (signal: AbortSignal) => Promise<void>): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.abortController = new AbortController();

    this.initializationPromise = callback(this.abortController.signal).finally(() => {
      this.initializationPromise = null;
      this.abortController = null;
    });

    return this.initializationPromise;
  }

  /**
   * Checks if initialization is currently in progress
   */
  isInitializing(): boolean {
    return this.initializationPromise !== null;
  }

  /**
   * Cancels any ongoing initialization
   */
  cancelInitialization(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.initializationPromise = null;
  }

  /**
   * Resets the manager state for fresh initialization
   */
  reset(): void {
    this.cancelInitialization();
  }
}

export const authStateManager = AuthStateManager.getInstance();
