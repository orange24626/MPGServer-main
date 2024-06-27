import { z } from "@hono/zod-openapi";

export const CreateSystemEventLogSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    operatorId: z.number(),
    permissions: z.any(z.unknown()),
  })
  .openapi("日志创建");

export const EditSystemEventLogSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    operatorId: z.number(),
    permissions: z.any(z.unknown()),
  })
  .openapi("日志创建");
