import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { AuthService } from "services";
import { SessionService } from "services/SessionService";

//这个中间件用于验证游戏请求的token，但是暂时没啥用，因为hono不允许重复使用body
export const useGameVerifyFormSession = async (c: Context, next: Next) => {
  const reqText: any = await c.req.raw.clone().text();
  const formData: any = new URLSearchParams(reqText);
  const atk = formData.get("atk");
  if (!atk) {
    throw new HTTPException(401, { message: "atk is required" });
  }
  const id = await SessionService.getIdByToken("mpg", atk as string);
  if (!id) {
    throw new HTTPException(401, { message: "Invalid token" });
  }
  const sessions = await AuthService.getGameSession(atk as string);
  if (sessions.length === 0) {
    throw new HTTPException(401, { message: "Invalid token" });
  }
  const session = sessions.find((session) => session.token === atk);
  if (!session) {
    throw new HTTPException(401, { message: "Invalid token" });
  }
  c.set("session", session);
  await next();
};
