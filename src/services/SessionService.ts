import { redisClient } from "../utils/redisClient";
import { nanoid } from "nanoid";

export interface SessionStore {
  id: string;
  appName: string;
  token: string;
  createdAt: number;
  ip?: string;
  deviceId?: string;
  data?: any;
}

export class SessionService {
  static async setSession(params: { id: string; appName: string; token: string }) {
    const { id, token, appName } = params;
    const key = `sessions:${appName}:token:${token}`;

    await redisClient.set(key, id);

    await redisClient.expire(key, 60 * 60 * 24);
  }

  static async createSession(params: { id: string; appName: string; data?: any; ip?: string; deviceId?: string }) {
    const { id, ip, deviceId, appName, data } = params;
    const token = nanoid();
    await this.setSession({ id, token, appName });
    const sessionObj: SessionStore = {
      ip,
      appName,
      token,
      createdAt: Date.now(),
      id,
      deviceId,
      data,
    };

    const idKey = `sessions:${appName}:id:${id}`;

    await redisClient.lPush(idKey, JSON.stringify(sessionObj));
    await redisClient.expire(idKey, 60 * 60 * 24);

    const tenMinsRangeKey = `sessions:${appName}:tenMinsRange`;
    const minuteRangeKey = `sessions:${appName}:minuteRange`;
    const oneHourRangeKey = `sessions:${appName}:oneHourRange`;
    const hours24RangeKey = `sessions:${appName}:hours24Range`;
    const staticKey = `sessions:${appName}:count`;

    await redisClient.incr(tenMinsRangeKey);
    await redisClient.incr(minuteRangeKey);
    await redisClient.incr(oneHourRangeKey);
    await redisClient.incr(hours24RangeKey);
    await redisClient.incr(staticKey);

    await redisClient.expire(tenMinsRangeKey, 60 * 10);
    await redisClient.expire(minuteRangeKey, 60);
    await redisClient.expire(oneHourRangeKey, 60 * 60);
    await redisClient.expire(hours24RangeKey, 60 * 60 * 24);
    await redisClient.expire(staticKey, 60 * 60 * 24);

    return token;
  }

  static async getActivities(
    appName: string,
    duration: "10m" | "1h" | "24h" | "1m" | "1w" | "1y" | "all" = "10m",
  ): Promise<number> {
    const tenMinsRangeKey = `sessions:${appName}:tenMinsRange`;
    const minuteRangeKey = `sessions:${appName}:minuteRange`;
    const oneHourRangeKey = `sessions:${appName}:oneHourRange`;
    const hours24RangeKey = `sessions:${appName}:hours24Range`;
    const staticKey = `sessions:${appName}:count`;

    let count: any = 0;

    if (duration === "10m") {
      count = await redisClient.get(tenMinsRangeKey);
    }
    if (duration === "1h") {
      count = await redisClient.get(oneHourRangeKey);
    }
    if (duration === "24h") {
      count = await redisClient.get(hours24RangeKey);
    }
    if (duration === "1m") {
      count = await redisClient.get(minuteRangeKey);
    }
    if (duration === "all") {
      count = await redisClient.get(staticKey);
    }
    return +count;
  }

  static async getIdByToken(appName: string, token: string) {
    const key = `sessions:${appName}:token:${token}`;
    const id = await redisClient.get(key);
    if (id) {
      return id;
    }
    return null;
  }

  static async getSessions(appName: string, id: string) {
    const key = `sessions:${appName}:id:${id}`;
    let sessions = await redisClient.lRange(key, 0, -1);
    sessions = sessions || [];
    return sessions.map((session) => JSON.parse(session)) as SessionStore[];
  }

  static async getSessionsByToken(appName: string, token: string) {
    const id = await this.getIdByToken(appName, token);
    if (!id) {
      return [] as SessionStore[];
    }
    return await this.getSessions(appName, id);
  }

  static async deleteSessionByToken(appName: string, token: string) {
    const id = await this.getIdByToken(appName, token);
    if (!id) {
      return null;
    }
    const key = `sessions:${appName}:token:${token}`;
    const idKey = `sessions:${appName}:id:${id}`;
    await redisClient.del(key);
    await redisClient.del(idKey);

    const tenMinsRangeKey = `sessions:${appName}:tenMinsRange`;
    const minuteRangeKey = `sessions:${appName}:minuteRange`;
    const oneHourRangeKey = `sessions:${appName}:oneHourRange`;
    const hours24RangeKey = `sessions:${appName}:hours24Range`;

    await redisClient.del(tenMinsRangeKey);
    await redisClient.del(minuteRangeKey);
    await redisClient.del(oneHourRangeKey);
    await redisClient.del(hours24RangeKey);

    return true;
  }

  static async deleteAllSessionById(appName: string, userId: number) {
    const key = `sessions:${appName}:id:${userId}`;
    await redisClient.del(key);
  }

  static async renewSession(appName: string, token: string) {
    const id = await this.getIdByToken(appName, token);
    if (!id) {
      return null;
    }
    const tenMinsRangeKey = `sessions:${appName}:tenMinsRange`;
    const minuteRangeKey = `sessions:${appName}:minuteRange`;
    const oneHourRangeKey = `sessions:${appName}:oneHourRange`;
    const hours24RangeKey = `sessions:${appName}:hours24Range`;
    const staticKey = `sessions:${appName}:count`;

    await redisClient.expire(tenMinsRangeKey, 60 * 10);
    await redisClient.expire(minuteRangeKey, 60);
    await redisClient.expire(oneHourRangeKey, 60 * 60);
    await redisClient.expire(hours24RangeKey, 60 * 60 * 24);
    await redisClient.expire(staticKey, 60 * 60 * 24);

    const idKey = `sessions:${appName}:id:${id}`;
    await redisClient.expire(idKey, 60 * 60 * 24);

    await this.setSession({
      id,
      token,
      appName,
    });

    return true;
  }
}
