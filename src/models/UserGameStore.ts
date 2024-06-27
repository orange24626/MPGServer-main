import { GamePlayer, Operator } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { PgClient, redisClient } from "utils";
import { MoneyPoolMachine } from "./types";
import { RtpLevels, selectBetLevelPoolByGameID } from "gameConfigs";
import { GamePlayerService, WalletService } from "services";
import sql from "utils/db";

export class UserGameStore {
  playerId: number;
  gameID: number;

  constructor(playerId: number, gameID: number) {
    this.playerId = playerId;
    this.gameID = gameID;
  }

  async getPlayer() {
    const key = `{user-store}:${this.gameID}:${this.playerId}:player`;
    const playerStr = await redisClient.get(key);
    if (playerStr) {
      return JSON.parse(playerStr) as GamePlayer;
    }
    const player = await GamePlayerService.getGamePlayerById(this.playerId);
    await redisClient.set(key, JSON.stringify(player));
    await redisClient.expire(key, 10);
    if (!player) {
      await redisClient.del(`{user-store}:${this.gameID}:game:${this.playerId}:player`);
      throw new Error("player not found");
    }

    return player;
  }

  getOperator = async () => {
    const key = `{user-store}:${this.gameID}:${this.playerId}:operator`;
    const operatorStr = await redisClient.get(key);

    if (operatorStr) {
      return JSON.parse(operatorStr) as Operator;
    }
    const player = await this.getPlayer();
    if (!player) {
      throw new Error("player not found");
    }
    const {
      rows: [operator],
    } = await PgClient.query(`
      SELECT * FROM "public"."Operator" WHERE id = ${player.operatorId} limit 1;
    `);

    await redisClient.set(key, JSON.stringify(operator));
    await redisClient.expire(key, 10);
    if (!operator) {
      await redisClient.del(key);
      throw new Error("operator not found");
    }
    return operator;
  };

  async setBetAmount(betAmount: number) {
    await redisClient.hSet(`{user-store}:${this.gameID}:${this.playerId}`, "betAmount", betAmount.toString());
  }

  async getBetAmount() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:${this.playerId}`, "betAmount");
    return new Decimal(str || 0).toNumber();
  }

  async addTotalBet(totalBet: number) {
    const formatValue = Number(totalBet.toFixed(4));
    if (!Number.isFinite(formatValue) || Number.isNaN(formatValue)) {
      return;
    }
    await redisClient.hIncrByFloat(`{user-store}:${this.gameID}:${this.playerId}`, "totalBet", formatValue);
  }

  async setBaseBet(baseBet: number) {
    await redisClient.hSet(`{user-store}:${this.gameID}:${this.playerId}`, "baseBet", baseBet.toString());
  }

  async getBaseBet() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:${this.playerId}`, "baseBet");
    return new Decimal(str || 0).toNumber();
  }

  async setBaseRate(baseRate: number) {
    await redisClient.hSet(`{user-store}:${this.gameID}:${this.playerId}`, "baseRate", baseRate.toString());
  }

  async setLastTotalBet(totalBet: number) {
    await redisClient.hSet(`{user-store}:${this.gameID}:${this.playerId}`, "lastTotalBet", totalBet.toString());
  }
  async delLastTotalBet() {
    await redisClient.hDel(`{user-store}:${this.gameID}:${this.playerId}`, "lastTotalBet");
  }
  async setLastLineBet(lineBet: number) {
    await redisClient.hSet(`{user-store}:${this.gameID}:${this.playerId}`, "lastLineBet", lineBet.toString());
  }

  async getLastLineBet() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:${this.playerId}`, "lastLineBet");
    return new Decimal(str || 0).toNumber();
  }

  async delLastLineBet() {
    await redisClient.hDel(`{user-store}:${this.gameID}:${this.playerId}`, "lastLineBet");
  }

  async getLastTotalBet() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:${this.playerId}`, "lastTotalBet");
    return new Decimal(str || 0).toNumber();
  }

  async getBaseRate() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:${this.playerId}`, "baseRate");
    return new Decimal(str || 0).toNumber();
  }

  async getTotalBet() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:${this.playerId}`, "totalBet");
    if (!str) {
      await redisClient.hIncrByFloat(`{user-store}:${this.gameID}:${this.playerId}`, "totalBet", 0.001);
    }
    return new Decimal(str || "0.001");
  }

  async resetTotalBet() {
    await redisClient.hDel(`{user-store}:${this.gameID}:${this.playerId}`, "totalBet");
  }

  async addTotalWin(totalWin: number) {
    const formatValue = Number(totalWin.toFixed(4));
    if (!Number.isFinite(formatValue) || Number.isNaN(formatValue)) {
      return;
    }
    await redisClient.hIncrByFloat(`{user-store}:${this.gameID}:${this.playerId}`, "totalWin", formatValue);
  }

  async getTotalWin() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:${this.playerId}`, "totalWin");

    return new Decimal(str || "0");
  }

  async resetTotalWin() {
    await redisClient.hDel(`{user-store}:${this.gameID}:${this.playerId}`, "totalWin");
  }

  async getCurrentRTP() {
    const totalBet = await this.getTotalBet();
    const totalWin = await this.getTotalWin();
    return new Decimal(totalWin || 0).div(totalBet || 1).toNumber();
  }

  getRtpLevel = async () => {
    const operator = await this.getOperator();
    const player = await this.getPlayer();
    const levelConfig = RtpLevels.find((conf) => conf.rtpNo === (player?.isTest ? 14 : operator?.rtpLevel));
    return levelConfig;
  };

  getBetLevel = async () => {
    let currentBetAmount = await this.getBetAmount();
    console.log(
      "获取的用户的BetLevel",
      "当前用户投注" + currentBetAmount,
      `当前游戏${this.gameID}, 当前用户${this.playerId}`,
    );
    const levelPools = selectBetLevelPoolByGameID(this.gameID);
    let levelPool = levelPools.find((lp) => currentBetAmount >= lp.min && currentBetAmount <= lp.max);
    return levelPool;
  };

  getMoneyPool = async (): Promise<MoneyPoolMachine> => {
    const levelPool = await this.getBetLevel();
    if (!levelPool) {
      throw new Error(`levelPool not found, 当前游戏${this.gameID}, 当前用户${this.playerId}`);
    }
    console.log("当前用户的levelPool 当前游戏${this.gameID}, 当前用户${this.playerId}", JSON.stringify(levelPool));
    const player = await this.getPlayer();

    const pool: MoneyPoolMachine = {
      level: player.rtpLevel,
      maxRtp: new Decimal(levelPool.max),
      betLevel: levelPool.level,
      gameID: this.gameID,
      operatorId: player.operatorId,
    };
    return pool;
  };

  async setBetCount(betCount: number) {
    await redisClient.hSet(`{user-store}:${this.gameID}:game:${this.playerId}`, "betCount", betCount.toString());
  }

  async addBetCount() {
    try {
      await redisClient.hIncrBy(`{user-store}:${this.gameID}:game:${this.playerId}`, `betCount`, 1);
    } catch (error) {
      await redisClient.hDel(`{user-store}:${this.gameID}:game:${this.playerId}`, `betCount`);
      console.error("addBetCount error=========", error);
    }
  }

  async resetBetCount() {
    await redisClient.hDel(`{user-store}:${this.gameID}:game:${this.playerId}`, `betCount`);
  }

  async getBetCount() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:game:${this.playerId}`, "betCount");
    return +(str || 0);
  }

  isNewer = async () => {
    const wallet = await WalletService.getWalletByPlayerId(this.playerId);
    if (!wallet) {
      throw new Error("wallet not found");
    }
    const walletRtp = new Decimal(wallet.totalWin).dividedBy(wallet.totalPlay);

    console.log("当前用户钱包RTP:", walletRtp.toNumber() || 0, wallet.totalWin);

    if (walletRtp.greaterThanOrEqualTo(0.8)) {
      return false;
    }
    const betCount = await this.getBetCount();
    if (betCount >= 100) {
      return false;
    }
    return true;
  };

  isTrail = async () => {
    const player = await GamePlayerService.getGamePlayerById(this.playerId);
    if (!player) {
      return false;
    }
    return player.isTest;
  };

  async getNoPrizeCount() {
    const str = await redisClient.hGet(`{user-store}:${this.gameID}:game:${this.playerId}`, "noPrizeCount");
    return +(str || 0);
  }

  async addNoPrizeCount() {
    await redisClient.hIncrBy(`{user-store}:${this.gameID}:game:${this.playerId}`, `:noPrizeCount`, 1);
  }

  async delNoPrizeCount() {
    await redisClient.hDel(`{user-store}:${this.gameID}:game:${this.playerId}`, `:noPrizeCount`);
  }
}
