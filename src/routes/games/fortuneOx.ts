import { FortuneOxService, FortuneSpecialStatus } from "services/games";
import { prismaClient } from "utils/prismaClient";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { FortuneOxSpinPostSchema, fortuneOxInitSpinResult } from "dtos/fortuneOx";
import { AuthService, GamePlayerService, GameService } from "services";
import { redisClient } from "utils/redisClient";
import { WalletService, GameHistoryService } from "services";
import { Decimal } from "@prisma/client/runtime/library";
import { getFortuneOxBalanceNotEnoughError } from "dtos";
import { SpecialSpinStatus } from "gameConfigs";
import { GameHistoryStatus } from "@prisma/client";

import { sqsClient, ACTIONS, MESSAGEGROUP } from "services/SqsService";
import { WalletStore } from "models/WalletStore";
import { historyIDGenerate } from "utils/historyIDGenerate";

export const fortuneOxRoute = new OpenAPIHono();

const FortuneOxSpinRoute = createRoute({
  description: "十倍金牛",
  summary: "十倍金牛",
  tags: ["游戏"],
  method: "post",
  path: "/v2/Spin",
  request: {
    body: {
      content: {
        "application/x-www-form-urlencoded": {
          schema: FortuneOxSpinPostSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Retrieve the user",
    },
  },
});

fortuneOxRoute.openapi(FortuneOxSpinRoute, async (c) => {
  const game = await GameService.getGameByName("fortune-ox");
  if (!game) {
    throw new HTTPException(404, {
      message: "Invalid gameName",
    });
  }

  const formData = c.req.valid("form");
  const session = await AuthService.verifyGameToken(formData?.atk);
  const setting: any = game.setting;
  const playerId = session.id;
  const spinId = historyIDGenerate(+playerId);
  const lineRate = 10;

  const currency = session.data?.currency;

  let specialStatus = await redisClient.get(`fortuneOx:freeMode:${playerId}`);

  const baseBetRecord = await redisClient.get(`fortuneOx:baseBet:${playerId}`);

  const baseRateRecord = await redisClient.get(`fortuneOx:baseRate:${playerId}`);

  const baseBet = (specialStatus !== FortuneSpecialStatus.Begin && specialStatus !== FortuneSpecialStatus.Process) ? +formData?.cs : baseBetRecord ? +baseBetRecord :  +formData?.cs;

  const baseRate = (specialStatus !== FortuneSpecialStatus.Begin && specialStatus !== FortuneSpecialStatus.Process) ? +formData?.ml : baseRateRecord ? +baseRateRecord :  +formData?.ml;

  if (specialStatus !== FortuneSpecialStatus.Begin && specialStatus !== FortuneSpecialStatus.Process) {
    const { enough, leftBalance } = await WalletService.checkBalanceIsEnough({
      playerId: +playerId,
      amount: baseBet * baseRate * lineRate,
      currency,
    });

    if (!enough) {
      return c.json(
        getFortuneOxBalanceNotEnoughError(
          baseBet,
          baseRate,
          fortuneOxInitSpinResult.dt.si.rl,
          fortuneOxInitSpinResult.dt.si.psid,
          new Decimal(leftBalance).toNumber(),
        ) as any,
      );
    }
  }

  const startTime = Date.now();
  const walletStore = new WalletStore(+playerId, currency);

  const result = await FortuneOxService.spin({
    playerId: +playerId,
    baseBet,
    baseRate,
    walletStore,
    lineRate,
    currency,
    spinId,
  });

  const { totalWin, totalBet, winPositions, iconRate, positionAmount, hashStr, icons, historyId } = result;
  const gt = setting.wt || {};
  const winRates: any = Object.values(gt);
  let gwt = -1;
  for (const gw in winRates) {
    if (new Decimal(totalWin).dividedBy(totalBet)?.ceil()?.gte(+winRates[gw])) {
      gwt = +gw + 1;
    }
  }

  const freeModeCount = +((await redisClient.get("fortuneOx:freeModeCount:" + session.id)) || 0);

  specialStatus = await redisClient.get(`fortuneOx:freeMode:${playerId}`);

  console.log(`免费摇奖状态：${specialStatus}，本次免费轮数：${freeModeCount}`);

  const statusResult = await FortuneOxService.parseModeResultByFortuneOxSpecialStatus(
    specialStatus ? (specialStatus as FortuneSpecialStatus) : FortuneSpecialStatus.NeverIN,
    {
      icons,
      iconRate,
      totalWin: totalWin.toNumber(),
      winPositions,
      freeModeCount,
      hashStr,
      positionAmount,
      baseBet,
      baseBetRate: baseRate,
      lastSpinId: historyId as string,
      spinId,
      gwt,
    },
  );

  const si = {
    ...fortuneOxInitSpinResult.dt.si,
    ...statusResult,
    bl: Number(walletStore.afterWinBalance.toFixed(2)),
    blab: Number(walletStore.afterSpinBalance.toFixed(2)),
    blb: Number(walletStore.beforeSpinBalance.toFixed(2)),
  };

  const detailRecord = {
    bl: Number(walletStore.afterWinBalance.toFixed(2)),
    bt: new Date().getTime(),
    tid: spinId,
    tba: totalBet,
    twla: specialStatus === FortuneSpecialStatus.Process ? 0 : totalWin.sub(totalBet).toNumber(),
    gd: si,
  };
  await GameService.pushDetailByStatus({
    specialStatus: specialStatus as SpecialSpinStatus,
    historyId: historyId as string,
    gameID: game.gameID,
    detail: detailRecord,
    balanceAfterSpin: new Decimal(walletStore.afterWinBalance).toNumber(),
  });
  console.log("金牛spin耗时:", Date.now() - startTime, "ms");

  return c.json({
    dt: {
      si,
    },
    err: null,
  });
});

fortuneOxRoute.post("/v2/GameInfo/Get", async (c) => {
  const formData = await c.req.formData();
  const token = formData.get("atk");
  const session = await AuthService.verifyGameToken(token as string);
  const game = await GameService.getGameByName("fortune-ox");
  if (!game) {
    throw new HTTPException(404, {
      message: "Invalid gameName",
    });
  }
  const setting: any = game.setting;
  let wallet = await WalletService.getWalletByUserId(+session.id, session.data?.currency || "BRL");
  if (!wallet) {
    const player = await GamePlayerService.getGamePlayerById(+session.id);
    if (!player) {
      throw new HTTPException(404, {
        message: "Invalid player",
      });
    }
    wallet = await WalletService.createWallet({
      playerId: player.id,
      currency: session.data?.currency || "BRL",
      isTest: player.isTest,
      balance: 0,
      operatorId: player.operatorId,
    });
  }

  const history = await GameHistoryService.getFirstHistoryByUserId(+session.id, game.gameID);

  let si = null;

  const gd = history ? (history.detail as any)[0]?.gd : null;

  const icons = await FortuneOxService.getNoPrizeIcons();
  const hashr = await FortuneOxService.getHashStr(icons, null, 0, 0, +session.id);
  const balance = new Decimal(wallet.balance).toFixed(2);
  si = {
    ...fortuneOxInitSpinResult.dt.si,
    cs: gd?.cs ? gd?.cs : fortuneOxInitSpinResult.dt.si.cs,
    ml: gd?.ml ? gd?.ml : fortuneOxInitSpinResult.dt.si.ml,
    bl: +balance,
    blab: +balance,
    blb: +balance,
    rl: icons,
    orl: icons,
    hashr,
  };
  const currency = session.data?.currency;

  const playerId = +session.id;

  const gameID = 98

  const specialStatus = await redisClient.get(`fortuneOx:freeMode:${playerId}`);

  if(specialStatus === FortuneSpecialStatus.Begin || specialStatus === FortuneSpecialStatus.Process){
    const historyId = await redisClient.get(`fortuneOx:freeMode-historyId:${playerId}`)
    const detailListStrArr = await redisClient.lRange(`histories:${gameID}:detailList:${historyId}`, 0, -1);
    const detailList = detailListStrArr ? detailListStrArr.map((item) => JSON.parse(item)) : [];
    if(detailList.length && detailList[ detailList.length -1 ]['gd']){
      si = detailList[ detailList.length -1 ]['gd']
    }else{
      await redisClient.del(`fortuneOx:freeModeCount:${playerId}`);
      await redisClient.del(`fortuneOx:freeMode:${playerId}`);
    }
  }

  return c.json({
    dt: {
      fb: setting?.fb || {
        is: true,
        bm: 100,
        t: 0.15,
      },
      // setting?.wt ||
      wt: {
        mw: 5,
        bw: 20,
        mgw: 35,
        smgw: 50,
      },
      maxwm: setting?.maxwm || null,
      // setting?.cs ||
      cs: [0.05, 0.5, 4],
      // setting?.ml ||
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      mxl: setting?.mxl || 10,
      bl: +balance,
      inwe: false,
      iuwe: false,
      ls: {
        si,
      },
      // cc: setting?.cc || "BRL",
      cc: currency || "BRL",
    },
    err: null,
  });
});
