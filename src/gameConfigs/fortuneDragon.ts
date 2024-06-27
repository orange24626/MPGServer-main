import random from "random";

export const DragonSpecialSpinRateWeights = [
  { rateLook: "2#2", rate: 4, weight: 5 },
  { rateLook: "2#2#2", rate: 6, weight: 6 },
  { rateLook: "2#5", rate: 7, weight: 7 },
  { rateLook: "2#2#5", rate: 9, weight: 9 },
  { rateLook: "5#5", rate: 10, weight: 10 },
  { rateLook: "2#10", rate: 12, weight: 12 },
  { rateLook: "2#5#5", rate: 12, weight: 12 },
  { rateLook: "2#2#10", rate: 14, weight: 18 },
  { rateLook: "5#10", rate: 15, weight: 20 },
  { rateLook: "5#5#5", rate: 15, weight: 20 },
  { rateLook: "2#5#10", rate: 17, weight: 15 },
  { rateLook: "10#10", rate: 20, weight: 12 },
  { rateLook: "5#5#10", rate: 20, weight: 6 },
  { rateLook: "2#10#10", rate: 22, weight: 5 },
  { rateLook: "5#10#10", rate: 25, weight: 4 },
  { rateLook: "10#10#10", rate: 30, weight: 2 },
];

export const DragonSpecialSpinRateWeightsForFive = [
  { rateLook: "2#2", rate: 4, weight: 5 },
  { rateLook: "2#2#2", rate: 6, weight: 6 },
  { rateLook: "2#5", rate: 7, weight: 7 },
  { rateLook: "2#2#5", rate: 9, weight: 9 },
  { rateLook: "5#5", rate: 10, weight: 10 },
  { rateLook: "2#10", rate: 12, weight: 12 },
  { rateLook: "2#5#5", rate: 12, weight: 12 },
  { rateLook: "2#2#10", rate: 14, weight: 18 },
  { rateLook: "5#10", rate: 15, weight: 20 },
  { rateLook: "5#5#5", rate: 15, weight: 20 },
  { rateLook: "2#5#10", rate: 17, weight: 15 },
  { rateLook: "10#10", rate: 20, weight: 12 },
  { rateLook: "5#5#10", rate: 20, weight: 6 },
  { rateLook: "2#10#10", rate: 22, weight: 5 },
  { rateLook: "5#10#10", rate: 25, weight: 4 },
  { rateLook: "10#10#10", rate: 30, weight: 2 },
];

export const DragonSpecialSpinRateWeightsForNewer = [
  { rateLook: "2#2", rate: 4, weight: 10 },
  { rateLook: "2#2#2", rate: 6, weight: 10 },
  { rateLook: "2#5", rate: 7, weight: 10 },
  { rateLook: "2#2#5", rate: 9, weight: 10 },
  { rateLook: "5#5", rate: 10, weight: 10 },
  { rateLook: "2#10", rate: 12, weight: 12 },
  { rateLook: "2#5#5", rate: 12, weight: 12 },
  { rateLook: "2#2#10", rate: 14, weight: 18 },
  { rateLook: "5#10", rate: 15, weight: 20 },
  { rateLook: "5#5#5", rate: 15, weight: 12 },
  { rateLook: "2#5#10", rate: 17, weight: 8 },
  { rateLook: "10#10", rate: 20, weight: 6 },
  { rateLook: "5#5#10", rate: 20, weight: 2 },
  { rateLook: "2#10#10", rate: 22, weight: 2 },
  { rateLook: "5#10#10", rate: 25, weight: 1 },
  { rateLook: "10#10#10", rate: 30, weight: 1 },
];

export const DragonSpecialSpinRateWeightsForNewerForFive = [
  { rateLook: "2#2", rate: 4, weight: 10 },
  { rateLook: "2#2#2", rate: 6, weight: 10 },
  { rateLook: "2#5", rate: 7, weight: 10 },
  { rateLook: "2#2#5", rate: 9, weight: 10 },
  { rateLook: "5#5", rate: 10, weight: 10 },
  { rateLook: "2#10", rate: 12, weight: 12 },
  { rateLook: "2#5#5", rate: 12, weight: 12 },
  { rateLook: "2#2#10", rate: 14, weight: 18 },
  { rateLook: "5#10", rate: 15, weight: 20 },
  { rateLook: "5#5#5", rate: 15, weight: 12 },
  { rateLook: "2#5#10", rate: 17, weight: 8 },
  { rateLook: "10#10", rate: 20, weight: 6 },
  { rateLook: "5#5#10", rate: 20, weight: 2 },
  { rateLook: "2#10#10", rate: 22, weight: 2 },
  { rateLook: "5#10#10", rate: 25, weight: 1 },
  { rateLook: "10#10#10", rate: 30, weight: 1 },
];

export const DragonSpecialSpinRateWeightsForTrail = [
  { rateLook: "2#2", rate: 4, weight: 10 },
  { rateLook: "2#2#2", rate: 6, weight: 10 },
  { rateLook: "2#5", rate: 7, weight: 10 },
  { rateLook: "2#2#5", rate: 9, weight: 10 },
  { rateLook: "5#5", rate: 10, weight: 10 },
  { rateLook: "2#10", rate: 12, weight: 10 },
  { rateLook: "2#5#5", rate: 12, weight: 12 },
  { rateLook: "2#2#10", rate: 14, weight: 12 },
  { rateLook: "5#10", rate: 15, weight: 12 },
  { rateLook: "5#5#5", rate: 15, weight: 12 },
  { rateLook: "2#5#10", rate: 17, weight: 12 },
  { rateLook: "10#10", rate: 20, weight: 15 },
  { rateLook: "5#5#10", rate: 20, weight: 15 },
  { rateLook: "2#10#10", rate: 22, weight: 15 },
  { rateLook: "5#10#10", rate: 25, weight: 15 },
  { rateLook: "10#10#10", rate: 30, weight: 15 },
];

export const DragonSpecialSpinRateWeightsForTrailForFive = [
  { rateLook: "2#2", rate: 4, weight: 10 },
  { rateLook: "2#2#2", rate: 6, weight: 10 },
  { rateLook: "2#5", rate: 7, weight: 10 },
  { rateLook: "2#2#5", rate: 9, weight: 12 },
  { rateLook: "5#5", rate: 10, weight: 12 },
  { rateLook: "2#10", rate: 12, weight: 12 },
  { rateLook: "2#5#5", rate: 12, weight: 15 },
  { rateLook: "2#2#10", rate: 14, weight: 15 },
  { rateLook: "5#10", rate: 15, weight: 15 },
  { rateLook: "5#5#5", rate: 15, weight: 18 },
  { rateLook: "2#5#10", rate: 17, weight: 18 },
  { rateLook: "10#10", rate: 20, weight: 20 },
  { rateLook: "5#5#10", rate: 20, weight: 20 },
  { rateLook: "2#10#10", rate: 22, weight: 22 },
  { rateLook: "5#10#10", rate: 25, weight: 22 },
  { rateLook: "10#10#10", rate: 30, weight: 25 },
];

export const DragonSpecialSpinRateWeightsTypes = {
  normal: DragonSpecialSpinRateWeights,
  newer: DragonSpecialSpinRateWeightsForNewer,
  trail: DragonSpecialSpinRateWeightsForTrail,
};

export const DragonSpecialSpinRateWeightsTypesForFive = {
  normal: DragonSpecialSpinRateWeightsForFive,
  newer: DragonSpecialSpinRateWeightsForNewerForFive,
  trail: DragonSpecialSpinRateWeightsForTrailForFive,
};

export const DragonNormalSpinRateWeights = [
  { rate: 0, weight: 17 },
  { rate: 2, weight: 8 },
  { rate: 5, weight: 4 },
  { rate: 10, weight: 1 },
];
export const DragonNormalSpinRateWeightsForFive = [
  { rate: 0, weight: 17 },
  { rate: 2, weight: 8 },
  { rate: 5, weight: 4 },
  { rate: 10, weight: 1 },
];

export const DragonNormalSpinRateWeightsForNewer = [
  { rate: 1, weight: 20 },
  { rate: 2, weight: 5 },
  { rate: 5, weight: 4 },
  { rate: 10, weight: 1 },
];

export const DragonNormalSpinRateWeightsForNewerForFive = [
  { rate: 1, weight: 17 },
  { rate: 2, weight: 8 },
  { rate: 5, weight: 4 },
  { rate: 10, weight: 1 },
];

export const DragonNormalSpinRateWeightsForTrail = [
  { rate: 1, weight: 14 },
  { rate: 2, weight: 5 },
  { rate: 5, weight: 4 },
  { rate: 10, weight: 2 },
];

export const DragonNormalSpinRateWeightsForTrailForFive = [
  { rate: 1, weight: 10 },
  { rate: 2, weight: 7 },
  { rate: 5, weight: 4 },
  { rate: 10, weight: 5 },
];

export const DragonNormalSpinRateWeightsTypes = {
  normal: DragonNormalSpinRateWeights,
  newer: DragonNormalSpinRateWeightsForNewer,
  trail: DragonNormalSpinRateWeightsForTrail,
};

export const DragonNormalSpinRateWeightsTypesForFive = {
  normal: DragonNormalSpinRateWeightsForFive,
  newer: DragonNormalSpinRateWeightsForNewerForFive,
  trail: DragonNormalSpinRateWeightsForTrailForFive,
};

export const FortuneDragonCardIconMap: Map<number, number> = new Map([
  [2, 0],
  [3, 2],
  [4, 3],
  [5, 4],
  [6, 5],
  [7, 6],
  [8, 7],
  [1, -1],
]);

import { BetLevelPool, IconWeight, SpecialRTPPrizeRate, SpecialRTPPrizeRateResult } from "./shared";

export const FortuneDragonIconPayRate = [
  { icon: 0, rate: 100 },
  { icon: 2, rate: 50 },
  { icon: 3, rate: 25 },
  { icon: 4, rate: 10 },
  { icon: 5, rate: 5 },
  { icon: 6, rate: 3 },
  { icon: 7, rate: 2 },
];

export const FortuneDragonIconWeights: IconWeight[][] = [
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 21 },
  ],
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 21 },
  ],
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 21 },
  ],
];

export const FortuneDragonIconWeightsForFive: IconWeight[][] = [
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
];

export const FortuneDragonIconWeightsForSpecial: IconWeight[][] = [
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 24 },
  ],
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 24 },
  ],
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 4 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 8 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 24 },
  ],
];

export const FortuneDragonIconWeightsForSpecialForFive: IconWeight[][] = [
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
  [
    { icon: 0, weight: 2 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 12 },
  ],
];

export const FortuneDragonNewerIconWeights = [
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 11 },
    { icon: 5, weight: 18 },
    { icon: 6, weight: 21 },
    { icon: 7, weight: 25 },
  ],
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 11 },
    { icon: 5, weight: 18 },
    { icon: 6, weight: 21 },
    { icon: 7, weight: 25 },
  ],
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 6 },
    { icon: 4, weight: 11 },
    { icon: 5, weight: 18 },
    { icon: 6, weight: 21 },
    { icon: 7, weight: 25 },
  ],
];

export const FortuneDragonNewerIconWeightsForFive = [
  [
    { icon: 0, weight: 5 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 13 },
    { icon: 7, weight: 16 },
  ],
  [
    { icon: 0, weight: 5 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 13 },
    { icon: 7, weight: 16 },
  ],
  [
    { icon: 0, weight: 5 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 10 },
    { icon: 6, weight: 13 },
    { icon: 7, weight: 16 },
  ],
];
export const FortuneDragonNewerIconWeightsForSpecial = [
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 6 },
    { icon: 3, weight: 11 },
    { icon: 4, weight: 16 },
    { icon: 5, weight: 25 },
    { icon: 6, weight: 30 },
    { icon: 7, weight: 40 },
  ],
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 6 },
    { icon: 3, weight: 11 },
    { icon: 4, weight: 16 },
    { icon: 5, weight: 25 },
    { icon: 6, weight: 30 },
    { icon: 7, weight: 40 },
  ],
  [
    { icon: 0, weight: 1 },
    { icon: 2, weight: 6 },
    { icon: 3, weight: 11 },
    { icon: 4, weight: 16 },
    { icon: 5, weight: 25 },
    { icon: 6, weight: 30 },
    { icon: 7, weight: 40 },
  ],
];

export const FortuneDragonNewerIconWeightsForSpecialForFive = [
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 25 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 25 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 5 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 25 },
  ],
];

export const FortuneDragonTrialIconWeights = [
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 19 },
  ],
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 19 },
  ],
  [
    { icon: 0, weight: 4 },
    { icon: 2, weight: 2 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 6 },
    { icon: 5, weight: 12 },
    { icon: 6, weight: 15 },
    { icon: 7, weight: 19 },
  ],
];

export const FortuneDragonTrialIconWeightsForFive = [
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 13 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 13 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 5 },
    { icon: 5, weight: 8 },
    { icon: 6, weight: 10 },
    { icon: 7, weight: 13 },
  ],
];

export const FortuneDragonTrialIconWeightsForSpecialForFive = [
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 25 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 25 },
  ],
  [
    { icon: 0, weight: 3 },
    { icon: 2, weight: 3 },
    { icon: 3, weight: 4 },
    { icon: 4, weight: 7 },
    { icon: 5, weight: 14 },
    { icon: 6, weight: 18 },
    { icon: 7, weight: 25 },
  ],
];

export const FortuneDragonBetLimit = [0.08, 0.8, 3, 10];

export const FortuneDragonDefaultCurrency = "BRL";

export const FortuneDragonBetLevelPools: BetLevelPool[] = [
  { currency: "BRL", level: 1, min: 0, max: 0.4, base: 1000 },
  { currency: "BRL", level: 2, min: 0.8, max: 4, base: 10000 },
  { currency: "BRL", level: 3, min: 8, max: 30, base: 75000 },
  { currency: "BRL", level: 4, min: 32, max: 100, base: 250000 },
  { currency: "BRL", level: 5, min: 105, max: 250, base: 635000 },
  { currency: "BRL", level: 6, min: 300, max: 500, base: 1250000 },
  // { currency: "BRL", level: 7, min: 0, max: 2, base: 1000 },
  // { currency: "BRL", level: 8, min: 4, max: 20, base: 10000 },
  // { currency: "BRL", level: 9, min: 40, max: 150, base: 75000 },
  // { currency: "BRL", level: 10, min: 160, max: 500, base: 250000 },
  // { currency: "BRL", level: 11, min: 525, max: 1250, base: 635000 },
  // { currency: "BRL", level: 12, min: 1500, max: 2500, base: 1250000 },
  { currency: "BRL", level: 1, min: 0, max: 2, base: 1000 },
  { currency: "BRL", level: 2, min: 4, max: 20, base: 10000 },
  { currency: "BRL", level: 3, min: 40, max: 150, base: 75000 },
  { currency: "BRL", level: 4, min: 160, max: 500, base: 250000 },
  { currency: "BRL", level: 5, min: 525, max: 1250, base: 635000 },
  { currency: "BRL", level: 6, min: 1500, max: 2500, base: 1250000 },
];

export const FortuneDragonSpecialRTPPrizeRate: SpecialRTPPrizeRate[] = [
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
    minWinRate: 8,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 8,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 8,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 8,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 8,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 8,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 8,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 8,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 8,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.9,
    maxUserRtp: 0.99,
    minWinRate: 8,
  },
  {
    serverRtp: 1,
    rate: 0,
    minUserRtp: 1.3,
    maxUserRtp: 1.45,
    minWinRate: 8,
  },
];

export const FortuneDragonSpecialRTPPrizeRateForFive: SpecialRTPPrizeRate[] = [
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
    minWinRate: 8,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 8,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 8,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 8,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 8,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 8,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 8,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 8,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 8,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.9,
    maxUserRtp: 0.99,
    minWinRate: 8,
  },
  {
    serverRtp: 1,
    rate: 0,
    minUserRtp: 1.3,
    maxUserRtp: 1.45,
    minWinRate: 8,
  },
];

export const FortuneDragonSpecialRTPPrizeRateForNewer: SpecialRTPPrizeRate[] = [
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
    minWinRate: 8,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 8,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 8,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 8,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 8,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 8,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 8,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 8,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 8,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 8,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 8,
  },
];

export const FortuneDragonSpecialRTPPrizeRateForNewerForFive: SpecialRTPPrizeRate[] = [
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
    minWinRate: 8,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 8,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 8,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 8,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 8,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 8,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 8,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 8,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 8,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 8,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 8,
  },
];

export const FortuneDragonSpecialRTPPrizeRateForTrail: SpecialRTPPrizeRate[] = [
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
    minWinRate: 8,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 8,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 8,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 8,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 8,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 8,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 8,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 8,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 8,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 8,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 8,
  },
];

export const FortuneDragonSpecialRTPPrizeRateForTrailForFive: SpecialRTPPrizeRate[] = [
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
    minWinRate: 8,
  },
  {
    serverRtp: 0.55,
    rate: 0.0347,
    minUserRtp: 0.45,
    maxUserRtp: 0.55,
    minWinRate: 8,
  },
  {
    serverRtp: 0.65,
    rate: 0.0332,
    minUserRtp: 0.55,
    maxUserRtp: 0.65,
    minWinRate: 8,
  },
  {
    serverRtp: 0.7,
    rate: 0.0317,
    minUserRtp: 0.65,
    maxUserRtp: 0.7,
    minWinRate: 8,
  },
  {
    serverRtp: 0.75,
    rate: 0.0302,
    minUserRtp: 0.7,
    maxUserRtp: 0.75,
    minWinRate: 8,
  },
  {
    serverRtp: 0.8,
    rate: 0.0287,
    minUserRtp: 0.75,
    maxUserRtp: 0.8,
    minWinRate: 8,
  },
  {
    serverRtp: 0.85,
    rate: 0.0272,
    minUserRtp: 0.8,
    maxUserRtp: 0.85,
    minWinRate: 8,
  },
  {
    serverRtp: 0.9,
    rate: 0.0257,
    minUserRtp: 0.85,
    maxUserRtp: 0.9,
    minWinRate: 8,
  },
  {
    serverRtp: 0.95,
    rate: 0.0242,
    minUserRtp: 0.9,
    maxUserRtp: 0.95,
    minWinRate: 8,
  },
  {
    serverRtp: 0.99,
    rate: 0.0227,
    minUserRtp: 0.95,
    maxUserRtp: 0.99,
    minWinRate: 8,
  },
  {
    serverRtp: 1.45,
    rate: 0,
    minUserRtp: 0.99,
    maxUserRtp: 1.45,
    minWinRate: 8,
  },
];

export const FortuneDragonSpecialPrizeRate = 0.7;
export const FortuneDragonSpecialPrizeRateForNewer = 0.7;
export const FortuneDragonSpecialPrizeRateForTrail = 1;

export const FortuneDragonSpecialPrizeRateForFive = 1;
export const FortuneDragonSpecialPrizeRateForNewerForFive = 3.5;
export const FortuneDragonSpecialPrizeRateForTrailForFive = 5;

export const FortuneDragonSpecialTypes = {
  normal: FortuneDragonSpecialPrizeRate,
  newer: FortuneDragonSpecialPrizeRateForNewer,
  trail: FortuneDragonSpecialPrizeRateForTrail,
};

export const FortuneDragonSpecialTypesForFive = {
  normal: FortuneDragonSpecialPrizeRateForFive,
  newer: FortuneDragonSpecialPrizeRateForNewerForFive,
  trail: FortuneDragonSpecialPrizeRateForTrailForFive,
};

export const FortuneDragonSpecialRTPPrizesTypes = {
  normal: FortuneDragonSpecialRTPPrizeRate,
  newer: FortuneDragonSpecialRTPPrizeRateForNewer,
  trail: FortuneDragonSpecialRTPPrizeRateForTrail,
};

export const FortuneDragonSpecialRTPPrizesTypesForFive = {
  normal: FortuneDragonSpecialRTPPrizeRateForFive,
  newer: FortuneDragonSpecialRTPPrizeRateForNewerForFive,
  trail: FortuneDragonSpecialRTPPrizeRateForTrailForFive,
};
export const FortuneDragonBasicRTP = 0.4656;
export const FortuneDragonBasicRTPForNewer = 0.6607;
export const FortuneDragonBasicRTPForTrail = 1.0667;

export const FortuneDragonBasicRTPForFive = 0.7486;
export const FortuneDragonBasicRTPForNewerForFive = 1.2836;
export const FortuneDragonBasicRTPForTrailForFive = 1.4593;

export const FortuneDragonBasicRTPTypes = {
  normal: FortuneDragonBasicRTP,
  newer: FortuneDragonBasicRTPForNewer,
  trail: FortuneDragonBasicRTPForTrail,
};

export const FortuneDragonBasicRTPTypesForFive = {
  normal: FortuneDragonBasicRTPForFive,
  newer: FortuneDragonBasicRTPForNewerForFive,
  trail: FortuneDragonBasicRTPForTrailForFive,
};

export const FortuneDragonSpecialUserRateRelation = (
  serverRtp: number,
  limitType: keyof typeof FortuneDragonSpecialTypes,
  prizeAssurance: boolean,
): SpecialRTPPrizeRateResult[] => {
  //todo: serverRtp是运营商RTP由公式转化而来
  const FortuneDragonSpecialRTP =
    serverRtp - (prizeAssurance ? FortuneDragonBasicRTPTypesForFive[limitType] : FortuneDragonBasicRTPTypes[limitType]);

  const items = (prizeAssurance ? FortuneDragonSpecialRTPPrizesTypesForFive : FortuneDragonSpecialRTPPrizesTypes)[
    limitType
  ];
  return items.map((p, index) => {
    const lastIndex = index - 1;

    const specialRate = (prizeAssurance ? FortuneDragonSpecialTypesForFive : FortuneDragonSpecialTypes)[limitType];

    let happenedRate = (items[lastIndex]?.rate || 0) * specialRate;

    const minBetCount = 1 / happenedRate / 10;

    let maxWinRate = (FortuneDragonSpecialRTP / happenedRate) * 5;
    let minWinRate = maxWinRate * 0.75;
    maxWinRate = maxWinRate * 1.25;

    // const rate = limitType==='newer' ? random.float(1, 2) : limitType==='normal' ? random.float(1.5, 2.5) : random.float(2.5, 3.5)

    // const happenedRate = rate / 100

    // const minBetCount = 1 / happenedRate / 10;

    // let maxWinRate = (FortuneDragonSpecialRTP / happenedRate) * 5;

    // let minWinRate = maxWinRate * 0.5 < 20 * 5 ? 20 * 5 : maxWinRate * 0.5;

    // maxWinRate = minWinRate < maxWinRate ? maxWinRate * 1.5 : minWinRate * 3;

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
