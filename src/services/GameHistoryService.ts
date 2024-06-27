import { GameHistory, GameHistoryStatus, Prisma } from "@prisma/client";
import { GameHistoryPostSchema, GameHistoryStaticPostSchema } from "dtos/gameProxy";
import { prismaClient, parseQuery, PgClient } from "utils";
import { z } from "zod";
import { AuthService } from "./AuthService";
import moment from "moment";
import { Decimal } from "@prisma/client/runtime/library";
import { customAlphabet } from "nanoid";
import { ParsedQs } from "qs";
import { OperatorProxyGetGameQuery } from "dtos";
import { OperatorService } from "./OperatorService";
import { HTTPException } from "hono/http-exception";
import sql from "utils/db";
import { GameHistoryFilter } from "dtos/gameHistory";
import { GamePlayerService } from "./GamePlayerService";
import { TableService } from "./TableService";
import { WalletService } from "./WalletService";

const alphabet = "0123456789";
const nanoid = customAlphabet(alphabet, 18);

const LINEMAP = { 68: 5, 98: 10, 126: 5, 1543462: 10, 1695365: 5 };

export class GameHistoryService {
  static delete(historyId: string) {
    return prismaClient.gameHistory.delete({
      where: {
        historyId: BigInt(historyId),
      },
    });
  }
  static async getGameOperatorRecords(input: z.infer<typeof OperatorProxyGetGameQuery>) {
    let { userID, gameID, accessKey, startedAt, endedAt, page, pageSize, gameOrderID, sort, sign } = input;
    const operator = await OperatorService.verifySign(accessKey, sign, input);

    let filter = {};

    if (userID) {
      const user = await prismaClient.operatorUser.findUnique({
        where: {
          accountID: userID,
        },
      });
      if (!user) {
        throw new HTTPException(404, {
          message: "Invalid userID",
        });
      }
      filter = {
        ...(filter || {}),
        operatorAccountID: userID,
      };
    }

    if (gameID) {
      filter = {
        ...(filter || {}),
        gameID,
      };
    }

    filter = {
      ...(filter || {}),
      updatedAt: {
        gte: startedAt,
        lte: endedAt,
      },
    };

    if (gameOrderID) {
      filter = {
        ...filter,
        historyId: gameOrderID,
      };
    }
    if (operator) {
      filter = {
        ...filter,
        operatorId: operator.id,
      };
    }

    const { list, total } = await this.findMany({
      filter,
      offset: ((page || 1) - 1) * (pageSize || 20),
      limit: pageSize || 20,
      sort: {
        field: "updatedAt",
        order: sort === -1 ? "desc" : "asc",
      },
      searchFields: ["historyId"],
    });

    return {
      status: 0,
      msg: "success",
      data: {
        list: list.map((record: any) => ({
          gameID: record.gameID,
          operatorUserName: record.operatorUsername,
          operatorUserId: record.operatorAccountID,
          betAmount: new Decimal(record.totalBet).toFixed(2),
          winAmount: new Decimal(record.profit).add(record.totalBet).toFixed(2),
          orderID: record.historyId.toString(),
          happenedAt: record.createdAt,
          id: record.id,
        })),
        total: +total,
        page: page || 1,
        pageSize: pageSize || 20,
      },
    };
  }

  static async deleteById(id: number) {
    if (!id) return;
    return prismaClient.gameHistory.delete({
      where: {
        id,
      },
    });
  }

  static async create(input: Omit<Prisma.GameHistoryCreateInput, "historyId">) {
    const id = input.playerId;
    const tableName = await TableService.getGameHistoryTable();

    const user = await GamePlayerService.getGamePlayerById(id);

    const historyId = BigInt(Date.now() + (user?.id || 0) + Number(nanoid()));
    const currency = input.currency || "BRL";
    const fscc = input.fscc || 0;
    const mgcc = input.mgcc || 0;
    const ge = input.ge || 0;
    const totalBet = input.totalBet || 0;
    const operatorId = input.operatorId || 0;
    const playerId = input.playerId || 0;
    const profit = input.profit || 0;
    const moneyPool = input.moneyPool || 0;
    const gameID = input.gameID || 0;

    await PgClient.query(`
    INSERT INTO "public"."${tableName}"
     (
      "historyId",
      "currency",
      "fscc",
      "mgcc",
      "ge",
      "gameID",
      "totalBet",
      "operatorId",
      "playerId",
      "profit",
      "moneyPool",
      "detail",
      "isTesting",
      "operatorUsername",
      "operatorAccountID",
      "status"
    ) VALUES (
      '${historyId.toString()}',
      '${currency}',
      '${fscc}',
      '${mgcc}',
     '${ge.toString()}',
      '${gameID}',
      '${totalBet.toString()}',
      '${operatorId}',
      '${playerId}',
      '${profit.toString()}',
      '${moneyPool.toString()}',
      '${[]}',
      '${user?.isTest}',
      '${user?.operatorUsername}',
      '${user?.operatorAccountID}',
      CAST('${GameHistoryStatus.Ready.toString()}'::text AS "public"."GameHistoryStatus"))
      RETURNING "public"."${tableName}"."id"`);

    return this.getByHistoryId(historyId);
  }

  static async createById(input: Prisma.GameHistoryCreateInput, balanceBefore: Decimal) {
    const id = input.playerId;
    const user = await GamePlayerService.getGamePlayerById(id);

    const historyId = input.historyId ? input.historyId : (Date.now() + Number(id) + Number(nanoid())).toString();
    const currency = input.currency || "BRL";
    const fscc = input.fscc || 0;
    const mgcc = input.mgcc || 0;
    const ge = input.ge || 0;
    const totalBet = input.totalBet || 0;
    const operatorId = input.operatorId || 0;
    const playerId = input.playerId || 0;
    const profit = input.profit || 0;
    const moneyPool = input.moneyPool || 0;
    const gameID = input.gameID || 0;

    const tableName = await TableService.getGameHistoryTable();

    const sqlStr = `
      INSERT INTO "public"."${tableName}"
      (
        "historyId",
        "currency",
        "fscc",
        "mgcc",
        "ge",
        "gameID",
        "totalBet",
        "operatorId",
        "playerId",
        "profit",
        "moneyPool",
        "detail",
        "isTesting",
        "operatorUsername",
        "operatorAccountID",
        "status",
        "balanceBefore"
    ) VALUES (
        '${historyId.toString()}',
        '${currency}',
        '${fscc}',
        '${mgcc}',
        '${JSON.stringify(ge)}'::jsonb,
        '${gameID}',
        '${totalBet.toString()}',
        '${operatorId}',
        '${playerId}',
        '${profit.toString()}',
        '${JSON.stringify(moneyPool)}'::jsonb,
        '[]'::jsonb,
        ${user?.isTest},
        '${user?.operatorUsername || ""}',
        '${user?.operatorAccountID}',
        CAST('${GameHistoryStatus.Ready.toString()}'::text AS "public"."GameHistoryStatus"),
        '${new Decimal(balanceBefore).toFixed(4) || "0"}'
      ) RETURNING "public"."${tableName}"."id"`;

    console.log("createById sqlStr==================", sqlStr);

    try {
      const rlt = await PgClient.query(sqlStr);
      return rlt;
    } catch (error: any) {
      console.error("Error creating game history:", JSON.stringify(error));
      console.error("Error creating game history:", JSON.stringify(error.message));
    }
  }

  static async getById(id: number) {
    const records = await this.findMany({
      filter: {
        orderId: id,
      },
      offset: 0,
      limit: 1,
      sort: {
        field: "createdAt",
        order: "desc",
      },
    });

    return records.list[0];
  }

  static getByHistoryId = async (historyId: bigint, day?: string): Promise<GameHistory | null> => {
    if (moment.utc(day).isBefore(moment().utc().subtract(2, "d"))) {
      return null;
    }
    const tableName = await TableService.getGameHistoryTable(day);
    const records = await PgClient.query<GameHistory>(`SELECT 
    "t1"."id", 
    "t1"."historyId", 
    "t1"."currency", 
    "t1"."fscc", 
    "t1"."mgcc", 
    "t1"."ge", 
    "t1"."gameID", 
    "t1"."totalBet", 
    "t1"."operatorId", 
    "t1"."playerId", 
    "t1"."profit", 
    "t1"."moneyPoolId", 
    "t1"."balanceBefore", 
    "t1"."moneyPool", 
    "t1"."detail", 
    "t1"."isTesting", 
    "t1"."operatorUsername", 
    "t1"."operatorAccountID", 
    "t1"."status"::text, 
    "t1"."createdAt", 
    "t1"."updatedAt", 
    "t1"."version" 
    FROM "public"."${tableName}" AS "t1" 
    WHERE "t1"."historyId" = ${historyId.toString()} LIMIT 1`);
    if (records.rows.length === 0) {
      return this.getByHistoryId(historyId, moment.utc(day).subtract(1, "d").format("YYYYMMDD"));
    }
    return records.rows[0] as GameHistory;
  };

  static updateForFreeMode(record: GameHistory) {
    if (record.ge?.toString() !== [1, 4, 11].toString()) {
      return prismaClient.gameHistory.update({
        where: {
          id: record.id,
          version: record.version,
        },
        data: {
          ge: [1, 4, 11],
          version: {
            increment: 1,
          },
        },
      });
    }
    return record;
  }

  static async updateProfit(record: GameHistory, profit: Decimal) {
    const tableName = await TableService.getGameHistoryTable();
    await sql`UPDATE "public"."${tableName}" SET 
    "profit" = ${profit.toString()}, "status" = CAST(${GameHistoryStatus.Pending}::text AS "public"."GameHistoryStatus"), 
    "version" = ("public"."${tableName}"."version" + ${(record.version + 1).toString()}), 
    "updatedAt" = CURRENT_TIMESTAMP WHERE ("public"."${tableName}"."id" = ${record.id} AND "public"."${tableName}"."version" = ${record.version.toString()});`;

    return this.getByHistoryId(record.historyId);
  }

  static async updateProfitById(historyId: string, profit: string) {
    const tableName = await TableService.getGameHistoryTable();
    const sql = `
    UPDATE "public"."${tableName}" SET 
      "profit"='${new Decimal(profit).toFixed(4)}',  "version"="version"+1,
      "updatedAt"=now() 
      WHERE ("public"."${tableName}"."historyId"='${historyId}') returning "id", "historyId", "profit", "version";
    `;
    console.log("updateProfitById sql==================", sql);
    return await PgClient.query(sql);
  }

  static async pushDetail(
    historyId: bigint,
    detail: any,
    status = GameHistoryStatus.Success as GameHistoryStatus,
    balanceAfter?: number,
  ) {
    const record = await this.getByHistoryId(historyId);
    if (!record) {
      console.log("更新游戏详情的时候,游戏记录没有找到, historyId:", historyId);
      throw new Error("Game history not found");
    }

    if (!Array.isArray(detail)) {
      console.log("detail不是数组啊..........", JSON.stringify(detail));
      throw new Error("detail is not an array");
    }
    //deep copy
    const originDetail = JSON.parse(JSON.stringify(detail));

    let ge: number[] | null = record?.ge ? (record?.ge as number[]) : [];

    for (const d of detail) {
      ge = d?.gd?.ge ? ge.concat(d?.gd?.ge) : ge;
    }

    ge = Array.from(new Set(ge.filter((item) => item && !isNaN(item))?.map((item) => Number(item)))).sort(
      (a, b) => a - b,
    );

    ge = ge && ge.length ? ge : null;

    const day = moment.utc(moment(record.createdAt).format("YYYY-MM-DDTHH:mm:ss")).format("YYYYMMDD");

    const tableName = await TableService.getGameHistoryTable(day);

    if (Number.isNaN(Number(balanceAfter))) {
      console.log("balanceAfter is not a number", balanceAfter);
      throw new Error("balanceAfter is not a number");
    }

    const recordProfit = new Decimal(balanceAfter || 0).minus(record?.balanceBefore || "0");
    console.log(
      "金额前后的利润差=============================================",
      JSON.stringify({
        recordProfit,
        balanceAfter,
        balanceBefore: record.balanceBefore,
      }),
    );
    const recordBet = new Decimal(record.totalBet || 0);
    console.log("记录的投注额=============================================", recordBet);
    let totalWin = new Decimal(0);

    if (record.gameID === 1695365) {
      for (let index = 0; index < detail.length; index++) {
        const item = detail[index];
        const ctw = item.gd.ctw;
        totalWin = totalWin.add(ctw);
      }
    } else {
      const aw = detail.sort((a: { gd: any }, b: { gd: any }) => b.gd.aw - a.gd.aw)[0].gd.aw;
      totalWin = new Decimal(aw);
    }

    const { ml, cs, fb } = detail[0].gd;

    const lines = LINEMAP[record.gameID as 68 | 98 | 126 | 1543462 | 1695365];

    //or use record.totalBet
    const totalBet = new Decimal(ml * cs * lines * (Number(fb) === 2 && record.gameID === 1695365 ? 5 : 1));

    const profit = totalWin.minus(recordBet);
    ``;

    console.log("从detail查出来的-totalWin==============", totalWin);
    console.log("从detail查出来的-totalBet==============", totalBet);
    console.log("从detail查出来的-profit================", profit);

    try {
      const updateStr = `UPDATE "public"."${tableName}" 
      SET detail= '${JSON.stringify(originDetail)}'::jsonb, 
      ge='[${ge}]'::jsonb, 
      status= CAST('${status.toString()}'::text AS "public"."GameHistoryStatus"), 
      "updatedAt"= now(),
      profit='${profit.toFixed(4)}',
      "balanceAfter"='${new Decimal(balanceAfter || 0).toFixed(4)}',
      version= version + 1
      WHERE ("public"."${tableName}"."id" = '${record.id}' and version='${record.version}');`;

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
    if (status === GameHistoryStatus.Success) {
      //todo 这里有个currency的问题
      const wallet = await WalletService.getPlayerWallet(record.playerId);
      if (!wallet) {
        console.log("玩家钱包不存在, playerID:", record.playerId);
        throw new Error("Player wallet not found");
      }
      await WalletService.updateWalletStatics({
        totalPlay: recordBet,
        totalWin: totalWin,
        totalOut: recordBet,
        totalIn: totalWin,
        walletId: wallet.id,
      });
    }

    return "success";
  }

  static async getGamePlayerHistory(params: z.infer<typeof GameHistoryPostSchema>) {
    const { gid, atk, bn, rc, dtf, dtt } = params;
    const page = +bn;
    const pageSize = +rc;
    const now = moment(+dtt).toISOString();
    const oneMinuteAgo = moment(+dtt).subtract(1, "m").toISOString();
    const from = moment(+dtf).toISOString();
    const session = await AuthService.verifyGameToken(atk);

    const tableName = await TableService.getGameHistoryTable();

    const sql = `
    SELECT "t1"."id", "t1"."historyId", 
    "t1"."currency", "t1"."fscc", 
    "t1"."mgcc", "t1"."ge", 
    "t1"."gameID", "t1"."totalBet",
     "t1"."operatorId", "t1"."playerId", 
     "t1"."profit", "t1"."moneyPoolId",
      "t1"."moneyPool", "t1"."detail",
       "t1"."isTesting", "t1"."operatorUsername",
        "t1"."operatorAccountID", "t1"."status"::text, 
        "t1"."updatedAt", "t1"."version" 
        FROM "public"."${tableName}" AS "t1" 
        WHERE (
          "t1"."playerId" = '${Number(session.id)}' 
        AND "t1"."gameID" = '${+gid}' 
        AND "t1"."updatedAt" >= '${from}' 
        AND "t1"."updatedAt" <= '${now}' 
        AND "t1"."status" = '${GameHistoryStatus.Success.toString()}'
        AND "t1"."updatedAt" <= '${oneMinuteAgo}'
      ) 
        ORDER BY "t1"."updatedAt" DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `;

    const result = await PgClient.query<GameHistory>(sql);

    const rows = result.rows;
    return rows;
  }

  static async getGamePlayerHistoryStatic(params: z.infer<typeof GameHistoryStaticPostSchema>) {
    const { gid, atk, dtf, dtt } = params;
    const now = moment(+dtt).toISOString();
    const from = moment(+dtf).toISOString();
    const oneMinuteAgo = moment(+dtt).subtract(1, "m").toISOString();
    const session = await AuthService.verifyGameToken(atk);
    const tableName = await TableService.getGameHistoryTable();
    const result1 =
      await PgClient.query(`SELECT "t1"."historyId", "t1"."createdAt" FROM "public"."${tableName}" AS "t1" 
      WHERE ("t1"."playerId" = ${Number(session.id)} AND "t1"."gameID" = ${+gid}) ORDER BY "t1"."createdAt" DESC LIMIT 1`);

    const result2 =
      await PgClient.query(`SELECT COUNT(*) as count, SUM("totalBet") as tb, SUM("profit") as profit FROM (SELECT "public"."${tableName}"."id", "public"."${tableName}"."totalBet", "public"."${tableName}"."profit" FROM "public"."${tableName}" 
        WHERE (
          "public"."${tableName}"."playerId" = '${Number(session.id)}'
          AND "public"."${tableName}"."gameID" = '${+gid}'
          AND "public"."${tableName}"."createdAt" >= '${from}'
          AND "public"."${tableName}"."createdAt" <= '${now}'
          AND "public"."${tableName}"."status" = '${GameHistoryStatus.Success.toString()}'
          AND "public"."${tableName}"."updatedAt" <= '${oneMinuteAgo}'
        )
         ORDER BY "public"."${tableName}"."createdAt" DESC OFFSET 0) AS "sub"`);

    return {
      result: result2.rows[0],
      lastRecord: result1.rows[0],
    };
  }

  static getFirstHistoryByUserId = async (
    userId: number,
    gameID: number,
    day?: string,
  ): Promise<GameHistory | null> => {
    //7天内没有记录
    if (moment.utc(day).isBefore(moment.utc().subtract(2, "d"))) {
      return null;
    }
    const tableName = await TableService.getGameHistoryTable(day);
    const result = await PgClient.query(`
    SELECT
    "t1"."id",
    "t1"."historyId",
    "t1"."currency",
    "t1"."fscc",
    "t1"."mgcc",
    "t1"."ge",
    "t1"."gameID",
    "t1"."totalBet",
    "t1"."operatorId",
    "t1"."playerId",
    "t1"."profit",
    "t1"."moneyPoolId",
    "t1"."moneyPool",
    "t1"."detail",
    "t1"."isTesting",
    "t1"."operatorUsername",
    "t1"."operatorAccountID",
    "t1"."status"::text,
    "t1"."createdAt",
    "t1"."updatedAt",
    "t1"."version"
    FROM
    "public"."${tableName}" AS "t1"
    WHERE
    "t1"."playerId" = '${userId}' AND
    "t1"."gameID" = '${gameID}'
    ORDER BY
    "t1"."createdAt" DESC
    LIMIT 1
    `);

    if (!result.rows[0]) {
      return this.getFirstHistoryByUserId(userId, gameID, moment.utc(day).subtract(1, "d").format("YYYYMMDD"));
    }

    return result.rows[0] as GameHistory;
  };

  static async getFirstHistoryDetailByUserID(userId: number, gameID: number) {
    const tableName = await TableService.getGameHistoryTable();
    const result = await PgClient.query(`
    SELECT
    "t1"."detail"
    FROM
    "public"."${tableName}" AS "t1"
    WHERE
    "t1"."playerId" = '${userId}' AND
    "t1"."gameID" = '${gameID}'
    ORDER BY
    "t1"."createdAt" DESC
    LIMIT 1
    `);
    const detail = result?.rows[0]?.detail;

    return detail || [];
  }

  static async getList(query: ParsedQs, operatorIds: number[]) {
    try {
      const { condition, skip, take, orderBy } = parseQuery(query, Prisma.GameHistoryScalarFieldEnum, ["historyId"]);
      const data = await this.findMany({
        filter: condition,
        offset: skip,
        limit: take,
        sort: Object.keys(orderBy).length
          ? { field: Object.keys(orderBy)[0], order: orderBy[Object.keys(orderBy as any)[0] as any] }
          : {
              field: "createdAt",
              order: "DESC",
            },
        searchFields: ["historyId"],
      });
      return {
        list: data?.list || [],
        total: data?.total || 0,
      };
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  static createGameHistory(input: Prisma.GameHistoryCreateInput) {
    //todo add admin for GameHistory
    return prismaClient.gameHistory.create({
      data: input,
    });
  }

  static updateGameHistory(id: number, input: Prisma.GameHistoryUpdateInput) {
    return prismaClient.gameHistory.update({
      where: {
        id,
      },
      data: input,
    });
  }

  static deleteGameHistory(id: number) {
    return prismaClient.gameHistory.delete({
      where: {
        id,
      },
    });
  }
  static async pushDetailDouble(historyId: bigint, detail: any) {
    const record = await prismaClient.gameHistory.findUnique({
      where: {
        historyId,
      },
    });

    if (!record) {
      throw new Error("Game history not found");
    }

    try {
      let strtemp = JSON.stringify([detail]);
      return await prismaClient.gameHistory.update({
        where: {
          historyId,
          version: record.version,
        },
        data: {
          detail: strtemp,
          //ge,
        },
      });
    } catch (error) {
      // 处理异常
      console.error("Error updating game history:", error);
      console.log(
        `record11: ${JSON.stringify(detail, (key, value) => (typeof value === "bigint" ? value.toString() : value))}`,
      );

      // 返回适当的错误信息或执行其他操作
      throw error; // 抛出异常以便上层处理
    }
  }

  static findOne = async (params: {
    filter: GameHistoryFilter;
    day?: string;
    sort?: { field: string; order: "ASC" | "DESC" };
    limitDays?: number;
  }): Promise<any> => {
    let {
      filter,
      day,
      sort = {
        field: "createdAt",
        order: "DESC",
      },
      limitDays,
    } = params;

    const { field, order } = sort;

    const tableName = TableService.getGameHistoryTable();

    let whereStr = ``;

    if (filter.isTesting !== undefined) {
      whereStr += `"t1"."isTesting" = ${filter.isTesting}`;
    }

    if (filter.status) {
      whereStr += `"t1"."status" = ${filter.status}`;
    }

    if (filter.gameID) {
      whereStr += `"t1"."gameID" = ${filter.gameID}`;
    }

    if (filter.historyId) {
      whereStr += `"t1"."historyId" = ${filter.historyId.toString}`;
    }

    if (filter.operatorId) {
      whereStr += `"t1"."operatorId" = ${filter.operatorId}`;
    }

    let sqlStr = `SELECT "t1"."id", "t1"."historyId",
    "t1"."currency", "t1"."gameID",
    "t1"."moneyPool", "t1"."profit",
    "t1"."totalBet", "t1"."isTesting",
    "t1"."createdAt", "t1"."updatedAt",
    "t1"."playerId", "t1"."operatorId",
    "t1"."operatorAccountID",
    "t1"."operatorUsername" FROM "public"."${tableName}" AS "t1"`;

    if (whereStr) {
      whereStr += ` WHERE (${whereStr})`;
    }

    sqlStr += ` ORDER BY "t1"."${field}" ${order} LIMIT 1`;

    const records = await sql`${sqlStr}`;
    const record = records[0];

    if (record) {
      return record;
    }

    if (limitDays && limitDays !== null && limitDays !== undefined && limitDays > 0) {
      limitDays--;
    }

    if (limitDays === 0) {
      return record || null;
    }

    const yesterday = moment.utc(day).subtract(1, "day").format("YYYYMMDD");

    const checkYesterDayTableExists = await PgClient.query(
      `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'GameHistory_${yesterday}');`,
    );

    if (!checkYesterDayTableExists.rows[0].exists) {
      return record || null;
    }
    return this.findOne({ filter, day: yesterday, sort, limitDays });
  };

  static findMany = async (params: {
    filter: GameHistoryFilter;
    offset: number;
    limit: number;
    sort: {
      field: string;
      order: "asc" | "desc";
    };
    day?: string;
    searchFields?: string[];
    lastRecords?: any[];
    allTotal?: number;
  }): Promise<any> => {
    try {
      let {
        filter,
        offset = 0,
        limit = 50,
        sort = {
          field: "updatedAt",
          order: "desc",
        },
      } = params;

      const { field, order } = sort;
      let whereStr = ``;

      if (filter.isTesting !== undefined) {
        whereStr += `"isTesting" = '${filter.isTesting}' AND `;
      }

      if (filter.status) {
        whereStr += `"status" = '${filter.status}' AND `;
      }

      if (filter.gameID) {
        whereStr += `"gameID" = '${filter.gameID}' AND`;
      }

      if (filter.gameId) {
        const game = await prismaClient.game.findUnique({
          where: {
            id: filter.gameId,
          },
        });
        whereStr += `"gameID" = '${game?.gameID}' AND`;
      }

      if (filter.historyId) {
        whereStr += `"historyId" = '${filter.historyId.toString()}' AND`;
      }

      if (filter.orderId) {
        whereStr += `"id" = '${filter.orderId}' AND`;
      }

      if (filter.operatorId) {
        whereStr += `"operatorId" = '${filter.operatorId}' AND`;
      }

      if (filter.updatedAt && filter.updatedAt?.gte && moment(filter.updatedAt?.gte).isValid()) {
        whereStr += `"updatedAt" >= '${moment(filter.updatedAt?.gte).toISOString()}' AND`;
        filter = {
          ...filter,
          updatedAt: {
            ...filter.updatedAt,
            gte: moment(filter.updatedAt?.gte).toISOString(),
          },
        };
      }

      if (filter.updatedAt && filter.updatedAt?.gte && moment(Number(filter.updatedAt?.gte)).isValid()) {
        whereStr += `"updatedAt" >= '${moment(Number(filter.updatedAt?.gte)).toISOString()}' AND`;
        filter = {
          ...filter,
          updatedAt: {
            ...filter.updatedAt,
            gte: moment(Number(filter.updatedAt?.gte)).toISOString(),
          },
        };
      }
      if (filter.updatedAt && filter.updatedAt?.lte && moment(filter.updatedAt?.lte).isValid()) {
        whereStr += `"updatedAt" <= '${moment(filter.updatedAt?.lte).toISOString()}' AND`;
        filter = {
          ...filter,
          updatedAt: {
            ...filter.updatedAt,
            lte: moment(filter.updatedAt?.lte).toISOString(),
          },
        };
      }

      if (filter.updatedAt && filter.updatedAt?.lte && moment(Number(filter.updatedAt?.lte)).isValid()) {
        whereStr += `"updatedAt" <= '${moment(Number(filter.updatedAt?.lte)).toISOString()}' AND`;
        filter = {
          ...filter,
          updatedAt: {
            ...filter.updatedAt,
            lte: moment.utc(Number(filter.updatedAt?.lte)).toISOString(),
          },
        };
      }

      if (filter.createdAt && filter.createdAt?.gte && moment(filter.createdAt?.gte).isValid()) {
        whereStr += `"createdAt" >= '${moment.utc(filter.createdAt?.gte).toISOString()}' AND`;
        filter = {
          ...filter,
          createdAt: {
            ...filter.createdAt,
            gte: moment.utc(filter.createdAt?.gte).toISOString(),
          },
        };
      }

      if (filter.createdAt && filter.createdAt?.gte && moment(Number(filter.createdAt?.gte)).isValid()) {
        whereStr += `"createdAt" >= '${moment.utc(Number(filter.createdAt?.gte)).toISOString()}' AND`;
        filter = {
          ...filter,
          createdAt: {
            ...filter.createdAt,
            gte: moment.utc(Number(filter.createdAt?.gte)).toISOString(),
          },
        };
      }

      if (filter.createdAt && filter.createdAt?.lte && moment(filter.createdAt?.lte).isValid()) {
        whereStr += `"createdAt" <= '${moment.utc(filter.createdAt?.lte).toISOString()}' AND`;
        filter = {
          ...filter,
          createdAt: {
            ...filter.createdAt,
            lte: moment.utc(filter.createdAt?.lte).toISOString(),
          },
        };
      }

      if (filter.createdAt && filter.createdAt?.lte && moment(Number(filter.createdAt?.lte)).isValid()) {
        whereStr += `"createdAt" <= '${moment.utc(Number(filter.createdAt?.lte)).toISOString()}' AND`;
        filter = {
          ...filter,
          createdAt: {
            ...filter.createdAt,
            lte: moment.utc(Number(filter.createdAt?.lte)).toISOString(),
          },
        };
      }

      if (filter.operatorAccountID) {
        //模糊查找
        whereStr += `"operatorAccountID" LIKE '%${filter.operatorAccountID}%' AND`;
      }

      if (filter.id?.in && Array.isArray(filter.id?.in) && filter.id?.in.length > 0) {
        whereStr += `"id" IN (${filter.id?.in.join(",")}) AND`;
      }

      let day = moment.utc().format("YYYYMMDD");

      let tableNames: string[] = [];
      let checkedBeginDay = moment.utc().subtract(7, "days").format("YYYYMMDD");
      let checkedEndDay = moment.utc().add(1, "days").format("YYYYMMDD");

      if (filter.createdAt && filter.createdAt?.gte) {
        checkedBeginDay = moment.utc(filter.createdAt?.gte).format("YYYYMMDD");
      }

      if (filter.createdAt && filter.createdAt?.lte) {
        checkedEndDay = moment.utc(filter.createdAt?.lte).format("YYYYMMDD");
      }

      if (filter.updatedAt && filter.updatedAt?.gte) {
        checkedBeginDay = moment.utc(filter.updatedAt?.gte).format("YYYYMMDD");
      }

      if (filter.updatedAt && filter.updatedAt?.lte) {
        checkedEndDay = moment.utc(filter.updatedAt?.lte).format("YYYYMMDD");
      }

      const checkedDays: string[] = [];

      while (Number(checkedBeginDay) <= Number(checkedEndDay)) {
        checkedDays.push(checkedBeginDay);
        checkedBeginDay = moment.utc(checkedBeginDay).add(1, "day").format("YYYYMMDD");
      }

      tableNames = checkedDays.map((day) => `GameHistory_${day}`);

      let allUnionSql = "";
      const selectedStr = `
      id, 
      "historyId", profit, 
      "updatedAt","createdAt", 
      status, "gameID", "totalBet", 
      "currency", "fscc", "mgcc", "ge", 
      "operatorId", "playerId", "moneyPoolId", 
      "moneyPool","isTesting", "detail",
      "operatorUsername", "operatorAccountID",
      "balanceBefore", "balanceAfter","version"
      `;

      for (let index = 0; index < tableNames.length; index++) {
        const tableName = tableNames[index];
        const yesterdayTableExistResult = await PgClient.query(
          `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '${tableName}');`,
        );
        const tableExist = yesterdayTableExistResult.rows[0]?.exists;

        if (!tableExist) {
          continue;
        }
        let sqlStr = `SELECT ${selectedStr}  FROM "public"."${tableName}"`;

        if (whereStr.length > 0) {
          sqlStr += ` WHERE (${whereStr} "status" = '${GameHistoryStatus.Success}')`;
        } else {
          sqlStr += ` WHERE "status" = '${GameHistoryStatus.Success}'`;
        }

        allUnionSql += `
          ${sqlStr}

           UNION ALL 

        `;
      }

      const tableName = "GameHistory";
      let sqlStr = `SELECT ${selectedStr} FROM "public"."${tableName}"`;

      if (whereStr.length > 0) {
        sqlStr += ` WHERE (${whereStr} "status" = '${GameHistoryStatus.Success}')`;
      } else {
        sqlStr += ` WHERE "status" = '${GameHistoryStatus.Success}'`;
      }

      allUnionSql += `${sqlStr}`;

      //group by
      let allSql = `
      SELECT ${selectedStr} FROM (${allUnionSql}) as t1
      `;
      let countSql = `
      SELECT count(*) as count FROM (${allUnionSql})
      `;

      allSql += ` ORDER BY "${field}" ${order} LIMIT ${limit} OFFSET ${offset};`;

      const result = await PgClient.query(allSql);
      const countResult = await PgClient.query(countSql);

      return {
        list: result.rows.map((item: any) => {
          return {
            ...item,
            createdAt: moment.utc(moment(item.createdAt).format("YYYY-MM-DDTHH:mm:ss")).toDate(),
            updatedAt: moment.utc(moment(item.updatedAt).format("YYYY-MM-DDTHH:mm:ss")).toDate(),
          };
        }),
        total: +countResult.rows[0]?.count,
      };
    } catch (error: any) {
      console.log("Error finding many game history:", JSON.stringify(error));
      console.log("Error finding many game history:", error);
      console.log("Error finding many game history:", JSON.stringify(error.message));
      throw error;
    }
  };

  static getPlayerStatics = async (params: {
    filter: GameHistoryFilter;
    offset: number;
    limit: number;
    sort: {
      field: string;
      order: "asc" | "desc";
    };
    day?: string;
    searchFields?: string[];
    lastRecords?: any[];
    allTotal?: number;
  }): Promise<any> => {
    try {
      let {
        filter,
        offset = 0,
        limit = 50,
        sort = {
          field: "profit",
          order: "desc",
        },
      } = params;

      const { field, order } = sort;
      let whereStr = ``;

      console.log("filter====================1", filter);

      if (filter.isTesting !== undefined) {
        whereStr += `"isTesting" = '${filter.isTesting}' AND `;
      }

      if (filter.status) {
        whereStr += `"status" = '${filter.status}' AND `;
      }

      if (filter.gameID) {
        whereStr += `"gameID" = '${filter.gameID}' AND`;
      }

      if (filter.gameId) {
        const game = await prismaClient.game.findUnique({
          where: {
            id: filter.gameId,
          },
        });
        whereStr += `"gameID" = '${game?.gameID}' AND`;
      }

      if (filter.historyId) {
        whereStr += `"historyId" = '${filter.historyId.toString()}' AND`;
      }

      if (filter.operatorId) {
        whereStr += `"operatorId" = '${filter.operatorId}' AND`;
      }

      if (filter.updatedAt && filter.updatedAt?.gte && moment(filter.updatedAt?.gte).isValid()) {
        whereStr += `"updatedAt" >= '${moment(filter.updatedAt?.gte).toISOString()}' AND`;
        filter = {
          ...filter,
          updatedAt: {
            ...filter.updatedAt,
            gte: moment(filter.updatedAt?.gte).toISOString(),
          },
        };
      }

      if (filter.updatedAt && filter.updatedAt?.gte && moment(Number(filter.updatedAt?.gte)).isValid()) {
        whereStr += `"updatedAt" >= '${moment(Number(filter.updatedAt?.gte)).toISOString()}' AND`;
        filter = {
          ...filter,
          updatedAt: {
            ...filter.updatedAt,
            gte: moment(Number(filter.updatedAt?.gte)).toISOString(),
          },
        };
      }
      if (filter.updatedAt && filter.updatedAt?.lte && moment(filter.updatedAt?.lte).isValid()) {
        whereStr += `"updatedAt" <= '${moment(filter.updatedAt?.lte).toISOString()}' AND`;
        filter = {
          ...filter,
          updatedAt: {
            ...filter.updatedAt,
            lte: moment(filter.updatedAt?.lte).toISOString(),
          },
        };
      }

      if (filter.updatedAt && filter.updatedAt?.lte && moment(Number(filter.updatedAt?.lte)).isValid()) {
        whereStr += `"updatedAt" <= '${moment(Number(filter.updatedAt?.lte)).toISOString()}' AND`;
        filter = {
          ...filter,
          updatedAt: {
            ...filter.updatedAt,
            lte: moment.utc(Number(filter.updatedAt?.lte)).toISOString(),
          },
        };
      }

      if (filter.createdAt && filter.createdAt?.gte && moment(filter.createdAt?.gte).isValid()) {
        whereStr += `"createdAt" >= '${moment.utc(filter.createdAt?.gte).toISOString()}' AND`;
        filter = {
          ...filter,
          createdAt: {
            ...filter.createdAt,
            gte: moment.utc(filter.createdAt?.gte).toISOString(),
          },
        };
      }

      if (filter.createdAt && filter.createdAt?.gte && moment(Number(filter.createdAt?.gte)).isValid()) {
        whereStr += `"createdAt" >= '${moment.utc(Number(filter.createdAt?.gte)).toISOString()}' AND`;
        filter = {
          ...filter,
          createdAt: {
            ...filter.createdAt,
            gte: moment.utc(Number(filter.createdAt?.gte)).toISOString(),
          },
        };
      }

      if (filter.createdAt && filter.createdAt?.lte && moment(filter.createdAt?.lte).isValid()) {
        whereStr += `"createdAt" <= '${moment.utc(filter.createdAt?.lte).toISOString()}' AND`;
        filter = {
          ...filter,
          createdAt: {
            ...filter.createdAt,
            lte: moment.utc(filter.createdAt?.lte).toISOString(),
          },
        };
      }

      if (filter.createdAt && filter.createdAt?.lte && moment(Number(filter.createdAt?.lte)).isValid()) {
        whereStr += `"createdAt" <= '${moment.utc(Number(filter.createdAt?.lte)).toISOString()}' AND`;
        filter = {
          ...filter,
          createdAt: {
            ...filter.createdAt,
            lte: moment.utc(Number(filter.createdAt?.lte)).toISOString(),
          },
        };
      }

      if (filter.operatorAccountID) {
        //模糊查找
        whereStr += `"operatorAccountID" LIKE '%${filter.operatorAccountID}%' AND`;
      }

      if (filter.id?.in && Array.isArray(filter.id?.in) && filter.id?.in.length > 0) {
        whereStr += `"id" IN (${filter.id?.in.join(",")}) AND`;
      }

      let day = moment.utc().format("YYYYMMDD");

      let tableNames: string[] = [];
      let checkedBeginDay = moment.utc().subtract(7, "days").format("YYYYMMDD");
      let checkedEndDay = moment.utc().add(1, "days").format("YYYYMMDD");

      console.log("filter====================2", JSON.stringify(filter));

      if (filter.createdAt && filter.createdAt?.gte) {
        checkedBeginDay = moment.utc(filter.createdAt?.gte).format("YYYYMMDD");
      }

      if (filter.createdAt && filter.createdAt?.lte) {
        checkedEndDay = moment.utc(filter.createdAt?.lte).format("YYYYMMDD");
      }

      if (filter.updatedAt && filter.updatedAt?.gte) {
        checkedBeginDay = moment.utc(filter.updatedAt?.gte).format("YYYYMMDD");
      }

      if (filter.updatedAt && filter.updatedAt?.lte) {
        checkedEndDay = moment.utc(filter.updatedAt?.lte).format("YYYYMMDD");
      }

      const checkedDays: string[] = [];

      while (Number(checkedBeginDay) <= Number(checkedEndDay)) {
        checkedDays.push(checkedBeginDay);
        checkedBeginDay = moment.utc(checkedBeginDay).add(1, "day").format("YYYYMMDD");
      }

      tableNames = checkedDays.map((day) => `GameHistory_${day}`);

      let allUnionSql = "";
      const selectedStr = `
      sum(profit) as "profit", 
      sum("totalBet") as "totalBet", 
       "operatorAccountID"
      `;

      for (let index = 0; index < tableNames.length; index++) {
        const tableName = tableNames[index];
        const yesterdayTableExistResult = await PgClient.query(
          `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '${tableName}');`,
        );
        const tableExist = yesterdayTableExistResult.rows[0]?.exists;

        if (!tableExist) {
          continue;
        }
        let sqlStr = `SELECT ${selectedStr}  FROM "public"."${tableName}"`;

        if (whereStr.length > 0) {
          sqlStr += ` WHERE (${whereStr} "status" = '${GameHistoryStatus.Success}')  GROUP BY "operatorAccountID"`;
        } else {
          sqlStr += ` WHERE "status" = '${GameHistoryStatus.Success}'  GROUP BY "operatorAccountID"`;
        }

        allUnionSql += `
          ${sqlStr}

           UNION ALL 

        `;
      }

      const tableName = "GameHistory";
      let sqlStr = `SELECT ${selectedStr} FROM "public"."${tableName}"`;

      if (whereStr.length > 0) {
        sqlStr += ` WHERE (${whereStr} "status" = '${GameHistoryStatus.Success}') GROUP BY "operatorAccountID"`;
      } else {
        sqlStr += ` WHERE "status" = '${GameHistoryStatus.Success}'  GROUP BY "operatorAccountID"`;
      }

      allUnionSql += `${sqlStr}`;

      let allSql = `
      SELECT ${selectedStr} FROM (${allUnionSql}) as t1
      `;
      let countSql = `
      SELECT count(*) as count FROM (${allUnionSql})
      `;

      allSql += ` GROUP BY "operatorAccountID" ORDER BY profit desc LIMIT ${limit} OFFSET ${offset};`;

      const result = await PgClient.query(allSql);
      const countResult = await PgClient.query(countSql);

      return {
        list: result.rows.map((item: any) => {
          return {
            ...item,
          };
        }),
        total: +countResult.rows[0]?.count,
      };
    } catch (error: any) {
      console.log("Error finding many game history:", JSON.stringify(error));
      console.log("Error finding many game history:", error);
      console.log("Error finding many game history:", JSON.stringify(error.message));
      throw error;
    }
  };

  static async updateOne(filter: GameHistoryFilter, data: Prisma.GameHistoryUpdateInput) {
    const record = await this.findOne({ filter });
    const day = moment.utc(record.createdAt).format("YYYYMMDD");
    const tableName = await TableService.getGameHistoryTable(day);

    if (!record) {
      throw new Error("Game history not found");
    }

    let whereStr = ``;

    if (filter.isTesting !== undefined) {
      whereStr += `"t1"."isTesting" = ${filter.isTesting}`;
    }

    if (filter.status) {
      whereStr += `"t1"."status" = ${filter.status}`;
    }

    if (filter.gameID) {
      whereStr += `"t1"."gameID" = ${filter.gameID}`;
    }

    if (filter.historyId) {
      whereStr += `"t1"."historyId" = ${filter.historyId.toString}`;
    }

    let sqlStr = `UPDATE "public"."${tableName}" SET`;

    if (data.currency) {
      sqlStr += `"currency" = ${data.currency}`;
    }

    if (data.fscc) {
      sqlStr += `"fscc" = ${data.fscc}`;
    }

    if (data.mgcc) {
      sqlStr += `"mgcc" = ${data.mgcc}`;
    }

    if (data.ge) {
      sqlStr += `"ge" = ${data.ge}`;
    }

    if (data.gameID) {
      sqlStr += `"gameID" = ${data.gameID}`;
    }

    if (data.totalBet) {
      sqlStr += `"totalBet" = ${data.totalBet}`;
    }

    if (data.operatorId) {
      sqlStr += `"operatorId" = ${data.operatorId}`;
    }

    if (data.playerId) {
      sqlStr += `"playerId" = ${data.playerId}`;
    }

    if (data.profit) {
      sqlStr += `"profit" = ${data.profit}`;
    }

    if (data.moneyPoolId) {
      sqlStr += `"moneyPoolId" = ${data.moneyPoolId}`;
    }

    sqlStr += ` WHERE (${whereStr})`;

    await sql`${sqlStr}`;

    return this.findOne({ filter });
  }

  static async getHistoryByDayAndId(day: string, id: number) {
    const sql = `SELECT * FROM "public"."GameHistory_${day}" WHERE id = ${id}`;
    const result = await PgClient.query<GameHistory>(sql);
    return result?.rows[0] || null;
  }
}
