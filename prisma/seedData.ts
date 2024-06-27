import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

export const operators: Prisma.OperatorCreateInput[] = [
  {
    name: "运营商1",
    operatorKey: nanoid(),
    operatorID: nanoid(),
    operatorSecret: nanoid(),
  },
  {
    name: "运营商2",
    operatorKey: nanoid(),
    operatorID: nanoid(),
    operatorSecret: nanoid(),
  },
  {
    name: "EG包网",
    operatorKey: nanoid(),
    operatorID: nanoid(),
    operatorSecret: nanoid(),
  },
  {
    name: "MPG运营商",
    operatorKey: nanoid(),
    operatorID: nanoid(),
    operatorSecret: nanoid(),
    selfOwned: true,
  },
];

export const games: Prisma.GameCreateInput[] = [
  {
    name: "fortune-tiger", //应当于API路径一致
    gameID: 126,
    fullName: "Fortune Tiger",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      maxRate: 2500,
      cs: [0.08, 0.8, 3, 10],
      wt: {
        mw: 5, // 中等
        bw: 20, // 大奖
        mgw: 35, // 巨奖
        smgw: 50, // 超级巨奖
      },
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      fb: {
        is: true,
        bm: 100,
        t: 0.15,
      },
      inwe: false,
      iuwe: false,
      maxwm: null,
      cc: "PGC",
    },
  },
  {
    name: "ganesha-gold", //应当于API路径一致
    gameID: 42,
    fullName: "Ganesha Gold",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      maxRate: 2500,
      cs: [0.03, 0.1, 0.3, 0.9],
      wt: {
        mw: 3, // 中等
        bw: 5, // 大奖
        mgw: 15, // 巨奖
        smgw: 35, // 超级巨奖
      },
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      mxl: 30,
      fb: {
        is: true,
        bm: 100,
        t: 0.9,
      },
      inwe: false,
      iuwe: false,
      maxwm: null,
      cc: "PGC",
    },
  },
  {
    name: "fortune-dragon", //应当于API路径一致
    gameID: 1695365,
    fullName: "Fortune Dragon",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      maxRate: 2500,
      cs: [0.08, 0.8, 3, 10],
      wt: {
        mw: 5, // 中等
        bw: 20, // 大奖
        mgw: 35, // 巨奖
        smgw: 50, // 超级巨奖
      },
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      fb: {
        is: true,
        bm: 100,
        t: 0.15,
      },
      inwe: false,
      iuwe: false,
      maxwm: null,
      cc: "PGC",
    },
  },
  {
    name: "fortune-mouse", //应当于API路径一致
    gameID: 68,
    fullName: "Fortune Mouse",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      maxRate: 2500,
      cs: [0.1, 1, 3, 10],
      wt: {
        mw: 5, // 中等
        bw: 20, // 大奖
        mgw: 35, // 巨奖
        smgw: 50, // 超级巨奖
      },
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      fb: {
        is: true,
        bm: 100,
        t: 0.15,
      },
      inwe: false,
      iuwe: false,
      maxwm: null,
      cc: "PGC",
    },
  },
  {
    name: "fortune-ox", //应当于API路径一致
    gameID: 98,
    fullName: "Fortune Ox",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      maxRate: 2500,
      cc: "PGC",
      cs: [0.05, 0.5, 4],
      fb: null,
      inwe: false,
      iuwe: false,
      maxwm: null,
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      mxl: 10,
      wt: {
        mw: 5, // 中等
        bw: 20, // 大奖
        mgw: 35, // 巨奖
        smgw: 50, // 超级巨奖
      },
    },
  },
  {
    name: "fortune-rabbit", //应当于API路径一致
    gameID: 1543462,
    fullName: "Fortune Rabbit",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      maxRate: 2500,
      cc: "PGC",
      cs: [0.05, 0.5, 4],
      fb: null,
      inwe: false,
      iuwe: false,
      maxwm: null,
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      mxl: 10,
      wt: {
        mw: 5, // 中等
        bw: 20, // 大奖
        mgw: 35, // 巨奖
        smgw: 50, // 超级巨奖
      },
    },
  },
  {
    name: "fortune-double", //应当于API路径一致
    gameID: 48,
    fullName: "Fortune Double",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      maxRate: 2500,
      cs: [0.08, 0.8, 3, 10],
      wt: {
        mw: 5, // 中等
        bw: 20, // 大奖
        mgw: 35, // 巨奖
        smgw: 50, // 超级巨奖
      },
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      fb: {
        is: true,
        bm: 100,
        t: 0.15,
      },
      inwe: false,
      iuwe: false,
      maxwm: null,
      cc: "PGC",
    },
  },
  {
    name: "lucky-neko", //应当于API路径一致
    gameID: 89,
    fullName: "Lucky Neko",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      mxl: 20,
      maxRate: 2500,
      cs: [0.02, 0.1, 0.2],
      wt: {
        mw: 5, // 中等
        bw: 20, // 大奖
        mgw: 35, // 巨奖
        smgw: 50, // 超级巨奖
      },
      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      fb: {
        bm: 75,
        is: true,
        t: 20,
      },
      inwe: false,
      iuwe: false,
      maxwm: null,
      cc: "PGC",
    },
  },
  {
    name: "fortune-dragonTH", //应当于API路径一致
    gameID: 57,
    fullName: "Fortune dragonTH",
    setting: {
      rtp: {
        df: {
          min: 96.81,
          max: 96.81,
        },
      },
      maxRate: 2500,
      cs: [0.03, 0.1, 0.3, 0.9],
      wt: {
        mw: 3,
        bw: 5,
        mgw: 15,
        smgw: 35,
      },

      ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      fb: {
        is: true,
        bm: 100,
        t: 0.15,
      },
      inwe: false,
      iuwe: false,
      maxwm: null,
      cc: "PGC",
    },
  },
];
