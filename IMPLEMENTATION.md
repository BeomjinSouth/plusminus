# IMPLEMENTATION — 점프 계산 단일 모델 구현 기준

작성일: 2026-03-23  
문서 상태: 단일 모델 운영 기준

---

## 1. 구현 방향 요약

- 프론트엔드: Next.js App Router + TypeScript
- 스타일: Tailwind + 공통 CSS 변수
- 로그 저장: Google Sheets append
- 학습 모델: `rabbit-sign-parser` 하나만 사용

---

## 2. 현재 파일 구조

```text
src/
  app/
    enter/page.tsx
    lobby/page.tsx
    play/[model]/[difficulty]/page.tsx
    result/[model]/[difficulty]/page.tsx
    api/
      session/start/route.ts
      attempts/log/route.ts
      progress/flush/route.ts
  components/
    common/
    game/
      rabbit-parser/
    number-line/
    play/
  lib/
    expression.ts
    logging/
    problem-bank/
    rational.ts
    sheets/
    storage.ts
    types.ts
    utils.ts
    validation/
```

---

## 3. 모델 ID 정책

```ts
type ModelId = "rabbit-sign-parser";
```

- 셈돌/점수 카드 관련 모델 ID 는 제거한다.
- API 검증 스키마도 같은 기준으로 맞춘다.

---

## 4. 플레이 흐름

`play/[model]/[difficulty]` 는 아래 순서로 진행한다.

1. 세션 로드
2. 난이도별 문제 3개 로드
3. `SetPlayer` 에서 현재 문제 진행
4. 세트 완료 시 요약 결과 flush
5. 결과 화면 이동

---

## 5. 점프 계산 상태 기계

```text
idle
→ split-expression
→ normalize-signs
→ move-step-1
→ move-step-2
→ ...
→ submit-final (integrated into move)
→ feedback
→ next-problem | complete-set
```

---

## 6. UI 표현 원칙

- 상단에는 `문제 번호`, `식`, `해야 할 일`, `진행 막대`만 보여 준다.
- 현재 단계에 필요한 입력과 버튼만 보여 준다.
- 긴 식은 `MathText` 공통 렌더러에서 항 단위로 묶어 줄바꿈하고, 작은 화면에서는 헤더/리본/카드 패딩과 글자 크기를 함께 줄여 한 화면 안에 우선 노출한다.
- 끊기 단계에서는 별도 `미리보기 식` 박스를 두지 않고, 원본 식 위의 절단 위치 변화만 보여 준다.
- 부호 정리 단계는 각 항마다 `+ / -` 선택 버튼과 부호 없는 숫자 입력 칸을 따로 둔다.
- 부호 정리 단계는 각 항 카드 아래에 현재 읽힌 항을 바로 보여 주고, 최종 식/이동 단계 리본은 `-3+8-4`처럼 정리된 부호 형태로 표시하며, 최종 식 입력은 `Enter` 제출도 지원한다.
- 최종 식 입력칸 placeholder 는 일반 안내 문구만 사용하고, 해당 문항의 정답 식을 예시로 노출하지 않는다.
- 최종 식 검증은 `-(3)`처럼 괄호 안에 크기만 남은 표기도 허용하되 `-(-3)`처럼 안쪽 부호가 남아 있으면 거부한다.
- 단계 설명은 한두 줄로 끝낸다.
- `끊기`, `부호`, `점프/답` 단계 카드를 고정 표시한다.
- 끊기 단계 토큰 보드는 작은 화면에서 여러 줄 배치를 우선 사용하고, 더 넓은 화면에서만 가로 확장 레이아웃을 유지한다.
- 첫 번째 항 위치는 자동 시작점으로 처리하고 학생은 두 번째 항부터 점프하며, 별도 제출 단계는 두지 않는다.
- 이동 단계에서 모든 이동이 완료되면 최종 값을 입력하도록 UI를 유도한다.
- 이동 단계에서는 `출발`, `이번 항`, `방향`, `칸 수`를 카드로 먼저 보여 주고 그 아래에 수직선을 둔다.
- 수직선은 조작 대상이 분명해야 하므로 주변 장식보다 눈금과 현재 위치를 우선한다.
- 성공 피드백은 공통 배너로 처리하고, 성공 순간에는 폭죽형 오버레이와 텍스트를 잠깐 띄워 정답 여부를 명확히 보여 준다.
- 마지막 정답 제출이 맞으면 약 1초 이내의 짧은 축하 연출을 보여 준 뒤 다음 문제 또는 결과 화면으로 이동한다.
- 아동 친화적인 밝은 파스텔 톤과 유리 질감 효과, 그리고 이모티콘과 동적 애니메이션을 사용하여 흥미와 집중도를 높인다.

---

## 7. 문제 데이터 구조

```ts
type Problem = {
  id: string;
  expression: string;
  rawSplit: string[];
  terms: string[];
  answer: string;
  intermediateSums: string[];
  gridDenominator: number;
  suggestedTick: string;
  lineMin: string;
  lineMax: string;
  supports: ModelId[];
};
```

- `supports` 는 모든 문항에서 `["rabbit-sign-parser"]` 만 가진다.
- `rawSplit` 은 원본 레코드 문자열이 아니라 학생 화면에 노출된 `expression` 기준으로 맞춘다.

---

## 8. 수학 처리 원칙

- 부동소수점 임시 계산 금지
- 모든 유리수는 정확한 분수 연산
- 부호 해석은 문자열 땜질이 아니라 파서 기반
- 2단계 최종 식 검증도 문자열 완전 일치가 아니라 항 단위 파싱 후 기대 항과 순서·부호를 비교해 판정한다.

핵심 함수:

- `parseRational`
- `splitExpressionIntoTerms`
- `parseSignedSegment`
- `buildFinalExpression`

---

## 9. 저장/로그 원칙

- 시도 로그는 append-only
- `attempt_events` 에 단계별 시도를 누적 기록
- 세트 완료 시 `set_results` append
- 클라이언트는 attempt queue 를 유지
- `문항 종료`, `세트 완료`, `페이지 이탈 직전` 에 flush

---

## 10. storage 정책

로컬 저장은 아래만 유지한다.

- `plusminus:session`
- `plusminus:latest-result`
- `plusminus:attempt-queue`

학생 진행 잠금용 `student-progress` 저장은 제거한다.

---

## 11. 제거된 항목

- `counting-stones` 모델 타입/로비/플레이 코드
- `postman` 모델 타입/로비/플레이 코드
- 모델 잠금 해제 로직
- 점수 카드 전용 표현 헬퍼
- 셈돌/점수 카드 관련 테스트

---

## 12. 테스트 기준

최소 유지 항목:

1. `-(+3)-(-5)+7`
2. `(+2/3)-(-5/6)-(+1/2)`
3. `(+2.4)-(-1.1)-(+0.5)`

필수 검증:

- `npm run test`
- `npm run build`

---

## 13. 운영 메모

- 로비는 점프 계산 난이도 선택만 제공한다.
- 결과 화면은 같은 세트 재도전과 난이도 재선택만 제공한다.
- 이후 다른 모델을 다시 도입하려면 타입, 문제은행, 로비, 문서, 테스트를 모두 함께 늘려야 한다.

---

## 14. Fraction Rendering

- 분수 표시는 계산 로직과 분리된 공통 UI 렌더러에서 처리한다.
- `\d+/\d+` 형태의 유리수 문자열은 부호를 유지한 채 분자/분모를 세로 적층해서 렌더링한다.
- 적용 범위는 문제 헤더, 식 자르기 토큰, 부호 정리 카드, 최종 식 리본, 수직선 눈금이다.

## 15. 2026-04-09 Note

- `SetPlayer` 는 마지막 문제 완료 시 `plusminus:pending-progress-flush` 에 pending payload 를 저장한 뒤 결과 페이지로 즉시 이동한다.
- `result/[model]/[difficulty]` 는 마운트 후 pending flush 를 비동기로 실행하고, 페이지 이탈 시에는 beacon 으로 한 번 더 전송을 시도한다.
