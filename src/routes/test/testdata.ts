
{
    "dt": {
      "31": "Baccarat Deluxe"
    },
    "err": null
  }
  
// interface SlotMachineResult {
//     dt: {
//       si: {
//         wp: Record<string, [number, number]>, // "wp" 表示 winning patterns，每个键代表一种赢取模式，值为一个数组，第一元素可能是次数，第二元素是系数。
//         lw: Record<string, number>, // "lw" 表示 line wins，每个键代表一条线，值为该线的赢取金额。
//         lwm: null | number, // "lwm" 可能表示 largest win amount，最大赢取金额，此处为null。
//         slw: number[], // "slw" 表示 session line wins，一个会话中所有线的赢取金额总和。
//         nk: Record<string, number>, // "nk" 表示 number of hits/knocks，每个键代表一条线，值为该线的中奖次数。
//         sc: number, // "sc" 表示 special count，特殊计数器。
//         fs: null | number, // "fs" 表示 free spins，自由旋转次数。
//         gwt: number, // "gwt" 表示 game win type，游戏赢取类型。
//         fb: null | any, // "fb" 表示 free balance，自由余额，具体含义不明。
//         ctw: number, // "ctw" 表示 current total win，当前总赢取金额。
//         pmt: null | any, // "pmt" 表示 payment type/mode，支付类型/模式。
//         cwc: number, // "cwc" 表示 current win count，当前赢取计数。
//         fstc: null | any, // "fstc" 表示 free spin total count，自由旋转总计数。
//         pcwc: number, // "pcwc" 表示 possible current win count，可能的当前赢取计数。
//         rwsp: Record<string, Record<string, number>>, // "rwsp" 表示 reel win spin position，转轮赢取旋转位置。
//         hashr: string, // "hashr" 表示 hash result，游戏结果的哈希值，可能包含具体的赢取路径和金额。
//         ml: number, // "ml" 表示 multiplier level，乘数等级。
//         cs: number, // "cs" 表示 credit score，信用分数。
//         rl: number[], // "rl" 表示 reel layout，转轮布局，具体含义可能根据游戏不同而有所变化。
//         sid: string, // "sid" 表示 session id，会话ID。
//         psid: string, // "psid" 表示 parent session id，父会话ID。
//         st: number, // "st" 表示 state，状态。
//         nst: number, // "nst" 表示 next state，下一个状态。
//         pf: number, // "pf" 表示 platform fee，平台费用。
//         aw: number, // "aw" 表示 amount win，赢取金额。
//         wid: number, // "wid" 表示 wallet id，钱包ID。
//         wt: string, // "wt" 表示 win type，赢取类型。
//         wk: string, // "wk" 表示 win key，赢取键。
//         wbn: null | any, // "wbn" 表示 win bonus name，赢取奖金名称。
//         wfg: null | any, // "wfg" 表示 win flag，赢取标志。
//         blb: number, // "blb" 表示 balance before，赢取前余额。
//         blab: number, // "blab" 表示 balance after，赢取后余额。
//         bl: number, // "bl" 表示 balance，当前余额。
//         tb: number, // "tb" 表示 total bet，总投注。
//         tbb: number, // "tbb" 表示 total bet balance，总投注余额。
//         tw: number, // "tw" 表示 total win，总赢取。
//         np: number, // "np" 表示 new position，新位置。
//         ocr: null | any, // "ocr" 表示 other credit result，其他信用结果。
//         mr: null | any, // "mr" 表示 max result，最大结果。
//         ge: number[], // "ge" 表示 game end，游戏结束额外信息。
//       }
//     },
//     err: null | any // "err" 表示错误信息，此处为null，说明没有错误。
//   }
interface SlotMachineSessionInfo {
  wp: Record<string, [number, number]>;
  lw: Record<string, number>;
  lwm: null | number;
  slw: number[];
  nk: Record<string, number>;
  sc: number;
  fs: null | number;
  gwt: number;
  fb: null | any;
  ctw: number;
  pmt: null | any;
  cwc: number;
  fstc: null | any;
  pcwc: number;
  rwsp: Record<string, Record<string, number>>;
  hashr: string;
  ml: number;
  cs: number;
  rl: number[];
  sid: string;
  psid: string;
  st: number;
  nst: number;
  pf: number;
  aw: number;
  wid: number;
  wt: string;
  wk: string;
  wbn: null | any;
  wfg: null | any;
  blb: number;
  blab: number;
  bl: number;
  tb: number;
  tbb: number;
  tw: number;
  np: number;
  ocr: null | any;
  mr: null | any;
  ge: number[];
}

interface SlotMachineData {
  dt: {
    si: SlotMachineSessionInfo;
  };
  err: null | any;
}
const slotMachineData: SlotMachineData = {
  dt: {
    si: {
      wp: {
        "1": [1, 4],
        "8": [1, 5],
        "9": [1, 3],
        "12": [1, 4],
        "13": [1, 4],
        "16": [1, 3],
        "17": [1, 5],
        "24": [1, 3],
        "25": [1, 5],
        "30": [1, 4],
      },
      lw: {
        "1": 3.0,
        "8": 15.0,
        "9": 3.0,
        "12": 3.0,
        "13": 3.0,
        "16": 3.0,
        "17": 15.0,
        "24": 3.0,
        "25": 15.0,
        "30": 3.0,
      },
      lwm: null,
      slw: [66.0],
      nk: {
        "1": 3,
        "8": 4,
        "9": 3,
        "12": 3,
        "13": 3,
        "16": 3,
        "17": 4,
        "24": 3,
        "25": 4,
        "30": 3,
      },
      sc: 1,
      fs: null,
      gwt: 1,
      fb: null,
      ctw: 66.0,
      pmt: null,
      cwc: 1,
      fstc: null,
      pcwc: 1,
      rwsp: {
        "0": {
          "1": 5.0,
          "8": 25.0,
          "9": 5.0,
          "12": 5.0,
          "13": 5.0,
          "16": 5.0,
          "17": 25.0,
          "24": 5.0,
          "25": 25.0,
          "30": 5.0,
        },
      },
      hashr: "0:8;15;2;13;17#1;15;4;17;11#...",
      ml: 2,
      cs: 0.3,
      rl: [8, 1, 15, 15, 15, 6, 2, 4, 17, 13, 17, 5, 17, 11, 7],
      sid: "1773726407957872128",
      psid: "1773726407957872128",
      st: 1,
      nst: 1,
      pf: 4,
      aw: 66.0,
      wid: 0,
      wt: "C",
      wk: "0_C",
      wbn: null,
      wfg: null,
      blb: 100000.0,
      blab: 99982.0,
      bl: 100048.0,
      tb: 18.0,
      tbb: 18.0,
      tw: 66.0,
      np: 48.0,
      ocr: null,
      mr: null,
      ge: [1, 11],
    },
  },
  err: null,
};

interface SpinResponse {
  dt: {
    si: {
      wp: { [key: string]: [number, number] };
      lw: { [key: string]: number };
      lwm: { [key: string]: number };
      slw: [number, number];
      nk: { [key: string]: number };
      sc: number;
      fs: {
        rl: number[];
        wp: { [key: string]: [number, number, number?] };
        lw: { [key: string]: number };
        lwm: { [key: string]: number };
        slw: [number, number];
        nk: { [key: string]: number };
        fsm: number;
        s: number;
        ts: number;
        as: number;
        aw: number;
      };
      gwt: number;
      fb: null;
      ctw: number;
      pmt: null;
      cwc: number;
      fstc: { [key: string]: number };
      pcwc: number;
      rwsp: { [key: string]: { [key: string]: number } };
      hashr: string;
      ml: number;
      cs: number;
      rl: number[];
      sid: string;
      psid: string;
      st: number;
      nst: number;
      pf: number;
      aw: number;
      wid: number;
      wt: string;
      wk: string;
      wbn: null;
      wfg: null;
      blb: number;
      blab: number;
      bl: number;
      tb: number;
      tbb: number;
      tw: number;
      np: number;
      ocr: null;
      mr: null;
      ge: number[];
    };
  };
  err: null;
}

const response: SpinResponse = {
  dt: { // 根对象，包含所有响应数据
    si: { // 会话信息或系统信息
      wp: { // 特定时间点的赢点数或权重
        "14": [0, 5],
        "18": [0, 5],
        "22": [0, 5],
      },
      lw: { // 特定时间点的固定数值
        "14": 7.2,
        "18": 7.2,
        "22": 7.2,
      },
      lwm: { // 特定时间点的月度加权平均
        "14": 57.6,
        "18": 57.6,
        "22": 57.6,
      },
      slw: [21.6, 172.8], // 数值范围，用于统计或累积值
      nk: { // 特定时间点的计数或节点数
        "14": 3,
        "18": 3,
        "22": 3,
      },
      sc: 0, // 得分或状态码
      fs: { // 游戏功能或统计数据的详细信息
        rl: [13, 10, 15, 4, 14, 5, 14, 11, 11, 2, 15, 5, 15, 8, 17], // 随机列表或规则列表
        wp: { // 不同时间点的赢点数或权重
          "4": [0, 4],
          "10": [0, 4],
          "20": [0, 4, 6],
        },
        lw: { // 时间点的固定值
          "4": 3.0,
          "10": 3.0,
          "20": 18.0,
        },
        lwm: { // 时间点的月度加权平均
          "4": 24.0,
          "10": 24.0,
          "20": 144.0,
        },
        slw: [24.0, 192.0], // 数值范围，用于统计或累积值
        nk: { // 时间点的计数或节点数
          "4": 3,
          "10": 3,
          "20": 5,
        },
        fsm: 8, // 特定功能或统计相关的指标
        s: 8,
        ts: 10,
        as: 1,
        aw: 364.80,
      },
      gwt: 3, // 全球等待时间或游戏等待时间
      fb: null,
      ctw: 364.8, // 累计等待时间或工作时间
      pmt: null,
      cwc: 1, // 当前工作计数或赢取计数
      fstc: { "2": 2 }, // 固定状态计数
      pcwc: 0, // 上一个工作计数或赢取计数
      rwsp: { // 角色或响应方式分配的点数或权重
        "0": { "4": 5.0, "10": 5.0, "20": 30.0 },
        "1": { "14": 12.0, "18": 12.0, "22": 12.0 },
      },
      hashr: "2:13;4;14;2;15#10;14;11;15;8#15;5;11;5;17#8;10;17;7;17#13;11;9;5;13#17;7;13;17;5#R#8#0315#MV#0#MT#8#R#8#0315#MV#0#MT#8#R#8#0315#MV#0#MT#8#R#13#0011#MV#0#MT#8#R#13#0011#MV#0#MT#8#R#13#001120#MV#0#MT#8#MG#364.8#", // 哈希字符串，用于验证或记录数据
      ml: 2, // 最大级别
      cs: 0.3, // 改变大小或客户满意度指标
      rl: [8, 13, 17, 10, 11, 7, 17, 9, 13, 7, 5, 17, 17, 13, 5], // 随机列表或规则列表
      sid: "1773953195954863616", // 会话ID
      psid: "1773953124504894976", // 父会话ID
      st: 2, // 状态
      nst: 2, // 新状态
      pf: 4, // 优先级因素
      aw: 364.80, // 累积宽度
      wid: 0, // 工作ID
      wt: "C", // 工作类型
      wk: "0_C", // 工作周
      wbn: null,
      wfg: null,
      blb: 99926.80, // 预算余额
      blab: 99926.80,
      bl: 100291.60, // 余额
      tb: 0.00, // 总额
      tbb: 18.00, // 总额余额
      tw: 364.80, // 总赢
      np: 364.80, // 净赢
      ocr: null,
      mr: null,
      ge: [2, 11], // 游戏引擎版本号
    }
  },
  err: null
};
