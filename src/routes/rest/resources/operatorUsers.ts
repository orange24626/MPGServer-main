import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema } from "dtos";
import { HTTPException } from "hono/http-exception";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { OperatorUserService } from "services";
import { prismaClient } from "utils";

export const operatorUsers = new OpenAPIHono();

//permissions
operatorUsers.get(
  "/rest/admin/operator-users",
  checkAdminPermission("operator-users", PermissionAction.list),

  checkAdminPermission("operator-users", PermissionAction.show),
);

operatorUsers.post("/rest/admin/operator-users", checkAdminPermission("operator-users", PermissionAction.create));

operatorUsers.put("/rest/admin/operator-users/:id", checkAdminPermission("operator-users", PermissionAction.edit));

operatorUsers.delete("/rest/admin/operator-users/:id", checkAdminPermission("operator-users", PermissionAction.delete));

const GetOperatorUsersRoute = createRoute({
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
      description: "Retrieve the operatorUsers",
    },
  },
});

operatorUsers.openapi(GetOperatorUsersRoute, async (c) => {
  const queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];

  const data = await OperatorUserService.getUsers(queries, operatorIds);
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
      description: "Retrieve the operatorUsers",
    },
  },
});

operatorUsers.openapi(GetGamePlayerRoute, async (c) => {
  const id = c.req.param("id");
  const player = await OperatorUserService.getUserByIdKey(+id);
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

operatorUsers.openapi(CreateOneGamePlayer, async (c) => {
  const input = c.req.valid("json");
  const data = null;
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
