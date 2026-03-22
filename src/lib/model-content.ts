import type { ModelId } from "@/lib/types";

type ModelInsight = {
  id: ModelId;
  shortName: string;
  badge: string;
  title: string;
  meaning: string;
  bestUse: string;
  intent: string;
  limitation: string;
};

export const modelInsights: ModelInsight[] = [
  {
    id: "counting-stones",
    shortName: "Stones",
    badge: "조작 중심",
    title: "셈돌 모델",
    meaning:
      "양돌과 음돌이 만나면 0이 된다는 구조를 눈앞에서 보이게 해 주는 모델입니다.",
    bestUse:
      "서로 다른 부호가 만나 소거될 때, 절댓값의 차가 왜 남는지 시각적으로 이해시키는 데 적합합니다.",
    intent:
      "정답을 외우기보다 반대수와 0쌍의 구조를 손으로 확인하게 만드는 데 초점을 둡니다.",
    limitation:
      "분수로 갈수록 돌 1개의 의미가 추상화되고, 뺄셈에서 0쌍을 추가하는 발상이 처음에는 낯설 수 있습니다.",
  },
  {
    id: "postman",
    shortName: "Cards",
    badge: "장면 중심",
    title: "카드 점수 미션",
    meaning:
      "점수판에 보상 카드와 벌점 카드가 들어오거나 나가는 장면으로 식을 읽어 보는 방식입니다.",
    bestUse:
      "`-(-a)`처럼 부호가 겹친 식을 점수가 커지거나 작아지는 장면으로 바꿔 생각할 때 특히 잘 맞습니다.",
    intent:
      "연산 기호와 수의 부호를 따로 읽게 해서, 학생이 식을 사건의 흐름으로 직관적으로 이해하게 만드는 데 목적이 있습니다.",
    limitation:
      "카드의 움직임이 충분히 직관적이지 않으면 장면 고르기가 암기형 문제처럼 느껴질 수 있어 시각 피드백이 중요합니다.",
  },
  {
    id: "rabbit-sign-parser",
    shortName: "Rabbit",
    badge: "기호 중심",
    title: "토끼 부호-분해 모델",
    meaning:
      "식을 항 단위로 끊고 부호를 정리한 뒤, 토끼가 수직선을 따라 움직이면서 계산하는 모델입니다.",
    bestUse:
      "괄호와 부호가 겹친 식에서 항별 최종 부호를 명확히 판정하고 계산 순서를 보이기에 좋습니다.",
    intent:
      "구문 분석, 부호 결정, 이동 계산을 분리해 학생이 어디서 막히는지 단계별로 드러내려는 설계입니다.",
    limitation:
      "의미 이해 없이 절차만 외우는 방향으로 흐를 수 있어 다른 모델과 연결해 사용하는 것이 중요합니다.",
  },
];
