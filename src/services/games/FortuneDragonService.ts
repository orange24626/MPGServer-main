import { ConfigThreeColumnsCardWeight, GameHistory } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  DragonNormalSpinRateWeightsTypes,
  DragonNormalSpinRateWeightsTypesForFive,
  DragonSpecialSpinRateWeightsTypes,
  DragonSpecialSpinRateWeightsTypesForFive,
  FortuneDragonCardIconMap,
  FortuneDragonIconPayRate,
  FortuneDragonIconWeights,
  FortuneDragonIconWeightsForSpecial,
  FortuneDragonIconWeightsForSpecialForFive,
  FortuneDragonNewerIconWeights,
  FortuneDragonNewerIconWeightsForFive,
  FortuneDragonNewerIconWeightsForSpecial,
  FortuneDragonNewerIconWeightsForSpecialForFive,
  FortuneDragonSpecialUserRateRelation,
  FortuneDragonTrialIconWeights,
  FortuneDragonTrialIconWeightsForFive,
  PossibleWinLines,
  SpecialSpinStatus,
} from "gameConfigs";
import { HTTPException } from "hono/http-exception";
import { SlotController, UserGameStore } from "models";
import random from "random";
import { GamePlayerService, GameService, WalletService } from "services";
import { GameConfigService } from "services/GameConfigService";
import { GameMoneyPoolService } from "services/GameMoneyPoolService";
import { redisClient } from "utils/redisClient";
import { FortuneSpecialStatus } from "./FortuneOxService";
import { MoneyPoolMachine } from "models/types";
import { sqsClient, ACTIONS, MESSAGEGROUP } from "services/SqsService";
import { PgClient } from "utils";
import { WalletStore } from "models/WalletStore";
import moment from "moment";

export interface FortuneDragonSpinParams {
  playerId: number;
  baseBet: number;
  baseRate: number;
  lineRate: number;
  currency: string;
  spinId: string;
  prizeAssurance?: boolean;
  walletStore: WalletStore;
}

export class FortuneDragonService {
  private static async getNormalExtraRate(limitType: "normal" | "newer" | "trail", prizeAssurance = false) {
    const weights = prizeAssurance
      ? DragonNormalSpinRateWeightsTypesForFive[limitType]
      : DragonNormalSpinRateWeightsTypes[limitType];
    const allWeightValues = weights.map((weight) => weight.weight);
    const totalWeight = allWeightValues.reduce((prev, curr) => prev + curr, 0);
    const randomNum = random.int(0, totalWeight);
    let currentWeight = 0;
    const sorted = weights.sort((a, b) => a.weight - b.weight);
    for (let i = 0; i < sorted.length; i++) {
      const weight = sorted[i].weight;
      currentWeight += weight;
      if (randomNum <= currentWeight) {
        return sorted[i].rate;
      }
    }
  }

  private static getSpecialExtraRate(limitType: "trail" | "newer" | "normal", prizeAssurance = false) {
    const weights = prizeAssurance
      ? DragonSpecialSpinRateWeightsTypesForFive[limitType]
      : DragonSpecialSpinRateWeightsTypes[limitType];
    const allWeightValues = weights.map((weight) => weight.weight);
    const totalWeight = allWeightValues.reduce((prev, curr) => prev + curr, 0);
    const randomNum = random.int(0, totalWeight);
    let currentWeight = 0;
    const sorted = weights.sort((a, b) => a.weight - b.weight);
    for (let i = 0; i < sorted.length; i++) {
      const weight = sorted[i].weight;
      currentWeight += weight;
      if (randomNum <= currentWeight) {
        return sorted[i];
      }
    }
  }
  public static async noPrizeSpin(params: FortuneDragonSpinParams, moneyPool: MoneyPoolMachine, toRecord = true) {
    console.log("龙的无奖励模式=============");
    const { playerId, currency, spinId, walletStore } = params;
    const config = await GameConfigService.getRandomNoPrize(1695365);
    const cards = config.cards as number[];
    const icons = cards.map((card) => FortuneDragonCardIconMap.get(card));
    const winIndexes: number[] = [];
    const winPositions = this.getWinPosition(winIndexes);
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is null");
    }
    let userGameStore: null | UserGameStore = new UserGameStore(playerId, 1695365);
    const totalBet = await userGameStore.getBetAmount();
    const hashr = await this.getHashStr(icons as number[], winPositions, totalBet, 0, playerId, [1]);

    walletStore.bet(new Decimal(totalBet));

    toRecord
      ? sqsClient.sendMessage(
          JSON.stringify({
            input: {
              historyId: spinId,
              currency,
              totalBet,
              ge: [1, 11],
              gameID: 1695365,
              operatorId: player?.operatorId,
              playerId,
              profit: -totalBet,
              moneyPool: moneyPool as any,
              detail: [],
            },
            balanceBefore: new Decimal(walletStore.beforeSpinBalance),
          }),
          MESSAGEGROUP.HISTORY,
          ACTIONS.CREATEHISTORY,
        )
      : null;
    if (totalBet > 0 && toRecord) {
      walletStore.win(new Decimal(0));
    }
    userGameStore = null;
    return {
      winIndexes: [],
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(0),
      historyId: spinId,
      winPositions: {} as any,
      positionAmount: {} as any,
      hashStr: hashr,
      icons: icons as number[],
      iconRate: null as any,
      extraRates: [],
    };
  }

  private static async winBackMoney(
    params: FortuneDragonSpinParams,
    totalWin: number,
    moneyPool: MoneyPoolMachine,
    userGameStore: UserGameStore,
  ) {
    await GameMoneyPoolService.loseMoney(moneyPool, new Decimal(totalWin));
    await userGameStore.addTotalWin(totalWin);
  }

  private static async normalSpin(
    params: FortuneDragonSpinParams,
    moneyPool: MoneyPoolMachine,
    slotController: SlotController,
    extraRates: number[],
  ) {
    const { playerId, baseBet, baseRate, currency, prizeAssurance, spinId, walletStore } = params;

    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    let userGameStore: null | UserGameStore = new UserGameStore(playerId, 1695365);
    const totalBet = await userGameStore.getBetAmount();
    const historyIdCache = await redisClient.get(`fortuneDragon:freeMode-historyId:${playerId}`);
    const historyId = historyIdCache ? historyIdCache : spinId;
    if (!historyIdCache) {
      sqsClient.sendMessage(
        JSON.stringify({
          input: {
            historyId,
            currency,
            totalBet,
            operatorId: player.operatorId,
            ge: [1, 11],
            gameID: 1695365,
            playerId,
            profit: -totalBet,
            moneyPool: moneyPool as any,
          },
          balanceBefore: walletStore.beforeSpinBalance,
        }),
        MESSAGEGROUP.HISTORY,
        ACTIONS.CREATEHISTORY,
      );
      await redisClient.set(`fortuneDragon:freeMode-historyId:${playerId}`, historyId);
    }
    slotController.set9Icons();
    let winIndexes = slotController.getWinLines();
    let lookUpCount = 0;
    const freeModeCount = await redisClient.get(`fortuneDragon:freeModeCount:${playerId}`);
    const addUp = await redisClient.get(`fortuneDragon:freeModeAddUp:${playerId}`);
    let specialPrizeAssure = false;
    if (+(freeModeCount || "0") === 8 && new Decimal(addUp || "0").eq(0)) {
      specialPrizeAssure = true;
    }
    while (winIndexes.length === 0 && (prizeAssurance || specialPrizeAssure)) {
      lookUpCount++;
      if (lookUpCount > 100) {
        redisClient.set(`fortuneDragon:freeMode:${playerId}`, FortuneSpecialStatus.NeverIN);
        const historyId = await redisClient.get(`fortuneDragon:freeMode-historyId:${playerId}`);
        if (historyId) {
          sqsClient.sendMessage(historyId, MESSAGEGROUP.HISTORY, ACTIONS.DELETEHISTORY);
        } else {
          throw new HTTPException(500, {
            message: "prize assurance error",
          });
        }
        throw new HTTPException(500, {
          message: "prize assurance error",
        });
      }
      slotController.set9Icons();
      winIndexes = slotController.getWinLines();
    }
    const icons = slotController.currentIcons;
    const winPositions = slotController.getWinPosition(winIndexes);
    const iconRate = await slotController.getIconRate(winIndexes, FortuneDragonIconPayRate);

    const positionAmount = slotController.getPositionAmount({
      winIndexes,
      baseBet,
      baseRate,
      payRateConfigs: FortuneDragonIconPayRate,
    });
    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);

    const hashStr = await this.getHashStr(icons, winPositions, totalBet, totalWin, playerId, extraRates);
    userGameStore = null;
    return {
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(totalWin),
      winPositions,
      positionAmount,
      hashStr,
      icons,
      iconRate,
      historyId,
    };
  }

  private static getWinPosition(winIndexes: number[]) {
    const winPositions: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const str = (index + 1).toString();
      winPositions[str] = PossibleWinLines[index];
    }
    return winPositions as { string: number[] };
  }

  public static async turnCardToIcon(cards: ConfigThreeColumnsCardWeight[]) {
    let icons = cards.map((card) => FortuneDragonCardIconMap.get(card.cardID));
    icons = icons.map((icon) => (icon === undefined ? -1 : icon));
    icons = icons.map(Number);
    return icons as number[];
  }

  private static async getHashStr(
    icons: number[],
    winPositions: any,
    totalBet: number,
    winAmount: number,
    playerId: number,
    extraRate: number[],
  ) {
    const freeModeBetAmount = await redisClient.get(`fortuneDragon:freeModeCount:${playerId}`);
    let hashStr = `${freeModeBetAmount && Number(freeModeBetAmount) > 0 ? Number(freeModeBetAmount) - 1 : 0}:${icons[0]};${icons[3]};${icons[6]}#${icons[1]};${icons[4]};${icons[7]}#${icons[2]};${icons[5]};${icons[8]}`;
    let winLineStr = "";
    const extraRateStr = extraRate.reduce((prev, curr) => prev + curr, 0); 
    if (winPositions) {
      for (const key in winPositions) {
        const pos = winPositions[key];
        const iconIndex = pos.find((i: any) => icons[i] !== 2);
        const icon = icons[iconIndex] || 2;
        let posStr = "";
        for (const i of pos) {
          const row = Math.floor(i / 3);
          const column = i % 3;
          posStr += `${row}${column}`;
        }
        // const extraRateStr = extraRate.reduce((prev, curr) => prev + curr, 0);
        winLineStr += `#R#${icon}#${posStr}#MV#${totalBet.toFixed(1)}#MT#${extraRateStr}`;
      }
    } else {
      winLineStr = `#MV#${totalBet.toFixed(1)}#MT#1`;
    }
    const extraRateTime = extraRateStr>0 ? extraRateStr: 1
    // const extraRateTime = extraRate.reduce((prev, curr) => prev * curr, 1);
    const betInfoStr = `#MG#${(winAmount * extraRateTime).toFixed(1)}#`;
    hashStr = `${hashStr}${winLineStr}${betInfoStr}`;
    return hashStr;
  }

  static async getIconRate(cards: ConfigThreeColumnsCardWeight[], winIndexes: number[]) {
    const iconRate: any = {};
    for (let index = 0; index < winIndexes.length; index++) {
      const winIndex = winIndexes[index];
      const line = PossibleWinLines[winIndex];
      const [a, b, c] = line;
      const cardA = cards[a];
      const cardB = cards[b];
      const cardC = cards[c];
      let card = [cardA, cardB, cardC].find((c) => c.cardID !== 2);
      card = card || cardA;

      iconRate[(winIndex + 1).toString()] = card.payRate;
    }
    return iconRate as { string: number };
  }

  public static async spin(params: FortuneDragonSpinParams): Promise<{
    totalWin: Decimal;
    totalBet: Decimal;
    winPositions: any;
    iconRate: any;
    positionAmount: any;
    hashStr: string;
    icons: number[];
    historyId: string;
    specialStatus: SpecialSpinStatus;
    extraRates: number[];
    addUp: Decimal;
  }> {
    let { playerId, baseBet, baseRate, lineRate, currency, prizeAssurance, walletStore } = params;

    let totalBet = baseBet * baseRate * lineRate;
    let lineBet = baseBet * baseRate;
    if (prizeAssurance) {
      totalBet = totalBet * 5;
      lineBet = lineBet * 5;
    }

    const specialStatus = await redisClient.get(`fortuneDragon:freeMode:${playerId}`);

    let userGameStore: null | UserGameStore = new UserGameStore(playerId, 1695365);
    await walletStore.init();

    const isNewer = await userGameStore.isNewer();
    const isTrail = await userGameStore.isTrail();
    const moneyPool = await userGameStore.getMoneyPool();

    let slotController: null | SlotController = new SlotController({
      userId: playerId,
      iconWeightConfig: !prizeAssurance
        ? isTrail
          ? FortuneDragonTrialIconWeights
          : isNewer
            ? FortuneDragonNewerIconWeights
            : FortuneDragonIconWeights
        : isTrail
          ? FortuneDragonTrialIconWeightsForFive
          : isNewer
            ? FortuneDragonNewerIconWeightsForFive
            : FortuneDragonTrialIconWeightsForFive,
    });

    if (specialStatus === SpecialSpinStatus.End) {
      await redisClient.set(`fortuneDragon:freeMode:${playerId}`, SpecialSpinStatus.NeverIN);
      const freeModePrizeAssuranceStr = await redisClient.get(`fortuneDragon:freeModePrizeAssurance:${playerId}`);
      const freeModePrizeAssurance = freeModePrizeAssuranceStr === "1";
      prizeAssurance = freeModePrizeAssurance;
      userGameStore.resetBetCount();
    }

    if (!specialStatus || specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.End) {

      let { type } = await slotController.checkDragonSpecialOrNormal(
        userGameStore,
        totalBet,
        FortuneDragonSpecialUserRateRelation,
        prizeAssurance || false,
      );

      await redisClient.set(`fortuneDragon:freeModeCount:${playerId}`, 0);
      await userGameStore.addTotalBet(totalBet);
      await GameMoneyPoolService.putMoney(moneyPool, new Decimal(totalBet)); //统计

      const tooHigh = await GameService.predictWinIsTooHigh(userGameStore, new Decimal(1));
      const noPrizeCount = await userGameStore.getNoPrizeCount();
      if (tooHigh && !prizeAssurance && Number(noPrizeCount) % random.int(5, 10) !== 0) {
        await userGameStore.addNoPrizeCount();
        await GameMoneyPoolService.putMoney(moneyPool, new Decimal(totalBet));

        const noPrizeResult = await this.noPrizeSpin(params, moneyPool, true);
        slotController = null;
        userGameStore = null;
        return {
          ...noPrizeResult,
          addUp: new Decimal(0),
          specialStatus: specialStatus as SpecialSpinStatus,
        };
      }
      await redisClient.del(`fortuneDragon:freeMode-historyId:${playerId}`);
      if (type === "special") {
        // if (random.int(100) > 40) {
        await redisClient.set(`fortuneDragon:freeMode:${playerId}`, SpecialSpinStatus.Begin);
        await redisClient.set(`fortuneDragon:freeModeCount:${playerId}`, 1);
        await redisClient.set(`fortuneDragon:freeModeAddUp:${playerId}`, 0);
        await redisClient.set(`fortuneDragon:freeModePrizeAssurance:${playerId}`, prizeAssurance ? "1" : "0");
        await redisClient.set(`fortuneDragon:baseBet:${playerId}`, baseBet);
        await redisClient.set(`fortuneDragon:baseRate:${playerId}`, baseRate);

        walletStore.bet(new Decimal(totalBet));
        const specialSpinRlt = await this.specialSpin(params, moneyPool, slotController, userGameStore);

        await walletStore.win(new Decimal(specialSpinRlt.totalWin));
        await redisClient.incrByFloat(
          `fortuneDragon:freeModeAddUp:${playerId}`,
          +new Decimal(specialSpinRlt.totalWin).toFixed(4),
        );

        const addUp = await redisClient.get(`fortuneDragon:freeModeAddUp:${playerId}`);

        slotController = null;
        userGameStore = null;

        return {
          ...specialSpinRlt,
          addUp: new Decimal(addUp || 0),
          specialStatus: specialStatus as SpecialSpinStatus,
        };
      } else {
        await redisClient.set(`fortuneDragon:freeMode:${playerId}`, SpecialSpinStatus.NeverIN);
        await redisClient.set(`fortuneDragon:freeModeCount:${playerId}`, 0);
        const extraRate =
          (await this.getNormalExtraRate(isTrail ? "trail" : isNewer ? "newer" : "normal", prizeAssurance)) || 1;

        walletStore.bet(new Decimal(totalBet));

        const normalSpinRlt = await this.normalSpin(params, moneyPool, slotController, [extraRate]);

        let totalWin = normalSpinRlt.totalWin;
        if (totalWin.gt(0)) {
          totalWin = totalWin.mul(extraRate || 1);
          await this.winBackMoney(params, totalWin.toNumber(), moneyPool, userGameStore);
        } else {
          await userGameStore.addNoPrizeCount();
        }

        await walletStore.win(totalWin);
        const addUp = await redisClient.get(`fortuneDragon:freeModeAddUp:${playerId}`);
        slotController = null;
        userGameStore = null;

        return {
          ...normalSpinRlt,
          addUp: new Decimal(addUp || 0),
          totalWin,
          extraRates: extraRate === 1 ? [] : [extraRate],
          specialStatus: specialStatus as SpecialSpinStatus,
        };
      }
    } else {
      //special mode
      await redisClient.set(`fortuneDragon:freeMode:${playerId}`, SpecialSpinStatus.Process);
      await redisClient.incr(`fortuneDragon:freeModeCount:${playerId}`);
      const specialSpinRlt = await this.specialSpin(params, moneyPool, slotController, userGameStore);
      const freeModeCount = await redisClient.get(`fortuneDragon:freeModeCount:${playerId}`);
      if (+(freeModeCount || "0") === 8) {
        await redisClient.set(`fortuneDragon:freeMode:${playerId}`, SpecialSpinStatus.End);
        const addUp = await redisClient.get(`fortuneDragon:freeModeAddUp:${playerId}`);
        const freeModePrizeAssuranceStr = await redisClient.get(`fortuneDragon:freeModePrizeAssurance:${playerId}`);
        const freeModePrizeAssurance = freeModePrizeAssuranceStr === "1";
        const totalBet = await userGameStore.getBetAmount();
        console.log("特殊模式结束，总投注额度", totalBet, addUp, {
          freeModePrizeAssurance,
        });
      }
      await walletStore.win(new Decimal(specialSpinRlt.totalWin));
      await redisClient.incrByFloat(
        `fortuneDragon:freeModeAddUp:${playerId}`,
        +new Decimal(specialSpinRlt.totalWin).toFixed(4),
      );
      const addUp = await redisClient.get(`fortuneDragon:freeModeAddUp:${playerId}`);

      slotController = null;
      userGameStore = null;

      return {
        ...specialSpinRlt,
        addUp: new Decimal(addUp || 0),
        specialStatus: specialStatus as SpecialSpinStatus,
      };
    }
  }

  private static async specialSpin(
    params: FortuneDragonSpinParams,
    moneyPool: MoneyPoolMachine,
    slotController: SlotController,
    userGameStore: UserGameStore,
  ) {
    const { playerId } = params;
    const isNewer = await userGameStore.isNewer();
    const isTrail = await userGameStore.isTrail();

    const freeModePrizeAssuranceStr = await redisClient.get(`fortuneDragon:freeModePrizeAssurance:${playerId}`);
    const freeModePrizeAssurance = freeModePrizeAssuranceStr === "1";

    slotController.changeIconWeightConfig(
      !freeModePrizeAssurance
        ? isTrail
          ? FortuneDragonIconWeightsForSpecial
          : isNewer
            ? FortuneDragonNewerIconWeightsForSpecial
            : FortuneDragonIconWeightsForSpecial
        : isTrail
          ? FortuneDragonIconWeightsForSpecialForFive
          : isNewer
            ? FortuneDragonNewerIconWeightsForSpecialForFive
            : FortuneDragonIconWeightsForSpecialForFive,
    );

    const specialRlt = this.getSpecialExtraRate(
      isTrail ? "trail" : isNewer ? "newer" : "normal",
      freeModePrizeAssurance,
    );
    if (!specialRlt) {
      throw new Error("not special rate");
    }
    const { rate, rateLook } = specialRlt;

    const extraRates = rateLook.split("#").map(Number);
    const normalSpinRlt = await this.normalSpin(params, moneyPool, slotController, extraRates);
    let totalWin = normalSpinRlt.totalWin;

    totalWin = totalWin.mul(rate);

    if (totalWin.gt(0)) {
      if (normalSpinRlt.historyId) {
        await PgClient.query(
          `UPDATE "public"."GameHistory" SET ge='${JSON.stringify([2, 11])}', "updatedAt" = now()
           WHERE 
          ("public"."GameHistory"."historyId" = '${normalSpinRlt.historyId.toString()}')`,
        );
      }
      await this.winBackMoney(params, totalWin.toNumber(), moneyPool, userGameStore);
    } else {
      await userGameStore.addNoPrizeCount();
    }

    return {
      ...normalSpinRlt,
      totalWin,
      historyId: normalSpinRlt.historyId,
      extraRates: rateLook.split("#").map(Number),
    };
  }

  public static async parseModeResultBySpecialSpinStatus(
    freeModeStatus: SpecialSpinStatus,
    data: {
      totalWin: number;
      freeModeIcon: number | null;
      gwt: number;
      freeModeCount: number;
      winPositions: any;
      iconRate: any;
      positionAmount: any;
      hashStr: string;
      lastSpinId: string;
      spinId: string;
      icons: number[];
      baseBetRate: number;
      baseBet: number;
      extraRates: number[];
      addUp: Decimal;
      prizeAssurance: boolean;
    },
  ) {
    let {
      totalWin,
      freeModeIcon,
      gwt,
      icons,
      winPositions,
      iconRate,
      positionAmount,
      freeModeCount,
      hashStr,
      lastSpinId,
      spinId,
      baseBetRate,
      baseBet,
      extraRates,
      prizeAssurance,
      addUp,
    } = data;

    let totalBet = baseBet * baseBetRate * 5;

    totalBet = +totalBet.toFixed(2);
    totalWin = +totalWin.toFixed(2);

    const profit = +(totalWin - totalBet).toFixed(2);
    const wp = !winPositions || Object.values(winPositions).length === 0 ? null : winPositions;
    const rwsp = !iconRate || Object.values(iconRate).length === 0 ? null : iconRate;
    const lw = !positionAmount || Object.values(positionAmount).length === 0 ? null : positionAmount;
    const normalRateList = [2, 5, 10];
    let mt: any = [];
    let ms: any = [];
    let mi: any = [];
    let arr = extraRates;

    switch (freeModeStatus) {
      case SpecialSpinStatus.NeverIN:
        if (extraRates.length === 0) {
          const randomIndex = random.int(0, normalRateList.length - 1);
          mt = [
            normalRateList[randomIndex - 1 < 0 ? normalRateList.length - 1 : randomIndex - 1],
            normalRateList[randomIndex],
          ];
          ms = [false, false];
          mi = [];
        }
        if (extraRates.length === 1) {
          mt = [extraRates[0]];
          ms = [true];
          mi = [0];
        }
        return {
          aw: totalWin,
          st: 1,
          gm: extraRates.reduce((prev, curr) => prev + curr, 0) || 1,
          crtw: 0,
          ist: random.int(100) < 5,
          it: random.int(100) < 5,
          ssaw: totalWin,
          pf: 2,
          imw: false,
          fws: 0,
          gwt: gwt,
          nst: 1,
          itw: true,
          wp,
          fstc: null,
          orl: icons,
          mf: {
            mt,
            mi,
            ms,
          },
          rwsp,
          cwc: freeModeCount,
          ml: baseBetRate,
          cs: baseBet,
          ctw: totalWin,
          lw,
          hashr: hashStr,
          psid: lastSpinId,
          sid: lastSpinId,
          rl: icons,
          tb: totalBet,
          fs: null,
          tbb: totalBet,
          tw: totalWin,
          np: profit,
          ge: [1, 11],
        };
      case SpecialSpinStatus.Begin:
        ms = extraRates.map(() => true);
        mt = arr;
        mi = extraRates.length === 2 ? [0, 1] : [0, 1, 2];

        return {
          ist: false,
          aw: addUp.toNumber(),
          gm: extraRates.reduce((prev, curr) => prev + curr, 0) || 1,
          st: 1,
          it: true,
          nst: 2,
          crtw: 0,
          ml: baseBetRate,
          cs: baseBet,
          ssaw: totalWin,
          lw,
          cwc: freeModeCount,
          fstc: null,
          fws: freeModeIcon,
          gwt: gwt,
          mr: null,
          fs: {
            s: 8 - freeModeCount,
            ts: 8,
            aw: addUp,
          },
          mf: {
            mt,
            ms,
            mi,
          },
          ctw: totalWin,
          ocr: null,
          pcwc: 1,
          pmt: null,
          pf: 1,
          ctc: 0,
          itw: true,
          orl: icons,
          rwsp,
          hashr: hashStr,
          psid: lastSpinId,
          sid: spinId,
          rl: icons,
          tb: totalBet,
          tbb: 0,
          tw: totalWin,
          np: totalWin,
          wbn: null,
          wfg: null,
          wid: 0,
          wk: "0_C",
          wp,
          ge: [2, 11],
          wt: "C",
        };
      case SpecialSpinStatus.Process:
        ms = extraRates.map(() => true);
        mt = arr;
        mi = extraRates.length === 2 ? [0, 1] : [0, 1, 2];
        return {
          gm: extraRates.reduce((prev, curr) => prev + curr, 0) || 1,
          aw: addUp.toNumber(),
          st: 2,
          fws: freeModeIcon,
          gwt: gwt,
          mf: {
            mt,
            ms,
            mi,
          },
          cwc: freeModeCount,
          it: false,
          fs: { s: 8 - freeModeCount, ts: 8, aw: addUp.toNumber() },
          imw: false,
          nst: 2,
          itw: false,
          ml: baseBetRate,
          cs: baseBet,
          pmt: null,
          np: totalWin,
          fstc: {
            2: freeModeCount - 1
          },
          wp,
          orl: icons,
          ssaw: totalWin,
          rwsp,
          ctw: totalWin,
          lw,
          hashr: hashStr,
          psid: lastSpinId,
          sid: spinId,
          rl: icons,
          tb: 0,
          tbb: 0,
          tw: totalWin,
          pf: 1,
          pcwc: 0,
          ge: [2, 11],
        };
      case SpecialSpinStatus.End:
        ms = extraRates.map(() => true);
        mt = arr;
        mi = extraRates.length === 2 ? [0, 1] : [0, 1, 2];
        return {
          gm: extraRates.reduce((prev, curr) => prev + curr, 0) || 1,
          aw: addUp.toNumber(),
          st: 2,
          fstc: {
            2: freeModeCount - 1,
          },
          mf: {
            mt,
            ms,
            mi,
          },
          fs: { s: 8 - freeModeCount, ts: 8, aw: addUp.toNumber() },
          fws: freeModeIcon,
          cwc: freeModeCount,
          gwt: gwt,
          ctc: 1,
          ctw: totalWin,
          it: false,
          nst: 1,
          itw: false,
          lw,
          mr: null,
          np: totalWin,
          ml: baseBetRate,
          cs: baseBet,
          pf: 2,
          wp,
          orl: icons,
          rwsp,
          hashr: hashStr,
          psid: lastSpinId,
          sid: spinId,
          ssaw: totalWin,
          pcwc: 0,
          rl: icons,
          tb: 0,
          tbb: 0,
          tw: totalWin,
          ge: [2, 11],
        };
    }
  }
}
