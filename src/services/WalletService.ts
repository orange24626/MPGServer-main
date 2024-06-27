import { GamePlayerWallet, OperatorGameTransactionType, Prisma } from "@prisma/client";
import { PgClient, prismaClient } from "../utils";
import { Decimal } from "@prisma/client/runtime/library";
import { ParsedQs } from "qs";
import { parseQuery } from "utils";
import { nanoid } from "nanoid";
import { HTTPException } from "hono/http-exception";
import { triggerChargeJob } from "jobs";
import sql from "utils/db";
import { GamePlayerService } from "./GamePlayerService";
import { SessionService } from "./SessionService";
import moment from "moment";

export class WalletService {
  static async chargeWallet(walletId: number, amount: number) {
    if (new Decimal(amount).lessThanOrEqualTo(0)) {
      throw new HTTPException(400, {
        message: "amount must be greater than 0",
      });
    }

    amount = parseFloat(amount.toFixed(2));
    return await prismaClient.$transaction(async (ctx) => {
      let wallet = await ctx.gamePlayerWallet.findFirst({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new HTTPException(404, {
          message: "wallet not found",
        });
      }

      const balanceBefore = wallet.balance;
      if (!wallet) {
        throw new Error("wallet not found");
      }
      const player = await ctx.gamePlayer.findUnique({
        where: {
          id: wallet.playerId,
        },
      });
      if (!player) {
        throw new HTTPException(404, {
          message: "player not enough",
        });
      }
      wallet = await ctx.gamePlayerWallet.update({
        data: {
          balance: { increment: parseFloat(amount.toFixed(2)) },
          version: { increment: 1 },
          totalIn: {
            increment: amount,
          },
          totalDeposit: {
            increment: amount,
          },
        },
        where: { id: wallet.id },
      });
      const balanceAfter = wallet.balance;

      const operatorTransaction = await ctx.operatorMoneyTransaction.create({
        data: {
          amount: parseFloat(amount.toFixed(4)),
          balanceAfter: parseFloat(balanceAfter.toFixed(4)),
          balanceBefore: parseFloat(balanceBefore.toFixed(4)),
          operatorId: wallet.operatorId as number,
          operatorUserID: player.operatorAccountID,
          operatorOrderID: null,
          type: OperatorGameTransactionType.Deposit,
          orderID: nanoid(),
          playerId: player.id,
          walletId: wallet.id,
        },
      });

      triggerChargeJob({
        playerId: player.id,
        charge: amount,
      });
      return operatorTransaction;
    });
  }
  static async getWallets(query: ParsedQs, operatorIds: number[] = []) {
    const { skip, take, orderBy, condition } = parseQuery(query, Prisma.GamePlayerWalletScalarFieldEnum);
    if (operatorIds.length > 0) {
      condition.operatorId = {
        in: operatorIds,
      };
    }
    const list = await prismaClient.gamePlayerWallet.findMany({
      where: { ...condition },
      skip,
      take,
      orderBy,
    });
    const total = await prismaClient.gamePlayerWallet.count({
      where: condition,
    });
    return {
      list,
      total,
    };
  }

  static async gameProfit(params: { amount: Decimal; playerId: number; currency: string }) {
    let { amount, playerId, currency } = params;
    if (new Decimal(amount).eq(0)) {
      return null;
    }
    return await sql.begin(async (sql) => {
      const { rows } = await PgClient.query(`
        SELECT * FROM "public"."GamePlayerWallet" WHERE "playerId" = '${playerId}' AND "currency" = '${currency}' LIMIT 1
      `);
      const wallet = rows[0];
      if (!rows[0]) {
        throw new Error("wallet not found");
      }
      const balanceBefore = new Decimal(wallet.balance);
      await PgClient.query(`
        UPDATE "public"."GamePlayerWallet" 
        SET "balance" = "balance" + '${amount.toFixed(4)}', 
        "updatedAt"=now(),
        "version" = "version" + 1 WHERE "id" = '${wallet.id}'
      `);
      const balanceAfter = new Decimal(balanceBefore).plus(amount);
      return {
        balanceBefore,
        balanceAfter,
      };
    });
  }
  static async gameProfitEx(params: { amount: Decimal; playerId: number; currency: string; detail: any }) {
    let { amount, playerId, detail, currency } = params;
    // if (new Decimal(amount).eq(0)) {
    //   return null;
    // }
    return await sql.begin(async (sql) => {
      const [wallet] = await sql`
        SELECT * FROM "public"."GamePlayerWallet" WHERE "playerId" = ${playerId} AND "currency" = ${currency} LIMIT 1
      `;
      if (!wallet) {
        throw new Error("wallet not found");
      }
      const balanceBefore = new Decimal(wallet.balance);
      if (new Decimal(amount).gt(0)) {
        await sql`
        UPDATE "public"."GamePlayerWallet" 
        SET "balance" = "balance" + ${amount.toFixed(4)}, 
        "totalWin" = "totalWin" + ${amount.toFixed(4)}, 
        "totalIn" = "totalIn" + ${amount.toFixed(4)}, "version" = "version" + 1 WHERE "id" = ${wallet.id}
      `;
      }

      if (new Decimal(amount).lt(0)) {
        const out = new Decimal(amount).abs();
        await sql`
        UPDATE "public"."GamePlayerWallet" 
        SET "balance" = "balance" + ${amount.toFixed(4)}, 
        "totalPlay" = "totalPlay" + ${out.toFixed(4)}, 
        "totalOut" = "totalOut" + ${out.toFixed(4)}, "version" = "version" + 1 WHERE "id" = ${wallet.id}
      `;
      }
      const balanceAfter = new Decimal(wallet.balance).plus(amount);
      return {
        balanceBefore,
        balanceAfter,
      };
    });
  }
  static deductFundByOperator(params: {
    amount: number;
    playerId: number;
    currency: string;
    detail: {
      operatorId: number;
      operatorOrderID: string;
      operatorName: string;
      note?: string;
    };
    all?: boolean;
  }) {
    let { amount, playerId, detail, currency, all } = params;
    const { operatorId } = detail;
    return prismaClient.$transaction(async (ctx) => {
      let wallet = await ctx.gamePlayerWallet.findFirst({
        where: { playerId, currency },
      });
      if (!wallet) {
        throw new HTTPException(400, {
          message: "wallet not found",
        });
      }
      if (wallet.balance.lt(amount) && !all) {
        throw new HTTPException(400, {
          message: "balance not enough",
        });
      }
      const player = await ctx.gamePlayer.findUnique({
        where: {
          id: playerId,
        },
      });
      if (!player) {
        throw new HTTPException(404, {
          message: "player not enough",
        });
      }
      const balanceBefore = wallet.balance;

      wallet = await ctx.gamePlayerWallet.update({
        data: {
          balance: {
            decrement: all ? wallet.balance : new Decimal(amount.toFixed(4)),
          },
          totalWithdraw: {
            increment: all ? 0 : new Decimal(amount.toFixed(4)),
          },
          version: { increment: 1 },
          totalOut: {
            increment: amount,
          },
        },
        where: { id: wallet.id, currency },
      });

      const balanceAfter = wallet.balance;

      let operatorTransaction = await ctx.operatorMoneyTransaction.create({
        data: {
          amount: new Decimal(amount.toFixed(4)),
          operatorId,
          operatorUserID: player.operatorAccountID,
          balanceAfter,
          balanceBefore,
          operatorOrderID: detail.operatorOrderID,
          type: OperatorGameTransactionType.Withdraw,
          orderID: nanoid(),
          playerId,
          walletId: wallet.id,
        },
      });

      if (all) {
        operatorTransaction = await ctx.operatorMoneyTransaction.update({
          data: {
            amount: new Decimal(new Decimal(wallet.balance).toFixed(4)),
            version: {
              increment: 1,
            },
            balanceAfter,
            balanceBefore,
            playerId,
            walletId: wallet.id,
          },
          where: {
            id: operatorTransaction.id,
            version: {
              equals: operatorTransaction.version,
            },
          },
        });
      }
      return operatorTransaction;
    });
  }

  static async getWalletByPlayerIdAndCurrency(params: { playerId: number; currency: string }) {
    const { playerId, currency } = params;
    const {
      rows: [wallet],
    } = await PgClient.query<GamePlayerWallet>(`SELECT "t1"."id", 
      "t1"."balance", 
      "t1"."createdAt",
       "t1"."totalPlay", 
       "t1"."totalWin", 
       "t1"."totalDeposit", 
       "t1"."totalWithdraw", 
       "t1"."totalIn", "t1"."totalOut", 
       "t1"."updatedAt", "t1"."version", 
       "t1"."isTest", "t1"."testingExpired", 
       "t1"."currency", "t1"."playerId", 
       "t1"."operatorId" FROM "public"."GamePlayerWallet" AS "t1" 
       WHERE ("t1"."playerId" = '${playerId}' AND "t1"."currency" = '${currency}') LIMIT 1`);
    if (!wallet) {
      return null;
    }
    return wallet || null;
  }

  static async getWalletByPlayerId(playerId: number) {
    const sessions = await SessionService.getSessions("mpg", String(playerId));
    const session = sessions.find((session) => session.id === String(playerId));
    if (!session) {
      throw new HTTPException(401, {
        message: "session not found",
      });
    }
    return await this.getWalletByPlayerIdAndCurrency({
      playerId,
      currency: session.data.currency || "BRL",
    });
  }

  static async getPlayerWallet(playerId: number) {
    const sql = `SELECT "t1"."id", 
      "t1"."balance", 
      "t1"."createdAt",
       "t1"."totalPlay", 
       "t1"."totalWin", 
       "t1"."totalDeposit", 
       "t1"."totalWithdraw", 
       "t1"."totalIn", "t1"."totalOut", 
       "t1"."updatedAt", "t1"."version", 
       "t1"."isTest", "t1"."testingExpired", 
       "t1"."currency", "t1"."playerId", 
       "t1"."operatorId" FROM "public"."GamePlayerWallet" AS "t1" 
       WHERE ("t1"."playerId" = '${playerId}' ) LIMIT 1`;

    const { rows } = await PgClient.query(sql);
    const wallet = rows[0];
    if (!wallet) {
      return null;
    }
    return wallet as GamePlayerWallet;
  }

  static async updateWalletStatics(params: {
    totalPlay: Decimal;
    totalWin: Decimal;
    totalOut: Decimal;
    totalIn: Decimal;
    walletId: number;
  }) {
    let { totalPlay, totalWin, totalOut, totalIn, walletId } = params;
    const updateRlt = await PgClient.query(`
      UPDATE "public"."GamePlayerWallet" 
      SET "totalPlay" = "totalPlay" + ${totalPlay.toFixed(4)}, 
      "totalWin" = "totalWin" + ${totalWin.toFixed(4)}, 
      "totalOut" = "totalOut" + ${totalOut.toFixed(4)}, 
      "totalIn" = "totalIn" + ${totalIn.toFixed(4)}, 
      "updatedAt" = now()
      WHERE "id" = ${walletId}
    `);
    return updateRlt;
  }

  static async checkBalanceIsEnough(params: { playerId: number; currency: string; amount: number }) {
    console.log("开始检查余额是否充沛", JSON.stringify(params));
    const checkStart = Date.now();
    let { playerId, currency, amount } = params;
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new HTTPException(404, {
        message: "player not found",
      });
    }
    const wallet = await this.getWalletByPlayerIdAndCurrency({
      playerId,
      currency,
    });

    if (!wallet) {
      await prismaClient.gamePlayerWallet.create({
        data: {
          playerId,
          currency,
          balance: 0,
          totalIn: 0,
          totalOut: 0,
          totalWin: 0,
          totalPlay: 0,
          operatorId: 0,
          isTest: player.isTest,
        },
      });
      await this.createWallet({
        playerId: playerId,
        currency,
        balance: 0,
        isTest: player.isTest,
        operatorId: player.operatorId,
      });
      return { enough: false, leftBalance: 0 };
    }
    console.log(`钱包用户: ${wallet.playerId}, 钱包当前余额:${wallet.balance}, 用户投注：${amount}`);
    const enough = new Decimal(Number(wallet.balance).toFixed(4)).greaterThanOrEqualTo(+amount.toFixed(4));
    console.log("检查余额是否充沛结束，耗时", Date.now() - checkStart);
    return { enough, leftBalance: wallet.balance };
  }

  static async addFundByOperator(params: {
    amount: number;
    playerId: number;
    currency: string;
    detail: {
      operatorId: number;
      operatorName: string;
      operatorOrderID: string;
      note?: string;
    };
  }) {
    let { amount, playerId, detail, currency } = params;
    const { operatorId } = detail;

    if (new Decimal(amount.toFixed(4)).lessThanOrEqualTo(0)) {
      throw new HTTPException(400, {
        message: "amount must be greater than 0",
      });
    }

    return await prismaClient.$transaction(async (ctx) => {
      let wallet = await ctx.gamePlayerWallet.findFirst({
        where: { playerId, currency },
      });

      const player = await ctx.gamePlayer.findUnique({
        where: {
          id: playerId,
        },
      });
      if (!player) {
        throw new HTTPException(404, {
          message: "player not found",
        });
      }
      if (!wallet) {
        wallet = await WalletService.createWallet({
          playerId: player.id,
          currency: "BRL",
          isTest: player.isTest,
          balance: 0,
          operatorId: player.operatorId,
        });
      }
      const balanceBefore = wallet.balance;
      wallet = await ctx.gamePlayerWallet.update({
        data: {
          balance: { increment: new Decimal(amount.toFixed(4)) },
          version: { increment: 1 },
          totalIn: {
            increment: new Decimal(amount.toFixed(4)),
          },
          totalDeposit: {
            increment: new Decimal(amount.toFixed(4)),
          },
        },
        where: { id: wallet.id, currency },
      });

      const balanceAfter = wallet.balance;
      const operatorTransaction = await ctx.operatorMoneyTransaction.create({
        data: {
          amount: new Decimal(amount.toFixed(4)),
          operatorId,
          operatorUserID: player.operatorAccountID,
          balanceAfter,
          balanceBefore,
          operatorOrderID: detail.operatorOrderID,
          type: OperatorGameTransactionType.Deposit,
          orderID: nanoid(),
          playerId,
          walletId: wallet.id,
        },
      });

      return operatorTransaction;
    });
  }

  static async getWalletByUserId(userId: number, currency: string) {
    return this.getWalletByPlayerIdAndCurrency({
      playerId: userId,
      currency,
    });
  }

  static createWallet(input: Prisma.GamePlayerWalletCreateInput) {
    if (!input.operatorId) {
      throw new HTTPException(400, {
        message: "operator is required",
      });
    }
    return prismaClient.gamePlayerWallet.create({
      data: input,
    });
  }

  static updateWallet(id: number, input: Prisma.GamePlayerWalletUpdateInput) {
    return prismaClient.gamePlayerWallet.update({
      where: {
        id,
      },
      data: input,
    });
  }

  static deleteWallet(id: number) {
    return prismaClient.gamePlayerWallet.delete({
      where: {
        id,
      },
    });
  }
}
