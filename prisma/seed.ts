import process from "node:process";
import { games, operators } from "./seedData";

import { getRootPassword, getRootUser } from "config";
import bcrypt from "bcryptjs";
import { AvatarGenerator } from "random-avatar-generator";

import { connectRedis, prismaClient } from "../src/utils";
import { importGameConfig } from "./config/importGameConfig";

await connectRedis();

const avatarGenerator = new AvatarGenerator();

const password = getRootPassword();
const username = getRootUser();

//todo:建立超级管理员
const isRootExist = await prismaClient.admin.findFirst({
  where: {
    isRoot: true,
  },
});
if (isRootExist && isRootExist.username !== username) {
  await prismaClient.admin.update({
    where: {
      id: isRootExist.id,
    },
    data: {
      username,
    },
  });
}
if (isRootExist && !bcrypt.compareSync(password, isRootExist.password)) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  await prismaClient.admin.update({
    where: {
      id: isRootExist.id,
    },
    data: {
      password: hash,
    },
  });
}
if (!isRootExist) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(getRootPassword(), salt);

  const avatar = avatarGenerator.generateRandomAvatar();
  await prismaClient.admin.create({
    data: {
      username,
      password: hash,
      isRoot: true,
      avatar,
    },
  });
}

//todo:建立管理员

//运营商
for (let index = 0; index < operators.length; index++) {
  const operator = operators[index];
  const operatorExist = await prismaClient.operator.findFirst({
    where: {
      name: operator.name,
    },
  });
  if (operatorExist) continue;
  await prismaClient.operator.create({
    data: operator,
  });
}

//建立游戏
for (let index = 0; index < games.length; index++) {
  const game = games[index];
  const gameExist = await prismaClient.game.findFirst({
    where: {
      gameID: game.gameID,
    },
  });
  // if (gameExist) continue;
  if (gameExist) {
    await prismaClient.game.update({
      where: { gameID: game.gameID },
      data: game,
    });
  } else {
    await prismaClient.game.create({
      data: game,
    });
  }
}

console.log("seed success");

process.exit(0);
