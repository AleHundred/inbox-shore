/**
 * Centralized type exports
 * This file serves as the single entry point for all type definitions
 */

export * from './api';
export * from './entities';
export * from './auth';
export * from './ui';

export type {
  Customer as CustomerPartsFragment,
  RequestSummary as RequestPartsFragment,
} from './api';

export type { UpsertCustomerParams as SupportUpsertCustomerParams } from './support';
