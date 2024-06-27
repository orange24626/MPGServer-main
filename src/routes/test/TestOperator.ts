import { OpenAPIHono } from "@hono/zod-openapi";

export const TestOperatorRoute = new OpenAPIHono();

TestOperatorRoute.post("/login", (c) => {
  return c.json({
    code: 0,
    data: {
      token: "test-token",
    },
  });
});

TestOperatorRoute.post("/register", (c) => {
  return c.json({
    code: 0,
    data: {
      token: "test-token",
    },
  });
});
