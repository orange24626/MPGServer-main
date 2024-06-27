import { BetLevelPool, IconWeight, SpecialRTPPrizeRate, SpecialRTPPrizeRateResult } from "./shared";

import random from "random";

export const FortuneTigerIconPayRate = [
  { icon: 0, rate: 250 },
  { icon: 2, rate: 100 },
  { icon: 3, rate: 25 },
  { icon: 4, rate: 10 },
  { icon: 5, rate: 8 },
  { icon: 6, rate: 5 },
  { icon: 7, rate: 3 },
];

export const FortuneTigerIconWeights: IconWeight[][] = [
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 9 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 20 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 9 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 20 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 9 },
    { icon: 5, weight: 13 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 20 },
  ],
];

export const FortuneTigerNewerIconWeights = [
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
];

export const FortuneTigerTrialIconWeights = [
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 7 },
    { icon: 6, weight: 8 },
    { icon: 7, weight: 9 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 7 },
    { icon: 6, weight: 8 },
    { icon: 7, weight: 9 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 7 },
    { icon: 6, weight: 8 },
    { icon: 7, weight: 9 },
  ],
];

export const FortuneTigerBetLimit = [0.08, 0.8, 3, 10];

export const FortuneTigerDefaultCurrency = "BRL";

export const FortuneTigerBetLevelPools: BetLevelPool[] = [
  { currency: "BRL", level: 1, min: 0, max: 0.4, base: 1000 },
  { currency: "BRL", level: 2, min: 0.8, max: 4, base: 100000 },
  { currency: "BRL", level: 3, min: 8, max: 30, base: 75000 },
  { currency: "BRL", level: 4, min: 32, max: 100, base: 250000 },
  { currency: "BRL", level: 5, min: 105, max: 250, base: 625000 },
  { currency: "BRL", level: 6, min: 300, max: 500, base: 1250000 },
];

export const FortuneTigerSpecialRTPPrizeRate: SpecialRTPPrizeRate[] = [
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
    minWinRate: 3,
  },
  {
    serverRtp: 0.35,
    rate: 0.0377,
    minUserRtp: 0.25,
    maxUserRtp: 0.35,
    minWinRate: 3,
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
    serverRtp: 1,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 50,
  },
];

export const FortuneTigerSpecialRTPPrizeRateForNewer: SpecialRTPPrizeRate[] = [
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
    serverRtp: 1,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 50,
  },
];

export const FortuneTigerSpecialRTPPrizeRateForTrail: SpecialRTPPrizeRate[] = [
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
    minWinRate: 100,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 100,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 100,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 100,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 100,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 100,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 100,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 100,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 100,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.95,
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

export const FortuneTigerSpecialPrizeRate = 0.7;
export const FortuneTigerSpecialPrizeRateForNewer = 0.7;
export const FortuneTigerSpecialPrizeRateForTrail = 1;
export const FortuneTigerSpecialTypes = {
  normal: FortuneTigerSpecialPrizeRate,
  newer: FortuneTigerSpecialPrizeRateForNewer,
  trail: FortuneTigerSpecialPrizeRateForTrail,
};

export const FortuneTigerSpecialRTPPrizesTypes = {
  normal: FortuneTigerSpecialRTPPrizeRate,
  newer: FortuneTigerSpecialRTPPrizeRateForNewer,
  trail: FortuneTigerSpecialRTPPrizeRateForTrail,
};
export const FortuneTigerBasicRTP = 0.389;
export const FortuneTigerBasicRTPForNewer = 0.8148;
export const FortuneTigerBasicRTPForTrail = 1.038;

export const FortuneTigerBasicRTPTypes = {
  normal: FortuneTigerBasicRTP,
  newer: FortuneTigerBasicRTPForNewer,
  trail: FortuneTigerBasicRTPForTrail,
};

export const FortuneTigerSpecialUserRateRelation = (
  serverRtp: number,
  limitType: keyof typeof FortuneTigerSpecialTypes,
): SpecialRTPPrizeRateResult[] => {
  const FortuneTigerSpecialRTP = serverRtp - FortuneTigerBasicRTPTypes[limitType];
  const configs = FortuneTigerSpecialRTPPrizesTypes[limitType];
  return configs.map((p, index) => {
    const lastConf = configs[index - 1];
    const happenedRate = (lastConf?.rate || 0) * FortuneTigerSpecialTypes[limitType];
    let maxWinRate = (FortuneTigerSpecialRTP / happenedRate) * 5;
    // let minWinRate = maxWinRate * 0.75;
    // maxWinRate = maxWinRate * 1.25;
    // const rate = limitType==='newer' ? random.float(1, 2) : limitType==='normal' ? random.float(1.5, 2.5) : random.float(2.5, 3.5)
    // const happenedRate = rate / 100
    // let maxWinRate = (FortuneTigerSpecialRTP / happenedRate) * 5;
    let minWinRate = maxWinRate * 0.75 < 50 ? 50 : maxWinRate * 0.75;
    maxWinRate = minWinRate < maxWinRate ? maxWinRate * 1.25 : minWinRate * 2.5
    const minBetCount = 1 / happenedRate / 10;
    return {
      ...p,
      happenedRate,
      maxWinRate,
      minBetCount,
      minWinRate,
      lineRate: 5,
    };
  });
};
