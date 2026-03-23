import type { ReactNode } from "react";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 py-5 md:px-8 md:py-7">
      <div className="flex-1">{children}</div>
    </main>
  );
}
