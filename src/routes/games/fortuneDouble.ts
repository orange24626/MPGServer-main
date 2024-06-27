import { FortuneDoubleCardIconMap, FortuneDoubleService, FortuneDoubleSpecialStatus } from "services/games";
import { prismaClient } from "utils/prismaClient";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono } from "@hono/zod-openapi";
import { fortuneDoubleInitSpinResult } from "dtos/fortuneDouble";
import { AuthService, GameService } from "services";
import { customAlphabet } from "nanoid";
import { redisClient } from "utils/redisClient";
import { WalletService, GameHistoryService } from "services";
import { Decimal } from "@prisma/client/runtime/library";
import { getFortuneTigerBalanceNotEnoughError } from "dtos";
import { historyIDGenerate } from "utils/historyIDGenerate";

const alphabet = "1234567890";
const nanoid = customAlphabet(alphabet, 21);
const lines = 30;
export const fortuneDoubleRoute = new OpenAPIHono();

fortuneDoubleRoute.post("/v2/Spin", async (c) => {
  const formData: any = await c.req.formData();
  // const game = await prismaClient.game.findFirst({
  //   where: {
  //     name: "fortune-double",
  //   },
  // });
  // const setting: any = game?.setting || {};
  const token = formData.get("atk");
  const baseBet = +formData.get("cs");

  const baseRate = +formData.get("ml");
  //console.log("cs " + baseBet + "ml " + baseRate);
  const session = await AuthService.verifyGameToken(token);
  const playerId = session.id;
  const spinId = historyIDGenerate(+session.id);
  const currency = session.data?.currency;

  // await redisClient.set(
  //   `fortuneDouble:freeMode:${playerId}`,
  //   FortuneDoubleSpecialStatus.NeverIN,
  // );
  // return;
 // let mtotalbet = baseBet * baseRate * lines;
  if (
    !(await WalletService.checkBalanceIsEnough({
      playerId: +playerId,
      amount: baseBet * baseRate * lines,
      currency,
    }))
  ) {
    //没有钱加钱  测试
    // const record = await WalletService.addFundByOperator({
    //   playerId: +playerId,
    //   amount: 11111,
    //   currency,
    //   detail: {
    //     operatorId: 1,
    //     operatorOrderID: "11",
    //     operatorName: "1",
    //   },
    // });
    //console.log("no money");
    return c.json(
      getFortuneTigerBalanceNotEnoughError(
        baseBet,
        baseRate,
        fortuneDoubleInitSpinResult.dt.ls.si.rl,
        fortuneDoubleInitSpinResult.dt.ls.si.psid,
      ) as any,
    );
  }
  const result = await FortuneDoubleService.spin({
    playerId: +playerId,
    baseBet,
    baseRate,
    lineRate: lines,
    currency,
    spinId,
  });
  if (!result) {
    throw new HTTPException(400, {
      message: "invalid spin",
    });
  }

  //console.log("aaaa result");
  //console.log(result);
  // const gt = setting.wt || {};
  // const winRates: any = Object.values(gt);
  // let gwt = -1;
  // for (const gw in winRates) {
  //   if (new Decimal(totalWin).dividedBy(totalBet)?.ceil()?.gte(+winRates[gw])) {
  //     gwt = +gw + 1;
  //   }
  // }

  // 打印 JSON 结构
  ////console.log(response);
  return c.json(result.response);
});

fortuneDoubleRoute.post("/v2/GameInfo/Get", async (c) => {
  //console.log("ffff -GameInfo/Get1");
  const formData: any = await c.req.formData();
  //console.log("ffff -GameInfo/Get");
  const game = await prismaClient.game.findFirst({
    where: {
      name: "fortune-double",
    },
  });
  if (!game) {
    throw new HTTPException(404, {
      message: "game not found",
    });
  }
  const setting: any = game?.setting || {};
  const token = formData.get("atk");
  // const baseBet = +formData.get("cs");
  // const baseRate = +formData.get("ml");
  const session = await AuthService.verifyGameToken(token);
  //const spinId = nanoid();
  const wallet = await WalletService.getWalletByUserId(+session.id, session.data?.currency || "BRL");
  if (!wallet) {
    throw new HTTPException(404, {
      message: "Invalid wallet",
    });
  }

  //console.log("ffff -GameInfo/Get-end");

  let mrl: number[] = [8, 16, 9, 11, 5, 18, 1, 2, 4, 12, 6, 17, 7, 15, 10];
  //0-18，2只能在中间出现。
  // mrl = mrl.map(() => {
  //   let rand = Math.floor(Math.random() * 19);
  //   // 如果生成的随机数是2，则重新生成，直到不是2为止
  //   while (rand === 2) {
  //     rand = Math.floor(Math.random() * 19);
  //   }
  //   return rand;
  // });

  const response = {
    dt: {
      fb: {
        is: true,
        bm: 100,
        t: 0.9,
      },
      wt: {
        mw: 3.0,
        bw: 5.0,
        mgw: 15.0,
        smgw: 35.0,
      },
      maxwm: null,
      cs: [0.03, 0.1, 0.3, 0.9],
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      mxl: 30,
      bl: wallet?.balance,
      inwe: false,
      iuwe: false,
      ls: {
        si: {
          wp: null,
          lw: null,
          lwm: null,
          slw: null,
          nk: null,
          sc: 0,
          fs: null,
          gwt: 0,
          fb: null,
          ctw: 0.0,
          pmt: null,
          cwc: 0,
          fstc: null,
          pcwc: 0,
          rwsp: null,
          hashr: null,
          ml: 2,
          cs: 0.3,
          rl: mrl,
          sid: "0",
          psid: "0",
          st: 1,
          nst: 1,
          pf: 0,
          aw: 0.0,
          wid: 0,
          wt: "C",
          wk: "0_C",
          wbn: null,
          wfg: null,
          blb: 0.0,
          blab: 0.0,
          bl: wallet?.balance,
          tb: 0.0,
          tbb: 0.0,
          tw: 0.0,
          np: 0.0,
          ocr: null,
          mr: null,
          ge: null,
        },
      },
      cc: "PGC",
    },
    err: null,
  };

  // 打印 JSON 结构
  // //console.log(response);

  return c.json(response);
});
