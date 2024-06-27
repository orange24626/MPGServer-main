import { z } from "@hono/zod-openapi";

export const OperatorProxyGetGameQuery = z
  .object({
    accessKey: z.string().openapi({
      description: "运营商标识",
      example: "xxxxxxxxxxxxx",
    }),
    startedAt: z.string().optional().openapi({
      description: "开始时间戳，单位秒",
      example: "1630000000",
    }),
    endedAt: z.string().optional().openapi({
      description: "开始时间戳，单位秒",
      example: "1630000000",
    }),
    page: z.number().default(1).optional().openapi({
      description: "默认1",
      example: 1,
    }),
    pageSize: z.number().max(5000).default(20).optional().openapi({
      description: "默认20，最大100000",
      example: 20,
    }),
    userID: z.string().optional().openapi({
      description: "用户ID，来自运营商注册的用户ID",
      example: "1",
    }),
    gameID: z.number().optional().openapi({
      description: "游戏ID",
      example: 126,
    }),
    gameOrderID: z.string().optional().openapi({
      description: "订单ID, 默认为空",
      example: "1",
    }),
    sort: z.number().optional().openapi({
      description: "排序方式，默认-1倒序，1正序",
      example: -1,
    }),
    sign: z.string().openapi({
      description: "签名",
      example: "xxxxxxxxxxxxx",
    }),
  })
  .openapi("运营商获取游戏记录-查询条件");

export const OperatorProxyGetGameSuccessResponse = z
  .object({
    status: z.number().openapi({
      description: "状态码",
      example: 0,
    }),
    data: z.any().openapi("返回数据"),
    msg: z.string().openapi({
      description: "错误信息",
      example: "success",
    }),
  })
  .openapi("运营商获取游戏记录-成功返回");

export const OperatorProxyGetGameErrorResponse = z
  .object({
    code: z.number().openapi({
      description: "错误码",
      example: 1001,
    }),
    message: z.string().openapi({
      description: "错误信息",
      example: "错误信息",
    }),
  })
  .openapi("运营商获取游戏记录-错误返回");

export const OperatorProxyGetRTPQuery = z
  .object({
    accessKey: z.string().openapi({
      description: "运营商标识",
      example: "xxxxxxxxxxxxx",
    }),
    userID: z.string().openapi({
      description: "用户ID，来自运营商注册的用户ID",
      example: "1",
    }),
    sign: z.string().openapi({
      description: "签名",
      example: "xxxxxxxxxxxxx",
    }),
  })
  .openapi("运营商获取RTP记录-查询条件");

export const OperatorProxyGetRTPSuccessResponse = z
  .object({
    status: z.number().openapi({
      description: "总数",
      example: 0,
    }),
    data: z.any().openapi("返回数据"),
    msg: z.string().openapi({
      description: "错误信息",
      example: "成功",
    }),
  })
  .openapi("运营商获取RTP记录-成功返回");

export const OperatorProxyGetRTPErrorResponse = z
  .object({
    code: z.number().openapi({
      description: "错误码",
      example: 1001,
    }),
    message: z.string().openapi({
      description: "错误信息",
      example: "错误信息",
    }),
  })
  .openapi("运营商获取RTP记录-错误返回");

export const OperatorProxySetUserRTP = z.object({
  accessKey: z.string().openapi({
    description: "运营商标识",
    example: "xxxxxxxxxxxxx",
  }),
  userID: z.string().openapi({
    description: "用户ID，来自运营商注册的用户ID",
    example: "1",
  }),
  rtp: z.number().openapi({
    description: "RTP",
    example: 11,
  }),
  sign: z.string().openapi({
    description: "签名",
    example: "xxxxxxxxxxxxx",
  }),
});

export const OperatorProxySetUserRTPSuccessResponse = z
  .object({
    status: z.number().openapi({
      description: "状态码",
      example: 0,
    }),
    mgs: z.any().openapi({
      description: "错误信息",
      example: "成功",
    }),
    data: z.any().openapi({
      description: "返回数据",
      example: "成功",
    }),
  })
  .openapi("运营商设置RTP-成功返回");

export const OperatorProxySetUserRTPErrorResponse = z
  .object({
    code: z.number().openapi({
      description: "错误码",
      example: 1001,
    }),
    message: z.string().openapi({
      description: "错误信息",
      example: "错误信息",
    }),
  })
  .openapi("运营商设置RTP-错误返回");

export const OperatorProxySetManyUserRTP = z.object({
  accessKey: z.string().openapi({
    description: "运营商标识",
    example: "xxxxxxxxxxxxx",
  }),
  userIDs: z.string().openapi({
    description: "用户ID，来自运营商注册的用户ID, 由|分割",
    example: "1",
  }),
  rtp: z.number().openapi({
    description: "RTP",
    example: 11,
  }),
  sign: z.string().openapi({
    description: "签名",
    example: "xxxxxxxxxxxxx",
  }),
});

export const OperatorProxyQueryBalance = z
  .object({
    accessKey: z.string().openapi({
      description: "运营商标识",
      example: "xxxxxxxxxxxxx",
    }),
    userID: z.string().openapi({
      description: "用户ID，来自运营商注册的用户ID",
      example: "1",
    }),
    currency: z.string().optional().openapi({
      description: "货币",
      example: "BRL",
    }),
    sign: z.string().openapi({
      description: "签名",
      example: "xxxxxxxxxxxxx",
    }),
  })
  .openapi("运营商查询用户余额-查询条件");

export const OperatorProxyQueryBalanceErrorResponse = z
  .object({
    code: z.number().openapi({
      description: "错误码",
      example: 1001,
    }),
    message: z.string().openapi({
      description: "错误信息",
      example: "错误信息",
    }),
  })
  .openapi("运营商查询用户余额-错误返回");

export const OperatorProxyPayIn = z.object({
  accessKey: z.string().openapi({
    description: "运营商标识",
    example: "xxxxxxxxxxxxx",
  }),
  userID: z.string().openapi({
    description: "用户ID，来自运营商注册的用户ID",
    example: "1",
  }),
  amount: z
    .number()
    .openapi({
      description: "金额",
      example: 1000,
    })
    .min(0, "金额必须大于0"),
  orderID: z.string().openapi({
    description: "运营商订单号",
  }),
  currency: z.string().openapi({
    description: "货币",
    example: "BRL",
  }),
  sign: z.string().openapi({
    description: "签名",
    example: "xxxxxxxxxxxxx",
  }),
});

export const OperatorProxyPayInSuccessResponse = z
  .object({
    status: z.number().openapi({
      description: "错误码",
      example: 0,
    }),
    msg: z.string().openapi({
      description: "错误信息",
      example: "成功",
    }),
    data: z.any().openapi({
      description: "返回数据",
      example: "成功",
    }),
  })
  .openapi("运营商用户存款-成功返回");

export const OperatorProxyPayInErrorResponse = z
  .object({
    code: z.number().openapi({
      description: "错误码",
      example: 1001,
    }),
    message: z.string().openapi({
      description: "错误信息",
      example: "错误信息",
    }),
  })
  .openapi("运营商用户存款-错误返回");

export const OperatorProxyPayOut = z
  .object({
    accessKey: z.string().openapi({
      description: "运营商标识",
      example: "xxxxxxxxxxxxx",
    }),
    userID: z.string().openapi({
      description: "用户ID，来自运营商注册的用户ID",
      example: "1",
    }),
    orderID: z.string().openapi({
      description: "运营商订单号",
    }),
    amount: z.number().openapi({
      description: "金额",
      example: 1000,
    }),
    all: z.number().openapi({
      description: "1: 全部取出, 0: 不是全部取出",
      example: 1,
    }),
    currency: z.string().openapi({
      description: "货币",
      example: "BRL",
    }),
    sign: z.string().openapi({
      description: "签名",
      example: "xxxxxxxxxxxxx",
    }),
  })
  .openapi("运营商用户取款");

export const OperatorProxyPayOutSuccessResponse = z
  .object({
    status: z.number().openapi({
      description: "状态码",
      example: 0,
    }),
    data: z.any().openapi("返回数据"),
    msg: z.string().openapi({
      description: "错误信息",
      example: "success",
    }),
  })
  .openapi("运营商用户取款-成功返回");

export const OperatorProxyPayOutErrorResponse = z
  .object({
    code: z.number().openapi({
      description: "错误码",
      example: 1001,
    }),
    message: z.string().openapi({
      description: "错误信息",
      example: "错误信息",
    }),
  })
  .openapi("运营商用户取款-错误返回");

export const OperatorProxyQueryTransaction = z.object({
  accessKey: z.string().openapi({
    description: "运营商标识",
    example: "xxxxxxxxxxxxx",
  }),
  orderID: z.string().openapi({
    description: "运营商的订单号",
    example: "1",
  }),
  sign: z.string().openapi({
    description: "签名",
    example: "xxxxxxxxxxxxx",
  }),
});

export const OperatorProxyQueryTransactions = z.object({
  accessKey: z.string().openapi({
    description: "运营商标识",
    example: "xxxxxxxxxxxxx",
  }),
  startedAt: z.string().openapi({
    description: "开始时间戳",
    example: "1630000000",
  }),
  endedAt: z.string().openapi({
    description: "结束时间戳",
    example: "1630000000",
  }),
  sign: z.string().openapi({
    description: "签名",
    example: "xxxxxxxxxxxxx",
  }),
});

export const OperatorProxyQueryTransactionSuccessResponse = z
  .object({
    status: z.number().openapi({
      description: "错误码",
      example: 0,
    }),
    code: z.string().openapi({
      description: "错误信息",
      example: "成功",
    }),
    data: z.any().openapi("返回数据"),
  })
  .openapi("运营商查询交易-成功返回");
