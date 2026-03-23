# IMPLEMENTATION — 유리수의 덧셈과 뺄셈 3모형 웹앱 구현안

작성일: 2026-03-22  
문서 상태: 구현 반영 v3

---

## 1. 구현 방향 한 줄 요약

**Next.js(App Router) + TypeScript + Tailwind + Google Sheets API** 조합으로  
프론트엔드와 서버 API 를 한 저장소 안에서 운영하고,  
배포는 **Vercel 우선**, 필요 시 **Railway 보조**로 간다.

---

## 2. 왜 이 스택을 권장하는가

### 2-1. Next.js + Vercel
- 화면과 서버 API(Route Handlers)를 한 프로젝트에서 관리하기 쉽다.
- GitHub push 기반 자동 배포 흐름이 단순하다.
- 교실 수업용 웹앱처럼 빠르게 배포하고 자주 수정하는 제품에 잘 맞는다.

### 2-2. Google Sheets 를 DB 로 유지
- 사용자가 이미 원한 저장소가 Google Sheets 이다.
- 교사가 별도 관리자 화면 없이도 데이터를 바로 열어 볼 수 있다.
- append-only 로그 구조와 잘 맞는다.

### 2-3. Railway 는 언제 쓰는가
- 서버를 프런트엔드와 분리하고 싶을 때
- 장기 실행 작업, 큐, 백그라운드 작업이 필요해질 때
- Python/FastAPI 기반 별도 계산 엔진을 붙이고 싶을 때

---

## 3. 권장 아키텍처

```text
[학생 브라우저]
   ↓
[Next.js 프론트엔드]
   ↓ (Route Handlers)
[서버 전용 로그 API]
   ↓
[Google Sheets API]
   ↓
[Google Sheets]
```

### MVP 에서는 이렇게 간다
- 브라우저가 Google Sheets 를 직접 호출하지 않는다.
- 모든 Sheets 접근은 서버 Route Handler 를 통해서만 이뤄진다.
- 학생 입력과 정오답 결과는 append-only 로 기록한다.

---

## 4. 저장소 구조 제안

```text
src/
  app/
    layout.tsx
    page.tsx
    icon.tsx
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
    layout/
    play/
    game/
      counting-stones/
      postman/
      rabbit-parser/
    number-line/
  lib/
    problem-bank/
    logging/
    sheets/
    validation/
  app/globals.css

tests/
  rational.test.ts
  expression.test.ts
```

---

## 5. 핵심 기술 선택

### 5-1. 언어 / 프레임워크
- TypeScript
- Next.js App Router
- React
- Tailwind CSS

### 5-2. 추천 라이브러리
- `zod` : 요청/응답 검증
- `fraction.js` 또는 자체 Fraction 유틸 : 정확한 유리수 연산
- `googleapis` : Google Sheets API 호출
- `clsx` 또는 `cn` 유틸 : UI 클래스 정리
- `framer-motion` : 가벼운 성공/실패 애니메이션
- `vitest` 또는 `jest` : 단위 테스트
- `playwright` : 시나리오 테스트

### 5-3. 금지 또는 비권장
- `number` 타입만으로 분수 계산 처리
- 클라이언트에서 Google 서비스 계정 키 사용
- `eval` 기반 식 계산
- 부호 해석을 문자열 치환만으로 대충 처리하는 방식

---

## 6. 정확한 유리수 연산 엔진

### 반드시 지켜야 할 원칙
- `0.1 + 0.2` 같은 부동소수점 오류를 피해야 한다.
- 모든 계산은 내부적으로 `분자/분모` 또는 Fraction 객체로 처리한다.
- 화면 표시만 정수, 분수, 소수 문자열로 변환한다.

### 내부 표현 예시
```ts
type Rational = {
  numerator: number;
  denominator: number;
};
```

### 필요한 함수
- `parseRational(input: string): Rational`
- `normalizeRational(r: Rational): Rational`
- `addRational(a, b): Rational`
- `subRational(a, b): Rational`
- `compareRational(a, b): number`
- `toDisplayString(r): string`
- `toDecimalIfSafe(r): string`

### 입력 예시
- `7`
- `+7`
- `-3`
- `1/2`
- `-5/6`
- `2.5`

---

## 7. 문제 데이터 구조

MVP 는 생성형이 아니라 **고정형 문제 은행**을 쓴다.

### 문제 스키마 예시
```ts
type Problem = {
  id: string;
  modelSupport: ("counting-stones" | "postman" | "rabbit-sign-parser")[];
  difficulty: "low" | "medium" | "high";
  expression: string;
  rawSplit?: string[];
  normalizedTerms: string[];
  answer: string;
  gridDenominator: number;
  suggestedTick: string;
  lineMin: string;
  lineMax: string;
  intermediateSums: string[];
};
```

### 구현 포인트
- `expression` 은 학생에게 보여줄 원식
- `rawSplit` 은 토끼 모델 1단계의 정답
- `normalizedTerms` 는 토끼 모델 2단계 정답
- `intermediateSums` 는 수직선 이동 검증용
- `gridDenominator` 는 눈금 간격 계산의 기준

---

## 8. 수직선 렌더링 알고리즘

### 목표
문항마다 적절한 범위를 자동으로 잡아,
학생이 너무 좁지도 너무 넓지도 않게 움직이도록 한다.

### 알고리즘
1. 시작점 `0`
2. 각 항을 순서대로 누적하여 중간합 목록 생성
3. `0` 과 모든 중간합의 최솟값/최댓값 추출
4. 좌우 패딩 추가
5. 분모 최소공배수로 눈금 간격 결정

### 예시
문제: `-(+3)-(-5)+7`

- 정리된 항: `-3, +5, +7`
- 중간합: `-3, 2, 9`
- 최소/최대: `-3, 9`
- 패딩 2 적용 → 범위 `-5 ~ 11`

### 유리수 문제 예시
문제: `(+2/3)-(-5/6)-(+1/2)`

- 정리된 항: `+2/3, +5/6, -1/2`
- 중간합: `2/3, 3/2, 1`
- 공통분모 6
- 눈금 단위 `1/6`

### 주의
- 공통분모가 커지면 화면이 복잡해진다.
- 따라서 문제 은행 단계에서 공통분모 상한을 제한한다.

---

## 9. 모델별 상태 기계 설계

## 9-1. 셈돌 모델 상태
```text
idle
→ place-term-n
→ predict-zero-pairs
→ submit-result
→ feedback
→ next-problem | complete-set
```

### 검증 포인트
- 현재 단계에서 허용되지 않은 조작 차단
- `0쌍` 추가는 필요한 경우에만 가능하게 제한할지, 자유롭게 둘지 결정
- 오답 시 전체 리셋이 아니라 **현재 단계만 되돌리기**

### UI 표현 원칙
- 셈돌 플레이 화면은 인지 부하를 줄이기 위해 `문제 번호`, `식`, `현재 단계`, `필수 조작`, `보드`, `입력칸`만 우선 노출한다.
- 셈돌 플레이 화면에서는 모델 소개 카드, 학생 요약 카드, 통계 카드처럼 현재 풀이에 필요 없는 정보는 숨길 수 있다.
- 셈돌 세트 상단은 `문제 번호`, `식`, `해야 할 일`만 크게 보여 주고 재도전/연속 정답 통계는 기본 노출에서 뺀다.
- 준비 영역과 보드 모두 실제 돌 토큰 배열을 렌더링한다.
- `양돌 1개 놓기`, `음돌 1개 놓기` 는 새 토큰이 나타나는 애니메이션으로 보여 준다.
- 돌 놓기 단계에서는 현재 항에 필요한 돌 종류 버튼만 보여 주고, 반대 색 돌 조작은 숨긴다.
- `되돌리기` 는 마지막 토큰만 짧게 사라지게 처리한다.
- `0쌍` 소거 성공 시 보드의 양돌/음돌이 짝으로 사라진 뒤 결과 단계로 이동한다.

## 9-2. 우체부 모델 상태(학생 노출명: 카드 점수 미션)
```text
idle
→ choose-action
→ update-story-log
→ submit-result
→ feedback
→ next-problem | complete-set
```

## 9-3. 토끼 모델 상태
```text
idle
→ split-expression
→ normalize-signs
→ choose-start-point
→ move-step-1
→ move-step-2
→ ...
→ submit-final
→ feedback
→ next-problem | complete-set
```

현재 구현에서는 수직선 이동 뒤 최종 값을 다시 입력하는 `submit-final` 단계를 둔다.

---

## 10. 토끼 모델 세부 검증 로직

### 10-1. 끊기 단계
학생은 허용된 분리 지점만 선택할 수 있다.

예:
- 원식: `-(+3)-(-5)+7`
- 정답 배열: `["-(+3)", "-(-5)", "+7"]`

### 10-2. 부호 정리 단계
각 조각에 포함된 최종 부호를 계산한다.

규칙:
- 바깥 부호와 괄호 안 부호를 결합
- `-` 가 홀수 개면 음수
- `-` 가 짝수 개면 양수

### 10-3. 이동 단계
- 시작점은 항상 `0` 또는 문제 정의 시작점
- 각 항의 절댓값만큼 이동
- 부호에 따라 방향 결정
- 현재 위치 검증 후 다음 단계 진입

### 10-4. 실수 처리
- 잘못된 방향 이동: 현재 단계 재시도
- 칸 수 초과/미달: 애니메이션 없이 원위치 복귀
- 엔터 제출 시 현재 위치가 목표 위치가 아니면 오답 처리

---

## 11. Google Sheets 설계

## 11-1. 시트 탭 제안
- `students` : 선택 사항. 학생 식별 기본 정보
- `sessions` : 세션 시작/종료 요약
- `attempt_events` : 가장 중요한 append-only 로그
- `set_results` : 세트 단위 요약
- `problem_catalog` : 문제 ID 와 메타데이터(선택)

## 11-2. `attempt_events` 컬럼 예시
| column | 설명 |
|---|---|
| timestamp | 서버 기록 시각 |
| session_id | 세션 ID |
| school | 학교 |
| grade | 학년 |
| class_no | 반 |
| student_no | 번호 |
| model | 모델 |
| difficulty | 난이도 |
| set_id | 세트 |
| problem_id | 문항 ID |
| step_id | 단계 ID |
| attempt_no | 해당 단계 도전 회차 |
| input_raw | 학생 원입력 |
| normalized_input | 정규화된 입력 |
| is_correct | 정오답 |
| response_time_ms | 응답 시간 |
| current_position | 수직선 현재 위치 |
| expected_value | 기대값 |
| app_version | 배포 버전 |

## 11-3. append 전략
가장 단순한 방식은 `spreadsheets.values.append` 이다.

장점:
- append-only 로그와 잘 맞음
- 충돌 관리가 단순함
- 교사가 보기 쉽다

### 권장 구현
- 클라이언트는 이벤트 큐를 가짐
- `문항 종료`, `단계 성공`, `페이지 이탈 직전` 시 flush
- 서버는 이벤트 배열을 받아 한 번에 append
- 실패 시 재시도용 로컬 큐 유지
- 환경 변수가 없는 로컬 개발에서는 noop 응답으로 동작
- 스프레드시트에 시트 탭이나 헤더가 없으면 첫 append 전에 자동으로 준비

### 왜 이렇게 하는가
Google Sheets API 는 분당 요청 제한이 있으므로,
이벤트를 1건씩 바로 쓰기보다 **묶어서 보내는 방식**이 안정적이다.

---

## 12. API 설계

## 12-1. `POST /api/session/start`
### 입력
```json
{
  "school": "OO중학교",
  "grade": 1,
  "classNo": 3,
  "studentNo": 12
}
```

### 출력
```json
{
  "sessionId": "sess_xxx",
  "studentKey": "OO중-1-3-12"
}
```

## 12-2. `POST /api/attempts/log`
### 입력
```json
{
  "sessionId": "sess_xxx",
  "events": [
    {
      "model": "rabbit-sign-parser",
      "difficulty": "high",
      "problemId": "H01",
      "stepId": "split-expression",
      "attemptNo": 2,
      "inputRaw": "[-(+3), -(-5), +7]",
      "normalizedInput": "..."
    }
  ]
}
```

### 출력
```json
{ "ok": true }
```

## 12-3. `POST /api/progress/flush`
- 로컬 큐를 강제로 비울 때 사용
- 세트 종료 직전 사용

## 12-4. `GET /api/health`
- 배포 상태 확인용
- 앱 버전, Sheets 설정 여부, 서버 시각 반환

---

## 13. 인증과 보안

## 13-1. 권장 방식
- Google Sheets API 접근은 **서버 전용 인증** 사용
- 학생 브라우저에는 인증 정보가 내려가지 않음

## 13-2. 서비스 계정 vs Workload Identity Federation
### 현실적인 MVP
- 서비스 계정 키 JSON 을 서버 환경 변수로 저장
- 구현이 단순하고 빠르다

### 더 권장되는 운영형 방식
- Workload Identity Federation 같은 **단기 자격 증명** 방식 검토
- 장기 키 파일 유출 위험을 줄일 수 있다

### 문서상 원칙
- MVP 는 서비스 계정 키 방식 가능
- 운영 전환 시 WIF 또는 더 안전한 대안 검토
- 키는 Git 저장소에 절대 올리지 않음

## 13-3. 추가 보안
- Zod 검증으로 요청 스키마 강제
- rate limit 적용
- session id 난수화
- app route 에서 origin 검사
- 환경 변수는 서버 런타임에서만 사용

---

## 14. 환경 변수 설계

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_PROJECT_ID=
APP_VERSION=
LOG_FLUSH_MAX_BATCH=10
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_URL=
```

### 주의
- private key 개행 문자 처리 필요
- Vercel 에서 환경 변수 변경 후에는 새 배포가 필요하다
- 로컬 개발에서는 `.env.local` 사용

---

## 15. Vercel 배포 권장안

### 이유
- Next.js 와 궁합이 좋다
- GitHub push 기반 자동 배포가 단순하다
- Preview / Production 환경 분리가 쉬움
- 현재 구현은 App Router 단일 프로젝트라 별도 백엔드 분리 없이 바로 올릴 수 있다

### 기본 흐름
1. GitHub 저장소 연결
2. 환경 변수 설정
3. `main` push 시 production 배포
4. feature branch push 시 preview 배포

### 운영 팁
- `APP_VERSION` 에 Git SHA 반영
- preview 에는 테스트용 스프레드시트를 연결
- production 은 실제 수업용 스프레드시트 연결

---

## 16. Railway 를 쓰는 경우

다음 경우에는 Railway 분리 배포를 고려한다.

- 별도 FastAPI 백엔드가 필요함
- 로그 큐나 비동기 작업이 많아짐
- 나중에 분석용 API 를 독립 배포하고 싶음

### 추천 분리 구조
```text
[Vercel: 프론트엔드]
   ↓
[Railway: API / queue / analytics]
   ↓
[Google Sheets]
```

### 하지만 MVP 결론
현재 요구사항만 보면 **Vercel 단일 프로젝트**가 가장 단순하다.

다만 현재 저장소는 `output: standalone` 과 `Dockerfile` 을 포함하고 있어,
Railway 에도 바로 올릴 수 있게 준비되어 있다.

---

## 17. 테스트 전략

## 17-1. 단위 테스트
- 부호 파서
- 분수 파서
- 누적합 계산
- 수직선 범위 계산
- 문제 검증기

## 17-2. 통합 테스트
- API 요청 검증
- Sheets append payload 생성
- 로그 flush 실패 후 재시도

## 17-3. E2E 테스트
- 입장 → 모델 선택 → 문항 풀이 → 종료
- 토끼 모델 `H01` 전체 시나리오
- 모바일 뷰포트 탭/터치 시나리오

## 17-4. 꼭 넣어야 할 회귀 테스트
- `-(+3)-(-5)+7`
- `(+2/3)-(-5/6)-(+1/2)`
- `(+2.4)-(-1.1)-(+0.5)`

---

## 18. 성능과 안정성

### 최소 요구
- 첫 화면 로딩 빠름
- 이미지 자산 최소화
- 문제 데이터는 정적 import
- 애니메이션은 짧고 가볍게

### 로그 안정성
- 로컬 큐 보관
- 네트워크 실패 시 재전송
- 중복 전송 대비 `event_id` 포함 가능
- `beforeunload`, `visibilitychange(hidden)` 에서 `sendBeacon` 기반 flush 시도

### 오프라인 대응
- 완전 오프라인 지원은 MVP 범위 밖
- 단, 네트워크 순간 끊김 시 로컬 큐 유지

---

## 19. UI/UX 구현 세부 지침

- 한국어 문장 중심
- 한 화면에 조작 1개 + 피드백 1개 원칙
- 색맹 대응을 위해
  - 양수: 파란색 + 동그라미/오른쪽 화살표
  - 음수: 주황색/빨간색 + 세모/왼쪽 화살표
- 버튼 크기 크게
- 수직선 숫자와 눈금은 태블릿에서도 충분히 크게 표시
- 실패 피드백은 질책하지 않고 이유 중심으로 제시
- 셈돌 모델은 숫자 카운트만 바꾸지 말고 돌의 생성/삭제가 실제 토큰 애니메이션으로 보이게 구현
- `postman` 모델은 내부 ID 로만 유지하고, 학생에게는 기본적으로 `카드 점수 미션` 이라는 이름을 사용
- 카드 점수 미션은 `보상/벌점`, `들어옴/나감` 을 한눈에 구분할 수 있는 큰 장면 카드 4종과 점수판 애니메이션을 제공
- 카드 점수 미션의 누적 기록은 비어 있는 텍스트 박스가 아니라 스티커형 장면 모음으로 보여 주어야 함
- 첫 화면은 별도 랜딩 없이 제목과 중앙 정렬 로그인 카드 1개만 둔다
- 로그인 화면은 학교, 학년, 반, 번호 입력과 단일 CTA 만 남기고 보조 패널은 제거한다
- 로비 화면은 모델별 Stage Preview 와 세트별 짧은 난이도 이름, Start 버튼을 포함하는 큰 선택 카드 중심으로 구성한다
- 플레이 화면 공통 상단은 문제 번호, 현재 식, 미션 보상 라벨을 묶은 압축형 헤더로 구성한다

---

## 20. 단계별 개발 순서 제안

### 1단계
- 입장 화면
- 세션 생성
- 문제 은행 로딩
- 토끼 모델 우선 완성

### 현재 구현 완료 항목
- 입장/로비/세트/결과 흐름
- 3개 모델 기본 상호작용
- 셈돌 모델 준비/보드 토큰 애니메이션 및 0쌍 소거 연출
- Google Sheets append API
- 로컬 큐 기반 flush
- 유리수 엔진 단위 테스트
- Railway 용 standalone/Docker 배포 준비

---

## 21. 완료 정의

다음이 모두 되면 MVP 완료로 본다.

- 학생이 학교/학년/반/번호를 입력할 수 있다
- 모델 3개가 모두 동작한다
- 각 모델 하/중/상 세트가 열린다
- 문항별 도전 회차가 남는다
- 단계별 정오답 로그가 Google Sheets 에 append 된다
- Vercel 배포본에서 실제로 동작한다
- `problem-bank.json` 과 앱 구현이 일치한다

---

## 22. 참고 자료

### 수학 교육 / 모델
- 강경원(2011), 조선대학교 석사학위논문
- 고려대학교 dCollection — 정수 지도 관련 연구
- EBSMath 셈돌 콘텐츠
- Koreascience 정수 모델 관련 논문

### 공식 기술 문서
- Google Sheets API Overview
- Google Sheets API `spreadsheets.values.append`
- Google Sheets API `spreadsheets.values.batchUpdate`
- Google Sheets API Usage Limits
- Google OAuth 2.0 for Server-to-Server Applications
- Google Cloud IAM: Workload Identity Federation / Service Account Key Best Practices
- Next.js Route Handlers
- Vercel Git Deployments
- Vercel Environment Variables
- Railway FastAPI Guide

### 2026-03-22 UI 반영 메모
- 토끼 모델 `split-expression` 단계는 식을 문자 카드 단위로 벌리지 않고, 괄호/연산자/수를 색 블록으로 묶은 한 줄 보드로 렌더링한다.
- 블록 사이 빈칸은 가위형 버튼으로 드러내고, 선택된 끊기는 넓어진 간격과 `/` 배지로 즉시 보여 준다.
- 모바일에서도 블록 보드와 미리보기 카드가 한 묶음으로 유지되도록 가로 스크롤 가능한 패널로 렌더링한다.

### 2026-03-23 UI 톤 정리 메모
- 토끼 `split-expression` 보드의 색상과 그림자는 `--sun`, `--sea`, `--berry`, `--ink-*` 변수를 우선 사용해 전체 앱과 같은 패널 톤으로 맞춘다.

### 2026-03-23 UI 반영 메모
- 로그인 시작 화면은 공통 프레임 헤더 없이 `정수와 유리수의 덧셈 뺄셈 연습` 제목과 중앙 정렬 카드만 사용한다.
- 로그인 카드에는 학교, 학년, 반, 번호 입력과 `로그인` CTA 만 두고 소개성 보조 박스는 두지 않는다.
- 로비 화면은 모델별 색감, Stage Preview, 세트별 목적 문구를 포함하는 대형 선택 카드 3장으로 구성한다.
- `SetPlayer` 상단은 현재 식과 진행 중 미션 정보를 보여 주는 테마형 헤더로 교체한다.
- 셈돌 모델은 현재 단계, 목표 개수, 사용해야 할 돌 종류를 상단 요약 카드로 먼저 보여 준다.
- 토끼 모델은 현재 단계 칩 5개를 고정적으로 보여 주어 학생이 지금 어느 단계에 있는지 바로 이해하게 한다.
### 2026-03-23 입장 폼 레이아웃 보정 메모
- `학년/반/번호` 입력칸은 `min-width: 0`과 `width: 100%`를 사용해 3열 폼에서도 카드 밖으로 넘치지 않도록 유지한다.
### 2026-03-23 로비 단순화 메모
- `AppFrame` 학생 화면 상단 홍보 배너는 제거한다.
- 로비는 학생 정보 한 줄, 모델 제목, 난이도별 시작 버튼만 남긴다.
### 2026-03-23 학생용 용어 정리 메모
- 로비 카드 제목은 내부 모델명이 아니라 학생 활동 이름을 쓴다.
- 로비 카드 본문은 긴 설명 대신 `Step 1`, `Step 2`, `Step 3`만 보여 준다.
- 난이도 표기는 `쉬움`, `보통`, `어려움`으로 통일한다.
### 2026-03-23 학생 화면 단순화 메모
- `AppFrame` 공통 상단 홍보 배너는 제거한다.
- 로비는 학생 정보 한 줄과 모델 선택 버튼만 보여 준다.
- 플레이는 문제 번호, 현재 식, 진행 막대, 핵심 수치만 유지한다.
- 결과는 완료 제목, 요약 수치, 다음 행동 버튼만 유지한다.
