"use client";

export type ClientStage = "prospect" | "active" | "pending";

export interface AddClientPayload {
  firstName: string;
  lastName: string;
  stage: ClientStage;
  email?: string;
  phone?: string;
  address?: string;
  dob?: string;
  last4Ssn?: string;
  tags?: string[];
  source?: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  email?: string;
  emailMasked?: string;
  phone?: string;
  phoneMasked?: string;
  address?: string;
  dob?: string;
  last4Ssn?: string;
  last4SsnMasked?: string;
  source?: string;
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

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const sanitizePhone = (value: string) => value.replace(/\D+/g, "");

const maskEmail = (value?: string) => {
  if (!value) return undefined;
  const [local, domain] = value.split("@");
  if (!domain) {
    return "***";
  }
  const visible = local.slice(0, 1);
  const maskedLocal = `${visible || "*"}${"*".repeat(Math.max(local.length - 1, 2))}`;
  return `${maskedLocal}@${domain}`;
};

const maskPhone = (value?: string) => {
  if (!value) return undefined;
  const digits = sanitizePhone(value);
  if (digits.length < 4) {
    return "***";
  }
  const lastFour = digits.slice(-4);
  return `(***) ***-${lastFour}`;
};

const maskLast4 = (value?: string) => {
  if (!value) return undefined;
  const digits = value.replace(/\D+/g, "");
  if (digits.length !== 4) return undefined;
  return `***-${digits}`;
};

export const SAMPLE_CLIENTS: ClientRecord[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    emailMasked: maskEmail("sarah.j@email.com"),
    phone: sanitizePhone("+1 (555) 012-3000"),
    phoneMasked: maskPhone("+1 (555) 012-3000"),
    address: "123 Main St, Atlanta, GA",
    dob: "1990-04-15",
    last4Ssn: "1234",
    last4SsnMasked: maskLast4("1234"),
    source: "Website",
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
    emailMasked: maskEmail("m.brown@email.com"),
    phone: sanitizePhone("+1 (555) 012-4000"),
    phoneMasked: maskPhone("+1 (555) 012-4000"),
    address: "56 Peachtree Rd, Atlanta, GA",
    dob: "1988-09-02",
    last4Ssn: "9876",
    last4SsnMasked: maskLast4("9876"),
    source: "Referral",
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
    emailMasked: maskEmail("jen.davis@email.com"),
    phone: sanitizePhone("+1 (555) 012-5000"),
    phoneMasked: maskPhone("+1 (555) 012-5000"),
    address: "89 Edgewood Ave, Atlanta, GA",
    dob: "1992-01-10",
    last4Ssn: "4321",
    last4SsnMasked: maskLast4("4321"),
    source: "Event",
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

const ensureContactIsUnique = (payload: AddClientPayload, roster: ClientRecord[]) => {
  const email = payload.email ? normalizeEmail(payload.email) : null;
  const phone = payload.phone ? sanitizePhone(payload.phone) : null;

  if (email) {
    const duplicateEmail = roster.some((client) => client.email && normalizeEmail(client.email) === email);
    if (duplicateEmail) {
      throw new Error("A client with this email already exists.");
    }
  }

  if (phone) {
    const duplicatePhone = roster.some((client) => client.phone && sanitizePhone(client.phone) === phone);
    if (duplicatePhone) {
      throw new Error("A client with this phone number already exists.");
    }
  }
};

const mergeTags = (stageTags: string[], extraTags?: string[]) => {
  const set = new Set(stageTags);
  if (extraTags) {
    extraTags.map((tag) => tag.trim()).filter(Boolean).forEach((tag) => set.add(tag));
  }
  return Array.from(set);
};

export const createClientRecord = (payload: AddClientPayload): ClientRecord => {
  const meta = STAGE_META[payload.stage];
  const now = new Date();
  const email = payload.email?.trim();
  const phoneDigits = payload.phone ? sanitizePhone(payload.phone) : undefined;
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();

  return {
    id: generateClientId(),
    name: fullName,
    email: email || undefined,
    emailMasked: maskEmail(email || undefined),
    phone: phoneDigits || undefined,
    phoneMasked: maskPhone(phoneDigits),
    address: payload.address?.trim() || undefined,
    dob: payload.dob || undefined,
    last4Ssn: payload.last4Ssn || undefined,
    last4SsnMasked: maskLast4(payload.last4Ssn),
    source: payload.source?.trim() || undefined,
    stage: meta.stage,
    joinDate: now.toISOString().slice(0, 10),
    lastActivity: "Just now",
    status: meta.status,
    tags: mergeTags(meta.tags, payload.tags),
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
  const first = payload.firstName?.trim();
  const last = payload.lastName?.trim();
  const email = payload.email?.trim();
  const phone = payload.phone?.trim();

  if (!first || !last) {
    throw new Error("First name and last name are required.");
  }

  if (!email && !phone) {
    throw new Error("Provide at least an email or phone number.");
  }

  const roster = getClientRoster();
  ensureContactIsUnique(payload, roster);

  const record = createClientRecord({
    ...payload,
    firstName: first,
    lastName: last,
    email: email || undefined,
    phone: phone || undefined,
    address: payload.address?.trim() || undefined,
    dob: payload.dob || undefined,
    last4Ssn: payload.last4Ssn?.trim() || undefined,
    tags: payload.tags,
    source: payload.source?.trim() || undefined,
  });

  if (typeof window === "undefined") {
    return record;
  }

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