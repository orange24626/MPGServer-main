import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema } from "dtos";
import { HTTPException } from "hono/http-exception";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { WalletService } from "services";
import { prismaClient } from "utils";

export const gamePlayerWallets = new OpenAPIHono();

//permissions
gamePlayerWallets.get(
  "/rest/admin/player-wallets",
  checkAdminPermission("player-wallets", PermissionAction.list),

  checkAdminPermission("player-wallets", PermissionAction.show),
);

gamePlayerWallets.post("/rest/admin/player-wallets", checkAdminPermission("player-wallets", PermissionAction.create));

gamePlayerWallets.put("/rest/admin/player-wallets/:id", checkAdminPermission("player-wallets", PermissionAction.edit));

gamePlayerWallets.put(
  "/rest/admin/player-wallets/:id/charge",
  checkAdminPermission("player-wallets", PermissionAction.edit),
);

gamePlayerWallets.delete(
  "/rest/admin/player-wallets/:id",
  checkAdminPermission("player-wallets", PermissionAction.delete),
);

const GetGamePlayerWalletsRoute = createRoute({
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
      description: "Retrieve the gamePlayerWallets",
    },
  },
});

gamePlayerWallets.openapi(GetGamePlayerWalletsRoute, async (c) => {
  let queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];
  let filter = queries["filter"];
  let condition = filter ? JSON.parse(filter as string) : {};
  if (condition["operatorUsername"]) {
    const players = await prismaClient.gamePlayer.findMany({
      where: {
        operatorUsername: {
          startsWith: condition["operatorUsername"] as string,
        },
      },
    });
    delete condition["operatorUsername"];
    condition = {
      ...condition,
      playerId: {
        in: players.map((item) => item.id),
      },
    };
  }
  filter = JSON.stringify(condition);
  queries = {
    ...queries,
    filter,
  };
  console.log("queries==================================", queries);
  const data = await WalletService.getWallets(queries, operatorIds);
  return c.json(data);
});

const GetGamePlayerWalletRoute = createRoute({
  description: "获取钱包列表",
  summary: "获取钱包列表",
  tags: ["后台管理"],
  method: "get",
  path: "/{id}",
  request: {
    params: z
      .object({
        id: z.string(),
      })
      .openapi("钱包ID"),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.number(),
            })
            .openapi("钱包"),
        },
      },
      description: "Retrieve the gamePlayerWallets",
    },
  },
});

gamePlayerWallets.openapi(GetGamePlayerWalletRoute, async (c) => {
  const id = c.req.param("id");
  const wallet = await WalletService.getWallet(+id);
  if (!wallet) {
    throw new HTTPException(404, {
      message: "wallet not found",
    });
  }
  return c.json({
    ...wallet,
    balance: Number(wallet.balance),
  });
});

const UpdateOneGamePlayerWallet = createRoute({
  description: "更新单个钱包",
  summary: "更新单个钱包",
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
              balance: z.number(),
              isTest: z.boolean(),
              testingExpired: z.string().nullable(),
              currency: z.string(),
              version: z.number(),
              playerId: z.number(),
            })
            .openapi("钱包创建"),
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
            .openapi("钱包结果"),
        },
      },
      description: "创建钱包结果",
    },
  },
});

const ChargeOneGamePlayerWallet = createRoute({
  description: "充值单个钱包",
  summary: "充值单个钱包",
  tags: ["后台管理"],
  method: "put",
  path: "/{id}/charge",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              amount: z.number(),
            })
            .openapi("钱包创建"),
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
            .openapi("钱包结果"),
        },
      },
      description: "返回钱包信息",
    },
  },
});

gamePlayerWallets.openapi(ChargeOneGamePlayerWallet, async (c) => {
  const walletId = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await WalletService.chargeWallet(walletId, input.amount);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

gamePlayerWallets.openapi(UpdateOneGamePlayerWallet, async (c) => {
  const walletId = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await WalletService.updateWallet(walletId, {
    ...input,
    testingExpired: new Date(input.testingExpired || ""),
  });
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const DeleteOneGamePlayerWallet = createRoute({
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
            .openapi("钱包结果"),
        },
      },
      description: "创建钱包结果",
    },
  },
});

gamePlayerWallets.openapi(DeleteOneGamePlayerWallet, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await WalletService.deleteWallet(id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
