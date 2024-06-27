import { z } from "@hono/zod-openapi";

export const ListQuerySchema = z
  .object({
    range: z.string().optional().openapi({
      description: "页码",
      example: "[0,9]",
    }),
    sort: z.string().optional().openapi({
      description: "每页数量",
      example: '["createdAt", "DESC"]',
    }),
    filter: z.string().optional().openapi({
      description: "过滤条件",
      example: "{}",
    }),
  })
  .openapi("查询参数");

export const ListQueryResponse = z
  .object({
    list: z
      .array(
        z.object({
          id: z.number().openapi({
            description: "ID",
          }),
        }),
      )
      .openapi({
        description: "列表",
      }),
    total: z.number().openapi({
      description: "总数",
    }),
  })
  .openapi("查询返回");
