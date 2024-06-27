import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { SessionService } from "services";

export const checkAdminPermission = function (resource: string, action: any) {
  return async (c: Context, next: Next) => {
    const header = c.req.header();

    if (!header) {
      throw new HTTPException(401, { message: "Invalid header" });
    }
    const authStr = header["authorization"] || header["Authorization"];
    const token = authStr?.split(" ")[1];
    if (!token) {
      throw new HTTPException(401, { message: "Invalid token" });
    }
    c.set("admin-token", token);

    const sessions = await SessionService.getSessionsByToken("admin", token);
    if (sessions.length === 0) {
      throw new HTTPException(401, { message: "Invalid token" });
    }
    await SessionService.renewSession("admin", token);
    const session = sessions.find((session) => session.token === token);
    const sessionData = session?.data;
    if (sessionData?.permission?.isRoot) {
      return next();
    }
    if (!sessionData?.permission) {
      throw new HTTPException(403, { message: "permission deny" });
    }

    const roles = sessionData?.permission?.roles;
    const operatorIds = sessionData?.permission?.operatorIds;
    const levels = sessionData?.permission?.levels;
    for (let index = 0; index < roles?.length || 0; index++) {
      const role = roles[index]?.role;
      const permissions = role?.permissions;
      if (permissions && permissions[resource]?.includes(action)) {
        console.log("permission pass", resource, action);
        c.set("operatorIds", operatorIds);
        c.set("levels", levels);
        return next();
      }
    }

    throw new HTTPException(403, {
      message: `${resource}-${action} permission  deny`,
    });
  };
};
