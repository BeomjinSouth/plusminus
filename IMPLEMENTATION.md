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
2. 난이도별 문제 7개 로드
3. `SetPlayer` 에서 현재 문제 진행
4. 세트 완료 시 `setResult` flush
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
→ submit-final
→ feedback
→ next-problem | complete-set
```

---

## 6. UI 표현 원칙

- 상단에는 `문제 번호`, `식`, `해야 할 일`, `진행 막대`만 보여 준다.
- 현재 단계에 필요한 입력과 버튼만 보여 준다.
- 부호 정리 단계는 각 항마다 `+ / -` 선택 버튼과 부호 없는 숫자 입력 칸을 따로 둔다.
- 단계 설명은 한두 줄로 끝낸다.
- `끊기`, `부호`, `점프`, `답` 단계 카드를 고정 표시한다.
- 첫 번째 항 위치는 자동 시작점으로 처리하고 별도 제출 단계는 두지 않는다.
- 이동 단계에서는 `출발`, `이번 항`, `방향`, `칸 수`를 카드로 먼저 보여 주고 그 아래에 수직선을 둔다.
- 수직선은 조작 대상이 분명해야 하므로 주변 장식보다 눈금과 현재 위치를 우선한다.
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
