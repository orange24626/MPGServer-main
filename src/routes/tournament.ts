import { OpenAPIHono } from "@hono/zod-openapi";

export const tournamentProxy = new OpenAPIHono();

tournamentProxy.post("/TournamentExistance", async (c) => {
  return c.json({
    dt: null,
    err: null,
  });
});

tournamentProxy.post("/TournamentExistance", async (c) => {
  return c.json({
    dt: null,
    err: null,
  });
});

tournamentProxy.post("/InitLite", async (c) => {
  return c.json({
    dt: {
      tc: 0,
      r: [],
      tp: 0,
    },
    err: null,
  });
});

tournamentProxy.post("/Init", async (c) => {
  return c.json({
    dt: {
      tc: 0,
      r: [],
      tp: 0,
    },
    err: null,
  });
});
