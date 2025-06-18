import { apiClient, HttpMethod } from './services/base/apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
}

/**
 * Fetches a user by their ID from the server API
 * @param userId - The ID of the user to fetch
 * @returns The user object if found, null otherwise
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const response = await apiClient.request<User>(
      HttpMethod.GET,
      `/api/users/${userId}`,
      undefined,
      {
        authHeader: `Bearer ${localStorage.getItem('auth-token')}`,
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}
