import { FortuneMouseCardIconMap, FortuneMouseService, FortuneMouseSpecialStatus } from "services/games";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono } from "@hono/zod-openapi";
import { fortuneMouseInitSpinResult } from "dtos/fortuneMouse";
import { AuthService, GamePlayerService, GameService } from "services";
import { redisClient } from "utils/redisClient";
import { WalletService, GameHistoryService } from "services";
import { getFortuneMouseBalanceNotEnoughError } from "dtos";
import { SlotController, UserGameStore } from "models";
import { FortuneMouseIconWeights, SpecialSpinStatus } from "gameConfigs";
import { Decimal } from "@prisma/client/runtime/library";
import { WalletStore } from "models/WalletStore";
import { historyIDGenerate } from "utils/historyIDGenerate";

export const fortuneMouseRoute = new OpenAPIHono();

fortuneMouseRoute.post("/v2/Spin", async (c) => {
  const timeStarted = Date.now();
  const formData: any = await c.req.formData();
  const game = await GameService.getGameByName("fortune-mouse");

  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  const session = await AuthService.verifyGameToken(token);
  const playerId = +session.id;
  const spinId = historyIDGenerate(playerId);
  const currency = session.data?.currency;

  let specialStatus = await redisClient.get(`fortuneMouse:freeMode:${playerId}`);

  const baseBetRecord = await redisClient.get(`fortuneMouse:baseBet:${playerId}`);

  const baseRateRecord = await redisClient.get(`fortuneMouse:baseRate:${playerId}`);

  const baseBet =
    specialStatus !== FortuneMouseSpecialStatus.Begin && specialStatus !== FortuneMouseSpecialStatus.Process
      ? +formData.get("cs")
      : baseBetRecord
        ? +baseBetRecord
        : +formData.get("cs");

  const baseRate =
    specialStatus !== FortuneMouseSpecialStatus.Begin && specialStatus !== FortuneMouseSpecialStatus.Process
      ? +formData.get("ml")
      : baseRateRecord
        ? +baseRateRecord
        : +formData.get("ml");

  const { enough, leftBalance } = await WalletService.checkBalanceIsEnough({
    playerId: +playerId,
    amount: baseBet * baseRate * 5,
    currency,
  });
  if (
    !specialStatus ||
    specialStatus === FortuneMouseSpecialStatus.NeverIN ||
    specialStatus === FortuneMouseSpecialStatus.End
  ) {
    if (!enough) {
      return c.json(
        getFortuneMouseBalanceNotEnoughError(
          baseBet,
          baseRate,
          fortuneMouseInitSpinResult.dt.ls.si.rl,
          fortuneMouseInitSpinResult.dt.ls.si.psid,
          new Decimal(leftBalance).toNumber(),
        ) as any,
      );
    }
  }

  let walletStore: null | WalletStore = new WalletStore(playerId, currency);

  const result = await FortuneMouseService.spin({
    playerId,
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
  let gwt = -1;
  for (const gw in winRates) {
    if (totalWin.dividedBy(totalBet).ceil().gte(+winRates[gw])) {
      gwt = +gw + 1;
    }
  }
  specialStatus = await redisClient.get(`fortuneMouse:freeMode:${playerId}`);
  const freeModeIcon = await redisClient.get(`fortuneMouse:freeModeIcon:${playerId}`);
  const freeModeCount = await redisClient.get(`fortuneMouse:freeModeCount:${playerId}`);
  const statusResult = await FortuneMouseService.parseModeResultByFortuneMouseSpecialStatus(
    (specialStatus as FortuneMouseSpecialStatus) || FortuneMouseSpecialStatus.NeverIN,
    {
      totalWin: totalWin.toNumber(),
      freeModeIcon: FortuneMouseCardIconMap.get(+(freeModeIcon || 0)) || 0,
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
  const si = {
    ...fortuneMouseInitSpinResult.dt.ls.si,
    ...statusResult,
    bl: +walletStore.afterWinBalance.toFixed(2),
    blab: +walletStore.afterSpinBalance.toFixed(2),
    blb: +walletStore.beforeSpinBalance.toFixed(2),
  };

  if (historyId) {
    let twla = 0;
    if (specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.Begin) {
      twla = totalWin.sub(totalBet).toNumber();
    } else {
      twla = totalWin.toNumber();
    }

    const detailRecord = {
      bl: +walletStore.afterWinBalance.toFixed(2),
      bt: new Date().getTime(),
      tid: spinId,
      tba: specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.Begin ? totalBet : 0,
      twla,
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
  const timeEnd = Date.now();
  walletStore = null;

  console.log("鼠鼠旋转执行时间================", timeEnd - timeStarted, "ms");
  return c.json({
    dt: {
      si,
    },
    err: null,
  });
});

fortuneMouseRoute.post("/v2/GameInfo/Get", async (c) => {
  const formData: any = await c.req.formData();
  const game = await GameService.getGameByName("fortune-mouse");
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
  const playerId = session.id;
  let userGameStore: null | UserGameStore = new UserGameStore(+session.id, 68);
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
  const history = await GameHistoryService.getFirstHistoryByUserId(+session.id, game.gameID);
  let si = null;
  if (history && history.detail && Array.isArray(history.detail) && history.detail.length === 1) {
    let mrl: number[] = [1, 1, 1, 0, 0, 0, 2, 2, 2];

    // 使用.map()将每个元素替换为0到6之间的随机整数
    mrl = mrl.map(() => Math.floor(Math.random() * 7));

    const gd = (history.detail as any)[0].gd;
    si = {
      ...fortuneMouseInitSpinResult.dt.ls.si,
      hashr: gd.hashr,
      rl: mrl,
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
      ml: (await userGameStore.getBaseRate()) || fortuneMouseInitSpinResult.dt.ls.si.ml,
      cs: (await userGameStore.getBaseBet()) || fortuneMouseInitSpinResult.dt.ls.si.cs,
    };
  } else {
    let slotController: null | SlotController = new SlotController({
      userId: +session.id,
      iconWeightConfig: FortuneMouseIconWeights,
    });
    const moneyPool = await userGameStore.getMoneyPool();
    slotController = null;

    const walletStore = new WalletStore(+session.id, session.data?.currency || "BRL");

    const rlt = await FortuneMouseService.noPrizeSpin(
      {
        playerId: +playerId,
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
    const statusResult = await FortuneMouseService.parseModeResultByFortuneMouseSpecialStatus(
      FortuneMouseSpecialStatus.NeverIN,
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
        spinId: spinId,
        icons: rlt.icons,
        baseBetRate: baseRate,
        baseBet: baseBet,
      },
    );
    const balance = new Decimal(wallet.balance).toFixed(2);
    si = {
      ...fortuneMouseInitSpinResult.dt.ls.si,
      ...statusResult,
      bl: +balance,
      blab: +balance,
      blb: +balance,
      ctw: 0,
      aw: 0,
      cwc: 0,
      ml: (await userGameStore.getBaseRate()) || fortuneMouseInitSpinResult.dt.ls.si.ml,
      cs: (await userGameStore.getBaseBet()) || fortuneMouseInitSpinResult.dt.ls.si.cs,
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
      // setting?.cs ||
      cs: [0.1, 1, 3, 10],
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
