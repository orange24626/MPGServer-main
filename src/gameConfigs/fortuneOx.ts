import random from "random";

import { BetLevelPool, IconWeight, SpecialRTPPrizeRate, SpecialRTPPrizeRateResult } from "./shared";

export const FortuneOxIconPayRate = [
  { icon: 0, rate: 200 },
  { icon: 2, rate: 100 },
  { icon: 3, rate: 50 },
  { icon: 4, rate: 20 },
  { icon: 5, rate: 10 },
  { icon: 6, rate: 5 },
  { icon: 7, rate: 3 },
];

export const FortuneOxIconWeights: IconWeight[][] = [
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 10 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 16 },
    { icon: 7, weight: 18 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 10 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 16 },
    { icon: 7, weight: 18 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 10 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 16 },
    { icon: 7, weight: 18 },
  ],
];

export const FortuneOxNewerIconWeights = [
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 16 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 16 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 16 },
  ],
];

export const FortuneOxTrialIconWeights = [
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 7 },
    { icon: 3, weight: 9 },
    { icon: 4, weight: 10 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 14 },
    { icon: 7, weight: 17 },
  ],
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 7 },
    { icon: 3, weight: 9 },
    { icon: 4, weight: 10 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 14 },
    { icon: 7, weight: 17 },
  ],
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 7 },
    { icon: 3, weight: 9 },
    { icon: 4, weight: 10 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 14 },
    { icon: 7, weight: 17 },
  ],
];

export const FortuneOxBetLimit = [0.05, 0.5, 4];

export const FortuneOxDefaultCurrency = "BRL";

export const FortuneOxBetLevelPools: BetLevelPool[] = [
  { currency: "BRL", level: 1, min: 0, max: 0.5, base: 1000 },
  { currency: "BRL", level: 2, min: 1, max: 4, base: 8000 },
  { currency: "BRL", level: 3, min: 4.5, max: 20, base: 40000 },
  { currency: "BRL", level: 4, min: 25, max: 50, base: 100000 },
  { currency: "BRL", level: 5, min: 80, max: 200, base: 400000 },
  { currency: "BRL", level: 6, min: 240, max: 400, base: 800000 },
];

export const FortuneOxSpecialRTPPrizeRate: SpecialRTPPrizeRate[] = [
  {
    serverRtp: 0.15,
    rate: 0.407,
    minUserRtp: 0,
    maxUserRtp: 0.15,
    minWinRate: 0,
  },
  {
    serverRtp: 0.25,
    rate: 0.0392,
    minUserRtp: 0.15,
    maxUserRtp: 0.25,
    minWinRate: 50,
  },
  {
    serverRtp: 0.35,
    rate: 0.0377,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 50,
  },
  {
    serverRtp: 0.45,
    rate: 0.0362,
    minUserRtp: 0.35,
    maxUserRtp: 0.45,
    minWinRate: 50,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 50,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 50,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 50,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 50,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 50,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 50,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 50,
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
    minWinRate: 50,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 50,
  },
];

export const FortuneOxSpecialRTPPrizeRateForNewer: SpecialRTPPrizeRate[] = [
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
    minWinRate: 50,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 50,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 50,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 50,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 50,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 50,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 50,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 50,
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
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 50,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 50,
  },
];

export const FortuneOxSpecialRTPPrizeRateForTrail: SpecialRTPPrizeRate[] = [
  {
    serverRtp: 0.15,
    rate: 0,
    minUserRtp: 0,
    maxUserRtp: 0.15,
    minWinRate: 0,
  },
  {
    serverRtp: 0.25,
    rate: 0,
    minUserRtp: 0.15,
    maxUserRtp: 0.25,
    minWinRate: 0,
  },
  {
    serverRtp: 0.35,
    rate: 0,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 0,
  },
  {
    serverRtp: 0.45,
    rate: 0.1037,
    minUserRtp: 0.35,
    maxUserRtp: 0.45,
    minWinRate: 50,
  },
  {
    serverRtp: 0.55,
    rate: 0.0976,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 50,
  },
  {
    serverRtp: 0.65,
    rate: 0.0915,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 50,
  },
  {
    serverRtp: 0.7,
    rate: 0.0854,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 50,
  },
  {
    serverRtp: 0.75,
    rate: 0.0793,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 100,
  },
  {
    serverRtp: 0.8,
    rate: 0.0671,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 100,
  },
  {
    serverRtp: 0.85,
    rate: 0.0549,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 100,
  },
  {
    serverRtp: 0.9,
    rate: 0.0427,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 100,
  },
  {
    serverRtp: 0.95,
    rate: 0.0305,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 100,
  },
  {
    serverRtp: 1,
    rate: 0.0183,
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 100,
  },
  {
    serverRtp: 1.45,
    rate: 0.0301,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 100,
  },
];

export const FortuneOxSpecialPrizeRate = 0.6;
export const FortuneOxSpecialPrizeRateForNewer = 0.6;
export const FortuneOxSpecialPrizeRateForTrail = 0.6;
export const FortuneOxSpecialTypes = {
  normal: FortuneOxSpecialPrizeRate,
  newer: FortuneOxSpecialPrizeRateForNewer,
  trail: FortuneOxSpecialPrizeRateForTrail,
};

export const FortuneOxSpecialRTPPrizesTypes = {
  normal: FortuneOxSpecialRTPPrizeRate,
  newer: FortuneOxSpecialRTPPrizeRateForNewer,
  trail: FortuneOxSpecialRTPPrizeRateForTrail,
};
export const FortuneOxBasicRTP = 0.5099;
export const FortuneOxBasicRTPForNewer = 0.8006;
export const FortuneOxBasicRTPForTrail = 0.9986;

export const FortuneOxBasicRTPTypes = {
  normal: FortuneOxBasicRTP,
  newer: FortuneOxBasicRTPForNewer,
  trail: FortuneOxBasicRTPForTrail,
};

export const FortuneOxSpecialUserRateRelation = (
  serverRtp: number,
  limitType: keyof typeof FortuneOxSpecialTypes,
): SpecialRTPPrizeRateResult[] => {
  //todo: serverRtp是运营商RTP由公式转化而来
  const FortuneOxSpecialRTP = serverRtp - FortuneOxBasicRTPTypes[limitType];
  const configs = FortuneOxSpecialRTPPrizesTypes[limitType];
  return configs.map((p, index) => {
    const lastConf = configs[index - 1];
    const happenedRate = (lastConf?.rate || 0) * FortuneOxSpecialTypes[limitType];
    let maxWinRate = happenedRate ? (FortuneOxSpecialRTP / happenedRate) * 10 : 0;
    // let minWinRate = maxWinRate * 0.75;
    // maxWinRate = maxWinRate * 1.25;
    // const rate = limitType==='newer' ? random.float(1, 2) : limitType==='normal' ? random.float(1.5, 2.5) : random.float(2.5, 3.5)
    // const happenedRate = rate / 100
    // let maxWinRate = (FortuneOxSpecialRTP / happenedRate) * 10;
    let minWinRate = maxWinRate * 0.75 < 100 ? 100 : maxWinRate * 0.75;
    maxWinRate = minWinRate < maxWinRate ? maxWinRate * 1.25 : minWinRate * 2.5;
    const minBetCount = 1 / happenedRate / 10;
    return {
      ...p,
      happenedRate,
      maxWinRate,
      minWinRate,
      minBetCount,
      lineRate: 10,
    };
  });
};
