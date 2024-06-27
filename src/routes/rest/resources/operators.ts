import { ListQueryResponse, ListQuerySchema } from "dtos/restful";
import { OperatorService } from "../../../services";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { checkAdminPermission } from "middlewares/checkPermission";
import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { PermissionAction } from "models/types";

const operators = new OpenAPIHono();

//permissions
operators.get(
  "/rest/admin/operators",
  checkAdminPermission("operators", PermissionAction.list),

  checkAdminPermission("operators", PermissionAction.show),
);

operators.post(
  "/rest/admin/operators",
  checkAdminPermission("operators", PermissionAction.create),
);

operators.put(
  "/rest/admin/operators/:id",
  checkAdminPermission("operators", PermissionAction.edit),
);

operators.delete(
  "/rest/admin/operators/:id",
  checkAdminPermission("operators", PermissionAction.delete),
);

operators.get(
  "/rest/admin/operators/:id",
  checkAdminPermission("operators", PermissionAction.show),
);

const GetSelfOwnProfile = createRoute({
  description: "获取自营",
  summary: "获取自营",
  tags: ["后台管理"],
  method: "get",
  path: "/selfOwned",

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

operators.openapi(GetSelfOwnProfile, async (c) => {
  const selfOwned = await OperatorService.getSelfOwned();
  if (!selfOwned) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(selfOwned);
});

const GetOperatorsRoute = createRoute({
  description: "获取运营商列表",
  summary: "获取运营商列表",
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
      description: "Retrieve the user",
    },
  },
});

operators.openapi(GetOperatorsRoute, async (c) => {
  const queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];
  const data = await OperatorService.getOperators(queries, operatorIds);
  return c.json(data);
});

const GetOneOperator = createRoute({
  description: "获取单个运营商",
  summary: "获取单个运营商",
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

operators.openapi(GetOneOperator, async (c) => {
  const id = c.req.param("id");
  const data = await OperatorService.getOperator(+id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const CreateOneOperator = createRoute({
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
              name: z.string(),
              introduction: z.string(),
              selfOwned: z.boolean(),
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
              name: z.string(),
              status: z.number(),
            })
            .openapi("运营商结果"),
        },
      },
      description: "创建运营商结果",
    },
  },
});

operators.openapi(CreateOneOperator, async (c) => {
  const input = c.req.valid("json");
  const data = await OperatorService.createOperator({
    name: input.name,
    introduction: input.introduction,
    selfOwned: input.selfOwned,
    operatorID: nanoid(),
    operatorKey: nanoid(),
    operatorSecret: nanoid(),
    status: 1,
  });
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const UpdateOneOperator = createRoute({
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
              name: z.string(),
              selfOwned: z.boolean(),
              introduction: z.string().nullable().optional(),
              rtpLevel: z.string(),
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
              name: z.string(),
            })
            .openapi("运营商结果"),
        },
      },
      description: "创建运营商结果",
    },
  },
});

operators.openapi(UpdateOneOperator, async (c) => {
  const operatorId = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await OperatorService.updateOperator(operatorId, {
    name: input.name,
    introduction: input.introduction || "",
    selfOwned: input.selfOwned,
    rtpLevel: +input.rtpLevel,
  });
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const DeleteOneOperator = createRoute({
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
              name: z.string(),
            })
            .openapi("运营商结果"),
        },
      },
      description: "创建运营商结果",
    },
  },
});

operators.openapi(DeleteOneOperator, async (c) => {
  const operatorId = Number(c.req.param("id"));
  const data = await OperatorService.deleteOperator(operatorId);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

export default operators;
