/**
 * In-memory token storage for client-side authentication
 * This provides a secure way to store the JWT token in memory
 */
class TokenStore {
  private token: string | null = null;
  private static instance: TokenStore;

  private constructor() {}

  /**
   * Gets the singleton instance of TokenStore
   */
  static getInstance(): TokenStore {
    if (!TokenStore.instance) {
      TokenStore.instance = new TokenStore();
    }
    return TokenStore.instance;
  }

  /**
   * Sets the authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Gets the authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clears the authentication token
   */
  clearToken(): void {
    this.token = null;
  }
}

export const tokenStore = TokenStore.getInstance();
