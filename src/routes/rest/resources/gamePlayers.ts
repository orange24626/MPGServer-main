import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema } from "dtos";
import { HTTPException } from "hono/http-exception";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { GamePlayerService } from "services";
import { prismaClient } from "utils";

export const gamePlayers = new OpenAPIHono();

//permissions
gamePlayers.get(
  "/rest/admin/game-players",
  checkAdminPermission("game-players", PermissionAction.list),

  checkAdminPermission("game-players", PermissionAction.show),
);

gamePlayers.post("/rest/admin/game-players", checkAdminPermission("game-players", PermissionAction.create));

gamePlayers.put("/rest/admin/game-players/:id", checkAdminPermission("game-players", PermissionAction.edit));

gamePlayers.delete("/rest/admin/game-players/:id", checkAdminPermission("game-players", PermissionAction.delete));

const GetGamePlayersRoute = createRoute({
  description: "获取游戏玩家列表",
  summary: "获取游戏玩家列表",
  tags: ["后台管理"],
  method: "get",
  path: "/",
  request: {
    query: ListQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListQueryResponse,
        },
      },
      description: "Retrieve the gamePlayers",
    },
  },
});

gamePlayers.openapi(GetGamePlayersRoute, async (c) => {
  const queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];

  const data = await GamePlayerService.getPlayers(queries, operatorIds);
  return c.json(data);
});

const GetGamePlayerRoute = createRoute({
  description: "获取游戏玩家列表",
  summary: "获取游戏玩家列表",
  tags: ["后台管理"],
  method: "get",
  path: "/{id}",
  request: {
    params: z
      .object({
        id: z.string(),
      })
      .openapi("游戏玩家ID"),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.number(),
            })
            .openapi("游戏玩家"),
        },
      },
      description: "Retrieve the gamePlayers",
    },
  },
});

gamePlayers.openapi(GetGamePlayerRoute, async (c) => {
  const id = c.req.param("id");
  const player = await GamePlayerService.getGamePlayer(+id);
  if (!player) {
    throw new HTTPException(404, {
      message: "player not found",
    });
  }
  return c.json(player);
});

const CreateOneGamePlayer = createRoute({
  description: "添加单个运营商",
  summary: "添加单个运营商",
  tags: ["后台管理"],
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              nickname: z.string().nullable(),
              mobile: z.string().nullable(),
              email: z.string().nullable(),
              isTest: z.boolean(),
              isRobot: z.boolean(),
              testingExpired: z.date().nullable(),
              rtpLevel: z.number().nullable(),
              channelID: z.number().nullable(),
              password: z.string(),
              operatorId: z.number(),
            })
            .openapi("运营商创建"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.number(),
            })
            .openapi("运营商结果"),
        },
      },
      description: "创建运营商结果",
    },
  },
});

gamePlayers.openapi(CreateOneGamePlayer, async (c) => {
  const input = c.req.valid("json");
  const data = null;
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const UpdateOneGamePlayer = createRoute({
  description: "更新单个运营商",
  summary: "更新单个运营商",
  tags: ["后台管理"],
  method: "put",
  path: "/{id}",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              nickname: z.string().nullable(),
              mobile: z.string().nullable(),
              email: z.string().nullable(),
              isTest: z.boolean(),
              isRobot: z.boolean(),
              testingExpired: z.date().nullable(),
              rtpLevel: z.number().nullable(),
              channelID: z.number().nullable(),
              password: z.string(),
              operatorId: z.number(),
              passUpdate: z.boolean(),
            })
            .openapi("运营商创建"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.number(),
            })
            .openapi("运营商结果"),
        },
      },
      description: "创建运营商结果",
    },
  },
});

gamePlayers.openapi(UpdateOneGamePlayer, async (c) => {
  const gamePlayerId = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await GamePlayerService.updateGamePlayer(gamePlayerId, input.passUpdate, {
    nickname: input.nickname,
    mobile: input.mobile,
    email: input.email,
    isTest: input.isTest,
    isRobot: input.isRobot,
    testingExpired: input.testingExpired,
    rtpLevel: input.rtpLevel || 0,
    password: input.password,
    operator: {
      connect: {
        id: input.operatorId,
      },
    },
  });
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const DeleteOneGamePlayer = createRoute({
  description: "删除单个运营商",
  summary: "删除单个运营商",
  tags: ["后台管理"],
  method: "delete",
  path: "/{id}",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.number(),
            })
            .openapi("运营商结果"),
        },
      },
      description: "创建运营商结果",
    },
  },
});

gamePlayers.openapi(DeleteOneGamePlayer, async (c) => {
  const gamePlayerId = Number(c.req.param("id"));
  const data = await GamePlayerService.deleteGamePlayer(gamePlayerId);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
