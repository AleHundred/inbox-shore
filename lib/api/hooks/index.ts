/**
 * This file re-exports hooks from the centralized hooks directory to maintain backward compatibility
 * IMPORTANT: All new code should import hooks directly from '@/lib/hooks' instead of '@/lib/api/hooks'
 *
 * This approach allows us to consolidate our hooks in a single location while avoiding breaking changes
 */

export * from './useApi';

export { useRequests, useRequestDetail, useSendReply } from '@/lib/hooks';

export * from './useCustomers';

export { useCreateRequest, useSendReplyLegacy } from './useMutations';
