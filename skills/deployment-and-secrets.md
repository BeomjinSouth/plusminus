# Skill: deployment-and-secrets

## 목적
Vercel/Railway 배포와 비밀값 관리를 안전하게 수행한다.

## Vercel 우선 원칙
- Next.js 단일 저장소는 Vercel 우선
- preview / production 환경 분리
- 환경 변수는 프로젝트 설정에서 관리

## 비밀값 원칙
- Google 서비스 계정 키를 저장소에 올리지 않음
- 클라이언트 코드에서 읽지 않음
- 서버 전용 환경 변수로만 사용

## 배포 체크리스트
1. 환경 변수 입력
2. 테스트 스프레드시트 연결 확인
3. production branch 확인
4. preview 배포 확인
5. 실제 append 로그 확인

## 주의
- 환경 변수 변경 후에는 새 배포가 필요
- 로컬 `.env.local` 과 배포 환경 값을 혼동하지 말 것