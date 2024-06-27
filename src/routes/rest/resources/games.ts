import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema } from "dtos";
import { HTTPException } from "hono/http-exception";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { GameService } from "services";

export const games = new OpenAPIHono();

//permissions
games.get(
  "/rest/admin/games",
  checkAdminPermission("games", PermissionAction.list),

  checkAdminPermission("games", PermissionAction.show),
);

games.post(
  "/rest/admin/games",
  checkAdminPermission("games", PermissionAction.create),
);

games.put(
  "/rest/admin/games/:id",
  checkAdminPermission("games", PermissionAction.edit),
);

games.delete(
  "/rest/admin/games/:id",
  checkAdminPermission("games", PermissionAction.delete),
);

const GetGamesRoute = createRoute({
  description: "获取游戏列表",
  summary: "获取游戏列表",
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
      description: "Retrieve the games",
    },
  },
});

games.use(checkAdminPermission("games", PermissionAction.list));

games.openapi(GetGamesRoute, async (c) => {
  const queries = c.req.query();
  const data = await GameService.getGames(queries);
  return c.json(data);
});

const GetOneGame = createRoute({
  description: "获取单个游戏",
  summary: "获取单个游戏",
  tags: ["后台管理"],
  method: "get",
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
              name: z.string(),
            })
            .openapi("AdminProfile"),
        },
      },
      description: "Retrieve the admins",
    },
  },
});

games.use(checkAdminPermission("games", PermissionAction.show));

games.openapi(GetOneGame, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await GameService.getGame(id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const CreateOneGame = createRoute({
  description: "添加单个游戏",
  summary: "添加单个游戏",
  tags: ["后台管理"],
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              name: z.string(),
              fullName: z.string(),
              version: z.number(),
            })
            .openapi("游戏创建"),
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
            .openapi("游戏结果"),
        },
      },
      description: "创建游戏结果",
    },
  },
});

games.openapi(CreateOneGame, async (c) => {
  const input = c.req.valid("json");
  const data = await GameService.createGame({
    ...input,
    gameID: parseInt(Math.floor(Math.random() * 1000000).toString()),
  });
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const UpdateOneGame = createRoute({
  description: "更新单个游戏",
  summary: "更新单个游戏",
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
              name: z.string(),
              fullName: z.string(),
              version: z.number(),
            })
            .openapi("游戏创建"),
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
            .openapi("游戏结果"),
        },
      },
      description: "创建游戏结果",
    },
  },
});

games.openapi(UpdateOneGame, async (c) => {
  const id = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await GameService.updateGame(id, input);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const DeleteOneGame = createRoute({
  description: "删除单个游戏",
  summary: "删除单个游戏",
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
              name: z.string(),
            })
            .openapi("游戏结果"),
        },
      },
      description: "创建游戏结果",
    },
  },
});

games.openapi(DeleteOneGame, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await GameService.deleteGame(id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
