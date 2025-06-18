/**
 * Maps numeric priority values to human-readable labels
 * @param priority - Numeric priority value
 * @returns Human-readable priority label
 */
export function getPriority(priority: number): string {
  switch (priority) {
    case 0:
      return 'Low';
    case 1:
      return 'Normal';
    case 2:
      return 'High';
    case 3:
      return 'Urgent';
    default:
      return 'Normal';
  }
}

/**
 * Gets sort order weight for priorities
 * Used for sorting requests by priority
 *
 * @param priority - Numeric priority value
 * @returns Numeric weight for sorting
 */
export function getPriorityWeight(priority: number): number {
  switch (priority) {
    case 3: // Urgent
      return 1000;
    case 2: // High
      return 100;
    case 1: // Normal
      return 10;
    case 0: // Low
      return 1;
    default:
      return 10;
  }
}

/**
 * Gets the CSS color class for a priority
 *
 * @param priority - Numeric priority value
 * @returns Tailwind CSS class name
 */
export function getPriorityColorClass(priority: number): string {
  switch (priority) {
    case 3: // Urgent
      return 'bg-red-500 text-white';
    case 2: // High
      return 'bg-orange-500 text-white';
    case 1: // Normal
      return 'bg-blue-500 text-white';
    case 0: // Low
      return 'bg-green-500 text-white';
    default:
      return 'bg-blue-500 text-white';
  }
}
