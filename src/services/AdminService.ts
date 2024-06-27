import { Prisma } from "@prisma/client";
import { ParsedQs } from "qs";
import { parseQuery, prismaClient } from "utils";
import { SessionService } from "./SessionService";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { AdminPostEdit, AdminPostInput } from "dtos";
import bcrypt from "bcryptjs";
import { AvatarGenerator } from "random-avatar-generator";

const avatarGenerator = new AvatarGenerator();

export class AdminService {
  static async resetPassword(adminId: number, password: string) {
    return prismaClient.admin.update({
      where: {
        id: adminId,
      },
      data: {
        password: this.generateHash(password),
      },
    });
  }
  static async getAdmins(query: ParsedQs, operatorIds: number[] = []) {
    const { skip, take, orderBy, condition } = parseQuery(
      query,
      Prisma.GamePlayerScalarFieldEnum,
    );
    if (operatorIds.length > 0) {
      let contains = operatorIds.reduce((acc: any, cur: any) => {
        acc = acc || cur;
        return acc;
      });
      condition.operatorIds = {
        has: contains,
      };
    }
    const list = await prismaClient.admin.findMany({
      where: {
        ...condition,

        isRoot: false,
      },
      skip,
      take,
      orderBy,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        adminRole: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                operatorId: true,
              },
            },
          },
        },
      },
    });
    const total = await prismaClient.admin.count({
      where: {
        ...condition,
        isRoot: false,
      },
    });
    return {
      list: list.map((item) => {
        return {
          ...item,
          roleIds: item.adminRole.map((role) => role.role.id),
          operatorIds: item.adminRole.map((role) => role.role.operatorId),
        };
      }),
      total,
    };
  }
  static async getProfileByToken(token: string) {
    const id = await SessionService.getIdByToken("admin", token);
    if (!id) {
      throw new HTTPException(401, {
        message: "Invalid token",
      });
    }
    const admin = await prismaClient.admin.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });
    if (!admin) {
      throw new HTTPException(401, {
        message: "Invalid admin",
      });
    }
    return admin;
  }

  static generateHash(origin: string) {
    const saltRounds = 10;
    bcrypt.genSaltSync(saltRounds);

    return bcrypt.hashSync(origin, saltRounds);
  }

  static async getAdmin(id: number) {
    const admin = await prismaClient.admin.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        adminRole: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!admin) {
      throw new HTTPException(404, {
        message: "Admin not found",
      });
    }
    return {
      ...admin,
      roleIds: admin.adminRole.map((role) => role.role.id),
    };
  }

  static async adminCreateAdmin(input: z.infer<typeof AdminPostInput>) {
    const { password, password2, roleIds, username, email } = input;
    if (password !== password2) {
      throw new HTTPException(400, {
        message: "Password not match",
      });
    }

    const usernameExist = await prismaClient.admin.findFirst({
      where: {
        username,
      },
    });
    if (usernameExist) {
      throw new HTTPException(400, {
        message: "Username exist",
      });
    }

    const emailExist = await prismaClient.admin.findFirst({
      where: {
        email,
      },
    });

    if (emailExist) {
      throw new HTTPException(400, {
        message: "Email exist",
      });
    }
    const roles = await prismaClient.role.findMany({
      where: {
        id: {
          in: roleIds,
        },
      },
    });

    const admin = await prismaClient.admin.create({
      data: {
        username: username,
        email,
        avatar: avatarGenerator.generateRandomAvatar(),
        password: this.generateHash(input.password),
        operatorIds: roles
          .filter((r) => r.operatorId !== null)
          .map((role) => role.operatorId) as number[],
      },
    });

    await prismaClient.adminRole.deleteMany({
      where: {
        adminId: admin.id,
      },
    });

    await prismaClient.adminRole.createMany({
      data: roles.map((role) => ({
        roleId: role.id,
        adminId: admin.id,
      })),
    });
    return admin;
  }

  static createAdmin(input: Prisma.AdminCreateInput) {
    const avatar = avatarGenerator.generateRandomAvatar();
    return prismaClient.admin.create({
      data: {
        ...input,
        password: this.generateHash(input.password),
        avatar,
      },
    });
  }

  static async updateAdmin(id: number, input: z.infer<typeof AdminPostEdit>) {
    const admin = await prismaClient.admin.findUnique({
      where: {
        id,
      },
    });
    if (!admin) {
      throw new HTTPException(404, {
        message: "Admin Not Found",
      });
    }
    const { roleIds } = input;
    let operatorIds: number[] = [];
    if (roleIds && roleIds.length > 0) {
      const roles = await prismaClient.role.findMany({
        where: {
          id: {
            in: roleIds,
          },
        },
      });

      operatorIds = roles
        .filter((r) => r.operatorId !== null)
        .map((role) => role.operatorId) as number[];

      await prismaClient.adminRole.deleteMany({
        where: {
          adminId: id,
        },
      });
      await prismaClient.adminRole.createMany({
        data: roles.map((role) => ({
          roleId: role.id,
          adminId: id,
        })),
      });
    }

    return prismaClient.admin.update({
      where: {
        id,
      },
      data: {
        email: input.email,
        operatorIds,
      },
    });
  }

  static async deleteAdmin(id: number) {
    await prismaClient.adminRole.deleteMany({
      where: {
        adminId: id,
      },
    });
    return prismaClient.admin.delete({
      where: {
        id,
      },
    });
  }
}
