import {
  IconPayRate,
  IconWeight,
  PossibleWinLines,
  SpecialRTPPrizeRateResult,
  FortuneTigerSpecialTypes,
} from "gameConfigs";
import { GameMoneyPoolService } from "services";
import { UserGameStore } from "./";
import random from "random";
import { Decimal } from "@prisma/client/runtime/library";

interface SlotControllerParams {
  userId: number;
  iconWeightConfig: IconWeight[][];
}

export class SlotController {
  userId: number;
  iconWeightConfig: IconWeight[][];
  private icons: number[] = [];

  constructor(params: SlotControllerParams) {
    this.userId = params.userId;
    this.iconWeightConfig = params.iconWeightConfig;
  }

  //这里是初始化的时候，随机生成9个图标
  set9Icons = () => {
    this.icons = this.getRandom9Icons.bind(this)();
  };

  set10Icons = () => {
    this.icons = this.getRandom10Icons.bind(this)();
  };

  //比如龙的玩法，这里需要更换图标的权重
  changeIconWeightConfig = (iconWeightConfig: IconWeight[][]) => {
    this.iconWeightConfig = iconWeightConfig;
  };
  //获取
  getRandomIcon = (columnIndex: 0 | 1 | 2) => {
    let iconWeights = this.iconWeightConfig[columnIndex];
    iconWeights = iconWeights.sort((a, b) => a.weight - b.weight);
    const totalWeight = iconWeights.reduce((acc, cur) => acc + cur.weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    for (const iconWeight of iconWeights) {
      currentWeight += iconWeight.weight;
      if (random <= currentWeight) {
        return iconWeight.icon;
      }
    }
    return iconWeights[iconWeights.length - 1].icon;
  };

  setIcons = (icons: number[]) => {
    this.icons = icons;
  };

  getIconRate = async (
    winIndexes: number[],
    payRateConfig: {
      icon: number;
      rate: number;
    }[],
  ) => {
    const iconRate: any = {};
    for (let index = 0; index < winIndexes.length; index++) {
      const winIndex = winIndexes[index];
      const line = PossibleWinLines[winIndex];
      const [a, b, c] = line;
      const cardA = this.currentIcons[a];
      const cardB = this.currentIcons[b];
      const cardC = this.currentIcons[c];
      let card = [cardA, cardB, cardC].find((c) => c !== 0);
      card = card || cardA;
      const payRate = payRateConfig.find((config) => config.icon === card);
      iconRate[(winIndex + 1).toString()] = payRate?.rate;
    }
    return iconRate as { string: number };
  };

  getIconRate10 = async (
    winIndexes: number[],
    payRateConfig: {
      icon: number;
      rate: number;
    }[],
    winPositions: any,
  ) => {
    const iconRate: any = {};
    for (let index = 0; index < winIndexes.length; index++) {
      const winIndex = winIndexes[index];
      const line = winPositions[winIndex];
      const [a, b, c] = line;
      const cardA = this.currentIcons[a];
      const cardB = this.currentIcons[b];
      const cardC = this.currentIcons[c];
      let card = [cardA, cardB, cardC].find((c) => c !== 0);
      card = card || cardA;
      const payRate = payRateConfig.find((config) => config.icon === card);
      iconRate[(winIndex + 1).toString()] = payRate?.rate;
    }
    return iconRate as { string: number };
  };

  getRandom9Icons = () => {
    const icons = [];
    for (let i = 0; i < 9; i++) {
      icons.push(this.getRandomIcon((i % 3) as 0 | 1 | 2));
    }
    return icons;
  };

  getRandom10Icons = () => {
    const icons = [];
    for (let i = 0; i < 12; i++) {
      if (i === 3 || i == 11) {
        icons.push(99);
      } else {
        icons.push(this.getRandomIcon((i % 3) as 0 | 1 | 2));
      }
    }
    return icons;
  };

  public get currentIcons() {
    return this.icons;
  }

  public getWinLines() {
    const winIndexes = [];
    for (let index = 0; index < PossibleWinLines.length; index++) {
      const line = PossibleWinLines[index];
      const [a, b, c] = line;
      if (this.icons[a] === this.icons[b] && this.icons[b] === this.icons[c]) {
        winIndexes.push(index);
      }
      if (this.icons[a] === 0 && this.icons[b] === this.icons[c]) {
        winIndexes.push(index);
      }
      if (this.icons[a] === this.icons[b] && this.icons[c] === 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] === this.icons[c] && this.icons[b] === 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] === 0 && this.icons[b] === 0 && this.icons[c] === 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] === 0 && this.icons[b] === 0 && this.icons[c] !== 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] !== 0 && this.icons[b] === 0 && this.icons[c] === 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] === 0 && this.icons[b] !== 0 && this.icons[c] === 0) {
        winIndexes.push(index);
      }
    }
    return winIndexes;
  }

  public getWinLines10(PossibleWinLines: any) {
    const winIndexes = [];
    for (let index = 0; index < PossibleWinLines.length; index++) {
      const line = PossibleWinLines[index];
      const [a, b, c] = line;
      if (this.icons[a] === 8 || this.icons[b] === 8 || this.icons[c] === 8) {
        continue;
      }
      if (this.icons[a] === this.icons[b] && this.icons[b] === this.icons[c]) {
        winIndexes.push(index);
      }
      if (this.icons[a] === 0 && this.icons[b] === this.icons[c]) {
        winIndexes.push(index);
      }
      if (this.icons[a] === this.icons[b] && this.icons[c] === 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] === this.icons[c] && this.icons[b] === 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] === 0 && this.icons[b] === 0 && this.icons[c] === 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] === 0 && this.icons[b] === 0 && this.icons[c] !== 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] !== 0 && this.icons[b] === 0 && this.icons[c] === 0) {
        winIndexes.push(index);
      }
      if (this.icons[a] === 0 && this.icons[b] !== 0 && this.icons[c] === 0) {
        winIndexes.push(index);
      }
    }
    return winIndexes;
  }

  public getWinPosition(winIndexes: number[]) {
    const winPositions: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const str = (index + 1).toString();
      winPositions[str] = PossibleWinLines[index];
    }
    return winPositions as { string: number[] };
  }

  public getWinPosition10(winIndexes: number[], PossibleWinLines: any) {
    const winPositions: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const str = (index + 1).toString();
      winPositions[str] = PossibleWinLines[index];
    }
    return winPositions as { string: number[] };
  }

  public getPositionAmount(params: {
    winIndexes: number[];
    baseBet: number;
    baseRate: number;
    payRateConfigs: IconPayRate[];
  }) {
    const { winIndexes, baseBet, baseRate, payRateConfigs } = params;
    const positionAmount: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const line = PossibleWinLines[index];
      const [a, b, c] = line;
      const iconA = this.icons[a];
      const iconB = this.icons[b];
      const iconC = this.icons[c];
      let icon = [iconA, iconB, iconC].find((c) => c !== 0);
      icon = icon || iconA;
      const payRateConfig = payRateConfigs.find((config) => config.icon === icon);
      if (!payRateConfig) {
        throw new Error("payRate not found");
      }

      const amount = payRateConfig.rate * baseBet * baseRate;
      positionAmount[(index + 1).toString()] = +amount.toFixed(2);
    }
    return positionAmount as { string: number };
  }

  public getPositionAmount10(params: {
    winIndexes: number[];
    baseBet: number;
    baseRate: number;
    payRateConfigs: IconPayRate[];
    PossibleWinLines: any;
  }) {
    const { winIndexes, baseBet, baseRate, payRateConfigs, PossibleWinLines } = params;
    const positionAmount: any = {};
    for (let i = 0; i < winIndexes.length; i++) {
      const index = winIndexes[i];
      const line = PossibleWinLines[index];
      const [a, b, c] = line;
      const iconA = this.icons[a];
      const iconB = this.icons[b];
      const iconC = this.icons[c];
      let icon = [iconA, iconB, iconC].find((c) => c !== 0);
      icon = icon || iconA;
      const payRateConfig = payRateConfigs.find((config) => config.icon === icon);
      if (!payRateConfig) {
        throw new Error("payRate not found");
      }

      const amount = payRateConfig.rate * baseBet * baseRate;
      positionAmount[(index + 1).toString()] = +amount.toFixed(2);
    }
    return positionAmount as { string: number };
  }

  public normalSpin(payRateConfigs: IconPayRate[]) {
    const winIndexes = this.getWinLines();
    const winPositions = this.getWinPosition(winIndexes);
    const positionAmount = this.getPositionAmount({
      winIndexes,
      baseBet: 1,
      baseRate: 1,
      payRateConfigs,
    });
    return {
      icons: this.icons,
      winPositions,
      positionAmount,
      winIndexes,
    };
  }

  public async checkSpecialOrNormal(
    userGameStore: UserGameStore,
    totalBet: number,
    configCalculate: (machineRtp: number, type: keyof typeof FortuneTigerSpecialTypes) => SpecialRTPPrizeRateResult[],
  ) {
    let checkStart = Date.now();
    const { playerId, gameID } = userGameStore;
    const currentBetAmount = await userGameStore.getBetAmount();
    await userGameStore.setBetAmount(totalBet);
    if (!new Decimal(currentBetAmount).eq(totalBet)) {
      await userGameStore.resetTotalBet();
      await userGameStore.resetTotalWin();
      await userGameStore.resetBetCount();
    }
    await userGameStore.addBetCount();

    const userRtp = await userGameStore.getCurrentRTP();
    const betCount = await userGameStore.getBetCount();
    const rtpLevel = await userGameStore.getRtpLevel();
    const betLevel = await userGameStore.getBetLevel();

    console.log(
      `playerId: ${userGameStore.playerId}关于奖池的信息`,
      "rtpLevel:",
      JSON.stringify(rtpLevel),
      "betLevel:",
      JSON.stringify(betLevel),
    );

    if (!rtpLevel) {
      throw new Error("rtp level not found");
    }
    if (!betLevel) {
      throw new Error("bet level not found");
    }
    const operator = await userGameStore.getOperator();
    const moneyPool = await userGameStore.getMoneyPool();

    const currentLevelRtp = await GameMoneyPoolService.getPoolProfitRate(moneyPool);

    console.log("当前奖池利润率:", currentLevelRtp, "用户RTP:", betCount, "当前运营商", operator.id);

    const isNewer = await userGameStore.isNewer();
    const isTrail = await userGameStore.isTrail();
    console.log("isNewer:", isNewer, "isTrail:", isTrail);

    //预测的总RTP
    const predictedRtp = isTrail
      ? new Decimal(2)
      : new Decimal(rtpLevel?.max || 0)
          .add(currentLevelRtp)
          .minus(1)
          .add(rtpLevel.max || 0);

    console.log("预测的总RTP", predictedRtp, "当前运营商最大", rtpLevel.max);

    const specialConfigs = configCalculate(predictedRtp.toNumber(), isTrail ? "trail" : isNewer ? "newer" : "normal");

    const specialConfig = isTrail
      ? specialConfigs.find(
          (config) => userRtp >= config.minUserRtp && userRtp <= config.maxUserRtp && betCount >= config.minBetCount,
        )
      : predictedRtp.lessThan(rtpLevel?.max)
        ? null
        : specialConfigs.find(
            (config) => userRtp >= config.minUserRtp && userRtp <= config.maxUserRtp && betCount >= config.minBetCount,
          );

    const gamePlayer = await userGameStore.getPlayer();

    if (!gamePlayer) {
      throw new Error("player not found");
    }

    console.log(
      "当前获取的配置的: playerId:" + playerId,
      "当前用户RTP:" + userRtp,
      JSON.stringify(specialConfig),
      "当前rtpLevel:",
      JSON.stringify(rtpLevel),
      "当前betLevel:",
      JSON.stringify(betLevel),
    );

    console.log(
      "playerId:",
      playerId,
      "operatorUser:",
      gamePlayer.operatorAccountID,
      "gameId:",
      gameID,
      "特殊玩法配置:",
      JSON.stringify(specialConfig),
      "用户RTP:",
      userRtp,
      "投注次数:",
      betCount,
    );
    // && userRtp <= rtpLevel.max
    if (specialConfig) {
      //提前预测是否奖池能够承受最大特殊奖励
      const tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHigh(
        new Decimal(specialConfig.maxWinRate).mul(currentBetAmount).div(specialConfig.lineRate).add(1),
      );
      if (tooHigh && !gamePlayer.isTest) {
        console.log("检查是否是特殊玩法 耗时time:", Date.now() - checkStart);

        return {
          type: "normal",
          maxWinRate: 0,
          minWinRate: 0,
          userGameStore,
        };
      }

      const possible = random.float(0, 100);
      const countHappenedRate = specialConfig.happenedRate * 100;

      let isSpecial = possible < countHappenedRate;

      console.log("是否特殊玩法", isSpecial, possible, countHappenedRate);
      if (userRtp < 0.5 && random.int(50, 100) % betCount == 0) {
        //如果用户RTP小于0.5，有50%的概率触发特殊玩法
        isSpecial = true;
      }

      if (isSpecial) {
        userGameStore.resetBetCount();
      }
      console.log("检查是否是特殊玩法 耗时time:", Date.now() - checkStart);
      return {
        type: isSpecial ? "special" : "normal",
        maxWinRate: specialConfig.maxWinRate,
        minWinRate: specialConfig.minWinRate,
        userGameStore,
      };
    } else {
      //用户RTP超出范围, 离开当前的池子，重新加入的时候会去寻找新的池子
      console.log("检查是否是特殊玩法 耗时time:", Date.now() - checkStart);
      return {
        type: "normal",
        maxWinRate: 0,
        minWinRate: 0,
        userGameStore,
      };
    }
  }

  public async checkDragonSpecialOrNormal(
    userGameStore: UserGameStore,
    totalBet: number,
    configCalculate: (
      machineRtp: number,
      type: keyof typeof FortuneTigerSpecialTypes,
      prizeAssurance: boolean,
    ) => SpecialRTPPrizeRateResult[],
    prizeAssurance: boolean,
  ) {
    const { playerId, gameID } = userGameStore;
    const currentBetAmount = await userGameStore.getBetAmount();
    await userGameStore.setBetAmount(totalBet);
    if (!new Decimal(currentBetAmount).eq(totalBet) && !prizeAssurance) {
      await userGameStore.resetTotalBet();
      await userGameStore.resetTotalWin();
      await userGameStore.resetBetCount();
    }
    await userGameStore.addBetCount();

    const userRtp = await userGameStore.getCurrentRTP();
    const rtpLevel = await userGameStore.getRtpLevel();
    if (!rtpLevel) {
      throw new Error("rtp level not found");
    }
    const betLevel = await userGameStore.getBetLevel();
    if (!betLevel) {
      throw new Error("bet level not found");
    }
    const betCount = await userGameStore.getBetCount();
    const moneyPool = await userGameStore.getMoneyPool();
    const currentLevelRtp = await GameMoneyPoolService.getPoolProfitRate(moneyPool);

    console.log("当前奖池利润率:", currentLevelRtp, "用户RTP:", userRtp);

    const isNewer = await userGameStore.isNewer();
    const isTrail = await userGameStore.isTrail();
    console.log("isNewer:", isNewer, "isTrail:", isTrail);

    //预测的总RTP
    const predictedRtp = isTrail
      ? new Decimal(2)
      : new Decimal(rtpLevel?.max || 0)
          .add(currentLevelRtp)
          .minus(1)
          .add(rtpLevel?.max || 0);

    console.log("预测的总RTP", predictedRtp, "当前运营商最大", rtpLevel.max);

    const specialConfigs = configCalculate(
      predictedRtp.toNumber(),
      isTrail ? "trail" : isNewer ? "newer" : "normal",
      prizeAssurance,
    );

    const specialConfig = isTrail
      ? specialConfigs.find(
          (config) => userRtp >= config.minUserRtp && userRtp <= config.maxUserRtp && betCount >= config.minBetCount,
        )
      : predictedRtp.lessThan(rtpLevel?.max)
        ? null
        : specialConfigs.find(
            (config) => userRtp >= config.minUserRtp && userRtp <= config.maxUserRtp && betCount >= config.minBetCount,
          );

    const gamePlayer = await userGameStore.getPlayer();

    if (!gamePlayer) {
      throw new Error("player not found");
    }

    //概率需要每次旋转都尝试，让这个更符合规划的概率

    console.log(
      "playerId:",
      playerId,
      "operatorUser:",
      gamePlayer.operatorAccountID,
      "gameId:",
      gameID,
      "特殊玩法配置:",
      JSON.stringify(specialConfig),
      "用户RTP:",
      userRtp,
      "投注次数:",
      betCount,
    );
    // && userRtp <= rtpLevel?.max
    if (specialConfig) {
      //提前预测是否奖池能够承受最大特殊奖励
      const tooHigh = await GameMoneyPoolService.ifMoneyPoolTooHigh(
        new Decimal(specialConfig.maxWinRate).mul(currentBetAmount).div(specialConfig.lineRate).add(1),
      );

      const possible = random.float(0, 100);
      const countHappenedRate = specialConfig.happenedRate * 100;

      let isSpecial = possible < countHappenedRate;
      console.log("是否特殊玩法", isSpecial, possible, countHappenedRate);
      // const isSpecial = possible < 30; //for testing
      if (userRtp < 0.5 && random.int(50, 100) % betCount == 0) {
        //如果用户RTP小于0.5，有50%的概率触发特殊玩法
        isSpecial = true;
      }

      if (isSpecial) {
        userGameStore.resetBetCount();
      }
      return {
        type: isSpecial ? "special" : "normal",
        maxWinRate: specialConfig.maxWinRate,
        minWinRate: specialConfig.minWinRate,
        userGameStore,
      };
    } else {
      return {
        type: "normal",
        maxWinRate: 0,
        minWinRate: 0,
        userGameStore,
      };
    }
  }
}
