import { Game, Operator, OperatorUser, Prisma } from "@prisma/client";
import { parseQuery, prismaClient, getIsoTime, PgClient } from "../utils";
import { HTTPException } from "hono/http-exception";
import { ParsedQs } from "qs";
import { getGameOrigin } from "config";
import { AuthService } from "./AuthService";
import { z } from "zod";
import {
  GetGameUrlParams,
  OperatorProxyPayIn,
  OperatorProxyPayOut,
  OperatorProxyQueryTransaction,
  OperatorProxyQueryTransactions,
} from "dtos";
import { nanoid } from "nanoid";
import { WalletService } from "./WalletService";
import { Decimal } from "@prisma/client/runtime/library";
import { MD5 } from "crypto-js";
import sql from "utils/db";
import { OperatorUserService } from "./OperatorUserService";

export class OperatorService {
  static async getOperatorTransaction(input: z.infer<typeof OperatorProxyQueryTransaction>) {
    const { accessKey, sign, orderID } = input;
    await this.verifySign(accessKey, sign, input);
    const transaction = await prismaClient.operatorMoneyTransaction.findFirst({
      where: {
        operatorOrderID: orderID,
      },
    });
    if (!transaction) {
      return {
        status: 1038,
        msg: "transaction  not found",
        data: "",
      };
    }
    let operatorUsername = "";
    if (transaction?.operatorUserID) {
      const operatorUser = await OperatorUserService.getUserByAccountID(+transaction?.operatorUserID);
      operatorUsername = operatorUser?.username || "";
    }

    return {
      status: 0,
      msg: "",
      data: {
        operatorUserId: transaction.operatorUserID,
        orderID: transaction.operatorOrderID,
        gameOrderId: transaction.orderID,
        operatorUsername,
        type: transaction.type,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        amount: transaction.amount,
        time: transaction.createdAt.getTime(),
      },
    };
  }
  static async verifySign(accessKey: string, sign: string, data: any) {
    console.log("传入的签名=============", JSON.stringify({ sign, data }));
    const { rows } = await PgClient.query<Operator>(`
      SELECT * FROM "public"."Operator" WHERE "Operator"."operatorKey" = '${accessKey}' LIMIT 1`);
    const operator = rows[0];
    if (!operator) {
      throw new HTTPException(401, {
        message: "Invalid operator",
      });
    }
    let orderedKeys = Object.keys(data)
      .filter((key) => key !== "sign")
      .sort();
    let signStr = "";
    for (let key of orderedKeys) {
      signStr += `${key}=${data[key].toString()}&`;
    }
    signStr += `key=${operator?.operatorSecret}`;
    signStr = MD5(signStr).toString();

    console.log("验证的签名=============", signStr);
    if (signStr !== sign) {
      throw new HTTPException(401, {
        message: "Invalid sign",
      });
    }
    return operator;
  }

  static generateSign(input: any, secret: string) {
    console.log("生成的签名=============", input);
    const inputOrdered = Object.keys(input).sort();
    let sign = "";
    for (let key of inputOrdered) {
      sign += `${key}=${input[key]}&`;
    }
    sign += `key=${secret}`;
    sign = MD5(sign).toString();

    return sign;
  }

  static async payOut(input: z.infer<typeof OperatorProxyPayOut>) {
    const { accessKey, userID, amount, sign, currency, all, orderID } = input;
    const operator = await this.verifySign(accessKey, sign, input);
    const player = await prismaClient.gamePlayer.findFirst({
      where: {
        operatorAccountID: userID,
      },
    });
    if (!player) {
      return {
        status: 1031,
        msg: "player user not found",
        data: "",
      };
    }
    const record = await WalletService.deductFundByOperator({
      playerId: player.id,
      amount: +new Decimal(amount).toFixed(2),
      currency,
      detail: {
        operatorId: operator.id,
        operatorOrderID: orderID,
        operatorName: operator.name,
      },
      all: all === 1,
    });

    return {
      status: 0,
      msg: "success",
      data: {
        operatorOrderNo: orderID,
        gameOrderNo: record.orderID,
        amount: all == 1 ? record.amount : record.balanceBefore,
        all,
        balance: record.balanceAfter,
      },
    };
  }

  static async payIn(input: z.infer<typeof OperatorProxyPayIn>) {
    try {
      const { accessKey, userID, amount, sign, currency, orderID } = input;
      const operator = await this.verifySign(accessKey, sign, input);

      const player = await prismaClient.gamePlayer.findFirst({
        where: {
          operatorAccountID: userID,
        },
      });
      if (!player) {
        return {
          status: 1031,
          msg: "player user not found",
          data: "",
        };
      }
      const record = await WalletService.addFundByOperator({
        playerId: player.id,
        amount: +new Decimal(amount).toFixed(2),
        currency,
        detail: {
          operatorId: operator.id,
          operatorOrderID: orderID,
          operatorName: operator.name,
        },
      });

      console.log(`pay-in-${input.userID}`, JSON.stringify(input), JSON.stringify(record));

      return {
        status: 0,
        msg: "success",
        data: {
          operatorOrderNo: orderID,
          gameOrderNo: record.orderID,
          balance: record.balanceAfter,
        },
      };
    } catch (error: any) {
      return {
        status: 1200,
        msg: error.message,
        data: "",
      };
    }
  }
  static async getOperatorTransactions(input: z.infer<typeof OperatorProxyQueryTransactions>) {
    const { accessKey, sign, startedAt, endedAt } = input;
    const operator = await this.verifySign(accessKey, sign, input);
    const transactions = await prismaClient.operatorMoneyTransaction.findMany({
      where: {
        operatorId: operator.id,
        createdAt: {
          gte: getIsoTime(startedAt),
          lte: getIsoTime(endedAt),
          // gte: moment(startedAt).isValid() ? moment(startedAt).toDate() : moment().startOf("day").toDate(),
          // lte: moment(endedAt).isValid() ? moment(endedAt).toDate() : moment().toDate(),
        },
      },
    });

    const total = await prismaClient.operatorMoneyTransaction.count({
      where: {
        operatorId: operator.id,
        createdAt: {
          // gte: moment(startedAt).isValid() ? moment(startedAt).toDate() : moment().startOf("day").toDate(),
          // lte: moment(endedAt).isValid() ? moment(endedAt).toDate() : moment().toDate(),
          gte: getIsoTime(startedAt),
          lte: getIsoTime(endedAt),
        },
      },
    });

    const list = [];
    for (let index = 0; index < transactions.length; index++) {
      const ts = transactions[index];
      let operatorUsername = "";
      if (ts.operatorUserID) {
        const opUser = await prismaClient.operatorUser.findFirst({
          where: {
            accountID: ts.operatorUserID,
          },
        });
        operatorUsername = opUser?.username || "";
      }

      list.push({
        amount: ts.amount,
        gameOrderId: ts.orderID,
        operatorOrderId: ts.operatorOrderID,
        operatorUserId: ts.operatorUserID,
        operatorUsername,
        time: ts.createdAt.getTime(),
      });
    }

    return {
      status: 0,
      msg: "success",
      data: {
        list,
        total,
      },
    };
  }
  static async getOperator(id: number) {
    const {
      rows: [operator],
    } = await PgClient.query<Operator>(`
      SELECT * FROM "public"."Operator" WHERE "Operator"."id" = '${id}' LIMIT 1`);
    return operator || null;
  }

  static createOperator(input: Prisma.OperatorCreateInput) {
    //todo add admin for operator
    return prismaClient.operator.create({
      data: input,
    });
  }

  static updateOperator(
    id: number,
    input: {
      name: any;
      selfOwned: any;
      introduction: any;
      rtpLevel: number;
    },
  ) {
    return prismaClient.operator.update({
      where: {
        id,
      },
      data: input,
    });
  }

  static deleteOperator(id: number) {
    return prismaClient.operator.delete({
      where: {
        id,
      },
    });
  }

  static async getOperators(query: ParsedQs, operatorIds = []) {
    try {
      const { condition, skip, take, orderBy } = parseQuery(query, Prisma.OperatorScalarFieldEnum);
      if (operatorIds.length > 0) {
        condition.id = {
          in: operatorIds,
        };
      }
      const list = await prismaClient.operator.findMany({
        where: condition,
        skip,
        take,
        orderBy,
      });
      const count = await prismaClient.operator.count({
        where: condition,
      });
      return {
        list: list,
        total: count,
      };
    } catch (error: any) {
      console.error(error);
      throw new HTTPException(500, { message: error.message });
    }
  }

  static async getGameUrl(params: z.infer<typeof GetGameUrlParams>) {
    const { gameID, token, accessKey, sign, lang } = params;
    const operator = await OperatorService.verifySign(accessKey, sign, params);
    if (!operator) {
      throw new HTTPException(401, {
        message: "Invalid operatorId",
      });
    }

    const {
      rows: [game],
    } = await PgClient.query<Game>(`
      SELECT * FROM "public"."Game" WHERE "Game"."gameID" = '${gameID}' LIMIT 1`);

    if (!game) {
      throw new HTTPException(404, {
        message: "Invalid gameId",
      });
    }

    const sessions = await AuthService.getOperatorSession(token, operator.id.toString());
    if (sessions.length === 0) {
      throw new HTTPException(401, {
        message: "Invalid operatorUserToken",
      });
    }
    const opUserId = Number(sessions[0].id);
    const { rows } = await PgClient.query<OperatorUser>(`SELECT "t1"."id", 
      "t1"."accountID", 
      "t1"."gamePlayerId", "t1"."nickname", "t1"."username", 
      "t1"."mobile", "t1"."email", "t1"."password", "t1"."operatorName", 
      "t1"."avatar", "t1"."rtpLevel", "t1"."isTest", "t1"."testingExpired", "t1"."createdAt", 
      "t1"."updatedAt", "t1"."version", "t1"."operatorId" FROM "public"."OperatorUser" AS "t1" WHERE ("t1"."id" = '${opUserId}') LIMIT 1`);

    const operatorUser = rows[0];

    if (!operatorUser) {
      throw new HTTPException(401, {
        message: "Invalid operatorUserId",
      });
    }
    let origin = getGameOrigin();
    console.log(
      `https://${origin}/${gameID}/index.html?l=${lang || "pt"}&btt=1&oc=0&iwk=1&ot=${token}&ops=${operator.operatorKey}&l=pt&op=${operatorUser.id}&or=${origin}&__refer=${origin}&__hv=${nanoid()}`,
    );
    return {
      gameUrl: `https://${origin}/${gameID}/index.html?l=${lang || "pt"}&btt=1&oc=0&iwk=1&ot=${token}&ops=${operator.operatorKey}&l=pt&op=${operatorUser.id}&or=${origin}&__refer=${origin}&__hv=${nanoid()}`,
    };
  }

  static async getSelfOwned() {
    const { rows } = await PgClient.query<Operator>(`
      SELECT * FROM "public"."Operator" WHERE "Operator"."selfOwned" = true LIMIT 1`);
    const operator = rows[0];
    return operator;
  }

  static async setOperatorRtp(id: number, rtpLevel: number) {
    let op = await prismaClient.operator.findUnique({
      where: {
        id,
      },
    });
    if (!op) {
      throw new HTTPException(404, {
        message: "Operator not found",
      });
    }
    op = await prismaClient.operator.update({
      where: {
        id,
        version: op.version,
      },
      data: {
        rtpLevel,
        version: {
          increment: 1,
        },
      },
    });
    await prismaClient.operatorUser.updateMany({
      where: {
        operatorId: id,
      },
      data: {
        rtpLevel,
        version: {
          increment: 1,
        },
      },
    });
    await prismaClient.gamePlayer.updateMany({
      where: {
        operatorId: id,
      },
      data: {
        rtpLevel,
        version: {
          increment: 1,
        },
      },
    });
    return op;
  }
}
