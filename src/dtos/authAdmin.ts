import { z } from "@hono/zod-openapi";

export const AdminLoginInput = z
  .object({
    username: z.string(),
    password: z.string(),
  })
  .openapi({ required: ["username", "password"] });

export const AdminLoginResponse = z.object({
  token: z.string(),
});
