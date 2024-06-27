import { ConfigThreeColumnsCardWeight } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  FortuneTigerIconPayRate,
  FortuneTigerIconWeights,
  FortuneTigerNewerIconWeights,
  FortuneTigerSpecialUserRateRelation,
  FortuneTigerTrialIconWeights,
} from "gameConfigs";
import { HTTPException } from "hono/http-exception";
import { SlotController, UserGameStore } from "models";
import { MoneyPoolMachine } from "models/types";
import random from "random";
import { GameConfigService } from "services/GameConfigService";
import { GameMoneyPoolService } from "services/GameMoneyPoolService";
import { redisClient } from "utils/redisClient";

import { sqsClient, ACTIONS, MESSAGEGROUP } from "services/SqsService";
import { WalletStore } from "models/WalletStore";

export interface FortuneTigerSpinParams {
  playerId: number;
  baseBet: number;
  baseRate: number;
  lineRate: number;
  currency: string;
  spinId: string;
  walletStore: WalletStore;
}

export enum FortuneTigerSpecialStatus {
  NeverIN = "neverIn",
  Begin = "begin",
  Process = "process",
  End = "end",
}

export const FortuneTigerPossibleWinLines = [
  [1, 4, 7],
  [0, 3, 6],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const FortuneTigerCardIconMap: Map<number, number> = new Map([
  [2, 0],
  [3, 2],
  [4, 3],
  [5, 4],
  [6, 5],
  [7, 6],
  [8, 7],
  [1, -1],
]);

export class FortuneTigerService {
  public static async spendMoneyFail(params: {
    userGameStore: UserGameStore;
    moneyPool: MoneyPoolMachine;
    currency: string;
    historyId: string;
  }) {
    const { userGameStore, moneyPool, historyId } = params;
    const totalBet = await userGameStore.getBetAmount();
    const sendStart = Date.now();
    sqsClient.sendMessage(historyId, MESSAGEGROUP.HISTORY, ACTIONS.DELETEHISTORY);
    console.log(
      "spendMoneyFail删除历史记录",
      `用户:${userGameStore.playerId},删除历史记录耗时`,
      Date.now() - sendStart,
      "ms",
    );
    await GameMoneyPoolService.loseMoney(moneyPool, new Decimal(totalBet));
    await userGameStore.addTotalBet(-totalBet);
  }

  public static async spendMoneyQueue(params: {
    userGameStore: UserGameStore;
    totalBet: number;
    moneyPool: MoneyPoolMachine;
    currency: string;
    historyId: string;
    balanceBefore: string;
  }) {
    try {
      console.log("开始扣钱==========", JSON.stringify(params));
      const { userGameStore, moneyPool, currency, historyId, balanceBefore, totalBet } = params;
      const { playerId } = userGameStore;
      const player = await userGameStore.getPlayer();
      await userGameStore.addTotalBet(totalBet);
      await GameMoneyPoolService.putMoney(moneyPool, new Decimal(totalBet));

      sqsClient.sendMessage(
        JSON.stringify({
          input: {
            historyId,
            currency,
            totalBet,
            operatorId: player?.operatorId,
            ge: [1, 11],
            gameID: 126,
            playerId: playerId,
            profit: -totalBet,
            moneyPool: moneyPool as any,
          },
          balanceBefore: new Decimal(balanceBefore).toFixed(4),
        }),
        MESSAGEGROUP.HISTORY,
        ACTIONS.CREATEHISTORY,
      );
      return;
    } catch (error: any) {
      console.log("cutMoney error", JSON.stringify(error.message));
      await this.spendMoneyFail(params);
      throw new HTTPException(500, {
        message: "bet fail, please try again later.",
      });
    }
  }

  public static async noPrizeSpin(params: FortuneTigerSpinParams, moneyPool: MoneyPoolMachine, toRecord = true) {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, walletStore } = params;
    const totalBet = baseBet * baseRate * lineRate;
    const config = await GameConfigService.getRandomNoPrize(126);
    const cards = config.cards as number[];
    const icons = cards.map((card) => FortuneTigerCardIconMap.get(card));
    const winIndexes: number[] = [];
    const winPositions = this.getWinPosition(winIndexes);
    const hashr = await this.getHashStr(icons as number[], winPositions, totalBet, 0, playerId);
    let userGameStore: null | UserGameStore = new UserGameStore(playerId, 126);

    if (toRecord) {
      walletStore.bet(new Decimal(totalBet));
      this.spendMoneyQueue({
        userGameStore,
        totalBet,
        moneyPool,
        currency,
        historyId: spinId,
        balanceBefore: new Decimal(walletStore.beforeSpinBalance).toFixed(4),
      });
      walletStore.win(new Decimal(0));
    }
    userGameStore = null;
    return {
      winIndexes: [],
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(0),
      winPositions: {},
      positionAmount: {},
      hashStr: hashr,
      icons: icons as number[],
      walletStore,
      iconRate: null,
      historyId: spinId,
    };
  }

  private static async normalSpin(
    params: FortuneTigerSpinParams,
    moneyPool: MoneyPoolMachine,
    userGameStore: UserGameStore,
    slotController: SlotController,
  ) {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, walletStore } = params;
    const totalBet = baseBet * baseRate * lineRate;
    await redisClient.set(`fortuneTiger:freeMode:${playerId}`, FortuneTigerSpecialStatus.NeverIN);
    walletStore.bet(new Decimal(totalBet));
    await this.spendMoneyQueue({
      userGameStore,
      totalBet,
      moneyPool,
      currency,
      historyId: spinId,
      balanceBefore: new Decimal(walletStore.beforeSpinBalance).toFixed(4),
    });

    slotController.set9Icons();
    const winIndexes = slotController.getWinLines();
    const icons = slotController.currentIcons;
    const winPositions = slotController.getWinPosition(winIndexes);

    const iconRate = slotController.getIconRate(winIndexes, FortuneTigerIconPayRate);

    const positionAmount = slotController.getPositionAmount({
      winIndexes,
      baseBet,
      baseRate,
      payRateConfigs: FortuneTigerIconPayRate,
    });
    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);

    //all cards are the same
    if (
      Object.values(positionAmount).length === FortuneTigerPossibleWinLines.length ||
      (winIndexes.includes(0) && winIndexes.includes(1) && winIndexes.includes(2))
    ) {
      totalWin = totalWin * 10;
    }

    if (totalWin > 0) {
      await userGameStore.addTotalWin(totalWin);
      await GameMoneyPoolService.loseMoney(moneyPool, new Decimal(totalWin));
    }

    await walletStore.win(new Decimal(totalWin));
    const hashStr = await this.getHashStr(icons, winPositions, totalBet, totalWin, playerId);

    return {
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(totalWin),
      winPositions,
      positionAmount,
      walletStore,
      hashStr,
      icons,
      iconRate,
      historyId: spinId,
    };
  }

  private static getWinPosition(winIndexes: number[]) {
    const winPositions: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const str = (index + 1).toString();
      winPositions[str] = FortuneTigerPossibleWinLines[index];
    }
    return winPositions as { string: number[] };
  }

  private static getPositionAmount(params: {
    cards: ConfigThreeColumnsCardWeight[];
    winIndexes: number[];
    baseBet: number;
    baseRate: number;
  }) {
    const { cards, winIndexes, baseBet, baseRate } = params;
    const positionAmount: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const line = FortuneTigerPossibleWinLines[index];
      const [a, b, c] = line;
      const cardA = cards[a];
      const cardB = cards[b];
      const cardC = cards[c];
      let card = [cardA, cardB, cardC].find((c) => c.cardID !== 2);
      card = card || cardA;

      const amount = card.payRate * baseBet * baseRate;
      positionAmount[(index + 1).toString()] = +amount.toFixed(2);
    }
    return positionAmount as { string: number };
  }

  private static getWinLines(cards: ConfigThreeColumnsCardWeight[]) {
    const winIndexes = [];

    for (let index = 0; index < FortuneTigerPossibleWinLines.length; index++) {
      const line = FortuneTigerPossibleWinLines[index];
      const [a, b, c] = line;
      const cardA = cards[a];
      const cardB = cards[b];
      const cardC = cards[c];
      if (cardA === undefined || cardB === undefined || cardC === undefined) {
        continue;
      }
      if (cardA.cardID === 1 || cardB.cardID === 1 || cardC.cardID === 1) {
        continue;
      }
      if (cardA.cardID === cardB.cardID && cardB.cardID === cardC.cardID) {
        winIndexes.push(index);
      }

      if (cardA.cardID === 2 && cardB.cardID === cardC.cardID) {
        winIndexes.push(index);
      }
      if (cardB.cardID === 2 && cardA.cardID === cardC.cardID) {
        winIndexes.push(index);
      }
      if (cardC.cardID === 2 && cardA.cardID === cardB.cardID) {
        winIndexes.push(index);
      }
      if (cardA.cardID === 2 && cardB.cardID === 2 && cardC.cardID !== 2) {
        winIndexes.push(index);
      }
      if (cardA.cardID === 2 && cardC.cardID === 2 && cardB.cardID !== 2) {
        winIndexes.push(index);
      }
      if (cardB.cardID === 2 && cardC.cardID === 2 && cardA.cardID !== 2) {
        winIndexes.push(index);
      }
      if (cardA.cardID === 2 && cardB.cardID === 2 && cardC.cardID === 2) {
        winIndexes.push(index);
      }
    }
    return winIndexes;
  }

  public static async turnCardToIcon(cards: ConfigThreeColumnsCardWeight[]) {
    let icons = cards.map((card) => FortuneTigerCardIconMap.get(card.cardID));
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
  ) {
    const freeModeBetAmount = await redisClient.get(`fortuneTiger:freeModeCount:${playerId}`);
    let hashStr = `${freeModeBetAmount || 0}:${icons[0]};${icons[3]};${icons[6]}#${icons[1]};${icons[4]};${icons[7]}#${icons[2]};${icons[5]};${icons[8]}`;
    let winLineStr = "";
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
        winLineStr += `#R#${icon}#${posStr}`;
      }
    }
    const betInfoStr = `#MV#${totalBet.toFixed(1)}#MT#1#MG#${winAmount.toFixed(1)}#`;
    hashStr = `${hashStr}${winLineStr}${betInfoStr}`;
    return hashStr;
  }

  static async getIconRate(cards: ConfigThreeColumnsCardWeight[], winIndexes: number[]) {
    const iconRate: any = {};
    for (let index = 0; index < winIndexes.length; index++) {
      const winIndex = winIndexes[index];
      const line = FortuneTigerPossibleWinLines[winIndex];
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

  private static async initSpecialSpin(params: {
    playerId: number;
    totalBet: number;
    moneyPool: MoneyPoolMachine;
    minRate: number;
    maxRate: number;
  }) {
    let checkTimer = Date.now();
    const { playerId, minRate, maxRate } = params;
    console.log("初始化特殊玩法", "最低赔率:", minRate, "最高赔率:", maxRate);
    let specialResult = await GameConfigService.getRandomPayRateSpecialPrize({
      gameID: 126,
      minPayRate: minRate,
      maxPayRate: maxRate,
      roundLength: 2,
    });
    console.log("找到的配置文件=====1", JSON.stringify(specialResult));
    await redisClient.del(`fortuneTiger:freeModeCount:${playerId}`);
    let count = specialResult?.count || 1;

    let initCount = count;
    let rounds = (specialResult?.rounds || []) as any[];

    rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 9) : [];

    let firstRound: any = rounds[0];
    let freeModeIcon = firstRound?.cardPointed;

    let lookUpCount = 0;

    while (rounds.length < 2 || !freeModeIcon) {
      lookUpCount++;
      if (lookUpCount > 50) {
        console.log("老虎：配置文件查找错误 ", `用户:${playerId},查找范围:${minRate}-${maxRate}`, "选择的赔率");
        redisClient.set(`fortuneTiger:freeMode:${playerId}`, FortuneTigerSpecialStatus.NeverIN);
        const historyId = await redisClient.get(`fortuneTiger:freeMode-historyId:${playerId}`);
        if (historyId) {
          const sendStart = Date.now();
          sqsClient.sendMessage(historyId, MESSAGEGROUP.HISTORY, ACTIONS.DELETEHISTORY);
          console.log("老虎：删除历史记录", `用户:${playerId},删除历史记录耗时`, Date.now() - sendStart, "ms");
        } else {
          console.log("老虎：配置文件查找错误 ", `用户:${playerId},查找范围:${minRate}-${maxRate}`, "选择的赔率");
        }
        throw new HTTPException(500, {
          message: `老虎：配置文件查找错误
          查找范围:${minRate}-${maxRate}选择的赔率`,
        });
      }
      specialResult = await GameConfigService.getRandomPayRateSpecialPrize({
        gameID: 126,
        minPayRate: minRate,
        maxPayRate: maxRate,
        roundLength: 2,
      });

      console.log("找到的配置文件=====2", JSON.stringify(specialResult));
      count = specialResult?.count || 1;
      rounds = (specialResult?.rounds || []) as any[];
      rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 9) : [];
      if (rounds.length < 1) {
        count = initCount;
      }
      firstRound = rounds[0];
      freeModeIcon = firstRound?.cardPointed;
      if (!freeModeIcon) {
        count = 0;
      }
    }
    console.log("initSpecialSpin 最终得到的特殊玩法赔率=======", specialResult?.payRate);
    if (!Array.isArray(rounds)) {
      throw new Error("rounds is not array");
    }
    await redisClient.del(`fortuneTiger:freeMode-list:${playerId}`);
    for (let index = 0; index < rounds.length; index++) {
      const round: any = rounds[index];
      const cardNumbers = round.cards;
      const cards = [];
      for (let i = 0; i < cardNumbers.length; i++) {
        const cardN = cardNumbers[i];
        const card = await GameConfigService.getThreeColumnsCardWeightByCardID(126, cardN);
        cards.push(card);
      }
      const winIndexes = this.getWinLines(cards);
      if (winIndexes.length === 0) {
        continue;
      }
      if (round?.payRate === null || round?.payRate === undefined) {
        break;
      }
      await redisClient.rPush(`fortuneTiger:freeMode-list:${playerId}`, JSON.stringify(round));
    }

    await redisClient.set(`fortuneTiger:freeModeIcon:${playerId}`, freeModeIcon);
    console.log("老虎：特殊玩法初始化完成", `初始化耗时：`, Date.now() - checkTimer, "ms");
  }

  private static async specialSpin(
    params: FortuneTigerSpinParams,
    moneyPool: MoneyPoolMachine,
    minRate: number,
    maxRate: number,
  ): Promise<any> {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, walletStore } = params;
    const totalBet = baseBet * baseRate * lineRate;
    const lineBet = baseBet * baseRate;

    const specialStatus = await redisClient.get(`fortuneTiger:freeMode:${playerId}`);

    console.log("老虎旋转================特殊玩法开始 spinId", params.spinId, ("阶段：" + specialStatus) as string);

    let historyId = await redisClient.get(`fortuneTiger:freeMode-historyId:${playerId}`);

    if (specialStatus === FortuneTigerSpecialStatus.Begin) {
      historyId = spinId;

      await redisClient.set(`fortuneTiger:freeMode-historyId:${playerId}`, historyId);

      await this.initSpecialSpin({
        playerId,
        totalBet: lineBet,
        moneyPool,
        minRate,
        maxRate,
      });

      await walletStore.bet(new Decimal(totalBet));
      console.log(
        "老虎旋转================特殊玩法开始",
        "初始化特殊玩法完成",
        walletStore.beforeSpinBalance,
        walletStore.afterSpinBalance,
      );

      await this.spendMoneyQueue({
        userGameStore: new UserGameStore(playerId, 126),
        totalBet,
        moneyPool,
        currency,
        historyId,
        balanceBefore: new Decimal(walletStore.beforeSpinBalance).toFixed(4),
      });

      await walletStore.win(new Decimal(0));
    } else {
      await redisClient.incr(`fortuneTiger:freeModeCount:${playerId}`);
    }
    const roundStr = await redisClient.lPop(`fortuneTiger:freeMode-list:${playerId}`);
    const round = JSON.parse(roundStr || "{}");

    const listLength = await redisClient.lLen(`fortuneTiger:freeMode-list:${playerId}`);
    let cashOut = false;
    if (+listLength === 0) {
      await redisClient.set(`fortuneTiger:freeMode:${playerId}`, FortuneTigerSpecialStatus.End);
      cashOut = true;
    }
    const cards = [];
    for (let index = 0; index < round?.cards?.length; index++) {
      const cardID = round.cards[index];
      const card = await GameConfigService.getThreeColumnsCardWeightByCardID(126, cardID);
      cards.push(card);
    }

    const winIndexes = this.getWinLines(cards);
    const icons = await this.turnCardToIcon(cards);
    const winPositions = this.getWinPosition(winIndexes);

    const iconRate = await this.getIconRate(cards, winIndexes);
    let positionAmount = this.getPositionAmount({
      cards,
      winIndexes,
      baseBet,
      baseRate,
    });

    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);
    if (
      winIndexes.length === FortuneTigerPossibleWinLines.length ||
      (winIndexes.includes(0) && winIndexes.includes(1) && winIndexes.includes(2))
    ) {
      totalWin = totalWin * 10;
    }

    const hashStr = await this.getHashStr(icons, winPositions, totalBet, cashOut ? totalWin : 0, playerId);

    if (cashOut && totalWin > 0) {
      await GameMoneyPoolService.loseMoney(moneyPool, new Decimal(totalWin));
      await walletStore.win(new Decimal(totalWin));
    }

    return {
      winIndexes,
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(cashOut ? totalWin : 0),
      winPositions,
      positionAmount,
      hashStr,
      icons,
      iconRate,
      historyId,
    };
  }

  public static async spin(params: FortuneTigerSpinParams): Promise<{
    totalWin: Decimal;
    totalBet: Decimal;
    winPositions: any;
    iconRate: any;
    positionAmount: any;
    hashStr: string;
    icons: number[];
    historyId: string;
    specialStatus: FortuneTigerSpecialStatus;
    walletStore: WalletStore;
  }> {
    const { playerId, baseBet, baseRate, lineRate, walletStore } = params;
    const totalBet = baseBet * baseRate * lineRate;

    const specialStatus = await redisClient.get(`fortuneTiger:freeMode:${playerId}`);

    let userGameStore: null | UserGameStore = new UserGameStore(playerId, 126);

    await walletStore.init();
    await userGameStore.setBaseBet(baseBet);
    await userGameStore.setBaseRate(baseRate);
    const moneyPool = await userGameStore.getMoneyPool();

    const isNewer = await userGameStore.isNewer();
    const isTrail = await userGameStore.isTrail();

    let slotController: null | SlotController = new SlotController({
      userId: playerId,
      iconWeightConfig: isTrail
        ? FortuneTigerTrialIconWeights
        : isNewer
          ? FortuneTigerNewerIconWeights
          : FortuneTigerIconWeights,
    });
    if (specialStatus === FortuneTigerSpecialStatus.Begin) {
      await redisClient.set(`fortuneTiger:freeMode:${playerId}`, FortuneTigerSpecialStatus.Process);
    }
    if (specialStatus === FortuneTigerSpecialStatus.End) {
      await redisClient.set(`fortuneTiger:freeMode:${playerId}`, FortuneTigerSpecialStatus.NeverIN);
      userGameStore.resetBetCount();
    }
    if (
      !specialStatus ||
      specialStatus === FortuneTigerSpecialStatus.NeverIN ||
      specialStatus === FortuneTigerSpecialStatus.End
    ) {

      let { type, maxWinRate, minWinRate } = await slotController.checkSpecialOrNormal(
        userGameStore,
        totalBet,
        FortuneTigerSpecialUserRateRelation,
      );

      const noPrizeCount = await userGameStore.getNoPrizeCount();
      if (Number(noPrizeCount) % random.int(5, 10) !== 0) {
        await userGameStore.addNoPrizeCount();
        const noPrizeResult = await this.noPrizeSpin(params, moneyPool, true);
        return {
          ...noPrizeResult,
          specialStatus: specialStatus as FortuneTigerSpecialStatus,
        };
      }
      // if (true) {
      // if (random.int(100) < 50) {
      if (type === "special" && (minWinRate || 0) > 0) {
        await redisClient.set(`fortuneTiger:freeMode:${playerId}`, FortuneTigerSpecialStatus.Begin);
        await redisClient.set(`fortuneTiger:baseBet:${playerId}`, baseBet);
        await redisClient.set(`fortuneTiger:baseRate:${playerId}`, baseRate);

        const specialResult = await this.specialSpin(params, moneyPool, minWinRate, maxWinRate);

        await userGameStore.addTotalWin(specialResult.totalWin.toNumber());
        await userGameStore.delNoPrizeCount();

        userGameStore = null;
        slotController = null;
        return {
          ...specialResult,
          specialStatus: specialStatus as FortuneTigerSpecialStatus,
        };
      } else {
        const normalResult = await this.normalSpin(params, moneyPool, userGameStore, slotController);
        if (normalResult.totalWin.eq(0)) {
          await userGameStore.addNoPrizeCount();
        } else {
          await userGameStore.delNoPrizeCount();
        }
        console.log(
          "老虎旋转================普通玩法结束",
          JSON.stringify({
            ...normalResult,
          }),
        );
        userGameStore = null;
        slotController = null;
        return {
          ...normalResult,
          specialStatus: specialStatus as FortuneTigerSpecialStatus,
        };
      }
    } else {
      
      const specialResult = await this.specialSpin(params, moneyPool, 0, 0);

      userGameStore.addTotalWin(specialResult.totalWin.toNumber());

      userGameStore = null;
      slotController = null;

      return {
        ...specialResult,
        specialStatus: specialStatus as FortuneTigerSpecialStatus,
      };
    }
  }

  public static async parseModeResultByFortuneTigerSpecialStatus(
    freeModeStatus: FortuneTigerSpecialStatus,
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
    } = data;
    let totalBet = baseBet * baseBetRate * 5;
    totalBet = +totalBet.toFixed(2);
    totalWin = +totalWin.toFixed(2);

    const profit =
      freeModeStatus == FortuneTigerSpecialStatus.Process || freeModeStatus == FortuneTigerSpecialStatus.End
        ? totalWin.toFixed(2)
        : +(totalWin - totalBet).toFixed(2);
    const wp = !winPositions || Object.values(winPositions).length === 0 ? null : winPositions;
    const rwsp = !iconRate || Object.values(iconRate).length === 0 ? null : iconRate;
    const lw = !positionAmount || Object.values(positionAmount).length === 0 ? null : positionAmount;
    const ist = random.int(100) < 5;
    switch (freeModeStatus) {
      case FortuneTigerSpecialStatus.NeverIN:
        return {
          ist,
          aw: totalWin,
          st: 1,
          fws: 0,
          gwt: gwt,
          nst: 1,
          irs: false,
          itw: false,
          wp,
          fstc: null,
          orl: icons,
          rwsp,
          ctw: totalWin,
          lw,
          hashr: hashStr,
          psid: lastSpinId,
          sid: spinId,
          ml: baseBetRate,
          cs: baseBet,
          rl: icons,
          tb: totalBet,
          tbb: totalBet,
          tw: totalWin,
          np: profit,
          fb: null,
          ge: [1, 11],
        };
      case FortuneTigerSpecialStatus.Begin:
        return {
          ist: false,
          aw: 0,
          st: 1,
          fws: freeModeIcon,
          gwt: gwt,
          fstc: null,
          nst: 4,
          ctw: 0,
          ctc: 0,
          irs: true,
          itw: true,
          wp,
          orl: icons,
          rwsp,
          lw,
          hashr: hashStr,
          psid: lastSpinId,
          sid: spinId,
          ml: baseBetRate,
          cs: baseBet,
          rl: icons,
          tb: totalBet,
          tbb: totalBet,
          tw: 0,
          np: -totalBet,
          fb: null,
          ge: [4, 11],
        };
      case FortuneTigerSpecialStatus.Process:
        return {
          ist: false,
          aw: 0,
          st: 4,
          fws: freeModeIcon,
          gwt: gwt,
          nst: 4,
          irs: true,
          itw: false,
          fstc: {
            4: freeModeCount,
          },
          wp,
          orl: icons,
          rwsp,
          ctw: 0,
          lw,
          hashr: hashStr,
          psid: lastSpinId,
          sid: lastSpinId,
          ml: baseBetRate,
          cs: baseBet,
          rl: icons,
          tb: 0,
          tbb: totalBet,
          tw: 0,
          np: 0,
          fb: null,
          ge: [4, 11],
        };
      case FortuneTigerSpecialStatus.End:
        return {
          aw: totalWin,
          st: 4,
          ist: false,
          fstc: {
            4: freeModeCount,
          },
          fws: freeModeIcon,
          gwt: gwt,
          ctc: 1,
          ctw: totalWin,
          nst: 1,
          irs: false,
          itw: false,
          wp,
          orl: icons,
          rwsp,
          lw,
          hashr: hashStr,
          psid: lastSpinId,
          sid: lastSpinId,
          ml: baseBetRate,
          cs: baseBet,
          pcwc: 1,
          rl: icons,
          tb: 0,
          tbb: totalBet,
          tw: totalWin,
          np: profit,
          fb: null,
          ge: [1, 11],
        };
    }
  }
}
