import * as fs from "fs";
import * as XLSX from "xlsx";

XLSX.set_fs(fs);

import { prismaClient } from "utils";
import { Prisma } from "@prisma/client";

export class ExportFileService {
  static async exportGameHistory(condition: Prisma.GameHistoryWhereInput) {
    const gameHistories = await prismaClient.gameHistory.findMany({
      where: condition,
      select: {
        playerId: true,
        gameID: true,
        totalBet: true,
        profit: true,
        createdAt: true,
        player: {
          select: {
            operatorAccountID: true,
          },
        },
      },
    });
    const data = [];
    data.push(["用户名", "游戏名称", "游戏ID", "投注金额", "利润", "投注时间"]);
    for (const gameHistory of gameHistories) {
      const game = await prismaClient.game.findUnique({
        where: {
          id: gameHistory.gameID,
        },
        select: {
          name: true,
        },
      });
      const gameName = game?.name;
      data.push([
        gameHistory.player.operatorAccountID,
        gameName,
        gameHistory.gameID,
        gameHistory.totalBet.toString(),
        gameHistory.profit.toString(),
        gameHistory.createdAt.toISOString(),
      ]);
    }
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(book, sheet, "Game History");
    const rlt = await XLSX.writeFileXLSX(book, "public/gameHistory.xlsx");
    console.log(rlt);
  }
}
