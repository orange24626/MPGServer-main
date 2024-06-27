import { CronStart } from "./services/CronService";
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
import { connectRedis } from "utils";

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
  
if (getServerType().includes("WORKER_SERVICE")) {

    CronStart();
}

const server = Bun.serve({

    port: isDev ? 3000 : 80,
    // @ts-ignore
    reusePort: true, // allow Bun server instances to use same port

    fetch(request) {
        
        const url = new URL(request.url);
        
        if (url.pathname === "/health-check"){

            return new Response("OK");
        
        }else{
        
            return new Response("Welcome to Bun!");
        }
    }

})

console.log(`Listening on localhost:${server.port}`);