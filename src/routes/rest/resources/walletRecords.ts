import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema } from "dtos";
import { HTTPException } from "hono/http-exception";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { WalletRecordService } from "services";

export const walletRecords = new OpenAPIHono();

//permissions
walletRecords.get(
  "/rest/admin/wallet-records",
  checkAdminPermission("wallet-records", PermissionAction.list),

  checkAdminPermission("wallet-records", PermissionAction.show),
);

walletRecords.post(
  "/rest/admin/wallet-records",
  checkAdminPermission("wallet-records", PermissionAction.create),
);

walletRecords.put(
  "/rest/admin/wallet-records/:id",
  checkAdminPermission("wallet-records", PermissionAction.edit),
);

walletRecords.delete(
  "/rest/admin/wallet-records/:id",
  checkAdminPermission("wallet-records", PermissionAction.delete),
);

walletRecords.get(
  "/rest/admin/wallet-records/:id",
  checkAdminPermission("wallet-records", PermissionAction.show),
);

const GetAppliesRoute = createRoute({
  description: "获取记录入驻申请列表",
  summary: "获取记录入驻申请列表",
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
      description: "Retrieve the walletRecords",
    },
  },
});

walletRecords.use(
  checkAdminPermission("wallet-records", PermissionAction.list),
);
walletRecords.openapi(GetAppliesRoute, async (c) => {
  const queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];
  const data = await WalletRecordService.getWalletRecords(queries, operatorIds);
  return c.json(data);
});

const GetOneWalletRecord = createRoute({
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
      description: "Retrieve the WalletRecord",
    },
  },
});

walletRecords.openapi(GetOneWalletRecord, async (c) => {
  const id = c.req.param("id");
  const record = await WalletRecordService.getWalletRecord(+id);
  if (!record) {
    throw new HTTPException(404, {
      message: "record not found",
    });
  }
  return c.json({
    ...record,
    balanceBefore: Number(record.balanceBefore),
    balanceAfter: Number(record.balanceAfter),
    amount: Number(record.amount),
  });
});

const DeleteOneWalletRecord = createRoute({
  description: "删除单个记录",
  summary: "删除单个记录",
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
            .openapi("记录结果"),
        },
      },
      description: "创建记录结果",
    },
  },
});

walletRecords.openapi(DeleteOneWalletRecord, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await WalletRecordService.deleteWalletRecord(id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
