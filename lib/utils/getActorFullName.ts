import type { Actor } from '@/lib/types';

/**
 * Extracts the full name from any actor type
 *
 * @param actor - The actor object from a timeline entry
 * @returns The full name of the actor
 */
export function getActorFullName(actor: Actor | null | undefined): string {
  if (!actor) return 'Unknown';

  switch (actor.type) {
    case 'user':
      return actor.fullName || 'User';

    case 'customer':
      return actor.fullName || 'Customer';

    case 'machine':
      return actor.fullName || 'System';

    case 'unknown':
    default:
      return actor.fullName || actor.name || actor.email?.split('@')[0] || 'Unknown';
  }
}
