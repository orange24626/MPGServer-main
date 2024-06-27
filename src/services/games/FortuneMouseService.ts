import { ConfigThreeColumnsCardWeight } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  FortuneMouseIconPayRate,
  FortuneMouseIconWeights,
  FortuneMouseNewerIconWeights,
  FortuneMouseSpecialUserRateRelation,
  FortuneMouseTrialIconWeights,
} from "gameConfigs";
import { HTTPException } from "hono/http-exception";
import { SlotController, UserGameStore } from "models";
import { MoneyPoolMachine } from "models/types";
import random from "random";
import { GamePlayerService, GameService, WalletService } from "services";
import { GameConfigService } from "services/GameConfigService";
import { GameMoneyPoolService } from "services/GameMoneyPoolService";
import { redisClient } from "utils/redisClient";

import { sqsClient, ACTIONS, MESSAGEGROUP } from "services/SqsService";
import { WalletStore } from "models/WalletStore";

export interface FortuneMouseSpinParams {
  playerId: number;
  baseBet: number;
  baseRate: number;
  lineRate: number;
  currency: string;
  spinId: string;
  walletStore: WalletStore;
}

export enum FortuneMouseSpecialStatus {
  NeverIN = "neverIn",
  Begin = "begin",
  Process = "process",
  End = "end",
}

export const FortuneMousePossibleWinLines = [
  [1, 4, 7],
  [0, 3, 6],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const FortuneMouseCardIconMap: Map<number, number> = new Map([
  [2, 0],
  [3, 1],
  [4, 2],
  [5, 3],
  [6, 4],
  [7, 5],
  [8, 6],
  [1, -1],
]);

export class FortuneMouseService {
  public static async noPrizeSpin(params: FortuneMouseSpinParams, moneyPool: MoneyPoolMachine, toRecord = true) {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, walletStore } = params;
    const totalBet = new Decimal(baseBet * baseRate * lineRate);
    const config = await GameConfigService.getRandomNoPrize(68);
    const cards = config.cards as number[];
    const icons = cards.map((card) => FortuneMouseCardIconMap.get(card));
    const winIndexes: number[] = [];
    const winPositions = this.getWinPosition(winIndexes);
    const hashr = await this.getHashStr(icons as number[], winPositions, totalBet, new Decimal(0), playerId);

    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is null");
    }

    if (toRecord) {
      await walletStore.bet(totalBet);
      await GameMoneyPoolService.putMoney(moneyPool, new Decimal(totalBet));
    }

    toRecord
      ? sqsClient.sendMessage(
          JSON.stringify({
            input: {
              historyId: spinId,
              currency,
              totalBet,
              ge: [1, 11],
              gameID: 68,
              operatorId: player.operatorId,
              playerId,
              profit: -totalBet,
              moneyPool: moneyPool as any,
            },
            balanceBefore: new Decimal(walletStore.beforeSpinBalance).toFixed(2),
          }),
          MESSAGEGROUP.HISTORY,
          ACTIONS.CREATEHISTORY,
        )
      : null;
    if (totalBet.gt(0) && toRecord) {
      await walletStore.win(new Decimal(0));
    }

    return {
      winIndexes: [],
      totalBet: totalBet,
      totalWin: new Decimal(0),
      historyId: spinId,
      winPositions: {},
      positionAmount: {},
      hashStr: hashr,
      icons: icons as number[],
      iconRate: null,
    };
  }

  private static async normalSpin(
    params: FortuneMouseSpinParams,
    moneyPool: MoneyPoolMachine,
    slotController: SlotController,
  ) {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, walletStore } = params;
    await redisClient.set(`fortuneMouse:freeMode:${playerId}`, FortuneMouseSpecialStatus.NeverIN);

    const totalBet = new Decimal(baseBet * baseRate * lineRate);
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is null");
    }
    await walletStore.bet(totalBet);
    await GameMoneyPoolService.putMoney(moneyPool, new Decimal(totalBet));

    sqsClient.sendMessage(
      JSON.stringify({
        input: {
          historyId: spinId,
          currency,
          totalBet,
          ge: [1, 11],
          gameID: 68,
          operatorId: player.operatorId,
          playerId,
          profit: -totalBet,
          moneyPool: moneyPool as any,
        },
        balanceBefore: new Decimal(walletStore.beforeSpinBalance).toFixed(2),
      }),
      MESSAGEGROUP.HISTORY,
      ACTIONS.CREATEHISTORY,
    );

    slotController.set9Icons();
    const winIndexes = slotController.getWinLines();
    const icons = slotController.currentIcons;
    const winPositions = slotController.getWinPosition(winIndexes);
    const iconRate = slotController.getIconRate(winIndexes, FortuneMouseIconPayRate);

    const positionAmount = slotController.getPositionAmount({
      winIndexes,
      baseBet,
      baseRate,
      payRateConfigs: FortuneMouseIconPayRate,
    });
    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);
    await walletStore.win(new Decimal(totalWin));
    const hashStr = await this.getHashStr(icons, winPositions, totalBet, new Decimal(totalWin), playerId);

    return {
      totalBet,
      totalWin: new Decimal(totalWin),
      winPositions,
      positionAmount,
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
      winPositions[str] = FortuneMousePossibleWinLines[index];
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
      const line = FortuneMousePossibleWinLines[index];
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

    for (let index = 0; index < FortuneMousePossibleWinLines.length; index++) {
      const line = FortuneMousePossibleWinLines[index];
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
    let icons = cards.map((card) => FortuneMouseCardIconMap.get(card.cardID));
    icons = icons.map((icon) => (icon === undefined ? -1 : icon));
    icons = icons.map(Number);
    return icons as number[];
  }

  private static async getHashStr(
    icons: number[],
    winPositions: any,
    totalBet: Decimal,
    winAmount: Decimal,
    playerId: number,
  ) {
    const freeModeBetAmount = await redisClient.get(`fortuneMouse:freeModeCount:${playerId}`);
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
      const line = FortuneMousePossibleWinLines[winIndex];
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

  private static async initSpecialSpin(
    playerId: number,

    minRate: number,
    maxRate: number,
  ) {
    let specialResult = await GameConfigService.getRandomPayRateSpecialPrize({
      gameID: 68,
      minPayRate: minRate,
      maxPayRate: maxRate,
      roundLength: 2,
    });
    await redisClient.set(`fortuneMouse:freeModeCount:${playerId}`, 0);
    let count = specialResult?.count || 1;
    let initCount = count;
    let payRate = specialResult?.payRate || 3;
    let rounds = (specialResult?.rounds || []) as any[];

    rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 9) : [];

    let lookUpCount = 0;

    while (rounds.length < 2) {
      lookUpCount++;
      if (lookUpCount > 50) {
        console.log(
          "老鼠：配置文件查找错误 ",
          `用户:${playerId},查找范围:${minRate}-${maxRate}`,
          "选择的赔率",
          payRate,
        );
        redisClient.set(`fortuneMouse:freeMode:${playerId}`, FortuneMouseSpecialStatus.NeverIN);
        const historyId = await redisClient.get(`fortuneMouse:freeMode-historyId:${playerId}`);

        if (historyId) {
          const sendStart = Date.now();
          sqsClient.sendMessage(historyId, MESSAGEGROUP.HISTORY, ACTIONS.DELETEHISTORY);
          console.log("鼠,发送消息耗时", Date.now() - sendStart);
        } else {
          console.log("老鼠：配置文件查找错误 ", `用户:${playerId},查找范围:${minRate}-${maxRate}`, "选择的赔率");
        }

        throw new HTTPException(500, {
          message: `老鼠：配置文件查找错误
          查找范围:${minRate}-${maxRate}选择的赔率
          ${payRate}`,
        });
      }
      specialResult = await GameConfigService.getRandomPayRateSpecialPrize({
        gameID: 68,
        minPayRate: minRate,
        maxPayRate: maxRate,
        roundLength: 2,
      });
      count = specialResult?.count || 1;
      payRate = specialResult?.payRate || minRate;
      rounds = (specialResult?.rounds || []) as any[];
      rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 9) : [];

      if (rounds.length < 2) {
        count = initCount;
        payRate = maxRate;
      }
      if (!specialResult) {
        count = initCount;
        payRate = maxRate;
      }
    }
    console.log("老鼠最终得到的赔率为", payRate);
    if (!Array.isArray(rounds)) {
      throw new Error("rounds is not array");
    }
    await redisClient.del(`fortuneMouse:freeMode-list:${playerId}`);
    for (let index = 0; index < rounds.length; index++) {
      const round: any = rounds[index];
      if (round?.cards?.length === 9) {
        await redisClient.rPush(`fortuneMouse:freeMode-list:${playerId}`, JSON.stringify(round));
      } else {
        break;
      }
    }
  }

  private static async specialSpin(
    params: FortuneMouseSpinParams,
    moneyPool: MoneyPoolMachine,
    slotController: SlotController,
    minRate: number,
    maxRate: number,
  ): Promise<any> {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, walletStore } = params;
    const totalBet = new Decimal(baseBet * baseRate * lineRate);

    const specialStatus = await redisClient.get(`fortuneMouse:freeMode:${playerId}`);

    if (specialStatus === FortuneMouseSpecialStatus.Begin) {
      await this.initSpecialSpin(playerId, minRate, maxRate);
    } else {
      await redisClient.incr(`fortuneMouse:freeModeCount:${playerId}`);
    }
    const roundStr = await redisClient.lPop(`fortuneMouse:freeMode-list:${playerId}`);
    const round = JSON.parse(roundStr || "{}");

    const listLength = await redisClient.lLen(`fortuneMouse:freeMode-list:${playerId}`);
    let cashOut = false;
    if (+listLength === 0) {
      await redisClient.set(`fortuneMouse:freeMode:${playerId}`, FortuneMouseSpecialStatus.End);
      cashOut = true;
    }
    const icons = [];
    for (let index = 0; index < round?.cards?.length; index++) {
      const cardID = round.cards[index];
      const card = FortuneMouseIconPayRate.find((i) => i.icon === FortuneMouseCardIconMap.get(cardID));
      icons.push(card?.icon || 0);
    }

    slotController.setIcons(icons);

    const winIndexes = slotController.getWinLines();
    const winPositions = slotController.getWinPosition(winIndexes);

    const iconRate = await slotController.getIconRate(winIndexes, FortuneMouseIconPayRate);
    let positionAmount = slotController.getPositionAmount({
      winIndexes,
      baseBet,
      baseRate,
      payRateConfigs: FortuneMouseIconPayRate,
    });

    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);

    const hashStr = await this.getHashStr(icons, winPositions, totalBet, new Decimal(cashOut ? totalWin : 0), playerId);

    let historyId = await redisClient.get(`fortuneMouse:freeMode-historyId:${playerId}`);

    if (specialStatus === FortuneMouseSpecialStatus.Begin) {
      const player = await GamePlayerService.getGamePlayerById(playerId);
      if (!player) {
        throw new Error("player is null");
      }

      historyId = spinId;

      await redisClient.set(`fortuneMouse:freeMode-historyId:${playerId}`, historyId);
      const sendStart = Date.now();
      await walletStore.bet(totalBet);
      await GameMoneyPoolService.putMoney(moneyPool, new Decimal(totalBet));

      sqsClient.sendMessage(
        JSON.stringify({
          input: {
            historyId,
            currency,
            totalBet,
            ge: [1, 4, 11],
            gameID: 68,
            operatorId: player?.operatorId,
            playerId,
            profit: cashOut ? new Decimal(totalWin).sub(totalBet) : new Decimal(-totalBet),
            moneyPool: moneyPool as any,
          },
          balanceBefore: new Decimal(walletStore.beforeSpinBalance).toFixed(2),
        }),
        MESSAGEGROUP.HISTORY,
        ACTIONS.CREATEHISTORY,
      );
      await walletStore.win(new Decimal(0));

      console.log("鼠,发送消息耗时", Date.now() - sendStart);
    }

    if (cashOut && totalWin > 0) {
      const sendStart = Date.now();

      console.log("鼠,发送消息耗时", Date.now() - sendStart);
    }

    if (cashOut) {
      walletStore.win(new Decimal(totalWin));
    }
    return {
      winIndexes,
      totalBet,
      totalWin: new Decimal(cashOut ? totalWin : 0),
      winPositions,
      positionAmount,
      historyId: historyId || spinId,
      hashStr,
      icons,
      iconRate,
    };
  }

  public static async spin(params: FortuneMouseSpinParams): Promise<{
    totalWin: Decimal;
    totalBet: Decimal;
    winPositions: any;
    iconRate: any;
    positionAmount: any;
    hashStr: string;
    icons: number[];
    historyId: string;
    specialStatus: FortuneMouseSpecialStatus;
  }> {
    const { playerId, baseBet, baseRate, lineRate, walletStore } = params;
    const totalBet = baseBet * baseRate * lineRate;

    await walletStore.init();

    const specialStatus = await redisClient.get(`fortuneMouse:freeMode:${playerId}`);
    let userGameStore: null | UserGameStore = new UserGameStore(playerId, 68);

    const isNewer = await userGameStore.isNewer();
    const isTrail = await userGameStore.isTrail();

    let slotController: null | SlotController = new SlotController({
      userId: playerId,
      iconWeightConfig: isTrail
        ? FortuneMouseTrialIconWeights
        : isNewer
          ? FortuneMouseNewerIconWeights
          : FortuneMouseIconWeights,
    });
    await userGameStore.setBaseBet(baseBet);
    await userGameStore.setBaseRate(baseRate);
    const moneyPool = await userGameStore.getMoneyPool();

    if (specialStatus === FortuneMouseSpecialStatus.Begin) {
      await redisClient.set(`fortuneMouse:freeMode:${playerId}`, FortuneMouseSpecialStatus.Process);
    }
    if (specialStatus === FortuneMouseSpecialStatus.End) {
      await redisClient.set(`fortuneMouse:freeMode:${playerId}`, FortuneMouseSpecialStatus.NeverIN);
      userGameStore.resetBetCount();
    }
    if (
      !specialStatus ||
      specialStatus === FortuneMouseSpecialStatus.NeverIN ||
      specialStatus === FortuneMouseSpecialStatus.End
    ) {

      let { type, maxWinRate, minWinRate } = await slotController.checkSpecialOrNormal(
        userGameStore,
        totalBet,
        FortuneMouseSpecialUserRateRelation,
      );

      await userGameStore.addTotalBet(totalBet);
      const tooHigh = await GameService.predictWinIsTooHigh(userGameStore, new Decimal(1));
      const noPrizeCount = await userGameStore.getNoPrizeCount();
      if (tooHigh && Number(noPrizeCount) % random.int(5, 10) !== 0) {
        await userGameStore.addNoPrizeCount();

        const noPrizeResult = await this.noPrizeSpin(params, moneyPool, true);
        slotController = null;
        userGameStore = null;
        return {
          ...noPrizeResult,
          specialStatus: specialStatus as FortuneMouseSpecialStatus,
        };
      }

      // if (random.int(100) < 50) {
      if (type === "special") {
        await redisClient.set(`fortuneMouse:freeMode:${playerId}`, FortuneMouseSpecialStatus.Begin);
        await redisClient.set(`fortuneMouse:baseBet:${playerId}`, baseBet);
        await redisClient.set(`fortuneMouse:baseRate:${playerId}`, baseRate);
        const specialResult = await this.specialSpin(params, moneyPool, slotController, minWinRate, maxWinRate);
        if (specialResult.totalWin.gt(0)) {
          await GameMoneyPoolService.loseMoney(moneyPool, specialResult.totalWin);

          await userGameStore.addTotalWin(specialResult.totalWin.toNumber());
        }
        slotController = null;
        userGameStore = null;
        return {
          ...specialResult,
          specialStatus: specialStatus as FortuneMouseSpecialStatus,
        };
      } else {
        const normalResult = await this.normalSpin(params, moneyPool, slotController);
        const { totalWin } = normalResult;

        if (totalWin.gt(0)) {
          await GameMoneyPoolService.loseMoney(moneyPool, new Decimal(totalWin));
          await userGameStore.addTotalWin(totalWin.toNumber());
        } else {
          await userGameStore.addNoPrizeCount();
        }
        slotController = null;
        userGameStore = null;
        return {
          ...normalResult,
          specialStatus: specialStatus as FortuneMouseSpecialStatus,
        };
      }
    } else {
      const specialResult = await this.specialSpin(params, moneyPool, slotController, 0, 0);
      if (specialResult.totalWin.gt(0)) {
        await GameMoneyPoolService.loseMoney(moneyPool, specialResult.totalWin);

        await userGameStore.addTotalWin(specialResult.totalWin.toNumber());
      }
      slotController = null;
      userGameStore = null;
      return {
        ...specialResult,
        specialStatus: specialStatus as FortuneMouseSpecialStatus,
      };
    }
  }

  public static async parseModeResultByFortuneMouseSpecialStatus(
    freeModeStatus: FortuneMouseSpecialStatus,
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

    const profit = +(totalWin - totalBet).toFixed(2);
    const wp = !winPositions || Object.values(winPositions).length === 0 ? null : winPositions;
    const rwsp = !iconRate || Object.values(iconRate).length === 0 ? null : iconRate;
    const lw = !positionAmount || Object.values(positionAmount).length === 0 ? null : positionAmount;
    const ist = random.int(100) < 3;
    switch (freeModeStatus) {
      case FortuneMouseSpecialStatus.NeverIN:
        return {
          ist,
          aw: totalWin,
          st: 1,
          idr: false,
          ir: false,
          fws: 0,
          gwt: gwt,
          nst: 1,
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
      case FortuneMouseSpecialStatus.Begin:
        return {
          ist: false,
          aw: 0,
          st: 1,
          nst: 4,
          fws: freeModeIcon,
          gwt: gwt,
          fstc: null,
          ctw: 0,
          ctc: 0,
          idr: true,
          ir: true,
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
      case FortuneMouseSpecialStatus.Process:
        return {
          ist,
          aw: 0,
          st: 1,
          nst: 4,
          fws: freeModeIcon,
          gwt: gwt,
          idr: true,
          ir: true,
          itw: false,
          rc: freeModeCount,
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
          sid: spinId,
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
      case FortuneMouseSpecialStatus.End:
        return {
          ist,
          aw: totalWin,
          fstc: {
            4: freeModeCount,
          },
          fws: freeModeIcon,
          gwt: gwt,
          ctc: 1,
          ctw: totalWin,
          st: 4,
          nst: 1,
          idr: true,
          ir: false,
          itw: false,
          wp,
          orl: icons,
          rwsp,
          lw,
          hashr: hashStr,
          psid: lastSpinId,
          sid: spinId,
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
