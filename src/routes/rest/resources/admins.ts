import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  AdminPostEdit,
  AdminPostInput,
  ListQueryResponse,
  ListQuerySchema,
} from "dtos";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { checkAdminPermission } from "middlewares/checkPermission";
import { PermissionAction } from "models/types";
import { AdminService } from "services";

export const admins = new OpenAPIHono();

//permissions
admins.get(
  "/rest/admin/admins",
  checkAdminPermission("admins", PermissionAction.list),

  checkAdminPermission("admins", PermissionAction.show),
);

admins.post(
  "/rest/admin/admins",
  checkAdminPermission("admins", PermissionAction.create),
);

admins.put(
  "/rest/admin/admins/:id",
  checkAdminPermission("admins", PermissionAction.edit),
);

admins.put(
  "/rest/admin/admins/:id/password-reset",
  checkAdminPermission("admins", PermissionAction.changePassword),
);

admins.delete(
  "/rest/admin/admins/:id",
  checkAdminPermission("admins", PermissionAction.delete),
);

admins.get(
  "/rest/admin/admins/:id",
  checkAdminPermission("admins", PermissionAction.show),
);

const GetAdminsRoute = createRoute({
  description: "获取管理员列表",
  summary: "获取管理员列表",
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
      description: "Retrieve the admins",
    },
  },
});

admins.use(checkAdminPermission("admins", PermissionAction.list));

admins.openapi(GetAdminsRoute, async (c) => {
  const queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];
  const data = await AdminService.getAdmins(queries, operatorIds);
  return c.json(data);
});

const CreateAdminsRoute = createRoute({
  description: "创建管理员",
  summary: "创建管理员",
  tags: ["后台管理"],
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdminPostInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.number(),
            username: z.string(),
          }),
        },
      },
      description: "Retrieve the admins",
    },
  },
});

admins.use(
  CreateAdminsRoute.path,
  checkAdminPermission("admins", PermissionAction.create),
);

admins.openapi(CreateAdminsRoute, async (c) => {
  const adminInput = c.req.valid("json");
  const adminCreated = await AdminService.adminCreateAdmin(adminInput);
  return c.json(adminCreated);
});

const GetAdminProfile = createRoute({
  description: "获取管理员详细",
  summary: "获取管理员详细",
  tags: ["后台管理"],
  method: "get",
  path: "/profile",

  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.number(),
              username: z.string(),
            })
            .openapi("AdminProfile"),
        },
      },
      description: "Retrieve the admins",
    },
  },
});

admins.openapi(GetAdminProfile, async (c: Context<any>) => {
  const header = c.req.header();

  if (!header) {
    throw new HTTPException(401, { message: "Invalid header" });
  }
  const authStr = header["authorization"] || header["Authorization"];
  const token = authStr?.split(" ")[1];
  if (!token) {
    throw new HTTPException(401, { message: "Invalid token" });
  }
  const data = await AdminService.getProfileByToken(token);
  return c.json(data);
});

const GetAdminRoute = createRoute({
  description: "获取游管理员列表",
  summary: "获取游管理员列表",
  tags: ["后台管理"],
  method: "get",
  path: "/{id}",
  request: {
    params: z
      .object({
        id: z.string(),
      })
      .openapi("游管理员ID"),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.number(),
            })
            .openapi("游管理员"),
        },
      },
      description: "Retrieve the adminAuth",
    },
  },
});
admins.use(checkAdminPermission("admins", PermissionAction.show));
admins.openapi(GetAdminRoute, async (c) => {
  const id = c.req.param("id");
  const admin = await AdminService.getAdmin(+id);
  if (!admin) {
    throw new HTTPException(404, {
      message: "player not found",
    });
  }
  return c.json(admin);
});

const CreateOneAdmin = createRoute({
  description: "添加单个钱包",
  summary: "添加单个钱包",
  tags: ["后台管理"],
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdminPostInput,
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

admins.openapi(CreateOneAdmin, async (c) => {
  const input = c.req.valid("json");
  const data = await AdminService.createAdmin(input);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const UpdateOneAdmin = createRoute({
  description: "更新单个管理员",
  summary: "更新单个管理员",
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
          schema: AdminPostEdit,
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

const AdminResetPassword = createRoute({
  description: "重置管理员密码",
  summary: "重置管理员密码",
  tags: ["后台管理"],
  method: "put",
  path: "/{id}/password-reset",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            password: z.string(),
          }),
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
            .openapi("管理员结果"),
        },
      },
      description: "创建管理员结果",
    },
  },
});

admins.openapi(AdminResetPassword, async (c) => {
  const adminId = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await AdminService.resetPassword(adminId, input.password);
  return c.json(data);
});

admins.openapi(UpdateOneAdmin, async (c) => {
  const adminId = Number(c.req.param("id"));
  const input = c.req.valid("json");
  const data = await AdminService.updateAdmin(adminId, input);
  return c.json(data);
});

const DeleteOneAdmin = createRoute({
  description: "删除单个管理员",
  summary: "删除单个管理员",
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

admins.openapi(DeleteOneAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  const data = await AdminService.deleteAdmin(+id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});
