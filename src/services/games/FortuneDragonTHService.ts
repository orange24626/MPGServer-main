import { ConfigThreeColumnsCardWeight, GameHistory, MoneyPoolMachine } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import random from "random";
import { GameHistoryService, GamePlayerService, GameService, WalletService } from "services";
import { GameConfigService } from "services/GameConfigService";
import { GameMoneyPoolService } from "services/GameMoneyPoolService";
import { redisClient } from "utils/redisClient";
import DragonTHLogic from "./Logic/DragonTHLogic";
import { bigint, boolean } from "zod";
import { methodOf } from "lodash";

export interface FortuneDragonTHSpinParams {
  playerId: number;
  baseBet: number;
  baseRate: number;
  lineRate: number;
  currency: string;
  spinId: string;
  histroyid: bigint;
  pf: number;
  // cwc:number;
}

export enum FortuneDragonTHSpecialStatus {
  COMMON = "common", //正常旋转
  NeverIN = "neverIn",
  Begin = "begin",
  Process = "process",
  End = "end",
}

export const FortuneDragonTHPossibleWinLines = [
  [1, 4, 7],
  [0, 3, 6],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const FortuneDragonTHCardIconMap: Map<number, number> = new Map([
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 6],
  [7, 7],
  [8, 8],
  [1, 1],
  [0, 0],
]);

export class FortuneDragonTHService {
  public static async noPrizeSpin(params: FortuneDragonTHSpinParams, moneyPool: MoneyPoolMachine, toRecord = true) {
    const { playerId, baseBet, baseRate, lineRate, currency } = params;
    const totalBet = baseBet * baseRate * lineRate;
    const config = await GameConfigService.getRandomNoPrize(57);
    //   const cards = config.cards as number[]; 先默认值返回
    const cards = [0, 5, 2, 3, 1, 6, 2, 3, 1, 4, 2, 3, 1, 4, 2, 3, 1, 4, 2, 8, 1, 4, 2, 7, 0];
    const icons = cards.map((card) => FortuneDragonTHCardIconMap.get(card));
    const winIndexes: number[] = [];
    const winPositions = this.getWinPosition(winIndexes);
    const hashr = await this.getHashStr(icons as number[], winPositions, totalBet, 0, playerId);

    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    const balanceBeforeSpin = new Decimal(wallet?.balance || 0);
    const balanceAfterSpin = balanceBeforeSpin.sub(totalBet);
    const balanceAfterWin = balanceAfterSpin;
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    const record = toRecord
      ? await GameHistoryService.create({
          currency,
          totalBet,
          operator: {
            connect: {
              id: player?.operatorId,
            },
          },
          ge: [1, 11],
          game: {
            connect: {
              gameID: 57,
            },
          },
          player: {
            connect: {
              id: playerId,
            },
          },
          profit: -totalBet,
          moneyPoolId: moneyPool.id,
          moneyPool: {
            rtp: moneyPool.currentRTP,
            totalOut: moneyPool.totalOut,
            totalIn: moneyPool.totalIn,
          },
        })
      : null;
    return {
      winIndexes: [],
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(0),
      record,
      winPositions: {},
      positionAmount: {},
      hashStr: hashr,
      icons: icons as number[],
      balanceBeforeSpin,
      balanceAfterSpin,
      balanceAfterWin,
      iconRate: null,
      sw: null,
      sc: null,
    };
  }

  private static async normalSpin(params: FortuneDragonTHSpinParams, moneyPool: MoneyPoolMachine) {
    let time = Date.now();
    const { playerId, baseBet, baseRate, lineRate, currency, spinId, histroyid, pf } = params;
    await redisClient.set(`FortuneDragonTH:freeMode:${playerId}`, FortuneDragonTHSpecialStatus.NeverIN);
    const wallet = await WalletService.getWalletByUserId(playerId, currency);
    let balanceBeforeSpin = wallet?.balance || 0;
    let balanceAfterSpin = balanceBeforeSpin;
    let balanceAfterWin = balanceAfterSpin;
    const walletRecord = await WalletService.gameBet({
      playerId,
      currency,
      amount: new Decimal(baseBet * baseRate * lineRate),
      detail: {
        historyId: spinId,
      },
    });
    balanceAfterSpin = walletRecord.balanceAfter;
    balanceBeforeSpin = walletRecord.balanceBefore;
    balanceAfterWin = walletRecord.balanceAfter;

    let newAnswer: any;
    const totalBet = baseBet * baseRate * lineRate;
    const player = await GamePlayerService.getGamePlayerById(playerId);
    if (!player) {
      throw new Error("player is not found");
    }
    let cb = 0;
    let st = 1;
    let fstc = {};
    let df;
    // const historyId = await redisClient.get(
    //   `fortuneDragonTH:freeMode-historyId:${playerId}`,
    // );
    let firsthistoryId = await redisClient.get(
      `fortuneDragonTH:freeMode-historyId:${playerId}`, //先把这一单外部id取到
    );
    console.log("redis查询firstid" + firsthistoryId);
    let record = firsthistoryId ? await GameHistoryService.getByHistoryId(BigInt(firsthistoryId)) : null;
    if (!record) {
      record = await GameHistoryService.create({
        currency,
        totalBet,
        operator: {
          connect: {
            id: player?.operatorId,
          },
        },
        ge: [1, 11],
        game: {
          connect: {
            gameID: 57,
          },
        },
        player: {
          connect: {
            id: playerId,
          },
        },
        profit: -totalBet,
        moneyPoolId: moneyPool.id,
        moneyPool: {
          rtp: moneyPool.currentRTP,
          totalIn: moneyPool.totalIn,
          totalOut: moneyPool.totalOut,
        },
      });
    } else {
      if (Array.isArray(record.detail)) {
        const detail = record.detail[record.detail.length - 1];
        // console.log(record.detail.length+"recorddetail=========",record.detail)
        newAnswer = DragonTHLogic.GetNewAnswer(detail?.gd.rl, detail?.gd.wp);
        console.log("record这里 newAnswer=========", newAnswer);

        cb = detail?.gd.cb;
        st = 4;
        fstc = detail?.gd.fstc;
        df = detail?.gd.df;

        if (!fstc["4"]) {
          fstc["4"] = 0;
        }
      }
    }
    let gege = [1, 11];
    if (df) {
      for (let i = 0; i < df.length; i++) {
        if (!df[i].idh) {
          gege = [3, 11];
          break;
        } else {
          if (df[i].p != null) {
            gege = [3, 11];
            break;
          }
        }
      }
    }
    const cards = await GameService.getRandom25Cards(57, newAnswer?.newarray);

    const winIndexes = this.getWinLines(cards);
    const icons = await this.turnCardToIcon(cards);
    console.log("新的 cards=========", icons);
    let winPositions = this.getWinPosition(cards);
    let specialrl: any;
    let specialorl: any;
    let iconRate = null; //await this.getIconRate(cards, winIndexes);
    let sw = null;
    let sc = null;
    let totalWin = 0;
    let cbc = DragonTHLogic.GetWpArrayCount(winPositions);
    cb += cbc;
    let isWin = false;
    if (!newAnswer) {
      newAnswer = DragonTHLogic.GetNewAnswer(icons, winPositions);
    }

    if (Object.values(winPositions).length === 0 ? false : true) {
      isWin = true;
      let cardsarr = [];
      for (let i = 0; i < cards.length; i++) {
        cardsarr.push(cards[i].cardID);
      }
      sw = DragonTHLogic.GetWinSw(cardsarr, winPositions, baseBet, baseRate);
      sc = DragonTHLogic.GetWinSc(winPositions);
      totalWin = DragonTHLogic.GetWinTotalWin(sw);
      iconRate = DragonTHLogic.GetRwsp(sw, sc);
      if (fstc["4"]) {
        fstc["4"] = Number(fstc["4"]) + 1;
      }

      console.log("iconRate", iconRate);
      if (!firsthistoryId) {
        //如果不存在首次历史记录的id
        console.log("中奖了 储存firstid" + record.historyId);
        await redisClient.set(`fortuneDragonTH:freeMode-historyId:${playerId}`, record.historyId.toString());
      }
    } else {
      isWin = false;
      if (fstc["4"]) {
        fstc["4"] = Number(fstc["4"]) + 1;
      }
    }
    let ispecial = false;
    let dtArray = [];
    if (cb >= 10) {
      dtArray.push(3);
    }
    if (cb >= 30) {
      dtArray.push(2);
    }
    if (cb >= 50) {
      dtArray.push(1);
    }
    if (cb >= 70) {
      dtArray.push(4);
    }

    let dt = 0;
    for (let zidx = 0; zidx < dtArray.length; zidx++) {
      //获取特殊模式
      if (DragonTHLogic.getdfValue(dtArray[zidx], df, isWin)) {
        dt = dtArray[zidx];
        if (!df || df == null) {
          df = [];
          let obj = { dt: dt, idh: false, p: null };
          df.push(obj);
        } else {
          let find = false;
          for (let i = 0; i < df.length; i++) {
            if (df[i].dt == dt) {
              find = true;
              continue;
            }
          }
          if (!find) {
            let obj = { dt: dt, idh: false, p: null };
            df.push(obj);
          }
        }
        switch (dtArray[zidx]) {
          case 3:
            winPositions = null;
            specialorl = newAnswer?.newarray.slice();

            let specialData = DragonTHLogic.EarthDargonData(newAnswer?.newarray.slice());

            specialrl = specialData.copiedArray;
            for (let i = 0; i < df.length; i++) {
              if (df[i].dt == dt) {
                df[i].idh = true;
                df[i].p = specialData.p;
                break;
              }
            }

            break;
          case 2: //重新计算一遍  orl是生成后的 rl是
            // if(Array.isArray(record.detail)){
            //    console.log("record.detail[record.detail.length-1]?.gd.orl",record.detail[record.detail.length-1]?.gd.orl)

            specialorl = newAnswer.newarray; // record.detail[record.detail.length-1]?.gd.rl;
            let rns2 = newAnswer.rns;
            // }
            specialrl = specialorl.slice();
            specialrl[6] = 0;
            specialrl[8] = 0;
            specialrl[16] = 0;
            specialrl[18] = 0;
            for (let i = 0; i < df.length; i++) {
              if (df[i].dt == dt) {
                df[i].idh = true;
                df[i].p = [6, 8, 16, 18];
                break;
              }
            }
            console.log("特殊模式2 specialorl", specialorl);
            console.log("特殊模式2 specialrl", specialrl);
            // console.log("特殊模式2 rns",rns)
            return this.specialResult(
              specialrl,
              totalBet,
              baseBet,
              baseRate,
              fstc,
              playerId,
              record,
              currency,
              firsthistoryId,
              cb,
              df,
              pf,
              balanceAfterSpin,
              balanceBeforeSpin,
              balanceAfterWin,
              st,
              specialorl,
              specialrl,
              rns2,
            );
            break;
          case 1:
            let fireArray = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
            specialorl = newAnswer.newarray;
            let rns1 = newAnswer.rns;
            specialrl = specialorl.slice();
            for (let i = 0; i < fireArray.length; i++) {
              if (specialrl[fireArray[i]] != 0) {
                specialrl[fireArray[i]] = 7;
              }
            }
            for (let i = 0; i < df.length; i++) {
              if (df[i].dt == dt) {
                df[i].idh = true;
                df[i].p = fireArray;
                break;
              }
            }
            return this.specialResult(
              specialrl,
              totalBet,
              baseBet,
              baseRate,
              fstc,
              playerId,
              record,
              currency,
              firsthistoryId,
              cb,
              df,
              pf,
              balanceAfterSpin,
              balanceBeforeSpin,
              balanceAfterWin,
              st,
              specialorl,
              specialrl,
              rns1,
            );

            break;
          case 4:
            specialorl = newAnswer.newarray;
            let rns4 = newAnswer.rns;
            let specialdata = DragonTHLogic.GiantDragon(newAnswer.newarray);
            specialrl = specialdata.newarray;
            let mdf = specialdata.mdf;
            for (let i = 0; i < df.length; i++) {
              if (df[i].dt == dt) {
                df[i].idh = true;
                df[i].p = [0];
                break;
              }
            }
            return this.specialResult(
              specialrl,
              totalBet,
              baseBet,
              baseRate,
              fstc,
              playerId,
              record,
              currency,
              firsthistoryId,
              cb,
              df,
              pf,
              balanceAfterSpin,
              balanceBeforeSpin,
              balanceAfterWin,
              st,
              specialorl,
              specialrl,
              rns4,
              mdf,
            );

            break;
        }
        break;
      } else {
        //代表中奖了  或者已经触发过 暂时先不触发
        dt = dtArray[zidx];
        if (!df || df == null) {
          df = [];
          let obj = { dt: dt, idh: false, p: null };
          df.push(obj);
        } else {
          let find = false;
          for (let i = 0; i < df.length; i++) {
            if (df[i].dt == dt) {
              find = true;
              if (df[i].idh) {
                //代表已经触发过了
                df[i].p = null;
              }

              continue;
            }
          }
          if (!find) {
            let obj = { dt: dt, idh: false, p: null };
            df.push(obj);
          }
        }
      }
    }
    console.log("---df----df---df---", df);
    console.log("cb=======" + cb + "iswin=====" + isWin + "special=====" + specialorl);

    if (!isWin) {
      if (!specialorl) {
        //没中奖 没特殊模式 后面就没有免费了 删除首次历史记录的id
        console.log("没中奖 删除firstid" + firsthistoryId);
        await redisClient.del(`fortuneDragonTH:freeMode-historyId:${playerId}`);
      }
    }

    const positionAmount = this.getPositionAmount({
      cards,
      winIndexes,
      baseBet,
      baseRate,
    });
    // let totalWin = Object.values(positionAmount).reduce(
    //   (prev, curr) => prev + curr,
    //   0,
    // );

    if (totalWin > 0) {
      record = await GameHistoryService.updateProfit(record, new Decimal(totalWin - totalBet));
      const walletRecord = await WalletService.gameWin({
        playerId,
        currency,
        amount: totalWin,
        detail: {
          historyId: record?.historyId?.toString(),
        },
      });
      balanceAfterWin = walletRecord.balanceAfter;
    }

    //all cards are the same
    if (Object.values(positionAmount).length === FortuneDragonTHPossibleWinLines.length) {
      totalWin = totalWin * 10;
    }
    const hashStr = await this.getHashStr(icons, winPositions, totalBet, totalWin, playerId);

    return {
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(totalWin),
      winPositions,
      positionAmount,
      balanceAfterSpin,
      balanceBeforeSpin,
      balanceAfterWin,
      hashStr,
      icons,
      iconRate,
      record,
      sw,
      sc,
      psid: firsthistoryId,
      cb,
      cbc,
      pf,
      rns: newAnswer?.rns ? newAnswer!.rns : null,
      st: st,
      fstc: fstc,
      cwc: fstc["4"] ? Number(fstc["4"]) + 1 : 1,
      df: df,
      ge: gege,
      specialorl,
      specialrl,
      mdf: null,
    };
  }

  //水龙模式 orl 上一轮  rl 新的
  private static async specialResult(
    icon: any,
    totalBet: any,
    baseBet: any,
    baseRate: any,
    fstc: any,
    playerId: any,
    record: any,
    currency: any,
    firsthistoryId: any,
    cb: any,
    df: any,
    pf: any,
    balanceAfterSpin: any,
    balanceBeforeSpin: any,
    balanceAfterWin: any,
    st: any,
    orl: any,
    rl: any,
    rns: any,
    mdf?: any,
  ) {
    const cards = icon.slice();
    console.log("特殊模式的cards", cards);
    const winIndexes = this.getWinLines(cards);
    const icons = await this.turnCardToIcon(cards);
    const winPositions = DragonTHLogic.GetAnwser(cards);

    let iconRate = null; //await this.getIconRate(cards, winIndexes);
    let sw = null;
    let sc = null;
    let newAnswer = null;
    let totalWin = 0;
    let cbc = DragonTHLogic.GetWpArrayCount(winPositions);
    cb += cbc;
    let isWin = false;

    if (Object.values(winPositions).length === 0 ? false : true) {
      isWin = true;
      let cardsarr = cards.slice();

      sw = DragonTHLogic.GetWinSw(cardsarr, winPositions, baseBet, baseRate);
      sc = DragonTHLogic.GetWinSc(winPositions);
      newAnswer = DragonTHLogic.GetNewAnswer(orl, winPositions);
      totalWin = DragonTHLogic.GetWinTotalWin(sw);
      iconRate = DragonTHLogic.GetRwsp(sw, sc);
      if (fstc["4"]) {
        fstc["4"] = Number(fstc["4"]) + 1;
      }

      console.log("iconRate", iconRate);
    } else {
      isWin = false;
      if (fstc["4"]) {
        fstc["4"] = Number(fstc["4"]) + 1;
      }
      //没中奖 后面就没有免费了 删除首次历史记录的id
      //  console.log("没中奖 删除firstid"+firsthistoryId);;
      await redisClient.del(`fortuneDragonTH:freeMode-historyId:${playerId}`);
    }

    const positionAmount = this.getPositionAmount({
      cards,
      winIndexes,
      baseBet,
      baseRate,
    });

    if (totalWin > 0) {
      record = await GameHistoryService.updateProfit(record, new Decimal(totalWin - totalBet));
      const walletRecord = await WalletService.gameWin({
        playerId,
        currency,
        amount: totalWin,
        detail: {
          historyId: record?.historyId?.toString(),
        },
      });
      balanceAfterWin = walletRecord.balanceAfter;
    }

    //all cards are the same
    if (Object.values(positionAmount).length === FortuneDragonTHPossibleWinLines.length) {
      totalWin = totalWin * 10;
    }
    const hashStr = await this.getHashStr(icons, winPositions, totalBet, totalWin, playerId);
    console.log("特殊模式返回的cards", cards);
    return {
      totalBet: new Decimal(totalBet),
      totalWin: new Decimal(totalWin),
      winPositions,
      positionAmount,
      balanceAfterSpin,
      balanceBeforeSpin,
      balanceAfterWin,
      hashStr,
      icons,
      iconRate,
      record,
      sw,
      sc,
      psid: firsthistoryId,
      cb,
      cbc,
      pf,
      rns: rns,
      st: st,
      fstc: fstc,
      cwc: fstc ? Number(fstc["4"]) + 1 : 1,
      df: df,
      ge: [3, 11],
      specialorl: orl,
      specialrl: cards,
      mdf: mdf,
    };
  }

  private static getWinPosition(winIndexes: any[]) {
    // const winPositions: any = {};
    // for (let i = 0; i < winIndexes.length; i++) {
    //   const index = winIndexes[i];
    //   const str = (index + 1).toString();
    //   winPositions[str] = FortuneDragonTHPossibleWinLines[index];
    // }
    if (winIndexes.length <= 0) {
      return [];
    }
    /// console.log("winindexes",winIndexes);
    let data = [];
    for (let i = 0; i < winIndexes.length; i++) {
      data.push(winIndexes[i].cardID);
    }
    let wp: number[] = [];
    const winPositions = DragonTHLogic.GetAnwser(data);
    return winPositions;
  }

  /**
   * 这里算赔率给分数
   * @param params
   * @returns
   */
  private static getPositionAmount(params: {
    cards: ConfigThreeColumnsCardWeight[];
    winIndexes: number[];
    baseBet: number;
    baseRate: number;
  }) {
    const { cards, winIndexes, baseBet, baseRate } = params;
    const positionAmount: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const line = FortuneDragonTHPossibleWinLines[index];
      const [a, b, c] = line;
      const cardA = cards[a];
      const cardB = cards[b];
      const cardC = cards[c];
      let card = [cardA, cardB, cardC].find((c) => c.cardID !== 2);
      card = card || cardA;

      const amount = card.payRate * baseBet * baseRate;
      positionAmount[(index + 1).toString()] = +amount.toFixed(2);
    }
    return positionAmount as { string: number };
  }

  private static getWinLines(cards: ConfigThreeColumnsCardWeight[]) {
    const winIndexes = [];

    for (let index = 0; index < FortuneDragonTHPossibleWinLines.length; index++) {
      const line = FortuneDragonTHPossibleWinLines[index];
      const [a, b, c, d, e] = line;
      const cardA = cards[a];
      const cardB = cards[b];
      const cardC = cards[c];
      const cardD = cards[d];
      const cardE = cards[e];
      if (cardA === undefined || cardB === undefined || cardC === undefined) {
        continue;
      }
      if (cardA.cardID === 1 || cardB.cardID === 1 || cardC.cardID === 1) {
        continue;
      }
      if (cardA.cardID === cardB.cardID && cardB.cardID === cardC.cardID) {
        winIndexes.push(index);
      }

      if (cardA.cardID === 2 && cardB.cardID === cardC.cardID) {
        winIndexes.push(index);
      }
      if (cardB.cardID === 2 && cardA.cardID === cardC.cardID) {
        winIndexes.push(index);
      }
      if (cardC.cardID === 2 && cardA.cardID === cardB.cardID) {
        winIndexes.push(index);
      }
      if (cardA.cardID === 2 && cardB.cardID === 2 && cardC.cardID !== 2) {
        winIndexes.push(index);
      }
      if (cardA.cardID === 2 && cardC.cardID === 2 && cardB.cardID !== 2) {
        winIndexes.push(index);
      }
      if (cardB.cardID === 2 && cardC.cardID === 2 && cardA.cardID !== 2) {
        winIndexes.push(index);
      }
      if (cardA.cardID === 2 && cardB.cardID === 2 && cardC.cardID === 2) {
        winIndexes.push(index);
      }
    }
    return winIndexes;
  }

  public static async turnCardToIcon(cards: ConfigThreeColumnsCardWeight[]) {
    let icons = cards.map((card) => FortuneDragonTHCardIconMap.get(card.cardID));
    icons = icons.map((icon) => (icon === undefined ? -1 : icon));
    icons = icons.map(Number);
    return icons as number[];
  }

  private static async getHashStr(
    icons: number[],
    winPositions: any,
    totalBet: number,
    winAmount: number,
    playerId: number,
  ) {
    const freeModeBetAmount = await redisClient.get(`FortuneDragonTH:freeModeCount:${playerId}`);
    let hashStr = `${freeModeBetAmount || 0}:${icons[0]};${icons[3]};${icons[6]}#${icons[1]};${icons[4]};${icons[7]}#${icons[2]};${icons[5]};${icons[8]}`;
    let winLineStr = "";
    if (winPositions) {
      for (const key in winPositions) {
        const pos = winPositions[key];
        const iconIndex = pos.find((i: any) => icons[i] !== 2);
        const icon = icons[iconIndex] || 2;
        let posStr = "";
        for (const i of pos) {
          const row = Math.floor(i / 3);
          const column = i % 3;
          posStr += `${row}${column}`;
        }
        winLineStr += `#R#${icon}#${posStr}`;
      }
    }
    const betInfoStr = `#MV#${totalBet.toFixed(1)}#MT#1#MG#${winAmount.toFixed(1)}#`;
    hashStr = `${hashStr}${winLineStr}${betInfoStr}`;
    return hashStr;
  }

  static async getIconRate(cards: ConfigThreeColumnsCardWeight[], winIndexes: number[]) {
    const iconRate: any = {};
    for (let index = 0; index < winIndexes.length; index++) {
      const winIndex = winIndexes[index];
      const line = FortuneDragonTHPossibleWinLines[winIndex];
      const [a, b, c] = line;
      const cardA = cards[a];
      const cardB = cards[b];
      const cardC = cards[c];
      let card = [cardA, cardB, cardC].find((c) => c.cardID !== 2);
      card = card || cardA;

      iconRate[(winIndex + 1).toString()] = card.payRate;
    }
    return iconRate as { string: number };
  }

  private static async initSpecialSpin(playerId: number, totalBet: number, moneyPool: MoneyPoolMachine) {
    let specialResult = await GameConfigService.getRandomSpecialPrize(57);
    await redisClient.set(`fortuneMouse:freeModeCount:${playerId}`, 0);
    let count = specialResult?.count || 1;
    let initCount = count;
    let payRate = specialResult?.payRate.toNumber() || 3;
    let rounds = (specialResult?.rounds || []) as any[];
    let predictedWin = new Decimal(payRate).mul(totalBet);
    let tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHight(moneyPool.id, predictedWin);
    rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 25) : [];

    let firstRound: any = rounds[0];
    let freeModeIcon = firstRound.cardPointed;

    while (rounds.length < 1 || tooHigh || !freeModeIcon) {
      specialResult = await GameConfigService.getRandomSpecialPrize(57, count);
      count = specialResult?.count || 1;
      payRate = specialResult?.payRate.toNumber() || 3;
      rounds = (specialResult?.rounds || []) as any[];
      rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length === 9) : [];
      if (rounds.length < 1) {
        count = initCount;
      }
      predictedWin = new Decimal(totalBet).mul(payRate);
      tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHight(moneyPool.id, predictedWin);
      firstRound = rounds[0];
      freeModeIcon = firstRound.cardPointed;
      if (!freeModeIcon) {
        count = 0;
      }
    }
    if (!Array.isArray(rounds)) {
      throw new Error("rounds is not array");
    }
    await redisClient.del(`FortuneDragonTH:freeMode-list:${playerId}`);
    for (let index = 0; index < rounds.length; index++) {
      const round: any = rounds[index];
      const cardNumbers = round.cards;
      const cards = [];
      for (let i = 0; i < cardNumbers.length; i++) {
        const cardN = cardNumbers[i];
        const card = await GameConfigService.getThreeColumnsCardWeightByCardID(57, cardN);
        cards.push(card);
      }
      const winIndexes = this.getWinLines(cards);
      if (winIndexes.length === 0) {
        continue;
      }
      if (round?.payRate === null || round?.payRate === undefined) {
        break;
      }
      await redisClient.rPush(`FortuneDragonTH:freeMode-list:${playerId}`, JSON.stringify(round));
    }

    console.log("FortuneDragonTH:freeModeIcon========", freeModeIcon);

    await redisClient.set(`FortuneDragonTH:freeModeIcon:${playerId}`, freeModeIcon);
  }

  // private static async specialSpin(
  //   params: FortuneDragonTHSpinParams,
  //   moneyPool: MoneyPoolMachine,
  // ): Promise<any> {
  //   const { playerId, baseBet, baseRate, lineRate, spinId, currency } = params;
  //   const totalBet = baseBet * baseRate * lineRate;

  //   const specialStatus = await redisClient.get(
  //     `FortuneDragonTH:freeMode:${playerId}`,
  //   );

  //   if (specialStatus === FortuneDragonTHSpecialStatus.Begin) {
  //     await this.initSpecialSpin(playerId, totalBet, moneyPool);
  //   } else {
  //     await redisClient.incr(`FortuneDragonTH:freeModeCount:${playerId}`);
  //   }
  //   const roundStr = await redisClient.lPop(
  //     `FortuneDragonTH:freeMode-list:${playerId}`,
  //   );
  //   const round = JSON.parse(roundStr || "{}");

  //   const listLength = await redisClient.lLen(
  //     `FortuneDragonTH:freeMode-list:${playerId}`,
  //   );
  //   let cashOut = false;
  //   if (+listLength === 0) {
  //     await redisClient.set(
  //       `FortuneDragonTH:freeMode:${playerId}`,
  //       FortuneDragonTHSpecialStatus.End,
  //     );
  //     cashOut = true;
  //   }
  //   const cards = [];
  //   for (let index = 0; index < round?.cards?.length; index++) {
  //     const cardID = round.cards[index];
  //     const card = await GameConfigService.getThreeColumnsCardWeightByCardID(
  //       57,
  //       cardID,
  //     );
  //     cards.push(card);
  //   }

  //   const winIndexes = this.getWinLines(cards);
  //   const icons = await this.turnCardToIcon(cards);
  //   const winPositions = this.getWinPosition(winIndexes);

  //   const iconRate = await this.getIconRate(cards, winIndexes);
  //   let positionAmount = this.getPositionAmount({
  //     cards,
  //     winIndexes,
  //     baseBet,
  //     baseRate,
  //   });

  //   let totalWin = Object.values(positionAmount).reduce(
  //     (prev, curr) => prev + curr,
  //     0,
  //   );
  //   if (winIndexes.length === FortuneDragonTHPossibleWinLines.length) {
  //     totalWin = totalWin * 10;
  //   }

  //   const hashStr = await this.getHashStr(
  //     icons,
  //     winPositions,
  //     totalBet,
  //     cashOut ? totalWin : 0,
  //     playerId,
  //   );
  //   const historyId = await redisClient.get(
  //     `FortuneDragonTH:freeMode-historyId:${playerId}`,
  //   );
  //   let record = historyId
  //     ? await GameHistoryService.getByHistoryId(BigInt(historyId))
  //     : null;
  //   const wallet = await WalletService.getWalletByUserId(playerId, currency);
  //   let balanceBeforeSpin = wallet?.balance || 0;
  //   let balanceAfterSpin = balanceBeforeSpin;
  //   let balanceAfterWin = balanceAfterSpin;
  //   if (specialStatus === FortuneDragonTHSpecialStatus.Begin) {
  //     const player = await GamePlayerService.getGamePlayerById(playerId);
  //     if (!player) {
  //       throw new Error("player is not found");
  //     }
  //     record = await GameHistoryService.create({
  //       currency,
  //       totalBet,
  //       operatorId: player.operatorId,
  //       ge: [1, 4, 11],
  //       gameID: 57,
  //       playerId,
  //       profit: cashOut ? totalWin - totalBet : -totalBet,
  //     });
  //     await redisClient.set(
  //       `FortuneDragonTH:freeMode-historyId:${playerId}`,
  //       record.historyId.toString(),
  //     );

  //     const walletRecord = await WalletService.gameBet({
  //       playerId,
  //       currency,
  //       amount: new Decimal(totalBet),
  //       detail: {
  //         historyId: record?.id,
  //       },
  //     });
  //     balanceAfterSpin = walletRecord.balanceAfter;
  //     balanceBeforeSpin = walletRecord.balanceBefore;
  //     balanceAfterWin = walletRecord.balanceAfter;
  //   }
  //   if (!record) {
  //     await redisClient.set(
  //       `FortuneDragonTH:freeMode:${playerId}`,
  //       FortuneDragonTHSpecialStatus.NeverIN,
  //     );
  //     const player = await GamePlayerService.getGamePlayerById(playerId);
  //     if (!player) {
  //       throw new Error("player is not found");
  //     }
  //     record = await GameHistoryService.create({
  //       currency,
  //       totalBet,
  //       operatorId: player.operatorId,
  //       ge: [1, 4, 11],
  //       gameID: 98,
  //       playerId,
  //       profit: cashOut ? new Decimal(totalWin).minus(totalBet) : -totalBet,
  //       moneyPoolId: moneyPool.id,
  //       moneyPool: {
  //         rtp: moneyPool.currentRTP,
  //         totalIn: moneyPool.totalIn,
  //         totalOut: moneyPool.totalOut,
  //       },
  //     });
  //   }

  //   if (cashOut && totalWin > 0) {
  //     record = await GameHistoryService.updateProfit(
  //       record,
  //       new Decimal(totalWin - totalBet),
  //     );
  //     const walletRecord = await WalletService.gameWin({
  //       playerId,
  //       currency,
  //       amount: totalWin,
  //       detail: {
  //         historyId: record.id,
  //       },
  //     });
  //     balanceAfterWin = walletRecord.balanceAfter;
  //     await GameMoneyPoolService.putWinToMoneyPool(
  //       moneyPool.id,
  //       new Decimal(totalWin),
  //     );
  //   }

  //   return {
  //     winIndexes,
  //     totalBet: new Decimal(totalBet),
  //     totalWin: new Decimal(cashOut ? totalWin : 0),
  //     winPositions,
  //     positionAmount,
  //     record,
  //     hashStr,
  //     icons,
  //     iconRate,
  //     balanceAfterSpin,
  //     balanceBeforeSpin,
  //     balanceAfterWin,
  //   };
  // }

  public static async spin(params: FortuneDragonTHSpinParams): Promise<{
    totalWin: Decimal;
    totalBet: Decimal;
    winPositions: any;
    iconRate: any;
    positionAmount: any;
    hashStr: string;
    icons: number[];
    record: GameHistory | null;
    specialStatus: FortuneDragonTHSpecialStatus;
    balanceBeforeSpin: Decimal;
    balanceAfterSpin: Decimal;
    balanceAfterWin: Decimal;
    sw: any;
    sc: any;
    psid: any;
    cb: number;
    cbc: number;
    pf: number;
    rns: any;
    st: number; //本回合是不是免费=4 不是=1
    fstc: any;
    cwc: number;
    df: any;
    ge: any;
    specialorl: any;
    specialrl: any;
    mdf: any;
  }> {
    let timeUse = Date.now();

    const { playerId, baseBet, baseRate, lineRate, histroyid } = params;
    const totalBet = baseBet * baseRate * lineRate;

    const specialStatus = await redisClient.get(`FortuneDragonTH:freeMode:${playerId}`);

    let [type, moneyPool] = await GameService.checkSpinNormalOrSpecial(playerId, 57);
    //这里是调控
    // if (
    //   false
    //   // await GameMoneyPoolService.ifMoneyPoolTooHight(
    //   //   moneyPool.id,
    //   //   new Decimal(1),
    //   // )
    // ) {
    //   moneyPool = await GameMoneyPoolService.putBetToMoneyPool(
    //     moneyPool.id,
    //     new Decimal(totalBet),
    //   );
    //   const noPrizeResult = await this.noPrizeSpin(params, moneyPool);
    //   return {
    //     ...noPrizeResult,
    //     record: noPrizeResult.record,
    //     specialStatus: specialStatus as FortuneDragonTHSpecialStatus,
    //   };
    // }
    //这里在更新redis里的特殊状态
    // if (specialStatus === FortuneDragonTHSpecialStatus.Begin) {
    //   await redisClient.set(
    //     `FortuneDragonTH:freeMode:${playerId}`,
    //     FortuneDragonTHSpecialStatus.Process,
    //   );
    // }
    // if (specialStatus === FortuneDragonTHSpecialStatus.End) {
    //   await redisClient.set(
    //     `FortuneDragonTH:freeMode:${playerId}`,
    //     FortuneDragonTHSpecialStatus.NeverIN,
    //   );
    // }
    if (
      true
      // !specialStatus ||
      // specialStatus === FortuneDragonTHSpecialStatus.NeverIN ||
      // specialStatus === FortuneDragonTHSpecialStatus.End
    ) {
      moneyPool = await GameMoneyPoolService.putBetToMoneyPool(moneyPool.id, new Decimal(totalBet));
      // if (random.int(100) < 50) {
      if (false && type === "special") {
        if (await GameMoneyPoolService.ifMoneyPoolTooHight(moneyPool.id, new Decimal(totalBet + 1).mul(3))) {
          const noPrizeResult = await this.noPrizeSpin(params, moneyPool);
          return {
            ...noPrizeResult,
            record: noPrizeResult.record,
            specialStatus: specialStatus as FortuneDragonTHSpecialStatus,
          };
        }
        await redisClient.set(`FortuneDragonTH:freeMode:${playerId}`, FortuneDragonTHSpecialStatus.Begin);
        const specialResult = await this.specialSpin(params, moneyPool);

        return {
          ...specialResult,
          specialStatus: specialStatus as FortuneDragonTHSpecialStatus,
        };
      } else {
        const normalResult = await this.normalSpin(params, moneyPool);
        const { totalWin, totalBet } = normalResult;

        //判断当前水位是否超过了最大水位
        if (
          false
          //  await GameMoneyPoolService.ifMoneyPoolTooHight(moneyPool.id, totalWin)
        ) {
          const noPrizeResult = await this.noPrizeSpin(params, moneyPool, true);
          await GameHistoryService.deleteById(noPrizeResult.record?.id as number);
          return {
            ...noPrizeResult,
            record: noPrizeResult.record,
            specialStatus: specialStatus as FortuneDragonTHSpecialStatus,
          };
        }
        if (totalWin.gt(0)) {
          await GameMoneyPoolService.putWinToMoneyPool(moneyPool.id, new Decimal(totalWin));
        }
        return {
          ...normalResult,
          specialStatus: specialStatus as FortuneDragonTHSpecialStatus,
        };
      }
    } else {
      const specialResult = await this.specialSpin(params, moneyPool);

      return {
        ...specialResult,
        specialStatus: specialStatus as FortuneDragonTHSpecialStatus,
      };
    }
  }

  public static async parseModeResultByFortuneDragonTHSpecialStatus(
    freeModeStatus: FortuneDragonTHSpecialStatus,
    data: {
      totalWin: number;
      freeModeIcon: number | null;
      gwt: number;
      freeModeCount: number;
      winPositions: any;
      iconRate: any;
      positionAmount: any;
      hashStr: string;
      lastSpinId: string;
      spinId: string;
      icons: number[];
      baseBetRate: number;
      baseBet: number;
      pf: number;
    },
  ) {
    let {
      totalWin,
      freeModeIcon,
      gwt,
      icons,
      winPositions,
      iconRate,
      positionAmount,
      freeModeCount,
      hashStr,
      lastSpinId,
      spinId,
      baseBetRate,
      baseBet,
      pf,
    } = data;
    let totalBet = baseBet * baseBetRate * 5;
    totalBet = +totalBet.toFixed(2);
    totalWin = +totalWin.toFixed(2);

    const profit = +(totalWin - totalBet).toFixed(2);
    const wp = !winPositions || Object.values(winPositions).length === 0 ? null : winPositions;
    console.log("winpositions", winPositions);
    console.log("wp", wp);
    const rwsp = !iconRate || Object.values(iconRate).length === 0 ? {} : iconRate;
    const lw = !positionAmount || Object.values(positionAmount).length === 0 ? null : positionAmount;
    const ist = random.int(100) < 5;
    const isReward: boolean = wp ? true : false;
    console.log("状态=" + freeModeStatus);
    switch (freeModeStatus) {
      case FortuneDragonTHSpecialStatus.NeverIN:
        return {
          wp: wp, //要消除的元素
          // sw: null,
          // sc: null, // 在另外一个地方处理了  键值对形势 每一组消除的个数
          // cbc: isReward?wp.length:0,//本局要消除多少个
          // cb: isReward?8:0,//所有免费次数累加的 一共消除了多少个
          // df: null, //是否可处于特殊模式 当分数够的时候要传数组 [{dt: 3, idh: true, p: null}, {dt: 2, idh: false, p: null}] /3 是土龙模式 idh是否已触发 2是水龙 p是 相关元素的一维下标数组
          mdf: null, //暂时不知道
          rns: null, //每一列掉落的元素（新生成的）0:[]1:[] 二维数组 里面放要生成的元素id
          gwt: gwt, //2  1  -1  暂时不知道是什么情况
          fb: null,
          // cwc: fstc["4"]?1:0,//回合数
          //  fstc: null, // 键值对{4: 1} 4是免费模式 1是第一次免费后续要累加
          pcwc: isReward ? 1 : 0,
          rwsp, //// 如果有中奖 键值对形势 返回该元素对应个数的赔付表倍率
          ist,
          aw: totalWin,
          fws: 0,
          ml: baseBetRate ? baseBetRate : 2,
          cs: baseBet ? baseBet : 0.3,
          //   st,//本回合是不是免费   免费4 不免费1
          // nst: isReward?4:1,// 没中奖的时候nst是1  中奖了 后续可以触发免费的时候 nst是4
          //   pf: 0,//可能是赔付的意思  基础投注 * 基础倍数 //客户端传过来的
          wid: 0,
          wt: "C",
          wk: "0_C",
          wbn: null,
          wfg: null,
          tw: totalWin,
          np: profit, //利润
          ocr: null,
          mr: null,
          // gwt: gwt,
          irs: false,
          itw: false,
          // orl: icons,
          // rwsp,
          ctw: totalWin, //赢奖
          lw,
          hashr: hashStr,
          psid: lastSpinId, //这里要给fist的
          sid: spinId,
          // rl: icons,
          tb: totalBet,
          tbb: totalBet,
          ge: null,
          pf: pf,
        };
    }
  }
}
