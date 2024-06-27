import { z } from "@hono/zod-openapi";

export const OperatorAdminPostInput = z
  .object({
    adminId: z.number().openapi({
      description: "管理员ID",
      example: 1,
    }),
    operatorId: z.number().openapi({
      description: "运营商ID",
      example: 1,
    }),
  })
  .openapi("运营商管理员绑定");
