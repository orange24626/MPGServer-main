import { Prisma } from "@prisma/client";
import { parseQuery } from "../utils";
import { prismaClient } from "../utils";
import { HTTPException } from "hono/http-exception";
import { ParsedQs } from "qs";
import { z } from "@hono/zod-openapi";
import { CreateSystemEventLogSchema, EditSystemEventLogSchema } from "dtos";

export class SystemEventLogService {
  static async getSystemEventLog(id: number) {
    const systemEventLog = await prismaClient.systemEventLog.findUnique({
      where: {
        id,
      },
    });
    if (!systemEventLog) throw new HTTPException(404, { message: "SystemEventLog not found" });
    return {
      ...systemEventLog,
      operatorId: systemEventLog.operatorId || -1,
    };
  }

  static updateSystemEventLog(id: number, input: z.infer<typeof EditSystemEventLogSchema>) {
    return prismaClient.systemEventLog.update({
      where: {
        id,
      },
      data: {
        ...input,
      },
    });
  }

  static deleteSystemEventLog(id: number) {
    return prismaClient.systemEventLog.delete({
      where: {
        id,
      },
    });
  }

  static async getSystemEventLogs(query: ParsedQs, operatorIds: number[]) {
    try {
      const { condition, skip, take, orderBy } = parseQuery(query, Prisma.SystemEventLogScalarFieldEnum);
      if (operatorIds.length > 0) {
        condition.operatorId = {
          in: operatorIds,
        };
      }
      const list = await prismaClient.systemEventLog.findMany({
        where: condition,
        skip,
        take,
        orderBy,
      });
      const count = await prismaClient.systemEventLog.count({
        where: condition,
      });
      return {
        list: list,
        total: count,
      };
    } catch (error: any) {
      console.error(error);
      throw new HTTPException(500, { message: error.message });
    }
  }
}
