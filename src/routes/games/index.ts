import { OpenAPIHono } from "@hono/zod-openapi";
import { fortuneDragonRoute } from "./fortuneDragon";
import { fortuneTigerRoute } from "./fortuneTiger";
import { fortuneOxRoute } from "./fortuneOx";
import { fortuneMouseRoute } from "./fortuneMouse";
import { fortuneRabbitRoute } from "./fortuneRabbit";

import { fortuneElephantRoute } from "./fortuneElephant";

import { fortuneDoubleRoute } from "./fortuneDouble";
import { FortuneDragonTHRoute } from "./fortuneDragonTH";

import { luckyNekoRoute } from "./luckyNeko";

const gamesRoute = new OpenAPIHono();

gamesRoute.route("/fortune-dragon/", fortuneDragonRoute);
gamesRoute.route("/fortune-tiger/", fortuneTigerRoute);
gamesRoute.route("/fortune-ox/", fortuneOxRoute);
gamesRoute.route("/fortune-mouse/", fortuneMouseRoute);
gamesRoute.route("/fortune-rabbit/", fortuneRabbitRoute);

gamesRoute.route("/ganesha-gold/", fortuneElephantRoute);

gamesRoute.route("/fortune-dragonTH/", FortuneDragonTHRoute);
gamesRoute.route("/fortune-double/", fortuneDoubleRoute);

gamesRoute.route("/lucky-neko/", luckyNekoRoute);

export default gamesRoute;
