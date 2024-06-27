import { FortuneDragonTHCardIconMap, FortuneDragonTHService, FortuneDragonTHSpecialStatus } from "services/games";
import { prismaClient } from "utils/prismaClient";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono } from "@hono/zod-openapi";
import { FortuneDragonTHInitSpinResult } from "dtos/fortuneDragonTH";
import { AuthService, GameService } from "services";
import { customAlphabet } from "nanoid";
import { redisClient } from "utils/redisClient";
import { WalletService, GameHistoryService } from "services";
import { Decimal } from "@prisma/client/runtime/library";
import { SpecialSpinStatus } from "gameConfigs";
import { GameHistoryStatus } from "@prisma/client";

const alphabet = "1234567890";
const nanoid = customAlphabet(alphabet, 11);

export const FortuneDragonTHRoute = new OpenAPIHono();

FortuneDragonTHRoute.post("/v2/spin", async (c) => {
  const formData: any = await c.req.formData();
  const game = await prismaClient.game.findFirst({
    where: {
      name: "fortune-dragonTH",
    },
  });
  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  const baseBet = +formData.get("cs");
  const baseRate = +formData.get("ml");
  const pf = Number(formData.get("pf"));
  const histroyid = BigInt(formData.get("id")); //这个是上一轮历史记录的id
  const session = await AuthService.verifyGameToken(token);
  const playerId = session.id;
  const spinId = nanoid();
  const result = await FortuneDragonTHService.spin({
    playerId: +playerId,
    baseBet,
    baseRate,
    lineRate: 5,
    currency: session.data?.currency,
    spinId,
    histroyid,
    pf,
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
    sw,
    sc,
    psid,
    cb,
    cbc,
    rns,
    st,
    fstc,
    cwc,
    df,
    ge,
    specialorl,
    specialrl,
    mdf,
  } = result;

  const gt = setting.wt || {};
  const winRates: any = Object.values(gt);
  let gwt = -1;

  for (const gw in winRates) {
    if (new Decimal(totalWin).dividedBy(totalBet)?.ceil()?.gte(+winRates[gw])) {
      gwt = +gw + 1;
    }
  }

  gwt = winPositions ? 1 : -1;

  const specialStatus = await redisClient.get(`FortuneDragonTH:freeMode:${playerId}`);

  // let nowMode = FortuneDragonTHSpecialStatus.COMMON;
  //   switch(specialStatus){
  //     case FortuneDragonTHSpecialStatus.NeverIN : nowMode = FortuneDragonTHSpecialStatus.COMMON;break;
  //     default :nowMode = FortuneDragonTHSpecialStatus.COMMON;
  //   }

  const freeModeIcon = await redisClient.get(`FortuneDragonTH:freeModeIcon:${playerId}`);
  const freeModeCount = await redisClient.get(`FortuneDragonTH:freeModeCount:${playerId}`);
  const statusResult = await FortuneDragonTHService.parseModeResultByFortuneDragonTHSpecialStatus(
    FortuneDragonTHSpecialStatus.NeverIN,
    {
      totalWin: totalWin.toNumber(),
      freeModeIcon: FortuneDragonTHCardIconMap.get(+(freeModeIcon || 0)) || 0,
      gwt,
      winPositions,
      freeModeCount: +(freeModeCount || "0"),
      iconRate,
      positionAmount,
      hashStr,
      lastSpinId: (record?.historyId || spinId).toString(),
      spinId: spinId,
      icons,
      baseBetRate: baseRate,
      baseBet: baseBet,
      pf: pf,
    },
  );
  let nst = 1;
  console.log("nst============" + nst, winPositions);
  if (winPositions && Object.values(winPositions).length != 0) {
    nst = 4;
  }
  console.log("nst============" + nst);
  if (nst == 1) {
    nst = specialrl ? 4 : 1;
  }
  console.log("nst============" + nst);
  const si = Object.assign(statusResult, {
    bl: balanceAfterWin,
    blab: balanceAfterSpin,
    blb: balanceBeforeSpin,
    rns: rns,
    fstc: fstc,
    ge: ge, //先写死  状态
    gwt: -1, //本轮是否大奖巨奖 -1 1 2
    cwc: cwc, //回合数
    df: df,
    mdf: mdf,
    //lw 这个字段没用后续删了
    //ist 不知道
    //irs 不知道
    //itw 不知道
    //fws 不知道
    //aw:0 没中奖是0
    //tw:0 没中奖是0
    rl: specialrl ? specialrl : icons,
    orl: specialorl ? specialorl : icons,
    ctw: 0, //ctw 这个字段不知道什么意思  但是要返回
    pmt: null, // 没中奖的时候是null 不知道又没用用
    sw: sw, //中奖的时候要返回
    sc: sc, //中奖的时候要返回
    cb: cb,
    cbc: cbc,
    psid: psid ? psid : spinId,
    st: st,
    nst: nst, // 没中奖的时候nst是1  中奖了 后续可以触发免费的时候 nst是4
  });

  if (record) {
    const detailRecord = {
      bl: balanceAfterWin,
      bt: record.createdAt.getTime(),
      tid: record.historyId,
      tba: totalBet,
      twla: totalWin.sub(totalBet).toNumber(),
      gd: si,
    };
    await GameHistoryService.pushDetail(
      BigInt(record.historyId),
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

FortuneDragonTHRoute.post("/v2/GameInfo/Get", async (c) => {
  const formData: any = await c.req.formData();
  const game = await prismaClient.game.findFirst({
    where: {
      name: "fortune-dragonTH",
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
  const playerId = session.id;
  await redisClient.del(`fortuneDragonTH:freeMode-historyId:${playerId}`); //先把历史记录的id删了
  const spinId = nanoid();
  const wallet = await WalletService.getWalletByUserId(+session.id, session.data?.currency || "BRL");
  if (!wallet) {
    throw new HTTPException(404, {
      message: "Invalid wallet",
    });
  }

  const history = await GameHistoryService.getFirstHistoryByUserId(+session.id, game.gameID);
  let si = null;
  if (false && history && history.detail && Array.isArray(history.detail) && history.detail.length === 1) {
    const gd = (history.detail as any)[0].gd;
    si = {
      hashr: gd.hashr,
      rl: gd.rl,
      orl: gd.orl,
      bl: gd.bl,
      blab: gd.blab,
      blb: gd.blb,
      tb: gd.tb,
      tbb: gd.tbb,
      ge: null,
      sid: gd.sid,
      psid: gd.psid,
      ctw: 0,
      aw: 0,
      cwc: 0,
      ml: gd.ml,
      cs: gd.cs,
    };
    console.log("走了历史记录", gd.orl);
  } else {
    const [_type, moneyPool] = await GameService.checkSpinNormalOrSpecial(+session.id, 57);
    const rlt = await FortuneDragonTHService.noPrizeSpin(
      {
        playerId: +session.id,
        baseBet: 0,
        baseRate: 0,
        lineRate: 5,
        currency: session.data?.currency,
        spinId,
        histroyid: 0,
      },
      moneyPool,
      false,
    );
    const statusResult = await FortuneDragonTHService.parseModeResultByFortuneDragonTHSpecialStatus(
      FortuneDragonTHSpecialStatus.NeverIN,
      {
        totalWin: 0,
        freeModeIcon: 0,
        gwt: 0, //暂时不知道什么意思
        winPositions: rlt.winPositions,
        freeModeCount: 0,
        iconRate: rlt.iconRate,
        positionAmount: rlt.positionAmount,
        hashStr: rlt.hashStr,
        lastSpinId: (rlt?.record?.historyId || spinId).toString(),
        spinId: spinId,
        icons: rlt.icons,
        baseBetRate: baseRate,
        baseBet: baseBet,

        pf: 0,
      },
    );
    console.log("statusResult", statusResult);
    si = {
      ...statusResult,
      bl: wallet.balance,
      blab: wallet.balance,
      blb: wallet.balance,
      ctw: 0,
      aw: 0,
      cwc: 0,
      rl: rlt.icons,
      orl: rlt.icons,
      nst: 1,
    };

    console.log("走了正常", si.orl);
  }

  console.log(si.ml, si.cs);

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
      cs: setting?.cs || [0.03, 0.1, 0.3, 0.9],
      ml: setting?.ml || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      mxl: setting?.mxl || 5,
      bl: wallet?.balance,
      inwe: false,
      iuwe: false,
      ls: {
        si,
      },
      cc: "PGC",
    },
    err: null,
  });
});
