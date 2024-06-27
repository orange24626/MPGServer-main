import * as fs from "fs";
import * as XLSX from "xlsx";
import moment from "moment";
import { nanoid } from "nanoid";
import { AuthService } from "services";
import { redisClient, prismaClient, connectRedis } from "utils";
import {
  FortuneTigerService,
  FortuneOxService,
  FortuneDragonService,
  FortuneMouseService,
  FortuneRabbitService,
} from "services/games";
import { UserGameStore } from "models";
import { MD5 } from "crypto-js";

await connectRedis();

await redisClient.flushDb();

const CURRENCY = "BRL";

const BASEBET = 0.06;

const BASERATE = 5;

const RTPLEVELLIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const GAMEIDS = [126, 1695365, 68, 98, 1543462];

const GAMELINERATE = new Map<number, number>([
  [126, 5],
  [1695365, 5],
  [68, 5],
  [98, 10],
  [1543462, 10],
]);

const initOperator = async (rtpLevel: number) => {
  try {
    const operatorExist = await prismaClient.operator.findFirst({
      where: {
        rtpLevel,
      },
    });
    if (operatorExist) return;
    const operator = {
      name: `MPG运营商-TEST-${rtpLevel}`,
      operatorKey: nanoid(),
      operatorID: nanoid(),
      operatorSecret: nanoid(),
      rtpLevel,
    };

    await prismaClient.operator.create({
      data: operator,
    });
  } catch (error) {
    throw error;
  }
};

const genSign = async (accessKey: string, data: any)=>{
  
  const operator = await prismaClient.operator.findFirst({
    where: {
      operatorKey: accessKey
    }
  });
  
  let orderedKeys = Object.keys(data).filter((key) => key !== "sign").sort();
  
  let signStr = "";
  
  for (let key of orderedKeys) {
    signStr += `${key}=${data[key].toString()}&`;
  }
  
  signStr += `key=${operator?.operatorSecret}`;
  
  signStr = MD5(signStr).toString();

  return signStr
}

const initPlayer = async (rtpLevel: number, isTest: boolean) => {

  try {

    const operator = await prismaClient.operator.findFirst({ where: { rtpLevel } });

    if (!operator) throw "init operator error";

    const userID = nanoid();

    const username =  nanoid();

    const sign = await genSign(operator.operatorKey, {
      userID,
      accessKey: operator.operatorKey,
      username,
      currency: CURRENCY,
      isTest
    })

    const data = await AuthService.createOperatorSession({
      userID,
      accessKey: operator.operatorKey,
      username,
      currency: CURRENCY,
      sign,
      isTest
    });

    let gamePlayerWallet = await prismaClient.gamePlayerWallet.findFirst({
      where: {
        playerId: Number(data.playerID)
      },
    });

    await prismaClient.gamePlayerWallet.update({
      where: {
        id: gamePlayerWallet?.id
      },
      data: {
        balance: 50000
      },
    });

    return data

  } catch (error) {
    throw `createUser: ${error}`;
  }
};

const spinTest = async (gameID: number, playerID: number, baseBet: number, baseRate: number) => {
  try {
    const spinId = nanoid();

    // const baseBet = BASEBET;

    // const baseRate = BASERATE;

    const lineRate = GAMELINERATE.get(gameID);

    if (!lineRate) throw "请检测 gameID 是否输入正确";

    console.log(
      "输入参数",
      "gameID",
      gameID,
      "playerID",
      playerID,
      "baseBet",
      baseBet,
      "baseBet",
      baseBet,
      "baseRate",
      baseRate,
      "lineRate",
      lineRate,
    );

    if (gameID === 126) {
      return await FortuneTigerService.spin({
        playerId: playerID,
        baseBet,
        baseRate,
        lineRate,
        currency: CURRENCY,
        spinId,
      });
    } else if (gameID === 1695365) {
      return await FortuneDragonService.spin({
        playerId: playerID,
        baseBet,
        baseRate,
        lineRate,
        currency: CURRENCY,
        spinId,
      });
    } else if (gameID === 68) {
      return await FortuneMouseService.spin({
        playerId: playerID,
        baseBet,
        baseRate,
        lineRate,
        currency: CURRENCY,
        spinId,
      });
    } else if (gameID === 98) {
      return await FortuneOxService.spin({
        playerId: playerID,
        baseBet,
        baseRate,
        lineRate,
        currency: CURRENCY,
        spinId,
      });
    } else if (gameID === 1543462) {
      return await FortuneRabbitService.spin({
        playerId: playerID,
        baseBet,
        baseRate,
        lineRate,
        currency: CURRENCY,
        spinId,
      });
    } else {
      throw "unknow gameID";
    }
  } catch (error) {
    throw error;
  }
};

const clearData = async (playerId: number) => {
  try {
    await prismaClient.gameHistory.deleteMany({
      where: {
        playerId,
      },
    });

    await prismaClient.moneyPoolMachineUserOccupied.deleteMany({
      where: {
        playerId,
      },
    });

    const playerWallet = await prismaClient.gamePlayerWallet.findFirst({
      where: {
        playerId,
      },
    });

    if (playerWallet) {
      await prismaClient.gamePlayerWalletRecord.deleteMany({
        where: {
          gamePlayerWalletId: playerWallet.id,
        },
      });
    }
  } catch (error) {
    throw error;
  }
};

const main = async () => {

  try {
  
    const args = process.argv;

    const gameIdIndex = args.findIndex((item) => item === "-id") + 1;

    const countIndex = args.findIndex((item) => item === "-c") + 1;

    const loopIndex = args.findIndex((item) => item === "-l") + 1;

    const rtpIndex = args.findIndex((item) => item === "-o") + 1;

    const isTestIndex = args.findIndex((item) => item === "-t") + 1;

    const baseBetIndex = args.findIndex((item) => item === "-bb") + 1;

    const baseRateIndex = args.findIndex((item) => item === "-br") + 1;

    if (!gameIdIndex || !countIndex || !loopIndex || !rtpIndex) {

      throw `参数缺失: ${gameIdIndex ? "" : "-id 缺失"} ${countIndex ? "" : "-c 缺失"} ${loopIndex ? "" : "-l 缺失"} ${rtpIndex ? "" : "-o 缺失"}`;
    }

    if (
      !args[gameIdIndex] ||
      args[gameIdIndex].indexOf("-") !== -1 ||
      !args[countIndex] ||
      args[countIndex].indexOf("-") !== -1 ||
      !args[loopIndex] ||
      args[loopIndex].indexOf("-") !== -1 ||
      !args[rtpIndex] ||
      args[rtpIndex].indexOf("-") !== -1
    ) {
      throw `参数值缺失: ${args[gameIdIndex] && args[gameIdIndex].indexOf("-") === -1 ? "" : "-id 值缺失"} ${args[countIndex] && args[countIndex].indexOf("-") === -1 ? "" : "-c 值缺失"} ${args[loopIndex] && args[loopIndex].indexOf("-") === -1 ? "" : "-l 值缺失"} ${args[rtpIndex] && args[rtpIndex].indexOf("-") === -1 ? "" : "-o 值缺失"}`;
    }

    if (
      !args[rtpIndex] ||
      RTPLEVELLIST.indexOf(Number(args[rtpIndex])) === -1
    ) {
      throw "RTPLEVEL设置错误，请输入1 - 14 档位";
    }

    const rtpLevel = Number(args[rtpIndex]);

    const gameID = Number(args[gameIdIndex]);

    if (GAMEIDS.indexOf(gameID) === -1) {
      throw "gameID error: unknow gameID";
    }

    const count = Number(args[countIndex]);

    if (isNaN(count) || count < 1) {
      throw "count error";
    }

    const loop = Number(args[loopIndex]);

    if (isNaN(loop) || loop < 1) {
      throw "loop error";
    }

    console.log(
      `本次执行任务开始 gameID: ${gameID} count: ${count} loop: ${loop} RTPLEVEL: ${rtpLevel}`,
    );

    await initOperator(rtpLevel);

    const workbook = XLSX.utils.book_new();

    const isTest = isTestIndex ? args[isTestIndex] : 0

    const baseBet = baseBetIndex ? Number(args[baseBetIndex]) : BASEBET

    const baseRate = baseRateIndex ? Number(args[baseRateIndex]) : BASERATE

    for (let i = 0; i < loop; i++) {

      const { playerID } = await initPlayer(rtpLevel, isTest && Number(isTest)===1 ? true : false );

      const userGameStore = new UserGameStore(Number(playerID), gameID);

      const rows = [];

      for (let c = 0; c < count; c++) {
        const {
          totalBet: thisBet,
          totalWin: thisWin,
          winPositions,
          positionAmount,
          hashStr,
          icons,
          iconRate,
          record,
          specialStatus,
        } = await spinTest(gameID, +playerID, baseBet, baseRate);

        const totalBet = await userGameStore.getTotalBet()

        const totalWin = await userGameStore.getTotalWin()
        
        const currentRTP = await userGameStore.getCurrentRTP()

        const isNewer = await userGameStore.isNewer()

        rows.push({
          gameID: record?.gameID,
          playerID: playerID,
          isNewer,
          baseBet: baseBet ? baseBet : BASEBET,
          baseRate: baseRate ? baseRate : BASERATE,
          lineRate: GAMELINERATE.get(gameID),
          thisBet: String(thisBet),
          thisWin: String(thisWin),
          specialStatus: specialStatus==='neverIn' ? '普通摇奖' : specialStatus==='begin' ? '免费开始' : specialStatus==='end' ? '免费结束' : '免费摇奖',
          hashStr,
          icons: JSON.stringify(icons),
          winPositions: JSON.stringify(winPositions),
          positionAmount: JSON.stringify(positionAmount),
          totalBet: String(totalBet),
          totalWin: String(totalWin),
          currentRTP: String(currentRTP),
          moneyPoolInfo: record?.moneyPool ? JSON.stringify(record?.moneyPool) : ""
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);

      XLSX.utils.book_append_sheet(workbook, worksheet, `第${i + 1}轮`);

      await clearData(+playerID);
    }

    XLSX.set_fs(fs);

    /* output format determined by filename */
    await XLSX.writeFileXLSX(
      workbook,
      `${__dirname}/data/${gameID}-${moment().format("YYYY-MM-DD HH:mm:ss")}.xlsx`,
    );

    //输出日志
    console.log("Write to xls has finished");

    console.log("本次执行完毕");

    process.exit(0);

  } catch (error) {
    
    process.exit(0);
  }
};

main();
