import { z } from "@hono/zod-openapi";

export const fortuneRabbitInitSpinResult = {
  dt: {
    si: {
      aw: 0,
      bl: 0,
      blab: 0,
      blb: 0,
      cs: 0.05,
      ctw: 0,
      cwc: 0,
      fb: null,
      fstc: null,
      ge: [1, 11],
      gwt: -1,
      hashr: null,
      // itw: false,
      lw: null,
      ml: 1,
      mr: null,
      np: 0,
      nst: 1,
      ocr: null,
      orl: [5, 0, 7, 99, 5, 7, 0, 3, 6, 4, 1, 99],
      pcwc: 0,
      pf: 3,
      pmt: null,
      psid: "0",
      rl: [5, 0, 7, 99, 5, 7, 0, 3, 6, 4, 1, 99],
      rwsp: null,
      sid: "0",
      st: 1,
      tb: 0,
      tbb: 0,
      tw: 0,
      wbn: null,
      wfg: null,
      wid: 0,
      wk: "0_C",
      wp: null,
      wt: "C",
      cpf: {},
      cptw: 0.0,
      crtw: 0.0,
      iff: false,
      ift: false,
      imw: false,
      fs: null,
    },
  },
  err: null,
};

export const FortuneRabbitSpinPostSchema = z
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
      example: "3",
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

export const FortuneRabbitSpinPostResponse = z
  .object({
    dt: z.object({
      si: z.object({
        // wc: z.number().openapi({
        //   description: "赢的钱",
        // }),
        // itw: z.boolean().openapi({
        //   description: "是否赢了",
        // }),
        wp: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        orl: z.array(z.number()).openapi({
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
        fs: z.any().openapi({
          description: "福牛是true",
        }),
        // im: z.boolean().openapi({
        //   description: "不知道",
        // }),
        // rc: z.number().openapi({
        //   description: "连消次数",
        // }),
        // rf: z.boolean().openapi({
        //   description: "开启福牛，结束变为false",
        // }),
        // rtf: z.boolean().openapi({
        //   description: "多滚动一段时间",
        // }),
        cpf: z.unknown().optional().nullable().openapi({
          description: "不知道",
        }),
        cptw: z.number().openapi({
          description: "不知道",
        }),
        crtw: z.number().openapi({
          description: "不知道",
        }),
        iff: z.boolean().openapi({
          description: "是否赢了",
        }),
        ift: z.boolean().openapi({
          description: "是否赢了",
        }),
        imw: z.boolean().openapi({
          description: "是否赢了",
        }),
      }),
    }),
    err: z.string().optional().nullable().openapi({
      description: "不知道",
    }),
  })
  .openapi("老虎机旋转返回");
