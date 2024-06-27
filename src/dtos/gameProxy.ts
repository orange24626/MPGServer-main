import { z } from "@hono/zod-openapi";

export const GameHistoryPostSchema = z
  .object({
    gid: z.string().openapi({
      param: {
        name: "accessToken",
      },
      example: "8d5a5b047fee3a539d0af45788f49257",
      description: "用户token",
    }),
    dtf: z.string().openapi({
      param: {
        name: "baseBet",
      },
      example: "0.3",
      description: "下注金额",
    }),
    dtt: z.string().openapi({
      param: {
        name: "baseBetRate",
      },
      example: "2",
      description: "下注倍率",
    }),
    bn: z.string().openapi({
      param: {
        name: "baseBetRate",
      },
      example: "2",
      description: "下注倍率",
    }),
    rc: z.string().openapi({
      param: {
        name: "platform",
      },
      example: "2",
      description: "平台",
    }),
    atk: z.string().openapi({
      param: {
        name: "winKey",
      },
      example: "0_C",
      description: "不是是啥",
    }),
    pf: z.string().openapi({
      param: {
        name: "btt",
      },
      example: "3",
      description: "不是是啥",
    }),
    wk: z.string().openapi({
      param: {
        name: "btt",
      },
      example: "3",
      description: "不是是啥",
    }),
    btt: z.string().openapi({
      param: {
        name: "btt",
      },
      example: "3",
      description: "不是是啥",
    }),
  })
  .openapi("获取游戏历史记录参数");

export const GameHistoryStaticPostSchema = z
  .object({
    gid: z.string().openapi({
      param: {
        name: "accessToken",
      },
      example: "8d5a5b047fee3a539d0af45788f49257",
      description: "用户token",
    }),
    dtf: z.string().openapi({
      param: {
        name: "baseBet",
      },
      example: "0.3",
      description: "下注金额",
    }),
    dtt: z.string().openapi({
      param: {
        name: "baseBetRate",
      },
      example: "2",
      description: "下注倍率",
    }),
    atk: z.string().openapi({
      param: {
        name: "winKey",
      },
      example: "0_C",
      description: "不是是啥",
    }),
    pf: z.string().openapi({
      param: {
        name: "btt",
      },
      example: "3",
      description: "不是是啥",
    }),
    wk: z.string().openapi({
      param: {
        name: "btt",
      },
      example: "3",
      description: "不是是啥",
    }),
    btt: z.string().openapi({
      param: {
        name: "btt",
      },
      example: "3",
      description: "不是是啥",
    }),
  })
  .openapi("获取游戏历史记录统计参数");
