import { OpenAPIHono } from "@hono/zod-openapi";
import resources from "./resources";
import { adminAuth } from "./auth";
import { GameService, OperatorService } from "services";

const rest = new OpenAPIHono();

rest.route("/auth", adminAuth);
rest.get("/operators", async (c) => {
  const queries = c.req.query();
  const data = await OperatorService.getOperators(queries);
  return c.json(data);
});
rest.get("/games", async (c) => {
  const queries = c.req.query();
  const data = await GameService.getGames(queries);
  return c.json(data);
});
rest.route("/admin", resources);

export default rest;
