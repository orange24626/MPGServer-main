import { Prisma } from "@prisma/client";
import { parseQuery } from "../utils";
import { prismaClient } from "../utils";
import { HTTPException } from "hono/http-exception";
import { ParsedQs } from "qs";

export class PermissionService {
  static getPermission(id: number) {
    return prismaClient.permission.findUnique({
      where: {
        id,
      },
    });
  }

  static createPermission(input: Prisma.PermissionCreateInput) {
    //todo add admin for operator
    return prismaClient.permission.create({
      data: input,
    });
  }

  static updatePermission(id: number, input: Prisma.PermissionUpdateInput) {
    return prismaClient.permission.update({
      where: {
        id,
      },
      data: input,
    });
  }

  static deletePermission(id: number) {
    return prismaClient.permission.delete({
      where: {
        id,
      },
    });
  }

  static async getPermissions() {
    try {
      return {
        list: [],
        total: 0,
      };
    } catch (error: any) {
      console.error(error);
      throw new HTTPException(500, { message: error.message });
    }
  }
}
