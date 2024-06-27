import { z } from "@hono/zod-openapi";

export const GetGameUrlParams = z
  .object({
    gameID: z.string().openapi({
      param: {
        name: "gameId",
      },
      example: "126",
      description: "游戏ID",
    }),
    accessKey: z.string().openapi({
      param: {
        name: "operatorId",
      },
      example: "65d37e63e7f94e79922d8fec",
      description: "运营商accessKey",
    }),
    token: z.string().openapi({
      param: {
        name: "operatorUserToken",
      },
      example: "XL1u1AomQmCMS1uy0o4zi",
      description: "运营商用户token",
    }),
    sign: z.string().openapi({
      example: "XL1u1AomQmCMS1uy0o4zi",
      description: "签名",
    }),
    lang: z.string().optional().openapi({
      description: "语言",
    }),
  })
  .openapi("获取游戏链接参数");

export const GetGameUrlResponse = z
  .object({
    gameUrl: z.string().openapi({
      description: "游戏链接",
    }),
  })
  .openapi("获取游戏链接返回");
