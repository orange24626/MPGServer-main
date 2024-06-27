import { z } from "@hono/zod-openapi";

export const FortuneDragonSpinPostInput = z
  .object({
    atk: z.string().openapi({
      description: "用户token",
      example: "8d5a5b047fee3a539d0af45788f49257",
    }),
    cs: z.string().openapi({
      description: "下注金额",
      example: "0.3",
    }),
    ml: z.string().openapi({
      description: "下注倍率",
      example: "2",
    }),

    pf: z.string().openapi({
      description: "平台",
      example: "2",
    }),
    id: z.string().openapi({
      description: "游戏SpinID",
      example: "1758645076035042816",
    }),
    wk: z.string().openapi({
      description: "不是是啥",
      example: "0_C",
    }),
    btt: z.string().openapi({
      description: "不是是啥",
      example: "3",
    }),
    fb: z.any().openapi({
      description: "必赢",
      example: null,
    }),
  })
  .openapi("幸运龙旋转参数");

export const FortuneDragonSpinPostResponse = z
  .object({
    dt: z.object({
      si: z.object({
        fws: z.number().optional().nullable().openapi({
          description: "免费游戏次数",
        }),
        wp: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        orl: z.array(z.number()).openapi({
          description: "不知道",
        }),
        ssaw: z
          .number()
          .optional()
          .nullable()
          .openapi({
            param: {
              name: "ssaw",
            },
            example: 0,
            description: "不知道",
          }),
        lw: z.unknown().optional().nullable().openapi({
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
        gm: z.number().openapi({
          description: "不知道",
        }),
        it: z.boolean().openapi({
          description: "蓄力",
        }),
        fs: z.any().nullable().openapi({
          description: "不知道",
        }),
        crtw: z.number().openapi({
          description: "不知道",
        }),
        imw: z.boolean().openapi({
          description: "不知道",
        }),
        mf: z.any().openapi({
          description: "不知道",
        }),
      }),
    }),
    err: z.string().optional().nullable().openapi({
      description: "不知道",
    }),
  })
  .openapi("幸运龙旋转返回");

export const fortuneDragonInitSpinResult = {
  dt: {
    bl: 528128.43,
    cc: "",
    cs: [0.08, 0.8, 3, 10],
    fb: {
      bm: 5,
      is: true,
      t: 500,
    },
    inwe: false,
    iuwe: false,
    ls: {
      si: {
        aw: 0,
        bl: 528128.43,
        blab: 528128.43,
        blb: 528128.83,
        crtw: 0,
        ctw: 0,
        cwc: 0,
        fb: null,
        fs: null,
        fstc: null,
        ge: [1, 11],
        gm: 1,
        gwt: -1,
        hashr: "0:3;7;6#3;7;5#5;4;7#MV#0.40#MT#1#MG#0#",
        imw: false,
        it: false,
        lw: null,
        mf: {
          mi: [5, 2],
          ms: [false, false],
          mt: [],
        },
        ml: 1,
        mr: null,
        np: -0.4,
        nst: 1,
        ocr: null,
        orl: [3, 3, 5, 7, 7, 4, 6, 5, 7],
        pcwc: 0,
        pf: 2,
        pmt: null,
        psid: "1768537912844025856",
        rl: [3, 3, 5, 7, 7, 4, 6, 5, 7],
        rwsp: null,
        sid: "1768537912844025856",
        ssaw: 0,
        st: 1,
        cs: 0.08,
        tb: 0.4,
        tbb: 0.4,
        tw: 0,
        wbn: null,
        wfg: null,
        wid: 0,
        wk: "0_C",
        wp: null,
        wt: "C",
      },
    },
    maxwm: 2500,
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
