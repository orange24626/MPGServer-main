import { prismaClient } from "../../src/utils/prismaClient";
const transactions = await prismaClient.operatorMoneyTransaction.findMany({
  where: {
    OR: [
      {
        playerId: {
          equals: undefined,
        },
      },
      {
        playerId: {
          equals: null,
        },
      },
      {
        walletId: {
          equals: null,
        },
      },
      {
        walletId: {
          equals: undefined,
        },
      },
    ],
  },
});

for (let index = 0; index < transactions.length; index++) {
  const transaction = transactions[index];
  if (transaction.operatorUserID === null) {
    continue;
  }
  const player = await prismaClient.gamePlayer.findFirst({
    where: {
      operatorAccountID: transaction.operatorUserID,
    },
  });

  if (!player) {
    continue;
  }
  const wallet = await prismaClient.gamePlayerWallet.findFirst({
    where: {
      playerId: player.id,
    },
  });
  await prismaClient.operatorMoneyTransaction.update({
    where: {
      id: transaction.id,
    },
    data: {
      playerId: player.id,
      walletId: wallet?.id,
    },
  });
}
