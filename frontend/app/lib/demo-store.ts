import type { AuthUser, UserRole } from "@/app/types/auth";
import type { Ticket } from "@/app/types/ticket";

const SESSION_KEY = "resolvedesk.demo.session";
const TICKETS_KEY = "resolvedesk.demo.tickets";
export const SESSION_EVENT = "resolvedesk:session-changed";
export const TICKETS_EVENT = "resolvedesk:tickets-changed";

export const DEMO_ACCOUNTS: AuthUser[] = [
  {
    id: "demo-user",
    name: "Demo User",
    email: "user@demo.resolvedesk.local",
    role: "USER",
  },
  {
    id: "demo-employee",
    name: "Demo Employee",
    email: "employee@demo.resolvedesk.local",
    role: "ENGINEER",
  },
  {
    id: "demo-admin",
    name: "Demo Admin",
    email: "admin@demo.resolvedesk.local",
    role: "ADMIN",
  },
];

export function getDemoAccount(role: UserRole) {
  const account = DEMO_ACCOUNTS.find((item) => item.role === role);
  if (!account) throw new Error(`No demo account configured for ${role}.`);
  return account;
}

export function getDemoSession(): AuthUser | null {
  const value = window.localStorage.getItem(SESSION_KEY);
  return value ? (JSON.parse(value) as AuthUser) : null;
}

export function setDemoSession(user: AuthUser) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearDemoSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getDemoTickets(): Ticket[] {
  const value = window.localStorage.getItem(TICKETS_KEY);
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved demo ticket data is invalid.");
  }
  return parsed as Ticket[];
}

export function saveDemoTickets(tickets: Ticket[]) {
  window.localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new Event(TICKETS_EVENT));
}
