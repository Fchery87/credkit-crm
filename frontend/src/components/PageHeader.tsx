"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  breadcrumbs?: Crumb[];
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  filters,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="mb-2 text-sm text-muted-foreground">
              <ol className="flex items-center gap-2">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <li key={`${crumb.label}-${idx}`} className="flex items-center gap-2">
                      {crumb.href && !isLast ? (
                        <Link
                          href={{ pathname: crumb.href }}
                          className="hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isLast ? "text-foreground" : ""}>{crumb.label}</span>
                      )}
                      {!isLast && <span className="text-muted-foreground">/</span>}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}
          <h1 className="h1 text-foreground">{title}</h1>
          {subtitle ? (
            <p className="text-base text-muted-foreground mt-1">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      {filters ? <div className="flex items-center gap-4 flex-wrap">{filters}</div> : null}
    </div>
  );
}
