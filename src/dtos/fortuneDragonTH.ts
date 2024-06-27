import { z } from "@hono/zod-openapi";

export const FortuneDragonTHInitSpinResult = {
    dt: {
        si: {
          wp: { //中奖每一路元素索引
            1: [
              1,
              5,
              6,
              11
            ]
          },
          sw: {
            1: {
              s: 8,//本路消的icon id号
              wa: 1.2 //本路获得多少钱
            }
          },
          sc: {
            1: 4 //代表第一列要消除 4个
          },
          //本回合一共可以合成的元素数量 累积中奖符号数量超过10个  有机会进入土龙模式，下一回合如果没有中奖组合 则触发土龙模式
          cb: 4,
          cbc: 4,
          //历史结果
          orl: [
            4,
            0,
            5,
            4,
            2,
            8,
            8,
            3,
            8,
            3,
            7,
            8,
            7,
            2,
            7,
            7,
            7,
            3,
            6,
            6,
            4,
            2,
            8,
            7,
            7
          ],
          /**
           * [
                {
                    "dt": 3, // 可处于土龙模式
                    "idh": false, // 土龙未触发
                    "p": null |[ // 土龙消除的元素所在位置
                        1,
                        6,
                        8,
                        10,
                        12,
                        14,
                        15,
                        16,
                        17,
                        18,
                        19,
                        21
                    ]

                }
            ],

           */
          df: null,
          mdf: null,
          rns: null,//每一列掉落的元素（新生成的）0:[]1:[] 二维数组
          gwt: -1,
          fb: null,
          ctw: 1.2,
          pmt: null,
          cwc: 1,
          fstc: null,//第几个免费回合
          pcwc: 1,
          rwsp: { // 如果有中奖 返回该元素对应个数的赔付表倍率
            1: 2
          },
          //订单hash码
          hashr: "0:4;8;7;7;4#0;8;8;7;2#5;3;7;3;8#4;8;2;6;7#2;3;7;6;7#R#8#01101121#MV#6.0#MT#1#MG#1.2#",
          ml: 2,//选的基础倍数
          cs: 0.3,//选的倍率
          //// -1元素是土龙消除的低倍符号 0是百搭

          rl: [
            4,
            0,
            5,
            4,
            2,
            8,
            8,
            3,
            8,
            3,
            7,
            8,
            7,
            2,
            7,
            7,
            7,
            3,
            6,
            6,
            4,
            2,
            8,
            7,
            7
          ],
          sid: 1772667700096466432,//下一次spin要带上的id
          psid: 1772667700096466432,//下一次spin要带上的id
          st: 1,//当前是不是免费
          nst: 1,// 表示本回合后续有免费spin
          pf: 2,
          aw: 1.2,// 一组回合合计中奖金额
          wid: 0,
          wt: "C",
          wk: "0_C",
          wbn: null,
          wfg: null,
          //扣费前余额
          blb: 99982,
          //扣费后余额
          blab: 99976,
          //扣费并获奖后的余额
          bl: 99977.2,
          tb: 6,// 本回合付费金额  0时代表免费
          tbb: 6,// 一组回合付费金额
          tw: 1.2,
          np: -4.8,
          ocr: null,
          mr: null,
          ge: [
            1,//特殊模式编号 1普通 3特殊
            11
          ]
        }
      },
      err: null
};

export const FortuneDragonTHSpinPostSchema = z
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

export const FortuneDragonTHSpinPostResponse = z
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


  /**
   * [
  {
    "tp": [
      7,
      10
    ],
    "os": 5,
    "ns": 3
  },
  {
    "tp": [
      1,
      3,
      19
    ],
    "os": 6,
    "ns": 3
  },
  {
    "tp": [
      0,
      2,
      4,
      6,
      8,
      12,
      14,
      18,
      20,
      22,
      24
    ],
    "os": 7,
    "ns": 1
  },
  {
    "tp": [
      5
    ],
    "os": 8,
    "ns": 3
  }
]
   */