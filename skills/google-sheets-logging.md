# Skill: google-sheets-logging

## 목적
학생의 단계별 시도 기록을 Google Sheets 에 안정적으로 남긴다.

## 기본 원칙
- append-only
- 한 이벤트 한 행
- 가능한 한 이벤트를 묶어서 전송
- 실패 시 재시도 큐 유지

## 권장 구조
- 클라이언트 로컬 큐
- 문항 종료/단계 성공 시 flush
- 서버 Route Handler 에서 Sheets append 호출

## 필수 컬럼
- session_id
- model
- difficulty
- problem_id
- step_id
- attempt_no
- input_raw
- normalized_input
- is_correct
- response_time_ms
- timestamp

## 주의
- 학생 식별 정보는 최소한으로만 저장
- 기존 행 수정 대신 새 행 추가
- 중복 전송 방지를 위해 event_id 도 검토