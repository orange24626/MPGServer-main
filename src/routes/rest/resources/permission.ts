import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { checkAdminPermission } from "middlewares/checkPermission";
import { HTTPException } from "hono/http-exception";
import { PermissionService } from "../../../services/PermissionService";
import { PermissionAction } from "models/types";
import { SessionService } from "services";

export const permissions = new OpenAPIHono();
const GetPermissionsRoute = createRoute({
  description: "获取权限",
  summary: "获取权限",
  tags: ["后台管理"],
  method: "get",
  path: "/",

  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.any().openapi("权限列表"),
        },
      },
      description: "Retrieve the permission",
    },
  },
});

permissions.openapi(GetPermissionsRoute, async (c) => {
  const header = c.req.header();
  if (!header) {
    throw new HTTPException(401, { message: "Invalid header" });
  }
  const authStr = header["authorization"] || header["Authorization"];
  const token = authStr?.split(" ")[1];
  if (!token) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const sessions = await SessionService.getSessionsByToken("admin", token);
  if (sessions.length === 0) {
    throw new HTTPException(401, { message: "Invalid token" });
  }
  await SessionService.renewSession("admin", token);
  const session = sessions.find((session) => session.token === token);
  const sessionData = session?.data;

  if (!sessionData?.permission) {
    throw new HTTPException(403, { message: "permission deny" });
  }

  const roles = sessionData?.permission?.roles;
  const operatorIds = sessionData?.permission?.operatorIds;
  const levels = sessionData?.permission?.levels;

  return c.json({
    roles,
    operatorIds,
    levels,
    isRoot: sessionData?.permission?.isRoot,
  });
});

const GetOnePermission = createRoute({
  description: "获取单个权限",
  summary: "获取单个权限",
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
      description: "Retrieve the permission",
    },
  },
});

permissions.use(checkAdminPermission("permissions", PermissionAction.list));

permissions.openapi(GetOnePermission, async (c) => {
  const id = c.req.param("id");
  const data = await PermissionService.getPermission(+id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const CreateOnePermission = createRoute({
  description: "添加单个权限",
  summary: "添加单个权限",
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
              action: z.any(),
              resource: z.string(),
              description: z.string(),
            })
            .openapi("权限创建"),
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
            .openapi("权限结果"),
        },
      },
      description: "创建权限结果",
    },
  },
});

permissions.openapi(CreateOnePermission, async (c) => {
  const input = c.req.valid("json");
  const data = await PermissionService.createPermission({
    ...input,
  });
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const UpdateOnePermission = createRoute({
  description: "更新单个权限",
  summary: "更新单个权限",
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
              action: z.any(),
              version: z.number(),
              description: z.string(),
            })
            .openapi("权限更新"),
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

permissions.openapi(UpdateOnePermission, async (c) => {
  const id = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await PermissionService.updatePermission(id, input);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const DeletePermission = createRoute({
  description: "删除单个权限",
  summary: "删除单个权限",
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
            .openapi("权限结果"),
        },
      },
      description: "删除权限结果",
    },
  },
});

permissions.openapi(DeletePermission, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await PermissionService.deletePermission(id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
