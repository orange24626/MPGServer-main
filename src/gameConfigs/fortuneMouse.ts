import { BetLevelPool, IconWeight, SpecialRTPPrizeRate, SpecialRTPPrizeRateResult } from "./shared";

import random from "random";

export const FortuneMouseIconPayRate = [
  { icon: 0, rate: 300 },
  { icon: 1, rate: 100 },
  { icon: 2, rate: 50 },
  { icon: 3, rate: 30 },
  { icon: 4, rate: 15 },
  { icon: 5, rate: 5 },
  { icon: 6, rate: 3 },
];

export const FortuneMouseIconWeights: IconWeight[][] = [
  [
    { icon: 0, weight: 2 },
    { icon: 1, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 8 },
    { icon: 4, weight: 12 },
    { icon: 5, weight: 18 },
    { icon: 6, weight: 20 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 1, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 8 },
    { icon: 4, weight: 12 },
    { icon: 5, weight: 18 },
    { icon: 6, weight: 20 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 1, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 8 },
    { icon: 4, weight: 12 },
    { icon: 5, weight: 18 },
    { icon: 6, weight: 20 },
  ],
];

export const FortuneMouseNewerIconWeights = [
  [
    { icon: 0, weight: 3 },
    { icon: 1, weight: 5 },
    { icon: 2, weight: 5 },
    { icon: 3, weight: 8 },
    { icon: 4, weight: 12 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 1, weight: 5 },
    { icon: 2, weight: 5 },
    { icon: 3, weight: 8 },
    { icon: 4, weight: 12 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 1, weight: 5 },
    { icon: 2, weight: 5 },
    { icon: 3, weight: 8 },
    { icon: 4, weight: 12 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
  ],
];

export const FortuneMouseTrialIconWeights = [
  [
    { icon: 0, weight: 3 },
    { icon: 1, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 11 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 1, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 11 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 1, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 11 },
  ],
];

export const FortuneMouseBetLimit = [0.1, 1, 3, 10];

export const FortuneMouseDefaultCurrency = "BRL";

export const FortuneMouseBetLevelPools: BetLevelPool[] = [
  { currency: "BRL", level: 1, min: 0, max: 0.5, base: 500 },
  { currency: "BRL", level: 2, min: 1, max: 10, base: 10000 },
  { currency: "BRL", level: 3, min: 15, max: 40, base: 40000 },
  { currency: "BRL", level: 4, min: 45, max: 100, base: 100000 },
  { currency: "BRL", level: 5, min: 105, max: 250, base: 250000 },
  { currency: "BRL", level: 6, min: 300, max: 500, base: 500000 },
];

export const FortuneMouseSpecialRTPPrizeRate: SpecialRTPPrizeRate[] = [
  {
    serverRtp: 0.15,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0.15,
    minWinRate: 0,
  },
  {
    serverRtp: 0.25,
    rate: 0.0392,
    minUserRtp: 0.15,
    maxUserRtp: 0.25,
    minWinRate: 20,
  },
  {
    serverRtp: 0.35,
    rate: 0.0377,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 20,
  },
  {
    serverRtp: 0.45,
    rate: 0.0362,
    minUserRtp: 0.35,
    maxUserRtp: 0.45,
    minWinRate: 20,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 20,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 20,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 20,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 20,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 20,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 20,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 20,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 20,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.9,
    maxUserRtp: 0.99,
    minWinRate: 20,
  },
  {
    serverRtp: 1,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 20,
  },
];

export const FortuneMouseSpecialRTPPrizeRateForNewer: SpecialRTPPrizeRate[] = [
  {
    serverRtp: 0.15,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0.15,
    minWinRate: 0,
  },
  {
    serverRtp: 0.25,
    rate: 0.0392,
    minUserRtp: 0.15,
    maxUserRtp: 0.25,
    minWinRate: 0,
  },
  {
    serverRtp: 0.35,
    rate: 0.0377,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 0,
  },
  {
    serverRtp: 0.45,
    rate: 0.0362,
    minUserRtp: 0.35,
    maxUserRtp: 0.45,
    minWinRate: 20,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 20,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 20,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 20,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 20,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 20,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 20,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 20,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 20,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.9,
    maxUserRtp: 0.99,
    minWinRate: 20,
  },
  {
    serverRtp: 0,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 20,
  },
];

export const FortuneMouseSpecialRTPPrizeRateForTrail: SpecialRTPPrizeRate[] = [
  {
    serverRtp: 0.15,
    rate: 0.0407,
    minUserRtp: 0,
    maxUserRtp: 0.15,
    minWinRate: 0,
  },
  {
    serverRtp: 0.25,
    rate: 0.0392,
    minUserRtp: 0.15,
    maxUserRtp: 0.25,
    minWinRate: 0,
  },
  {
    serverRtp: 0.35,
    rate: 0.0377,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 0,
  },
  {
    serverRtp: 0.45,
    rate: 0.0362,
    minUserRtp: 0.35,
    maxUserRtp: 0.45,
    minWinRate: 30,
  },
  {
    serverRtp: 0.55,
    rate: 0.00347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 30,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 30,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 30,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 30,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 30,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 30,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 30,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 50,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.9,
    maxUserRtp: 0.99,
    minWinRate: 100,
  },
  {
    serverRtp: 1,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 100,
  },
];

export const FortuneMouseSpecialPrizeRate = 0.7;
export const FortuneMouseSpecialPrizeRateForNewer = 0.7;
export const FortuneMouseSpecialPrizeRateForTrail = 1;

export const FortuneMouseSpecialTypes = {
  normal: FortuneMouseSpecialPrizeRate,
  newer: FortuneMouseSpecialPrizeRateForNewer,
  trail: FortuneMouseSpecialPrizeRateForTrail,
};

export const FortuneMouseSpecialRTPPrizesTypes = {
  normal: FortuneMouseSpecialRTPPrizeRate,
  newer: FortuneMouseSpecialRTPPrizeRateForNewer,
  trail: FortuneMouseSpecialRTPPrizeRateForTrail,
};
export const FortuneMouseBasicRTP = 0.5559;
export const FortuneMouseBasicRTPForNewer = 0.8095;
export const FortuneMouseBasicRTPForTrail = 1.1439;

export const FortuneMouseBasicRTPTypes = {
  normal: FortuneMouseBasicRTP,
  newer: FortuneMouseBasicRTPForNewer,
  trail: FortuneMouseBasicRTPForTrail,
};

export const FortuneMouseSpecialUserRateRelation = (
  serverRtp: number,
  limitType: keyof typeof FortuneMouseSpecialTypes,
): SpecialRTPPrizeRateResult[] => {
  //todo: serverRtp是运营商RTP由公式转化而来
  const FortuneMouseSpecialRTP = serverRtp - FortuneMouseBasicRTPTypes[limitType];
  const configs = FortuneMouseSpecialRTPPrizesTypes[limitType];
  return configs.map((p, index) => {
    const lastConf = configs[index - 1];
    const happenedRate = (lastConf?.rate || 0) * FortuneMouseSpecialTypes[limitType];
    let maxWinRate = (FortuneMouseSpecialRTP / happenedRate) * 5;
    // let minWinRate = maxWinRate * 0.75;
    // maxWinRate = maxWinRate * 1.25;
    // const rate = limitType==='newer' ? random.float(1, 2) : limitType==='normal' ? random.float(1.5, 2.5) : random.float(2.5, 3.5)
    // const happenedRate = rate / 100
    // let maxWinRate = (FortuneMouseSpecialRTP / happenedRate) * 5;
    let minWinRate = maxWinRate * 0.75 < 50 ? 50 : maxWinRate * 0.75;
    maxWinRate = minWinRate < maxWinRate ? maxWinRate * 1.25 : minWinRate * 2.5;
    const minBetCount = 1 / happenedRate / 10;
    return {
      ...p,
      happenedRate,
      maxWinRate,
      minWinRate,
      minBetCount,
      lineRate: 5,
    };
  });
};
