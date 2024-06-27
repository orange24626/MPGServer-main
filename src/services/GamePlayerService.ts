import { GamePlayer, Prisma } from "@prisma/client";
import { ParsedQs } from "qs";
import { parseQuery } from "utils/parseQuery";
import { prismaClient } from "utils/prismaClient";
import bcrypt from "bcryptjs";
import { UserGameStore } from "models";
import { HTTPException } from "hono/http-exception";
import sql from "utils/db";
import { PgClient } from "utils";

export class GamePlayerService {
  static async getGamePlayerById(playerId: number) {
    const { rows: players } = await PgClient.query(`SELECT 
      "t1"."id", 
      "t1"."nickname", 
      "t1"."mobile", 
      "t1"."email", 
      "t1"."operatorName", 
      "t1"."isTest",
       "t1"."testingExpired", 
       "t1"."isRobot", 
       "t1"."rtpLevel", 
       "t1"."avatar", 
       "t1"."password", 
       "t1"."channelID", 
       "t1"."operatorUserID", 
       "t1"."operatorUsername", 
       "t1"."operatorAccountID", 
       "t1"."createdAt", 
       "t1"."updatedAt", 
       "t1"."version", 
       "t1"."operatorId" FROM 
       "public"."GamePlayer" AS "t1" 
       WHERE ("t1"."id" = ${playerId} AND 1=1) LIMIT 1`);
    const player = players[0] as GamePlayer;
    return player;
  }

  static async getPlayers(query: ParsedQs, operatorIds = []) {
    const { skip, take, orderBy, condition } = parseQuery(query, Prisma.GamePlayerScalarFieldEnum);
    if (operatorIds.length > 0) {
      condition.operatorId = {
        in: operatorIds,
      };
    }

    console.log({ condition });

    let list = [];

    let total = 0;

    if (condition.id) {
      const sql = `SELECT * FROM "public"."GamePlayer" WHERE "id" IN (${condition.id.in.join(",")})`;
      const countSql = `SELECT COUNT(*) FROM "public"."GamePlayer" WHERE "id" IN (${condition.id.in.join(",")})`;
      const { rows } = await PgClient.query(sql);
      list = rows;
      const { rows: count } = await PgClient.query(countSql);
      total = parseInt(count[0].count);
      return {
        list,
        total,
      };
    }

    total = await prismaClient.gamePlayer.count({
      where: condition,
    });

    console.log({ condition });

    const sqlStr = `SELECT 
                "t1"."id", 
                "t1"."isRobot", 
                "t1"."isTest", 
                "t1"."rtpLevel", 
                "t1"."channelID", 
                "t1"."operatorId", 
                "t1"."createdAt", 
                "t1"."updatedAt", 
                "t1"."version", 
                "t1"."operatorUsername", 
                "t1"."operatorUserID"
            FROM "public"."GamePlayer" AS "t1" 
            ORDER BY "t1"."createdAt" DESC 
            LIMIT ${take} OFFSET ${skip};
      `;

    const { rows } = await PgClient.query(sqlStr);

    return {
      list: rows,
      total,
    };
  }

  static async getPlayerByOperatorUserId(operatorUserID: number) {
    const { rows } = await PgClient.query(
      `SELECT * FROM "public"."GamePlayer" WHERE "operatorUserID" = '${operatorUserID}' LIMIT 1`,
    );
    const player = rows[0];
    return player as GamePlayer;
  }

  static async getGamePlayer(id: number) {
    const player = await prismaClient.gamePlayer.findUnique({
      where: {
        id,
      },
    });
    if (!player) {
      throw new HTTPException(404, {
        message: "Player not found",
      });
    }
    const userStore126 = new UserGameStore(player.id, 126);
    const userStore68 = new UserGameStore(player.id, 68);
    const userStore98 = new UserGameStore(player.id, 98);
    const userStore1543462 = new UserGameStore(player.id, 1543462);
    const userStore1695365 = new UserGameStore(player.id, 1695365);

    return {
      ...player,
      currentGameStatics: {
        126: {
          rtp: await userStore126.getCurrentRTP(),
          betCount: await userStore126.getBetCount(),
        },
        68: {
          rtp: await userStore68.getCurrentRTP(),
          betCount: await userStore68.getBetCount(),
        },
        98: {
          rtp: await userStore98.getCurrentRTP(),
          betCount: await userStore98.getBetCount(),
        },
        1543462: {
          rtp: await userStore1543462.getCurrentRTP(),
          betCount: await userStore1543462.getBetCount(),
        },
        1695365: {
          rtp: await userStore1695365.getCurrentRTP(),
          betCount: await userStore1695365.getBetCount(),
        },
      },
    };
  }

  static generateHash(origin: string) {
    const saltRounds = 10;
    bcrypt.genSaltSync(saltRounds);

    return bcrypt.hashSync(origin, saltRounds);
  }

  static createGamePlayer(input: Prisma.GamePlayerCreateInput) {
    //todo add admin for GamePlayer
    return prismaClient.gamePlayer.create({
      data: {
        ...input,
        password: input.password ? this.generateHash(input.password) : "",
      },
    });
  }

  static updateGamePlayer(id: number, passUpdate: boolean, input: Prisma.GamePlayerUpdateInput) {
    return prismaClient.gamePlayer.update({
      where: {
        id,
      },
      data: {
        ...input,
        password: passUpdate && typeof input.password === "string" ? this.generateHash(input.password) : input.password,
      },
    });
  }

  static deleteGamePlayer(id: number) {
    return prismaClient.gamePlayer.delete({
      where: {
        id,
      },
    });
  }
}
