import { ListQueryResponse, ListQuerySchema } from "dtos/restful";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { checkAdminPermission } from "middlewares/checkPermission";
import { HTTPException } from "hono/http-exception";
import { RoleService } from "../../../services/RoleService";
import { PermissionAction } from "models/types";
import { CreateRoleSchema, EditRoleSchema } from "dtos";

export const roles = new OpenAPIHono();
//permissions
roles.get(
  "/rest/admin/roles",
  checkAdminPermission("roles", PermissionAction.list),

  checkAdminPermission("roles", PermissionAction.show),
);

roles.post(
  "/rest/admin/roles",
  checkAdminPermission("roles", PermissionAction.create),
);

roles.put(
  "/rest/admin/roles/:id",
  checkAdminPermission("roles", PermissionAction.edit),
);

roles.delete(
  "/rest/admin/roles/:id",
  checkAdminPermission("roles", PermissionAction.delete),
);

roles.get(
  "/rest/admin/roles/:id",
  checkAdminPermission("roles", PermissionAction.show),
);

const GetRolesRoute = createRoute({
  description: "获取角色",
  summary: "获取角色",
  tags: ["后台管理"],
  method: "get",
  path: "/",

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
roles.openapi(GetRolesRoute, async (c) => {
  const queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];
  const data = await RoleService.getRoles(queries, operatorIds);
  return c.json(data);
});

roles.use(checkAdminPermission("roles", PermissionAction.list));

const GetOneRole = createRoute({
  description: "获取单个角色",
  summary: "获取单个角色",
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
            .openapi("Role"),
        },
      },
      description: "Retrieve the roles",
    },
  },
});

roles.openapi(GetOneRole, async (c) => {
  const id = c.req.param("id");
  const data = await RoleService.getRole(+id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const CreateOneRole = createRoute({
  description: "添加单个角色",
  summary: "添加单个角色",
  tags: ["后台管理"],
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateRoleSchema,
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
            .openapi("角色结果"),
        },
      },
      description: "创建角色结果",
    },
  },
});

roles.openapi(CreateOneRole, async (c) => {
  const input = c.req.valid("json");
  const data = await RoleService.createRole(input);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const UpdateOneRole = createRoute({
  description: "更新单个角色",
  summary: "更新单个角色",
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
          schema: EditRoleSchema,
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
            .openapi("角色结果"),
        },
      },
      description: "更新角色结果",
    },
  },
});

roles.openapi(UpdateOneRole, async (c) => {
  const id = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await RoleService.updateRole(id, input);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const DeleteOneRole = createRoute({
  description: "删除单个角色",
  summary: "删除单个角色",
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
            .openapi("角色结果"),
        },
      },
      description: "删除角色结果",
    },
  },
});

roles.openapi(DeleteOneRole, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await RoleService.deleteRole(id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
