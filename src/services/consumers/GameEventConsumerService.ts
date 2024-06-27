import { SystemEventType } from "@prisma/client";
import { prismaClient } from "utils";

export class GameEventConsumerService {
  static async afterBet(playerId: number, gameID: number, betAmount: number) {
    console.log("afterBet==============Job", "afterBet", playerId, gameID, betAmount);
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
    const lastLog = await prismaClient.systemEventLog.findFirst({
      where: {
        playerId,
      },
      orderBy: {
        happenedAt: "desc",
      },
    });
    await prismaClient.systemEventLog.create({
      data: {
        playerId,
        gameID,
        accountID: player.operatorAccountID,
        type: SystemEventType.GameBet,
        live: 1,
        balance: wallet?.balance || 0,
        timeLong: lastLog?.happenedAt ? new Date().getTime() - lastLog.happenedAt.getTime() : 0,
        operatorId: player.operatorId,
        isTest: player.isTest,
        bet: betAmount,
        betCount: 1,
      },
    });
  }

  static async afterWin(playerId: number, gameID: number, winAmount: number) {
    console.log("afterWin==============Job", "afterWin", playerId, gameID, winAmount);
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
    const lastLog = await prismaClient.systemEventLog.findFirst({
      where: {
        playerId,
      },
      orderBy: {
        happenedAt: "desc",
      },
    });
    let timeLong = lastLog?.happenedAt ? new Date().getTime() - lastLog.happenedAt.getTime() : 0;
    //如果时长大于5分钟， 则不记录
    if (timeLong > 5 * 60 * 1000) {
      timeLong = 0;
    }
    await prismaClient.systemEventLog.create({
      data: {
        playerId,
        gameID,
        accountID: player.operatorAccountID,
        type: SystemEventType.GameWin,
        live: 1,
        balance: wallet?.balance || 0,
        timeLong,
        operatorId: player.operatorId,
        isTest: player.isTest,
        win: winAmount,
      },
    });
  }
}
