// 从Prisma客户端导入所需的模型和类型，用于数据库操作。
import {
  GameHistory,
  GameHistoryStatus, // 导入游戏历史模型。
  MoneyPoolMachine, // 导入资金池模型。
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library"; // 用于处理高精度小数的库。
import { SpecialSpinStatus } from "gameConfigs";
import { HTTPException } from "hono/http-exception";
import { UserGameStore } from "models/UserGameStore";
import moment from "moment";
import { nanoid } from "nanoid";
import random from "random"; // 生成随机数的库。
// 导入服务层，用于处理业务逻辑。
import {
  ACTIONS,
  GameHistoryService,
  GamePlayerService,
  GameService,
  MESSAGEGROUP,
  WalletService,
  sqsClient,
} from "services";
//import { GameConfigService } from "services/GameConfigService"; // 游戏配置服务。
import { GameMoneyPoolService } from "services/GameMoneyPoolService"; // 游戏资金池服务。
import { TableService } from "services/TableService";
import { PgClient } from "utils";

import { redisClient } from "utils/redisClient"; // Redis客户端，用于缓存和状态管理。

// 定义旋转功能所需的参数类型。
export interface FortuneDoubleSpinParams {
  playerId: number; // 玩家ID。
  baseBet: number; // 基础下注金额。
  baseRate: number; // 基础倍率。
  lineRate: number; // 线倍率。
  currency: string; // 货币类型。
  spinId: string; // 旋转ID。
}

// 定义游戏过程中可能的特殊状态。
export enum FortuneDoubleSpecialStatus {
  //End = "neverIn", // 未进入状态。
  // Begin = "begin", // 开始状态。
  Process = "process", // 处理中状态。
  End = "end", // 结束状态。
}

// [0, 3, 6, 9, 12],     // Top row
// [1, 4, 7, 10, 13],    // Middle row
// [2, 5, 8, 11, 14],
// 可能的赢线数组。
export const FortuneDoublePossibleWinLines = [
  //1 Horizontal lines across the rows
  [1, 4, 7, 10, 13], // 1
  [0, 3, 6, 9, 12], //2

  [2, 5, 8, 11, 14], // 3
  [0, 4, 8, 10, 12], // 4
  [2, 4, 6, 10, 14], // 5

  [0, 3, 7, 9, 12], // 6
  [2, 5, 7, 11, 14], // 7
  [1, 5, 8, 11, 13], // 8
  [1, 3, 6, 9, 13], // 9
  [0, 4, 7, 10, 12], // 10

  [2, 4, 7, 10, 14], //11
  [1, 4, 6, 10, 13], //12
  [1, 4, 8, 10, 13], //13
  [0, 5, 8, 11, 12], //14
  [2, 3, 6, 9, 14], //15

  [1, 3, 7, 9, 13], //16
  [1, 5, 7, 11, 13], //17
  [0, 5, 6, 11, 12], //18
  [2, 3, 8, 9, 14], //19
  [0, 4, 6, 10, 12], //20

  [2, 4, 8, 10, 14], //21
  [0, 5, 7, 11, 12], //22
  [2, 3, 7, 9, 14], //23
  [1, 3, 8, 9, 13], //24
  [1, 5, 6, 11, 13], //25

  [0, 3, 8, 9, 12], //26
  [2, 5, 6, 11, 14], //27
  [0, 3, 6, 9, 13], //28
  [2, 5, 8, 11, 13], //29
  [1, 4, 7, 10, 12], //30
];

// export const FortuneDoubleCardIconMap: Map<number, number> = new Map([
//   [0, 0],
//   [1, 1],
//   [2, 2],
//   [3, 3],
//   [4, 4],
//   [5, 5],
//   [6, 6],
//   [7, 7],
//   [8, 8],
//   [9, 9],
//   [10, 10],
//   [11, 11],
//   [12, 12],
//   [13, 13],
//   [14, 14],
//   [15, 15],
//   [16, 16],
//   [17, 17],
//   [18, 18],
// ]);
//中奖赔率
export const FortuneDoubleCardValusMap: Map<number, number[]> = new Map([
  [0, [30, 50, 300, 500, 800, 1000, 1500, 3000]],
  [1, [30, 50, 300, 500, 800, 1000, 1500, 3000]],
  [2, []],
  [3, [20, 30, 100, 150, 500, 800, 1200, 1500]],
  [4, [20, 30, 100, 150, 500, 800, 1200, 1500]],
  [5, [15, 25, 80, 100, 300, 600, 1000, 1200]],
  [6, [15, 25, 80, 100, 300, 600, 1000, 1200]],
  [7, [12, 20, 60, 80, 200, 500, 800, 1000]],
  [8, [12, 20, 60, 80, 200, 500, 800, 1000]],
  [9, [10, 15, 50, 60, 150, 300, 500, 800]],
  [10, [10, 15, 50, 60, 150, 300, 500, 800]],
  [11, [5, 10, 30, 50, 80, 150, 300, 500]],
  [12, [5, 10, 30, 50, 80, 150, 300, 500]],
  [13, [5, 10, 30, 50, 80, 150, 300, 500]],
  [14, [5, 10, 30, 50, 80, 150, 300, 500]],
  [15, [5, 8, 15, 30, 50, 100, 150, 300]],
  [16, [5, 8, 15, 30, 50, 100, 150, 300]],
  [17, [5, 8, 15, 30, 50, 100, 150, 300]],
  [18, [5, 8, 15, 30, 50, 100, 150, 300]],
]);

type TableData = number[][];
//正常权重表
const gNormaWeight: TableData = [
  [0, 1, 1, 1, 1, 1],
  [3, 5, 5, 5, 5, 5],
  [5, 20, 20, 20, 20, 20],
  [7, 25, 25, 25, 25, 25],
  [9, 40, 40, 40, 40, 40],
  [11, 60, 60, 60, 60, 60],
  [13, 60, 60, 60, 60, 60],
  [15, 100, 100, 100, 100, 100],
  [17, 100, 100, 100, 100, 100],
  [1, 1, 1, 1, 1, 1],
  [4, 2, 2, 2, 2, 2],
  [6, 3, 3, 3, 3, 3],
  [8, 6, 6, 6, 6, 6],
  [10, 8, 8, 8, 8, 8],
  [12, 13, 13, 13, 13, 13],
  [14, 13, 13, 13, 13, 13],
  [16, 20, 20, 20, 20, 20],
  [18, 20, 20, 20, 20, 20],
  [2, 0, 45, 45, 45, 0],
];
//免费权重表
const gFreeWeight: TableData = [
  [0, 3, 3, 3, 3, 3],
  [3, 5, 5, 5, 5, 5],
  [5, 20, 20, 20, 20, 20],
  [7, 25, 25, 25, 25, 25],
  [9, 40, 40, 40, 40, 40],
  [11, 60, 60, 60, 60, 60],
  [13, 60, 60, 60, 60, 60],
  [15, 100, 100, 100, 100, 100],
  [17, 100, 100, 100, 100, 100],
  [1, 2, 2, 2, 2, 2],
  [4, 2, 2, 2, 2, 2],
  [6, 3, 3, 3, 3, 3],
  [8, 6, 6, 6, 6, 6],
  [10, 8, 8, 8, 8, 8],
  [12, 13, 13, 13, 13, 13],
  [14, 13, 13, 13, 13, 13],
  [16, 20, 20, 20, 20, 20],
  [18, 20, 20, 20, 20, 20],
  [2, 0, 10, 10, 10, 0],
];
//test权重表
const gtestWeight: TableData = [
  [0, 1, 1, 1, 1, 1],
  [3, 5, 5, 5, 5, 5],
  [5, 20, 20, 20, 20, 20],
  [7, 25, 25, 25, 25, 25],
  [9, 40, 40, 40, 40, 40],
  [11, 60, 60, 60, 60, 60],
  [13, 60, 60, 60, 60, 60],
  [15, 100, 100, 100, 100, 100],
  [17, 100, 100, 100, 100, 100],
  [1, 1, 1, 1, 1, 1],
  [4, 2, 2, 2, 2, 2],
  [6, 3, 3, 3, 3, 3],
  [8, 6, 6, 6, 6, 6],
  [10, 8, 8, 8, 8, 8],
  [12, 13, 13, 13, 13, 13],
  [14, 13, 13, 13, 13, 13],
  [16, 20, 20, 20, 20, 20],
  [18, 20, 20, 20, 20, 20],
  [2, 0, 11145, 11145, 11145, 0],
];
type GameItem = {
  name: string;
  cardID: number;
  realID: number;
  num: number;
};
const gNoWinCardId = [3, 5, 7, 9, 11, 13, 15, 17];
const gameItems: GameItem[] = [
  { name: "白搭", cardID: 0, realID: 0, num: 1 },
  { name: "白搭双", cardID: 1, realID: 0, num: 2 },
  { name: "喜", cardID: 2, realID: 2, num: 1 },
  { name: "戒指", cardID: 3, realID: 3, num: 1 },
  { name: "戒指双", cardID: 4, realID: 3, num: 2 },
  { name: "红包", cardID: 5, realID: 5, num: 1 },
  { name: "红包双", cardID: 6, realID: 5, num: 2 },
  { name: "鞋", cardID: 7, realID: 7, num: 1 },
  { name: "鞋双", cardID: 8, realID: 7, num: 2 },
  { name: "月饼", cardID: 9, realID: 9, num: 1 },
  { name: "月饼双", cardID: 10, realID: 9, num: 2 },
  { name: "A", cardID: 11, realID: 11, num: 1 },
  { name: "A双", cardID: 12, realID: 11, num: 2 },
  { name: "k", cardID: 13, realID: 13, num: 1 },
  { name: "k双", cardID: 14, realID: 13, num: 2 },
  { name: "Q", cardID: 15, realID: 15, num: 1 },
  { name: "Q双", cardID: 16, realID: 15, num: 2 },
  { name: "J", cardID: 17, realID: 17, num: 1 },
  { name: "J双", cardID: 18, realID: 17, num: 2 },
];

export class FortuneDoubleService {
  public static GameId = 48;

  // 正常旋转逻辑处理，计算玩家的赢取情况。
  private static async normalSpin(
    params: FortuneDoubleSpinParams, // 接收旋转的参数。
    moneyPool: MoneyPoolMachine, // 当前的资金池信息。
    userGameStore: UserGameStore,
    bFree: boolean,
  ) {
    //  let time = Date.now(); // 记录旋转开始的时间（用于性能监控或日志记录）。
    const { playerId, baseBet, baseRate, lineRate, currency, spinId } = params; // 解构旋转参数。
    const totalBet = baseBet * baseRate * lineRate;
    // 获取玩家的钱包信息，用于后续计算余额变化。
    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0; // 旋转前的余额。
    let balanceAfterSpin = balanceBeforeSpin; // 初始化旋转后的余额，初始值与旋转前相同。
    let balanceAfterWin = balanceAfterSpin; // 初始化赢取后的余额。
    await this.spendMoneyQueue({
      userGameStore,
      moneyPool,
      currency,
      historyId: spinId,
      totalBet: totalBet,
    });

    // // 确保玩家存在。
    // const player = await GamePlayerService.getGamePlayerById(playerId);
    // if (!player) {
    //   throw new Error("player is not found");
    // }

    // // 创建游戏历史记录。
    const player = await userGameStore.getPlayer();

    // 获取随机的15张卡片，用于此次旋转。
    let cards: GameItem[] = await this.getRandom15Cards(false);
    ////console.log("111111" + JSON.stringify(cards, null, 2)); // 美化输出
    // 计算赢的索引。
    let result = this.getWinLines(cards, baseBet * baseRate);

    ////console.log("icons " + icons);

    let lw = result.lw;
    // 如果 lw 不为空，计算总赢取金额
    let totalWin = 0;
    if (lw && Object.keys(lw).length > 0) {
      totalWin = Object.values(lw).reduce((prev, curr) => prev + curr, 0);
    }
    // 如果有赢取，则更新历史记录和玩家余额。
    if (totalWin > 0) {
      let maxMultiple = await this.playerRtpCheck(playerId, baseBet, baseRate, false);
      console.log("最大倍率 =" + maxMultiple + "win " + totalWin / totalBet);
      if (totalWin / totalBet > maxMultiple) {
        console.log("最大倍率 no win =" + maxMultiple.toString());
        // 获取随机的15张卡片，用于此次旋转。
        cards = await this.getRandom15CardsNoWin(false);
        ////console.log("111111" + JSON.stringify(cards, null, 2)); // 美化输出
        // 计算赢的索引。
        result = this.getWinLines(cards, baseBet * baseRate);

        ////console.log("icons " + icons);

        lw = result.lw;
        // 如果 lw 不为空，计算总赢取金额
        totalWin = 0;
      }
    }

    await sqsClient.sendMessage(
      JSON.stringify({
        input: {
          historyId: params.spinId,
          currency,
          totalBet,
          operatorId: player?.operatorId,
          ge: [1, 11],
          gameID: 48,
          playerId: playerId,
          profit: totalWin,
          moneyPool: moneyPool as any,
        },
        balanceBefore: new Decimal(balanceBeforeSpin).toFixed(4),
      }),
      MESSAGEGROUP.HISTORY,
      ACTIONS.CREATEHISTORY,
    );

    if (totalWin > 0) {
      // sqsClient.sendMessage(
      //   JSON.stringify({ historyId: spinId, profit: totalWin - totalBet }),
      //   MESSAGEGROUP.HISTORY,
      //   ACTIONS.UPDATEPROFIT,
      // );
      await userGameStore.addTotalWin(totalWin);
      await GameMoneyPoolService.loseMoney(moneyPool, new Decimal(totalWin));
    }
    const walletRecord = await WalletService.gameProfit({
      playerId,
      currency,
      amount: new Decimal(totalWin - totalBet),
      detail: {
        historyId: spinId,
      },
    });
    balanceAfterWin = walletRecord?.balanceAfter || balanceAfterSpin;
    //  balanceAfterWin = balanceAfterSpin;
    //const winIndexes = result.winIndexes;
    let wp = result.wp;

    const nk = result.nk;
    const rwsp = result.rwsp;
    const dbf3columHave = result.dbf3columHave; //夺宝num
    // 将卡片ID转换为图标索引。
    const icons = await this.turnCardToIcon(cards);

    // 生成验证字符串。
    //const hashStr = await this.getHashStr(icons, wp, totalBet, totalWin, playerId);
    let lwm = null;
    // 返回旋转结果。
    return {
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(totalWin),
      wp,
      lw,
      balanceAfterSpin,
      balanceBeforeSpin,
      balanceAfterWin,

      icons,
      iconRate: null,
      nk, //中奖次数
      dbf3columHave,
      lwm,
      rwsp,
    };
  }

  private static async freeSpin(
    params: FortuneDoubleSpinParams, // 接收旋转的参数。
    moneyPool: MoneyPoolMachine, // 当前的资金池信息。
    bFree: boolean,
    blost: boolean,
  ) {
    let time = Date.now(); // 记录旋转开始的时间（用于性能监控或日志记录）。
    const { playerId, baseBet, baseRate, lineRate, currency, spinId } = params; // 解构旋转参数。

    // 获取玩家的钱包信息，用于后续计算余额变化。
    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0; // 旋转前的余额。
    let balanceAfterSpin = balanceBeforeSpin; // 初始化旋转后的余额，初始值与旋转前相同。
    let balanceAfterWin = balanceAfterSpin; // 初始化赢取后的余额。

    let totalBet = 0; // 再次计算总下注金额，用于记录和计算。

    // 获取随机的15张卡片，用于此次旋转。
    let cards: GameItem[];
  
    if (blost) {
      console.log("ffffffnowin");
      cards = await this.getRandom15CardsNoWin(true);
    } else {
      cards = await this.getRandom15Cards(true);
    }
    // ////console.log("111111" + JSON.stringify(cards, null, 2)); // 美化输出
    // 计算赢的索引。
    const result = this.getWinLines(cards, baseBet * baseRate);
    const winIndexes = result.winIndexes;
    const wp = result.wp;
    const lw = result.lw;
    const nk = result.nk;
    const rwsp = result.rwsp;
    const dbf3columHave = result.dbf3columHave; //夺宝num
    // 将卡片ID转换为图标索引。
    const icons = await this.turnCardToIcon(cards);
    // ////console.log("icons " + icons);
    // 获取赢的位置。
    // const wp = this.getWinPosition(winIndexes);
    // 计算图标的赢取率。
    //const iconRate = await this.getIconRate(cards, winIndexes);

    // 计算每个位置的赢取金额。
    // const lw = this.getPositionAmount({
    //   cards,
    //   winIndexes,
    //   baseBet,
    //   baseRate,
    // });

    let lwm = null;
    // 返回旋转结果。
    return {
      totalBet: new Decimal(0),
      totalWin: new Decimal(0),
      wp,
      lw,
      balanceAfterSpin,
      balanceBeforeSpin,
      balanceAfterWin,
      hashStr: "",
      icons,
      //iconRate,
      record: {},
      nk, //中奖次数
      dbf3columHave,
      lwm,
      rwsp,
    };
  }

  // 检查指定列是否都包含数字2的函数
  static columnsContainTwo(arr: any): number {
    // 定义每一列的索引
    const indicesForColumn1 = [3, 4, 5];
    const indicesForColumn2 = [6, 7, 8];
    const indicesForColumn3 = [9, 10, 11];
    let num = 0;
    // 使用 some() 方法检查第1列是否包含至少一个2
    const hasTwoInColumn1 = indicesForColumn1.some((index) => arr[index].realID === 2);
    if (hasTwoInColumn1) {
      ++num;
    }
    // 使用 some() 方法检查第2列是否包含至少一个2
    const hasTwoInColumn2 = indicesForColumn2.some((index) => arr[index].realID === 2);
    if (hasTwoInColumn2) {
      ++num;
    }
    // 使用 some() 方法检查第3列是否包含至少一个2
    const hasTwoInColumn3 = indicesForColumn3.some((index) => arr[index].realID === 2);
    if (hasTwoInColumn3) {
      ++num;
    }

    // 如果所有指定的列都至少包含一个2，则返回 true
    return num;
  }

  /**
   * 根据当前旋转的卡片情况，确定哪些赢线是赢的。
   *
   * @param {GameItem[]} cards - 当前旋转的卡片，包含卡片ID和其它信息。
   * @returns {number[]} 赢线的索引数组，表示玩家赢得奖励的线。
   */
  private static getWinLines(cards: GameItem[], br: number) {
    const winIndexes: number[] = []; // 初始化一个空数组来存储赢线的索引。
    let wp: { [key: number]: number[] } = {}; // 初始化wp对象来存储赢线索引和对应的位置。
    let lw: { [key: number]: number } = {}; // 中奖金额
    let nk: { [key: number]: number } = {}; // 中奖次数
    let rwsp: { [key: number]: number } = {}; // 中奖倍数
    let dbf3columHave = this.columnsContainTwo(cards);

    // 遍历预定义的可能赢线。
    for (let index = 0; index < FortuneDoublePossibleWinLines.length; index++) {
      const line = FortuneDoublePossibleWinLines[index]; // 获取当前赢线的卡片位置。
      const [a, b, c, d, e] = line; // 解构赢线上的三个位置。

      // 获取对应位置上的卡片。
      const cardA = cards[a];
      const cardB = cards[b];
      const cardC = cards[c];
      const cardD = cards[d];
      const cardE = cards[e];
      // 检查卡片是否存在，跳过不存在的情况。
      // 检查卡片是否存在，记录不存在的卡片位置。
      let missingCards = [];
      if (cardA === undefined) missingCards.push(`cardA at position ${a}`);
      if (cardB === undefined) missingCards.push(`cardB at position ${b}`);
      if (cardC === undefined) missingCards.push(`cardC at position ${c}`);
      if (cardD === undefined) missingCards.push(`cardD at position ${d}`);
      if (cardE === undefined) missingCards.push(`cardE at position ${e}`);

      // 如果有卡片不存在，打印所有缺失的卡片位置和其对应的索引。
      if (missingCards.length > 0) {
        console.error(`Missing cards: ${missingCards.join(", ")}.`);
        ////console.log("cards" + JSON.stringify(cards, null, 2)); // 美化输出
      }
      //1是百搭.2是喜.双重符号：8,16,18,4,12,6,10,
      //2是喜-2,3,4列。
      // 如果任一卡片是特定类型（例如，cardID为1），该线不计为赢线。
      // if (cardA.cardID === 1 || cardB.cardID === 1 || cardC.cardID === 1) {
      //   continue;
      // }

      if (
        dbf3columHave < 3 &&
        // 三卡realID完全相等 或 任意卡为通配符，且其他两卡相等
        ((cardA.realID === cardB.realID && cardB.realID === cardC.realID) ||
          (cardA.realID === 0 && cardB.realID === cardC.realID) || // A为通配符，B和C相等
          (cardB.realID === 0 && cardA.realID === cardC.realID) || // B为通配符，A和C相等
          (cardC.realID === 0 && cardA.realID === cardB.realID) || // C为通配符，A和B相等
          // 任意两卡为通配符
          (cardA.realID === 0 && cardB.realID === 0) || // A和B为通配符
          (cardA.realID === 0 && cardC.realID === 0) || // A和C为通配符
          (cardB.realID === 0 && cardC.realID === 0) || // B和C为通配符
          // cardA和cardB的realID相同，且他们的num之和为3
          (cardA.realID === cardB.realID && cardA.num + cardB.num == 3) ||
          (cardA.realID === 0 && cardA.num + cardB.num == 3) || // A为通配符
          (cardB.realID === 0 && cardA.num + cardB.num == 3)) // B为通配符
      ) {
        if (cardA.num + cardB.num + cardC.num < 3) {
          continue;
        }
        if (cardB.realID == 2) {
          //dbf
          continue;
        }
        //百搭 和 双百搭不能代替
        if (cardA.cardID + cardB.cardID + cardC.cardID == 1) {
          continue;
        }

        let lwdata: number[] = [];

        let lineWinCardpos = 0; //线上中奖位置

        for (let i = 0; i < line.length; ++i) {
          let temp = cards[line[i]];
          //if (temp.cardID != 1) {
          //不上双百搭
          if (temp.realID == 0) {
            continue;
          }
          // 检查是否为非通配符
          // nonWildcardCard =cards[pos].realID
          lineWinCardpos = i;
          break;
          // }
        }
        let cardZhongJiang = cards[line[lineWinCardpos]];
        if (cardZhongJiang.cardID == 2) {
          continue;
        }
        //find wp
        let wpindex = 0;
        for (let i = 0; i < line.length; ++i) {
          let temp = cards[line[i]];
          if (temp.realID != 0 && temp.realID != cardZhongJiang.realID) {
            break;
          }

          wpindex = i;
        }
        // 记录符合条件的卡片位置到wp对象。
        let matchingPositions: number[] = []; // 初始化一个空数组来存储符合条件的位置。
        matchingPositions = line.slice(0, wpindex + 1);
        if (matchingPositions.length < 2) {
          continue;
        }
        wp[index + 1] = matchingPositions; // 保存位置到wp对象，并调整为基于1的索引。
        //3个
        let sumnum = 0;
        for (let i = 0; i < matchingPositions.length; ++i) {
          let cardt1 = cards[matchingPositions[i]];

          sumnum = sumnum + cardt1.num; // 累加每个位置对应卡片的num值

          // ////console.log("11111112" + JSON.stringify(cardt1, null, 2)); // 美化输出
        }
        if (sumnum < 3) {
          console.error("cards " + JSON.stringify(cards, null, 2));
          console.error("winIndexes " + JSON.stringify(winIndexes, null, 2));
          continue;
          //throw new Error("Error: sumnum is less than 3");
        }
        winIndexes.push(index); // 满足条件，添加索引到赢线索引数组。
        ////console.log("sumnum", sumnum);
        for (let i = matchingPositions.length; i < line.length; ++i) {
          let cardt1 = cards[line[i]];
          if (cardt1.realID == 0) {
          } else {
            if (cardt1.realID != cardZhongJiang.realID) {
              break;
            }
          }
          sumnum = sumnum + cardt1.num; // 累加每个位置对应卡片的num值
        }

        try {
          let indexn = sumnum - 3;

          if (indexn >= 0) {
            //获取中奖赔率
            const numbersArray: number[] = FortuneDoubleCardValusMap.get(cardZhongJiang.cardID);
            if (numbersArray && numbersArray.length > 0) {
              ////console.log("Values for key 2:", numbersArray);

              ////console.log("sumnum", sumnum);
              // let indexn = sumnum - 3;
              lw[index + 1] = numbersArray[indexn] * br; //赔率
              nk[index + 1] = sumnum;
              rwsp[index + 1] = numbersArray[indexn];
            }
          }

          // 如果解析成功，打印解析后的数组
          //////console.log("解析成功，数组内容：", numbersArray);
        } catch (error) {
          // 如果解析失败，捕获错误并处理
          ////console.log("112312=" + cardA.payRate);
          ////console.log("lineWinCardpos=" + lineWinCardpos);
          console.error("解析失败，错误信息：", error);
          // 这里可以添加你的错误处理逻辑
        }
      }
    }
    if (Object.keys(wp).length === 0) {
      // console.log("wp is empty");
      wp = null;
    }
    if (Object.keys(lw).length === 0) {
      //  console.log("lw is empty");
      lw = null;
    }
    if (Object.keys(nk).length === 0) {
      //  console.log("lw is empty");
      nk = null;
    }
    if (Object.keys(rwsp).length === 0) {
      //console.log("lw is empty");
      rwsp = null;
    }
    ////console.log("11wp:", JSON.stringify(wp, null, 2));
    ////console.log("winIndexes" + winIndexes); // 打印当前的winIndexes数组
    return { winIndexes, wp, lw, nk, dbf3columHave, rwsp }; // 返回赢线索引数组。
  }

  /**
   * 将卡片ID转换为对应的图标ID。
   *
   * @param {GameItem[]} cards - 包含卡片ID的数组。
   * @returns {number[]} 转换后的图标ID数组。
   */
  public static async turnCardToIcon(cards: GameItem[]): Promise<number[]> {
    //console.log("cards= " + JSON.stringify(cards, null, 2));

    // Flatten the array of arrays and map to cardID
    const cardIds = cards.map((card) => card.cardID);

    //console.log("icons= " + JSON.stringify(cardIds, null, 2));

    return cardIds; // Return the transformed array of cardID numbers.
  }

  /**
   * 生成包含游戏旋转结果和统计信息的哈希字符串。
   *
   * @param {number[]} icons - 当前旋转中显示的图标ID数组。
   * @param {Object} wp - 赢取位置的对象，键为赢线的标识，值为该线上的图标位置数组。
   * @param {number} totalBet - 当前旋转的总下注金额。
   * @param {number} winAmount - 当前旋转赢取的总金额。
   * @param {number} playerId - 玩家的ID。
   * @returns {string} 生成的哈希字符串。
   */
  // private static async getHashStr(icons: number[], wp: any, totalBet: number, winAmount: number, playerId: number) {
  //   // 从Redis获取当前玩家在免费模式下的下注总额。
  //   const freeModeBetAmount = await redisClient.get(`fortuneDouble:freeModeCount:${playerId}`);

  //   // 初始化哈希字符串，包含免费模式下的下注总额和前九个图标的ID。
  //   let hashStr = `${freeModeBetAmount || 0}:${icons.slice(0, 15).join(";").replace(/;/g, "#")}`;

  //   // 初始化赢线字符串，用于记录赢得位置的详细信息。
  //   let winLineStr = "";
  //   // 遍历赢得位置，为每个位置生成对应的字符串表示。
  //   if (wp) {
  //     for (const key in wp) {
  //       const pos = wp[key];
  //       // 找到非通配符的图标ID（假定通配符ID为2）。
  //       const iconIndex = pos.find((i) => icons[i] !== 2);
  //       const icon = icons[iconIndex] || 2; // 如果全部是通配符，则默认为2。
  //       let posStr = pos.map((i) => `${Math.floor(i / 3)}${i % 3}`).join("");
  //       // 将赢线信息添加到赢线字符串。
  //       winLineStr += `#R#${icon}#${posStr}`;
  //     }
  //   }

  //   // 添加下注和赢取金额的信息。
  //   const betInfoStr = `#MV#${totalBet.toFixed(1)}#MT#1#MG#${winAmount.toFixed(1)}#`;
  //   // 将所有部分组合成最终的哈希字符串。
  //   hashStr = `${hashStr}${winLineStr}${betInfoStr}`;

  //   return hashStr; // 返回生成的哈希字符串。
  // }

  public static async spin(params: FortuneDoubleSpinParams): Promise<{
    response: any;
  }> {
    // let timeUse = Date.now();

    const { playerId, baseBet, baseRate, lineRate, currency } = params;
    const mtotalBet = baseBet * baseRate * lineRate;

    let specialStatus = await redisClient.get(`fortuneDouble:freeMode:${playerId}`);

    let userGameStore: null | UserGameStore = new UserGameStore(playerId, FortuneDoubleService.GameId);

    // await userGameStore.setBaseBet(baseBet);
    // await userGameStore.setBaseRate(baseRate);
    let moneyPool = await userGameStore.getMoneyPool();

    const isNewer = await userGameStore.isNewer();
    const isTrail = await userGameStore.isTrail();
    // if (specialStatus === FortuneDoubleSpecialStatus.Begin) {
    //   await redisClient.set(`fortuneDouble:freeMode:${playerId}`, FortuneDoubleSpecialStatus.Process);
    // }
    let response;
    let normalResult;
    let normalResult1;
    // let record: GameHistory;
    // let mhistoryId: string =  params.spinId;

    //正常模式
    if (!specialStatus || specialStatus === FortuneDoubleSpecialStatus.End) {
      //  // moneyPool = await GameMoneyPoolService.putBetToMoneyPool(moneyPool.id, new Decimal(mtotalBet));
      //   await this.spendMoneyQueue({
      //     userGameStore,
      //     moneyPool,
      //     currency,
      //     historyId: params.spinId,
      //   });
      await userGameStore.setBaseBet(baseBet);
      await userGameStore.setBaseRate(baseRate);
      normalResult = await this.normalSpin(params, moneyPool, userGameStore, false);
      if (normalResult.totalWin.eq(0)) {
        await userGameStore.addNoPrizeCount();
      } else {
        await userGameStore.delNoPrizeCount();
      }

      // console.log(
      //   "双喜临门旋转================普通玩法结束",
      //   JSON.stringify({
      //     ...normalResult,
      //   }),
      // );
      // let maxMultiple = this.playerRtpCheck(playerId, baseBet, baseRate, false);
      // if (normalResult.totalWin / mtotalBet > maxMultiple) {
      //   normalResult = await this.normalSpin(params, moneyPool, false);
      // }

      //record = normalResult.record;
      const { dbf3columHave } = normalResult;
      ////console.log("dbf3columHave = " + dbf3columHave);
      let nownum = 0;
      let allnum = 0;
      if (dbf3columHave == 3) {
        nownum = 8;
        allnum = 8;
        await redisClient.set(`fortuneDouble:freeModeCount:${playerId}`, allnum);
        await redisClient.set(`fortuneDouble:freeModeCountNow:${playerId}`, nownum);
        await redisClient.set(`fortuneDouble:freeMode:${playerId}`, FortuneDoubleSpecialStatus.Process);
        await redisClient.set(`fortuneDouble:freeModeSpinParams:${playerId}`, JSON.stringify(params));

        //生成 免费记录
        ////console.log("aaaa nownum =" + nownum + "allnum " + allnum);
      }

      if (normalResult.totalWin == null) {
        console.error(`normalResult.totalWin ==null`);
        normalResult.totalWin = 0;
      }
      // if (totalWin.gt(0)) {
      //   await GameMoneyPoolService.putWinToMoneyPool(moneyPool.id, new Decimal(totalWin));
      //   let userGameStore: null | UserGameStore = new UserGameStore(playerId, 48);
      //   await userGameStore.addTotalWin(totalWin);
      // }

      /////////////// 正常模式 处理response
      let specialStatus = await redisClient.get(`fortuneDouble:freeMode:${playerId}`);

      //正常模式

      let freesi = null;
      let sc = 0;
      //console.log("specialStatus=" + specialStatus);
      let isfreeBegin = false;

      let ge = [1, 11];

      if (specialStatus == FortuneDoubleSpecialStatus.Process) {
        ge = [2, 11];
        await redisClient.set(`fortuneDouble:freeModeAW:${playerId}`, 0);
        //console.log("nownum =" + nownum + "allnum " + allnum);
        isfreeBegin = true;
        sc = 3;
        freesi = {
          // "fs" 在此上下文中可能表示免费模式的详细信息。
          rl: [
            // "rl" 可能表示规则列表，包含一系列数字。
            8, 16, 9, 11, 5, 18, 1, 2, 4, 12, 6, 17, 7, 15, 10,
          ],
          wp: null, // 在免费模式下的"wp"，当前无值。
          lw: null, // 在免费模式下的"lw"，当前无值。
          lwm: null, // 在免费模式下的"lwm"，当前无值。
          slw: null, // 在免费模式下的"slw"，当前无值。
          nk: null, // 在免费模式下的"nk"，当前无值。
          fsm: null, // "fsm" 的具体含义不明，可能是免费模式特有的一个参数，当前无值。
          s: nownum, // "s" 可能表示分数或状态，在免费模式下的值为8。
          ts: allnum, // "ts" 可能表示总分或时间戳，在免费模式下的值为8。
          as: null, // "as" 的含义不明，当前无值。
          aw: 0.0, // "aw" 可能表示平均重量或奖励，在免费模式下的值为0.00。
        };
      } else {
        freesi = null;
      }
      //console.log("result.rwsp "+result.rwsp)
      response = {
        dt: {
          // "dt" 可能代表 "data"，封装了主要的数据对象。
          si: {
            // "si" 可能代表 "session info"（会话信息）或 "state information"（状态信息），包含会话或状态的详细信息。
            wp: isfreeBegin ? null : normalResult.wp, // "wp" 可能代表 "winning points"（获胜点数）, "weapon"（武器）等，当前为null。
            lw: normalResult.lw, // "lw" 可能代表 "last win"（最后胜利）或 "last word"（最后的词），也是null。
            lwm: null, //暂时用lw // "lwm" 的含义不明确，可能与 "lw" 相关，同样是null。
            slw: [
              // "slw" 可能是一个数组，代表 "slow"（慢）或 "sliding window"（滑动窗口），持有数值数据。
              normalResult.totalWin == null ? 0 : normalResult.totalWin,
            ],
            nk: isfreeBegin ? null : normalResult.nk, // "nk" 可能代表 "nickname"（昵称）或 "network key"（网络密钥），这里为null。
            sc: isfreeBegin ? 3 : 0, // "sc" 很可能代表 "score"（得分），初始化为0。
            fs: freesi, // "fs" 可能意味着 "full score"（满分），"file size"（文件大小）等，当前为null。
            gwt: -1, // "gwt" 可能代表某种特定于应用的权重或时间，这里为-1。
            fb: null, // "fb" 的具体含义不明，可能是某种标志或反馈，为null。
            ctw: normalResult.totalWin, // "ctw" 可能代表 "current total weight"（当前总重量）或类似的含义，为0.0。
            pmt: null, // "pmt" 的含义不清楚，可能是某种方法或时间参数，为null。
            cwc: isfreeBegin ? 0 : normalResult.totalWin > 0 ? 1 : 0, // "cwc" 可能表示 "current win count"（当前胜利计数）或 "current working count"（当前工作计数），为0。
            fstc: null, // "fstc" 的具体含义不明，可能是某种状态码或计数，为null。
            pcwc: normalResult.totalWin >= 0 ? 1 : 0, // "pcwc" 的含义不清楚，可能与 "cwc" 类似，表示某种计数，为0。
            rwsp: {
              "0": normalResult.rwsp,
            },
            hashr: "", // "hashr" 可能是一个编码或散列字符串，具体含义根据应用不同而不同。
            ml: baseRate, // "ml" 可能代表 "maximum level"（最大等级）、"machine learning"（机器学习）等，这里为2。
            cs: baseBet, // "cs" 可能代表 "current speed"（当前速度）或 "confidence score"（信心分数），为0.3。
            // "rl": [                     // "rl" 可能是 "rule list"（规则列表）或 "reward level"（奖励等级）的数组。
            // 15, 16, 17, 18, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
            // ],
            rl: normalResult.icons,
            sid: "1777176061806575104", // "sid" 通常代表 "session ID"（会话ID）或 "state ID"（状态ID）。
            psid: "1777176061806575104", // "psid" 可能表示 "previous session ID"（上一个会话ID）或 "parent session ID"（父会话ID）。
            st: 1, // "st" 可能代表 "status"（状态）或 "stage"（阶段），这里为1。
            nst: ge[0], // "nst" 可能代表 "next status"（下一个状态）或 "new stage"（新阶段），为1。
            pf: 4, // "pf" 的含义不明确，可能代表 "performance"（表现）或 "preference"（偏好），为4。
            aw: 0.0, // "aw" 可能代表 "average weight"（平均重量）或 "award"（奖励），为0.00。
            wid: 0, // "wid" 可能代表 "widget ID"（小部件ID）或 "window ID"（窗口ID），为0。
            wt: "C", // "wt" 可能代表 "weight type"（重量类型）或 "win type"（胜利类型），这里为"C"。
            wk: "0_C", // "wk" 的具体含义不明，可能是某种键或标识符，这里为"0_C"。
            wbn: null, // "wbn" 的含义不清楚，可能是某种编号或名称，为null。
            wfg: null, // "wfg" 可能代表 "warning flag"（警告标志）或 "widget flag"（小部件标志），为null。
            bl: normalResult.balanceAfterWin,
            blab: normalResult.balanceAfterSpin,
            blb: normalResult.balanceBeforeSpin,
            tb: mtotalBet, // "tb" 可能代表 "total bet"（总下注）或 "total balance"（总余额），为18.00。
            tbb: mtotalBet, // "tbb" 可能代表 "total bet before"（下注前总额）或 "total balance before"（之前的总余额），为18.00。
            tw: normalResult.totalWin.toFixed(2), // "tw" 可能代表 "total win"（总胜利）或 "total weight"（总重量），为0.00。
            np: (-mtotalBet).toFixed(2), // "np" 可能代表 "net profit"（净利润）或 "new position"（新位置），为-18.00。
            ocr: null, // "ocr" 的具体含义不明，可能是某种识别码或请求代码，为null。
            mr: null, // "mr" 可能代表 "match result"（比赛结果）或 "machine read"（机器读取），为null。
            ge: ge,
          },
        },
        err: null,
      };

      let twla = normalResult.totalWin - mtotalBet;
      if(dbf3columHave ==3)
      {

        await redisClient.set(`fortuneDouble:freeModeHistoryID:${playerId}`,  params.spinId);
        const detailRecord = {
          tid: params.spinId,
          tba: mtotalBet ,
          twla,
          bl: normalResult.balanceAfterWin,
          bt: new Date().getTime(),
          totalBet: mtotalBet,
          gd: response.dt.si,
        };
        let tempstring = JSON.stringify([detailRecord]);
        await redisClient.set(`fortuneDouble:freeModeDetails:${playerId}`, tempstring);
        this.pushDetailByStatus({
          historyId: params.spinId,
          gameID: 48,
          detail: tempstring,
          balanceAfterSpin: this.formatDecimal(Number(normalResult.balanceAfterWin)),
          totalWin: twla,
          ge:"1,2,11"
        });
      }
      else
      {
        const detailRecord = {
          tid: params.spinId,
          tba: mtotalBet,
          twla,
          bl: normalResult.balanceAfterWin,
          bt: new Date().getTime(),
          totalBet: mtotalBet,
          gd: response.dt.si,
        };
        let tempstring = JSON.stringify([detailRecord]);
        this.pushDetailByStatus({
          historyId: params.spinId,
          gameID: 48,
          detail: tempstring,
          balanceAfterSpin: this.formatDecimal(Number(normalResult.balanceAfterWin)),
          totalWin: twla,
          ge:"1,11"
        });
      }


    } else {
      //免费模式

      // 递减操作
      await redisClient.decr(`fortuneDouble:freeModeCountNow:${playerId}`, (err, result) => {
        if (err) {
          console.error("Error decrementing value:", err);
        } else {
        }
      });

      normalResult = await this.freeSpin(params, moneyPool, true, false);

      normalResult1 = await this.freeSpin(params, moneyPool, true, false);
      //第一次
      let totalWin0 = 0;
      let totalWin1 = 0;
      if (normalResult.lw != null && normalResult1.lw != null) {
        normalResult.lwm = this.multiplyValues(normalResult.lw, 8);
        normalResult1.lwm = this.multiplyValues(normalResult1.lw, 8);
        if (normalResult.lwm && Object.keys(normalResult.lwm).length > 0) {
          totalWin0 = Object.values(normalResult.lwm).reduce((prev, curr) => prev + curr, 0);
        }
        if (normalResult1.lwm && Object.keys(normalResult1.lwm).length > 0) {
          totalWin1 = Object.values(normalResult1.lwm).reduce((prev, curr) => prev + curr, 0);
        }
      } else {
        if (normalResult.lw && Object.keys(normalResult.lw).length > 0) {
          totalWin0 = Object.values(normalResult.lw).reduce((prev, curr) => prev + curr, 0);
        }
        if (normalResult1.lw && Object.keys(normalResult1.lw).length > 0) {
          totalWin1 = Object.values(normalResult1.lw).reduce((prev, curr) => prev + curr, 0);
        }
      }
      let allwin = totalWin0 + totalWin1;
      if (allwin > 0) {
        let maxMultiple = await this.playerRtpCheck(playerId, baseBet, baseRate, false);
        let winMultiple = (allwin / mtotalBet) * 8;
        //   console.log("最大倍率 =" + maxMultiple + "win " + allwin / mtotalBet);
        console.log("最大倍率 =" + maxMultiple + "win " + winMultiple);
        if (winMultiple > maxMultiple) {
          console.log("ffffffffff");
          normalResult = await this.freeSpin(params, moneyPool, true, true);

          normalResult1 = await this.freeSpin(params, moneyPool, true, true);
          totalWin0 = 0;
          totalWin1 = 0;
          ////第二次
          if (normalResult.lw != null && normalResult1.lw != null) {
            normalResult.lwm = this.multiplyValues(normalResult.lw, 8);
            normalResult1.lwm = this.multiplyValues(normalResult1.lw, 8);
            if (normalResult.lwm && Object.keys(normalResult.lwm).length > 0) {
              totalWin0 = Object.values(normalResult.lwm).reduce((prev, curr) => prev + curr, 0);
            }
            if (normalResult1.lwm && Object.keys(normalResult1.lwm).length > 0) {
              totalWin1 = Object.values(normalResult1.lwm).reduce((prev, curr) => prev + curr, 0);
            }
          } else {
            if (normalResult.lw && Object.keys(normalResult.lw).length > 0) {
              totalWin0 = Object.values(normalResult.lw).reduce((prev, curr) => prev + curr, 0);
            }
            if (normalResult1.lw && Object.keys(normalResult1.lw).length > 0) {
              totalWin1 = Object.values(normalResult1.lw).reduce((prev, curr) => prev + curr, 0);
            }
          }

          console.log("ffffffffff" + totalWin1 + "totalWin0=" + totalWin0);
        }
      }

      if (normalResult.dbf3columHave > 0) {
        await redisClient.incrBy(`fortuneDouble:freeModeCountNow:${playerId}`, normalResult.dbf3columHave);
        await redisClient.incrBy(`fortuneDouble:freeModeCount:${playerId}`, normalResult.dbf3columHave);
      }
      if (normalResult1.dbf3columHave > 0) {
        await redisClient.incrBy(`fortuneDouble:freeModeCountNow:${playerId}`, normalResult1.dbf3columHave);
        await redisClient.incrBy(`fortuneDouble:freeModeCount:${playerId}`, normalResult1.dbf3columHave);
      }
      normalResult.totalWin = totalWin0;
      normalResult1.totalWin = totalWin1;
      // 计算总赢取金额。

      // // 确保玩家存在。
      const player = await GamePlayerService.getGamePlayerById(playerId);
      if (!player) {
        throw new Error("player is not found");
      }

      let HistoryID = await redisClient.get(`fortuneDouble:freeModeHistoryID:${playerId}`);

      // if (HistoryID == null || HistoryID == "") {
      //   //  // 创建游戏历史记录。

      //   HistoryID = params.spinId;

      //   await sqsClient.sendMessage(
      //     JSON.stringify({
      //       input: {
      //         historyId: params.spinId,
      //         currency,
      //         mtotalBet,
      //         operatorId: player?.operatorId,
      //         ge: [1,2, 11],
      //         gameID: 48,
      //         playerId: playerId,
      //         profit: 0,
      //         moneyPool: moneyPool as any,
      //       },
      //       balanceBefore: new Decimal(normalResult.balanceBeforeSpin).toFixed(4),
      //     }),
      //     MESSAGEGROUP.HISTORY,
      //     ACTIONS.CREATEHISTORY,
      //   );

      //   await redisClient.set(`fortuneDouble:freeModeHistoryID:${playerId}`, HistoryID);
      // } else {
      //   // = HistoryID;
      // }
      let all = normalResult1.totalWin + normalResult.totalWin;
      await redisClient.incrByFloat(`fortuneDouble:freeModeAW:${playerId}`, all);
      const tempaw = await redisClient.get(`fortuneDouble:freeModeAW:${playerId}`);
      const aw = parseFloat(tempaw);

      // // 如果有赢取，则更新历史记录和玩家余额。
      // if (all > 0)
      {
        // record = await GameHistoryService.updateProfitById(mhistoryId, new Decimal(aw));
        // const walletRecord = await WalletService.gameWin({
        //   playerId,
        //   currency: params.currency,
        //   amount: aw,
        //   detail: { historyId: record.id },
        // });
        if (all > 0) {
          // sqsClient.sendMessage(
          //   JSON.stringify({ historyId: mhistoryId.toString(), profit: all }),
          //   MESSAGEGROUP.HISTORY,
          //   ACTIONS.UPDATEPROFIT,
          // );
          await userGameStore.addTotalWin(all);
          await GameMoneyPoolService.loseMoney(moneyPool, new Decimal(all));
        }
        // await this.spendMoneyQueue({
        //   userGameStore:userGameStore,
        //   moneyPool,
        //   currency,
        //   mhistoryId,
        //   totalBet:0
        // });
        let walletRecord = await WalletService.gameProfitEx({
          playerId,
          currency,
          amount: new Decimal(all),
          detail: {
            HistoryID,
          },
        });
        normalResult.balanceAfterWin = walletRecord.balanceAfter;
      }
      // normalResult.record = record;

      /////////////////////////////////////////////// begin


      let tempa = await redisClient.get(`fortuneDouble:freeModeCountNow:${playerId}`);

      let tempall = await redisClient.get(`fortuneDouble:freeModeCount:${playerId}`);
      let nownum = 0;

      let allnum = 0;

      if (tempa != null) {
        nownum = parseInt(tempa);
        allnum = parseInt(tempall);
      }



      let gwt = 0;
      if (normalResult.totalWin > 0) {
        gwt += 1;
      }
      if (normalResult1.totalWin > 0) {
        gwt += 1;
      }
      if (normalResult.totalWin <= 0 && normalResult1.totalWin <= 0) {
        gwt = -1;
      }
      let newslw0 = +normalResult1.totalWin.toFixed(1);
      let newslw1 = +normalResult.totalWin.toFixed(1);

      let slwfrees = [newslw0];
      let slwfreex = [newslw1];
      let fsm = null;
      if (newslw0 > 0 && newslw1 > 0) {
        fsm = 8;
        slwfrees = [parseFloat((newslw0 / 8).toFixed(1)), newslw0];
        slwfreex = [parseFloat((newslw1 / 8).toFixed(1)), newslw1];
      }
      let as = normalResult.dbf3columHave + normalResult1.dbf3columHave;
      response = {
        dt: {
          si: {
            // "si" 可能代表 "session info"（会话信息）或 "state information"（状态信息），包含会话或状态的详细信息。
            wp: normalResult.wp, // "wp" 可能代表 "winning points"（获胜点数）, "weapon"（武器）等，当前为null。
            lw: normalResult.lw, // "lw" 可能代表 "last win"（最后胜利）或 "last word"（最后的词），也是null。
            lwm: normalResult.lwm, //暂时用lw // "lwm" 的含义不明确，可能与 "lw" 相关，同样是null。
            slw: slwfreex,
            nk: normalResult.nk, // "nk" 可能代表 "nickname"（昵称）或 "network key"（网络密钥），这里为null。
            sc: 0, // "sc" 很可能代表 "score"（得分），初始化为0。
            fs: {
              // "fs" 在此上下文中可能表示免费模式的详细信息。
              rl: normalResult1.icons,
              wp: normalResult1.wp, // 在免费模式下的"wp"，当前无值。
              lw: normalResult1.lw, // 在免费模式下的"lw"，当前无值。
              lwm: normalResult1.lwm, // 上下 中奖 8倍。
              slw: slwfrees, // 在免费模式下的"slw"，当前无值。
              nk: normalResult1.nk, // 次数
              fsm: fsm, // "fsm" 的具体含义不明，可能是免费模式特有的一个参数，当前无值。
              s: nownum, // "s" 可能表示分数或状态，在免费模式下的值为8。
              ts: allnum, // "ts" 可能表示总分或时间戳，在免费模式下的值为8。
              as: as == 0 ? null : as, //增加免费次数
              aw: aw, // 累计赢奖
            },

            gwt: gwt, //
            fb: null,
            ctw: normalResult.totalWin + normalResult1.totalWin,
            pmt: null,
            cwc: normalResult.totalWin + normalResult1.totalWin > 0 ? 1 : 0,
            fstc: {
              "2": allnum - nownum,
            },
            pcwc: 0,
            rwsp: {
              "0": normalResult1.rwsp, //上
              "1": normalResult.rwsp, //下
            },
            hashr: "10:17;15;7;15;13#9;4;17;9;11#8;16;7;17;17#15;7;8;3;8#15;13;11;16;3#15;13;11;17;17#MG#0#",
            ml: 2,
            cs: 0.3,
            rl: normalResult.icons,
            sid: "1776595646393810432",
            psid: "1776595584007732736",
            st: 2,
            nst: nownum > 0 ? 2 : 1,
            pf: 4,
            aw: aw,
            wid: 0,
            wt: "C",
            wk: "0_C",
            wbn: null,
            wfg: null,
            bl: this.formatDecimal(Number(normalResult.balanceAfterWin)),
            blab: this.formatDecimal(Number(normalResult.balanceAfterSpin)),
            blb: this.formatDecimal(Number(normalResult.balanceBeforeSpin)),
            tb: 0, //si.tb, // "tb" 可能代表 "total bet"（总下注）或 "total balance"（总余额），为18.00。
            tbb: mtotalBet, // "tbb" 可能代表 "total bet before"（下注前总额）或 "total balance before"（之前的总余额），为18.00。
            tw: this.formatDecimal(Number(normalResult.totalWin + normalResult1.totalWin)), // "tw" 可能代表 "total win"（总胜利）或 "total weight"（总重量），为0.00。
            np: this.formatDecimal(Number(normalResult.totalWin + normalResult1.totalWin)), // "np" 可能代表 "net profit"（净利润）或 "new position"（新位置），为-18.00。

            ocr: null,
            mr: null,
            ge: [nownum > 0 ? 2 : 1, 11],
          },
        },
        err: null,
      };
      if (nownum == 0) {
        await redisClient.set(`fortuneDouble:freeMode:${playerId}`, FortuneDoubleSpecialStatus.End);
        await redisClient.set(`fortuneDouble:freeModeHistoryID:${playerId}`, "");
      }
      console.log("nownum " + nownum);
      let twla = normalResult.totalWin + normalResult1.totalWin;
      if (twla > 0) {
        let userGameStore: null | UserGameStore = new UserGameStore(playerId, 48);
        await userGameStore.addTotalWin(twla);
      }
      //record = await GameHistoryService.getByHistoryId(mhistoryId);
      const detailRecord = {
        tid: HistoryID,
        tba: 0,
        twla: twla,
        bl: normalResult.balanceAfterWin,
        bt: new Date().getTime(),

        gd: response.dt.si,
      };
      let jsonObject: any[] = [];
      let lastdetails = await redisClient.get(`fortuneDouble:freeModeDetails:${playerId}`);
      if (lastdetails == null || lastdetails === "") {
        // 如果 record.detail 是空字符串，则直接将新对象添加到 jsonObject 数组中
        jsonObject.push(detailRecord);
        console.log("record.detail == null");
      } else {
        // 如果 record.detail 不是空字符串，则先解析为对象数组，然后将新对象添加到数组中
        try {
          jsonObject = JSON.parse(lastdetails);
          jsonObject.push(detailRecord);
        } catch (error) {
          console.error("Failed to parse record.detail:", error);
        }
      }

      // console.log("jsonObject111111111" + JSON.stringify(jsonObject, null, 2)); // 美化输出
      let strtemp = JSON.stringify(jsonObject);
      console.log(strtemp);
      if (nownum == 0)
      {
        await redisClient.set(`fortuneDouble:freeModeDetails:${playerId}`, "");
      }
      else
      {
        await redisClient.set(`fortuneDouble:freeModeDetails:${playerId}`, strtemp);
      }

      //console.log("2222222"+ JSON.stringify(jsonObject, null, 2))
      // 这里放置延时1秒后需要执行的代码
      this.pushDetailByStatus({
        historyId: HistoryID,
        gameID: 48,
        detail: strtemp,
        balanceAfterSpin: this.formatDecimal(Number(normalResult.balanceAfterSpin)),
        totalWin:aw,
        ge:"1,2,11"
      });

      // await GameHistoryService.updateDetail(record.historyId, strtemp);
      ////////////////////////////////////////////////end
    }

    return {
      response,
    };
  }
  public static multiplyValues(obj: Record<string, number>, multiplier: number): Record<string, number> {
    // Convert the object into an array of [key, value] pairs,
    // multiply each value, and then convert it back into an object
    const multipliedEntries = Object.entries(obj).map(([key, value]) => [key, value * multiplier]);

    // Convert the array of entries back into an object
    const multipliedObject = Object.fromEntries(multipliedEntries);
    return multipliedObject;
  }

  //双喜临门 3*5
  static async getRandom15Cards(bFree: boolean): Promise<GameItem[]> {
    const cards: GameItem[] = [];

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; ++j) {
        try {
          const card = await this.getRandomCardBy5Column(i, bFree);
          //  console.log("11111" + bFree);
          const itemsWithCardID0 = gameItems.filter((item) => item.cardID === card[0]);
          // console.log("itemsWithCardID0 = " + JSON.stringify(itemsWithCardID0, null, 2));
          // Assuming you want to flatten the array and push all items individually
          itemsWithCardID0.forEach((item) => cards.push(item));
        } catch (error) {
          console.error("Error fetching card: ", error);
        }
      }
    }

    //console.log("Final cards = " + JSON.stringify(cards, null, 2));
    return cards;
  }
  static async getRandom15CardsNoWin(bFree: boolean): Promise<GameItem[]> {
    const cards: GameItem[] = [];
    const gNoWinCardId1 = [3, 5, 7, 9, 11, 13, 15, 17];
    const uniqueCardIDs: Set<number> = new Set(); // 用于存储已经选择过的 cardID
    let num = 0;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; ++j) {
        try {
          if (num < 6) {
            // 根据循环计数器的值获取对应的 cardID
            const cardID = gNoWinCardId1[num];

            const foundItem = gameItems.find((item) => item.cardID === cardID);
            //    console.log("GameItem" + cardID +"index ="+(num ));
            if (foundItem) {
              cards.push(foundItem);
              // console.log("找到的 GameItem：", foundItem);
            } else {
              console.log("未找到与 cardID 匹配的 GameItem" + cardID + "index =" + num);
            }
          } else {
            const card = await this.getRandomCardBy5Column(i, bFree);
            const itemsWithCardID0 = gameItems.filter((item) => item.cardID === card[0]);
            itemsWithCardID0.forEach((item) => cards.push(item));
          }
          ++num;
        } catch (error) {
          console.error("Error fetching card: ", error);
        }
      }
    }
    //console.log("Final cards = " + JSON.stringify(cards, null, 2));
    return cards;
  }
  static async getRandomCardBy5Column(column: number, bFree: boolean) {
    const columnType = column + 1;

    let configs = gNormaWeight; //await this.get5ColumnsCardWeight(gameID);
    if (bFree) {
      configs = gFreeWeight;
    }
    //test

    // if (!bFree) {
    //   configs = gtestWeight;
    //   console.log("testwegingt");
    // } else {
    //   console.log("not test testwegingt" + bFree);
    // }

    // 先过滤掉权重为0的配置项
    configs = configs.filter((config) => (config as any)[columnType] > 0);

    // 对剩余的配置数组按照当前列的权重进行升序排序
    configs = configs.sort((a, b) => (a as any)[columnType] - (b as any)[columnType]);

    // 提取出排序后配置数组中每个元素的权重，并存储在showWeights数组中
    let showWeights = configs.map((config) => (config as any)[columnType] as number);

    // 计算showWeights数组中所有权重的总和
    const totalWeight = showWeights.reduce((prev, curr) => prev + curr, 0);

    // 生成一个介于0和总权重之间的随机数
    const randomWeight = random.float(0, totalWeight);

    let weight = 0;

    // 遍历排序后的配置数组
    for (const config of configs) {
      // 累加当前遍历到的元素的权重
      weight += (config as any)[columnType];

      // 如果累计权重大于或等于生成的随机数，则返回当前遍历到的配置元素
      if (randomWeight <= weight) {
        return config;
      }
    }
  }
  static async playerLogin(playerId: number) {
    try {
      // 获取免费状态
      let specialStatus = await redisClient.get(`fortuneDouble:freeMode:${playerId}`);
      console.log("specialStatus = " + specialStatus);

      if (specialStatus == FortuneDoubleSpecialStatus.Process) {
        // 获取旋转参数
        let strtemp = await redisClient.get(`fortuneDouble:freeModeSpinParams:${playerId}`);
        if (strtemp != null) {
          let param = JSON.parse(strtemp);
          //console.log("param" + JSON.stringify(param, null, 2)); // 美化输出

          let n = 60;
          while (n > 0 && specialStatus == FortuneDoubleSpecialStatus.Process) {
            --n;
            await this.spin(param);
            specialStatus = await redisClient.get(`fortuneDouble:freeMode:${playerId}`);
            //  console.log("specialStatus = " + n);
          }
        }
        await redisClient.set(`fortuneDouble:freeMode:${playerId}`, FortuneDoubleSpecialStatus.End);
        await redisClient.set(`fortuneDouble:freeModeHistoryID:${playerId}`, "");
        // await redisClient.set(`fortuneDouble:freeModeDetails:${playerId}`, "");
      }
    } catch (error) {
      console.error("Error in playerLogin:", error);
      // 在此处处理异常，例如记录日志或者执行其他必要的操作
    }
  }
  static async playerRtpCheck(playerId: number, baseBet: number, baseRate: number, bFree: boolean) {
    let userGameStore: null | UserGameStore = new UserGameStore(playerId, 48);

    await userGameStore.setBaseBet(baseBet);
    await userGameStore.setBaseRate(baseRate);
    const moneyPool = await userGameStore.getMoneyPool();

    const totalBet = baseBet * baseRate * 30;
    // if (!bFree) {
    //   userGameStore.addTotalBet(totalBet);
    // }

    const userRtp = await userGameStore.getCurrentRTP();
    //const betCount = await userGameStore.getBetCount();
    const rtpLevel = await userGameStore.getRtpLevel();
    const betLevel = await userGameStore.getBetLevel();

    console.log(
      `playerId: ${userGameStore.playerId}关于奖池的信息`,
      "rtpLevel:",
      JSON.stringify(rtpLevel),
      "betLevel:",
      JSON.stringify(betLevel),
    );

    if (!rtpLevel) {
      throw new Error("rtp level not found");
    }
    if (!betLevel) {
      throw new Error("bet level not found");
    }
    const operator = await userGameStore.getOperator();
    let gameID = 48;
    const currentLevelRtp = await GameMoneyPoolService.getPoolProfitRate({
      gameID,
      betLevel: betLevel.level,
      level: rtpLevel.rtpNo,
      operatorId: operator.id,
      maxRtp: new Decimal(rtpLevel.max),
    });

    console.log("当前奖池利润率:", currentLevelRtp, "用户RTP:", userRtp);

    const isNewer = await userGameStore.isNewer();
    const isTrail = await userGameStore.isTrail();
    console.log("isNewer:", isNewer, "isTrail:", isTrail);

    //预测的总RTP
    const predictedRtp = isTrail
      ? new Decimal(2)
      : new Decimal(rtpLevel?.max || 0)
          .add(currentLevelRtp)
          .minus(1)
          .add(rtpLevel.max || 0);

    console.log("预测的总RTP", predictedRtp, "当前运营商最大", rtpLevel.max);
    let maxMultiple = ((predictedRtp - 0.252017) / 0.0155) * 30;
    console.log("最大倍率a =" + maxMultiple.toString());
    if (isTrail) {
      return 3001;
    } else {
      return maxMultiple;
    }
  }
  public static async spendMoneyQueue(params: {
    userGameStore: UserGameStore;
    moneyPool: MoneyPoolMachine;
    currency: string;
    historyId: string;
    totalBet: number;
  }) {
    try {
      console.log("开始扣钱==========", JSON.stringify(params));
      const { userGameStore, moneyPool, currency, historyId } = params;
      // const { playerId } = userGameStore;
      // //  const totalBet = await userGameStore.getBetAmount();
      // const player = await userGameStore.getPlayer();
      await userGameStore.addTotalBet(params.totalBet);
      await GameMoneyPoolService.putMoney(moneyPool, new Decimal(params.totalBet));
    } catch (error: any) {
      console.log("cutMoney error", JSON.stringify(error.message));
      // await this.spendMoneyFail(params);
      // throw new HTTPException(500, {
      //   message: "bet fail, please try again later.",
      // });
    }
  }
  public static async spendMoneyFail(params: {
    userGameStore: UserGameStore;
    moneyPool: MoneyPoolMachine;
    currency: string;
    historyId: string;
  }) {
    const { userGameStore, moneyPool, historyId } = params;
    const totalBet = await userGameStore.getBetAmount();

    const sendStart = Date.now();
    //sqsClient.sendMessage(historyId, MESSAGEGROUP.HISTORY, ACTIONS.DELETEHISTORY);
    console.log(
      "spendMoneyFail删除历史记录",
      `用户:${userGameStore.playerId},删除历史记录耗时`,
      Date.now() - sendStart,
      "ms",
    );
    await GameMoneyPoolService.loseMoney(moneyPool, new Decimal(totalBet));
    await userGameStore.addTotalBet(-totalBet);
  }
  public static formatDecimal(decimal: number): number {
    // 检查输入是否为数字
    if (typeof decimal !== "number") {
      throw new Error("Input is not a number");
    }

    // 如果是整数或者小数部分不为 0，则保留小数
    if (Math.floor(decimal) !== decimal || decimal % 1 !== 0) {
      return decimal;
    }

    // 如果小数部分为 0，则不保留小数
    return Math.floor(decimal);
  }
  static async pushDetailByStatus(params: {
    historyId: string;
    gameID: number;
    detail: string;
    balanceAfterSpin: number;
    totalWin: Decimal;
    ge:string;
  }) {
    const { historyId, detail, balanceAfterSpin, totalWin ,ge} = params;

    sqsClient.sendMessage(
      JSON.stringify({
        historyId,
        detailRecord: detail,
        status: GameHistoryStatus.Success,
        balanceAfter: balanceAfterSpin,
        totalWin: totalWin,
        ge:ge
      }),
      MESSAGEGROUP.HISTORY,
      ACTIONS.PUSHDETAIL48,
    );
  }
  static async pushDetail48(historyId: bigint, detail: any, balanceAfter: number, totalWin: Decimal,ge:string) {
    const record = await GameHistoryService.getByHistoryId(historyId);
    if (!record) {
      console.log("更新游戏详情的时候,游戏记录没有找到, historyId:", historyId);
      throw new Error("Game history not found");
    }

    // if (!Array.isArray(detail)) {
    //   console.log("detail不是数组啊..........", JSON.stringify(detail));
    //   throw new Error("detail is not an array");
    // }
    //deep copy
    const originDetail = detail;

    const day = moment.utc(moment(record.createdAt).format("YYYY-MM-DDTHH:mm:ss")).format("YYYYMMDD");

    const tableName = await TableService.getGameHistoryTable(day);

    // if (Number.isNaN(Number(balanceAfter))) {
    //   console.log("balanceAfter is not a number", balanceAfter);
    //   throw new Error("balanceAfter is not a number");
    // }

    const profit = totalWin;
    console.log("profit==== " + profit + "balanceAfter" + balanceAfter);
    let status = GameHistoryStatus.Success;
    try {
      const updateStr = `UPDATE "public"."${tableName}" 
      SET detail= '${originDetail}'::jsonb, 
      status= CAST('${status.toString()}'::text AS "public"."GameHistoryStatus"), 
      ge='[${ge}]'::jsonb, 
      "updatedAt"= now(),
      profit='${profit}',
      "balanceAfter"='${new Decimal(balanceAfter || 0).toFixed(4)}',
      version= version + 1
      WHERE ("public"."${tableName}"."id" = '${record.id}' and version='${record.version}');`;
      console.log("aaaa+" + updateStr);
      const updateRlt = await PgClient.query(updateStr);
      console.log("更新游戏记录的结果====================", updateRlt.rowCount);
      if (updateRlt.rowCount === 0) {
        console.log("更新游戏记录失败, historyId:", updateStr);
        throw new Error("Update game history failed");
      }
    } catch (error) {
      // 处理异常
      console.error("Error updating game history:", error);
      console.log(
        `record11: ${JSON.stringify(detail, (key, value) => (typeof value === "bigint" ? value.toString() : value))}`,
      );

      // 返回适当的错误信息或执行其他操作
      throw error; // 抛出异常以便上层处理
    }

    //update wallet
    // if (status === GameHistoryStatus.Success) {
    //   //todo 这里有个currency的问题
    //   const wallet = await WalletService.getPlayerWallet(record.playerId);
    //   if (!wallet) {
    //     console.log("玩家钱包不存在, playerID:", record.playerId);
    //     throw new Error("Player wallet not found");
    //   }
    //   await WalletService.updateWalletStatics({
    //     totalPlay: recordBet,
    //     totalWin: totalWin,
    //     totalOut: totalWin,
    //     totalIn: recordBet,
    //     walletId: wallet.id,
    //   });
    // }

    return "success";
  }
}
