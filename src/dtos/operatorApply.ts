import { z } from "@hono/zod-openapi";

export const OperatorApplyPostInput = z
  .object({
    username: z.string().openapi({
      description: "用户名",
      example: "admin",
    }),
    introduction: z.string().openapi({
      description: "简介",
      example: "admin",
    }),
    password: z.string().openapi({
      description: "密码",
      example: "123456",
    }),
    email: z.string().openapi({
      description: "邮箱",
      example: "",
    }),
    name: z.string().openapi({
      description: "姓名",
      example: "张三",
    }),
    lang: z.string().openapi({
      description: "语言",
      example: "zh",
    }),
    currency: z.string().openapi({
      description: "货币",
      example: "CNY",
    }),
    rtp: z.number().openapi({
      description: "RTP",
      example: 96.5,
    }),
  })
  .openapi("运营商入驻申请");

export const defaultOperatorPermissions = {
  roles: ["create", "delete", "edit", "list", "show"],
  admins: ["create", "delete", "edit", "list", "show"],
  operators: ["edit", "list", "show"],
  "game-players": ["list", "show"],
  "game-histories": ["list", "show"],
  "player-wallets": ["list", "show", "charge"],
  "wallet-records": ["list", "show"],
};
