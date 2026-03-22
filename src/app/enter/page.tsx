"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { AppFrame } from "@/components/layout/app-frame";
import { saveSessionState } from "@/lib/storage";

const entryFacts = [
  { label: "입력 항목", value: "학교 · 학년 · 반 · 번호" },
  { label: "다음 단계", value: "세션 시작 후 모델 선택" },
  { label: "기록 방식", value: "도전 로그 append-only" },
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
      <section className="mx-auto w-full max-w-4xl">
        <div className="panel-strong rounded-[2.25rem] p-6 md:p-8 lg:p-10">
          <div className="border-b border-[var(--line)] pb-6">
            <div>
              <p className="eyebrow text-[var(--sea)]">학생 입장</p>
              <h1 className="mt-3 max-w-2xl font-[var(--font-display)] text-[2.2rem] leading-[1.2] tracking-[-0.03em] md:text-[3rem]">
                학생 정보 입력
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
                학교, 학년, 반, 번호만 입력하면 세션이 시작되고 바로 모델 선택
                화면으로 이동합니다.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {entryFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-[1.35rem] border border-[var(--line)] bg-white/72 px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {fact.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink-strong)]">
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

            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
                Google Sheets 가 연결되어 있으면 단계별 도전 기록도 함께 append
                됩니다.
              </p>
              <Button
                type="submit"
                className="rounded-full px-6 py-3.5 md:min-w-[220px] md:w-auto"
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
