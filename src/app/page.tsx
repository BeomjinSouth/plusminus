import Link from "next/link";

import { AppFrame } from "@/components/layout/app-frame";
import { modelInsights } from "@/lib/model-content";

export default function HomePage() {
  return (
    <AppFrame>
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel rounded-[2rem] px-6 py-8 md:px-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--sea)]">
            Rational Adventure Studio
          </p>
          <h1 className="max-w-3xl font-[var(--font-display)] text-5xl leading-none md:text-7xl">
            부호를 읽고,
            <br />
            움직이고,
            <br />
            이해하게 만드는 수학 놀이터
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--ink-soft)] md:text-lg">
            셈돌 모델, 우체부 모델, 토끼 부호-분해 모델을 오가며 정수와 유리수의
            덧셈·뺄셈을 짧은 단계와 즉시 피드백으로 익히는 수업용 웹앱입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/enter"
              className="rounded-full bg-[var(--sun)] px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5"
            >
              학생 입장하기
            </Link>
            <a
              href="#models"
              className="rounded-full border border-[var(--line-strong)] px-6 py-3 text-base font-semibold text-[var(--ink-strong)] transition hover:border-[var(--sea)] hover:text-[var(--sea)]"
            >
              모델 살펴보기
            </a>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="panel rounded-[2rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--berry)]">
              수업 흐름
            </p>
            <ol className="mt-4 grid gap-3 text-sm text-[var(--ink-soft)] md:text-base">
              <li>1. 학교, 학년, 반, 번호 입력 후 세션 시작</li>
              <li>2. 세 모델 중 하나와 난이도 세트 선택</li>
              <li>3. 단계형 인터랙션으로 문제 해결</li>
              <li>4. 도전 회차와 정오답이 Google Sheets 에 기록</li>
            </ol>
          </div>
          <div className="panel rounded-[2rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
              MVP 범위
            </p>
            <ul className="mt-4 grid gap-3 text-sm text-[var(--ink-soft)] md:text-base">
              <li>3개 모델 × 하/중/상 세트</li>
              <li>고정형 문제 은행 21문항 재사용</li>
              <li>정확한 유리수 연산과 수직선 이동</li>
              <li>Google Sheets append-only 기록</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="models" className="mt-10 grid gap-5 lg:grid-cols-3">
        {modelInsights.map((model, index) => (
          <article
            key={model.id}
            className="panel rise-in rounded-[2rem] p-6"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                {model.badge}
              </span>
              <span className="text-2xl font-[var(--font-display)] text-[var(--ink-soft)]">
                {model.shortName}
              </span>
            </div>
            <h2 className="font-[var(--font-display)] text-3xl">{model.title}</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
              {model.meaning}
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="font-semibold text-[var(--sea)]">유용한 때</p>
                <p className="mt-1 leading-6 text-[var(--ink-soft)]">
                  {model.bestUse}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="font-semibold text-[var(--sun)]">의도</p>
                <p className="mt-1 leading-6 text-[var(--ink-soft)]">
                  {model.intent}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="font-semibold text-[var(--berry)]">한계</p>
                <p className="mt-1 leading-6 text-[var(--ink-soft)]">
                  {model.limitation}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppFrame>
  );
}
