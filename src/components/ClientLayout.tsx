"use client";

import { ToastProvider } from "@/hooks/useToast";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
