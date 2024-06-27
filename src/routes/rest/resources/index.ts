import { OpenAPIHono } from "@hono/zod-openapi";
import { gamePlayers } from "./gamePlayers";
import operators from "./operators";
import { games } from "./games";
import { applies } from "./operatorApplies";
import { moneyPoolMachines } from "./moneyPoolMachines";
import { gameHistories } from "./gameHistories";
import { gamePlayerWallets } from "./gamePlayerWallets";
import { walletRecords } from "./walletRecords";
import { admins } from "./admins";
import { roles } from "./roles";
import { moneyPools } from "./moneyPools";
import { permissions } from "./permission";
import systemEventLogs from "./systemEventLogs";
import { gameOpHistories } from "./gameOpHistories";
import { operatorUsers } from "./operatorUsers";

const resources = new OpenAPIHono();

resources.route("/game-players", gamePlayers);
resources.route("/operator-users", operatorUsers);
resources.route("/operators", operators);
resources.route("/game-histories", gameHistories);
resources.route("/operator-game-histories", gameOpHistories);
resources.route("/games", games);
resources.route("/operator-applies", applies);
resources.route("/money-pool-machines", moneyPoolMachines);
resources.route("/money-pools", moneyPools);
resources.route("/permissions", permissions);
resources.route("/player-wallets", gamePlayerWallets);
resources.route("/wallet-records", walletRecords);
resources.route("/admins", admins);
resources.route("/roles", roles);
resources.route("/system-event-logs", systemEventLogs);

export default resources;
