import type { Difficulty, ModelId } from "@/lib/types";

type ModelInsight = {
  id: ModelId;
  shortName: string;
  badge: string;
  title: string;
  meaning: string;
  bestUse: string;
  intent: string;
  limitation: string;
  hook: string;
  missionLabel: string;
  rewardLabel: string;
  accentClass: string;
  accentSoftClass: string;
  accentTextClass: string;
  iconText: string;
  stageTitle: string;
  stageBody: string;
  quickPoints: string[];
};

export const modelInsights: ModelInsight[] = [
  {
    id: "counting-stones",
    shortName: "Stones",
    badge: "조작 중심",
    title: "돌 놓기",
    meaning:
      "양돌과 음돌이 만나면 0이 된다는 구조를 눈앞에서 보이게 해 주는 모델입니다.",
    bestUse:
      "서로 다른 부호가 만나 소거될 때, 절댓값의 차가 왜 남는지 시각적으로 이해시키는 데 적합합니다.",
    intent:
      "정답을 외우기보다 반대수와 0쌍의 구조를 손으로 확인하게 만드는 데 초점을 둡니다.",
    limitation:
      "분수로 갈수록 돌 1개의 의미가 추상화되고, 뺄셈에서 0쌍을 추가하는 발상이 처음에는 낯설 수 있습니다.",
    hook: "돌을 놓고 없애면서 0쌍을 눈으로 확인하는 보드형 미션",
    missionLabel: "돌 보드 챌린지",
    rewardLabel: "0쌍 연속 성공",
    accentClass:
      "from-sky-100 via-cyan-50 to-white border-sky-200/80 shadow-[0_24px_42px_rgba(14,165,233,0.14)]",
    accentSoftClass:
      "from-sky-500/15 via-cyan-400/12 to-transparent",
    accentTextClass: "text-sky-950",
    iconText: "+ -",
    stageTitle: "양돌과 음돌이 부딪히는 보드",
    stageBody: "직접 올리고 지우면서 남는 수를 바로 읽습니다.",
    quickPoints: ["돌 놓기", "0쌍 찾기", "답 쓰기"],
  },
  {
    id: "postman",
    shortName: "Cards",
    badge: "장면 중심",
    title: "점수 카드",
    meaning:
      "점수판에 보상 카드와 벌점 카드가 들어오거나 나가는 장면으로 식을 읽어 보는 방식입니다.",
    bestUse:
      "`-(-a)`처럼 부호가 겹친 식을 점수가 커지거나 작아지는 장면으로 바꿔 생각할 때 특히 잘 맞습니다.",
    intent:
      "연산 기호와 수의 부호를 따로 읽게 해서, 학생이 식을 사건의 흐름으로 직관적으로 이해하게 만드는 데 목적이 있습니다.",
    limitation:
      "카드의 움직임이 충분히 직관적이지 않으면 장면 고르기가 암기형 문제처럼 느껴질 수 있어 시각 피드백이 중요합니다.",
    hook: "점수판 안팎으로 카드가 드나드는 장면을 고르는 스토리형 미션",
    missionLabel: "카드 쇼 스테이지",
    rewardLabel: "장면 카드 수집",
    accentClass:
      "from-emerald-50 via-white to-sky-50 border-emerald-200/80 shadow-[0_24px_42px_rgba(16,185,129,0.14)]",
    accentSoftClass:
      "from-emerald-500/16 via-sky-400/12 to-transparent",
    accentTextClass: "text-emerald-950",
    iconText: "CARD",
    stageTitle: "점수판에 카드가 들어오고 나가는 무대",
    stageBody: "각 조각을 장면 카드로 바꾸고 마지막 숫자를 맞힙니다.",
    quickPoints: ["장면 고르기", "점수 바꾸기", "답 쓰기"],
  },
  {
    id: "rabbit-sign-parser",
    shortName: "Rabbit",
    badge: "기호 중심",
    title: "점프 계산",
    meaning:
      "식을 항 단위로 끊고 부호를 정리한 뒤, 토끼가 수직선을 따라 움직이면서 계산하는 모델입니다.",
    bestUse:
      "괄호와 부호가 겹친 식에서 항별 최종 부호를 명확히 판정하고 계산 순서를 보이기에 좋습니다.",
    intent:
      "구문 분석, 부호 결정, 이동 계산을 분리해 학생이 어디서 막히는지 단계별로 드러내려는 설계입니다.",
    limitation:
      "의미 이해 없이 절차만 외우는 방향으로 흐를 수 있어 다른 모델과 연결해 사용하는 것이 중요합니다.",
    hook: "식을 끊고 부호를 정리한 뒤 수직선 위에서 점프하는 단계형 미션",
    missionLabel: "토끼 점프 미션",
    rewardLabel: "단계 클리어",
    accentClass:
      "from-amber-50 via-white to-rose-50 border-amber-200/80 shadow-[0_24px_42px_rgba(245,158,11,0.14)]",
    accentSoftClass:
      "from-amber-400/16 via-rose-400/12 to-transparent",
    accentTextClass: "text-amber-950",
    iconText: "0 ->",
    stageTitle: "항을 끊고, 읽고, 점프하는 수직선 코스",
    stageBody: "한 번에 계산하지 않고 단계별로 진행하는 분석형 플레이입니다.",
    quickPoints: ["식 끊기", "부호 정리", "점프하기"],
  },
];

export const difficultyMissionLabels: Record<Difficulty, string> = {
  low: "빠르게 감 잡기",
  medium: "흐름 이어서 풀기",
  high: "여러 부호 겹치기",
};

export function getModelInsight(modelId: ModelId) {
  return modelInsights.find((model) => model.id === modelId) ?? modelInsights[0];
}
