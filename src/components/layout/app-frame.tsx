import type { ReactNode } from "react";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 py-5 md:px-8 md:py-7">
      <header className="panel-strong mb-6 flex items-center justify-between gap-4 rounded-[1.9rem] px-5 py-4 md:px-6">
        <div className="min-w-0">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-[var(--sea)]">
            PlusMinus Lab
          </p>
          <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-[15px]">
            유리수의 덧셈과 뺄셈을 위한 3모형 학습앱
          </p>
        </div>
        <div className="hidden rounded-full border border-white/10 bg-[var(--ink-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white sm:block">
          School MVP
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </main>
  );
}
