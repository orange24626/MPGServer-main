import { FortuneDragonService } from "services/games";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono } from "@hono/zod-openapi";
import { fortuneDragonInitSpinResult } from "dtos/fortuneDragon";
import { AuthService, GamePlayerService, GameService } from "services";
import { redisClient } from "utils/redisClient";
import { WalletService, GameHistoryService } from "services";
import { Decimal } from "@prisma/client/runtime/library";
import { FortuneDragonCardIconMap, SpecialSpinStatus } from "gameConfigs";
import { getFortuneDragonBalanceNotEnoughError } from "dtos";
import { UserGameStore } from "models";
import { WalletStore } from "models/WalletStore";
import { historyIDGenerate } from "utils/historyIDGenerate";

export const fortuneDragonRoute = new OpenAPIHono();

fortuneDragonRoute.post("/v2/Spin", async (c) => {
  const formData: any = await c.req.formData();

  const gameName = "fortune-dragon";

  const game = await GameService.getGameByName(gameName);

  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  
  const fb = formData.get("fb");
  
  const session = await AuthService.verifyGameToken(token);
  const playerId = session.id;
  const spinId = historyIDGenerate(+playerId);
  const currency = session.data?.currency;
  const prizeAssurance = +fb === 2;
  

  let specialStatus = await redisClient.get(`fortuneDragon:freeMode:${playerId}`);

  const baseBetRecord = await redisClient.get(`fortuneDragon:baseBet:${playerId}`);

  const baseRateRecord = await redisClient.get(`fortuneDragon:baseRate:${playerId}`);

  const baseBet = (!specialStatus || specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.End) ? +formData.get("cs") : baseBetRecord ? +baseBetRecord :  +formData.get("cs");

  const baseRate = (!specialStatus || specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.End) ? +formData.get("ml") : baseRateRecord ? +baseRateRecord :  +formData.get("ml");

  let tb = baseBet * baseRate * 5;

  if (!specialStatus || specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.End) {
    console.log("龙:需要检查余额是否足够=============", specialStatus);
    const { enough, leftBalance } = await WalletService.checkBalanceIsEnough({
      playerId: +playerId,
      amount: prizeAssurance ? tb * 5 : tb,
      currency,
    });
    if (!enough) {
      return c.json(
        getFortuneDragonBalanceNotEnoughError(
          baseBet,
          baseRate,
          fortuneDragonInitSpinResult.dt.ls.si.orl,
          fortuneDragonInitSpinResult.dt.ls.si.psid,
          new Decimal(leftBalance).toNumber(),
        ) as any,
      );
    }
  }

  const walletStore = new WalletStore(+playerId, currency);

  const result = await FortuneDragonService.spin({
    playerId: +playerId,
    baseBet,
    baseRate,
    lineRate: 5,
    currency,
    spinId: spinId.toString(),
    prizeAssurance,
    walletStore,
  });
  if (!result) {
    throw new HTTPException(400, {
      message: "invalid spin",
    });
  }
  const { totalWin, totalBet, winPositions, iconRate, positionAmount, hashStr, icons, historyId, extraRates, addUp } =
    result;
  const gt = setting.wt || {};
  const winRates: any = Object.values(gt);
  let gwt = -1;
  for (const gw in winRates) {
    if (new Decimal(totalWin).dividedBy(totalBet)?.ceil()?.gte(+winRates[gw])) {
      gwt = +gw + 1;
    }
  }
  specialStatus = await redisClient.get(`fortuneDragon:freeMode:${playerId}`);
  const freeModeIcon = await redisClient.get(`fortuneDragon:freeModeIcon:${playerId}`);
  const freeModeCount = await redisClient.get(`fortuneDragon:freeModeCount:${playerId}`);

  console.log("addUp===========", addUp);

  const statusResult = await FortuneDragonService.parseModeResultBySpecialSpinStatus(
    (specialStatus as SpecialSpinStatus) || SpecialSpinStatus.NeverIN,
    {
      totalWin: totalWin.toNumber(),
      freeModeIcon: FortuneDragonCardIconMap.get(+(freeModeIcon || 0)) || 0,
      gwt,
      winPositions,
      freeModeCount: +(freeModeCount || "0"),
      iconRate,
      positionAmount,
      hashStr,
      lastSpinId: historyId,
      spinId: spinId,
      icons,
      baseBetRate: baseRate,
      baseBet: baseBet,
      extraRates,
      addUp,
      prizeAssurance,
    },
  );
  const si = {
    ...fortuneDragonInitSpinResult.dt.ls.si,
    ...statusResult,
    bl: Number(walletStore.afterWinBalance.toFixed(2)),
    blab: Number(walletStore.afterSpinBalance.toFixed(2)),
    blb: Number(walletStore.beforeSpinBalance.toFixed(2)),
    fb: +fb === 2 ? 2 : false,
  };

  if (historyId) {
    let twla = 0;
    if (specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.Begin) {
      twla = totalWin.sub(totalBet).toNumber();
    } else {
      twla = totalWin.toNumber();
    }

    const detailRecord = {
      bl: walletStore.afterWinBalance,
      bt: new Date().getTime(),
      tid: spinId,
      tba: specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.Begin ? totalBet : 0,
      twla,
      gd: {
        ...si,
        mf: {
          ms: si.mf.ms,
          mt: si.mf.mt,
          mi: si.mf.mi,
        },
      },
    };

    await GameService.pushDetailByStatus({
      specialStatus: specialStatus as SpecialSpinStatus,
      historyId: historyId as string,
      gameID: game.gameID,
      detail: detailRecord,
      balanceAfterSpin: new Decimal(walletStore.afterWinBalance).toNumber(),
    });
  }
  return c.json({
    dt: {
      si,
    },
    err: null,
  });
});

fortuneDragonRoute.post("/v2/GameInfo/Get", async (c) => {
  const formData: any = await c.req.formData();
  const game = await GameService.getGameByName("fortune-dragon");
  if (!game) {
    throw new HTTPException(404, {
      message: "game not found",
    });
  }
  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  const baseBet = +formData.get("cs");
  const baseRate = +formData.get("ml");
  const session = await AuthService.verifyGameToken(token);
  const spinId = historyIDGenerate(+session.id);
  let wallet = await WalletService.getWalletByUserId(+session.id, session.data?.currency || "BRL");
  let userGameStore: null | UserGameStore = new UserGameStore(+session.id, 126);
  userGameStore.setBaseRate(baseRate);
  userGameStore.setBaseBet(baseBet);
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
  if (history && history.detail && Array.isArray(history.detail) && history.detail.length === 1) {
    const gd = (history.detail as any)[0].gd;
    si = {
      ...fortuneDragonInitSpinResult.dt.ls.si,
      hashr: gd.hashr,
      rl: gd.rl,
      orl: gd.orl,
      bl: gd.bl,
      blab: gd.blab,
      blb: gd.blb,
      tb: gd.tb,
      tbb: gd.tbb,
      ge: gd.ge,
      sid: gd.sid,
      psid: gd.psid,
      ctw: 0,
      aw: 0,
      cwc: 0,
      ml: (await userGameStore.getBaseRate()) || fortuneDragonInitSpinResult.dt.ls.si.ml,
      cs: (await userGameStore.getBaseBet()) || fortuneDragonInitSpinResult.dt.ls.si.cs,
    };
  } else {
    const userGameStore = new UserGameStore(+session.id, 126);

    const moneyPool = await userGameStore.getMoneyPool();

    const walletStore = new WalletStore(+session.id, session.data?.currency);

    const rlt = await FortuneDragonService.noPrizeSpin(
      {
        playerId: +session.id,
        baseBet: 0,
        baseRate: 0,
        lineRate: 5,
        currency: session.data?.currency,
        spinId,
        walletStore,
      },
      moneyPool,
      false,
    );
    const statusResult = await FortuneDragonService.parseModeResultBySpecialSpinStatus(SpecialSpinStatus.NeverIN, {
      totalWin: 0,
      freeModeIcon: 0,
      gwt: -1,
      winPositions: rlt.winPositions,
      freeModeCount: 0,
      iconRate: rlt.iconRate,
      positionAmount: rlt.positionAmount,
      hashStr: rlt.hashStr,
      lastSpinId: (rlt.historyId || spinId).toString(),
      spinId: spinId,
      icons: rlt.icons,
      baseBetRate: baseRate,
      baseBet: baseBet,
      extraRates: rlt.extraRates,
      addUp: new Decimal(0),
      prizeAssurance: false,
    });

    const balance = new Decimal(wallet.balance).toFixed(2);
    si = {
      ...fortuneDragonInitSpinResult.dt.ls.si,
      ...statusResult,
      bl: +balance,
      blab: +balance,
      blb: +balance,
      ctw: 0,
      aw: 0,
      cwc: 0,
      ml: (await userGameStore.getBaseRate()) || fortuneDragonInitSpinResult.dt.ls.si.ml,
      cs: (await userGameStore.getBaseBet()) || fortuneDragonInitSpinResult.dt.ls.si.cs,
    };
  }

  const currency = session.data?.currency;

  userGameStore = null;

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
      //  setting?.cs ||
      cs: [0.08, 0.8, 3, 10],
      ml: setting?.ml || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      mxl: setting?.mxl || 5,
      bl: +new Decimal(wallet.balance).toFixed(2),
      inwe: false,
      iuwe: false,
      ls: {
        si,
      },
      cc: currency || "PGC",
    },
    err: null,
  });
});
