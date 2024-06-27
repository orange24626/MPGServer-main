import { OperatorUser, Prisma } from "@prisma/client";
import { prismaClient } from "../utils/prismaClient";
import { z } from "zod";
import {
  OperatorProxyGetRTPQuery,
  OperatorProxyQueryBalance,
  OperatorProxySetManyUserRTP,
  OperatorProxySetUserRTP,
} from "dtos";
import { OperatorService } from "./OperatorService";
import { WalletService } from "./WalletService";
import sql from "utils/db";
import { PgClient, parseQuery } from "utils";

export class OperatorUserService {
  static async getUsers(queries: Record<string, string>, operatorIds: any) {
    const { skip, take, orderBy, condition } = parseQuery(queries, Prisma.GamePlayerScalarFieldEnum);
    console.log({ condition });
    const sqlStr = `SELECT * FROM "public"."OperatorUser" AS "t1" 
            where "t1"."id" in (${condition.id.in.join(",")})
            ORDER BY "t1"."createdAt" DESC 
            LIMIT ${take || 1000} OFFSET ${skip};
      `;

    console.log(sqlStr);
    const { rows } = await PgClient.query(sqlStr);

    return {
      list: rows,
      total: 10,
    };
  }

  static async getUserBalance(input: z.infer<typeof OperatorProxyQueryBalance>) {
    const { currency } = input;
    const gamePlayer = await prismaClient.gamePlayer.findFirst({
      where: {
        operatorAccountID: input.userID,
      },
    });
    if (!gamePlayer) {
      return {
        status: 1301,
        msg: "operator user not found",
        data: "",
      };
    }
    const gamePlayerWallet = await WalletService.getWalletByPlayerIdAndCurrency({
      currency: currency || "BRL",
      playerId: gamePlayer.id,
    });
    if (!gamePlayerWallet) {
      return {
        status: 1301,
        msg: "operator user wallet not found",
        data: "",
      };
    }
    return {
      status: 0,
      msg: "success",
      data: {
        balance: gamePlayerWallet.balance,
        userID: gamePlayer.operatorAccountID,
      },
    };
  }

  static async setUserRTPBatch(input: z.infer<typeof OperatorProxySetManyUserRTP>) {
    let catchId: string[] = [];
    try {
      const { accessKey, rtp, userIDs, sign } = input;
      let uIds = userIDs.split("|").map((id) => id.trim());
      catchId = uIds;

      const operator = await OperatorService.verifySign(accessKey, sign, input);

      await prismaClient.operatorUser.updateMany({
        where: {
          accountID: {
            in: uIds,
          },
          operatorId: operator.id,
        },
        data: {
          rtpLevel: rtp,
        },
      });
      const updatePlayersRlt = await prismaClient.gamePlayer.updateMany({
        where: {
          operatorAccountID: {
            in: uIds,
          },
          operatorId: operator.id,
        },
        data: {
          rtpLevel: rtp,
        },
      });
      return {
        status: 0,
        msg: "success",
        data: {
          success: updatePlayersRlt.count,
        },
      };
    } catch (error: any) {
      return {
        status: 0,
        msg: "",
        data: { fail_ids: catchId, success_count: 0 },
      };
    }
  }

  static async setUserRTP(input: z.infer<typeof OperatorProxySetUserRTP>) {
    try {
      const { accessKey, rtp, userID, sign } = input;
      const operator = await OperatorService.verifySign(accessKey, sign, input);
      let operatorUser = await prismaClient.operatorUser.findFirst({
        where: {
          accountID: userID,
          operatorId: operator.id,
        },
      });
      if (!operatorUser) {
        return {
          status: 1301,
          msg: "operator user not found",
          data: "",
        };
      }
      if (operatorUser && !operatorUser.isTest && input.rtp === 14) {
        return {
          status: 1301,
          msg: "非试玩用户不可设置RTP过高",
          data: "",
        };
      }
      operatorUser = await prismaClient.operatorUser.update({
        where: {
          id: operatorUser.id,
          operatorId: operator.id,
          version: operatorUser.version,
        },
        data: {
          rtpLevel: rtp,
          version: {
            increment: 1,
          },
        },
      });
      const player = await prismaClient.gamePlayer.findFirst({
        where: {
          operatorAccountID: userID,
          operatorId: operator.id,
        },
      });
      if (!player) {
        return {
          status: 1301,
          msg: "operator user not found",
          data: "",
        };
      }
      return {
        status: 0,
        msg: "success",
        data: {
          rtp: operatorUser.rtpLevel,
          userID: operatorUser.accountID,
        },
      };
    } catch (error: any) {
      return {
        status: 1500,
        msg: error.message,
        data: error,
      };
    }
  }

  static async getUserRTP(input: z.infer<typeof OperatorProxyGetRTPQuery>) {
    try {
      const { accessKey, userID, sign } = input;
      const operator = await OperatorService.verifySign(accessKey, sign, input);
      const operatorUser = await prismaClient.operatorUser.findFirst({
        where: {
          accountID: userID,
          operatorId: operator.id,
        },
      });
      if (!operatorUser) {
        return {
          status: 1301,
          msg: "operator user not found",
          data: "",
        };
      }
      return {
        status: 0,
        msg: "success",
        data: {
          rtp: operatorUser?.rtpLevel,
          userID: operatorUser?.accountID,
        },
      };
    } catch (error: any) {
      return {
        status: 1500,
        msg: error.message,
        data: error,
      };
    }
  }

  static async findOrCreateUser(input: Prisma.OperatorUserCreateInput) {
    let user = await prismaClient.operatorUser.findFirst({
      where: {
        OR: [
          {
            email: input.email,
          },
          {
            mobile: input.mobile,
          },
        ],
        operatorId: input.operator.connect?.id,
      },
    });
    if (!user) {
      user = await prismaClient.operatorUser.create({
        data: input,
      });
    }
    return user;
  }

  static async getUser(params: { operatorId: number; accountID: string; username: string }) {
    const { operatorId, accountID, username } = params;
    const [user] = await sql`SELECT "t1"."id", 
      "t1"."accountID", 
      "t1"."gamePlayerId", 
      "t1"."nickname", "t1"."username", 
      "t1"."mobile", "t1"."email", "t1"."password", 
      "t1"."operatorName", "t1"."avatar", "t1"."rtpLevel", 
      "t1"."isTest", "t1"."testingExpired", "t1"."createdAt", 
      "t1"."updatedAt", "t1"."version",
       "t1"."operatorId" FROM "public"."OperatorUser" AS "t1" 
       where "t1"."operatorId" = ${operatorId} and "t1"."accountID" = ${accountID} and "t1"."username" = ${username} LIMIT 1`;

    return user;
  }

  static async getUserByIdKey(idKey: string | number) {
    const [user] = await sql`SELECT "t1"."id", 
      "t1"."accountID", 
      "t1"."gamePlayerId", 
      "t1"."nickname", "t1"."username", 
      "t1"."mobile", "t1"."email", "t1"."password", 
      "t1"."operatorName", "t1"."avatar", "t1"."rtpLevel", 
      "t1"."isTest", "t1"."testingExpired", "t1"."createdAt", 
      "t1"."updatedAt", "t1"."version",
       "t1"."operatorId" FROM "public"."OperatorUser" AS "t1" 
       where "t1"."accountID" = ${idKey} or "t1"."id" = ${idKey} LIMIT 1`;

    return user as OperatorUser | undefined;
  }

  static async getUserByAccountID(accountID: number) {
    const {
      rows: [user],
    } = await PgClient.query<OperatorUser>(`SELECT "t1"."id", 
      "t1"."accountID", 
      "t1"."gamePlayerId", 
      "t1"."nickname", "t1"."username", 
      "t1"."mobile", "t1"."email", "t1"."password", 
      "t1"."operatorName", "t1"."avatar", "t1"."rtpLevel", 
      "t1"."isTest", "t1"."testingExpired", "t1"."createdAt", 
      "t1"."updatedAt", "t1"."version",
       "t1"."operatorId" FROM "public"."OperatorUser" AS "t1" 
       where "t1"."accountID" = '${accountID}' LIMIT 1`);

    return user || null;
  }
}
