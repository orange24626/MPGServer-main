import { z } from "@hono/zod-openapi";

export const fortuneTigerInitSpinResult = {
  dt: {
    bl: 528128.03,
    cc: "",
    cs: [0.08, 0.8, 3, 10],
    fb: null,
    inwe: false,
    iuwe: false,
    ls: {
      si: {
        aw: 0,
        bl: 63474.17,
        blab: 63474.17,
        blb: 63974.17,
        cs: 0.08,
        ctw: 0,
        cwc: 0,
        fb: null,
        fstc: null,
        fws: 0,
        ge: [1, 11],
        gwt: -1,
        hashr: "0:6;2;7#3;5;7#5;7;7#MV#0.40#MT#1#MG#0#",
        irs: false,
        ist: false,
        itw: true,
        lw: null,
        ml: 1,
        mr: null,
        np: -0.4,
        nst: 1,
        ocr: null,
        orl: [6, 3, 5, 2, 5, 7, 7, 7, 7],
        pcwc: 0,
        pf: 1,
        pmt: null,
        psid: "1766668752016072704",
        rl: [6, 3, 5, 2, 5, 7, 7, 7, 7],
        rwsp: null,
        sid: "1766668752016072704",
        st: 1,
        tb: 500,
        tbb: 500,
        tw: 0,
        wbn: null,
        wc: 178,
        wfg: null,
        wid: 0,
        wk: "0_C",
        wp: null,
        wt: "C",
      },
    },
    maxwm: null,
    ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    mxl: 5,
    wt: {
      mw: 5, // 中等
      bw: 20, // 大奖
      mgw: 35, // 巨奖
      smgw: 50, // 超级巨奖
    },
  },
  err: null,
};

export const FortuneTigerSpinPostSchema = z
  .object({
    atk: z.string().openapi({
      param: {
        name: "accessToken",
      },
      example: "8d5a5b047fee3a539d0af45788f49257",
      description: "用户token",
    }),
    cs: z.string().openapi({
      param: {
        name: "baseBet",
      },
      example: "0.3",
      description: "下注金额",
    }),
    ml: z.string().openapi({
      param: {
        name: "baseBetRate",
      },
      example: "2",
      description: "下注倍率",
    }),
    pf: z.string().openapi({
      param: {
        name: "platform",
      },
      example: "2",
      description: "平台",
    }),
    id: z.string().openapi({
      param: {
        name: "spinID",
      },
      example: "1758645076035042816",
      description: "游戏SpinID",
    }),
    wk: z.string().openapi({
      param: {
        name: "winKey",
      },
      example: "0_C",
      description: "不是是啥",
    }),
    btt: z.string().openapi({
      param: {
        name: "btt",
      },
      example: "3",
      description: "不是是啥",
    }),
  })
  .openapi("老虎机旋转参数");

export const FortuneTigerSpinPostResponse = z
  .object({
    dt: z.object({
      si: z.object({
        wc: z.number().openapi({
          description: "赢的钱",
        }),
        ist: z.boolean().openapi({
          description: "是否是免费游戏",
        }),
        itw: z.boolean().openapi({
          description: "是否赢了",
        }),
        fws: z.number().optional().nullable().openapi({
          description: "免费游戏次数",
        }),
        wp: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        orl: z.array(z.number()).openapi({
          description: "不知道",
        }),
        lw: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        irs: z.boolean().openapi({
          description: "不知道",
        }),
        gwt: z.number().openapi({
          description: "不知道",
        }),
        fb: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        ctw: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        pmt: z.string().optional().nullable().openapi({
          description: "不知道",
        }),
        cwc: z.number().optional().nullable().openapi({
          description: "不知道",
        }),
        fstc: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        pcwc: z.number().openapi({
          description: "不知道",
        }),
        rwsp: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        hashr: z.string().openapi({
          description: "不知道",
        }),
        ml: z.number().openapi({
          description: "不知道",
        }),
        cs: z.number().openapi({
          description: "不知道",
        }),
        rl: z.array(z.number()).openapi({
          description: "不知道",
        }),
        sid: z.string().openapi({
          description: "不知道",
        }),
        psid: z.string().openapi({
          description: "不知道",
        }),
        st: z.number().openapi({
          description: "不知道",
        }),
        nst: z.number().openapi({
          description: "不知道",
        }),
        pf: z.number().openapi({
          description: "不知道",
        }),
        aw: z.number().openapi({
          description: "不知道",
        }),
        wid: z.number().openapi({
          description: "不知道",
        }),
        wt: z.string().openapi({
          description: "不知道",
        }),
        wk: z.string().openapi({
          description: "不知道",
        }),
        wbn: z.string().optional().nullable().openapi({
          description: "不知道",
        }),
        wfg: z.string().optional().nullable().openapi({
          description: "不知道",
        }),
        blb: z.number().openapi({
          description: "不知道",
        }),
        blab: z.number().openapi({
          description: "不知道",
        }),
        bl: z.number().openapi({
          description: "不知道",
        }),
        tb: z.number().openapi({
          description: "不知道",
        }),
        tbb: z.number().openapi({
          description: "不知道",
        }),
        tw: z.number().openapi({
          description: "不知道",
        }),
        np: z.number().optional().nullable().openapi({
          description: "不知道",
        }),
        ocr: z.string().optional().nullable().openapi({
          description: "不知道",
        }),
        mr: z.string().optional().nullable().openapi({
          description: "不知道",
        }),
        ge: z.array(z.number()).openapi({
          description: "不知道",
        }),
      }),
    }),
    err: z.string().optional().nullable().openapi({
      description: "不知道",
    }),
  })
  .openapi("老虎机旋转返回");
