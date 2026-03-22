import Link from "next/link";

import { AppFrame } from "@/components/layout/app-frame";

const learningSteps = [
  "학교, 학년, 반, 번호를 입력해 세션을 시작합니다.",
  "세 가지 풀이 방식 중 하나와 난이도 세트를 고릅니다.",
  "단계형 인터랙션으로 풀이 과정을 확인합니다.",
];

const landingPoints = [
  { label: "방식", value: "3가지 풀이 방식" },
  { label: "세트", value: "하 · 중 · 상 난이도" },
  { label: "기록", value: "시도 로그 append-only" },
];

const studioNotes = [
  "고정형 문제 은행 21문항으로 수업 흐름을 안정적으로 유지합니다.",
  "정확한 유리수 연산과 수직선 이동을 같은 흐름에서 연결합니다.",
  "도전 회차와 정오답이 Google Sheets 에 누적 기록됩니다.",
];

export default function HomePage() {
  return (
    <AppFrame>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="panel-strong rounded-[2.25rem] px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
              학교 수업용 인터랙티브 학습
            </span>
            <span className="text-sm text-[var(--ink-soft)]">
              정수 · 유리수 덧셈과 뺄셈
            </span>
          </div>
          <h1 className="mt-6 max-w-4xl font-[var(--font-display)] text-[2.8rem] leading-[1.12] tracking-[-0.04em] md:text-[4.4rem]">
            부호와 이동을
            <br className="hidden md:block" />
            짧고 선명하게 익히는 수업 도구
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)] md:text-lg">
            셈돌, 카드 점수 미션, 토끼 모델을 오가며 학생이 어디에서 막히는지
            단계별로 드러내고, 즉시 피드백과 시도 기록으로 수업 흐름을 안정적으로
            이어가는 학습 앱입니다.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {landingPoints.map((point) => (
              <div
                key={point.label}
                className="rounded-[1.35rem] border border-[var(--line)] bg-white/72 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                  {point.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-strong)] md:text-base">
                  {point.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/enter"
              className="rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(217,119,44,0.22)] transition hover:-translate-y-0.5 md:text-base"
            >
              학생 입장하기
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="panel rounded-[2rem] p-6">
            <p className="eyebrow text-[var(--berry)]">
              수업 흐름
            </p>
            <div className="mt-5 grid gap-4">
              {learningSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 border-b border-[var(--line)] pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink-strong)] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-[var(--ink-soft)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[2rem] p-6">
            <p className="eyebrow text-[var(--sea)]">
              수업 구성
            </p>
            <ul className="mt-5 grid gap-4 text-sm leading-6 text-[var(--ink-soft)]">
              {studioNotes.map((note) => (
                <li
                  key={note}
                  className="border-b border-[var(--line)] pb-4 last:border-b-0 last:pb-0"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </AppFrame>
  );
}
