import { Prisma, RoleLevel } from "@prisma/client";
import { parseQuery } from "../utils";
import { prismaClient } from "../utils";
import { HTTPException } from "hono/http-exception";
import { ParsedQs } from "qs";
import { z } from "@hono/zod-openapi";
import { CreateRoleSchema, EditRoleSchema } from "dtos/role";

export class RoleService {
  static async getRole(id: number) {
    const role = await prismaClient.role.findUnique({
      where: {
        id,
      },
    });
    if (!role) throw new HTTPException(404, { message: "Role not found" });
    return {
      ...role,
      operatorId: role.operatorId || -1,
    };
  }

  static createRole(input: z.infer<typeof CreateRoleSchema>) {
    return prismaClient.role.create({
      data: {
        ...input,
        operatorId: input.operatorId == -1 ? undefined : input.operatorId,
        level: input.operatorId == -1 ? RoleLevel.Admin : RoleLevel.Operator,
      },
    });
  }

  static updateRole(id: number, input: z.infer<typeof EditRoleSchema>) {
    return prismaClient.role.update({
      where: {
        id,
      },
      data: {
        ...input,
        operatorId: input.operatorId == -1 ? null : input.operatorId,
        level: input.operatorId == -1 ? RoleLevel.Admin : RoleLevel.Operator,
      },
    });
  }

  static deleteRole(id: number) {
    return prismaClient.role.delete({
      where: {
        id,
      },
    });
  }

  static async getRoles(query: ParsedQs, operatorIds: number[]) {
    try {
      const { condition, skip, take, orderBy } = parseQuery(
        query,
        Prisma.RoleScalarFieldEnum,
      );
      if (operatorIds.length > 0) {
        condition.operatorId = {
          in: operatorIds,
        };
      }
      const list = await prismaClient.role.findMany({
        where: condition,
        skip,
        take,
        orderBy,
      });
      const count = await prismaClient.role.count({
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
