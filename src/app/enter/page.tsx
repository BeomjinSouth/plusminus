"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { AppFrame } from "@/components/layout/app-frame";
import { saveSessionState } from "@/lib/storage";

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
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sea)]">
            Entry Console
          </p>
          <h1 className="mt-3 font-[var(--font-display)] text-5xl leading-none md:text-6xl">
            학생 정보를 입력하고
            <br />
            세션을 시작하세요
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
            학교, 학년, 반, 번호를 입력하면 문제 풀이 로그가 세션에 연결됩니다.
            Google Sheets 환경 변수가 연결되어 있으면 단계별 도전 기록이 함께
            append 됩니다.
          </p>
        </div>

        <form onSubmit={onSubmit} className="panel rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--ink-soft)]">
                학교
              </span>
              <input
                value={school}
                onChange={(event) => setSchool(event.target.value)}
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                placeholder="예: OO중학교"
                required
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--ink-soft)]">
                  학년
                </span>
                <input
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  inputMode="numeric"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--ink-soft)]">
                  반
                </span>
                <input
                  value={classNo}
                  onChange={(event) => setClassNo(event.target.value)}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  inputMode="numeric"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--ink-soft)]">
                  번호
                </span>
                <input
                  value={studentNo}
                  onChange={(event) => setStudentNo(event.target.value)}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  inputMode="numeric"
                  required
                />
              </label>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-6" block disabled={loading}>
            {loading ? "세션 생성 중..." : "모델 선택하러 가기"}
          </Button>
        </form>
      </section>
    </AppFrame>
  );
}

