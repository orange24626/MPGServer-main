import { z } from "@hono/zod-openapi";
import { Prisma } from "@prisma/client";

import bcrypt from "bcryptjs";

import {
  OperatorApplyPostInput,
  defaultOperatorPermissions,
} from "dtos/operatorApply";
import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { ParsedQs } from "qs";
import { parseQuery } from "utils/parseQuery";
import { prismaClient } from "utils/prismaClient";
import { AdminService } from "./AdminService";
import { RoleService } from "./RoleService";

export enum OperatorStatusEnum {
  INIT,
  PASS,
  REJECT,
}

// 0:未处理 1:已通过 2:已拒绝
export class OperatorApplyService {
  static deleteOneApply(id: string) {
    return prismaClient.operatorApply.delete({
      where: {
        id: +id,
      },
    });
  }
  static async passOneApply(id: string) {
    let apply = await prismaClient.operatorApply.findUnique({
      where: {
        id: +id,
      },
    });
    if (!apply) {
      throw new HTTPException(404, { message: "Not found" });
    }
    apply = await prismaClient.operatorApply.update({
      where: {
        id: +id,
        version: apply.version,
      },
      data: {
        status: OperatorStatusEnum.PASS,
        version: {
          increment: 1,
        },
      },
    });

    const operator = await prismaClient.operator.create({
      data: {
        name: apply.name,
        introduction: apply.introduction,
        rtpLevel: apply.rtp,
        lang: apply.lang,
        currency: apply.currency,
        operatorID: nanoid(),
        operatorKey: nanoid(),
        operatorSecret: nanoid(),
        status: 1,
      },
    });

    const role = await RoleService.createRole({
      name: apply.name + "管理员",
      description: apply.introduction || "",
      operatorId: operator.id,
      permissions: defaultOperatorPermissions,
    });
    const saltRounds = 10;
    const admin = await AdminService.createAdmin({
      username: apply.username,
      password: apply.password,
      email: apply.email,
    });
    await prismaClient.adminRole.create({
      data: {
        adminId: admin.id,
        roleId: role.id,
      },
    });

    return apply;
  }

  static async rejectOneApply(id: string) {
    let apply = await prismaClient.operatorApply.findUnique({
      where: {
        id: +id,
      },
    });
    if (!apply) {
      throw new HTTPException(404, { message: "Not found" });
    }
    apply = await prismaClient.operatorApply.update({
      where: {
        id: +id,
        version: apply.version,
      },
      data: {
        status: OperatorStatusEnum.REJECT,
        version: {
          increment: 1,
        },
      },
    });
    return apply;
  }

  static getApplyById(id: string) {
    return prismaClient.operatorApply.findUnique({
      where: {
        id: +id,
      },
    });
  }

  static async createApply(input: z.infer<typeof OperatorApplyPostInput>) {
    const usernameExist = await prismaClient.admin.findFirst({
      where: {
        username: input.username,
      },
    });
    if (usernameExist) {
      throw new HTTPException(400, { message: "用户名已存在" });
    }
    const emailExist = await prismaClient.admin.findFirst({
      where: {
        email: input.email,
      },
    });

    if (emailExist) {
      throw new HTTPException(400, { message: "邮箱已存在" });
    }

    const nameExist = await prismaClient.operator.findFirst({
      where: {
        name: input.name,
      },
    });
    if (nameExist) {
      throw new HTTPException(400, { message: "运营商名称已存在" });
    }

    return prismaClient.operatorApply.create({
      data: {
        ...input,
        status: OperatorStatusEnum.INIT,
      },
    });
  }

  static async getApplies(query: ParsedQs) {
    try {
      const { condition, skip, take, orderBy } = parseQuery(
        query,
        Prisma.OperatorApplyScalarFieldEnum,
      );
      const list = await prismaClient.operatorApply.findMany({
        where: condition,
        skip,
        take,
        orderBy,
      });
      const count = await prismaClient.operatorApply.count({
        where: condition,
      });

      return {
        list,
        total: count,
      };
    } catch (error: any) {
      console.error(error);
      throw new HTTPException(500, { message: error.message });
    }
  }
}
