import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import { ConfigRTP } from "@prisma/client";
import { prismaClient } from "utils/prismaClient";
import { redisClient } from "utils/redisClient";
import { trim } from "lodash";

export async function importGameConfig(gameID: number, filename: string) {
  await redisClient.set(`${gameID}-data-config`, "off");
  const filepath = `${process.cwd()}/prisma/config/${filename}`;
  if (!filepath) throw new Error("file not found");
  if (!existsSync(filepath)) throw new Error("file not found");

  const file = readFileSync(filepath);
  const workbook = XLSX.read(file);

  //开始导入总反奖率表
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  //ignore first row
  const rtpConfigs: any[] = data.slice(1);
  await prismaClient.configRTP.deleteMany({ where: { gameID } });
  await redisClient.set(`${gameID}:rtpCount`, 0);
  let configRTP: null | ConfigRTP = null;
  for (const rtpConfig of rtpConfigs) {
    if (
      rtpConfig[0] !== undefined &&
      rtpConfig[1] !== undefined &&
      rtpConfig[2] !== undefined
    ) {
      await redisClient.incr(`${gameID}:rtpCount`);
      configRTP = await prismaClient.configRTP.create({
        data: {
          gameID,
          rtpNumber: parseInt(rtpConfig[0]),
          min: parseFloat(rtpConfig[1]),
          max: parseFloat(rtpConfig[2]),
          detail: [],
        },
      });
    }
    if (!configRTP) throw new Error("configRTP is null");
    configRTP = await prismaClient.configRTP.update({
      where: { id: configRTP.id },
      data: {
        detail: [
          ...(configRTP.detail as any[]),
          {
            index: parseInt(rtpConfig[3]),
            min: parseFloat(rtpConfig[4]),
            max: parseFloat(rtpConfig[5]),
            A: parseInt(rtpConfig[6]),
            B: parseInt(rtpConfig[7]),
            C: parseInt(rtpConfig[8]),
            D: parseInt(rtpConfig[9]),
          },
        ],
      },
    });
  }

  //开始导入玩家类型表
  const sheet2 = workbook.Sheets[workbook.SheetNames[1]];
  const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
  const playerTypes: any[] = data2.slice(1);
  await prismaClient.configPlayerType.deleteMany({ where: { gameID } });
  for (const playerType of playerTypes) {
    await prismaClient.configPlayerType.create({
      data: {
        gameID,
        type: playerType[0],
        normal: parseFloat(playerType[1]),
        special: parseFloat(playerType[2]),
      },
    });
  }

  //开始导入图形权重赔率表
  const sheet3 = workbook.Sheets[workbook.SheetNames[2]];
  const data3 = XLSX.utils.sheet_to_json(sheet3, { header: 1 });
  const iconWeights: any[] = data3.slice(1);
  await prismaClient.configThreeColumnsCardWeight.deleteMany({
    where: { gameID },
  });
  for (const iconWeight of iconWeights) {
    await prismaClient.configThreeColumnsCardWeight.create({
      data: {
        gameID,
        name: iconWeight[0],
        cardID: iconWeight[1],
        columnOne: parseFloat(iconWeight[2]),
        columnTwo: parseFloat(iconWeight[3]),
        columnThree: parseFloat(iconWeight[4]),
        payRate: parseFloat(iconWeight[5]),
      },
    });
  }

  //开始导入不中奖表
  const sheet4 = workbook.Sheets[workbook.SheetNames[3]];
  const data4 = XLSX.utils.sheet_to_json(sheet4, { header: 1 });
  const noPrizeWin: any[] = data4.slice(1);
  await prismaClient.configNoPrize.deleteMany({ where: { gameID } });
  await redisClient.set(`${gameID}:noPrizeCount`, 0);
  for (let noPrizeIndex = 0; noPrizeIndex < noPrizeWin.length; noPrizeIndex++) {
    const noPrize = noPrizeWin[noPrizeIndex];
    if (!noPrize[1]) continue;
    const cards = trim(noPrize[1])
      .replace("[", "")
      .replace("]", "")
      .split(",")
      .map(Number);
    if (cards.length === 0) continue;
    await redisClient.incr(`${gameID}:noPrizeCount`);
    await prismaClient.configNoPrize.create({
      data: {
        gameID,
        count: noPrizeIndex + 1,
        cards,
      },
    });
  }

  //开始导入特殊中奖表
  const sheet5 = workbook.Sheets[workbook.SheetNames[4]];
  const data5 = XLSX.utils.sheet_to_json(sheet5, { header: 1 });
  const specialWin: any[] = data5.slice(1);
  await prismaClient.configSpecialPrize.deleteMany({ where: { gameID } });
  await redisClient.set(`${gameID}:specialPrizeCount`, 0);
  for (let specialIndex = 0; specialIndex < specialWin.length; specialIndex++) {
    const special = specialWin[specialIndex];
    await redisClient.incr(`${gameID}:specialPrizeCount`);
    if (!special[0]) {
      continue;
    }
    await prismaClient.configSpecialPrize.create({
      data: {
        gameID,
        count: specialIndex + 1,
        payRate: parseFloat(special[0]),
        rounds: [
          {
            payRate: parseFloat(special[1]),
            cards: JSON.parse(trim(special[2] || "[]")),
            fullScreenPayRate: parseFloat(special[3]),
            cardPointed: parseFloat(special[4]),
            freeModeCount: parseFloat(special[5]),
            routes: JSON.parse(trim(special[6] || "[]")),
          },
          {
            payRate: parseFloat(special[7]),
            cards: JSON.parse(trim(special[8] || "[]")),
            fullScreenPayRate: parseFloat(special[9]),
            cardPointed: parseFloat(special[10]),
            freeModeCount: parseFloat(special[11]),
            routes: JSON.parse(trim(special[12] || "[]")),
          },
          {
            payRate: parseFloat(special[13]),
            cards: JSON.parse(trim(special[14] || "[]")),
            fullScreenPayRate: parseFloat(special[15]),
            cardPointed: parseFloat(special[16]),
            freeModeCount: parseFloat(special[17]),
            routes: JSON.parse(trim(special[18] || "[]")),
          },
          {
            payRate: parseFloat(special[19]),
            cards: JSON.parse(trim(special[20] || "[]")),
            fullScreenPayRate: parseFloat(special[21]),
            cardPointed: parseFloat(special[22]),
            freeModeCount: parseFloat(special[23]),
            routes: JSON.parse(trim(special[24] || "[]")),
          },
          {
            payRate: parseFloat(special[25]),
            cards: JSON.parse(trim(special[26] || "[]")),
            fullScreenPayRate: parseFloat(special[27]),
            cardPointed: parseFloat(special[28]),
            freeModeCount: parseFloat(special[29]),
            routes: JSON.parse(trim(special[30] || "[]")),
          },
          {
            payRate: parseFloat(special[31]),
            cards: JSON.parse(trim(special[32]) || "[]"),
            fullScreenPayRate: parseFloat(special[33] || "0"),
            cardPointed: parseFloat(special[34] || "0"),
            freeModeCount: parseFloat(special[35] || "0"),
            routes: JSON.parse(trim(special[36]) || "[]"),
          },
          {
            payRate: parseFloat(special[37]),
            cards: JSON.parse(trim(special[38] || "[]")),
            fullScreenPayRate: parseFloat(special[39]),
            cardPointed: parseFloat(special[40]),
            freeModeCount: parseFloat(special[41]),
            routes: JSON.parse(trim(special[42] || "[]")),
          },
          {
            payRate: parseFloat(special[43]),
            cards: JSON.parse(trim(special[44] || "[]")),
            fullScreenPayRate: parseFloat(special[45]),
            cardPointed: parseFloat(special[46]),
            freeModeCount: parseFloat(special[47]),
            routes: JSON.parse(trim(special[48] || "[]")),
          },
        ],
      },
    });
  }

  //开始导入卡片概率
  const sheet6 = workbook.Sheets[workbook.SheetNames[5]];
  const data6 = XLSX.utils.sheet_to_json(sheet6, { header: 1 });
  const tickets: any[] = data6.slice(1);
  await prismaClient.configTicket.deleteMany({ where: { gameID } });
  await redisClient.del(`ticket-weight-config:${gameID}`);
  for (let index = 0; index < tickets.length; index++) {
    const ticket = tickets[index];
    if (!ticket[0] || !ticket[1]) continue;
    const [amount, rate] = ticket;
    if (!amount || !rate || rate >= 1) continue;
    await prismaClient.configTicket.create({
      data: {
        gameID,
        amount: ticket[0],
        rate: parseFloat(ticket[1].toFixed(8)),
      },
    });
  }

  await redisClient.set(`${gameID}-data-config`, "on");
}
