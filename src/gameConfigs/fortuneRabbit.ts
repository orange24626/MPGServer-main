import { BetLevelPool, IconWeight, SpecialRTPPrizeRate, SpecialRTPPrizeRateResult } from "./shared";
import random from "random";
export const FortuneRabbitIconPayRate = [
  { icon: 0, rate: 200 },
  { icon: 2, rate: 100 },
  { icon: 3, rate: 50 },
  { icon: 4, rate: 10 },
  { icon: 5, rate: 5 },
  { icon: 6, rate: 3 },
  { icon: 7, rate: 2 },
];

export const FortuneRabbitIconWeights: IconWeight[][] = [
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 13 },
    { icon: 7, weight: 18 },
    { icon: 8, weight: 12 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 13 },
    { icon: 7, weight: 18 },
    { icon: 8, weight: 12 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 13 },
    { icon: 7, weight: 18 },
    { icon: 8, weight: 12 },
  ],
];

export const FortuneRabbitNewerIconWeights: IconWeight[][] = [
  [
    { icon: 0, weight: 6 },
    { icon: 2, weight: 6 },
    { icon: 3, weight: 7 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 9 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 19 },
    { icon: 8, weight: 16 },
  ],
  [
    { icon: 0, weight: 6 },
    { icon: 2, weight: 6 },
    { icon: 3, weight: 7 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 9 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 19 },
    { icon: 8, weight: 16 },
  ],
  [
    { icon: 0, weight: 6 },
    { icon: 2, weight: 6 },
    { icon: 3, weight: 7 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 9 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 19 },
    { icon: 8, weight: 16 },
  ],
];

export const FortuneRabbitTrialIconWeights: IconWeight[][] = [
  [
    { icon: 0, weight: 5 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 3 },
    { icon: 4, weight: 4 },
    { icon: 5, weight: 5 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 13 },
    { icon: 8, weight: 12 },
  ],
  [
    { icon: 0, weight: 5 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 3 },
    { icon: 4, weight: 4 },
    { icon: 5, weight: 5 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 13 },
    { icon: 8, weight: 12 },
  ],
  [
    { icon: 0, weight: 5 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 3 },
    { icon: 4, weight: 4 },
    { icon: 5, weight: 5 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 13 },
    { icon: 8, weight: 12 },
  ],
];

export const FortuneRabbitBetLimit = [0.05, 0.5, 4];

export const FortuneRabbitDefaultCurrency = "BRL";

export const FortuneRabbitBetLevelPools: BetLevelPool[] = [
  {
    currency: "BRL",
    level: 1,
    min: 0,
    max: 0.5,
    base: 2500,
  },
  {
    currency: "BRL",
    level: 2,
    min: 0.5,
    max: 4,
    base: 20000,
  },
  {
    currency: "BRL",
    level: 3,
    min: 4,
    max: 20,
    base: 100000,
  },
  {
    currency: "BRL",
    level: 4,
    min: 20,
    max: 50,
    base: 250000,
  },
  {
    currency: "BRL",
    level: 5,
    min: 50,
    max: 200,
    base: 1000000,
  },
  {
    currency: "BRL",
    level: 6,
    min: 200,
    max: 400,
    base: 2000000,
  },
];

export const FortuneRabbitSpecialRTPPrizeRate: SpecialRTPPrizeRate[] = [
  {
    serverRtp: 0,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0,
    minWinRate: 1,
  },
  {
    serverRtp: 0.15,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0.15,
    minWinRate: 1,
  },
  {
    serverRtp: 0.25,
    rate: 0.0392,
    minUserRtp: 0.15,
    maxUserRtp: 0.25,
    minWinRate: 1,
  },
  {
    serverRtp: 0.35,
    rate: 0.0377,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 1,
  },
  {
    serverRtp: 0.45,
    rate: 0.0362,
    minUserRtp: 0.35,
    maxUserRtp: 0.45,
    minWinRate: 1,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 1,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 1,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 1,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 1,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 1,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 1,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 1,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.0227,
    maxUserRtp: 0.95,
    minWinRate: 1,
  },
  {
    serverRtp: 0.99,
    rate: 0,
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 1,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 1,
  },
];

export const FortuneRabbitSpecialRTPPrizeRateForNewer: SpecialRTPPrizeRate[] = [
  {
    serverRtp: 0,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0,
    minWinRate: 1,
  },
  {
    serverRtp: 0.15,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0.15,
    minWinRate: 1,
  },
  {
    serverRtp: 0.25,
    rate: 0.0392,
    minUserRtp: 0.15,
    maxUserRtp: 0.25,
    minWinRate: 1,
  },
  {
    serverRtp: 0.35,
    rate: 0.0377,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 1,
  },
  {
    serverRtp: 0.45,
    rate: 0.0362,
    minUserRtp: 0.35,
    maxUserRtp: 0.45,
    minWinRate: 1,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 1,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 1,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 1,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 1,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 1,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 1,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 1,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 1,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 1,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 1,
  },
];

export const FortuneRabbitSpecialRTPPrizeRateForTrail: SpecialRTPPrizeRate[] = [
  {
    serverRtp: 0,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0,
    minWinRate: 1,
  },
  {
    serverRtp: 0.15,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0.15,
    minWinRate: 1,
  },
  {
    serverRtp: 0.25,
    rate: 0.0392,
    minUserRtp: 0.15,
    maxUserRtp: 0.25,
    minWinRate: 1,
  },
  {
    serverRtp: 0.35,
    rate: 0.0377,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 1,
  },
  {
    serverRtp: 0.45,
    rate: 0.0362,
    minUserRtp: 0.35,
    maxUserRtp: 0.45,
    minWinRate: 1,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 1,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 1,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 1,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 1,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 1,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 1,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 1,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 1,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 1,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 1,
  },
];

export const FortuneRabbitSpecialPrizeRate = 0.5;
export const FortuneRabbitSpecialPrizeRateForNewer = 0.7;
export const FortuneRabbitSpecialPrizeRateForTrail = 1;
export const FortuneRabbitSpecialTypes = {
  normal: FortuneRabbitSpecialPrizeRate,
  newer: FortuneRabbitSpecialPrizeRateForNewer,
  trail: FortuneRabbitSpecialPrizeRateForTrail,
};

export const FortuneRabbitSpecialRTPPrizesTypes = {
  normal: FortuneRabbitSpecialRTPPrizeRate,
  newer: FortuneRabbitSpecialRTPPrizeRateForNewer,
  trail: FortuneRabbitSpecialRTPPrizeRateForTrail,
};
export const FortuneRabbitBasicRTP = 0.461;
export const FortuneRabbitBasicRTPForNewer = 0.8523;
export const FortuneRabbitBasicRTPForTrail = 1.6714;

export const FortuneRabbitBasicRTPTypes = {
  normal: FortuneRabbitBasicRTP,
  newer: FortuneRabbitBasicRTPForNewer,
  trail: FortuneRabbitBasicRTPForTrail,
};

export const FortuneRabbitSpecialUserRateRelation = (
  serverRtp: number,
  limitType: keyof typeof FortuneRabbitSpecialTypes,
): SpecialRTPPrizeRateResult[] => {
  //todo: serverRtp是运营商RTP由公式转化而来
  const FortuneRabbitSpecialRTP = serverRtp - FortuneRabbitBasicRTPTypes[limitType];
  const configs = FortuneRabbitSpecialRTPPrizesTypes[limitType];
  return configs.map((p, index) => {
    const lastConf = configs[index - 1];
    const happenedRate = (lastConf?.rate || 0) * FortuneRabbitSpecialTypes[limitType];
    // const maxWinRate = happenedRate && FortuneRabbitSpecialRTP > 0 ? FortuneRabbitSpecialRTP / happenedRate : 0;
    const minBetCount = happenedRate ? 1 / happenedRate / 10 : 1000000000;

    // const rate = limitType==='newer' ? random.float(1, 2) : limitType==='normal' ? random.float(1.5, 2.5) : random.float(2.5, 3.5)

    // const happenedRate = rate / 100
    let maxWinRate = FortuneRabbitSpecialRTP / happenedRate;
    maxWinRate = maxWinRate < 20 ? 20 : maxWinRate;
    // const minBetCount = 1 / happenedRate / 10;
    return {
      ...p,
      happenedRate,
      minWinRate: maxWinRate,
      maxWinRate: maxWinRate,
      minBetCount,
      lineRate: 1,
    };
  });
};
