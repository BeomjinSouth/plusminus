# PlusMinus Lab

유리수의 덧셈과 뺄셈을 `셈돌 모델`, `우체부 모델`, `토끼 부호-분해 모델`로 학습하는 Next.js 웹앱입니다.  
학생은 학교/학년/반/번호를 입력하고 세션을 시작한 뒤, 모델과 난이도 세트를 골라 7문항씩 단계형 인터랙션으로 풉니다.

## 현재 구현 범위

- `Next.js 16 + React 19 + TypeScript + Tailwind CSS 4`
- 입장 화면, 로비, 세트 플레이, 결과 화면
- 3개 모델 × 하/중/상 세트
- 고정형 문제 은행 `problem-bank.json`
- 정확한 유리수 파서 및 분수 기반 연산
- Google Sheets append-only 로깅 API
- 시트 탭과 헤더 자동 준비
- 페이지 이탈 시 `sendBeacon` 기반 로그 flush
- `output: standalone` + `Dockerfile` 기반 Railway 배포 준비
- 로컬 개발 시 Google Sheets 환경 변수가 없으면 noop 로거로 동작

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

## 테스트와 빌드

```bash
npm run test
npm run build
```

## 환경 변수

`.env.example` 을 기준으로 `.env.local` 을 구성합니다.

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_PROJECT_ID`
- `APP_VERSION`
- `LOG_FLUSH_MAX_BATCH`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`

서비스 계정 키와 시트 ID 가 없으면 앱은 동작하지만, Sheets 로 실제 append 하지는 않습니다.

## 운영 체크

- 상태 확인: `GET /api/health`
- 시트는 첫 쓰기 시 `sessions`, `attempt_events`, `set_results` 탭이 자동 준비됩니다.
- 학생이 세트 도중 탭을 닫거나 다른 페이지로 이동할 때는 남아 있는 시도 로그를 먼저 전송하려고 시도합니다.

## 주요 문서

- `PRD.md`: 제품 목표, 학습 흐름, 모델 해석
- `IMPLEMENTATION.md`: 구현 구조, API, 로깅, 배포
- `DEPLOYMENT.md`: Vercel / Railway 배포 절차
- `QUESTION_BANK.md`: 고정형 문항 설계
- `problem-bank.json`: 실제 앱이 읽는 문제 메타데이터
- `AGENTS.md`: 저장소 작업 규칙
- `REFERENCES.md`: 수학교육/기술 참고 링크
