import { inspect } from 'node:util';

import { customerService } from '@/lib/api/services/customerSupportService';
import { getAuthHeader } from '@/lib/api/utils/auth';
import type { User } from '@/lib/types/auth';

/**
 * Upserts a customer (creates if doesn't exist, updates if exists)
 * @param user - User object with email and name
 * @returns Customer object if successful, null if failed
 */
export async function upsertCustomer(user: User) {
  if (!user?.email) {
    console.error('User email is missing');
    return null;
  }

  try {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      console.error('No auth header available');
      return null;
    }

    const upsertCustomerRes = await customerService.upsertCustomer(authHeader, {
      email: user.email,
      fullName: user.name || user.email,
      isVerified: true,
    });

    if (upsertCustomerRes.error) {
      console.error(
        'Customer upsert error:',
        inspect(upsertCustomerRes.error, {
          showHidden: false,
          depth: null,
          colors: true,
        })
      );
      return null;
    }

    if (!upsertCustomerRes.data) {
      console.error('No customer data returned from upsert operation');
      return null;
    }

    return {
      id: upsertCustomerRes.data.id,
      fullName: upsertCustomerRes.data.fullName,
    };
  } catch (error) {
    console.error('Error in upsertCustomer:', error);
    return null;
  }
}
