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
    id: "rabbit-sign-parser",
    shortName: "Jump",
    badge: "점프 계산",
    title: "점프 계산",
    meaning:
      "식을 항 단위로 끊고 부호를 정리한 뒤, 수직선 위에서 점프하며 계산합니다.",
    bestUse:
      "괄호와 부호가 겹친 식에서 방향과 칸 수를 단계별로 분리해서 이해하기 좋습니다.",
    intent:
      "끊기, 부호 정리, 이동을 따로 보게 해서 학생이 어디서 막히는지 바로 드러내는 데 목적이 있습니다.",
    limitation:
      "의미 없이 절차만 따라가면 기계적으로 풀 수 있으므로 각 단계의 이유를 짧게 확인해야 합니다.",
    hook: "식을 끊고 부호를 읽고 수직선에서 점프하는 단계형 미션",
    missionLabel: "점프 계산",
    rewardLabel: "단계 클리어",
    accentClass:
      "from-amber-50 via-white to-rose-50 border-amber-200/80 shadow-[0_24px_42px_rgba(245,158,11,0.14)]",
    accentSoftClass:
      "from-amber-400/16 via-rose-400/12 to-transparent",
    accentTextClass: "text-amber-950",
    iconText: "0 ->",
    stageTitle: "식을 끊고, 읽고, 점프하는 수직선 코스",
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
