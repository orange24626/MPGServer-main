import { prismaClient } from "../../src/utils/prismaClient";
const wallets = await prismaClient.gamePlayerWallet.findMany({
  where: {
    playerId: {
      equals: undefined,
    },
  },
});

console.log(wallets);
