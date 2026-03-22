# DEPLOYMENT

작성일: 2026-03-22  
문서 상태: 구현 반영 v1

## 1. 권장 배포 선택

- `Vercel`
  - Next.js 프로젝트라서 가장 단순하다.
  - Preview / Production 분리가 쉽다.
- `Railway`
  - Docker 기반으로 그대로 올리기 좋다.
  - Vercel 대신 단일 호스팅으로 운영하고 싶을 때 적합하다.

## 2. 공통 사전 준비

### 환경 변수

다음 값을 배포 환경에 넣는다.

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_PROJECT_ID=
APP_VERSION=
LOG_FLUSH_MAX_BATCH=10
NEXT_PUBLIC_APP_NAME=PlusMinus Lab
NEXT_PUBLIC_APP_URL=
```

### Google Sheets 준비

- 서비스 계정 이메일을 대상 스프레드시트에 편집자로 공유한다.
- 앱이 처음 로그를 쓸 때 `sessions`, `attempt_events`, `set_results` 시트와 헤더를 자동으로 만든다.
- 먼저 테스트용 스프레드시트로 검증하고, 이후 실제 수업용 시트로 바꾼다.

## 3. Vercel 배포

### 권장 흐름

1. Git 저장소를 Vercel 프로젝트에 연결
2. 위 환경 변수를 `Development`, `Preview`, `Production`에 맞게 입력
3. Production 브랜치 배포
4. `/api/health` 로 상태 확인
5. 학생 입장 후 한 문항을 풀어 Google Sheets append 확인

### 운영 메모

- `APP_VERSION` 은 Git SHA 나 릴리스 번호를 넣는 편이 좋다.
- Preview 환경은 테스트용 스프레드시트를 연결한다.
- private key 는 줄바꿈이 포함된 원문 그대로 넣거나 `\n` 형태로 넣는다.

## 4. Railway 배포

이 저장소에는 `Dockerfile` 이 포함되어 있어서 Railway에서 Docker 기반으로 배포할 수 있다.

### 권장 흐름

1. Git 저장소를 Railway 프로젝트에 연결
2. Dockerfile 사용 배포
3. 위 환경 변수 입력
4. Public Networking 활성화
5. `/api/health` 응답 확인
6. Google Sheets append 확인

### 컨테이너 실행 방식

- `next build` 후 `.next/standalone` 출력으로 실행
- 런타임 엔트리: `node server.js`
- 기본 포트: `3000`

## 5. 배포 후 체크리스트

1. `/api/health` 가 `ok: true` 를 반환하는지 확인
2. `sheetsConfigured` 가 `true` 인지 확인
3. 입장 폼 제출이 되는지 확인
4. 셈돌/우체부/토끼 모델이 모두 열리는지 확인
5. 한 세트 완료 후 `set_results` 시트에 행이 추가되는지 확인
6. 중간 단계 실패 로그가 `attempt_events` 에 남는지 확인

## 6. 문제 발생 시 우선 확인

- 서비스 계정 이메일이 시트에 공유되어 있는가
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` 줄바꿈이 깨지지 않았는가
- Preview/Production 환경에 서로 다른 시트를 쓰는가
- `/api/health` 에서 `sheetsConfigured` 가 `true` 인가
