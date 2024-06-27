import { ConfigThreeColumnsCardWeight, GameHistory, MoneyPoolMachine } from "@prisma/client";
import { cloneDeep } from "lodash";
import { Decimal } from "@prisma/client/runtime/library";
import random from "random";
import { GameHistoryService, GamePlayerService, GameService, WalletService } from "services";
import { GameConfigService } from "services/GameConfigService";
import { GameMoneyPoolService } from "services/GameMoneyPoolService";
import { redisClient } from "utils/redisClient";

export enum FortuneElephantSpinSymbol {
  Wild = 0,
  Scatter = 1,
  Girl = 2,
  Lamp = 3,
  Flower = 4,
  GoldenSand = 5,
  ACard = 6,
  KCard = 7,
  QCard = 8,
  JCard = 9,
}

export const symbolCardWeight: Record<FortuneElephantSpinSymbol, number> = {
  [FortuneElephantSpinSymbol.Wild]: 1000,
  [FortuneElephantSpinSymbol.Scatter]: 1000,
  [FortuneElephantSpinSymbol.Girl]: 1000,
  [FortuneElephantSpinSymbol.Lamp]: 1000,
  [FortuneElephantSpinSymbol.Flower]: 1000,
  [FortuneElephantSpinSymbol.GoldenSand]: 1000,
  [FortuneElephantSpinSymbol.ACard]: 1000,
  [FortuneElephantSpinSymbol.KCard]: 1000,
  [FortuneElephantSpinSymbol.QCard]: 1000,
  [FortuneElephantSpinSymbol.JCard]: 1000,
};

export enum RandomSymbolType {
  All = "all",
  NoScatter = "noScatter",
  NoWild = "noWild",
}

export enum SpinType {
  FreeSpin = "freeSpin",
  NormalSpin = "normalSpin",
}

export const starCountRateMap: Record<string, number[]> = {
  "0": [0, 0, 0, 0, 0],
  "1": [0, 0, 0, 0, 0],
  "2": [0, 0, 30, 60, 150],
  "3": [0, 0, 20, 45, 90],
  "4": [0, 0, 15, 30, 60],
  "5": [0, 0, 10, 15, 45],
  "6": [0, 0, 8, 10, 30],
  "7": [0, 0, 8, 10, 30],
  "8": [0, 0, 5, 8, 15],
  "9": [0, 0, 5, 8, 15],
};

// 最大只能是20
export const freeSpinWildMagnificationLevel = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

export const scatterNumberAcquireFreeSpinNumber: Record<number, number> = {
  3: 12,
  4: 15,
  5: 20,
};

export interface OddsFactor {
  wayRate: number;
  starCountRate: number;
}

export interface FreeSpinRelatedData {
  remainningSpinTimes: number;
  totalSpinTimes: number;
  curGroupFreeSpinTotalAward: number;
  scatterNumber: number;
  wildFoundation: {
    totalWildCount: number;
    wildCount: number;
    wildMagnification: number;
    nextWildMagnification: number;
    wildAward: number;
  };
}

// old code
export interface FortuneElephantSpinParams {
  playerId: number;
  baseBet: number;
  baseRate: number;
  wayRate: number;
  currency: string;
  spinId: string;
}

export enum FortuneElephantSpecialStatus {
  NeverIN = "neverIn",
  Begin = "begin",
  Process = "process",
  End = "end",
}

export const FortuneElephantPossibleWinWays = [
  [1, 4, 7],
  [0, 3, 6],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const FortuneElephantCardIconMap: Map<number, number> = new Map([
  [2, 0],
  [3, 2],
  [4, 3],
  [5, 4],
  [6, 5],
  [7, 6],
  [8, 7],
  [1, -1],
]);

export class FortuneElephantService {
  private static getRandomSymbolByWeight(randomSymbolType: RandomSymbolType, spinType: SpinType = SpinType.NormalSpin) {
    const curSymbolCardWeight = cloneDeep(symbolCardWeight);
    if (randomSymbolType === RandomSymbolType.NoWild) {
      curSymbolCardWeight[FortuneElephantSpinSymbol.Wild] = 0;
    }
    if (spinType === SpinType.FreeSpin) {
      curSymbolCardWeight[FortuneElephantSpinSymbol.Scatter] = 0;
    }
    const totalWeight = Object.values(curSymbolCardWeight).reduce((acc, cur) => acc + cur);
    const randomNumber = random.int(totalWeight);
    let weight = 0;
    for (const symbol in curSymbolCardWeight) {
      weight += curSymbolCardWeight[symbol as unknown as FortuneElephantSpinSymbol];
      if (randomNumber <= weight) {
        return Number(symbol);
      }
    }
    return 9;
  }

  // 随机生成一列的数字
  private static getRandomSpinColumn(randomSymbolType: RandomSymbolType, spinType: SpinType = SpinType.NormalSpin) {
    let isNoMoreThanOneWild = true;
    let arr: number[] = [];
    let isLegal = isNoMoreThanOneWild && arr.length === 3;

    // 这里限定了一列只能出现一次“百搭”
    while (!isLegal) {
      arr = new Array(3).fill(0).map((item) => {
        return FortuneElephantService.getRandomSymbolByWeight(randomSymbolType, spinType);
      });
      if (arr.filter((item) => item === FortuneElephantSpinSymbol.Wild).length > 1) {
        isNoMoreThanOneWild = false;
      } else {
        isNoMoreThanOneWild = true;
      }
      isLegal = isNoMoreThanOneWild && arr.length === 3;
    }
    return arr;
  }

  public static getRandomSpinNumbers(spinType: SpinType = SpinType.NormalSpin) {
    const columnMap = [0, 1, 2, 3, 4];
    const generateSymbolArray = columnMap.map((item) => {
      if (item === 0 || item === 4) {
        return FortuneElephantService.getRandomSpinColumn(RandomSymbolType.NoWild, spinType);
      } else {
        return FortuneElephantService.getRandomSpinColumn(RandomSymbolType.All, spinType);
      }
    });

    // todos: test code
    // if (spinType === SpinType.NormalSpin) {
    //   return [5, 3, 2, 4, 1, 6, 4, 5, 2, 1, 1, 8, 9, 9, 3];
    // }
    //  else {
    //   return [5,5,2, 2,2,9, 2,0,0, 9,3,2, 9,8,8];
    // }
    return generateSymbolArray.flat();
  }

  // 15个数字转换成3行5列的二维矩阵
  public static convertTo2DArray(array: number[]): number[][] {
    if (array.length !== 15) {
      throw new Error("Input array must have a length of 15.");
    }

    const result: number[][] = [];
    for (let i = 0; i < 5; i++) {
      result.push(array.slice(i * 3, i * 3 + 3));
    }

    return result;
  }

  /**
   * @param matrix 二维数组，原数组：[8, 5, 5, 0, 8, 4, 9, 5, 0, 8, 2, 8, 8, 9, 2]，转换成[
   *  [ 8, 0, 9, 8, 8 ],
      [ 5, 8, 5, 2, 9 ],
      [ 5, 4, 0, 8, 2 ],
   * ]
   * @returns
   */
  public static recordNumbers(matrix: number[][]): Record<number, number[]> {
    const winningNumbers: Record<number, number[]> = {};
    const [first, second, third] = [matrix[0][0], matrix[0][1], matrix[0][2]]; // 这里对应@param matrix的例子，分别是8 5 5

    // 考虑第一列三个数字重复的情况
    if ((first === second && second === third) || first === second || second === third || first === third) {
      if (first === second && second === third) {
        winningNumbers[first] = [0, 1, 2];
      } else {
        if (first === second) {
          winningNumbers[first] = [0, 1];
          winningNumbers[third] = [2];
        }
        if (second === third) {
          winningNumbers[first] = [0];
          winningNumbers[second] = [1, 2];
        }
        if (first === third) {
          winningNumbers[first] = [0, 2];
          winningNumbers[second] = [1];
        }
      }
    } else {
      winningNumbers[first] = [0];
      winningNumbers[second] = [1];
      winningNumbers[third] = [2];
    }

    // rowFirst、rowSecond、rowThird是确保必须连续列出现某个数字（考虑了0的百搭）
    let rowFirst = 0;
    let rowSecond = 0;
    let rowThird = 0;
    for (let row = 1; row <= matrix[0].length + 1; row++) {
      if (winningNumbers[first] && row === rowFirst + 1) {
        for (let col = 0; col < 3; col++) {
          const rowColumn = matrix[row][col];
          if (rowColumn === first || rowColumn === 0) {
            winningNumbers[first].push(3 * row + col);
            rowFirst = row;
          }
        }
      }
      if (winningNumbers[second] && row === rowSecond + 1) {
        for (let col = 0; col < 3; col++) {
          const rowColumn = matrix[row][col];
          if (rowColumn == second || rowColumn === 0) {
            winningNumbers[second].push(3 * row + col);
            rowSecond = row;
          }
        }
      }
      if (winningNumbers[third] && row === rowThird + 1) {
        for (let col = 0; col < 3; col++) {
          const rowColumn = matrix[row][col];
          if (rowColumn === third || rowColumn === 0) {
            winningNumbers[third].push(3 * row + col);
            rowThird = row;
          }
        }
      }
    }

    // 去重
    winningNumbers[first] = [...new Set(winningNumbers[first])];
    winningNumbers[second] = [...new Set(winningNumbers[second])];
    winningNumbers[third] = [...new Set(winningNumbers[third])];
    return winningNumbers;
  }

  /**
   * 过滤掉不算中奖的情况，只算三列、四列、五列
   * @param origin 比如
   * {
      "5": [ 1, 2, 3, 7, 8 ],
      "8": [ 0, 3, 4, 8, 9, 11, 12 ],
    }
   * @returns
   */
  public static filterWinningNumbers(origin: Record<string, number[]>) {
    const newOrigin = cloneDeep(origin);
    return Object.keys(newOrigin).reduce((newOrigin, item) => {
      const originArray = newOrigin[item];

      // 因为只有3列以上才中奖，所以最后一个值的position必定大于等于6。如果小于6，说明没中奖
      if (originArray[originArray.length - 1] < 6) {
        delete newOrigin[item];
      }

      // 夺宝不记录到winningPosition里
      if (item === "1") {
        delete newOrigin[item];
      }
      return newOrigin;
    }, newOrigin);
  }

  /**
   * 计算每个数字对应的中奖路
   * @param winningNumbers {
      "5": [ 1, 2, 3, 7, 8 ],
      "8": [ 0, 3, 4, 8, 9, 11, 12 ],
    }
   * @returns {
      "5": 4,
      "8": 4,
    }
   */
  public static calcWinningMagnification(winningNumbers: Record<string, number[]>) {
    return Object.keys(winningNumbers).reduce((obj: Record<string, OddsFactor>, item) => {
      obj[item] = FortuneElephantService.calcOneNumberWinningMagnification(winningNumbers[item], item);
      return obj;
    }, {});
  }

  /**
   * 计算单个数组的中奖路
   * @param numbers [ 0, 3, 4, 8, 9, 11, 12 ]
   * @returns
   */
  public static calcOneNumberWinningMagnification(numbers: number[], iconNumber: string): OddsFactor {
    const fiveLineWays: number[][] = [];
    let index = 0;
    let tempArr = [];
    for (let i = 0; i < numbers.length; i++) {
      const item = numbers[i];
      if (item >= (index + 2) * 3) {
        console.error(`\nWrong winning numbers!!!, numbers: ${numbers}\n`);
        throw new Error(`Wrong winning numbers, numbers: ${numbers}`);
      }
      if (item >= (index + 1) * 3) {
        index += 1;
        fiveLineWays.push(tempArr);
        tempArr = [];
      }
      tempArr.push(item);
    }
    fiveLineWays.push(tempArr);

    // fiveLineWays的示例：fiveLineWays === [[ 0 ], [ 3, 4 ], [ 8 ], [ 9, 11 ], [ 12 ]]
    // wayRate的示例：wayRate === 1 x 2 x 1 x 2 x 1 === 4
    const wayRate = fiveLineWays.reduce((multiply, item) => {
      if (item.length !== 0) {
        multiply *= item.length;
      }
      return multiply;
    }, 1);
    const starCountRate = starCountRateMap[iconNumber][fiveLineWays.length - 1];
    return { wayRate, starCountRate };
  }

  private static getCurAndNextWildMagnification(totalWildCount: number) {
    let magnificationLevel = new Decimal(Math.floor(totalWildCount / 3));
    if (magnificationLevel.gt(20)) {
      magnificationLevel = new Decimal(20);
    }
    const cur = freeSpinWildMagnificationLevel[magnificationLevel.toNumber()];
    const next = freeSpinWildMagnificationLevel[magnificationLevel.add(1).toNumber()];

    // 如果next是undefined（超出上界），那么next的值等于cur
    return { cur, next: next ? next : cur };
  }

  private static async initElephantFreeSpin(
    playerId: number,
    totalFreeMode: number,
    // totalBet: number,
    moneyPool: MoneyPoolMachine,
  ) {
    // let specialResult = await GameConfigService.getRandomSpecialPrize(42);
    // await redisClient.set(`fortuneElephant:freeModeCount:${playerId}`, 0);
    // await redisClient.set(`fortuneElephant:freeModeTotal:${playerId}`, totalFreeMode); // 总的免费旋转次数
    // let count = specialResult?.count || 1;
    // let initCount = count;
    // let payRate = specialResult?.payRate.toNumber() || 3;
    // let rounds = (specialResult?.rounds || []) as any[];
    // let predictedWin = new Decimal(payRate).mul(totalBet);
    // let tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHigh(
    //   moneyPool.id,
    //   predictedWin
    // );
    // rounds = Array.isArray(rounds)
    //   ? rounds.filter((round: any) => round.cards.length === 9)
    //   : [];
    // let firstRound: any = rounds[0];
    // let freeModeIcon = firstRound.cardPointed;
    // while (rounds.length < 1 || tooHigh || !freeModeIcon) {
    //   specialResult = await GameConfigService.getRandomSpecialPrize(42, count);
    //   count = specialResult?.count || 1;
    //   payRate = specialResult?.payRate.toNumber() || 3;
    //   rounds = (specialResult?.rounds || []) as any[];
    //   rounds = Array.isArray(rounds)
    //     ? rounds.filter((round: any) => round.cards.length === 9)
    //     : [];
    //   if (rounds.length < 1) {
    //     count = initCount;
    //   }
    //   predictedWin = new Decimal(totalBet).mul(payRate);
    //   tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHigh(
    //     moneyPool.id,
    //     predictedWin
    //   );
    //   firstRound = rounds[0];
    //   freeModeIcon = firstRound.cardPointed;
    //   if (!freeModeIcon) {
    //     count = 0;
    //   }
    // }
    // if (!Array.isArray(rounds)) {
    //   throw new Error("rounds is not array");
    // }
    // await redisClient.del(`fortuneElephant:freeMode-list:${playerId}`);
    // for (let index = 0; index < rounds.length; index++) {
    //   const round: any = rounds[index];
    //   const cardNumbers = round.cards;
    //   const cards = [];
    //   for (let i = 0; i < cardNumbers.length; i++) {
    //     const cardN = cardNumbers[i];
    //     const card = await GameConfigService.getThreeColumnsCardWeightByCardID(
    //       42,
    //       cardN
    //     );
    //     cards.push(card);
    //   }
    //   const winIndexes = this.getWinWays(cards);
    //   if (winIndexes.length === 0) {
    //     continue;
    //   }
    //   if (round?.payRate === null || round?.payRate === undefined) {
    //     break;
    //   }
    //   await redisClient.rPush(
    //     `fortuneElephant:freeMode-list:${playerId}`,
    //     JSON.stringify(round)
    //   );
    // }
    // console.log("fortuneElephant:freeModeIcon========", freeModeIcon);
    // await redisClient.set(
    //   `fortuneElephant:freeModeIcon:${playerId}`,
    //   freeModeIcon
    // );
  }

  public static async normalAndFreeSpin(
    params: FortuneElephantSpinParams,
    moneyPool: MoneyPoolMachine,
    spinType: SpinType = SpinType.NormalSpin,
  ) {
    const { playerId, baseBet, baseRate, wayRate, currency, spinId } = params;
    console.log("enter_normalAndFreeSpin", spinType, baseBet, baseRate, wayRate); // todos

    if (spinType === SpinType.NormalSpin) {
    } else if (spinType === SpinType.FreeSpin) {
      // todos
      await redisClient.incr(`fortuneElephant:freeModeCount:${playerId}`);
    }
    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0;
    let balanceAfterSpin = balanceBeforeSpin;
    let balanceAfterWin = balanceAfterSpin;
    const walletRecord = await WalletService.gameBet({
      playerId,
      currency,
      amount: new Decimal(baseBet * baseRate * wayRate),
      detail: {
        historyId: spinId,
      },
    });
    balanceAfterSpin = walletRecord.balanceAfter;
    balanceBeforeSpin = walletRecord.balanceBefore;
    balanceAfterWin = walletRecord.balanceAfter;

    const totalBet = new Decimal(baseBet).mul(baseRate).mul(wayRate);
    console.log("enter_normalAndFreeSpin_totalBet", totalBet); // todos
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    let record = await GameHistoryService.create({
      currency,
      totalBet: totalBet.toNumber(),
      operator: {
        connect: {
          id: player.operatorId,
        },
      },
      ge: [1, 11],
      game: {
        connect: {
          gameID: 42,
        },
      },
      player: {
        connect: {
          id: playerId,
        },
      },
      profit: new Decimal(0).sub(totalBet).toNumber(),
      moneyPoolId: moneyPool.id,
      moneyPool: {
        rtp: moneyPool.currentRTP,
        totalIn: moneyPool.totalIn,
        totalOut: moneyPool.totalOut,
      },
    });

    // todos remove unused code
    // const cards = await GameService.getRandom9Cards(42);

    // const winIndexes = this.getWinWays(cards);
    // const icons = await this.turnCardToIcon(cards);
    // const winPositions = this.getWinPosition(winIndexes);
    // const iconRate = await this.getIconRate(cards, winIndexes);

    // const positionAmount = this.getPositionAmount({
    //   cards,
    //   winIndexes,
    //   baseBet,
    //   baseRate
    // });

    // 获取随机的icons
    const icons: number[] = FortuneElephantService.getRandomSpinNumbers(spinType);

    // 计算winPositions
    const icons2DArray: number[][] = FortuneElephantService.convertTo2DArray(icons);
    const sameNumbersObject = FortuneElephantService.recordNumbers(icons2DArray);
    const winPositions: Record<string, number[]> = FortuneElephantService.filterWinningNumbers(sameNumbersObject);

    // 计算每个icon的赔率
    const winPositionsPayRateObject = FortuneElephantService.calcWinningMagnification(winPositions);
    const positionAmount: Record<string, number> = Object.keys(winPositionsPayRateObject).reduce(
      (obj: Record<string, number>, item: string) => {
        obj[item] = new Decimal(winPositionsPayRateObject[item].wayRate)
          .mul(winPositionsPayRateObject[item].starCountRate)
          .mul(baseBet)
          .mul(baseRate)
          .toNumber();
        return obj;
      },
      {},
    );
    const symbolWayRate: Record<string, number> = Object.keys(winPositionsPayRateObject).reduce(
      (obj: Record<string, number>, item) => {
        obj[item] = winPositionsPayRateObject[item].wayRate;
        return obj;
      },
      {},
    );

    console.log(
      "icons、symbolWayRate、winPositionsPayRateObject、positionAmount",
      icons,
      symbolWayRate,
      winPositionsPayRateObject,
      positionAmount,
    );

    // 计算每个icon出现的次数
    const iconRate = Object.keys(winPositions).reduce((obj: Record<string, number>, item) => {
      obj[item] = winPositions[item].length;
      return obj;
    }, {});
    // “夺宝”的数量
    const scatterNumber = icons.filter((item) => item == 1).length;
    // wild的数量
    const wildNumber = icons.filter((item) => item == 0).length;
    console.log("enter_scatterNumber-1", scatterNumber); // todos

    // 获得3个以上的夺宝，设定下一次的旋转状态为Begin
    if (scatterNumber >= 3) {
      await redisClient.set(`fortuneElephant:freeMode:${playerId}`, FortuneElephantSpecialStatus.Begin);
      let freeSpinTotal = 0;
      if (scatterNumber > 5) {
        // todos 如果超过5个“夺宝”，按理不可能
        freeSpinTotal = scatterNumberAcquireFreeSpinNumber[5];
      } else {
        freeSpinTotal = scatterNumberAcquireFreeSpinNumber[scatterNumber];
      }
      await redisClient.set(`fortuneElephant:freeModeCount:${playerId}`, freeSpinTotal);
      await redisClient.set(`fortuneElephant:freeModeCount:${playerId}`, 0);
      await redisClient.set(`fortuneElephant:freeModeTotal:${playerId}`, freeSpinTotal); // 总的免费旋转次数
    }

    // 只要本次是免费旋转，那么就要累计wild的数量
    let totalWildCount = new Decimal(0);
    if (spinType === SpinType.FreeSpin) {
      totalWildCount = new Decimal((await redisClient.get(`fortuneElephant:freeModeWildCount:${playerId}`)) || 0);
      totalWildCount = totalWildCount.add(Number(wildNumber) || 0);
      await redisClient.set(`fortuneElephant:freeModeWildCount:${playerId}`, totalWildCount.toNumber());
    }

    // positionAmountWin:本次旋转得到总奖励
    let positionAmountWin: Decimal = Object.values(positionAmount).reduce(
      (prev, curr) => prev.add(curr),
      new Decimal(0),
    );
    if (positionAmountWin.gt(0)) {
      record = await GameHistoryService.updateProfit(
        {
          ...record,
          ge: scatterNumber >= 3 ? [2, 11] : [1, 11],
        },
        positionAmountWin.sub(totalBet),
      );
      const walletRecord = await WalletService.gameWin({
        playerId,
        currency,
        amount: positionAmountWin.toNumber(),
        detail: {
          historyId: record.id,
        },
      });
      balanceAfterWin = walletRecord.balanceAfter;
    }

    // 连续赢的逻辑
    let currentWinCount;
    if (positionAmountWin.gt(0)) {
      currentWinCount = Number((await redisClient.get(`fortuneElephant:currentWinCount:${playerId}`)) || 0);
      currentWinCount += 1;
      await redisClient.set(`fortuneElephant:currentWinCount:${playerId}`, currentWinCount);
    } else {
      await redisClient.set(`fortuneElephant:currentWinCount:${playerId}`, 0);
    }

    //all cards are the same
    if (Object.values(positionAmount).length === FortuneElephantPossibleWinWays.length) {
      positionAmountWin = positionAmountWin.mul(10);
    }

    let curSpinAward = positionAmountWin;
    // 处理免费旋转的数据
    let freeSpinRelatedData = null;
    let wildMagnification = 1;
    if (spinType === SpinType.FreeSpin || scatterNumber >= 3) {
      // todos
      const freeModeCount = new Decimal((await redisClient.get(`fortuneElephant:freeModeCount:${playerId}`)) || 0);
      const totalSpinTimes = new Decimal((await redisClient.get(`fortuneElephant:freeModeTotal:${playerId}`)) || 0);
      const remainningSpinTimes = totalSpinTimes.sub(freeModeCount);

      wildMagnification = FortuneElephantService.getCurAndNextWildMagnification(totalWildCount.toNumber()).cur;
      const nextWildMagnification = FortuneElephantService.getCurAndNextWildMagnification(
        totalWildCount.toNumber(),
      ).next;

      let curGroupFreeSpinTotalAward = new Decimal(
        (await redisClient.get(`fortuneElephant:freeModeCurGroupFreeSpinTotalAward:${playerId}`)) || 0,
      );
      curSpinAward = positionAmountWin.mul(wildMagnification || 1);
      curGroupFreeSpinTotalAward = curGroupFreeSpinTotalAward.add(curSpinAward);
      await redisClient.set(
        `fortuneElephant:freeModeCurGroupFreeSpinTotalAward:${playerId}`,
        curGroupFreeSpinTotalAward.toNumber(),
      );

      console.log(
        "freeSpin:curGroupFreeSpinTotalAward、curSpinAward、wildMagnification、nextWildMagnification",
        curGroupFreeSpinTotalAward,
        curSpinAward,
        wildMagnification,
        nextWildMagnification,
      );

      freeSpinRelatedData = {
        remainningSpinTimes: remainningSpinTimes.toNumber(),
        totalSpinTimes: Number(totalSpinTimes),
        curGroupFreeSpinTotalAward: curGroupFreeSpinTotalAward.toNumber(),
        scatterNumber,
        wildFoundation: {
          totalWildCount: totalWildCount.toNumber(),
          wildCount: wildNumber,
          wildMagnification,
          nextWildMagnification,
          wildAward: curSpinAward.sub(positionAmountWin).toNumber(),
        },
      };

      // 重置freeSpin的redis数据
      if (remainningSpinTimes.eq(0)) {
        await redisClient.set(`fortuneElephant:freeMode:${playerId}`, FortuneElephantSpecialStatus.End);
        await redisClient.set(`fortuneElephant:freeModeWildCount:${playerId}`, 0);
        await redisClient.set(`fortuneElephant:freeModeCurGroupFreeSpinTotalAward:${playerId}`, 0);
      }
    }

    const hashStr = await this.getHashStr(
      icons,
      winPositions,
      spinType === SpinType.FreeSpin ? 0 : totalBet.toNumber(),
      positionAmountWin.toNumber(),
      playerId,
      wildMagnification,
    );

    return {
      totalBet,
      totalWin: curSpinAward,
      currentWinCount,
      positionAmountWin,
      winPositions,
      positionAmount,
      symbolWayRate,
      balanceAfterSpin: Number(balanceAfterSpin),
      balanceBeforeSpin: Number(balanceBeforeSpin),
      balanceAfterWin: Number(balanceAfterWin),
      hashStr,
      icons,
      iconRate,
      freeSpinRelatedData,
      record,
    };
  }

  public static async normalElephantSpin(params: FortuneElephantSpinParams, moneyPool: MoneyPoolMachine) {
    return await FortuneElephantService.normalAndFreeSpin(params, moneyPool, SpinType.NormalSpin);
  }

  public static async freeElephantSpin(params: FortuneElephantSpinParams, moneyPool: MoneyPoolMachine) {
    return await FortuneElephantService.normalAndFreeSpin(params, moneyPool, SpinType.FreeSpin);
  }

  // old code
  public static async noPrizeSpin(params: FortuneElephantSpinParams, moneyPool: MoneyPoolMachine, toRecord = true) {
    const { playerId, baseBet, baseRate, wayRate, currency } = params;
    const totalBet = baseBet * baseRate * wayRate;
    // 缺少gameID 为 42的ConfigNoPrize配置，需要从fortuneElephantConfig.xlsx读取
    const config = await GameConfigService.getRandomNoPrize(42);
    const cards = config.cards as number[];

    // const icons = cards.map((card) => FortuneElephantCardIconMap.get(card));
    const icons = [7, 1, 8, 4, 4, 4, 6, 7, 7, 0, 7, 9, 7, 7, 7];
    const winIndexes: number[] = [];
    const winPositions = this.getWinPosition(winIndexes);
    const hashr = await this.getHashStr(icons as number[], winPositions, totalBet, 0, playerId);

    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    const balanceBeforeSpin = new Decimal(wallet?.balance || 0);
    const balanceAfterSpin = balanceBeforeSpin.sub(totalBet);
    const balanceAfterWin = balanceAfterSpin;
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    const record = toRecord
      ? await GameHistoryService.create({
          currency,
          totalBet,
          operator: {
            connect: {
              id: player.operatorId,
            },
          },
          ge: [1, 11],
          game: {
            connect: {
              gameID: 42,
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
            totalOut: moneyPool.totalOut,
            totalIn: moneyPool.totalIn,
          },
        })
      : null;
    return {
      winIndexes: [],
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(0),
      record,
      winPositions: {},
      positionAmount: {},
      symbolWayRate: {},
      hashStr: hashr,
      icons: icons as number[],
      balanceBeforeSpin,
      balanceAfterSpin,
      balanceAfterWin,
      iconRate: null,
    };
  }

  private static async normalSpin(params: FortuneElephantSpinParams, moneyPool: MoneyPoolMachine) {
    let time = Date.now();
    const { playerId, baseBet, baseRate, wayRate, currency, spinId } = params;
    await redisClient.set(`fortuneElephant:freeMode:${playerId}`, FortuneElephantSpecialStatus.NeverIN);
    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0;
    let balanceAfterSpin = balanceBeforeSpin;
    let balanceAfterWin = balanceAfterSpin;
    const walletRecord = await WalletService.gameBet({
      playerId,
      currency,
      amount: new Decimal(baseBet * baseRate * wayRate),
      detail: {
        historyId: spinId,
      },
    });
    balanceAfterSpin = walletRecord.balanceAfter;
    balanceBeforeSpin = walletRecord.balanceBefore;
    balanceAfterWin = walletRecord.balanceAfter;

    const totalBet = baseBet * baseRate * wayRate;
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    let record = await GameHistoryService.create({
      currency,
      totalBet,
      operator: {
        connect: {
          id: player.operatorId,
        },
      },
      ge: [1, 11],
      game: {
        connect: {
          gameID: 42,
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
    const cards = await GameService.getRandom9Cards(42);

    const winIndexes = this.getWinWays(cards);
    const icons = await this.turnCardToIcon(cards);
    const winPositions = this.getWinPosition(winIndexes);
    const iconRate = await this.getIconRate(cards, winIndexes);

    const positionAmount = this.getPositionAmount({
      cards,
      winIndexes,
      baseBet,
      baseRate,
    });
    let totalWin = Object.values(positionAmount).reduce((prev, curr) => prev + curr, 0);
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

    //all cards are the same
    if (Object.values(positionAmount).length === FortuneElephantPossibleWinWays.length) {
      totalWin = totalWin * 10;
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
      winPositions[str] = FortuneElephantPossibleWinWays[index];
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
      const line = FortuneElephantPossibleWinWays[index];
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

  private static getWinWays(cards: ConfigThreeColumnsCardWeight[]) {
    const winIndexes = [];

    for (let index = 0; index < FortuneElephantPossibleWinWays.length; index++) {
      const line = FortuneElephantPossibleWinWays[index];
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
    let icons = cards.map((card) => FortuneElephantCardIconMap.get(card.cardID));
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
    freeSpinWildMagnification: number = 1,
  ) {
    const freeModeBetAmount = await redisClient.get(`fortuneElephant:freeModeCount:${playerId}`);
    // icons: [7, 1, 8, 4, 4, 4, 6, 7, 7, 0, 7, 9, 7, 7, 7];
    //"0:7;4;6;0;7#1;4;7;7;7#8;4;7;9;7#MV#18.0#MT#1#MG#0#"
    let hashStr = `${freeModeBetAmount || 0}:${icons[0]};${icons[3]};${icons[6]};${icons[9]};${icons[12]}#${icons[1]};${icons[4]};${icons[7]};${icons[10]};${icons[13]}#${icons[2]};${icons[5]};${icons[8]};${icons[11]};${icons[14]}`;
    let winWayStr = "";
    const MV = totalBet === 0 ? 0 : totalBet.toFixed(1);
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
        winWayStr += `#R#${icon}#${posStr}#MV#${MV}#MT#${freeSpinWildMagnification}`;
      }
    }

    if (!winWayStr) {
      winWayStr = `#MV#${MV}#MT#${freeSpinWildMagnification}`;
    }

    const MG = new Decimal(winAmount).mul(freeSpinWildMagnification).toNumber();
    const betInfoStr = `#MG#${MG}#`;
    hashStr = `${hashStr}${winWayStr}${betInfoStr}`;
    return hashStr;
  }

  static async getIconRate(cards: ConfigThreeColumnsCardWeight[], winIndexes: number[]) {
    const iconRate: any = {};
    for (let index = 0; index < winIndexes.length; index++) {
      const winIndex = winIndexes[index];
      const line = FortuneElephantPossibleWinWays[winIndex];
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

  private static async initSpecialSpin(playerId: number, totalBet: number, moneyPool: MoneyPoolMachine) {
    let specialResult = await GameConfigService.getRandomSpecialPrize(42);
    await redisClient.set(`fortuneMouse:freeModeCount:${playerId}`, 0);
    let count = specialResult?.count || 1;
    let initCount = count;
    let payRate = specialResult?.payRate.toNumber() || 3;
    let rounds = (specialResult?.rounds || []) as any[];
    let predictedWin = new Decimal(payRate).mul(totalBet);
    let tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHigh(moneyPool, predictedWin);
    rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 9) : [];

    let firstRound: any = rounds[0];
    let freeModeIcon = firstRound.cardPointed;

    while (rounds.length < 1 || tooHigh || !freeModeIcon) {
      specialResult = await GameConfigService.getRandomSpecialPrize(42, count);
      count = specialResult?.count || 1;
      payRate = specialResult?.payRate.toNumber() || 3;
      rounds = (specialResult?.rounds || []) as any[];
      rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 9) : [];
      if (rounds.length < 1) {
        count = initCount;
      }
      predictedWin = new Decimal(totalBet).mul(payRate);
      tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHigh(moneyPool, predictedWin);
      firstRound = rounds[0];
      freeModeIcon = firstRound.cardPointed;
      if (!freeModeIcon) {
        count = 0;
      }
    }
    if (!Array.isArray(rounds)) {
      throw new Error("rounds is not array");
    }
    await redisClient.del(`fortuneElephant:freeMode-list:${playerId}`);
    for (let index = 0; index < rounds.length; index++) {
      const round: any = rounds[index];
      const cardNumbers = round.cards;
      const cards = [];
      for (let i = 0; i < cardNumbers.length; i++) {
        const cardN = cardNumbers[i];
        const card = await GameConfigService.getThreeColumnsCardWeightByCardID(42, cardN);
        cards.push(card);
      }
      const winIndexes = this.getWinWays(cards);
      if (winIndexes.length === 0) {
        continue;
      }
      if (round?.payRate === null || round?.payRate === undefined) {
        break;
      }
      await redisClient.rPush(`fortuneElephant:freeMode-list:${playerId}`, JSON.stringify(round));
    }

    console.log("fortuneElephant:freeModeIcon========", freeModeIcon);

    await redisClient.set(`fortuneElephant:freeModeIcon:${playerId}`, freeModeIcon);
  }

  private static async specialSpin(params: FortuneElephantSpinParams, moneyPool: MoneyPoolMachine): Promise<any> {
    const { playerId, baseBet, baseRate, wayRate, spinId, currency } = params;
    const totalBet = baseBet * baseRate * wayRate;

    const specialStatus = await redisClient.get(`fortuneElephant:freeMode:${playerId}`);

    if (specialStatus === FortuneElephantSpecialStatus.Begin) {
      await this.initSpecialSpin(playerId, totalBet, moneyPool);
    } else {
      await redisClient.incr(`fortuneElephant:freeModeCount:${playerId}`);
    }
    const roundStr = await redisClient.lPop(`fortuneElephant:freeMode-list:${playerId}`);
    const round = JSON.parse(roundStr || "{}");

    const listLength = await redisClient.lLen(`fortuneElephant:freeMode-list:${playerId}`);
    let cashOut = false;
    if (+listLength === 0) {
      await redisClient.set(`fortuneElephant:freeMode:${playerId}`, FortuneElephantSpecialStatus.End);
      cashOut = true;
    }
    const cards = [];
    for (let index = 0; index < round?.cards?.length; index++) {
      const cardID = round.cards[index];
      const card = await GameConfigService.getThreeColumnsCardWeightByCardID(42, cardID);
      cards.push(card);
    }

    const winIndexes = this.getWinWays(cards);
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
    if (winIndexes.length === FortuneElephantPossibleWinWays.length) {
      totalWin = totalWin * 10;
    }

    const hashStr = await this.getHashStr(icons, winPositions, totalBet, cashOut ? totalWin : 0, playerId);
    const historyId = await redisClient.get(`fortuneElephant:freeMode-historyId:${playerId}`);
    let record = historyId ? await GameHistoryService.getByHistoryId(BigInt(historyId)) : null;
    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0;
    let balanceAfterSpin = balanceBeforeSpin;
    let balanceAfterWin = balanceAfterSpin;
    if (specialStatus === FortuneElephantSpecialStatus.Begin) {
      const player = await GamePlayerService.getGamePlayerById(playerId);
      if (!player) {
        throw new Error("player is not found");
      }
      record = await GameHistoryService.create({
        currency,
        totalBet,
        operator: {
          connect: {
            id: player.operatorId,
          },
        },
        game: {
          connect: {
            gameID: 42,
          },
        },
        ge: [1, 4, 11],
        player: {
          connect: {
            id: playerId,
          },
        },
        profit: cashOut ? totalWin - totalBet : -totalBet,
      });
      await redisClient.set(`fortuneElephant:freeMode-historyId:${playerId}`, record.historyId.toString());

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
      await redisClient.set(`fortuneElephant:freeMode:${playerId}`, FortuneElephantSpecialStatus.NeverIN);
      const player = await GamePlayerService.getGamePlayerById(playerId);
      if (!player) {
        throw new Error("player is not found");
      }
      record = await GameHistoryService.create({
        currency,
        totalBet,
        operator: {
          connect: {
            id: player.operatorId,
          },
        },
        ge: [1, 4, 11],
        game: {
          connect: {
            gameID: 42,
          },
        },
        player: {
          connect: {
            id: playerId,
          },
        },
        profit: cashOut ? new Decimal(totalWin).minus(totalBet) : -totalBet,
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
      await GameMoneyPoolService.putWinToMoneyPool(moneyPool.id, new Decimal(totalWin));
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

  public static async spin(params: FortuneElephantSpinParams): Promise<{
    totalWin: Decimal;
    totalBet: Decimal;
    positionAmountWin: Decimal;
    currentWinCount: number;
    winPositions: any;
    iconRate: any;
    positionAmount: any;
    symbolWayRate: Record<string, number>;
    hashStr: string;
    icons: number[];
    record: GameHistory | null;
    specialStatus: FortuneElephantSpecialStatus;
    balanceBeforeSpin: Decimal;
    balanceAfterSpin: Decimal;
    balanceAfterWin: Decimal;
    freeSpinRelatedData: FreeSpinRelatedData | null;
  }> {
    let timeUse = Date.now();

    const { playerId, baseBet, baseRate, wayRate } = params;
    const totalBet = baseBet * baseRate * wayRate;

    const specialStatus = await redisClient.get(`fortuneElephant:freeMode:${playerId}`);

    let [type, moneyPool] = await GameService.checkSpinNormalOrSpecial(playerId, 42);
    // 如果此次spin中奖会导致rtp超过设置的max rtp
    // 1. 执行无中奖spin
    // 2. 当前投注加入奖池
    if (await GameMoneyPoolService.ifMoneyPoolTooHigh(moneyPool, new Decimal(1))) {
      moneyPool = await GameMoneyPoolService.putBetToMoneyPool(moneyPool.id, new Decimal(totalBet));
      const noPrizeResult = await this.noPrizeSpin(params, moneyPool);
      return {
        ...noPrizeResult,
        record: noPrizeResult.record,
        freeSpinRelatedData: null, // todos
        specialStatus: specialStatus as FortuneElephantSpecialStatus,
      };
    }

    if (specialStatus === FortuneElephantSpecialStatus.Begin) {
      await redisClient.set(`fortuneElephant:freeMode:${playerId}`, FortuneElephantSpecialStatus.Process);
    }
    if (specialStatus === FortuneElephantSpecialStatus.End) {
      await redisClient.set(`fortuneElephant:freeMode:${playerId}`, FortuneElephantSpecialStatus.NeverIN);
    }
    if (
      !specialStatus ||
      specialStatus === FortuneElephantSpecialStatus.NeverIN ||
      specialStatus === FortuneElephantSpecialStatus.End
    ) {
      moneyPool = await GameMoneyPoolService.putBetToMoneyPool(moneyPool.id, new Decimal(totalBet));
      // if (random.int(100) < 50) {
      await redisClient.set(`fortuneElephant:freeMode:${playerId}`, FortuneElephantSpecialStatus.NeverIN);
      const normalResult = await this.normalElephantSpin(params, moneyPool);
      const { totalWin } = normalResult;
      // const { totalWin, _ } = normalResult;

      //判断当前水位是否超过了最大水位
      if (await GameMoneyPoolService.ifMoneyPoolTooHigh(moneyPool, totalWin)) {
        const noPrizeResult = await this.noPrizeSpin(params, moneyPool, true);
        await GameHistoryService.deleteById(noPrizeResult.record?.id as number);
        return {
          ...noPrizeResult,
          record: noPrizeResult.record,
          freeSpinRelatedData: null, // todos
          specialStatus: specialStatus as FortuneElephantSpecialStatus,
        };
      }
      if (totalWin.gt(0)) {
        await GameMoneyPoolService.putWinToMoneyPool(moneyPool.id, new Decimal(totalWin));
      }
      return {
        ...normalResult,
        specialStatus: specialStatus as FortuneElephantSpecialStatus,
      };
    } else {
      const specialResult = await this.freeElephantSpin(params, moneyPool);

      return {
        ...specialResult,
        specialStatus: specialStatus as FortuneElephantSpecialStatus,
      };
    }
  }

  public static async parseModeResultByFortuneElephantSpecialStatus(
    freeModeStatus: FortuneElephantSpecialStatus,
    data: {
      totalWin: number;
      totalBet: number;
      freeModeIcon: number | null;
      positionAmountWin: number;
      currentWinCount: number;
      gwt: number;
      freeModeCount: number;
      winPositions: any;
      iconRate: any;
      symbolWayRate: Record<string, number>;
      positionAmount: any;
      hashStr: string;
      lastSpinId: string;
      spinId: string;
      icons: number[];
      baseBetRate: number;
      baseBet: number;
      freeSpinRelatedData: FreeSpinRelatedData | null;
    },
  ) {
    let {
      totalWin,
      totalBet,
      positionAmountWin,
      currentWinCount,
      freeModeIcon,
      gwt,
      icons,
      winPositions,
      iconRate,
      positionAmount,
      symbolWayRate,
      freeModeCount,
      hashStr,
      lastSpinId,
      spinId,
      baseBetRate,
      baseBet,
      freeSpinRelatedData,
    } = data;
    // todos remove
    // let totalBet = baseBet * baseBetRate * 5;
    // totalBet = +totalBet.toFixed(2);
    totalWin = +totalWin.toFixed(2);

    const profit = +(totalWin - totalBet).toFixed(2);
    const wp = !winPositions || Object.values(winPositions).length === 0 ? null : winPositions;
    const rwsp = !iconRate || Object.values(iconRate).length === 0 ? null : iconRate;
    const snww = !symbolWayRate || Object.values(symbolWayRate).length === 0 ? null : symbolWayRate;
    const lw = !positionAmount || Object.values(positionAmount).length === 0 ? null : positionAmount;
    const ist = random.int(100) < 5;

    const commonReturnValue = {
      aw: freeSpinRelatedData?.curGroupFreeSpinTotalAward || totalWin,
      ctw: totalWin, // totalWin是curSpinAward
      cwc: currentWinCount, // 连续赢的次数
      tw: totalWin,
      ltw: positionAmountWin,
      cs: baseBet,
      ml: baseBetRate,
      rl: icons,
      orl: icons,
      rwsp,
      snww,
      hashr: hashStr,
      psid: lastSpinId,
      sid: spinId,
      sc: freeSpinRelatedData?.scatterNumber || 0,
      np: profit,
      fb: null, // what is it?
      gwt, // what is it?
      wp,
      tb: totalBet,
      tbb: totalBet,
      lw,
      fs: {
        s: freeSpinRelatedData?.remainningSpinTimes,
        ts: freeSpinRelatedData?.totalSpinTimes,
        aw: freeSpinRelatedData?.curGroupFreeSpinTotalAward,
        wf: {
          twc: freeSpinRelatedData?.wildFoundation?.totalWildCount,
          wc: freeSpinRelatedData?.wildFoundation?.wildCount,
          wm: freeSpinRelatedData?.wildFoundation?.wildMagnification,
          nwm: freeSpinRelatedData?.wildFoundation?.nextWildMagnification,
          wa: freeSpinRelatedData?.wildFoundation?.wildAward,
        },
      },
    };

    console.log("freeSpinRelatedData", freeSpinRelatedData); // todos
    switch (freeModeStatus) {
      case FortuneElephantSpecialStatus.NeverIN:
        return {
          ...commonReturnValue,
          st: 1,
          nst: 1,
          fstc: null,
          fs: null, // over write
          ge: [1, 11],
        };
      case FortuneElephantSpecialStatus.Begin:
        return {
          ...commonReturnValue,
          st: 1,
          nst: 2,
          fstc: null,
          ge: [2, 11],
        };
      case FortuneElephantSpecialStatus.Process:
        return {
          ...commonReturnValue,
          st: 2,
          nst: 2,
          fstc: {
            2: freeModeCount,
          },
          np: positionAmountWin, // over write
          tb: 0, // over write
          ge: [2, 11],
        };
      case FortuneElephantSpecialStatus.End:
        return {
          ...commonReturnValue,
          st: 2,
          nst: 1,
          fstc: {
            2: freeModeCount,
          },
          pcwc: 1,
          tb: 0, // over write
          ge: [1, 11],
        };
    }
  }
}
