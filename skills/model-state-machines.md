# Skill: model-state-machines

## 목적
세 모델의 학습 단계를 섞지 않고 상태 기계로 안정적으로 구현한다.

## 공통 원칙
- 한 상태에서는 한 종류의 조작만 허용
- 성공 시 다음 상태
- 실패 시 현재 상태 재시도
- 단계별 로그를 남길 것

## 셈돌 모델
- place-initial-stones
- apply-next-term
- add-zero-pair-if-needed
- cancel-pairs
- submit-result

## 우체부 모델
- read-scenario
- choose-action
- animate-delivery
- confirm-net-change
- submit-result

## 토끼 모델
- split-expression
- normalize-signs
- choose-start-point
- move-step-n
- submit-final

## 구현 팁
- 상태 전이는 reducer 또는 명시적 state machine 으로 처리
- 정답 판정 로직을 UI 컴포넌트 안에 흩뿌리지 말 것