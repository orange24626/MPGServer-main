
// https://api.pgsoft-games.com/web-api/auth/session/v2/verifySession?traceId=AKXCOV29 返回数据
// {
//     "dt": {
//       "oj": {
//         "jid": 1 // "oj"对象中的"jid"可能表示一个会话或作业的ID。
//       },
//       "pid": "0", // "pid"可能表示玩家ID。
//       "pcd": "", // "pcd"可能为空，表示玩家的某种代码或标识符。
//       "tk": "F1C95ECC-0A61-4CDE-BCE6-4461ADA26B86", // "tk"是会话令牌或认证令牌。
//       "st": 1, // "st"状态码，1可能表示会话有效或其他状态。
//       "geu": "https://api.pg-demo.com/game-api/double-fortune/", // "geu"游戏端点URL，用于获取游戏相关信息。
//       "lau": "https://api.pg-demo.com/game-api/lobby/", // "lau"大厅端点URL，可能是游戏大厅或开始页面。
//       "bau": "https://api.pg-demo.com/web-api/game-proxy/", // "bau"基础API URL，可能用于游戏代理服务。
//       "cc": "PGC", // "cc"货币代码，"PGC"可能是游戏内的货币单位。
//       "cs": "", // "cs"可能表示客户端设置或状态的字符串。
//       "nkn": "", // "nkn"可能表示昵称或玩家名。
//       "gm": [ // "gm"游戏数组，包含游戏相关的信息和状态。
//         {
//           "gid": 48, // 游戏ID。
//           "msdt": 1552963318000, // 游戏开始日期时间戳。
//           "medt": 1552963318000, // 游戏结束日期时间戳。
//           "st": 1, // 游戏状态。
//           "amsg": "" // 附加消息，可能是给玩家的提示或说明。
//         }
//       ],
//       "uiogc": { // "uiogc"可能表示用户界面或游戏客户端的配置选项。
//         "bb": 1,
//         "grtp": 0,
//         // 以下为各种配置参数，可能控制游戏的不同方面，如音效、图像质量、用户界面选项等。
//         "gec": 1,
//         // 更多配置...
//         "hn": 1 // "hn"可能表示某个特定的配置或功能是否启用。
//       },
//       "ec": [], // "ec"可能是错误代码数组，此处为空表示无错误。
//       "occ": { // "occ"可能表示游戏或会话的覆盖配置。
//         "rurl": "", // 重定向URL，游戏结束或退出时可能使用。
//         "tcm": "You are playing Demo.", // 提示客户消息，可能在玩家处于演示模式时显示。
//         "tsc": 1000000, // 提示分数计数，可能是演示模式的初始积分或余额。
//         "ttp": 43200, // 提示时间周期，可能是演示模式的时间限制。
//         "tlb": "Continue", // 提示左按钮文本。
//         "trb": "Quit" // 提示右按钮文本。
//       },
//       "gcv": "2.2.1.0", // "gcv"游戏客户端版本。
//       "ioph": "78332ce56475" // "ioph"可能是内部操作句柄或标识符。
//     },
//     "err": null // 错误字段，null表示无错误。
//   }
  