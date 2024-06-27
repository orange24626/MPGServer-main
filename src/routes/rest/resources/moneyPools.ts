import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema } from "dtos";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { GameMoneyPoolService } from "services";

export const moneyPools = new OpenAPIHono();

//permissions
moneyPools.get(
  "/rest/admin/money-pools",
  checkAdminPermission("money-pools", PermissionAction.list),

  checkAdminPermission("money-pools", PermissionAction.show),
);

moneyPools.post("/rest/admin/money-pools", checkAdminPermission("money-pools", PermissionAction.create));

moneyPools.put("/rest/admin/money-pools/:id", checkAdminPermission("money-pools", PermissionAction.edit));

moneyPools.delete("/rest/admin/money-pools/:id", checkAdminPermission("money-pools", PermissionAction.delete));

const GetMoneyPoolsRoute = createRoute({
  description: "获取奖池档位列表",
  summary: "获取奖池档位列表",
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
      description: "Retrieve the money-pools",
    },
  },
});

moneyPools.openapi(GetMoneyPoolsRoute, async (c) => {
  const queries = c.req.query();
  const { list, count } = await GameMoneyPoolService.getBetPools(queries);
  const items = list.map((item: any) => {
    return {
      ...item,
    };
  });

  return c.json({
    list: items,
    total: +count.toString(),
  });
});

const DeletePoolRoute = createRoute({
  description: "删除奖池档位",
  summary: "删除奖池档位",
  tags: ["后台管理"],
  method: "delete",
  path: "/:id",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Delete the money-pool",
    },
  },
});

moneyPools.openapi(DeletePoolRoute, async (c) => {
  const { id } = c.req.param();
  await GameMoneyPoolService.deleteBetPool(id);
  return c.json({});
});
