import { FortuneTigerBetLevelPools } from "./fortuneTiger";
import { FortuneRabbitBetLevelPools } from "./fortuneRabbit";
import { FortuneMouseBetLevelPools } from "./fortuneMouse";
import { FortuneDragonBetLevelPools } from "./fortuneDragon";
import { FortuneOxBetLevelPools } from "./fortuneOx";
export const PossibleWinLines = [
  [1, 4, 7],
  [0, 3, 6],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const PossibleWinLinesOx = [
  [0, 4, 8],
  [0, 5, 8],
  [0, 5, 9],
  [1, 5, 8],
  [1, 5, 9],
  [1, 6, 9],
  [1, 6, 10],
  [2, 6, 9],
  [2, 6, 10],
  [2, 7, 10],
];

export const RtpLevels = [
  { rtpNo: 1, min: 0, max: 0.15 },
  { rtpNo: 2, min: 0.15, max: 0.25 },
  { rtpNo: 3, min: 0.25, max: 0.35 },
  { rtpNo: 4, min: 0.35, max: 0.45 },
  { rtpNo: 5, min: 0.45, max: 0.55 },
  { rtpNo: 6, min: 0.55, max: 0.65 },
  { rtpNo: 7, min: 0.65, max: 0.7 },
  { rtpNo: 8, min: 0.7, max: 0.75 },
  { rtpNo: 9, min: 0.75, max: 0.8 },
  { rtpNo: 10, min: 0.8, max: 0.85 },
  { rtpNo: 11, min: 0.85, max: 0.9 },
  { rtpNo: 12, min: 0.9, max: 0.95 },
  { rtpNo: 13, min: 0.95, max: 1 },
  { rtpNo: 14, min: 1, max: 1.45 },
];

export enum SpecialSpinStatus {
  NeverIN = "neverIn",
  Begin = "begin",
  Process = "process",
  End = "end",
}

export interface IconWeight {
  icon: number;
  weight: number;
}

export interface IconPayRate {
  icon: number;
  rate: number;
}

export interface BetLevelPool {
  currency: "BRL" | "CNY" | "EUR" | "USD";
  level: number;
  min: number;
  max: number;
  base: number;
}

export interface SpecialRTPPrizeRate {
  serverRtp: number;
  rate: number;
  minUserRtp: number;
  maxUserRtp: number;
  minWinRate: number;
}

export interface SpecialRTPPrizeRateResult extends SpecialRTPPrizeRate {
  happenedRate: number;
  maxWinRate: number;
  minBetCount: number;
  lineRate: number;
}

export const selectBetLevelPoolByGameID = (gameID: number) => {
  switch (gameID) {
    case 126:
      return FortuneTigerBetLevelPools;
    case 98:
      return FortuneOxBetLevelPools;
    case 1695365:
      return FortuneDragonBetLevelPools;
    case 1543462:
      return FortuneRabbitBetLevelPools;
    case 68:
      return FortuneMouseBetLevelPools;
    default:
      return FortuneTigerBetLevelPools;
  }
};
