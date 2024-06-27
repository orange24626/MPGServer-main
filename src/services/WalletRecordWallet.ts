import { Prisma } from "@prisma/client";
import { ParsedQs } from "qs";
import { parseQuery, prismaClient } from "utils";

export class WalletRecordService {
  static async getWalletRecords(query: ParsedQs, operatorIds: number[] = []) {
    const { skip, take, orderBy, condition } = parseQuery(query, Prisma.OperatorMoneyTransactionScalarFieldEnum);
    if (operatorIds.length > 0) {
      condition.operatorId = {
        in: operatorIds,
      };
    }
    if (condition["playerId"]) {
      condition["gamePlayerWalletId"] = condition["playerId"];
    }
    let list = await prismaClient.operatorMoneyTransaction.findMany({
      where: condition,
      skip,
      take,
      orderBy,
      select: {
        operatorUserID: true,
        operatorId: true,
        type: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        createdAt: true,
        updatedAt: true,
        orderID: true,
        playerId: true,
        walletId: true,
        id: true,
      },
    });

    const total = await prismaClient.operatorMoneyTransaction.count({
      where: condition,
    });
    return {
      list,
      total,
    };
  }

  static getWalletRecord(id: number) {
    return prismaClient.operatorMoneyTransaction.findUnique({
      where: {
        id,
      },
    });
  }

  static createWalletRecord(input: Prisma.OperatorMoneyTransactionCreateInput) {
    return prismaClient.operatorMoneyTransaction.create({
      data: input,
    });
  }

  static updateWalletRecord(id: number, input: Prisma.OperatorMoneyTransactionUpdateInput) {
    return prismaClient.operatorMoneyTransaction.update({
      where: {
        id,
      },
      data: input,
    });
  }

  static deleteWalletRecord(id: number) {
    return prismaClient.operatorMoneyTransaction.delete({
      where: {
        id,
      },
    });
  }
}
