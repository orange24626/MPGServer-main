import { prismaClient } from "../../src/utils/prismaClient";
const players = await prismaClient.gamePlayer.findMany({
  where: {
    OR: [
      {
        operatorUsername: {
          equals: undefined,
        },
      },
      {
        operatorUsername: {
          equals: "",
        },
      },
      {
        operatorUsername: {
          equals: null,
        },
      },
    ],
  },
});

for (let index = 0; index < players.length; index++) {
  const player = players[index];
  const operatorUser = await prismaClient.operatorUser.findFirst({
    where: {
      accountID: player.operatorAccountID,
    },
  });
  await prismaClient.gamePlayer.update({
    where: {
      id: player.id,
    },
    data: {
      operatorUsername: operatorUser?.username,
    },
  });
}
