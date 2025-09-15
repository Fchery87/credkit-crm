"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = pathname?.startsWith("/login");

  if (hideShell) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}