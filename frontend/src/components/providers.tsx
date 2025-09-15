"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <WebSocketProvider>{children}</WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}