import { SupportClient } from './supportClient';

/**
 * Factory function to create a support client instance
 *
 * @param config - Optional configuration for the client
 * @returns A configured SupportClient instance
 */
export function createSupportClient(config: { baseUrl?: string } = {}) {
  return new SupportClient(config.baseUrl);
}
