import { z } from "@hono/zod-openapi";

export const GameSessionPostInput = z
  .object({
    accessKey: z.string().openapi({
      description: "运营商的accessKey",
      example: "13800138000",
    }),
    username: z.string().openapi({
      description: "用户名",
      example: "13800138000",
    }),
    userID: z.string().openapi({
      description: "用户ID",
      example: "13800138000",
    }),
    currency: z.string().optional().openapi({
      description: "货币",
      example: "BRL",
    }),
    chanelID: z.string().optional().nullable().openapi({
      description: "渠道名",
      example: "mp165",
    }),
    sign: z.string().openapi({
      description: "签名",
      example: "xxxxxxx",
    }),
    test: z.boolean().optional().nullable().openapi({
      description: "是否测试",
      example: false,
    }),
  })
  .openapi("创建运营商用户会话参数");

export const GameSessionPostResponse = z
  .object({
    token: z.string().openapi({
      description: "运营商token",
    }),
    isNew: z.boolean().openapi({
      description: "是否新用户",
    }),
    balance: z.number().openapi({
      description: "余额",
    }),
    playerID: z.string().openapi({
      description: "玩家ID",
    }),
    operatorUserID: z.string().openapi({
      description: "运营商用户ID",
    }),
    test: z.boolean().optional().nullable().default(false).openapi({
      description: "是否测试",
      example: false,
    }),
  })
  .openapi("登录返回");

export const VerifySessionSchema = z.object({
  cp: z.string().openapi({
    description: "运营商用户ID",
    example: "316901",
  }),
  l: z.string().openapi({
    description: "语言",
    example: "pt",
  }),
  gi: z.string().openapi({
    description: "游戏ID",
    example: "126",
  }),
  tk: z.string().openapi({
    description: "访问token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  }),
  otk: z.string().openapi({
    description: "运营商token",
    example: "8d5a5b047fee3a539d0af45788f49257",
  }),
});

export const GameTrailPostInput = z
  .object({
    accessKey: z.string().openapi({
      description: "运营商的accessKey",
      example: "ebr-uQhxVO0eDpCfhILwc",
    }),
    currency: z.string().optional().openapi({
      description: "货币",
      example: "BRL",
    }),
  })
  .openapi("试玩参数");
