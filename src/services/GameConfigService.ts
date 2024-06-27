import { ConfigNoPrize, ConfigPlayerType, ConfigRTP, ConfigThreeColumnsCardWeight } from "@prisma/client";
import { gamePresetResults } from "gameConfigs";
import { HTTPException } from "hono/http-exception";

import random from "random";
import { prismaClient } from "utils/prismaClient";
import { redisClient } from "utils/redisClient";

export class GameConfigService {
  static async getRandomRTPConfig(gameID: number) {
    const count = await redisClient.get(`${gameID}:rtpCount`);
    const randomCount = random.int(1, parseInt(count || "0"));
    const rltStr = await redisClient.get(`rtp-config:${gameID}:${randomCount}`);
    let config: any = null;
    if (!rltStr) {
      config = await prismaClient.configRTP.findFirst({
        where: {
          gameID,
          rtpNumber: randomCount,
        },
      });
    }
    if (config) {
      await redisClient.set(`rtp-config:${gameID}:${randomCount}`, JSON.stringify(config));
    } else {
      config = JSON.parse(rltStr || "{}");
    }
    return config as ConfigRTP;
  }
  static async getRTPConfigByNumber(gameID: number, rtpNumber: number) {
    const rltStr = await redisClient.get(`rtp-config:${gameID}:${rtpNumber}`);
    let config: any = null;
    if (!rltStr) {
      config = await prismaClient.configRTP.findFirst({
        where: {
          gameID,
          rtpNumber,
        },
      });
    }
    if (config) {
      await redisClient.set(`rtp-config:${gameID}:${rtpNumber}`, JSON.stringify(config));
    } else {
      config = JSON.parse(rltStr || "{}");
    }
    return config as ConfigRTP;
  }

  static async getRTPConfigByRtpNumber(gameID: number, rtpNumber: number) {
    const rltStr = await redisClient.get(`rtp-config:${gameID}:${rtpNumber}`);
    let config: any = null;
    if (!rltStr) {
      config = await prismaClient.configRTP.findFirst({
        where: {
          gameID,
          rtpNumber,
        },
      });
    }
    if (config) {
      await redisClient.set(`rtp-config:${gameID}:${rtpNumber}`, JSON.stringify(config));
    } else {
      config = JSON.parse(rltStr || "{}");
    }
    return config as ConfigRTP;
  }

  static async getHighestRTPConfig(gameID: number) {
    const rltStr = await redisClient.get(`highest-rtp-config:${gameID}`);
    let config: any = null;
    if (!rltStr) {
      config = await prismaClient.configRTP.findFirst({
        where: {
          gameID,
        },
        orderBy: {
          rtpNumber: "desc",
        },
      });
    }
    if (config) {
      await redisClient.set(`highest-rtp-config:${gameID}`, JSON.stringify(config));
    } else {
      config = JSON.parse(rltStr || "{}");
    }
    return config as ConfigRTP;
  }

  static async getRandomSpecialPrize(gameID: number, count?: number) {
    const totalCountStr = await redisClient.get(`${gameID}:specialPrizeCount`);
    const totalCount = count ? count : parseInt(totalCountStr || "0");
    const randomCount = random.int(1, totalCount);

    const config = await prismaClient.configSpecialPrize.findFirst({
      where: {
        gameID,
        count: {
          lte: randomCount,
        },
      },
      orderBy: {
        count: "desc",
      },
    });
    return config;
  }

  static async getRandomPayRateSpecialCountLessThan(gameID: number, payRate: number) {
    const key = `getRandomPayRateSpecialCountLessThan${gameID}:specialPrizeCountByLessThan:${payRate}`;
    const countStr = await redisClient.get(key);
    let count = +(countStr || "0");
    if (!count || count === 0) {
      count = await prismaClient.configSpecialPrize.count({
        where: {
          gameID,
          payRate: {
            lte: Math.ceil(payRate),
          },
        },
      });
      await redisClient.set(key, count.toString());
    }

    return count;
  }

  static async getRandomPayRateSpecialPrize(params: {
    gameID: number;
    minPayRate: number;
    maxPayRate: number;
    roundLength?: number;
  }) {
    const startTime = Date.now();
    const { gameID, minPayRate, maxPayRate, roundLength = 1 } = params;

    const payRate = random.float(minPayRate < 3 ? 3 : minPayRate, maxPayRate < 5 ? 100 : maxPayRate);
    const allResults = gamePresetResults.get(gameID)?.specialResults;
    if (!allResults || allResults.length === 0) {
      throw new HTTPException(500, {
        message: `特殊玩法配置没有正常导入`,
      });
    }
    let results = gamePresetResults.get(gameID)?.specialResults;
    if (!results || results.length === 0) {
      throw new HTTPException(500, {
        message: `特殊玩法配置没有正常导入`,
      });
    }
    results = results.filter((result) => {
      let rounds = result.rounds;
      rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length >= 0) : [];
      return result.payRate <= payRate && result.payRate >= minPayRate;
    });
    let result = results.find((_result, index) => {
      const randomIndex = random.int(0, results.length - 1);
      return index === randomIndex;
    });
    if (!result) {
      result = allResults.find((r) => {
        let rounds = r.rounds;
        rounds = Array.isArray(rounds) ? rounds.filter((round: any) => round.cards.length >= 0) : [];
        return r.payRate <= 100 && rounds.length >= roundLength;
      });
    }
    console.log("getRandomPayRateSpecialPrize耗时:", Date.now() - startTime, "ms");
    return result;
  }

  static async getRandomNoPrize(gameID: number) {
    let results = gamePresetResults.get(gameID)?.noPrizeResults;
    if (!results || results.length === 0) {
      throw new HTTPException(500, {
        message: `未中奖配置没有正常导入`,
      });
    }
    results = results.filter((result) => {
      return result.cards.length >= 8;
    });
    const randomIndex = random.int(0, results.length - 1);
    const result = results[randomIndex];
    return { ...result, cards: [ ...result.cards ] };
  }
  static async getPlayerTypeConfig(gameID: number) {
    const rltStr = await redisClient.get(`player-type-config:${gameID}`);
    let config: ConfigPlayerType[] = [];
    if (!rltStr) {
      config = await prismaClient.configPlayerType.findMany({
        where: {
          gameID,
        },
      });
    }
    if (config) {
      await redisClient.set(`player-type-config:${gameID}`, JSON.stringify(config));
    } else {
      config = JSON.parse(rltStr || "{}");
    }
    return config as ConfigPlayerType[];
  }

  static async getPlayerTypeConfigByType(gameID: number, type: string) {
    const rltStr = await redisClient.get(`player-type-config:${gameID}`);
    let config: any = null;
    if (!rltStr) {
      config = await prismaClient.configPlayerType.findFirst({
        where: {
          gameID,
          type,
        },
      });
    }
    if (config) {
      await redisClient.set(`player-type-config:${gameID}`, JSON.stringify(config));
    } else {
      config = JSON.parse(rltStr || "{}");
    }
    return config as ConfigPlayerType;
  }

  static async getThreeColumnsCardWeightByCardID(gameID: number, cardID: number) {
    const rltStr = await redisClient.get(`three-columns-card-weight-config:${gameID}-${cardID}`);
    let config: any = null;
    if (!rltStr) {
      config = await prismaClient.configThreeColumnsCardWeight.findFirst({
        where: {
          gameID,
          cardID,
        },
      });
    }
    if (config) {
      await redisClient.set(`three-columns-card-weight-config:${gameID}-${cardID}`, JSON.stringify(config));
    } else {
      config = JSON.parse(rltStr || "{}");
    }
    return config as ConfigThreeColumnsCardWeight;
  }

  static async getThreeColumnsCardWeight(gameID: number) {
    const rltStr = await redisClient.get(`three-columns-card-weight-config:${gameID}`);
    let config: any = null;

    if (!rltStr) {
      config = await prismaClient.configThreeColumnsCardWeight.findMany({
        where: {
          gameID,
        },
      });
    }
    if (config) {
      await redisClient.set(`three-columns-card-weight-config:${gameID}`, JSON.stringify(config));
    } else {
      config = JSON.parse(rltStr || "{}");
    }
    return config as ConfigThreeColumnsCardWeight[];
  }

  static async getTicketAmount(gameID: number) {
    const rltStr = await redisClient.get(`ticket-weight-config:${gameID}`);

    let tickets: { gameID: number; amount: number; rate: number }[] = [];

    if (!rltStr) {
      tickets = await prismaClient.configTicket.findMany({ where: { gameID } });

      await redisClient.set(`ticket-weight-config:${gameID}`, JSON.stringify(tickets));
    } else {
      tickets = JSON.parse(rltStr);
    }

    const totalWeight = tickets.reduce((acc, ticket) => {
      return acc + ticket.rate * 1000000;
    }, 0);

    const randomWeight = random.int(0, Math.ceil(totalWeight));

    let currentWeight = 0;

    let currentAmount = (tickets && tickets[0]?.amount) || 0;

    for (const { rate, amount } of tickets) {
      currentWeight += rate * 1000000;

      if (randomWeight < currentWeight) return (currentAmount = amount);
    }

    return currentAmount;
  }
}
