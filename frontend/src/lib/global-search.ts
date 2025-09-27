import { SAMPLE_CLIENTS } from "@/lib/client-directory";

export type SearchCategory =
  | "Clients"
  | "Tasks"
  | "Disputes"
  | "Letters"
  | "Templates"
  | "Users";

export interface SearchItem {
  id: string;
  title: string;
  description?: string;
  href: string;
  badge?: string;
  keywords?: string[];
}

export interface SearchGroup {
  category: SearchCategory;
  items: SearchItem[];
}

const RECENT_SEARCH_KEY = "credkit:recent-searches";
const MAX_RECENT = 8;
const MAX_RESULTS_PER_CATEGORY = 5;

const taskResults: SearchItem[] = [
  {
    id: "task-1",
    title: "Review credit report for Sarah Johnson",
    description: "Due Jan 25 - In Progress",
    href: "/tasks/task-1",
    keywords: ["credit report", "Sarah Johnson", "analysis"],
  },
  {
    id: "task-2",
    title: "Prepare dispute letters for Michael Brown",
    description: "Due Jan 28 - To Do",
    href: "/tasks/task-2",
    keywords: ["letters", "Michael Brown"],
  },
  {
    id: "task-3",
    title: "Follow up with Jennifer Davis",
    description: "Due Jan 24 - Urgent",
    href: "/tasks/task-3",
    keywords: ["follow up", "Jennifer Davis"],
  },
  {
    id: "task-4",
    title: "Send welcome package to David Wilson",
    description: "Completed - Onboarding",
    href: "/tasks/task-4",
    keywords: ["welcome", "David Wilson"],
  },
];

const disputeResults: SearchItem[] = [
  {
    id: "1",
    title: "Dispute late payment - Capital One",
    description: "Client: Sarah Johnson - Experian",
    href: "/disputes/1",
    keywords: ["late payment", "capital one", "experian", "sarah"],
  },
  {
    id: "2",
    title: "Remove collection account - ABC Collections",
    description: "Client: Michael Brown - Equifax",
    href: "/disputes/2",
    keywords: ["collection", "abc", "equifax", "michael"],
  },
  {
    id: "3",
    title: "Challenge account balance - Chase Bank",
    description: "Client: Jennifer Davis - TransUnion",
    href: "/disputes/3",
    keywords: ["account balance", "chase", "transunion", "jennifer"],
  },
];

const letterResults: SearchItem[] = [
  {
    id: "101",
    title: "Dispute Letter - Capital One",
    description: "PDF - 156 KB",
    href: "/letters/101",
    keywords: ["capital one", "dispute letter"],
  },
  {
    id: "102",
    title: "Debt Validation Letter - ABC Collections",
    description: "DOCX - 98 KB",
    href: "/letters/102",
    keywords: ["debt", "validation", "abc"],
  },
];

const templateResults: SearchItem[] = [
  {
    id: "template-1",
    title: "Square 1:1 social media marketing",
    description: "Natural-light food photography",
    href: "/templates/template-1",
    keywords: ["social media", "food", "marketing"],
  },
  {
    id: "template-2",
    title: "AI social media hero image",
    description: "Catalog-ready treat showcase",
    href: "/templates/template-2",
    keywords: ["ai", "hero", "treat"],
  },
];

const userResults: SearchItem[] = [
  {
    id: "user-1",
    title: "Monica Reed",
    description: "Administrator - monica@credkitcrm.com",
    href: "/settings/profile",
    keywords: ["admin", "monica", "reed"],
  },
  {
    id: "user-2",
    title: "John Agent",
    description: "Credit Specialist - john@credkitcrm.com",
    href: "/settings/profile",
    keywords: ["agent", "john"],
  },
];

const clientResults: SearchItem[] = SAMPLE_CLIENTS.map((client) => ({
  id: client.id,
  title: client.name,
  description: `${client.emailMasked ?? client.email ?? "Contact hidden"} - ${client.stage}`,
  href: `/clients/${client.id}`,
  keywords: [
    client.email,
    client.emailMasked,
    client.phone,
    client.phoneMasked,
    client.stage,
    ...(client.tags ?? []),
  ].filter(Boolean) as string[],
}));

const catalog: Record<SearchCategory, SearchItem[]> = {
  Clients: clientResults,
  Tasks: taskResults,
  Disputes: disputeResults,
  Letters: letterResults,
  Templates: templateResults,
  Users: userResults,
};

const CATEGORIES: SearchCategory[] = [
  "Clients",
  "Tasks",
  "Disputes",
  "Letters",
  "Templates",
  "Users",
];

const normalize = (value: string) => value.trim().toLowerCase();

const matchesTerm = (item: SearchItem, term: string) => {
  const haystacks = [item.title, item.description, ...(item.keywords ?? [])];
  return haystacks.some((haystack) =>
    haystack ? normalize(haystack).includes(term) : false
  );
};

export const getSearchResults = (rawTerm: string): SearchGroup[] => {
  const term = normalize(rawTerm);
  if (!term) {
    return CATEGORIES.map((category) => ({
      category,
      items: catalog[category].slice(0, 3),
    }));
  }

  const groups = CATEGORIES.map((category) => {
    const filtered = catalog[category].filter((item) => matchesTerm(item, term));
    return {
      category,
      items: filtered.slice(0, MAX_RESULTS_PER_CATEGORY),
    };
  }).filter((group) => group.items.length > 0);

  return groups;
};

export const addRecentSearch = (rawTerm: string) => {
  const term = normalize(rawTerm);
  if (!term || typeof window === "undefined") {
    return;
  }

  const existing = window.localStorage.getItem(RECENT_SEARCH_KEY);
  const parsed: string[] = existing ? JSON.parse(existing) : [];
  const deduped = [term, ...parsed.filter((value) => value !== term)].slice(0, MAX_RECENT);
  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(deduped));
};

export const getRecentSearches = (): string[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const existing = window.localStorage.getItem(RECENT_SEARCH_KEY);
  if (!existing) {
    return [];
  }
  try {
    const parsed = JSON.parse(existing);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (error) {
    console.warn("Failed to parse recent searches", error);
    return [];
  }
};
export const TASK_SEARCH_ITEMS = taskResults;
export const DISPUTE_SEARCH_ITEMS = disputeResults;
export const LETTER_SEARCH_ITEMS = letterResults;
export const TEMPLATE_SEARCH_ITEMS = templateResults;
export const USER_SEARCH_ITEMS = userResults;
export const CLIENT_SEARCH_ITEMS = clientResults;


export const buildSearchUrl = (value: string) =>
  `/search?q=${encodeURIComponent(value)}` as `/search?q=${string}`;


