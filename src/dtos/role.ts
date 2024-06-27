import { z } from "@hono/zod-openapi";

export const CreateRoleSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    operatorId: z.number(),
    permissions: z.any(z.unknown()),
  })
  .openapi("角色创建");

export const EditRoleSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    operatorId: z.number(),
    permissions: z.any(z.unknown()),
  })
  .openapi("角色创建");
