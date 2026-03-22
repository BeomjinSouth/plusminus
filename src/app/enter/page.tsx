"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { AppFrame } from "@/components/layout/app-frame";
import { saveSessionState } from "@/lib/storage";

const entryFacts = [
  { label: "입력 항목", value: "학교 · 학년 · 반 · 번호" },
  { label: "시작 시간", value: "입력 후 바로 로비 이동" },
  { label: "기록 방식", value: "도전 로그 append-only" },
];

const entrySteps = [
  "학생 정보를 간단히 입력합니다.",
  "세션을 시작하고 모델을 고릅니다.",
  "7문항 미션을 바로 플레이합니다.",
];

export default function EnterPage() {
  const router = useRouter();
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("1");
  const [classNo, setClassNo] = useState("1");
  const [studentNo, setStudentNo] = useState("1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      school: school.trim(),
      grade: Number.parseInt(grade, 10),
      classNo: Number.parseInt(classNo, 10),
      studentNo: Number.parseInt(studentNo, 10),
    };

    const response = await fetch("/api/session/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setLoading(false);
      setError("세션을 시작하지 못했습니다. 입력값을 다시 확인해 주세요.");
      return;
    }

    const result = (await response.json()) as {
      sessionId: string;
      studentKey: string;
    };

    saveSessionState({
      sessionId: result.sessionId,
      student: {
        ...payload,
        studentKey: result.studentKey,
      },
    });

    router.push("/lobby");
  }

  return (
    <AppFrame>
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="panel-strong relative overflow-hidden rounded-[2.3rem] px-6 py-7 md:px-8 md:py-8">
          <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(217,119,44,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(47,124,121,0.16),transparent_38%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--line)] bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
                Entry Pass
              </span>
              <span className="rounded-full bg-[var(--ink-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                Start in under 1 min
              </span>
            </div>
            <h1 className="mt-5 font-[var(--font-display)] text-[2.35rem] leading-[1.05] tracking-[-0.05em] md:text-[3.6rem]">
              학생 정보만 넣고
              <br />
              바로 미션으로
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              긴 설명 없이 바로 시작할 수 있게 구성했습니다. 세션을 열면 로비로
              이동하고, 원하는 모델과 난이도를 바로 고를 수 있습니다.
            </p>

            <div className="mt-6 grid gap-3">
              {entrySteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-[1.5rem] border border-[var(--line)] bg-white/76 px-4 py-4"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink-strong)] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[var(--ink-soft)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-strong rounded-[2.3rem] p-6 md:p-8">
          <div className="border-b border-[var(--line)] pb-6">
            <p className="eyebrow text-[var(--sea)]">학생 입장</p>
            <h2 className="mt-3 font-[var(--font-display)] text-[2rem] leading-[1.1] tracking-[-0.04em] md:text-[2.7rem]">
              시작 정보 입력
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              교실에서 빠르게 쓸 수 있도록 입력은 최소한으로 두었습니다.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {entryFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-[1.35rem] border border-[var(--line)] bg-white/74 px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {fact.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-strong)]">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6">
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="field-label">학교</span>
                <input
                  value={school}
                  onChange={(event) => setSchool(event.target.value)}
                  className="field"
                  placeholder="예: OO중학교"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2">
                  <span className="field-label">학년</span>
                  <input
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    className="field"
                    inputMode="numeric"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="field-label">반</span>
                  <input
                    value={classNo}
                    onChange={(event) => setClassNo(event.target.value)}
                    className="field"
                    inputMode="numeric"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="field-label">번호</span>
                  <input
                    value={studentNo}
                    onChange={(event) => setStudentNo(event.target.value)}
                    className="field"
                    inputMode="numeric"
                    required
                  />
                </label>
              </div>
            </div>

            {error ? (
              <p className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
                Google Sheets 가 연결되어 있으면 단계별 도전 기록도 함께 append
                됩니다.
              </p>
              <Button
                type="submit"
                className="rounded-full px-6 py-3.5 lg:min-w-[240px] lg:w-auto"
                block
                disabled={loading}
              >
                {loading ? "세션 생성 중..." : "모델 선택하러 가기"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </AppFrame>
  );
}
