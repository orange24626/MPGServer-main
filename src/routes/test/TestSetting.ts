import { OpenAPIHono } from "@hono/zod-openapi";

export const TestSettingRoute = new OpenAPIHono();

TestSettingRoute.post("/operator/setRTP", (c) => {
  return c.json({
    code: 0,
    data: {
      token: "test-token",
    },
  });
});

TestSettingRoute.post("/operator/getRTP", (c) => {
  return c.json({
    code: 0,
    data: {
      token: "test-token",
    },
  });
});

TestSettingRoute.post("/operator/setManyRTP", (c) => {
  return c.json({
    code: 0,
    data: {
      token: "test-token",
    },
  });
});
