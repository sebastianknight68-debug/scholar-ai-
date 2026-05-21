"use client";
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

type ToastItem = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "danger" | "success";
};

const ToastCtx = React.createContext<{
  toast: (t: Omit<ToastItem, "id">) => void;
}>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    setItems((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]);
  }, []);
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastCtx.Provider value={{ toast }}>{children}</ToastCtx.Provider>
      {items.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          onOpenChange={(open) => {
            if (!open) setItems((p) => p.filter((x) => x.id !== t.id));
          }}
          className={cn(
            "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-lg",
            t.variant === "danger" && "border-danger/40",
            t.variant === "success" && "border-success/40",
          )}
        >
          <div className="grid gap-1">
            {t.title && (
              <ToastPrimitive.Title className="text-sm font-semibold">
                {t.title}
              </ToastPrimitive.Title>
            )}
            {t.description && (
              <ToastPrimitive.Description className="text-sm text-muted">
                {t.description}
              </ToastPrimitive.Description>
            )}
          </div>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 p-4" />
    </ToastPrimitive.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastCtx);
}
