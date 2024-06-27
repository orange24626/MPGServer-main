import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema } from "dtos";
import { HTTPException } from "hono/http-exception";
import { checkAdminPermission } from "middlewares/checkPermission";
import { GameMoneyPoolService } from "services";
import { prismaClient } from "../../../utils";
import { groupBy } from "lodash";
import { PermissionAction } from "models/types";

export const moneyPoolMachines = new OpenAPIHono();

//permissions
moneyPoolMachines.get(
  "/rest/admin/money-pool-machines",
  checkAdminPermission("money-pool-machines", PermissionAction.list),

  checkAdminPermission("money-pool-machines", PermissionAction.show),
);

moneyPoolMachines.post(
  "/rest/admin/money-pool-machines",
  checkAdminPermission("money-pool-machines", PermissionAction.create),
);

moneyPoolMachines.put(
  "/rest/admin/money-pool-machines/:id",
  checkAdminPermission("money-pool-machines", PermissionAction.edit),
);

moneyPoolMachines.delete(
  "/rest/admin/money-pool-machines/:id",
  checkAdminPermission("money-pool-machines", PermissionAction.delete),
);

const GetMoneyPoolMachinesRoute = createRoute({
  description: "获取资金池列表",
  summary: "获取资金池列表",
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
      description: "Retrieve the money-pool-machines",
    },
  },
});

moneyPoolMachines.openapi(GetMoneyPoolMachinesRoute, async (c) => {
  const queries = c.req.query();
  const data = await GameMoneyPoolService.getMoneyPoolMachines(queries);
  const ids = data.list.map((item) => item.id);
  if (ids.length > 0) {
    let gameHistoryList = await prismaClient.gameHistory.findMany({
      where: {
        moneyPoolId: { in: ids },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    if (gameHistoryList != null) {
      const groupByList = groupBy(gameHistoryList, "moneyPoolId");
      Object.keys(groupByList).forEach((key) => {
        groupByList[key] = groupByList[key].sort(
          (a, b) =>
            a.createdAt.getMilliseconds() - b.createdAt.getMilliseconds(),
        );
      });
      let idToMap = {};
      Object.keys(groupByList).forEach((key) => {
        console.log(groupByList[key][0]);
        // @ts-ignore
        idToMap[key] = groupByList[key][0];
        // @ts-ignore
        idToMap[key]["historyId"] = Number(idToMap[key]["historyId"]);
      });
      const processItems = async () => {
        const results = await Promise.all(
          data.list.map(async (item) => {
            // @ts-ignore
            if (idToMap[item.id]) {
              // @ts-ignore
              item["playerId"] = idToMap[item.id];
              let gamePlayer = await prismaClient.gamePlayer.findUnique({
                where: {
                  // @ts-ignore
                  id: item["playerId"]["playerId"],
                },
                include: {
                  operatorUser: true,
                },
              });
              // @ts-ignore
              item["gamePlayer"] = gamePlayer;
            }

            return item;
          }),
        );
      };

      await processItems();
    }
  }
  return c.json(data);
});

const DeleteOneMoneyPool = createRoute({
  description: "删除单个奖池",
  summary: "删除单个奖池",
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
              gameID: z.number(),
            })
            .openapi("游戏结果"),
        },
      },
      description: "创建游戏结果",
    },
  },
});

moneyPoolMachines.openapi(DeleteOneMoneyPool, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await GameMoneyPoolService.getMoneyPool(id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  await GameMoneyPoolService.delete(id);
  return c.json(data);
});

const GetOneMoneyPool = createRoute({
  description: "获取单个奖池",
  summary: "获取单个奖池",
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
              gameID: z.number(),
            })
            .openapi("游戏结果"),
        },
      },
      description: "创建游戏结果",
    },
  },
});

moneyPoolMachines.openapi(GetOneMoneyPool, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await GameMoneyPoolService.getMoneyPool(id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
