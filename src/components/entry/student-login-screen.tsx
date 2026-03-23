"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { saveSessionState } from "@/lib/storage";

export function StudentLoginScreen() {
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

    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("SESSION_START_FAILED");
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
    } catch {
      setLoading(false);
      setError("로그인을 진행하지 못했습니다. 입력값을 다시 확인해 주세요.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 md:px-8">
      <section className="w-full max-w-[31rem]">
        <div className="text-center">
          <h1 className="font-[var(--font-display)] text-[2.45rem] leading-[1.1] tracking-[-0.05em] md:text-[3.2rem]">
            정수와 유리수의
            <br />
            덧셈 뺄셈 연습
          </h1>
        </div>

        <form
          onSubmit={onSubmit}
          className="panel-strong mt-8 rounded-[2rem] p-6 md:p-8"
        >
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

          <Button
            type="submit"
            className="mt-6 rounded-[1.25rem] py-3.5 text-base"
            block
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </section>
    </main>
  );
}
