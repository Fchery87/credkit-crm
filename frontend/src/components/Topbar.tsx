"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Search as SearchIcon,
  Moon,
  Sun,
  UserPlus,
  ListTodo,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import {
  addRecentSearch,
  getRecentSearches,
  getSearchResults,
  buildSearchUrl,
  type SearchGroup,
  type SearchItem,
} from "@/lib/global-search";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    label: "Add Client",
    description: "Start a new client record",
    href: "/clients?modal=add-client",
    icon: UserPlus,
  },
  {
    label: "Create Task",
    description: "Assign work to your team",
    href: "/tasks?modal=new-task",
    icon: ListTodo,
  },
  {
    label: "New Dispute",
    description: "Generate a dispute workflow",
    href: "/disputes?modal=new-dispute",
    icon: FileText,
  },
] as const;

export default function Topbar() {
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const flatResults = useMemo(() => {
    return groups.flatMap((group) =>
      group.items.map((item) => ({ ...item, category: group.category }))
    );
  }, [groups]);

  useEffect(() => {
    setGroups(getSearchResults(query));
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setRecent(getRecentSearches());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }
    const term = query.trim();
    addRecentSearch(term);
    setRecent(getRecentSearches());
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(buildSearchUrl(term) as any);
  };

  const handleResultSelect = (item: SearchItem) => {
    setIsOpen(false);
    setActiveIndex(-1);
    setQuery("");
    router.push(item.href as any);
  };

  const handleQuickAction = (href: string) => {
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(href as any);
  };

  const handleRecentSelect = (term: string) => {
    const clean = term.trim();
    if (!clean) {
      return;
    }
    setQuery(clean);
    addRecentSearch(clean);
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(buildSearchUrl(clean) as any);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => {
        const next = prev + 1;
        return next >= flatResults.length ? flatResults.length - 1 : next;
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? -1 : prev - 1));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && flatResults[activeIndex]) {
        event.preventDefault();
        handleResultSelect(flatResults[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="w-full flex-1" ref={containerRef}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search clients, tasks, disputes..."
              className="w-full appearance-none bg-background pl-8 pr-3 shadow-none h-9 px-3 py-1 text-sm border rounded-md focus-visible:border-primary focus-visible:outline-none"
              aria-autocomplete="list"
              aria-expanded={isOpen}
            />
          </div>
          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2">
              <div className="rounded-2xl border bg-card shadow-lg">
                {query.trim() && flatResults.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">No results for "{query.trim()}"</p>
                    <p className="mt-1">Try adjusting your search terms or use a quick action below.</p>
                    <div className="mt-4 grid gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleQuickAction(action.href)}
                          className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <action.icon className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{action.label}</p>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">Enter</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!query.trim() && (
                  <div className="p-4 space-y-4">
                    {recent.length > 0 ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent searches</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {recent.map((term) => (
                            <Button
                              key={term}
                              variant="outline"
                              size="sm"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleRecentSelect(term)}
                            >
                              {term}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick actions</p>
                      <div className="mt-2 grid gap-2">
                        {quickActions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleQuickAction(action.href)}
                            className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <action.icon className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{action.label}</p>
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">Enter</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {query.trim() && flatResults.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto py-2">
                    {(() => {
                      let optionIndex = -1;
                      return groups.map((group) => (
                        <div key={group.category} className="px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                            {group.category}
                          </p>
                          <div className="space-y-1">
                            {group.items.map((item) => {
                              optionIndex += 1;
                              const isActive = activeIndex === optionIndex;
                              return (
                                <button
                                  key={`${group.category}-${item.id}`}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onMouseEnter={() => setActiveIndex(optionIndex)}
                                  onClick={() => handleResultSelect(item)}
                                  className={cn(
                                    "w-full rounded-xl px-3 py-2 text-left transition-colors",
                                    isActive ? "bg-primary/10 border border-primary/40" : "hover:bg-muted"
                                  )}
                                >
                                  <p className="text-sm font-medium text-foreground">
                                    {item.title}
                                  </p>
                                  {item.description ? (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.description}
                                    </p>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </form>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4">
              <h4 className="font-medium">Notifications</h4>
              <p className="text-sm text-muted-foreground">You have 3 unread notifications</p>
            </div>
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">New task assigned</p>
                <p className="text-xs text-muted-foreground">Review client dispute #1234</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Client updated profile</p>
                <p className="text-xs text-muted-foreground">John Doe updated contact information</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Task completed</p>
                <p className="text-xs text-muted-foreground">Credit report review finished</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <p className="text-sm font-medium">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.role || "User"}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user?.first_name?.[0] || user?.email?.[0] || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}






