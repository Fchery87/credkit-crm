"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ChipOption {
  key: string;
  label: string;
}

export default function FilterChips({
  options,
  selected,
  onSelect,
  className,
}: {
  options: ChipOption[];
  selected: string;
  onSelect: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150",
            selected === opt.key
              ? "bg-primary text-primary-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}