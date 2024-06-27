import { FortuneRabbitService, RabbitFreeModeStatus } from "services/games";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { FortuneRabbitSpinPostSchema, fortuneRabbitInitSpinResult } from "dtos/fortuneRabbit";
import { AuthService, GamePlayerService, GameService } from "services";
import { redisClient } from "utils/redisClient";
import { WalletService, GameHistoryService } from "services";
import { Decimal } from "@prisma/client/runtime/library";
import { getFortuneRabbitBalanceNotEnoughError } from "dtos";
import { SpecialSpinStatus } from "gameConfigs";
import { WalletStore } from "models/WalletStore";
import { historyIDGenerate } from "utils/historyIDGenerate";

export const fortuneRabbitRoute = new OpenAPIHono();

const FortuneRabbitSpinRoute = createRoute({
  description: "金钱兔",
  summary: "金钱兔",
  tags: ["游戏"],
  method: "post",
  path: "/v2/Spin",
  request: {
    body: {
      content: {
        "application/x-www-form-urlencoded": {
          schema: FortuneRabbitSpinPostSchema,
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

fortuneRabbitRoute.openapi(FortuneRabbitSpinRoute, async (c) => {
  const game = await GameService.getGameByName("fortune-rabbit");
  if (!game) {
    throw new HTTPException(404, {
      message: "Invalid gameName",
    });
  }

  const formData = c.req.valid("form");
  const session = await AuthService.verifyGameToken(formData?.atk);
  const setting: any = game.setting;
  const spinId = historyIDGenerate(+session.id);
  const lineRate = 10;
  const playerId = +session.id;

  const currency = session.data?.currency;

  let specialStatus = await redisClient.get(`fortuneRabbit:freeMode:${playerId}`);

  const baseBetRecord = await redisClient.get(`fortuneRabbit:baseBet:${playerId}`);

  const baseRateRecord = await redisClient.get(`fortuneRabbit:baseRate:${playerId}`);

  const baseBet =
    specialStatus !== RabbitFreeModeStatus.Begin && specialStatus !== RabbitFreeModeStatus.Process
      ? +formData?.cs
      : baseBetRecord
        ? +baseBetRecord
        : +formData?.cs;

  const baseRate =
    specialStatus !== RabbitFreeModeStatus.Begin && specialStatus !== RabbitFreeModeStatus.Process
      ? +formData?.ml
      : baseRateRecord
        ? +baseRateRecord
        : +formData?.ml;

  if (specialStatus !== RabbitFreeModeStatus.Begin && specialStatus !== RabbitFreeModeStatus.Process) {
    const { enough, leftBalance } = await WalletService.checkBalanceIsEnough({
      playerId: +playerId,
      amount: baseBet * baseRate * lineRate,
      currency,
    });

    if (!enough) {
      return c.json(
        getFortuneRabbitBalanceNotEnoughError(
          baseBet,
          baseRate,
          fortuneRabbitInitSpinResult.dt.si.rl,
          fortuneRabbitInitSpinResult.dt.si.psid,
          new Decimal(leftBalance).toNumber(),
        ) as any,
      );
    }
  }

  let walletStore: null | WalletStore = new WalletStore(playerId, currency);

  const result = await FortuneRabbitService.spin({
    playerId: +playerId,
    baseBet,
    baseRate,
    lineRate,
    currency,
    spinId,
    walletStore,
  });

  const { icons, iconRate, totalWin, totalBet, positionAmount, winPositions, hashStr, cpf, fs_aw, cptw, historyId } =
    result;

  const gt = setting.wt || {};
  const winRates: any = Object.values(gt);
  let gwt = -1;
  if (winRates) {
    for (const gw in winRates) {
      if (
        new Decimal(totalWin || "0")
          .dividedBy(totalBet || "1")
          ?.ceil()
          ?.gte(+winRates[gw])
      ) {
        gwt = +gw + 1;
      }
    }
  }

  const freeModeCount = +((await redisClient.get("fortuneRabbit:freeModeCount:" + session.id)) || 0);

  specialStatus = await redisClient.get(`fortuneRabbit:freeMode:${playerId}`);

  console.log(`免费摇奖状态：${specialStatus}，本次免费轮数：${freeModeCount}`);

  const statusResult = await FortuneRabbitService.parseModeResultByFreeModeStatus(
    specialStatus ? (specialStatus as RabbitFreeModeStatus) : RabbitFreeModeStatus.NeverIN,
    {
      lineRate,
      icons,
      iconRate,
      totalWin: Number(totalWin),
      winPositions,
      freeModeCount,
      hashStr,
      positionAmount,
      baseBet,
      baseBetRate: baseRate,
      lastSpinId: historyId,
      spinId,
      gwt,
      fs_aw,
      cpf,
      cptw,
    },
  );

  const si = {
    ...fortuneRabbitInitSpinResult.dt.si,
    ...statusResult,
    bl: +walletStore.afterWinBalance.toFixed(2),
    blab: +walletStore.afterSpinBalance.toFixed(2),
    blb: +walletStore.beforeSpinBalance.toFixed(2),
  };

  if (historyId) {
    const detailRecord = {
      bl: +walletStore.afterWinBalance.toFixed(2),
      bt: new Date().getTime(),
      tid: si.sid,
      tba: specialStatus === (RabbitFreeModeStatus.Process || RabbitFreeModeStatus.End) ? 0 : totalBet,
      twla:
        specialStatus === (RabbitFreeModeStatus.Process || RabbitFreeModeStatus.End)
          ? totalWin
          : totalWin.sub(totalBet).toNumber(),
      gd: si,
    };

    await GameService.pushDetailByStatus({
      specialStatus: specialStatus as SpecialSpinStatus,
      historyId: historyId as string,
      gameID: game.gameID,
      detail: detailRecord,
      balanceAfterSpin: new Decimal(walletStore.afterWinBalance).toNumber(),
    });
  }

  walletStore = null;

  return c.json({
    dt: {
      si,
    },
    err: null,
  });
});

fortuneRabbitRoute.post("/v2/GameInfo/Get", async (c) => {
  const formData = await c.req.formData();
  const token = formData.get("atk");
  const session = await AuthService.verifyGameToken(token as string);
  // await redisClient.del(`fortuneRabbit:freeModeCount:${session.id}`);
  // await redisClient.del(`fortuneRabbit:totalWin:${session.id}`);
  // await redisClient.del(`fortuneRabbit:freeMode:${session.id}`);

  const playerId = +session.id;

  const currency = session.data?.currency;
  const game = await GameService.getGameByName("fortune-rabbit");
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
      playerId: +session.id,
      currency: session.data?.currency || "BRL",
      isTest: player.isTest,
      balance: 0,
      operatorId: player.operatorId,
    });
  }

  const specialStatus = await redisClient.get(`fortuneRabbit:freeMode:${playerId}`);

  const history = await GameHistoryService.getFirstHistoryByUserId(+session.id, game.gameID);
  const gd = history ? (history.detail as any)[0]?.gd : null;
  let si = null;
  const icons = await FortuneRabbitService.getNoPrizeIcons();
  const { cpf, cptw } = await FortuneRabbitService.getTickets(icons, 0);
  const hashr = await FortuneRabbitService.getHashStr(icons, null, 0, 0, +session.id);
  const balance = new Decimal(wallet.balance).toFixed(2);

  si = {
    ...fortuneRabbitInitSpinResult.dt.si,
    bl: +balance,
    blab: +balance,
    blb: +balance,
    rl: icons,
    orl: icons,
    cs: gd?.cs ? gd?.cs : fortuneRabbitInitSpinResult.dt.si.cs,
    ml: gd?.ml ? gd?.ml : fortuneRabbitInitSpinResult.dt.si.ml,
    cpf,
    cptw,
    hashr,
    lw: null,
    rwsp: null,
    wp: null,
    fsct: null,
    fs: null,
    ge: [1, 11],
  };

  if(specialStatus === RabbitFreeModeStatus.Begin || specialStatus === RabbitFreeModeStatus.Process){
    const historyId = await redisClient.get(`fortuneRabbit:freeMode-historyId:${playerId}`)
    const detailListStrArr = await redisClient.lRange(`histories:1543462:detailList:${historyId}`, 0, -1);
    const detailList = detailListStrArr ? detailListStrArr.map((item) => JSON.parse(item)) : [];
    if(detailList.length && detailList[ detailList.length -1 ]['gd']){
      si = detailList[ detailList.length -1 ]['gd']
    }else{
      await redisClient.del(`fortuneRabbit:freeModeCount:${session.id}`);
      await redisClient.del(`fortuneRabbit:totalWin:${session.id}`);
      await redisClient.del(`fortuneRabbit:freeMode:${session.id}`);
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
      maxwm: setting?.maxwm || 5000,
      //  setting?.cs ||
      cs: [0.05, 0.5, 4],
      ml: setting?.ml || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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
