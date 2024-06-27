import { SystemEventType } from "@prisma/client";
import { prismaClient } from "utils";

export class AuthConsumerService {
  static async afterLogin(playerId: number, gameID?: number) {
    console.log("afterLogin==============Job", "afterLogin", playerId, gameID);
    const player = await prismaClient.gamePlayer.findUnique({
      where: {
        id: playerId,
      },
    });
    if (!player) {
      throw new Error("player not found");
    }
    //todo 这里钱包可能需要分货币， 目前只有一个货币
    const wallet = await prismaClient.gamePlayerWallet.findFirst({
      where: {
        playerId,
      },
    });
    await prismaClient.systemEventLog.create({
      data: {
        playerId,
        gameID,
        accountID: player.operatorAccountID,
        type: SystemEventType.Login,
        login: 1,
        live: 1,
        balance: wallet?.balance || 0,
        timeLong: 0,
        operatorId: player.operatorId,
        isTest: player.isTest,
      },
    });
  }

  static async afterRegister(playerId: number, gameID?: number) {
    console.log("afterRegister==============Job", "afterRegister", playerId, gameID);
    const player = await prismaClient.gamePlayer.findUnique({
      where: {
        id: playerId,
      },
    });
    if (!player) {
      throw new Error("player not found");
    }
    //todo 这里钱包可能需要分货币， 目前只有一个货币
    const wallet = await prismaClient.gamePlayerWallet.findFirst({
      where: {
        playerId,
      },
    });

    await prismaClient.systemEventLog.create({
      data: {
        playerId,
        accountID: player.operatorAccountID,
        gameID,
        type: SystemEventType.Register,
        login: 1,
        live: 1,
        balance: wallet?.balance || 0,
        timeLong: 0,
        operatorId: player.operatorId,
        isTest: player.isTest,
      },
    });
  }
}
