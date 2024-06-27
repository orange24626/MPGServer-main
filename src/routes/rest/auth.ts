import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { AdminLoginInput, AdminLoginResponse } from "dtos/authAdmin";
import { AuthService } from "services";

export const adminAuth = new OpenAPIHono();
const AdminAuthLoginRoute = createRoute({
  description: "管理员登录",
  summary: "管理员登录",
  tags: ["后台管理"],
  method: "post",
  path: "/login",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdminLoginInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AdminLoginResponse,
        },
      },
      description: "Retrieve the games",
    },
  },
});

adminAuth.openapi(AdminAuthLoginRoute, async (c) => {
  const loginInput = c.req.valid("json");
  const data = await AuthService.adminLogin(loginInput);
  return c.json(data);
});
