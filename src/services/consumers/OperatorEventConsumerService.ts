import { SystemEventType } from "@prisma/client";
import { prismaClient } from "utils";

export class OperatorEventConsumerService {
  static async afterCharge(playerId: number, charge: number) {
    console.log("afterCharge==============Job", "afterCharge", playerId, charge);
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
        accountID: player.operatorAccountID,
        type: SystemEventType.Charge,
        live: 1,
        balance: wallet?.balance || 0,
        timeLong,
        operatorId: player.operatorId,
        isTest: player.isTest,
        charge,
      },
    });
  }

  static async afterWithdraw(playerId: number, withdraw: number) {
    console.log("afterWithdraw==============Job", "afterWithdraw", playerId, withdraw);
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
        accountID: player.operatorAccountID,
        type: SystemEventType.Withdraw,
        live: 1,
        balance: wallet?.balance || 0,
        timeLong,
        operatorId: player.operatorId,
        isTest: player.isTest,
        withdraw,
      },
    });
  }
}
