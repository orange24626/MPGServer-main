// import { serveStatic } from "hono/bun";
import { authGame, gameProxy, gameProxySocial, tournamentProxy } from "./routes";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import rest from "./routes/rest";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import operatorProxy from "routes/operatorProxy";
import { ZodError } from "zod";
import gamesRoute from "routes/games";
import { getServerType } from "config";
import { importAllPresets } from "gameConfigs";
import { CronStart } from "./services/CronService";
import { connectRedis } from "utils";

const app = new OpenAPIHono();

try {
  await connectRedis();
} catch (error) {
  console.error("connectRedis error:", error);
  process.exit(1);
}

if (getServerType().includes("PLAYER_SERVICE")) {
  importAllPresets();
}

const isDev = process.env.NODE_ENV === "development";

app.use("/*", cors());

// app.use("/*", serveStatic({ root: "./public" }));

app.route("/web-api/auth/session/v2", authGame);
app.route("/web-api/game-proxy/v2", gameProxy);
app.route("/web-api/game-proxy/Tournament", tournamentProxy);
app.route("/web-api/game-proxy/Social", gameProxySocial);
app.route("/game-api", gamesRoute);

if (getServerType().includes("OPERATOR_SERVICE") || getServerType().includes("ORDERS_SERVICE")) {
  app.route("/operator-proxy", operatorProxy);
}

if (getServerType().includes("WORKER_SERVICE")) {
  CronStart();
}

app.route("/rest", rest);

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "MPG API",
  },
});
app.get(
  "/swagger",
  swaggerUI({
    url: "/doc",
  }),
);

app.openapi(
  createRoute({
    method: "get",
    tags: ["健康检查"],
    path: "/health-check",
    responses: {
      200: {
        description: "health check",
      },
    },
  }),
  (c) => {
    return c.text("OK");
  },
);

console.log("Server started");

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  if (err instanceof ZodError) {
    c.status(400);
    return c.json({
      err: err.errors,
    });
  }
  console.error(err);
  c.status(500);
  return c.json({
    err: err.message,
  });
});

export default {
  port: isDev ? 3000 : 80,
  fetch: app.fetch,
};
