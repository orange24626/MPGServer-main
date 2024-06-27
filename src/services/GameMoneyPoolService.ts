import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { RtpLevels, selectBetLevelPoolByGameID } from "gameConfigs";
import { MoneyPoolMachine } from "models/types";
import { parseQuery, prismaClient, redisClient } from "utils";

let allLevels: any[] = [];

const PUBLIC_UNKNOWN_OPERATOR_ID = "PUBLIC_UNKNOWN_OPERATOR_ID";

export class GameMoneyPoolService {
  static async deleteBetPool(id: string) {
    console.log("GameMoneyPoolService=deleteBetPool=id:", id);
    const oneLevel = allLevels.find((item) => item.id === id);
    if (!oneLevel) {
      return;
    }
    const operatorKey = oneLevel.operatorId
      ? `{moneyPool}:operatorId:${oneLevel.operatorId}`
      : PUBLIC_UNKNOWN_OPERATOR_ID;
    const totalInKey = `{moneyPool}:game:${oneLevel.gameID}:betLevel:${oneLevel.betLevel}:level:${oneLevel.rtpLevel}:totalIn`;
    const totalOutKey = `{moneyPool}:game:${oneLevel.gameID}:betLevel:${oneLevel.betLevel}:level:${oneLevel.rtpLevel}:totalOut`;
    await redisClient.hSet(operatorKey, totalInKey, 0);
    await redisClient.hSet(operatorKey, totalOutKey, 0);
    return oneLevel;
  }
  static async getBetPools(query: Record<string, string>) {
    allLevels = [];
    const games = await prismaClient.game.findMany({});

    const { condition, skip, take, orderBy } = parseQuery(query, Prisma.GameHistoryScalarFieldEnum, ["historyId"]);

    const operators = await prismaClient.operator.findMany({});

    let gameBetLevels: any[] = [];
    for (let index = 0; index < games.length; index++) {
      const game = games[index];
      const levels = selectBetLevelPoolByGameID(game.gameID);
      gameBetLevels = gameBetLevels.concat(levels.map((item) => ({ gameID: game.gameID, level: item.level })));
    }

    for (const operator of operators) {
      for (let j = 0; j < RtpLevels.length; j++) {
        const rtp = RtpLevels[j];
        for (let i = 0; i < gameBetLevels.length; i++) {
          const betLevel = gameBetLevels[i];
          const totalIn = await this.getTotalIn({
            gameID: betLevel.gameID,
            betLevel: betLevel.level,
            level: rtp.rtpNo,
            operatorId: operator.id,
          });
          const totalOut = await this.getTotalOut({
            gameID: betLevel.gameID,
            betLevel: betLevel.level,
            level: rtp.rtpNo,
            operatorId: operator.id,
          });
          const rtpValue = new Decimal(totalOut).dividedBy(totalIn);
          const profit = totalIn.sub(totalOut);
          const profitRate = profit.dividedBy(totalIn);
          const id = `${operator.id}0${betLevel.gameID}0${betLevel.level}0${rtp.rtpNo}`;
          if (allLevels.find((item) => item.id === id)) {
            continue;
          }
          allLevels.push({
            id,
            gameID: betLevel.gameID,
            operatorId: operator.id,
            rtpLevel: rtp.rtpNo,
            betLevel: betLevel.level,
            totalIn: new Decimal(totalIn).toNumber(),
            totalOut: new Decimal(totalOut).toNumber(),
            rtp: rtpValue.toString(),
            profit: profit.toString(),
            profitRate,
          });
        }
      }
    }

    allLevels = allLevels.sort((a, b) => {
      if (a.totalIn > b.totalIn) {
        return -1;
      }
      return 1;
    });

    if (condition.betLevel) {
      allLevels = allLevels.filter((item) => item.betLevel === Number(condition.betLevel));
    }

    if (condition.gameId) {
      const game = await prismaClient.game.findUnique({
        where: { id: Number(condition.gameId) },
      });
      allLevels = allLevels.filter((item) => item.gameID === Number(game?.gameID));
    }

    if (condition.rtpLevel) {
      allLevels = allLevels.filter((item) => item.rtpLevel === Number(condition.rtpLevel));
    }

    if (condition.operatorId) {
      allLevels = allLevels.filter((item) => item.operatorId === Number(condition.operatorId));
    }

    console.log("GameMoneyPoolService=getBetPools=condition:", condition);

    //take
    const pageLevels = allLevels.slice(skip, skip + take);

    return { list: pageLevels, count: allLevels.length };
  }

  static async getTotalIn(keyParams: { gameID: number; level: number; betLevel: number; operatorId: number }) {
    const { gameID, level, betLevel, operatorId } = keyParams;
    const operatorKey = operatorId ? `{moneyPool}:operatorId:${operatorId}` : PUBLIC_UNKNOWN_OPERATOR_ID;
    const totalInKey = `{moneyPool}:game:${gameID}:betLevel:${betLevel}:level:${level}:totalIn`;
    const totalInStr = await redisClient.hGet(operatorKey, totalInKey);
    if (!totalInStr) {
      await redisClient.hIncrByFloat(operatorKey, totalInKey, 0.0001);
    }
    return new Decimal(totalInStr || "0");
  }

  static async getTotalOut(keyParams: { gameID: number; level: number; betLevel: number; operatorId: number }) {
    const { gameID, level, betLevel, operatorId } = keyParams;
    const operatorKey = operatorId ? `{moneyPool}:operatorId:${operatorId}` : PUBLIC_UNKNOWN_OPERATOR_ID;
    const totalOutKey = `{moneyPool}:game:${gameID}:betLevel:${betLevel}:level:${level}:totalOut`;
    const totalOutStr = await redisClient.hGet(operatorKey, totalOutKey);
    if (!totalOutStr) {
      await redisClient.hIncrByFloat(operatorKey, totalOutKey, 0.0001);
    }
    return new Decimal(totalOutStr || "0");
  }

  static async getPoolRtp(keyParams: MoneyPoolMachine) {
    const totalIn = await this.getTotalIn(keyParams);
    const totalOut = await this.getTotalOut(keyParams);
    const rtp = totalOut.dividedBy(totalIn);
    return rtp;
  }

  static async getPoolProfitRate(keyParams: MoneyPoolMachine) {
    const totalIn = await this.getTotalIn(keyParams);
    const totalOut = await this.getTotalOut(keyParams);
    console.log("获取奖池利润率============", JSON.stringify(keyParams));
    console.log("totalIn:", totalIn.toString(), "totalOut:", totalOut.toString());
    const profit = totalIn.sub(totalOut);
    const profitRate = profit.dividedBy(totalIn);
    return profitRate;
  }

  static async putMoney(keyParams: MoneyPoolMachine, values: Decimal) {
    console.log("对奖池投入钱==============", JSON.stringify(keyParams));
    let checkTime = Date.now();
    const { gameID, level, betLevel, operatorId } = keyParams;
    const operatorKey = operatorId ? `{moneyPool}:operatorId:${operatorId}` : PUBLIC_UNKNOWN_OPERATOR_ID;
    const totalInKey = `{moneyPool}:game:${gameID}:betLevel:${betLevel}:level:${level}:totalIn`;
    console.log("GameMoneyPoolService=putMoney=totalIn=key:", totalInKey);
    console.log("GameMoneyPoolService=putMoney=totalIn=value:", values);
    const formatValue = Number(values.toFixed(4));
    if (Number.isNaN(formatValue) || !Number.isFinite(formatValue)) {
      console.log("GameMoneyPoolService=putMoney=totalIn=error:", formatValue);
      return;
    }
    await redisClient.hIncrByFloat(operatorKey, totalInKey, formatValue);
    console.log("GameMoneyPoolService=putMoney耗时:", Date.now() - checkTime, "ms");
  }

  static async loseMoney(
    keyParams: { gameID: number; level: number; betLevel: number; operatorId: number },
    values: Decimal,
  ) {
    let checkTime = Date.now();
    const { gameID, level, betLevel, operatorId } = keyParams;
    const operatorKey = operatorId ? `{moneyPool}:operatorId:${operatorId}` : PUBLIC_UNKNOWN_OPERATOR_ID;
    const totalOutKey = `{moneyPool}:game:${gameID}:betLevel:${betLevel}:level:${level}:totalOut`;
    console.log("GameMoneyPoolService=loseMoney=totalOut=key:", totalOutKey);
    console.log("GameMoneyPoolService=loseMoney=totalOut=value:", values);
    const formatValue = Number(values.toFixed(4));
    if (Number.isNaN(formatValue) || !Number.isFinite(formatValue)) {
      console.log("GameMoneyPoolService=loseMoney=totalOut=error:", formatValue);
      return;
    }
    await redisClient.hIncrByFloat(operatorKey, totalOutKey, formatValue);
    console.log("GameMoneyPoolService=loseMoney耗时:", Date.now() - checkTime, "ms");
  }

  static async clearOperatorMoneyPool(operatorId: number) {
    await redisClient.del(`{moneyPool}:operatorId:${operatorId}`);
  }

  static async ifMoneyPoolTooHigh(win: Decimal) {
    return false;

    // const poolLevel = moneyPool.level;
    // const poolConfig = RtpLevels.find((rtp) => rtp.rtpNo === poolLevel);
    // if (!poolConfig) {
    //   throw new HTTPException(404, { message: "pool config not found" });
    // }
    // const totalIn = new Decimal(moneyPool.totalIn || "0");
    // const totalOut = new Decimal(moneyPool.totalOut || "0");
    // //predict RTP
    // const predictedRTP = totalOut.add(win).dividedBy(totalIn);

    // const currencyRtp = totalOut.dividedBy(totalIn);

    // console.log("预测的RTP", predictedRTP.toString(), "最大RTP", poolConfig.max.toString(), "当前RTP", currencyRtp);

    // if (predictedRTP.gt(poolConfig?.max)) {
    //   return true;
    // }
    // return false;
  }
}
