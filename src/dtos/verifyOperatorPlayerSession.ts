import { z } from "@hono/zod-openapi";

export const VerifyOperationPlayerSessionInput = z
  .object({
    cp: z.string().openapi({
      description: "运营商用户ID",
      example: "65d5f89e079d742600b53555",
    }),
    btt: z.string().openapi({
      description: "未知",
      example: "1",
    }),
    vc: z.string().openapi({
      description: "观察每次增加2",
      example: "2",
    }),
    pf: z.string().openapi({
      description: "未知",
      example: "1",
    }),
    l: z.string().openapi({
      description: "语言",
      example: "zh",
    }),
    gi: z.string().openapi({
      description: "游戏",
      example: "fortune-tiger",
    }),
    os: z.string().openapi({
      description: "运营商访问key",
      example: "522648ad480a46609a83cf3b47371707",
    }),
    otk: z.string().openapi({
      description: "运营商用户token",
      example: "8d5a5b047fee3a539d0af45788f49257",
    }),
  })
  .openapi("登录参数");

export const VerifyOperationPlayerSessionOutput = z
  .object({
    dt: z
      .object({
        oj: z.object({
          jid: z.number().openapi({
            description: "固定数值",
            example: 1,
          }),
        }),
        bau: z.string().openapi({
          description: "未知",
          example: "web-api/game-proxy/",
        }),
        cc: z.string().openapi({
          description: "货币",
          example: "BRL",
        }),
        cs: z.string().openapi({
          description: "货币符号",
          example: "R$",
        }),
        ec: z.array(z.unknown()).openapi({
          description: "未知",
          example: [],
        }),
        geu: z.string().openapi({
          description: "未知",
          example: "game-api/fortune-tiger/",
        }),
        gm: z
          .array(
            z.object({
              amsg: z.string().optional().openapi({
                description: "未知",
                example: "",
              }),
              gid: z.number().openapi({
                description: "游戏ID",
                example: 126,
              }),
              medt: z.number().openapi({
                description: "未知",
                example: 1638432036000,
              }),
              mxe: z.number().openapi({
                description: "最大额度",
                example: 2500,
              }),
              mxehr: z.number().openapi({
                description: "未知",
                example: 8960913,
              }),
              msdt: z.number().openapi({
                description: "未知",
                example: 1638432036000,
              }),
              rtp: z
                .object({
                  df: z
                    .object({
                      max: z.number().openapi({
                        description: "最大RTP",
                        example: 96.81,
                      }),
                      min: z.number().openapi({
                        description: "最小RTP",
                        example: 96.81,
                      }),
                    })
                    .openapi("RTP"),
                })
                .optional()
                .openapi("未知"),
              st: z.number().openapi({
                description: "未知",
                example: 1,
              }),
            }),
          )
          .openapi("游戏"),
        ioph: z.string().openapi({
          description: "每个玩家进每个游戏会产生此唯一值",
          example: "949c1db86c3",
        }),
        lau: z.string().openapi({
          description: "未知",
          example: "/game-api/lobby/",
        }),
        nkn: z.string().openapi({
          description: "昵称",
          example: "turistas_9387",
        }),
        occ: z
          .object({
            rurl: z.string().openapi({
              description: "未知",
              example: "",
            }),
            tcm: z.string().openapi({
              description: "测试模式介绍",
              example: "",
            }),
            tlb: z.string().openapi({
              description: "测试模式左上角按钮文本",
              example: "",
            }),
            trb: z.string().openapi({
              description: "测试模式右上角按钮文本",
              example: "",
            }),
            tsc: z.number().openapi({
              description: "测试模式金额",
              example: 0,
            }),
            ttp: z.number().openapi({
              description: "未知",
              example: 0,
            }),
          })
          .openapi("未知"),
        pid: z.string().openapi({
          description: "游戏系统玩家id",
          example: "kVYGruLdND",
        }),
        st: z.number().openapi({
          description: "未知",
          example: 1,
        }),
        tk: z.string().openapi({
          description: "未知",
          example: "522648ad480a46609a83cf3b47371707",
        }),
        uiogc: z
          .object({
            asc: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            as: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            bf: z.number().openapi({
              description: "未知",
              example: 1,
            }),
            bfbsi: z.number().openapi({
              description: "未知",
              example: 1,
            }),
            bfbli: z.number().openapi({
              description: "未知",
              example: 1,
            }),
            bu: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            cbu: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            cl: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            et: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            gc: z.boolean().openapi({
              description: "未知",
              example: true,
            }),
            gec: z.number().openapi({
              description: "未知",
              example: 1,
            }),
            gsc: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            grtp: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            hd: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            hnp: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            hn: z.number().openapi({
              description: "未知",
              example: 1,
            }),
            ign: z.boolean().openapi({
              description: "未知",
              example: true,
            }),
            igv: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            il: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            ir: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            ivs: z.number().openapi({
              description: "未知",
              example: 1,
            }),
            mr: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            np: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            pwr: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            phtr: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            rp: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            smpo: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            std: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            tsn: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            ts: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            vc: z.number().openapi({
              description: "未知",
              example: 0,
            }),
            we: z.number().openapi({
              description: "未知",
              example: 0,
            }),
          })
          .openapi("未知"),
      })
      .openapi("数据"),
    err: z.unknown().openapi("错误"),
  })
  .openapi("返回");

export const InitVerifyOperatorPlayerSession = {
  dt: {
    oj: {
      jid: 1,
    },
    pid: "kVYGruLdND",
    pcd: "316901",
    tk: "522648ad480a46609a83cf3b47371707",
    st: 1,
    geu: "game-api/fortune-tiger/",
    lau: "/game-api/lobby/",
    bau: "web-api/game-proxy/",
    cc: "BRL",
    cs: "R$",
    nkn: "turistas_9387",
    gm: [
      {
        gid: 126,
        msdt: 1638432036000,
        medt: 1638432036000,
        st: 1,
        amsg: "",
        rtp: {
          df: {
            min: 96.81,
            max: 96.81,
          },
        },
        mxe: 2500,
        mxehr: 8960913,
      },
    ],
    uiogc: {
      bb: 1,
      grtp: 0,
      gec: 1,
      cbu: 0,
      cl: 0,
      bf: 1,
      mr: 0,
      phtr: 0,
      vc: 0,
      bfbsi: 1,
      bfbli: 1,
      il: 0,
      rp: 0,
      gc: true,
      ign: true,
      tsn: 0,
      we: 0,
      gsc: 0,
      bu: 0,
      pwr: 0,
      hd: 0,
      et: 0,
      np: 0,
      igv: 0,
      as: 0,
      asc: 0,
      std: 0,
      hnp: 0,
      ts: 0,
      smpo: 0,
      ivs: 1,
      ir: 0,
      hn: 1,
    },
    ec: [
      {
        n: "132bb011e7",
        v: "10",
        il: 0,
        om: 0,
        uie: {
          ct: "1",
        },
      },
      {
        n: "5e3d8c75c3",
        v: "6",
        il: 0,
        om: 0,
        uie: {
          ct: "1",
        },
      },
    ],
    occ: {
      rurl: "",
      tcm: "",
      tsc: 0,
      ttp: 0,
      tlb: "",
      trb: "",
    },
    ioph: "949c1db86c3",
  },
  err: null,
};
