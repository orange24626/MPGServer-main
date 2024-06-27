import { z } from "@hono/zod-openapi";

export const AdminPostInput = z
  .object({
    username: z.string().openapi({
      description: "管理员用户名",
    }),
    email: z
      .string()
      .openapi({
        description: "管理员邮箱",
      })
      .nullable(),
    password: z.string().openapi({
      description: "管理员密码",
    }),
    password2: z.string().openapi({
      description: "重复密码",
    }),
    roleIds: z.array(z.number()).openapi({
      description: "角色ID",
    }),
  })
  .openapi("管理员注册");

export const AdminPostEdit = z
  .object({
    email: z
      .string()
      .openapi({
        description: "管理员邮箱",
      })
      .nullable(),

    roleIds: z.array(z.number()).openapi({
      description: "角色ID",
    }),
  })
  .openapi("管理员注册");
