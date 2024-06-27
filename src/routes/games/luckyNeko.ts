import { FortuneTigerSpecialStatus, LuckyNekoService, LuckyNekoStatus } from "services/games";
import { prismaClient } from "utils/prismaClient";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono } from "@hono/zod-openapi";
import { luckyNekoInitSpinResult } from "dtos/luckyNeko";
import { AuthService } from "services";
import { customAlphabet } from "nanoid";
import { redisClient } from "utils/redisClient";
import { WalletService, GameHistoryService } from "services";
import { getLuckyNekoBalanceNotEnoughError } from "dtos";
import { SpecialSpinStatus } from "gameConfigs";
import { Decimal } from "@prisma/client/runtime/library";
import { GameHistoryStatus } from "@prisma/client";

const alphabet = "1234567890";
const nanoid = customAlphabet(alphabet, 21);

export const luckyNekoRoute = new OpenAPIHono();

luckyNekoRoute.post("/v2/Spin", async (c) => {
  const timeStarted = Date.now();
  const formData: any = await c.req.formData();
  const game = await prismaClient.game.findFirst({
    where: {
      name: "lucky-neko",
    },
  });

  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  const baseBet = +formData.get("cs");
  const baseRate = +formData.get("ml");
  const session = await AuthService.verifyGameToken(token);
  const playerId = +session.id;
  const spinId = nanoid();
  const currency = session.data?.currency;
  const lineRate = 5;
  const { enough, leftBalance } = await WalletService.checkBalanceIsEnough({
    playerId: +playerId,
    amount: baseBet * baseRate * lineRate,
    currency,
  });
  if (!enough) {
    return c.json(
      getLuckyNekoBalanceNotEnoughError(
        baseBet,
        baseRate,
        luckyNekoInitSpinResult.dt.ls.si.rl,
        luckyNekoInitSpinResult.dt.ls.si.trl,
        luckyNekoInitSpinResult.dt.ls.si.psid,
        new Decimal(leftBalance).toNumber(),
      ) as any,
    );
  }

  const result = await LuckyNekoService.spin({
    playerId,
    baseBet,
    baseRate,
    lineRate: 5,
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
    winPositions,
    iconRate,
    positionAmount,
    balanceAfterSpin,
    balanceAfterWin,
    balanceBeforeSpin,
    hashStr,
    icons,
    record,
  } = result;
  const gt = setting.wt || {};
  const winRates: any = Object.values(gt);
  let gwt = -1;
  for (const gw in winRates) {
    if (totalWin.dividedBy(totalBet).ceil().gte(+winRates[gw])) {
      gwt = +gw + 1;
    }
  }
  const specialStatus = await redisClient.get(`luckyNeko:freeMode:${playerId}`);
  const freeModeCount = await redisClient.get(`luckyNeko:freeModeCount:${playerId}`);
  const statusResult = await LuckyNekoService.parseModeResultByFortuneOxSpecialStatus(
    specialStatus ? (specialStatus as LuckyNekoStatus) : LuckyNekoStatus.NeverIN,
    {
      icons,
      iconRate,
      totalWin: totalWin.toNumber(),
      winPositions,
      freeModeCount: Number(freeModeCount),
      hashStr,
      positionAmount,
      baseBet,
      baseBetRate: baseRate,
      lastSpinId: (record?.historyId || spinId).toString(),
      spinId,
      gwt,
    },
  );
  const si = {
    ...luckyNekoInitSpinResult.dt.ls.si,
    ...statusResult,
    bl: balanceAfterWin,
    blab: balanceAfterSpin,
    blb: balanceBeforeSpin,
  };

  if (record) {
    let twla = 0;
    if (specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.Begin) {
      twla = totalWin.sub(totalBet).toNumber();
    } else {
      twla = totalWin.toNumber();
    }

    const detailRecord = {
      bl: balanceAfterWin,
      bt: Array.isArray(record.detail) && record.detail?.length === 0 ? record.createdAt.getTime() : Date.now(),
      tid: record.historyId.toString(),
      tba: specialStatus === SpecialSpinStatus.NeverIN || specialStatus === SpecialSpinStatus.Begin ? totalBet : 0,
      twla,
      gd: si,
    };
    await GameHistoryService.pushDetail(
      record.historyId,
      detailRecord,
      specialStatus === FortuneTigerSpecialStatus.End || specialStatus === FortuneTigerSpecialStatus.NeverIN
        ? GameHistoryStatus.Success
        : GameHistoryStatus.Pending,
    );
  }
  const timeEnd = Date.now();
  console.log("招财猫旋转执行时间================", timeEnd - timeStarted, "ms");
  return c.json({
    dt: {
      si,
    },
    err: null,
  });
});

luckyNekoRoute.post("/v2/GameInfo/Get", async (c) => {
  const formData: any = await c.req.formData();
  const game = await prismaClient.game.findFirst({
    where: {
      name: "lucky-neko",
    },
  });
  if (!game) throw new HTTPException(404, { message: "game not found" });
  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  const baseBet = +formData.get("cs");
  const baseRate = +formData.get("ml");
  const session = await AuthService.verifyGameToken(token);
  const playerId = session.id;
  const spinId = nanoid();
  let wallet = await WalletService.getWalletByUserId(+session.id, session.data?.currency || "BRL");
  if (!wallet) {
    const player = await prismaClient.gamePlayer.findFirst({
      where: {
        id: +session.id,
      },
    });
    if (!player) throw new HTTPException(404, { message: "Invalid player" });

    wallet = await WalletService.createWallet({
      gamePlayer: {
        connect: {
          id: player.id,
        },
      },
      currency: session.data?.currency || "BRL",
      isTest: player.isTest,
      balance: 0,
      operator: {
        connect: {
          id: player.operatorId,
        },
      },
    });
  }

  let si = luckyNekoInitSpinResult.dt.ls.si;

  const currency = session.data?.currency;

  return c.json({
    dt: {
      fb: setting?.fb || {
        is: true,
        bm: 100,
        t: 0.15,
      },
      wt: {
        mw: 5,
        bw: 20,
        mgw: 35,
        smgw: 50,
      },
      maxwm: setting?.maxwm || null,
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
