"use client";

export type ClientStage = "prospect" | "active" | "pending";

export interface AddClientPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stage: ClientStage;
}

export interface ClientRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  joinDate: string;
  lastActivity: string;
  status: "active" | "inactive" | "pending";
  tags: string[];
  disputes: number;
  tasks: number;
  documents?: number;
}

const CLIENT_STORAGE_KEY = "credkit:clients";
const CLIENTS_EVENT = "credkit:clients-updated";

const STAGE_META: Record<ClientStage, { stage: string; status: ClientRecord["status"]; tags: string[] }> = {
  prospect: { stage: "Prospect", status: "pending", tags: ["Prospect"] },
  active: { stage: "Active Client", status: "active", tags: ["New Client"] },
  pending: { stage: "Pending Review", status: "pending", tags: ["Pending"] },
};

const fallbackId = () => `client-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const generateClientId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return fallbackId();
};

export const SAMPLE_CLIENTS: ClientRecord[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 0123",
    stage: "Active Client",
    joinDate: "2024-01-15",
    lastActivity: "2 hours ago",
    status: "active",
    tags: ["VIP", "High Priority"],
    disputes: 3,
    tasks: 2,
    documents: 12,
  },
  {
    id: "2",
    name: "Michael Brown",
    email: "m.brown@email.com",
    phone: "+1 (555) 0124",
    stage: "Prospect",
    joinDate: "2024-01-20",
    lastActivity: "1 day ago",
    status: "pending",
    tags: ["New Client"],
    disputes: 1,
    tasks: 1,
    documents: 4,
  },
  {
    id: "3",
    name: "Jennifer Davis",
    email: "jen.davis@email.com",
    phone: "+1 (555) 0125",
    stage: "Active Client",
    joinDate: "2024-01-10",
    lastActivity: "3 hours ago",
    status: "active",
    tags: ["Referral"],
    disputes: 5,
    tasks: 3,
    documents: 10,
  },
];

const parseStoredClients = (raw: string | null): ClientRecord[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as ClientRecord[];
    }
  } catch (error) {
    console.warn("Failed to parse stored clients", error);
  }
  return null;
};

const persistRoster = (clients: ClientRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(clients));
  window.dispatchEvent(new CustomEvent<ClientRecord[]>(CLIENTS_EVENT, { detail: clients }));
};

export const createClientRecord = (payload: AddClientPayload): ClientRecord => {
  const meta = STAGE_META[payload.stage];
  const now = new Date();
  const fullName = `${payload.firstName} ${payload.lastName}`.trim() || payload.email;

  return {
    id: generateClientId(),
    name: fullName,
    email: payload.email.trim(),
    phone: payload.phone?.trim() || "Not provided",
    stage: meta.stage,
    joinDate: now.toISOString().slice(0, 10),
    lastActivity: "Just now",
    status: meta.status,
    tags: meta.tags,
    disputes: 0,
    tasks: 0,
    documents: 0,
  };
};

export const getClientRoster = (): ClientRecord[] => {
  if (typeof window === "undefined") {
    return SAMPLE_CLIENTS;
  }
  const stored = parseStoredClients(window.localStorage.getItem(CLIENT_STORAGE_KEY));
  return stored && stored.length ? stored : SAMPLE_CLIENTS;
};

export const addClient = (payload: AddClientPayload): ClientRecord => {
  const record = createClientRecord(payload);
  if (typeof window === "undefined") {
    return record;
  }
  const roster = getClientRoster();
  const deduped = roster.filter((existing) => existing.id !== record.id);
  const next = [record, ...deduped];
  persistRoster(next);
  return record;
};

export const subscribeToClientRoster = (callback: (clients: ClientRecord[]) => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const handler = (event: Event) => {
    if (event instanceof CustomEvent && Array.isArray(event.detail)) {
      callback(event.detail as ClientRecord[]);
    } else {
      callback(getClientRoster());
    }
  };
  window.addEventListener(CLIENTS_EVENT, handler as EventListener);
  return () => window.removeEventListener(CLIENTS_EVENT, handler as EventListener);
};
