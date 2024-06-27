import { FortuneTigerCardIconMap, FortuneTigerService, FortuneTigerSpecialStatus } from "services/games";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono } from "@hono/zod-openapi";
import { fortuneTigerInitSpinResult } from "dtos/fortuneTiger";
import { AuthService, GamePlayerService, GameService } from "services";
import { redisClient } from "utils/redisClient";
import { WalletService, GameHistoryService } from "services";
import { Decimal } from "@prisma/client/runtime/library";
import { getFortuneTigerBalanceNotEnoughError } from "dtos";
import { UserGameStore } from "models";
import { SpecialSpinStatus } from "gameConfigs";
import { WalletStore } from "models/WalletStore";
import { historyIDGenerate } from "utils/historyIDGenerate";

export const fortuneTigerRoute = new OpenAPIHono();

fortuneTigerRoute.post("/v2/Spin", async (c) => {
  const timeStarted = Date.now();
  const formData: any = await c.req.formData();

  const gameName = "fortune-tiger";

  const game = await GameService.getGameByName(gameName);
  console.log("老虎旋转================游戏信息", JSON.stringify({ game }));
  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  const session = await AuthService.verifyGameToken(token);
  const playerId = session.id;
  const spinId = historyIDGenerate(+playerId);
  const currency = session.data?.currency;

  let specialStatus = await redisClient.get(`fortuneTiger:freeMode:${playerId}`);

  const baseBetRecord = await redisClient.get(`fortuneTiger:baseBet:${playerId}`);

  const baseRateRecord = await redisClient.get(`fortuneTiger:baseRate:${playerId}`);

  const baseBet = (specialStatus !== FortuneTigerSpecialStatus.Begin && specialStatus !== FortuneTigerSpecialStatus.Process) ? +formData.get("cs") : baseBetRecord ? +baseBetRecord : +formData.get("cs");

  const baseRate = (specialStatus !== FortuneTigerSpecialStatus.Begin && specialStatus !== FortuneTigerSpecialStatus.Process) ? +formData.get("ml") : baseRateRecord ? +baseRateRecord : +formData.get("ml");

  if (
    (specialStatus as FortuneTigerSpecialStatus) === FortuneTigerSpecialStatus.NeverIN ||
    !specialStatus ||
    specialStatus === FortuneTigerSpecialStatus.End
  ) {
    let checkTimer = new Date().getTime();
    const { enough, leftBalance } = await WalletService.checkBalanceIsEnough({
      playerId: +playerId,
      amount: baseBet * baseRate * 5,
      currency,
    });
    console.log("老虎旋转================检查余额耗时", Date.now() - checkTimer, "ms");
    if (!enough) {
      return c.json(
        getFortuneTigerBalanceNotEnoughError(
          baseBet,
          baseRate,
          fortuneTigerInitSpinResult.dt.ls.si.rl,
          fortuneTigerInitSpinResult.dt.ls.si.psid,
          new Decimal(leftBalance).toNumber(),
        ) as any,
      );
    }
  }
  let walletStore: WalletStore | null = new WalletStore(+playerId, currency);

  const result = await FortuneTigerService.spin({
    playerId: +playerId,
    baseBet,
    baseRate,
    lineRate: 5,
    currency,
    spinId,
    walletStore,
  });
  if (!result) {
    throw new HTTPException(400, {
      message: "invalid spin",
    });
  }
  const { totalWin, totalBet, winPositions, iconRate, positionAmount, hashStr, icons, historyId } = result;
  const gt = setting.wt || {};
  const winRates: any = Object.values(gt);
  let gwt = 1;
  for (const gw in winRates) {
    if (new Decimal(totalWin.toFixed(4)).divToInt(totalBet.toFixed(4)).gte(Number(winRates[gw]).toFixed(4))) {
      gwt += 1;
    }
  }

  specialStatus = await redisClient.get(`fortuneTiger:freeMode:${playerId}`);

  const freeModeIcon = await redisClient.get(`fortuneTiger:freeModeIcon:${playerId}`);
  const freeModeCount = await redisClient.get(`fortuneTiger:freeModeCount:${playerId}`);
  const statusResult = await FortuneTigerService.parseModeResultByFortuneTigerSpecialStatus(
    (specialStatus as FortuneTigerSpecialStatus) || FortuneTigerSpecialStatus.NeverIN,
    {
      totalWin: totalWin.toNumber(),
      freeModeIcon: FortuneTigerCardIconMap.get(+(freeModeIcon || 0)) || 0,
      gwt,
      winPositions,
      freeModeCount: +(freeModeCount || "0"),
      iconRate,
      positionAmount,
      hashStr,
      lastSpinId: historyId,
      spinId,
      icons,
      baseBetRate: baseRate,
      baseBet: baseBet,
    },
  );
  console.log("老虎旋转================结束", {
    balanceBefore: walletStore.beforeSpinBalance,
    balanceAfter: walletStore.afterSpinBalance,
    balanceWin: walletStore.afterWinBalance,
  });
  const si = {
    ...fortuneTigerInitSpinResult.dt.ls.si,
    ...statusResult,
    bl: +walletStore.afterWinBalance.toFixed(2),
    blab: +walletStore.afterSpinBalance.toFixed(2),
    blb: +walletStore.beforeSpinBalance.toFixed(2),
    gwt,
  };

  let twla = 0;
  if (specialStatus === FortuneTigerSpecialStatus.NeverIN || specialStatus === FortuneTigerSpecialStatus.Begin) {
    twla = totalWin.sub(totalBet.toFixed(4)).toNumber();
  } else {
    twla = Number(totalWin.toNumber().toFixed(4));
  }

  const detailRecord = {
    bl: +walletStore.afterWinBalance.toFixed(2),
    bt: new Date().getTime(),
    tid: historyId,
    tba:
      specialStatus === FortuneTigerSpecialStatus.NeverIN || specialStatus === FortuneTigerSpecialStatus.Begin
        ? totalBet
        : 0,
    twla,
    gd: si,
  };
  console.log("老虎旋转================pushDetail", specialStatus);
  await GameService.pushDetailByStatus({
    specialStatus: specialStatus as SpecialSpinStatus,
    historyId: historyId,
    gameID: 126,
    detail: detailRecord,
    balanceAfterSpin: +walletStore.afterWinBalance.toFixed(2),
  });

  const timeEnd = Date.now();
  walletStore = null;
  console.log("老虎旋转执行时间================", timeEnd - timeStarted, "ms");
  return c.json({
    dt: {
      si,
    },
    err: null,
  });
});

fortuneTigerRoute.post("/v2/GameInfo/Get", async (c) => {
  const formData: any = await c.req.formData();
  const game = await GameService.getGameByName("fortune-tiger");
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
  let userGameStore: null | UserGameStore = new UserGameStore(+session.id, 126);
  const spinId = historyIDGenerate(+session.id);
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
  const historyDetail = await GameHistoryService.getFirstHistoryDetailByUserID(+session.id, game.gameID);
  let si = null;
  if (historyDetail && Array.isArray(historyDetail) && historyDetail.length === 1) {
    const gd = (historyDetail as any)[0].gd;
    si = {
      ...fortuneTigerInitSpinResult.dt.ls.si,
      hashr: gd.hashr,
      rl: gd.rl,
      orl: gd.orl,
      bl: gd.bl,
      blab: gd.blab,
      blb: gd.blb,
      tb: gd.tb,
      tbb: gd.tbb,
      ge: gd.ge,
      sid: spinId.toString(),
      psid: spinId.toString(),
      ctw: 0,
      aw: 0,
      cwc: 0,
      ml: (await userGameStore.getBaseRate()) || fortuneTigerInitSpinResult.dt.ls.si.ml,
      cs: (await userGameStore.getBaseBet()) || fortuneTigerInitSpinResult.dt.ls.si.cs,
    };
  } else {
    let walletStore: WalletStore | null = new WalletStore(+session.id, session.data?.currency || "BRL");
    const moneyPool = await userGameStore.getMoneyPool();
    const rlt = await FortuneTigerService.noPrizeSpin(
      {
        playerId: +session.id,
        baseBet: 0,
        baseRate: 0,
        lineRate: 5,
        currency: session.data?.currency,
        spinId: spinId.toString(),
        walletStore,
      },
      moneyPool,
      false,
    );
    const statusResult = await FortuneTigerService.parseModeResultByFortuneTigerSpecialStatus(
      FortuneTigerSpecialStatus.NeverIN,
      {
        totalWin: 0,
        freeModeIcon: 0,
        gwt: -1,
        winPositions: rlt.winPositions,
        freeModeCount: 0,
        iconRate: rlt.iconRate,
        positionAmount: rlt.positionAmount,
        hashStr: rlt.hashStr,
        lastSpinId: rlt.historyId,
        spinId: spinId.toString(),
        icons: rlt.icons,
        baseBetRate: baseRate,
        baseBet: baseBet,
      },
    );

    console.log("老虎旋转================结束", {
      balanceBefore: walletStore.beforeSpinBalance,
      balanceAfter: walletStore.afterSpinBalance,
      balanceWin: walletStore.afterWinBalance,
    });

    si = {
      ...fortuneTigerInitSpinResult.dt.ls.si,
      ...statusResult,
      bl: walletStore.afterWinBalance,
      blab: walletStore.afterSpinBalance,
      blb: walletStore.beforeSpinBalance,
      ctw: 0,
      aw: 0,
      cwc: 0,
      ml: (await userGameStore.getBaseRate()) || fortuneTigerInitSpinResult.dt.ls.si.ml,
      cs: (await userGameStore.getBaseBet()) || fortuneTigerInitSpinResult.dt.ls.si.cs,
    };

    walletStore = null;
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
      // setting?.cs ||
      cs: [0.08, 0.8, 3, 10],
      ml: setting?.ml || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      mxl: setting?.mxl || 5,
      bl: wallet?.balance,
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
