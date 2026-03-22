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
        "rounded-[1.15rem] px-4 py-3 text-sm font-semibold tracking-[-0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-paper)] disabled:cursor-not-allowed disabled:opacity-50",
        block && "w-full",
        tone === "primary" &&
          "bg-[var(--sun)] text-white shadow-[0_16px_30px_rgba(217,119,44,0.22)] hover:-translate-y-0.5 hover:brightness-[1.02]",
        tone === "secondary" &&
          "bg-[var(--sea)] text-white shadow-[0_16px_30px_rgba(47,124,121,0.2)] hover:-translate-y-0.5 hover:brightness-[1.02]",
        tone === "ghost" &&
          "border border-[var(--line-strong)] bg-white/80 text-[var(--ink-strong)] hover:border-[var(--sea)] hover:bg-white",
        tone === "danger" &&
          "bg-[var(--berry)] text-white shadow-[0_16px_30px_rgba(181,82,67,0.2)] hover:-translate-y-0.5 hover:brightness-[1.02]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
