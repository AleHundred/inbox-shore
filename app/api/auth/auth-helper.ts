import fs from 'fs';
import path from 'path';

import type { NextRequest } from 'next/server';

import { ErrorHandler } from '@/lib/errors/errorHandler';
import type { User } from '@/lib/types/auth';
import { ErrorCategory } from '@/lib/utils/AppError';

import { getCurrentUserId, verifyAuthToken } from './token-service';

const USERS_FILE = path.join(process.cwd(), 'server/data/users.json');

/**
 * Reads users from the JSON file
 * This function provides the user data needed for authentication
 * @returns Array of users from the JSON file
 */
function getUsers(): User[] {
  try {
    const usersData = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(usersData);
  } catch (error) {
    ErrorHandler.handle(error, {
      context: 'AuthHelper.getUsers',
      showToast: false,
      metadata: { category: ErrorCategory.SERVER },
    });
    return [];
  }
}

/**
 * Gets the current authenticated user from cookies
 * This is used in server-side contexts where we have access to cookies()
 * @returns User object if authenticated, null otherwise
 */
export function getCurrentUser(): User | null {
  try {
    const userId = getCurrentUserId();

    if (!userId) {
      return null;
    }

    const users = getUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    ErrorHandler.handle(error, {
      context: 'AuthHelper.getCurrentUser',
      showToast: false,
      metadata: { category: ErrorCategory.AUTH },
    });
    return null;
  }
}

/**
 * Authenticates a user from a request object
 * This works with both Request and NextRequest types and handles both cookie and header authentication
 * @param request - The request object (can be Request or NextRequest)
 * @returns User object if authenticated, null otherwise
 */
export function authUser(request: Request | NextRequest): User | null {
  try {
    let authToken: string | null = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    if (!authToken) {
      let cookieHeader: string | null = null;

      if ('cookies' in request) {
        authToken = request.cookies.get('auth-token')?.value || null;
      } else {
        cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
          const authTokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
          authToken = authTokenMatch?.[1] || null;
        }
      }
    }

    if (!authToken) {
      return null;
    }

    const payload = verifyAuthToken(authToken);
    if (!payload?.userId) {
      return null;
    }

    const users = getUsers();
    const user = users.find((u) => u.id === payload.userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    ErrorHandler.handle(error, {
      context: 'AuthHelper.authUser',
      showToast: false,
      metadata: { category: ErrorCategory.AUTH },
    });
    return null;
  }
}
