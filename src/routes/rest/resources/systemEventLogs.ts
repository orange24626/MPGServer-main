import { ListQueryResponse, ListQuerySchema } from "dtos/restful";
import { SystemEventLogService } from "../../../services";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { checkAdminPermission } from "middlewares/checkPermission";
import { HTTPException } from "hono/http-exception";
import { PermissionAction } from "models/types";

const systemEventLogs = new OpenAPIHono();

//permissions
systemEventLogs.get(
  "/rest/admin/system-event-logs",
  checkAdminPermission("system-event-logs", PermissionAction.list),

  checkAdminPermission("system-event-logs", PermissionAction.show),
);

systemEventLogs.post(
  "/rest/admin/system-event-logs",
  checkAdminPermission("system-event-logs", PermissionAction.create),
);

systemEventLogs.put(
  "/rest/admin/system-event-logs/:id",
  checkAdminPermission("system-event-logs", PermissionAction.edit),
);

systemEventLogs.delete(
  "/rest/admin/system-event-logs/:id",
  checkAdminPermission("system-event-logs", PermissionAction.delete),
);

systemEventLogs.get(
  "/rest/admin/system-event-logs/:id",
  checkAdminPermission("system-event-logs", PermissionAction.show),
);

const GetSystemEventLogsRoute = createRoute({
  description: "获取系统统计日志列表",
  summary: "获取系统统计日志列表",
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

systemEventLogs.openapi(GetSystemEventLogsRoute, async (c) => {
  const queries = c.req.query();
  const operatorIds = (c as any).get("operatorIds") || [];
  const data = await SystemEventLogService.getSystemEventLogs(queries, operatorIds);
  return c.json(data);
});

const GetOneSystemEventLog = createRoute({
  description: "获取单个系统统计日志",
  summary: "获取单个系统统计日志",
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
            })
            .openapi("AdminProfile"),
        },
      },
      description: "Retrieve the admins",
    },
  },
});

systemEventLogs.openapi(GetOneSystemEventLog, async (c) => {
  const id = c.req.param("id");
  const data = await SystemEventLogService.getSystemEventLog(+id);
  if (!data) {
    throw new HTTPException(404, {
      message: "Not found",
    });
  }
  return c.json(data);
});

const CreateOneSystemEventLog = createRoute({
  description: "添加单个系统统计日志",
  summary: "添加单个系统统计日志",
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
            .openapi("系统统计日志创建"),
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
            .openapi("系统统计日志结果"),
        },
      },
      description: "创建系统统计日志结果",
    },
  },
});

export default systemEventLogs;
