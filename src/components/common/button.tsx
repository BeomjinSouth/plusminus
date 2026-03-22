import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary" | "ghost" | "danger";
  block?: boolean;
};

export function Button({
  children,
  className,
  tone = "primary",
  block = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        block && "w-full",
        tone === "primary" &&
          "bg-[var(--sun)] text-white hover:-translate-y-0.5",
        tone === "secondary" &&
          "bg-[var(--sea)] text-white hover:-translate-y-0.5",
        tone === "ghost" &&
          "border border-[var(--line-strong)] bg-white/80 text-[var(--ink-strong)] hover:border-[var(--sea)]",
        tone === "danger" &&
          "bg-[var(--berry)] text-white hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

