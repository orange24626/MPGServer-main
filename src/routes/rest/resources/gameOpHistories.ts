import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema, OperatorProxyGetGameQuery } from "dtos";
import { HTTPException } from "hono/http-exception";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { GameHistoryService, OperatorService } from "services";
import { prismaClient } from "utils";

export const gameOpHistories = new OpenAPIHono();

//permissions
gameOpHistories.get(
  "/rest/admin/game-histories",
  checkAdminPermission("game-histories", PermissionAction.list),

  checkAdminPermission("game-histories", PermissionAction.show),
);

gameOpHistories.post("/rest/admin/game-histories", checkAdminPermission("game-histories", PermissionAction.create));

gameOpHistories.put("/rest/admin/game-histories/:id", checkAdminPermission("game-histories", PermissionAction.edit));

gameOpHistories.delete(
  "/rest/admin/game-histories/:id",
  checkAdminPermission("game-histories", PermissionAction.delete),
);

gameOpHistories.get("/rest/admin/game-histories/:id", checkAdminPermission("game-histories", PermissionAction.show));

const GetGameHistoriesRoute = createRoute({
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
      description: "Retrieve the gameOpHistories",
    },
  },
});

gameOpHistories.use(checkAdminPermission("game-histories", PermissionAction.list));
gameOpHistories.openapi(GetGameHistoriesRoute, async (c) => {
  const queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];
  const filter = queries.filter;
  const filterObj = filter ? JSON.parse(filter) : {};
  const { userID, operatorId, gameID, startedAt, endedAt, gameOrderID } = filterObj;
  const range = queries.range;
  const [from, to] = range ? JSON.parse(range) : [0, 9];

  const sort = queries.sort;
  const [sortField, sortOrder] = sort ? JSON.parse(sort) : ["updatedAt", "desc"];

  console.log("[from, to]=======", [from, to]);

  let operator = null;

  if (!Number.isNaN(+operatorId)) {
    operator = await prismaClient.operator.findUnique({
      where: {
        id: Number(operatorId),
      },
    });
  }

  if (!operator) {
    operator = await OperatorService.getSelfOwned();
  }
  const dataInput = {
    userID,
    gameID,
    startedAt,
    endedAt,
    gameOrderID,
    page: from / (to - from + 1) + 1,
    pageSize: to - from + 1,
    sort: -1,
    accessKey: operator?.operatorKey as string,
  };

  const sign = OperatorService.generateSign(JSON.parse(JSON.stringify(dataInput)), operator?.operatorSecret as string);

  const input: z.infer<typeof OperatorProxyGetGameQuery> = {
    ...JSON.parse(JSON.stringify(dataInput)),
    sign,
  };
  const data = await GameHistoryService.getGameOperatorRecords(input);
  return c.json({
    list: data.data.list,
    total: data.data.total,
  });
});

const GetGameHistoryRoute = createRoute({
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
      description: "Retrieve the gameOpHistories",
    },
  },
});

gameOpHistories.openapi(GetGameHistoryRoute, async (c) => {
  const id = c.req.param("id");
  const history = await GameHistoryService.getById(+id);
  if (!history) {
    throw new HTTPException(404, {
      message: "history not found",
    });
  }
  return c.json({
    ...history,
    historyId: Number(history.historyId),
    totalBet: Number(history.totalBet),
    profit: Number(history.profit),
  });
});

const UpdateOneGameHistory = createRoute({
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
              currency: z.string(),
              fscc: z.number(),
              mgcc: z.number(),
              operatorId: z.number(),
              playerId: z.number(),
              isTesting: z.boolean(),
              version: z.number(),
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

gameOpHistories.openapi(UpdateOneGameHistory, async (c) => {
  const gameHistoryId = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await GameHistoryService.updateGameHistory(gameHistoryId, input);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json({
    ...data,
    historyId: Number(data.historyId),
    totalBet: Number(data.totalBet),
    profit: Number(data.profit),
  });
});

const DeleteOneGameHistory = createRoute({
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

gameOpHistories.openapi(DeleteOneGameHistory, async (c) => {
  const gameHistoryId = Number(c.req.param("id"));
  const data = await GameHistoryService.deleteGameHistory(gameHistoryId);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json({
    ...data,
    historyId: Number(data.historyId),
    totalBet: Number(data.totalBet),
    profit: Number(data.profit),
  });
});
