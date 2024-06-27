import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import { trim } from "lodash";

export const gamePresetResults = new Map<
  number,
  {
    specialResults: {
      gameID: number;
      count: number;
      payRate: number;
      rounds: {
        payRate: number;
        cards: number[];
        fullScreenPayRate: number;
        cardPointed: number;
        freeModeCount: number;
        routes: number[];
      }[];
    }[];
    noPrizeResults: {
      gameID: number;
      count: number;
      cards: number[];
    }[];
  }
>();

export function getGamePresetResults(gameID: number, filename: string) {
  if (gamePresetResults.has(gameID)) return;
  const filepath = `${process.cwd()}/prisma/config/${filename}`;
  if (!filepath) throw new Error("file not found");
  if (!existsSync(filepath)) throw new Error("file not found");

  const file = readFileSync(filepath);
  const workbook = XLSX.read(file);

  //开始导入特殊中奖表
  const sheet5 = workbook.Sheets[workbook.SheetNames[4]];
  const data5 = XLSX.utils.sheet_to_json(sheet5, { header: 1 });
  const specialResults =
    (data5.slice(1)?.map((special: any, index: number) => {
      // console.log("cards", JSON.parse(trim(special[2] || "[]")));
      return {
        gameID,
        count: index + 1,
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
      };
    }) as {
      gameID: number;
      count: number;
      payRate: number;
      rounds: {
        payRate: number;
        cards: number[];
        fullScreenPayRate: number;
        cardPointed: number;
        freeModeCount: number;
        routes: number[];
      }[];
    }[]) || [];

  //开始导入不中奖表
  const sheet4 = workbook.Sheets[workbook.SheetNames[3]];
  const data4 = XLSX.utils.sheet_to_json(sheet4, { header: 1 });
  const noPrizeResults = data4.slice(1)?.map((noPrize: any, index: number) => {
    const cards = trim(noPrize[1]).replace("[", "").replace("]", "").split(",").map(Number);
    return {
      gameID,
      count: index + 1,
      cards,
    };
  });

  const gameConfig = { specialResults, noPrizeResults };
  gamePresetResults.set(gameID, gameConfig);
}

export function importAllPresets() {
  const checkTime = Date.now();
  console.log("开始导入所有游戏配置");
  getGamePresetResults(126, "fortuneTigerConfig.xlsx");
  getGamePresetResults(1695365, "fortuneDragonConfig.xlsx");
  getGamePresetResults(68, "fortuneMouseConfig.xlsx");
  getGamePresetResults(1543462, "fortuneRabbitConfig.xlsx");
  getGamePresetResults(98, "fortuneOxConfig.xlsx");
  console.log(`导入所有游戏配置耗时：${Date.now() - checkTime}ms`);
}
