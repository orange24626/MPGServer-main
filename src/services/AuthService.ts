import { prismaClient } from "../utils/prismaClient";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import nickname from "nickname";
import bcrypt from "bcryptjs";

import { SessionService } from "./SessionService";
import { GameSessionPostInput, GameSessionPostResponse, GameTrailPostInput } from "dtos";
import { nanoid } from "nanoid";
import moment from "moment";
import { AdminLoginInput } from "dtos/authAdmin";
import { OperatorService } from "./OperatorService";
import { triggerRegisterJob } from "jobs";
import { WalletService } from "./WalletService";
import sql from "utils/db";
import { Decimal } from "@prisma/client/runtime/library";
import { GamePlayerWallet, Operator } from "@prisma/client";
import { PgClient } from "utils";

export class AuthService {
  static async createOperatorSession(
    createInput: z.infer<typeof GameSessionPostInput>,
  ): Promise<z.infer<typeof GameSessionPostResponse>> {
    console.log("用户创建会话:收到的输入========", JSON.stringify(createInput));
    const { accessKey, userID, username, currency, sign, test, chanelID } = createInput;
    const operator = await OperatorService.verifySign(accessKey, sign, createInput);
    console.log("用户创建会话:签名的运营商，签名成功========", JSON.stringify(operator));
    if (!operator) {
      throw new HTTPException(401, { message: "operator not found" });
    }

    let isNew = true;

    let operatorUser = await prismaClient.operatorUser.findFirst({
      where: {
        operatorId: operator.id,
        accountID: userID,
        username: username,
      },
    });

    if (!operatorUser) {
      operatorUser = await prismaClient.operatorUser.findFirst({
        where: {
          operatorId: operator.id,
          accountID: userID,
        },
      });
      if (operatorUser) {
        throw new HTTPException(400, { message: "accountID already exist and is not match the username" });
      }
    }

    console.log("用户创建会话:operatorUser========1", JSON.stringify(operatorUser));

    if (!operatorUser) {
      operatorUser = await prismaClient.operatorUser.findFirst({
        where: {
          operatorId: operator.id,
          username: username,
        },
      });
      if (operatorUser) {
        throw new HTTPException(400, { message: "username already exist and is not match the accountID" });
      }
    }

    console.log("用户创建会话:operatorUser========2", JSON.stringify(operatorUser));

    if (!operatorUser) {
      operatorUser = await prismaClient.operatorUser.create({
        data: {
          accountID: userID,
          username: username,
          operatorName: operator.name,
          nickname: username,
          rtpLevel: operator.rtpLevel,
          isTest: test || false,
          operator: {
            connect: {
              id: operator.id,
            },
          },
        },
      });
    } else {
      isNew = false;
    }
    console.log("用户创建会话:operatorUser========3", JSON.stringify(operatorUser));

    let player = await prismaClient.gamePlayer.findFirst({
      where: {
        operatorUserID: operatorUser.id,
        operatorUsername: username,
        operatorId: operator.id,
      },
    });
    console.log("用户创建会话:player========5", JSON.stringify(player));

    let gamePlayerWallet: GamePlayerWallet | null = null;

    if (!player) {
      player = await prismaClient.gamePlayer.create({
        data: {
          operatorUserID: operatorUser.id,
          operatorId: operator.id,
          operatorName: operator.name,
          operatorUsername: operatorUser.username,
          nickname: username,
          rtpLevel: 10,
          channelID: chanelID,
          isTest: test || false,
          operatorAccountID: operatorUser.accountID,
        },
      });
    }
    gamePlayerWallet = await prismaClient.gamePlayerWallet.findFirst({
      where: {
        playerId: player.id,
        currency: currency || "BRL",
        operatorId: operator.id,
      },
    });

    if (!gamePlayerWallet) {
      gamePlayerWallet = await prismaClient.gamePlayerWallet.create({
        data: {
          playerId: player.id,
          currency: currency || "BRL",
          isTest: test || false,
          balance: 0,
          operatorId: operator.id,
        },
      });
    }

    //修正数据上错误
    if (gamePlayerWallet.operatorId !== operator.id) {
      await prismaClient.gamePlayerWallet.update({
        where: {
          id: gamePlayerWallet.id,
        },
        data: {
          operatorId: operator.id,
        },
      });
    }
    console.log("用户创建会话:还是创建sessions============");
    const sessions = await SessionService.getSessions(String(operator.id), String(operatorUser.id));
    let token = sessions[0]?.token;
    if (!token) {
      token = await SessionService.createSession({
        appName: String(operator.id),
        id: String(operatorUser.id),
        data: {
          currency,
        },
      });
    } else {
      await SessionService.renewSession(String(operator.id), token);
    }
    console.log("用户创建会话: 创建sessions成功============", JSON.stringify(sessions));

    return {
      token,
      isNew,
      balance: new Decimal(gamePlayerWallet.balance).toNumber(),
      operatorUserID: operatorUser.accountID,
      playerID: String(player.id),
      test: test || false,
    };
  }

  static async trial(
    trailPostParams: z.infer<typeof GameTrailPostInput>,
  ): Promise<z.infer<typeof GameSessionPostResponse>> {
    const { accessKey, currency } = trailPostParams;
    const {
      rows: [operator],
    } = await PgClient.query<Operator>(`
      SELECT * FROM "public"."Operator" WHERE "operatorKey" = '${accessKey}' limit 1;
    `);
    if (!operator) {
      throw new HTTPException(401, { message: "operator not found" });
    }

    const operatorUser = await prismaClient.operatorUser.create({
      data: {
        accountID: nanoid(),
        username: nanoid(),
        nickname: nickname.random(),
        operatorName: operator.name,
        isTest: true,
        rtpLevel: 14,
        testingExpired: moment().add(1, "days").toDate(),
        operator: {
          connect: {
            id: operator.id,
          },
        },
      },
    });
    const player = await prismaClient.gamePlayer.create({
      data: {
        operatorUserID: operatorUser.id,
        operatorId: operator.id,
        nickname: nickname.random(),
        operatorName: operator.name,
        operatorUsername: operatorUser.username,
        rtpLevel: 14,
        operatorAccountID: operatorUser.accountID,
        isTest: true,
        testingExpired: moment().add(1, "days").toDate(),
      },
    });
    triggerRegisterJob({
      playerId: player.id,
    });
    const gamePlayerWallet = await prismaClient.gamePlayerWallet.create({
      data: {
        playerId: player.id,
        isTest: true,
        currency: currency || "BRL",
        testingExpired: moment().add(1, "days").toDate(),
        balance: 1000000,
        operatorId: operator.id,
      },
    });

    const sessions = await SessionService.getSessions(String(operator.id), String(operatorUser.id));
    let token = sessions[0]?.token;
    if (!token) {
      token = await SessionService.createSession({
        appName: String(operator.id),
        id: String(operatorUser.id),
        data: {
          currency,
        },
      });
    } else {
      await SessionService.renewSession(operator.name, token);
    }
    return {
      token,
      isNew: true,
      balance: new Decimal(gamePlayerWallet.balance).toNumber(),
      operatorUserID: String(operatorUser.id),
      playerID: String(player.id),
      test: true,
    };
  }

  static async authGame(id: string) {
    const sessions = await SessionService.getSessions("mpg", id);
    let token = sessions[0]?.token;
    if (!token) {
      token = await SessionService.createSession({
        appName: "mpg",
        id: id,
      });
      return token as string;
    }
    await SessionService.renewSession("mpg", token);
    return token as string;
  }

  static async authOperator(operatorName: string, id: string) {
    const sessions = await SessionService.getSessions(operatorName, id);
    let token = sessions[0]?.token;
    if (!token) {
      token = await SessionService.createSession({
        appName: operatorName,
        id: id,
      });
      return token as string;
    }
    await SessionService.renewSession(operatorName, token);
    return token as string;
  }

  static async getOperatorSession(operatorToken: string, operatorId: string) {
    const sessions = await SessionService.getSessionsByToken(operatorId, operatorToken);
    if (sessions.length === 0) {
      throw new HTTPException(401, { message: "operatorToken invalid" });
    }
    await SessionService.renewSession(operatorId, operatorToken);
    return sessions;
  }

  static async getGameSession(token: string) {
    const sessions = await SessionService.getSessionsByToken("mpg", token);
    if (sessions.length === 0) {
      throw new HTTPException(401, { message: "game Token invalid" });
    }
    await SessionService.renewSession("mpg", token);
    return sessions;
  }

  static async getGameSessionById(id: string) {
    const sessions = await SessionService.getSessions("mpg", id);
    return sessions;
  }

  static async verifyGameToken(token: string) {
    if (!token) {
      throw new HTTPException(401, { message: "atk is required" });
    }
    const id = await SessionService.getIdByToken("mpg", token as string);
    if (!id) {
      throw new HTTPException(401, { message: "Invalid token" });
    }
    const sessions = await AuthService.getGameSession(token as string);
    if (sessions.length === 0) {
      throw new HTTPException(401, { message: "Invalid token" });
    }
    const session = sessions.find((session) => session.token === token);
    if (!session) {
      throw new HTTPException(401, { message: "Invalid token" });
    }
    SessionService.renewSession("mpg", token);
    return session;
  }

  static async adminLogin(loginInput: z.infer<typeof AdminLoginInput>) {
    const { username, password } = loginInput;
    const admin = await prismaClient.admin.findFirst({
      where: {
        username,
      },
    });
    if (!admin) {
      throw new HTTPException(401, {
        message: "Invalid username or Invalid password",
      });
    }
    if (!bcrypt.compareSync(password, admin.password)) {
      throw new HTTPException(401, { message: "Invalid password" });
    }

    const sessions = await SessionService.getSessions("admin", admin.id.toString());
    let token = sessions[0]?.token;
    const roles = await prismaClient.adminRole.findMany({
      where: {
        adminId: admin.id,
      },
      select: {
        role: {
          select: {
            permissions: true,
            operatorId: true,
            name: true,
            id: true,
            level: true,
          },
        },
      },
    });

    await SessionService.deleteAllSessionById("admin", admin.id);

    const operatorIds: any = [];

    const levels = roles.map((role) => role?.role?.level);

    roles.forEach((role) => {
      if (role?.role?.operatorId) {
        operatorIds.push(role?.role?.operatorId);
      }
    });

    token = await SessionService.createSession({
      appName: "admin",
      id: admin.id.toString(),
      data: {
        permission: {
          isRoot: admin.isRoot,
          roles,
          operatorIds,
          levels,
        },
      },
    });

    return {
      token,
    };
  }

  static async getPermissionByToken(token: string) {
    const sessions = await SessionService.getSessionsByToken("admin", token);
    if (sessions.length === 0) {
      throw new HTTPException(401, { message: "Invalid token" });
    }
    const session = sessions.find((session) => session.token === token);
    if (!session) {
      throw new HTTPException(401, { message: "Invalid token" });
    }
    return session.data?.permission;
  }

  static async operatorLogout(operatorName: string, token: string) {
    const userId = await SessionService.getIdByToken(operatorName, token);
    if (!userId) {
      throw new HTTPException(401, { message: "Invalid token" });
    }

    await SessionService.deleteSessionByToken(operatorName, token);
  }
}
