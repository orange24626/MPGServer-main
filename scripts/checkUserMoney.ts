import { prismaClient } from "../src/utils/prismaClient";
const user = await prismaClient.operatorUser.findUnique({
  where: {
    accountID: "lam5851fd5b0pp",
  },
});

console.log(user);

const player = await prismaClient.gamePlayer.findFirst({
  where: {
    operatorAccountID: "lam5851fd5b0pp",
  },
});

const wallet = prismaClient.gamePlayerWallet.findFirst({
  where: {
    playerId: player?.id,
  },
});

console.log({
  player,
  wallet,
});
