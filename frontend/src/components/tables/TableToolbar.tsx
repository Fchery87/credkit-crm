"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import FilterChips, { type ChipOption } from "./FilterChips";

interface TableToolbarProps {
  searchPlaceholder?: string;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  chips?: ChipOption[];
  selectedChip?: string;
  onChipSelect?: (key: string) => void;
  rightActions?: React.ReactNode;
  className?: string;
}

export default function TableToolbar({
  searchPlaceholder = "Search...",
  searchTerm,
  onSearchChange,
  chips,
  selectedChip = "",
  onChipSelect,
  rightActions,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn("flex items-center gap-4 flex-wrap", className)}>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {chips && onChipSelect ? (
        <FilterChips options={chips} selected={selectedChip} onSelect={onChipSelect} />
      ) : null}
      {rightActions ? <div className="ml-auto flex items-center gap-2">{rightActions}</div> : null}
    </div>
  );
}