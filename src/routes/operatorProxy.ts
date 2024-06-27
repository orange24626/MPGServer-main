import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  GameSessionPostInput,
  GameSessionPostResponse,
  GameTrailPostInput,
  GetGameUrlParams,
  GetGameUrlResponse,
  OperatorProxyGetGameQuery,
  OperatorProxyGetGameSuccessResponse,
  OperatorProxyGetRTPQuery,
  OperatorProxyGetRTPSuccessResponse,
  OperatorProxyPayIn,
  OperatorProxyPayInSuccessResponse,
  OperatorProxyPayOut,
  OperatorProxyPayOutSuccessResponse,
  OperatorProxyQueryBalance,
  OperatorProxyQueryTransaction,
  OperatorProxyQueryTransactionSuccessResponse,
  OperatorProxyQueryTransactions,
  OperatorProxySetManyUserRTP,
  OperatorProxySetUserRTP,
  OperatorProxySetUserRTPSuccessResponse,
} from "dtos";

import { AuthService, GameHistoryService } from "services";
import { OperatorService } from "services/OperatorService";
import { OperatorUserService } from "services/OperatorUserService";

const operatorProxy = new OpenAPIHono();

const GetGameUrlRoute = createRoute({
  description: "获取游戏链接",
  summary: "获取游戏链接",
  tags: ["运营商服务"],
  method: "post",
  path: "/get-game-url",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetGameUrlParams,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GetGameUrlResponse,
        },
      },
      description: "Retrieve the user",
    },
  },
});

const AuthRoute = createRoute({
  description: "登录并且获取token",
  summary: "登录并且获取token",
  tags: ["运营商服务"],
  method: "post",
  path: "/session",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GameSessionPostInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GameSessionPostResponse,
        },
      },
      description: "Retrieve the user",
    },
  },
});

const TrialRoute = createRoute({
  description: "试玩",
  summary: "试玩",
  tags: ["运营商服务"],
  method: "post",
  path: "/trial",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GameTrailPostInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GameSessionPostResponse,
        },
      },
      description: "Retrieve the user",
    },
  },
});

const GetGameRecordRoute = createRoute({
  description: "获取游戏记录",
  summary: "获取游戏记录",
  tags: ["运营商服务"],
  method: "post",
  path: "/get-game-records",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxyGetGameQuery,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxyGetGameSuccessResponse,
        },
      },
      description: "Retrieve the game history",
    },
    400: {
      content: {
        "application/json": {
          schema: OperatorProxyGetGameSuccessResponse,
        },
      },
      description: "Retrieve the game history",
    },
  },
});

const GetUserRTPRoute = createRoute({
  description: "获取用户RTP",
  summary: "获取用户RTP",
  tags: ["运营商服务"],
  method: "post",
  path: "/get-user-rtp",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxyGetRTPQuery,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxyGetRTPSuccessResponse,
        },
      },
      description: "Retrieve the game history",
    },
  },
});

operatorProxy.openapi(GetUserRTPRoute, async (c) => {
  const body = c.req.valid("json");
  const urlRlt = await OperatorUserService.getUserRTP(body);
  return c.json(urlRlt);
});

const GetUserBalance = createRoute({
  description: "获取用户RTP",
  summary: "获取用户RTP",
  tags: ["运营商服务"],
  method: "post",
  path: "/get-user-balance",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxyQueryBalance,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxyGetRTPSuccessResponse,
        },
      },
      description: "Retrieve the game history",
    },
  },
});

operatorProxy.openapi(GetUserBalance, async (c) => {
  const urlRlt = await OperatorUserService.getUserBalance(c.req.valid("json"));
  return c.json(urlRlt);
});

const GetOperatorProxyTransactionRoute = createRoute({
  description: "查询运营商金额交易",
  summary: "查询运营商金额交易",
  tags: ["运营商服务"],
  method: "post",
  path: "/get-transaction",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxyQueryTransaction,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxyQueryTransactionSuccessResponse,
        },
      },
      description: "Retrieve the game history",
    },
    400: {
      content: {
        "application/json": {
          schema: OperatorProxyGetGameSuccessResponse,
        },
      },
      description: "Retrieve the game history",
    },
  },
});

const GetOperatorProxyTransactionsRoute = createRoute({
  description: "查询运营商金额交易",
  summary: "查询运营商金额交易",
  tags: ["运营商服务"],
  method: "post",
  path: "/get-transactions",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxyQueryTransactions,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxySetUserRTPSuccessResponse,
        },
      },
      description: "Retrieve the game history",
    },
  },
});

operatorProxy.openapi(GetOperatorProxyTransactionsRoute, async (c) => {
  const urlRlt = await OperatorService.getOperatorTransactions(c.req.valid("json"));
  return c.json(urlRlt);
});

operatorProxy.openapi(GetOperatorProxyTransactionRoute, async (c) => {
  const urlRlt = await OperatorService.getOperatorTransaction(c.req.valid("json"));
  return c.json(urlRlt);
});

const OperatorProxyPayInRoute = createRoute({
  description: "运营商存款",
  summary: "运营商存款",
  tags: ["运营商服务"],
  method: "post",
  path: "/pay-in",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxyPayIn,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxyPayInSuccessResponse,
        },
      },
      description: "Retrieve the user",
    },
  },
});

const OperatorProxyPayOutRoute = createRoute({
  description: "运营商提款",
  summary: "运营商提款",
  tags: ["运营商服务"],
  method: "post",
  path: "/pay-out",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxyPayOut,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxyPayOutSuccessResponse,
        },
      },
      description: "Retrieve the user",
    },
  },
});

operatorProxy.openapi(OperatorProxyPayOutRoute, async (c) => {
  const urlRlt = await OperatorService.payOut(c.req.valid("json"));
  return c.json(urlRlt);
});

operatorProxy.openapi(OperatorProxyPayInRoute, async (c) => {
  const input = c.req.valid("json");
  const urlRlt = await OperatorService.payIn(input);
  return c.json(urlRlt);
});

//设置用户RTP
const SetUserRTPRoute = createRoute({
  description: "设置玩家RTP",
  summary: "设置玩家RTP",
  tags: ["运营商服务"],
  method: "post",
  path: "/set-user-rtp",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxySetUserRTP,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxySetUserRTPSuccessResponse,
        },
      },
      description: "Retrieve the user",
    },
  },
});

operatorProxy.openapi(SetUserRTPRoute, async (c) => {
  const urlRlt = await OperatorUserService.setUserRTP(c.req.valid("json"));
  return c.json(urlRlt);
});

//设置批量用户RTP
const SetUserRTPBatchRoute = createRoute({
  description: "设置批量用户RTP",
  summary: "设置批量用户RTP",
  tags: ["运营商服务"],
  method: "post",
  path: "/set-user-rtp-batch",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OperatorProxySetManyUserRTP,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OperatorProxySetUserRTPSuccessResponse,
        },
      },
      description: "Retrieve the user",
    },
  },
});

operatorProxy.openapi(SetUserRTPBatchRoute, async (c) => {
  const urlRlt = await OperatorUserService.setUserRTPBatch(c.req.valid("json"));
  return c.json(urlRlt);
});

operatorProxy.openapi(AuthRoute, async (c) => {
  const body = c.req.valid("json");
  const authRlt = await AuthService.createOperatorSession(body);
  return c.json(authRlt);
});

operatorProxy.openapi(TrialRoute, async (c) => {
  const authRlt = await AuthService.trial(c.req.valid("json"));
  return c.json(GameSessionPostResponse.parse(authRlt));
});

operatorProxy.openapi(GetGameUrlRoute, async (c) => {
  const urlRlt = await OperatorService.getGameUrl(c.req.valid("json"));
  return c.json(GetGameUrlResponse.parse(urlRlt));
});

operatorProxy.openapi(GetGameRecordRoute, async (c) => {
  const body = c.req.valid("json");
  const urlRlt = await GameHistoryService.getGameOperatorRecords(body);
  return c.json(urlRlt);
});

export default operatorProxy;
