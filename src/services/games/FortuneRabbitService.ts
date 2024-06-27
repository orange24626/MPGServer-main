import { ConfigThreeColumnsCardWeight, GameHistory } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import random from "random";
import { GamePlayerService, GameService } from "services";
import { GameConfigService } from "services/GameConfigService";
import { GameMoneyPoolService } from "services/GameMoneyPoolService";
import { redisClient } from "utils/redisClient";
import { SlotController } from "models";
import { UserGameStore } from "models/UserGameStore";
import {
  FortuneRabbitIconWeights,
  FortuneRabbitNewerIconWeights,
  FortuneRabbitTrialIconWeights,
  FortuneRabbitSpecialUserRateRelation,
} from "gameConfigs";
import { triggerBetJob, triggerWinJob } from "jobs";
import { MoneyPoolMachine } from "models/types";
import { sqsClient, ACTIONS, MESSAGEGROUP } from "services/SqsService";
import { WalletStore } from "models/WalletStore";

const TICKETLIST = [0.5, 1, 2, 3, 4, 5, 10, 20, 30, 50, 100];

export const FortuneRabbitIconPayRate = [
  { icon: 0, rate: 200 },
  { icon: 2, rate: 100 },
  { icon: 3, rate: 50 },
  { icon: 4, rate: 10 },
  { icon: 5, rate: 5 },
  { icon: 6, rate: 3 },
  { icon: 7, rate: 2 },
];

export enum RabbitFreeModeStatus {
  NeverIN = "neverIn",
  Begin = "begin",
  Process = "process",
  End = "end",
}

interface FortuneSpinParams {
  baseRate: number;
  lineRate: number;
  playerId: number;
  baseBet: number;
  currency: string;
  spinId: string;
  walletStore: WalletStore;
}

const EmptyCard: ConfigThreeColumnsCardWeight = {
  id: 99,
  name: "占位",
  gameID: 1543462,
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
    8: 20, //钞票
  },
  {
    0: 15, //wild
    2: 80, //元宝
    3: 120, //同心锁
    4: 190, //福袋
    5: 260, //红包
    6: 440, //爆竹
    7: 360, //橘子
    8: 10, //钞票
  },
  {
    0: 150, //wild
    2: 80, //元宝
    3: 120, //钱袋
    4: 190, //红包
    5: 260, //钱币
    6: 440, //冰激凌
    7: 360, //萝卜
    8: 10, //钞票
  },
];

const PossibleWinLines = [
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
  [1, 8],
  [2, 0],
  [3, 2],
  [4, 3],
  [5, 4],
  [6, 5],
  [7, 6],
  [8, 7],
  [99, 99],
]);

export class FortuneRabbitService {
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

  static async getNoPrizeIcons() {
    const config = await GameConfigService.getRandomNoPrize(1543462);
    const cards = config.cards as number[];
    cards.push(99);
    cards.splice(3, 0, 99);
    const icons = cards.map((card) => FortuneCardIconMap.get(card)) as number[];
    return icons;
  }

  static getTicketAmount(ticketPrice: number, count: number, totalBet: number) {
    if (ticketPrice <= 0) return TICKETLIST[0];

    const amount = TICKETLIST.filter((item) => ticketPrice - item * totalBet >= count * TICKETLIST[0] * totalBet);

    const rand_index = random.int(0, amount.length - 1);

    return amount.length ? amount[rand_index] : TICKETLIST[0];
  }

  static getCptw(cpf: any[]) {
    if (Object.keys(cpf).length < 5) return 0;

    return cpf.reduce((acc, item) => {
      return acc + item.bv;
    }, 0);
  }

  static async getTickets(icons: number[], totalBet: number, price: number = 0) {
    let cpf: any[] = [];
    let total = 0;
    let round = 0;
    let count = icons.filter((item) => item === 8).length;
    for (let index = 0; index < icons.length; index++) {
      if (icons[index] === 8) {
        const amount =
          price <= 0
            ? TICKETLIST[random.int(0, TICKETLIST.length - 1)]
            : this.getTicketAmount(price - total, count - round, totalBet);
        total = total + amount * totalBet;
        cpf.push({ p: index, bv: amount * totalBet, m: amount });
        round++;
      }
    }
    const cptw = this.getCptw(cpf);

    let _cpf: any = {}

    for (let index = 0; index < cpf.length; index++) {

      _cpf[index + 1] = cpf[index]

    }

    return { cpf: _cpf, cptw };
  }

  private static getIconsByCount(count: number) {
    let icons = [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];

    const rand = random.int(0, 100);

    if (count === 1) {
      icons =
        rand < 10
          ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 8]
          : rand < 30
            ? [1, 1, 1, 1, 1, 1, 1, 1, 8, 8]
            : rand < 50
              ? [1, 1, 1, 1, 1, 1, 1, 8, 8, 8]
              : rand < 90
                ? [1, 1, 1, 1, 1, 1, 8, 8, 8, 8]
                : [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];
    }
    if (count === 2) {
      icons =
        rand < 10
          ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 8]
          : rand < 30
            ? [1, 1, 1, 1, 1, 1, 1, 1, 8, 8]
            : rand < 60
              ? [1, 1, 1, 1, 1, 1, 1, 8, 8, 8]
              : rand < 90
                ? [1, 1, 1, 1, 1, 1, 8, 8, 8, 8]
                : [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];
    }
    if (count === 3) {
      icons =
        rand < 30
          ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 8]
          : rand < 50
            ? [1, 1, 1, 1, 1, 1, 1, 1, 8, 8]
            : rand < 80
              ? [1, 1, 1, 1, 1, 1, 1, 8, 8, 8]
              : rand < 90
                ? [1, 1, 1, 1, 1, 1, 8, 8, 8, 8]
                : [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];
    }

    if (count === 4) {
      icons =
        rand < 10
          ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 8]
          : rand < 30
            ? [1, 1, 1, 1, 1, 1, 1, 1, 8, 8]
            : rand < 50
              ? [1, 1, 1, 1, 1, 1, 1, 8, 8, 8]
              : rand < 90
                ? [1, 1, 1, 1, 1, 1, 8, 8, 8, 8]
                : [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];
    }

    if (count === 5) {
      icons =
        rand < 10
          ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 8]
          : rand < 50
            ? [1, 1, 1, 1, 1, 1, 1, 1, 8, 8]
            : rand < 70
              ? [1, 1, 1, 1, 1, 1, 1, 8, 8, 8]
              : rand < 80
                ? [1, 1, 1, 1, 1, 1, 8, 8, 8, 8]
                : [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];
    }

    if (count === 6) {
      icons =
        rand < 20
          ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 8]
          : rand < 40
            ? [1, 1, 1, 1, 1, 1, 1, 1, 8, 8]
            : rand < 50
              ? [1, 1, 1, 1, 1, 1, 1, 8, 8, 8]
              : rand < 60
                ? [1, 1, 1, 1, 1, 1, 8, 8, 8, 8]
                : [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];
    }

    if (count === 7) {
      icons =
        rand < 10
          ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 8]
          : rand < 20
            ? [1, 1, 1, 1, 1, 1, 1, 1, 8, 8]
            : rand < 40
              ? [1, 1, 1, 1, 1, 1, 1, 8, 8, 8]
              : rand < 60
                ? [1, 1, 1, 1, 1, 1, 8, 8, 8, 8]
                : [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];
    }

    if (count === 8) icons = [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];

    return icons;
  }

  private static async ticketSpin(
    params: FortuneSpinParams,
    moneyPool: MoneyPoolMachine,
    minRate: number = 0,
    maxWinRate: number,
    freeModeBetCount: number,
  ) {
    const { playerId, baseBet, baseRate, lineRate, currency } = params;

    let specialStatus = await redisClient.get(`fortuneRabbit:freeMode:${playerId}`);

    const betMoney = baseBet * baseRate * lineRate;

    const totalBet = specialStatus === RabbitFreeModeStatus.Begin ? betMoney : 0;

    if (specialStatus === RabbitFreeModeStatus.Begin) await redisClient.set(`fortuneRabbit:initPrice:${playerId}`, maxWinRate * betMoney);

    const player = await GamePlayerService.getGamePlayerById(playerId);

    if (!player) throw new Error("player is not found");

    let icons: number[] = [];

    const winPositions = {};

    const iconRate = {};

    const positionAmount = 0;

    const totalWin_cache = await redisClient.get(`fortuneRabbit:totalWin:${playerId}`);

    const cache_win = totalWin_cache ? Number(totalWin_cache) : 0;

    const initPrice = await redisClient.get(`fortuneRabbit:initPrice:${playerId}`);

    const price =
      Number(initPrice) - cache_win > 0
        ? cache_win / Number(initPrice) < 0.6 || freeModeBetCount === 8
          ? Number(initPrice) - cache_win
          : (Number(initPrice) - cache_win) / 2
        : 0;

    const icons_count = this.getIconsByCount(freeModeBetCount);

    console.log(
      "initPrice",
      initPrice,
      "cache_win",
      cache_win,
      "price",
      price,
      "specialStatus",
      specialStatus,
      "player.id",
      player.id,
      icons_count,
    );

    if (icons_count.filter((item) => item === 8).length > 4) {
      const rand = random.int(0, 100);

      if (price <= 0) icons = rand < 50 ? [1, 1, 1, 1, 1, 1, 8, 8, 8, 8] : [1, 1, 1, 1, 1, 1, 1, 8, 8, 8];

      if (price > 0 && price <= 20 * betMoney) icons = [1, 1, 1, 1, 1, 8, 8, 8, 8, 8];

      if (price > 20 * betMoney && price <= 50 * betMoney) icons = [1, 1, 1, 1, 8, 8, 8, 8, 8, 8];

      if (price > 50 * betMoney && price <= 80 * betMoney) icons = [1, 1, 1, 8, 8, 8, 8, 8, 8, 8];

      if (price > 80 * betMoney)
        icons =
          rand < 40
            ? [1, 1, 8, 8, 8, 8, 8, 8, 8, 8]
            : rand < 80
              ? [1, 8, 8, 8, 8, 8, 8, 8, 8, 8]
              : [8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
    } else {
      icons = icons_count;
    }

    icons.sort((n1, n2) => Math.random() - 0.5);

    icons.push(99);

    icons.splice(3, 0, 99);

    const { cpf, cptw } = await this.getTickets(icons, betMoney, price);

    let totalWin = cptw;

    const fs_aw = totalWin + cache_win;

    const hashStr = await this.getHashStr(icons, winPositions, totalBet, totalWin, playerId);

    await redisClient.set(`fortuneRabbit:totalWin:${playerId}`, fs_aw);

    return {
      currency,
      player,
      playerId,
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(totalWin),
      winPositions,
      positionAmount,
      hashStr,
      icons,
      iconRate,
      fs_aw,
      cptw,
      cpf,
    };
  }

  static async specialSpin(
    params: FortuneSpinParams,
    moneyPool: MoneyPoolMachine,
    userGameStore: UserGameStore,
    maxWinRate: number,
    minWinRate: number,
  ): Promise<any> {
    await redisClient.incr(`fortuneRabbit:freeModeCount:${params.playerId}`);

    const specialStatus = await redisClient.get(`fortuneRabbit:freeMode:${params.playerId}`);

    let historyId = await redisClient.get(`fortuneRabbit:freeMode-historyId:${params.playerId}`);

    const freeModeBetCount = await redisClient.get(`fortuneRabbit:freeModeCount:${params.playerId}`);

    let ticketSpinRlt = await this.ticketSpin(params, moneyPool, minWinRate, maxWinRate, Number(freeModeBetCount));

    if (specialStatus === RabbitFreeModeStatus.Begin) {
      historyId = params.spinId;
      await redisClient.set(`fortuneRabbit:freeMode-historyId:${params.playerId}`, historyId);
      sqsClient.sendMessage(
        JSON.stringify({
          input: {
            historyId,
            currency: ticketSpinRlt.currency,
            totalBet: ticketSpinRlt.totalBet,
            operatorId: ticketSpinRlt.player.operatorId,
            ge: [ Number(ticketSpinRlt.totalWin) ? 3 : 2, 11 ],
            gameID: 1543462,
            playerId: ticketSpinRlt.playerId,
            profit: -ticketSpinRlt.totalBet,
            moneyPool: moneyPool as any,
          },
          balanceBefore: new Decimal(params.walletStore.beforeSpinBalance).toFixed(2),
        }),
        MESSAGEGROUP.HISTORY,
        ACTIONS.CREATEHISTORY,
      );
    }

    await params.walletStore.win(new Decimal(ticketSpinRlt.totalWin));

    console.log("specialStatus", specialStatus, "freeModeBetCount", freeModeBetCount);

    if (Number(freeModeBetCount) >= 8) {
      await redisClient.del(`fortuneRabbit:totalWin:${params.playerId}`);

      await redisClient.del(`fortuneRabbit:initPrice:${params.playerId}`);

      await redisClient.del(`fortuneRabbit:freeModeCount:${params.playerId}`);

      await redisClient.del(`fortuneRabbit:freeMode-historyId:${params.playerId}`);

      await redisClient.set(`fortuneRabbit:freeMode:${params.playerId}`, RabbitFreeModeStatus.End);

      await userGameStore.resetBetCount();
    }

    return { ...ticketSpinRlt, historyId };
  }

  public static async noPrizeSpin(params: FortuneSpinParams, moneyPool: MoneyPoolMachine) {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, walletStore } = params;
    const totalBet = baseBet * baseRate * lineRate;
    const config = await GameConfigService.getRandomNoPrize(1543462);
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

    sqsClient.sendMessage(
      JSON.stringify({
        input: {
          historyId: spinId,
          currency,
          totalBet,
          operatorId: player.operatorId,
          ge: [1, 11],
          gameID: 1543462,
          playerId,
          profit: -totalBet,
          moneyPool: moneyPool as any,
        },
        balanceBefore: new Decimal(walletStore.beforeSpinBalance).toFixed(2),
      }),
      MESSAGEGROUP.HISTORY,
      ACTIONS.CREATEHISTORY,
    );

    const fs_aw = 0;

    const { cpf, cptw } = await this.getTickets(icons, totalBet);

    await walletStore.win(new Decimal(0));

    return {
      winIndexes: [],
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(0),
      historyId: spinId,
      winPositions: {},
      positionAmount: {},
      hashStr: hashr,
      icons: icons as number[],
      iconRate: {},
      fs_aw,
      cpf,
      cptw,
    };
  }

  private static async normalSpin(
    params: FortuneSpinParams,
    moneyPool: MoneyPoolMachine,
    userGameStore: UserGameStore,
    slotController: SlotController,
  ) {
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, walletStore } = params;
    await redisClient.set(`fortuneRabbit:freeMode:${playerId}`, RabbitFreeModeStatus.NeverIN);
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    const totalBet = baseBet * baseRate * lineRate;

    slotController.set10Icons();

    const winIndexes = slotController.getWinLines10(PossibleWinLines);

    const icons = slotController.currentIcons;

    const winPositions = slotController.getWinPosition10(winIndexes, PossibleWinLines);

    const iconRate = slotController.getIconRate10(winIndexes, FortuneRabbitIconPayRate, PossibleWinLines);

    const positionAmount = slotController.getPositionAmount10({
      winIndexes,
      baseBet,
      baseRate,
      payRateConfigs: FortuneRabbitIconPayRate,
      PossibleWinLines,
    });

    const fs_aw = 0;

    const amount = await GameConfigService.getTicketAmount(1543462);

    const { cpf, cptw } = await this.getTickets(icons, totalBet, amount * totalBet);

    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);

    totalWin = totalWin + cptw;

    if (cptw > 0) {
      const userRtp = await userGameStore.getCurrentRTP();

      const rtpLevel = await userGameStore.getRtpLevel();

      if (!rtpLevel) throw new Error("rtp level not found");

      if (userRtp >= rtpLevel.max) return await this.noPrizeSpin(params, moneyPool);
    }

    sqsClient.sendMessage(
      JSON.stringify({
        input: {
          historyId: spinId,
          currency,
          totalBet,
          operatorId: player.operatorId,
          gameID: 1543462,
          playerId,
          ge: [1, 11],
          profit: -totalBet,
          moneyPool: moneyPool as any,
        },
        balanceBefore: new Decimal(walletStore.beforeSpinBalance).toFixed(2),
      }),
      MESSAGEGROUP.HISTORY,
      ACTIONS.CREATEHISTORY,
    );

    walletStore.win(new Decimal(totalWin));

    const hashStr = await this.getHashStr(icons, winPositions, totalBet, totalWin, playerId);
    return {
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(totalWin),
      winPositions,
      positionAmount,
      hashStr,
      icons,
      iconRate,
      historyId: spinId,
      fs_aw,
      cptw,
      cpf,
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
    let icons = cards.map((card) => FortuneCardIconMap.get(card.cardID));
    icons = icons.map((icon) => (icon === undefined ? -1 : icon));
    icons = icons.map(Number);
    return icons as number[];
  }

  static async getHashStr(icons: number[], winPositions: any, totalBet: number, winAmount: number, playerId: number) {
    const freeModeBetCount = await redisClient.get(`fortuneRabbit:freeModeCount:${playerId}`);
    const count = freeModeBetCount && Number(freeModeBetCount) ? Number(freeModeBetCount) - 1 : 0;
    let hashStr = `${count}:${icons[0]};${icons[4]};${icons[8]}#${icons[1]};${icons[5]};${icons[9]}#${icons[2]};${icons[6]};${icons[10]}#${icons[3]};${icons[7]};${icons[11]}`;
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

  public static async spin(params: FortuneSpinParams): Promise<{
    totalWin: Decimal;
    totalBet: Decimal;
    winPositions: any;
    iconRate: any;
    positionAmount: any;
    hashStr: string;
    icons: number[];
    historyId: string;
    specialStatus: RabbitFreeModeStatus;
    fs_aw: number;
    cpf: any;
    cptw: number;
  }> {
    const { playerId, baseBet, baseRate, lineRate, walletStore } = params;

    const totalBet = baseBet * baseRate * lineRate;

    await walletStore.init();

    const specialStatus = await redisClient.get(`fortuneRabbit:freeMode:${playerId}`);

    let userGameStore: null | UserGameStore = new UserGameStore(playerId, 1543462);

    await userGameStore.setBaseBet(baseBet);

    await userGameStore.setBaseRate(baseRate);

    const moneyPool = await userGameStore.getMoneyPool();

    const isNewer = await userGameStore.isNewer();

    const isTrail = await userGameStore.isTrail();

    const slotController = new SlotController({
      userId: playerId,
      iconWeightConfig: isTrail
        ? FortuneRabbitTrialIconWeights
        : isNewer
          ? FortuneRabbitNewerIconWeights
          : FortuneRabbitIconWeights,
    });

    if (specialStatus === RabbitFreeModeStatus.Begin) {
      await redisClient.set(`fortuneRabbit:freeMode:${playerId}`, RabbitFreeModeStatus.Process);
    }

    if (specialStatus === RabbitFreeModeStatus.End) {
      await redisClient.set(`fortuneRabbit:freeMode:${playerId}`, RabbitFreeModeStatus.NeverIN);
    }

    if (
      !specialStatus ||
      specialStatus === RabbitFreeModeStatus.NeverIN ||
      specialStatus === RabbitFreeModeStatus.End
    ) {

      let { type, maxWinRate, minWinRate } = await slotController.checkSpecialOrNormal(
        userGameStore,
        totalBet,
        FortuneRabbitSpecialUserRateRelation,
      );

      await userGameStore.addTotalBet(totalBet);

      await GameMoneyPoolService.putMoney(moneyPool, new Decimal(totalBet));

      await walletStore.bet(new Decimal(totalBet));

      triggerBetJob({ playerId, bet: totalBet, gameID: 1543462 });

      const tooHigh = await GameService.predictWinIsTooHigh(userGameStore, new Decimal(totalBet));

      const noPrizeCount = await userGameStore.getNoPrizeCount();

      if (tooHigh && Number(noPrizeCount) % random.int(5, 10) !== 0) {
        await userGameStore.addNoPrizeCount();
        const noPrizeResult = await this.noPrizeSpin(params, moneyPool);
        return { ...noPrizeResult, specialStatus: specialStatus as RabbitFreeModeStatus };
      }

      await redisClient.set(`fortuneRabbit:totalWin:${playerId}`, 0);

      await redisClient.set("fortuneRabbit:freeModeCount:" + playerId, 0);

      if (type === "special" && maxWinRate > 0) {
        await redisClient.set(`fortuneRabbit:freeMode:${playerId}`, RabbitFreeModeStatus.Begin);
        await redisClient.set(`fortuneRabbit:baseBet:${playerId}`, baseBet);
        await redisClient.set(`fortuneRabbit:baseRate:${playerId}`, baseRate);

        const specialResult = await this.specialSpin(params, moneyPool, userGameStore, maxWinRate, minWinRate);

        if (specialResult?.totalWin) {
          await GameMoneyPoolService.loseMoney(moneyPool, specialResult.totalWin);
          await userGameStore.addTotalWin(specialResult.totalWin.toNumber());
        }

        return { ...specialResult, specialStatus: specialStatus as RabbitFreeModeStatus };
      } else {
        const normalResult = await this.normalSpin(params, moneyPool, userGameStore, slotController);

        if (normalResult.totalWin.eq(0)) {
          await userGameStore.addNoPrizeCount();
        } else {
          await userGameStore.delNoPrizeCount();

          await userGameStore.addTotalWin(normalResult.totalWin.toNumber());

          await GameMoneyPoolService.loseMoney(moneyPool, normalResult.totalWin);
          triggerWinJob({
            playerId,
            gameID: 1543462,
            win: normalResult.totalWin.toNumber(),
          });
        }
        userGameStore = null;
        return {
          ...normalResult,
          specialStatus: specialStatus as RabbitFreeModeStatus,
        };
      }
    } else {
      const specialResult = await this.specialSpin(params, moneyPool, userGameStore, 0, 0);

      if (specialResult.totalWin) {
        await GameMoneyPoolService.loseMoney(moneyPool, specialResult.totalWin);
        triggerWinJob({
          playerId,
          gameID: 1543462,
          win: specialResult.totalWin.toNumber(),
        });

        await userGameStore.addTotalWin(specialResult.totalWin.toNumber());
      }

      return { ...specialResult, specialStatus: specialStatus as RabbitFreeModeStatus };
    }
  }

  static async parseModeResultByFreeModeStatus(
    specialStatus: RabbitFreeModeStatus,
    data: {
      lineRate: number;
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
      fs_aw: number;
      cpf: any;
      cptw: number;
    },
  ) {
    let {
      lineRate,
      fs_aw,
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
      cpf,
      cptw,
    } = data;
    let totalBet = baseBet * baseBetRate * lineRate;
    totalBet = +totalBet.toFixed(2);
    totalWin = +totalWin.toFixed(2);
    const profit =
      specialStatus == RabbitFreeModeStatus.Process || specialStatus == RabbitFreeModeStatus.End
        ? totalWin
        : Number((totalWin - totalBet).toFixed(2));
    switch (specialStatus) {
      case RabbitFreeModeStatus.NeverIN:
        return {
          aw: totalWin,
          st: 1,
          gwt: gwt,
          nst: 1,
          fstc: null,
          wp: Object.values(winPositions).length === 0 ? null : winPositions,
          orl: icons,
          rwsp: Object.values(iconRate).length === 0 ? null : iconRate,
          ctw: totalWin,
          lw: Object.values(positionAmount).length === 0 ? null : positionAmount,
          cpf,
          cptw,
          crtw: 0.0,
          iff: false,
          ift: random.int(100) < 3,
          imw: false,
          hashr: hashStr,
          psid: lastSpinId,
          sid: lastSpinId,
          ml: baseBetRate,
          cs: baseBet,
          rl: icons,
          tb: totalBet,
          tbb: totalBet,
          tw: totalWin,
          np: profit,
          fb: null,
          ge: cptw ? [3, 11] : [1, 11],
          fs: null,
        };
      case RabbitFreeModeStatus.Begin:
        return {
          aw: fs_aw,
          st: 1,
          gwt: gwt,
          nst: 2,
          ctw: totalWin,
          cwc: 3,
          fstc: null,
          pcwc: 3,
          wp: Object.values(winPositions || {}).length === 0 ? null : winPositions,
          orl: icons,
          rwsp: Object.values(iconRate || {}).length === 0 ? null : iconRate,
          lw: Object.values(positionAmount || {}).length === 0 ? null : positionAmount,
          cpf,
          cptw,
          crtw: 0.0,
          iff: true,
          ift: false,
          imw: false,
          hashr: hashStr,
          psid: lastSpinId,
          sid: lastSpinId,
          ml: baseBetRate,
          cs: baseBet,
          rl: icons,
          tb: totalBet,
          tbb: totalBet,
          tw: totalWin,
          np: profit,
          fb: null,
          ge: [totalWin ? 3 : 2, 11],
          fs: {
            s: 8 - freeModeCount,
            ts: 8,
            aw: fs_aw,
          },
        };
      case RabbitFreeModeStatus.Process:
        return {
          aw: fs_aw,
          st: 2,
          gwt: gwt,
          nst: 2,
          fstc: { 2: freeModeCount - 1 },
          wp: null,
          orl: icons,
          rwsp: null,
          ctw: totalWin,
          lw: null,
          cpf,
          cptw,
          crtw: 0.0,
          iff: true,
          ift: false,
          imw: false,
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
          ge: [totalWin ? 3 : 2, 11],
          fs: {
            s: 8 - freeModeCount,
            ts: 8,
            aw: fs_aw,
          },
        };
      case RabbitFreeModeStatus.End:
        return {
          aw: fs_aw,
          fstc: { 2: freeModeCount - 1 },
          gwt: gwt,
          ctw: totalWin,
          cwc: 1,
          st: 2,
          nst: 1,
          wp: null,
          orl: icons,
          rwsp: Object.values(iconRate).length === 0 ? null : iconRate,
          lw: null,
          cpf,
          cptw,
          crtw: 0.0,
          iff: false,
          ift: false,
          imw: false,
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
          fs: {
            s: 8 - freeModeCount,
            ts: 8,
            aw: fs_aw,
          },
        };
    }
  }
}
