import { prismaClient } from "utils/prismaClient";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono } from "@hono/zod-openapi";
import { fortuneElephantInitSpinResult } from "dtos/fortuneElephant";
import { AuthService, GameHistoryService, WalletService } from "services";
import { customAlphabet } from "nanoid";
import { redisClient } from "utils/redisClient";
import { Decimal } from "@prisma/client/runtime/library";
import {
  FortuneElephantCardIconMap,
  FortuneElephantService,
  FortuneElephantSpecialStatus,
} from "../../services/games/FortuneElephantService";
import { getFortuneTigerBalanceNotEnoughError } from "dtos";
import { SpecialSpinStatus } from "gameConfigs";
import { GameHistoryStatus } from "@prisma/client";
import { UserGameStore } from "models";

const alphabet = "1234567890";
const nanoid = customAlphabet(alphabet, 21);
export const wayRate = 30;

export const fortuneElephantRoute = new OpenAPIHono();

fortuneElephantRoute.post("/v2/spin", async (c) => {
  const formData: any = await c.req.formData();
  const game = await prismaClient.game.findFirst({
    where: {
      name: "ganesha-gold",
    },
  });
  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  const baseBet = +formData.get("cs");
  const baseRate = +formData.get("ml");
  const session = await AuthService.verifyGameToken(token);
  const playerId = session.id;
  const spinId = nanoid();
  const currency = session.data?.currency;
  const { enough, leftBalance } = await WalletService.checkBalanceIsEnough({
    playerId: +playerId,
    amount: baseBet * baseRate * wayRate,
    currency,
  });
  if (!enough) {
    return c.json(
      getFortuneTigerBalanceNotEnoughError(
        baseBet,
        baseRate,
        fortuneElephantInitSpinResult.dt.ls.si.rl,
        fortuneElephantInitSpinResult.dt.ls.si.psid,
        new Decimal(leftBalance).toNumber(),
      ) as any,
    );
  }
  const result = await FortuneElephantService.spin({
    playerId: +playerId,
    baseBet,
    baseRate,
    wayRate,
    currency,
    spinId,
  });
  if (!result) {
    throw new HTTPException(400, {
      message: "invalid spin",
    });
  }
  const {
    totalWin,
    totalBet,
    positionAmountWin,
    currentWinCount,
    winPositions,
    iconRate,
    positionAmount,
    symbolWayRate,
    balanceAfterSpin,
    balanceAfterWin,
    balanceBeforeSpin,
    freeSpinRelatedData,
    hashStr,
    icons,
    record,
  } = result;
  const gt = setting.wt || {};
  const winRates: any = Object.values(gt);
  let gwt = -1;
  for (const gw in winRates) {
    if (new Decimal(totalWin).dividedBy(totalBet)?.ceil()?.gte(+winRates[gw])) {
      gwt = +gw + 1;
    }
  }
  // 处理免费spin
  const specialStatus = await redisClient.get(`fortuneElephant:freeMode:${playerId}`);
  const freeModeIcon = await redisClient.get(`fortuneElephant:freeModeIcon:${playerId}`);
  const freeModeCount = await redisClient.get(`fortuneElephant:freeModeCount:${playerId}`);
  const statusResult = await FortuneElephantService.parseModeResultByFortuneElephantSpecialStatus(
    specialStatus as FortuneElephantSpecialStatus,
    {
      totalWin: totalWin.toNumber(),
      totalBet: totalBet.toNumber(),
      freeModeIcon: FortuneElephantCardIconMap.get(+(freeModeIcon || 0)) || 0,
      positionAmountWin: positionAmountWin.toNumber(),
      currentWinCount,
      gwt,
      winPositions,
      freeModeCount: +(freeModeCount || "0"),
      iconRate,
      positionAmount,
      symbolWayRate,
      hashStr,
      lastSpinId: (record?.historyId || spinId).toString(),
      spinId: spinId,
      icons,
      baseBetRate: baseRate,
      baseBet: baseBet,
      freeSpinRelatedData,
    },
  );
  const si = {
    ...fortuneElephantInitSpinResult.dt.ls.si,
    ...statusResult,
    bl: balanceAfterWin,
    blab: balanceAfterSpin,
    blb: balanceBeforeSpin,
  };

  if (record) {
    const detailRecord = {
      bl: balanceAfterWin,
      bt: record.createdAt.getTime(),
      tid: record.historyId.toString(),
      tba: totalBet,
      twla: totalWin.sub(totalBet).toNumber(),
      gd: si,
    };
    await GameHistoryService.pushDetail(
      record.historyId,
      detailRecord,
      specialStatus === SpecialSpinStatus.End || specialStatus === SpecialSpinStatus.NeverIN
        ? GameHistoryStatus.Success
        : GameHistoryStatus.Pending,
    );
  }
  return c.json({
    dt: {
      si,
    },
    err: null,
  });
});

fortuneElephantRoute.post("/v2/GameInfo/Get", async (c) => {
  const formData: any = await c.req.formData();
  const game = await prismaClient.game.findFirst({
    where: {
      name: "ganesha-gold",
    },
  });
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
  const spinId = nanoid();
  const wallet = await WalletService.getWalletByUserId(+session.id, session.data?.currency || "BRL");
  if (!wallet) {
    throw new HTTPException(404, {
      message: "Invalid wallet",
    });
  }
  const history = await GameHistoryService.getFirstHistoryByUserId(+session.id, game.gameID);
  let si = null;
  if (history && history.detail && Array.isArray(history.detail) && history.detail.length === 1) {
    console.log(`${JSON.stringify(fortuneElephantInitSpinResult.dt.ls.si, null, 2)}`);
    const gd = (history.detail as any)[0].gd;
    si = {
      ...fortuneElephantInitSpinResult.dt.ls.si,
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
      ml: fortuneElephantInitSpinResult.dt.ls.si.ml,
      cs: fortuneElephantInitSpinResult.dt.ls.si.cs,
    };
  } else {
    let userGameStore: null | UserGameStore = new UserGameStore(+session.id, game.gameID);
    const moneyPool = await userGameStore.getMoneyPool();
    const rlt = await FortuneElephantService.noPrizeSpin(
      {
        playerId: +session.id,
        baseBet: 0,
        baseRate: 0,
        wayRate,
        currency: session.data?.currency,
        spinId,
      },
      moneyPool,
      false,
    );
    userGameStore = null;
    console.log("rlt", rlt);
    const statusResult = await FortuneElephantService.parseModeResultByFortuneElephantSpecialStatus(
      FortuneElephantSpecialStatus.NeverIN,
      {
        totalWin: 0,
        totalBet: rlt.totalBet.toNumber(),
        positionAmountWin: 0,
        currentWinCount: 0,
        freeModeIcon: 0,
        gwt: -1,
        winPositions: rlt.winPositions,
        freeModeCount: 0,
        iconRate: rlt.iconRate,
        positionAmount: rlt.positionAmount,
        symbolWayRate: rlt.symbolWayRate,
        hashStr: rlt.hashStr,
        lastSpinId: (rlt?.record?.historyId || spinId).toString(),
        spinId: spinId,
        icons: rlt.icons,
        baseBetRate: baseRate,
        baseBet: baseBet,
        freeSpinRelatedData: null,
      },
    );
    si = {
      ...fortuneElephantInitSpinResult.dt.ls.si,
      ...statusResult,
      bl: wallet.balance,
      blab: wallet.balance,
      blb: wallet.balance,
      ctw: 0,
      aw: 0,
      cwc: 0,
      ml: fortuneElephantInitSpinResult.dt.ls.si.ml,
      cs: fortuneElephantInitSpinResult.dt.ls.si.cs,
    };
  }

  const currency = session.data?.currency;

  return c.json({
    dt: {
      fb: setting?.fb || {
        is: true,
        bm: 100,
        t: 0.15,
      },
      wt: setting?.wt || {
        mw: 5,
        bw: 20,
        mgw: 35,
        smgw: 50,
      },
      maxwm: setting?.maxwm || null,
      cs: setting?.cs && setting.cs.length > 0 ? [0.03, 0.1, 0.3, 0.9] : [],
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
