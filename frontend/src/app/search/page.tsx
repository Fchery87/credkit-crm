"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  addRecentSearch,
  getRecentSearches,
  getSearchResults,
  buildSearchUrl,
  type SearchGroup,
} from "@/lib/global-search";

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params?.get("q") ?? "";

  const [recent, setRecent] = useState<string[]>([]);

  const results = useMemo<SearchGroup[]>(() => getSearchResults(query), [query]);
  const hasTypedQuery = Boolean(query.trim());

  useEffect(() => {
    if (!hasTypedQuery) {
      return;
    }
    addRecentSearch(query);
    setRecent(getRecentSearches());
  }, [query, hasTypedQuery]);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  const handleRecentClick = (term: string) => {
    const clean = term.trim();
    if (!clean) {
      return;
    }
    router.push(buildSearchUrl(clean) as any);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Search"
        subtitle={hasTypedQuery ? `Results for "${query}"` : "Type in the search bar above to get started"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      />

      {recent.length > 0 ? (
        <div className="card-modern p-6">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent searches</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((term) => (
              <Button key={term} variant="outline" size="sm" onClick={() => handleRecentClick(term)}>
                {term}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {hasTypedQuery ? (
        results.length > 0 ? (
          <div className="space-y-6">
            {results.map((group) => (
              <div key={group.category} className="card-modern p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  {group.category}
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <Link
                      key={`${group.category}-${item.id}`}
                      href={{ pathname: item.href }}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {item.description ? (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">View</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-modern p-8 text-center space-y-3">
            <p className="text-lg font-semibold text-foreground">No results found</p>
            <p className="text-sm text-muted-foreground">
              We couldn't find anything for "{query}". Try refining your search or use a quick action from the search bar.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}



