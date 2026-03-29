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
        "rounded-full px-5 py-3 text-[15px] font-bold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sea)] focus-visible:ring-opacity-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95",
        block && "w-full",
        tone === "primary" &&
          "border-b-4 border-[color:color-mix(in_srgb,var(--sun),black_15%)] bg-[var(--sun)] text-white shadow-md hover:-translate-y-1 hover:brightness-110 active:border-b-0 active:translate-y-1",
        tone === "secondary" &&
          "border-b-4 border-[color:color-mix(in_srgb,var(--sea),black_20%)] bg-[var(--sea)] text-white shadow-md hover:-translate-y-1 hover:brightness-110 active:border-b-0 active:translate-y-1",
        tone === "ghost" &&
          "border-2 border-[var(--line-strong)] bg-white/90 text-[var(--ink-strong)] hover:border-[var(--sea)] hover:bg-white active:translate-y-1",
        tone === "danger" &&
          "border-b-4 border-[color:color-mix(in_srgb,var(--berry),black_20%)] bg-[var(--berry)] text-white shadow-md hover:-translate-y-1 hover:brightness-110 active:border-b-0 active:translate-y-1",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
