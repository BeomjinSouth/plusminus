import type { ReactNode } from "react";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 py-5 md:px-8 md:py-7">
      <header className="panel-strong mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] px-5 py-4 md:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--sun)] shadow-[0_0_0_6px_rgba(217,119,44,0.16)]" />
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-[var(--sea)]">
              PlusMinus Lab
            </p>
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
              1인 미션 플레이
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)] md:text-[15px]">
            부호, 이동, 장면을 짧은 미션 루프로 익히는 3모형 학습앱
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ink-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white">
          <span className="inline-flex h-2 w-2 rounded-full bg-[var(--gold)]" />
          School MVP
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </main>
  );
}
