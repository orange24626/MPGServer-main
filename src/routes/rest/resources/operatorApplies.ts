import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ListQueryResponse, ListQuerySchema } from "dtos";
import { OperatorApplyPostInput } from "dtos";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { OperatorApplyService } from "services";

export const applies = new OpenAPIHono();

//permissions
applies.get(
  "/rest/admin/operator-applies",
  checkAdminPermission("operator-applies", PermissionAction.list),

  checkAdminPermission("operator-applies", PermissionAction.show),
);

applies.post(
  "/rest/admin/operator-applies",
  checkAdminPermission("operator-applies", PermissionAction.create),
);

applies.put(
  "/rest/admin/operator-applies/:id",
  checkAdminPermission("operator-applies", PermissionAction.edit),
);

applies.delete(
  "/rest/admin/operator-applies/:id",
  checkAdminPermission("operator-applies", PermissionAction.delete),
);

const PostAppliesRoute = createRoute({
  description: "创建申请",
  summary: "创建申请",
  tags: ["数据-运营商入驻"],
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorApplyPostInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
      description: "Retrieve the applies",
    },
  },
});

applies.openapi(PostAppliesRoute, async (c) => {
  const body = c.req.valid("json");
  const data = await OperatorApplyService.createApply(body);
  return c.json(data);
});

const GetAppliesRoute = createRoute({
  description: "获取运营商入驻申请列表",
  summary: "获取运营商入驻申请列表",
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
      description: "Retrieve the applies",
    },
  },
});

applies.openapi(GetAppliesRoute, async (c) => {
  const queries = c.req.query();
  const data = await OperatorApplyService.getApplies(queries);
  return c.json(data);
});

const GetOneApplyRoute = createRoute({
  description: "获取单个运营商入驻",
  summary: "获取单个运营商入驻",
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
          schema: z.any(),
        },
      },
      description: "Retrieve one apply",
    },
  },
});

applies.openapi(GetOneApplyRoute, async (c) => {
  const id = c.req.param("id");
  const data = await OperatorApplyService.getApplyById(id);
  return c.json(data);
});

const PassOneApplyRoute = createRoute({
  description: "通过单个运营商入驻审核",
  summary: "通过单个运营商入驻审核",
  tags: ["后台管理"],
  method: "put",
  path: "/{id}/pass",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
      description: "Retrieve one apply",
    },
  },
});

const rejectOneApplyRoute = createRoute({
  description: "拒绝单个运营商入驻审核",
  summary: "拒绝单个运营商入驻审核",
  tags: ["后台管理"],
  method: "put",
  path: "/{id}/reject",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
      description: "Retrieve one apply",
    },
  },
});

applies.openapi(PassOneApplyRoute, async (c) => {
  const id = c.req.param("id");
  const data = await OperatorApplyService.passOneApply(id);
  return c.json(data);
});

applies.openapi(rejectOneApplyRoute, async (c) => {
  const id = c.req.param("id");
  const data = await OperatorApplyService.rejectOneApply(id);
  return c.json(data);
});

const deleteOneApplyRoute = createRoute({
  description: "删除单个运营商入驻审核",
  summary: "删除单个运营商入驻审核",
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
          schema: z.any(),
        },
      },
      description: "Retrieve one apply",
    },
  },
});

applies.openapi(deleteOneApplyRoute, async (c) => {
  const id = c.req.param("id");
  const data = await OperatorApplyService.deleteOneApply(id);
  return c.json(data);
});
