import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { CurrencySymbols } from "config";
import {
  VerifySessionInput,
  InitVerifyOperatorPlayerSession,
  VerifyOperationPlayerSessionInput,
  VerifyOperationPlayerSessionOutput,
} from "dtos";

import { GameService } from "services/GameService";

export const authGame = new OpenAPIHono();

const VerifyOperatorPlayerSessionRoute = createRoute({
  description: "验证运营商玩家会话",
  summary: "验证运营商玩家会话",
  tags: ["游戏"],
  method: "post",
  path: "/verifyOperatorPlayerSession",
  request: {
    body: {
      content: {
        "application/x-www-form-urlencoded": {
          schema: VerifyOperationPlayerSessionInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: VerifyOperationPlayerSessionOutput,
        },
      },
      description: "Retrieve the user",
    },
  },
});

const VerifySessionRoute = createRoute({
  description: "验证玩家会话",
  summary: "验证玩家会话",
  tags: ["游戏"],
  method: "post",
  path: "/verifySession",
  request: {
    body: {
      content: {
        "application/x-www-form-urlencoded": {
          schema: VerifySessionInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: VerifyOperationPlayerSessionOutput,
        },
      },
      description: "Retrieve the user",
    },
  },
});

authGame.openapi(VerifyOperatorPlayerSessionRoute, async (c) => {
  const startTime = Date.now();
  const formData = c.req.valid("form");
  const { gamePlayer, game, token, currency, operatorUser } = await GameService.verifyOperatorSession(formData);
  const setting = game.setting as any;
  console.log("认证处理时间", Date.now() - startTime, "ms");
  return c.json(
    await VerifyOperationPlayerSessionOutput.parseAsync({
      ...InitVerifyOperatorPlayerSession,
      dt: {
        ...InitVerifyOperatorPlayerSession.dt,
        geu: `game-api/${game.name}/`,
        pid: gamePlayer.id.toString(),
        pcd: operatorUser.id,
        cc: currency || "",
        cs: CurrencySymbols[currency || "BRL"] || "",
        tk: token,
        nkn: gamePlayer.nickname,
        gm: [
          {
            ...game,
            gid: game.gameID,
            mxe: setting?.maxRate || 2500,
            mxehr: setting?.mxehr || 8960913,
            st: setting?.st || 1,
            msdt: 1638432036000,
            medt: 1638432036000,
            amsg: "",
            rtp: {
              df: {
                min: 96.81,
                max: 96.81,
              },
            },
          },
        ],
        ioph: gamePlayer.id.toString(),
      },
    }),
  );
});

authGame.openapi(VerifySessionRoute, async (c) => {
  const startTime = Date.now();
  const formData = c.req.valid("form");
  const { gamePlayer, game, token, error, currency, operatorUser } = await GameService.verifyGameSession(formData);

  const setting = game?.setting as any;

  console.log("认证处理时间", Date.now() - startTime, "ms");

  return c.json(
    await VerifyOperationPlayerSessionOutput.parseAsync({
      ...InitVerifyOperatorPlayerSession,
      dt: !error
        ? {
            ...InitVerifyOperatorPlayerSession.dt,
            geu: `game-api/${game.name}/`,
            pid: gamePlayer.id.toString(),
            pcd: operatorUser?.id,
            cc: currency || "",
            cs: CurrencySymbols[currency || "BRL"] || "",
            tk: token,
            nkn: gamePlayer.nickname,
            gc: true,
            ign: true,
            gm: [
              {
                ...game,
                gid: game.gameID,
                mxe: setting?.maxRate || 2500,
                mxehr: setting?.mxehr || 8960913,
                st: setting?.st || 1,
                msdt: 1638432036000,
                medt: 1638432036000,
                amsg: "",
                rtp: {
                  df: {
                    min: 96.81,
                    max: 96.81,
                  },
                },
              },
            ],
            ioph: gamePlayer.id.toString(),
          }
        : null,
      err: error,
    }),
  );
});
