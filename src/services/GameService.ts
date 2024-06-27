import { z } from "@hono/zod-openapi";
import { VerifyOperationPlayerSessionInput } from "dtos/verifyOperatorPlayerSession";
import { HTTPException } from "hono/http-exception";
import { prismaClient } from "utils/prismaClient";
import { AuthService } from "./AuthService";
import { SessionService } from "./SessionService";
import { VerifySessionInput } from "dtos/verifyPlayerSession";
import { ParsedQs } from "qs";
import { parseQuery } from "utils/parseQuery";
import {
  ConfigThreeColumnsCardWeight,
  Game,
  GameHistory,
  GameHistoryStatus,
  OperatorUser,
  Prisma,
} from "@prisma/client";
import { GameMoneyPoolService } from "./GameMoneyPoolService";
import { GameConfigService } from "./GameConfigService";
import random from "random";
import { UserGameStore } from "models";
import { Decimal } from "@prisma/client/runtime/library";
import { triggerLoginJob } from "jobs";
import { GameHistoryService } from "./GameHistoryService";
import { WalletService } from "./WalletService";
import { MoneyPoolMachine } from "models/types";
import sql from "utils/db";
import { GamePlayerService } from "./GamePlayerService";
import { OperatorUserService } from "./OperatorUserService";
import { SpecialSpinStatus } from "gameConfigs";
import { ACTIONS, MESSAGEGROUP, sqsClient } from "./SqsService";
import { PgClient, redisClient } from "utils";
import { FortuneDoubleService } from "./games/FortuneDoubleService";

export class GameService {
  static async getGameById(gameID: number) {
    const {
      rows: [game],
    } = await PgClient.query<Game>(`SELECT
      "t1"."id", "t1"."name",
      "t1"."fullName", "t1"."gameID",
      "t1"."lastGameFeatureUpdateAt",
      "t1"."setting", "t1"."createdAt",
      "t1"."updatedAt", "t1"."version" FROM "public"."Game" AS "t1"
      WHERE "t1"."gameID" =
      '${gameID}' LIMIT 1`);

    return game;
  }

  static async getGameByName(name: string) {
    try {
      const {
        rows: [game],
      } = await PgClient.query(`SELECT 
      "t1"."id", "t1"."name", 
      "t1"."fullName", "t1"."gameID", 
      "t1"."lastGameFeatureUpdateAt", 
      "t1"."setting", "t1"."createdAt", 
      "t1"."updatedAt", "t1"."version" FROM "public"."Game" AS "t1" 
      WHERE "t1"."name" =
      '${name}' LIMIT 1`);

      return game;
    } catch (error: any) {
      console.error(error);
      throw new HTTPException(500, { message: error.message });
    }
  }

  static async pushDetailByStatus(params: {
    specialStatus: SpecialSpinStatus;
    historyId: string;
    gameID: number;
    detail: any;
    balanceAfterSpin: number;
  }) {
    const { specialStatus, historyId, gameID, detail, balanceAfterSpin } = params;
    console.log("pushDetailByStatus===============", JSON.stringify(params));
    const status =
      specialStatus === SpecialSpinStatus.End || specialStatus === SpecialSpinStatus.NeverIN
        ? GameHistoryStatus.Success
        : GameHistoryStatus.Pending;

    if (historyId) {
      if (specialStatus === SpecialSpinStatus.NeverIN) {
        sqsClient.sendMessage(
          JSON.stringify({
            historyId,
            detailRecord: [detail],
            status,
            balanceAfter: balanceAfterSpin,
          }),
          MESSAGEGROUP.HISTORY,
          ACTIONS.PUSHDETAIL,
        );
      } else if (status === GameHistoryStatus.Success) {
        const detailListStrArr = await redisClient.lRange(`histories:${gameID}:detailList:${historyId}`, 0, -1);
        const detailList = detailListStrArr.map((item) => JSON.parse(item));
        sqsClient.sendMessage(
          JSON.stringify({
            historyId,
            detailRecord: [...detailList, detail],
            status,
            balanceAfter: balanceAfterSpin,
          }),
          MESSAGEGROUP.HISTORY,
          ACTIONS.PUSHDETAIL,
        );
        //clear
        await redisClient.del(`histories:${gameID}:detailList:${historyId}`);
      } else if (status === GameHistoryStatus.Pending) {
        await redisClient.rPush(`histories:${gameID}:detailList:${historyId}`, JSON.stringify(detail));
      }
    }
  }

  static async verifyGameSession(verifyParams: z.infer<typeof VerifySessionInput>) {
    const operatorUserId = verifyParams.cp;
    const {
      rows: [operatorUser],
    } = await PgClient.query<OperatorUser>(`
      SELECT "t1"."id", "t1"."operatorId", "t1"."accountID"
      FROM "public"."OperatorUser" AS "t1"
      where "t1"."id" = '${+operatorUserId}' LIMIT 1`);
    if (!operatorUser) {
      throw new HTTPException(404, { message: "operator user not found" });
    }
    const operatorUserToken = verifyParams.otk;
    const sessions = await AuthService.getOperatorSession(operatorUserToken, operatorUser.operatorId.toString());
    if (sessions.length === 0) {
      throw new HTTPException(401, { message: "operator user token invalid" });
    } else {
      SessionService.renewSession("operator", operatorUserToken);
    }
    const gameId = +verifyParams.gi;

    const token = verifyParams.tk;
    const gameSessions = await AuthService.getGameSession(token);
    const sessionData = gameSessions[0]?.data;
    if (gameSessions.length === 0) {
      return {
        games: null,
        gamePlayer: null,
        token,
        currency: sessionData.currency,
        error: {
          cd: "1302",
          msg: "Invalid player session",
          tid: operatorUser.id,
        },
      };
    } else {
      SessionService.renewSession("mpg", token);
    }
    const gamePlayer = await GamePlayerService.getGamePlayerById(Number(gameSessions[0].id));

    console.log("gamePlayer.isTesting? ", gamePlayer?.isTest);

    if (!gamePlayer) {
      return {
        games: null,
        gamePlayer: null,
        operatorUser,
        token,
        currency: sessionData.currency,
        error: {
          cd: "1302",
          msg: "Invalid player session",
          tid: operatorUser.id,
        },
      };
    }

    const game = await GameService.getGameById(gameId);
    if (!game) {
      throw new HTTPException(404, { message: "game not found" });
    }
    if (gameId == 48) {
      FortuneDoubleService.playerLogin(gamePlayer.id);
    }
    return {
      game,
      gamePlayer,
      operatorUser,
      currency: sessionData.currency,
      token,
      error: null,
    };
  }

  static async verifyOperatorSession(verifyParams: z.infer<typeof VerifyOperationPlayerSessionInput>) {
    const operatorUserId = verifyParams.cp;

    const { rows } = await PgClient.query(`
      SELECT "t1"."id", "t1"."operatorId", "t1"."accountID", 
      "t1"."updatedAt", "t1"."version", "t2"."id", 
      "t2"."name", "t2"."createdAt", "t2"."updatedAt", "t2"."version" FROM "public"."OperatorUser" AS "t1"
      LEFT JOIN "public"."Operator" AS "t2" ON "t1"."operatorId" = "t2"."id"
      WHERE "t1"."id" = '${+operatorUserId}' LIMIT 1
    `);

    const operatorUser = rows[0];

    if (!operatorUser) {
      throw new HTTPException(404, { message: "operator user not found" });
    }
    const operatorUserToken = verifyParams.otk;
    const sessions = await AuthService.getOperatorSession(operatorUserToken, operatorUser.operatorId.toString());
    const sessionData = sessions[0]?.data;
    if (sessions.length === 0) {
      throw new HTTPException(401, { message: "operator user token invalid" });
    } else {
      SessionService.renewSession("operator", operatorUserToken);
    }
    const gameId = +verifyParams.gi;
    const gamePlayer = await GamePlayerService.getPlayerByOperatorUserId(+operatorUserId);

    console.log("gamePlayer.isTesting? ", gamePlayer?.isTest);
    if (!gamePlayer) {
      throw new HTTPException(404, {
        message: "player not found in verifyOperatorSession",
      });
    }
    let userGameStore: null | UserGameStore = new UserGameStore(gamePlayer.id, gameId);
    let token: null | string = null;
    const gameSessions = await AuthService.getGameSessionById(gamePlayer.id.toString());
    if (gameSessions.length === 0) {
      token = await SessionService.createSession({
        id: gamePlayer.id.toString(),
        appName: "mpg",
        data: sessionData,
      });
      triggerLoginJob({
        playerId: gamePlayer.id,
        gameID: gameId,
      });
    } else {
      token = gameSessions[0].token;
      SessionService.renewSession("mpg", token);
    }

    const {
      rows: [game],
    } = await PgClient.query<Game>(`SELECT
      "t1"."id", "t1"."name",
      "t1"."fullName", "t1"."gameID",
      "t1"."lastGameFeatureUpdateAt",
      "t1"."setting", "t1"."createdAt",
      "t1"."updatedAt", "t1"."version" FROM "public"."Game" AS "t1"
      WHERE "t1"."gameID" =
      ${gameId} LIMIT 1`);

    if (!game) {
      userGameStore = null;
      throw new HTTPException(404, { message: "game not found" });
    }
    userGameStore = null;
    return {
      token,
      game,
      gamePlayer,
      currency: sessionData.currency,
      operatorUser,
    };
  }

  static async getGame(id: number) {
    const {
      rows: [game],
    } = await PgClient.query<Game>(`SELECT
      "t1"."id", "t1"."name",
      "t1"."fullName", "t1"."gameID",
      "t1"."lastGameFeatureUpdateAt",
      "t1"."setting", "t1"."createdAt",
      "t1"."updatedAt", "t1"."version" FROM "public"."Game" AS "t1"
      WHERE "t1"."id" =
      ${id} LIMIT 1`);

    return game || null;
  }

  static createGame(input: Prisma.GameCreateInput) {
    return prismaClient.game.create({
      data: input,
    });
  }

  static updateGame(id: number, input: Prisma.GameUpdateInput) {
    return prismaClient.game.update({
      where: {
        id,
      },
      data: input,
    });
  }

  static deleteGame(id: number) {
    return prismaClient.game.delete({
      where: {
        id,
      },
    });
  }

  static async getGames(query: ParsedQs) {
    try {
      const { condition, skip, take, orderBy } = parseQuery(query, Prisma.GameScalarFieldEnum);
      const list = await prismaClient.game.findMany({
        where: condition,
        skip,
        take,
        orderBy,
      });

      const count = await prismaClient.game.count({
        where: condition,
      });

      return {
        list,
        total: count,
      };
    } catch (error: any) {
      console.error(error);
      throw new HTTPException(500, { message: error.message });
    }
  }

  static async predictWinIsTooHigh(userGameStore: UserGameStore, win: Decimal) {
    return false;

    // console.log(
    //   "开始判断奖池是否过高, playerId:",
    //   userGameStore.playerId,
    //   "gameID:",
    //   userGameStore.gameID,
    //   "win:",
    //   win.toString(),
    // );
    // const moneyPool = await GameMoneyPoolService.getOrJoinPlayerPool(userGameStore);
    // const currentTotalWin = await userGameStore.getTotalWin();
    // const currentRTP = await userGameStore.getCurrentRTP();
    // const totalWin = currentTotalWin.add(win);
    // const currentTotalBet = await userGameStore.getTotalBet();
    // console.log("判断奖池是否过高,当前投注总金额====", currentTotalBet);
    // console.log("判断奖池是否过高,当前反奖总金额====", totalWin);
    // const predictedRTP = totalWin.div(currentTotalBet);

    // const playerId = userGameStore.playerId;
    // const player = await prismaClient.gamePlayer.findUnique({
    //   where: {
    //     id: playerId,
    //   },
    // });

    // console.log(
    //   "判断奖池是否过高",
    //   JSON.stringify({
    //     playerId: playerId,
    //     gameID: userGameStore.gameID,
    //     accountID: player?.operatorAccountID,
    //   }),
    // );
    // if (!player) {
    //   return false;
    // }
    // const playerLevelRtp = player.rtpLevel;
    // const rtpConfig = RtpLevels.find((rtpLevel) =>
    //   player.isTest ? rtpLevel.rtpNo === 14 : rtpLevel.rtpNo === playerLevelRtp,
    // );
    // const playerMaxRtp = rtpConfig?.max || 1;
    // console.log(
    //   "个人ID:",
    //   playerId,
    //   "游戏ID:",
    //   userGameStore.gameID,
    //   "个人预测:",
    //   predictedRTP,
    //   "个人最大:",
    //   playerMaxRtp,
    //   "当前:",
    //   currentRTP,
    // );

    // if (predictedRTP.greaterThanOrEqualTo(playerMaxRtp)) {
    //   //如果用户的RTP超了就立刻返回
    //   return true;
    // }
    // //如果用户的RTP没有超，就判断奖池的RTP
    // const tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHigh(moneyPool, win);
    // return tooHigh;
  }

  static async getRandomCard(gameID: number, column: number) {
    const columnTypes = ["columnOne", "columnTwo", "columnThree"];
    const columnType = columnTypes[column];
    let configs = await GameConfigService.getThreeColumnsCardWeight(gameID);
    configs = configs.sort((a, b) => (a as any)[columnType] - (b as any)[columnType]);

    let showWeights = configs.map((config) => (config as any)[columnType] as number);

    const totalWeight = showWeights.reduce((prev, curr) => prev + curr, 0);
    const randomWeight = random.float(0, totalWeight);
    let weight = 0;
    for (const config of configs) {
      weight += (config as any)[columnType];
      if (randomWeight <= weight) {
        return config as ConfigThreeColumnsCardWeight;
      }
    }
  }

  static async getRandom9Cards(gameID: number) {
    const cards = [];
    for (let index = 0; index < 9; index++) {
      const card = await this.getRandomCard(gameID, index % 3);
      cards.push(card);
    }
    return cards as ConfigThreeColumnsCardWeight[];
  }

  static async getRandom10Cards(gameID: number) {
    const cards = [];
    for (let index = 0; index < 10; index++) {
      const card = await this.getRandomCard(gameID, index % 3);
      cards.push(card);
    }
    return cards as ConfigThreeColumnsCardWeight[];
  }
  static async getRandom25Cards(gameID: number, newAnswer?: any) {
    const cards1 = [];
    for (let i = 0; i < 25; i++) {
      let obj = {
        id: i,
        name: "",
        gameID: gameID,
        cardID: newAnswer ? newAnswer[i] : Math.floor(Math.random() * 9),
        columnOne: i % 5,
        columnTwo: i % 5,
        columnThree: i % 5,
        payRate: 1,
        updatedAt: new Date(),
      };
      cards1.push(obj);
    }

    return cards1;

    const cards = [];
    for (let index = 0; index < 25; index++) {
      const card = await this.getRandomCard(gameID, index % 5);
      cards.push(card);
    }
    return cards as ConfigThreeColumnsCardWeight[];
  }
}
