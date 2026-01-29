/**
 * Business Rules - Validation functions for project data
 * 
 * These functions define and validate the business rules for:
 * - Ticket visibility
 * - Project display
 * - Version progress
 */

import { TICKET_STATUS, VISIBLE_STATUSES, type TicketStatus, type Priority } from './status';

// ============================================
// Ticket Rules
// ============================================

/**
 * Ticket should be visible in columns if not done
 */
export function isTicketVisible(status: TicketStatus): boolean {
  return status !== TICKET_STATUS.DONE && VISIBLE_STATUSES.includes(status);
}

/**
 * Ticket is active (being worked on)
 */
export function isTicketActive(status: TicketStatus): boolean {
  return status !== TICKET_STATUS.DONE;
}

/**
 * Ticket is complete
 */
export function isTicketComplete(status: TicketStatus): boolean {
  return status === TICKET_STATUS.DONE;
}

/**
 * Validate ticket has required fields
 */
export function validateTicket(ticket: {
  id: string;
  title: string;
  priority: Priority;
  status: TicketStatus;
  completed: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!ticket.id) errors.push('Ticket must have an id');
  if (!ticket.title) errors.push('Ticket must have a title');
  if (!ticket.priority) errors.push('Ticket must have a priority');
  if (!ticket.status) errors.push('Ticket must have a status');
  
  // Status/completed consistency
  if (ticket.completed && ticket.status !== TICKET_STATUS.DONE) {
    errors.push('completed=true must have status=done');
  }
  if (!ticket.completed && ticket.status === TICKET_STATUS.DONE) {
    errors.push('status=done must have completed=true');
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================
// Version Rules
// ============================================

/**
 * Calculate completed tickets from tickets array
 */
export function calculateCompletedTickets(tickets: { completed: boolean }[]): number {
  return tickets.filter(t => t.completed).length;
}

/**
 * Calculate total tickets from tickets array
 */
export function calculateTotalTickets(tickets: unknown[]): number {
  return tickets.length;
}

/**
 * Version is 100% complete
 */
export function isVersionComplete(completedTickets: number, totalTickets: number): boolean {
  return totalTickets > 0 && completedTickets === totalTickets;
}

/**
 * Version should show progress bar (not fully complete)
 */
export function shouldShowProgress(completedTickets: number, totalTickets: number): boolean {
  return completedTickets < totalTickets;
}

/**
 * Validate version data integrity
 */
export function validateVersion(version: {
  version: string;
  tickets: { completed: boolean; status: TicketStatus }[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!version.version) errors.push('Version must have a version string');
  
  if (version.tickets.length > 0) {
    // All tickets should have valid statuses
    version.tickets.forEach((ticket, idx) => {
      if (!isValidStatus(ticket.status)) {
        errors.push(`Ticket ${idx} has invalid status: ${ticket.status}`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================
// Project Rules
// ============================================

/**
 * Project should appear in project list
 * (Even if it has no tickets, unless 100% complete)
 */
export function shouldShowInProjectList(project: {
  versions: { tickets: { completed: boolean }[] }[];
}): boolean {
  let totalTickets = 0;
  let completedTickets = 0;
  
  for (const version of project.versions) {
    totalTickets += calculateTotalTickets(version.tickets);
    completedTickets += calculateCompletedTickets(version.tickets);
  }
  
  return completedTickets < totalTickets;
}

/**
 * Project has any incomplete tickets
 */
export function hasIncompleteTickets(project: {
  versions: { tickets: { completed: boolean }[] }[];
}): boolean {
  for (const version of project.versions) {
    for (const ticket of version.tickets) {
      if (!ticket.completed) return true;
    }
  }
  return false;
}

/**
 * Get next ticket to work on (first incomplete by priority, then version)
 */
export function getNextTicket<T extends {
  priority: Priority;
  status: TicketStatus;
  completed: boolean;
}>(project: {
  versions: { version: string; tickets: T[] }[];
}): { ticket: T; version: string } | null {
  for (const version of project.versions) {
    for (const ticket of version.tickets) {
      if (!ticket.completed && ticket.status !== TICKET_STATUS.DONE) {
        return { ticket, version: version.version };
      }
    }
  }
  
  return null;
}

// ============================================
// Project Data File Rules
// ============================================

/**
 * project-data.json should NOT contain derived fields
 * These should be calculated from tickets array
 */
export function validateProjectDataFile(data: {
  versions: {
    version: string;
    completedTickets?: number;
    totalTickets?: number;
    tickets: { completed: boolean }[];
  }[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const version of data.versions || []) {
    // Check for derived fields
    if (version.completedTickets !== undefined) {
      const actual = calculateCompletedTickets(version.tickets);
      if (version.completedTickets !== actual) {
        errors.push(`${version.version}: completedTickets=${version.completedTickets} doesn't match actual=${actual} (remove derived field)`);
      }
    }
    
    if (version.totalTickets !== undefined) {
      const actual = calculateTotalTickets(version.tickets);
      if (version.totalTickets !== actual) {
        errors.push(`${version.version}: totalTickets=${version.totalTickets} doesn't match actual=${actual} (remove derived field)`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================
// Validation Helpers
// ============================================

function isValidStatus(value: string): value is TicketStatus {
  return Object.values(TICKET_STATUS).includes(value as TicketStatus);
}

export default {
  // Ticket
  isTicketVisible,
  isTicketActive,
  isTicketComplete,
  validateTicket,
  
  // Version
  calculateCompletedTickets,
  calculateTotalTickets,
  isVersionComplete,
  shouldShowProgress,
  validateVersion,
  
  // Project
  shouldShowInProjectList,
  hasIncompleteTickets,
  getNextTicket,
  
  // Project Data
  validateProjectDataFile,
};
