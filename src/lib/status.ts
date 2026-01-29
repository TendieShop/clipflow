/**
 * Status Definitions - Centralized status enums for the project
 * 
 * All status values must be defined here. This ensures:
 * - Consistent status usage across the codebase
 * - Easy updates (change in one place)
 * - Type safety with TypeScript
 */

// Ticket status values
export const TICKET_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  PENDING: 'pending',
  DONE: 'done',
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

// Project status values
export const PROJECT_STATUS = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// Priority values
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

// Column configuration for Kanban-style UI
export const COLUMN_CONFIG: Record<string, {
  label: string;
  color: string;
  statusValues: TicketStatus[];
}> = {
  [TICKET_STATUS.TODO]: {
    label: 'To Do',
    color: 'gray',
    statusValues: [TICKET_STATUS.TODO],
  },
  [TICKET_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'blue',
    statusValues: [TICKET_STATUS.IN_PROGRESS],
  },
  [TICKET_STATUS.PENDING]: {
    label: 'Backlog',
    color: 'yellow',
    statusValues: [TICKET_STATUS.PENDING],
  },
};

// Status values that should appear in columns (exclude DONE)
export const VISIBLE_STATUSES: TicketStatus[] = [
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.PENDING,
];

// Status values that indicate work is in progress
export const ACTIVE_STATUSES: TicketStatus[] = [
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.PENDING,
];

// Helper to get status badge variant
export function getStatusBadgeVariant(status: TicketStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case TICKET_STATUS.DONE:
      return 'default';
    case TICKET_STATUS.IN_PROGRESS:
      return 'outline';
    case TICKET_STATUS.PENDING:
      return 'secondary';
    case TICKET_STATUS.TODO:
      return 'secondary';
    default:
      return 'secondary';
  }
}

// Helper to get priority badge variant
export function getPriorityBadgeVariant(priority: Priority): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (priority) {
    case PRIORITY.HIGH:
      return 'destructive';
    case PRIORITY.MEDIUM:
      return 'default';
    case PRIORITY.LOW:
      return 'secondary';
    default:
      return 'secondary';
  }
}

// Format status for display
export function formatStatus(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Format priority for display
export function formatPriority(priority: Priority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

// Validate status is defined
export function isValidStatus(value: string): value is TicketStatus {
  return Object.values(TICKET_STATUS).includes(value as TicketStatus);
}

// Validate priority is defined
export function isValidPriority(value: string): value is Priority {
  return Object.values(PRIORITY).includes(value as Priority);
}

export default {
  TICKET_STATUS,
  PROJECT_STATUS,
  PRIORITY,
  COLUMN_CONFIG,
  VISIBLE_STATUSES,
  ACTIVE_STATUSES,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
  formatStatus,
  formatPriority,
  isValidStatus,
  isValidPriority,
};
