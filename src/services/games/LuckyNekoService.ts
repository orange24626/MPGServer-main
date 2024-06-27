import { ConfigThreeColumnsCardWeight, GameHistory, MoneyPoolMachine } from "@prisma/client";
import random from "random";
import { GameHistoryService, GameService, WalletService, GamePlayerService } from "services";
import { GameConfigService } from "services/GameConfigService";
import { GameMoneyPoolService } from "services/GameMoneyPoolService";
import { redisClient } from "utils/redisClient";
import { Decimal } from "@prisma/client/runtime/library";
import {
  FortuneOxIconWeights,
  FortuneOxNewerIconWeights,
  FortuneOxSpecialUserRateRelation,
  FortuneOxTrialIconWeights,
  FortuneOxIconPayRate,
} from "gameConfigs";
import { SlotController, UserGameStore } from "models";

interface FortuneSpinParams {
  baseRate: number;
  lineRate: number;
  playerId: number;
  baseBet: number;
  currency: string;
  spinId: string;
}

export enum LuckyNekoStatus {
  NeverIN = "neverIn",
  Begin = "begin",
  Process = "process",
  End = "end",
}

const EmptyCard: ConfigThreeColumnsCardWeight = {
  id: 99,
  name: "占位",
  gameID: 98,
  cardID: 99,
  columnOne: 0,
  columnTwo: 0,
  columnThree: 0,
  payRate: 0,
  updatedAt: new Date("2024-03-12T08:44:31.584Z"),
};

//权重
const IconWeight = [
  //每列的权重
  {
    0: 15, //wild
    2: 80, //元宝
    3: 120, //同心锁
    4: 190, //福袋
    5: 260, //红包
    6: 440, //爆竹
    7: 360, //橘子
  },
  {
    0: 15, //wild
    2: 80, //元宝
    3: 120, //同心锁
    4: 190, //福袋
    5: 260, //红包
    6: 440, //爆竹
    7: 360, //橘子
  },
  {
    0: 150, //wild
    2: 80, //元宝
    3: 120, //同心锁
    4: 190, //福袋
    5: 260, //红包
    6: 440, //爆竹
    7: 360, //橘子
  },
];

const FortunePossibleWinLines = [
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

const FortuneCardIconMap: Map<number, number> = new Map([
  [2, 0],
  [3, 2],
  [4, 3],
  [5, 4],
  [6, 5],
  [7, 6],
  [8, 7],
  [1, -1],
  [99, 99],
]);

export class LuckyNekoService {
  static async getTopIcons() {}

  static getRandomIcon(columnIndex: number) {
    let iconWeights = Object.entries(IconWeight[columnIndex]);
    iconWeights = iconWeights.sort((a, b) => {
      return a[1] - b[1];
    });
    const totalWeight = iconWeights.reduce((acc, [icon, weight]) => {
      return acc + weight;
    }, 0);
    const randomWeight = random.int(0, totalWeight);
    let currentWeight = 0;
    for (const [icon, weight] of iconWeights) {
      currentWeight += weight;
      if (randomWeight < currentWeight) {
        return icon;
      }
    }
    return Number(iconWeights[iconWeights.length - 1][0]);
  }

  static getRandom10Icons() {
    const icons = [];
    for (let i = 0; i < 12; i++) {
      if (i === 3 || i == 11) {
        icons.push(99);
      } else {
        const columnIndex = i % 3;
        icons.push(this.getRandomIcon(columnIndex));
      }
    }
    return icons.map(Number);
  }

  public static async getNoPrizeIcons() {
    const config = await GameConfigService.getRandomNoPrize(98);
    const cards = config.cards as number[];
    cards.push(99);
    cards.splice(3, 0, 99);
    const icons = cards.map((card) => FortuneCardIconMap.get(card)) as number[];
    return icons;
  }

  public static async noPrizeSpin(params: FortuneSpinParams, moneyPool: MoneyPoolMachine) {
    const { playerId, baseBet, baseRate, lineRate, currency } = params;
    const totalBet = baseBet * baseRate * lineRate;
    const config = await GameConfigService.getRandomNoPrize(98);
    const cards = config.cards as number[];
    cards.push(99);
    cards.splice(3, 0, 99);
    const icons = cards.map((card) => FortuneCardIconMap.get(card)) as number[];
    const winIndexes: number[] = [];
    const winPositions = this.getWinPosition(winIndexes);
    const hashr = await this.getHashStr(icons, winPositions, totalBet, 0, playerId);

    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    const record = await GameHistoryService.create({
      currency,
      totalBet,
      ge: [1, 11],
      game: {
        connect: {
          gameID: 98,
        },
      },
      operator: {
        connect: {
          id: player.operatorId,
        },
      },
      player: {
        connect: {
          id: playerId,
        },
      },
      profit: -totalBet,
      moneyPoolId: moneyPool.id,
      moneyPool: {
        rtp: moneyPool.currentRTP,
        totalIn: moneyPool.totalIn,
        totalOut: moneyPool.totalOut,
      },
    });
    console.log("noPrizeSpin开始扣款============", totalBet);
    const wallet = await WalletService.getWalletByPlayerId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0;
    let balanceAfterSpin = balanceBeforeSpin;
    let balanceAfterWin = balanceAfterSpin;
    if (totalBet > 0) {
      const walletRecord = await WalletService.gameBet({
        playerId,
        currency,
        amount: new Decimal(totalBet),
        detail: {
          historyId: record?.historyId,
        },
      });
      balanceBeforeSpin = walletRecord.balanceBefore;
      balanceAfterSpin = walletRecord.balanceAfter;
      balanceAfterWin = balanceAfterSpin;
    }
    return {
      winIndexes: [],
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(0),
      record,
      winPositions: {},
      positionAmount: {},
      hashStr: hashr,
      icons: icons as number[],
      balanceBeforeSpin,
      balanceAfterSpin,
      balanceAfterWin,
      iconRate: null,
    };
  }

  private static async normalSpin(
    params: FortuneSpinParams,
    moneyPool: MoneyPoolMachine,
    userGameStore: UserGameStore,
    slotController: SlotController,
  ) {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId } = params;
    await redisClient.set(`fortuneOx:freeMode:${playerId}`, FortuneSpecialStatus.NeverIN);
    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0;
    let balanceAfterSpin = balanceBeforeSpin;
    let balanceAfterWin = balanceAfterSpin;
    const walletRecord = await WalletService.gameBet({
      playerId,
      currency,
      amount: new Decimal(baseBet * baseRate * lineRate),
      detail: {
        historyId: spinId,
      },
    });
    balanceAfterSpin = walletRecord.balanceAfter;
    balanceBeforeSpin = walletRecord.balanceBefore;
    balanceAfterWin = walletRecord.balanceAfter;
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    const totalBet = baseBet * baseRate * lineRate;
    let record = await GameHistoryService.create({
      currency,
      totalBet,
      game: {
        connect: {
          gameID: 98,
        },
      },
      operator: {
        connect: {
          id: player.operatorId,
        },
      },
      player: {
        connect: {
          id: playerId,
        },
      },
      ge: [1, 11],
      profit: -totalBet,
      moneyPoolId: moneyPool.id,
      moneyPool: {
        rtp: moneyPool.currentRTP,
        totalIn: moneyPool.totalIn,
        totalOut: moneyPool.totalOut,
      },
    });

    slotController.set10Icons();

    const winIndexes = slotController.getWinLines10(FortunePossibleWinLines);

    const icons = slotController.currentIcons;

    const winPositions = slotController.getWinPosition10(winIndexes, FortunePossibleWinLines);

    const iconRate = slotController.getIconRate10(winIndexes, FortuneOxIconPayRate, FortunePossibleWinLines);

    const positionAmount = slotController.getPositionAmount10({
      winIndexes,
      baseBet,
      baseRate,
      payRateConfigs: FortuneOxIconPayRate,
      PossibleWinLines: FortunePossibleWinLines,
    });

    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);

    //all cards are the same
    const count = icons.filter((item) => item === icons[0]).length;

    if (count === 10) totalWin = totalWin * 10;

    if (totalWin > 0) {
      record = await GameHistoryService.updateProfit(record, new Decimal(totalWin - totalBet));
      const walletRecord = await WalletService.gameWin({
        playerId,
        currency,
        amount: totalWin,
        detail: {
          historyId: record.id,
        },
      });
      balanceAfterWin = walletRecord.balanceAfter;
    }

    const hashStr = await this.getHashStr(icons, winPositions, totalBet, totalWin, playerId);

    return {
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(totalWin),
      winPositions,
      positionAmount,
      balanceAfterSpin,
      balanceBeforeSpin,
      balanceAfterWin,
      hashStr,
      icons,
      iconRate,
      record,
    };
  }

  private static getWinPosition(winIndexes: number[]) {
    const winPositions: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const str = (index + 1).toString();
      winPositions[str] = FortunePossibleWinLines[index];
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
      const line = FortunePossibleWinLines[index];
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

    for (let index = 0; index < FortunePossibleWinLines.length; index++) {
      const line = FortunePossibleWinLines[index];
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
    let icons = cards.map((card) => FortuneCardIconMap.get(card.cardID));
    icons = icons.map((icon) => (icon === undefined ? -1 : icon));
    icons = icons.map(Number);
    return icons as number[];
  }

  public static async getHashStr(
    icons: number[],
    winPositions: any,
    totalBet: number,
    winAmount: number,
    playerId: number,
  ) {
    const freeModeBetCount = await redisClient.get(`fortuneOx:freeModeCount:${playerId}`);
    let hashStr = `${freeModeBetCount || 0}:${icons[0]};${icons[4]};${icons[8]}#${icons[1]};${icons[5]};${icons[9]}#${icons[2]};${icons[6]};${icons[10]}#${icons[3]};${icons[7]};${icons[11]}`;
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
      const line = FortunePossibleWinLines[winIndex];
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
    totalBet: number,
    moneyPool: MoneyPoolMachine,
    minRate: number,
    maxRate: number,
  ) {
    let specialResult = await GameConfigService.getRandomPayRateSpecialPrize({
      gameID: 98,
      minPayRate: minRate,
      maxPayRate: maxRate,
    });
    await redisClient.set(`fortuneOx:freeModeCount:${playerId}`, 0);
    let count = specialResult?.count || 1;
    let initCount = count;
    let payRate = maxRate || specialResult?.payRate.toNumber();
    let rounds = (specialResult?.rounds || []) as any[];
    let predictedWin = new Decimal(payRate).mul(totalBet);
    rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 10) : [];
    let exceed = 0;
    while (rounds.length < 2) {
      exceed++;
      specialResult = await GameConfigService.getRandomPayRateSpecialPrize({
        gameID: 98,
        minPayRate: minRate,
        maxPayRate: maxRate,
      });
      count = specialResult?.count || 1;
      payRate = specialResult?.payRate.toNumber() || 50;
      rounds = (specialResult?.rounds || []) as any[];
      rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 10) : [];

      if (rounds.length < 1) {
        count = initCount;

        payRate = specialResult?.payRate.toNumber() || minRate;
      }

      predictedWin = new Decimal(totalBet).mul(specialResult?.payRate.toNumber() || minRate);
    }

    if (!Array.isArray(rounds)) throw new Error("rounds is not array");

    await redisClient.del(`fortuneOx:freeMode-list:${playerId}`);

    for (let index = 0; index < rounds.length; index++) {
      const round: any = rounds[index];
      if (round?.cards?.length === 10) {
        await redisClient.rPush(`fortuneOx:freeMode-list:${playerId}`, JSON.stringify(round));
      } else {
        break;
      }
    }
  }

  private static async specialSpin(
    params: FortuneSpinParams,
    moneyPool: MoneyPoolMachine,
    minRate: number,
    maxRate: number,
  ): Promise<any> {
    const { playerId, baseBet, baseRate, lineRate, currency } = params;

    const totalBet = baseBet * baseRate * lineRate;

    const lineBet = baseBet * baseRate;

    const specialStatus = await redisClient.get(`fortuneOx:freeMode:${playerId}`);

    await redisClient.incr(`fortuneOx:freeModeCount:${playerId}`);

    if (specialStatus === FortuneSpecialStatus.Begin) {
      await this.initSpecialSpin(playerId, lineBet, moneyPool, minRate, maxRate);
    }

    const roundStr = await redisClient.lPop(`fortuneOx:freeMode-list:${playerId}`);

    const round = JSON.parse(roundStr || "{}");

    let cashOut = false;

    let cards = [];

    for (let index = 0; index < round?.cards?.length; index++) {
      const cardID = round.cards[index];

      if (cardID === 99) return cards.push(EmptyCard);

      const card = await GameConfigService.getThreeColumnsCardWeightByCardID(98, cardID);

      cards.push(card);
    }

    cards.push(EmptyCard);
    cards.splice(3, 0, EmptyCard);
    const winIndexes = this.getWinLines(cards);
    const icons = await this.turnCardToIcon(cards);
    const winPositions = this.getWinPosition(winIndexes);
    const iconRate = await this.getIconRate(cards, winIndexes);
    let positionAmount = this.getPositionAmount({ cards, winIndexes, baseBet, baseRate });

    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);

    //all cards are the same
    const count = icons.filter((item) => item === icons[0]).length;

    if (count === 10) totalWin = totalWin * 10;

    if (specialStatus !== FortuneSpecialStatus.Begin && totalWin > 0) {
      await redisClient.set(`fortuneOx:freeMode:${playerId}`, FortuneSpecialStatus.End);

      cashOut = true;

      console.log(`免费摇奖结束`);
    }

    const hashStr = await this.getHashStr(icons, winPositions, totalBet, cashOut ? totalWin : 0, playerId);
    const historyId = await redisClient.get(`fortuneOx:freeMode-historyId:${playerId}`);
    let record = historyId ? await GameHistoryService.getByHistoryId(BigInt(historyId)) : null;
    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0;
    let balanceAfterSpin = balanceBeforeSpin;
    let balanceAfterWin = balanceAfterSpin;
    if (specialStatus === FortuneSpecialStatus.Begin) {
      const player = await GamePlayerService.getGamePlayerById(playerId);
      if (!player) {
        throw new Error("player is not found");
      }
      record = await GameHistoryService.create({
        currency,
        totalBet,
        game: {
          connect: {
            gameID: 98,
          },
        },
        operator: {
          connect: {
            id: player.operatorId,
          },
        },
        player: {
          connect: {
            id: playerId,
          },
        },
        ge: [1, 4, 11],
        profit: cashOut ? totalWin - totalBet : -totalBet,
        moneyPoolId: moneyPool.id,
        moneyPool: {
          rtp: moneyPool.currentRTP,
          totalIn: moneyPool.totalIn,
          totalOut: moneyPool.totalOut,
        },
      });
      await redisClient.set(`fortuneOx:freeMode-historyId:${playerId}`, record.historyId.toString());

      const walletRecord = await WalletService.gameBet({
        playerId,
        currency,
        amount: new Decimal(totalBet),
        detail: {
          historyId: record?.id,
        },
      });
      balanceAfterSpin = walletRecord.balanceAfter;
      balanceBeforeSpin = walletRecord.balanceBefore;
      balanceAfterWin = walletRecord.balanceAfter;
    }
    if (!record) {
      await redisClient.set(`fortuneOx:freeMode:${playerId}`, FortuneSpecialStatus.NeverIN);
      const player = await GamePlayerService.getGamePlayerById(playerId);
      if (!player) {
        throw new Error("player is not found");
      }
      record = await GameHistoryService.create({
        currency,
        totalBet,
        game: {
          connect: {
            gameID: 98,
          },
        },
        operator: {
          connect: {
            id: player.operatorId,
          },
        },
        player: {
          connect: {
            id: playerId,
          },
        },
        ge: [1, 4, 11],
        profit: cashOut ? totalWin - totalBet : -totalBet,
        moneyPoolId: moneyPool.id,
        moneyPool: {
          rtp: moneyPool.currentRTP,
          totalIn: moneyPool.totalIn,
          totalOut: moneyPool.totalOut,
        },
      });
    }

    if (cashOut && totalWin > 0) {
      record = await GameHistoryService.updateProfit(record, new Decimal(totalWin - totalBet));
      const walletRecord = await WalletService.gameWin({
        playerId,
        currency,
        amount: totalWin,
        detail: {
          historyId: record.id,
        },
      });
      balanceAfterWin = walletRecord.balanceAfter;
    }

    return {
      winIndexes,
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(cashOut ? totalWin : 0),
      winPositions,
      positionAmount,
      record,
      hashStr,
      icons,
      iconRate,
      balanceAfterSpin,
      balanceBeforeSpin,
      balanceAfterWin,
    };
  }

  public static async spin(params: FortuneSpinParams): Promise<{
    totalWin: Decimal;
    totalBet: Decimal;
    winPositions: any;
    iconRate: any;
    positionAmount: any;
    hashStr: string;
    icons: number[];
    record: GameHistory | null;
    specialStatus: FortuneSpecialStatus;
    balanceBeforeSpin: Decimal;
    balanceAfterSpin: Decimal;
    balanceAfterWin: Decimal;
  }> {
    const { playerId, baseBet, baseRate, lineRate } = params;

    const totalBet = baseBet * baseRate * lineRate;

    // await redisClient.del(`fortuneOx:freeMode:${playerId}`);
    const specialStatus = await redisClient.get(`fortuneOx:freeMode:${playerId}`);

    const userGameStore = new UserGameStore(playerId, 98);

    await userGameStore.setBaseBet(baseBet);

    await userGameStore.setBaseRate(baseRate);

    const isNewer = await userGameStore.isNewer();

    const isTrail = await userGameStore.isTrail();

    const slotController = new SlotController({
      userId: playerId,
      iconWeightConfig: isTrail
        ? FortuneOxTrialIconWeights
        : isNewer
          ? FortuneOxNewerIconWeights
          : FortuneOxIconWeights,
    });

    let { type, maxWinRate, minWinRate, moneyPool } = await slotController.checkSpecialOrNormal(
      userGameStore,
      totalBet,
      FortuneOxSpecialUserRateRelation,
    );

    if (specialStatus === FortuneSpecialStatus.Begin) {
      await redisClient.set(`fortuneOx:freeMode:${playerId}`, FortuneSpecialStatus.Process);
    }

    if (specialStatus === FortuneSpecialStatus.End) {
      await redisClient.set(`fortuneOx:freeMode:${playerId}`, FortuneSpecialStatus.NeverIN);
    }

    if (
      !specialStatus ||
      specialStatus === FortuneSpecialStatus.NeverIN ||
      specialStatus === FortuneSpecialStatus.End
    ) {
      await userGameStore.addTotalBet(totalBet);

      moneyPool = await GameMoneyPoolService.putBetToMoneyPool(moneyPool.id, new Decimal(totalBet));

      const betCount = await userGameStore.getBetCount();
      const tooHigh = await GameService.predictWinIsTooHigh(
        userGameStore,
        betCount < random.int(10, 20) && betCount % random.int(4) === 0
          ? //特殊奖后5次才开始限制RTP
            new Decimal(totalBet).minus(betCount * totalBet)
          : new Decimal(totalBet),
      );

      const noPrizeCount = await userGameStore.getNoPrizeCount();

      if (tooHigh && Number(noPrizeCount) % 9 !== 0) {
        await userGameStore.addNoPrizeCount();

        const noPrizeResult = await this.noPrizeSpin(params, moneyPool);

        return {
          ...noPrizeResult,
          balanceAfterSpin: new Decimal(noPrizeResult.balanceAfterSpin),
          balanceBeforeSpin: new Decimal(noPrizeResult.balanceBeforeSpin),
          balanceAfterWin: new Decimal(noPrizeResult.balanceAfterWin),
          record: noPrizeResult.record,
          specialStatus: specialStatus as FortuneSpecialStatus,
        };
      }

      if (type === "special") {
        await redisClient.set(`fortuneOx:freeMode:${playerId}`, FortuneSpecialStatus.Begin);

        const specialResult = await this.specialSpin(params, moneyPool, minWinRate, maxWinRate);

        if (specialResult.totalWin.gt(0)) {
          await GameMoneyPoolService.putWinToMoneyPool(moneyPool.id, specialResult.totalWin);

          await userGameStore.addTotalWin(specialResult.totalWin.toNumber());

          await userGameStore.delNoPrizeCount();
        }

        return { ...specialResult, specialStatus: specialStatus as FortuneSpecialStatus };
      } else {
        const normalResult = await this.normalSpin(params, moneyPool, userGameStore, slotController);

        const { totalWin, totalBet } = normalResult;

        if (totalWin.eq(0)) {
          await userGameStore.addNoPrizeCount();
        } else {
          await userGameStore.delNoPrizeCount();
        }

        moneyPool.totalOut = new Decimal(moneyPool.totalOut).add(totalWin);

        moneyPool.totalIn = new Decimal(moneyPool.totalIn).add(totalBet);

        if (totalWin.gt(0)) {
          await GameMoneyPoolService.putWinToMoneyPool(moneyPool.id, new Decimal(totalWin));

          await userGameStore.addTotalWin(totalWin.toNumber());
        }

        return { ...normalResult, specialStatus: specialStatus as FortuneSpecialStatus };
      }
    } else {
      const specialResult = await this.specialSpin(params, moneyPool, minWinRate, maxWinRate);

      if (specialResult.totalWin.gt(0)) {
        await GameMoneyPoolService.putWinToMoneyPool(moneyPool.id, specialResult.totalWin);

        await userGameStore.addTotalWin(specialResult.totalWin.toNumber());
      }

      return { ...specialResult, specialStatus: specialStatus as FortuneSpecialStatus };
    }
  }

  public static async parseModeResultByFortuneOxSpecialStatus(
    freeModeStatus: FortuneSpecialStatus,
    data: {
      totalWin: number;
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
    let totalBet = baseBet * baseBetRate * 10;
    totalBet = +totalBet.toFixed(2);
    totalWin = +totalWin.toFixed(2);

    const profit = +(totalWin - totalBet).toFixed(2);
    const wp = !winPositions || Object.values(winPositions).length === 0 ? null : winPositions;
    const rwsp = !iconRate || Object.values(iconRate).length === 0 ? null : iconRate;
    const lw = !positionAmount || Object.values(positionAmount).length === 0 ? null : positionAmount;

    const linesCount = winPositions ? Object.values(winPositions).length : 0;

    switch (freeModeStatus) {
      case FortuneSpecialStatus.NeverIN:
        return {
          aw: totalWin,
          st: 1,
          gwt: gwt,
          nst: 1,
          itw: true,
          fstc: null,
          wp,
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
          fs: false, //这个特殊字段要加
          im: false,
          rc: 0,
          rf: false,
          rtf: random.int(100) < 3,
          cwc: linesCount,
          pcwc: linesCount,
        };
      case FortuneSpecialStatus.Begin:
        return {
          aw: 0,
          st: 1,
          gwt: gwt,
          nst: 4,
          itw: true,
          fstc: null,
          wp,
          rwsp,
          ctw: 0,
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
          ge: [2, 11],
          fs: true,
          im: false,
          rc: freeModeCount,
          rf: true,
          rtf: false,
          cwc: linesCount,
          pcwc: linesCount,
        };
      case FortuneSpecialStatus.Process:
        return {
          aw: 0,
          st: 4,
          gwt: gwt,
          nst: 4,
          itw: false,
          fstc: {
            4: freeModeCount - 1,
          },
          wp,
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
          ge: [2, 11],
          fs: true,
          im: false,
          rc: freeModeCount,
          rf: true,
          rtf: false,
          cwc: linesCount,
          pcwc: linesCount,
        };
      case FortuneSpecialStatus.End:
        return {
          aw: totalWin,
          st: 4,
          gwt: gwt,
          nst: 1,
          itw: true,
          fstc: {
            4: freeModeCount - 1,
          },
          wp,
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
          tw: totalWin,
          np: profit,
          fb: null,
          ge: [1, 11],
          fs: true,
          im: false,
          rc: freeModeCount,
          rf: false,
          rtf: false,
          cwc: linesCount,
          pcwc: linesCount,
        };
    }
  }
}
