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
    shortName: "Courier",
    badge: "이야기 중심",
    title: "우체부 모델",
    meaning:
      "가져옴과 가져감, 보상 카드와 벌점 카드를 조합해 연산 기호와 수의 부호를 분리해 보는 모델입니다.",
    bestUse:
      "`-(-a)`처럼 부호가 중첩된 식을 사건의 변화로 번역해 설명할 때 특히 효과적입니다.",
    intent:
      "빼기를 단순 계산 부호가 아니라 실제 변화로 느끼게 하여 기호 해석 부담을 줄이는 데 목적이 있습니다.",
    limitation:
      "이야기 맥락이 학생에게 더 큰 부담이 되면 수학 개념보다 서사 이해가 앞설 수 있습니다.",
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
