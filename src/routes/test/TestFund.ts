import { OpenAPIHono } from "@hono/zod-openapi";

export const TestFundRoute = new OpenAPIHono();

TestFundRoute.post("/addFound", (c) => {
  return c.json({
    code: 0,
    data: {
      token: "test-token",
    },
  });
});

TestFundRoute.post("/getFund", (c) => {
  return c.json({
    code: 0,
    data: {
      token: "test-token",
    },
  });
});

TestFundRoute.post("/operator/returnFund", (c) => {
  return c.json({
    code: 0,
    data: {
      token: "test-token",
    },
  });
});
