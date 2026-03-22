import type { ReactNode } from "react";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex items-center justify-between rounded-full border border-[var(--line)] bg-white/60 px-4 py-3 backdrop-blur md:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
            PlusMinus Lab
          </p>
          <p className="text-sm text-[var(--ink-soft)]">
            유리수의 덧셈과 뺄셈 3모형 학습앱
          </p>
        </div>
        <div className="rounded-full bg-[var(--ink-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
          School MVP
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </main>
  );
}

