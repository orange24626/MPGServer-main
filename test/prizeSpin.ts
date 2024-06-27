/**
 * 测试hashr参数
 * bun run test/prizeSpin.ts
 */

import * as assert from "assert";

const noPrizeHashStringList = [
  {
    freeModeBetAmount: 0,
    wp: null,
    icons: [7, 1, 8, 4, 4, 4, 6, 7, 7, 0, 7, 9, 7, 7, 7],
    totalBet: 18,
    winAmount: 0,
    hashString: "0:7;4;6;0;7#1;4;7;7;7#8;4;7;9;7#MV#18.0#MT#1#MG#0#",
  },
  {
    freeModeBetAmount: 0,
    icons: [9, 8, 6, 1, 7, 4, 1, 3, 7, 4, 8, 0, 8, 7, 9],
    totalBet: 18,
    wp: null,
    winAmount: 0,
    hashString: "0:9;1;1;4;8#8;7;3;8;7#6;4;7;0;9#MV#18.0#MT#1#MG#0#",
  },
  {
    freeModeBetAmount: 0,
    wp: null,
    icons: [9, 5, 6, 2, 3, 3, 4, 4, 4, 6, 0, 6, 8, 8, 8],
    totalBet: 18,
    winAmount: 0,
    hashString: "0:9;2;4;6;8#5;3;4;0;8#6;3;4;6;8#MV#18.0#MT#1#MG#0#",
  },
  {
    freeModeBetAmount: 0,
    wp: null,
    icons: [7, 8, 8, 6, 5, 8, 7, 9, 8, 7, 8, 5, 8, 9, 9],
    totalBet: 18,
    winAmount: 0,
    hashString: "0:9;2;4;6;8#5;3;4;0;8#6;3;4;6;8#MV#18.0#MT#1#MG#0#",
  },
];

const prizeHashStringList = [
  {
    // 需要从icons推导出wp,wp就是winPositions，也就是关键getWinPosition
    freeModeBetAmount: 0,
    icons: [8, 1, 7, 7, 9, 8, 8, 7, 5, 5, 5, 5, 7, 7, 7],

    /// J Q K A 金沙碗 三色花篮 油灯 姑娘 夺宝 百搭
    //  9 8 7 6   5      4     3   2    1   0

    // 8 7 8 5 7
    // 1 9 7 5 7
    // 7 8 5 5 7
    totalBet: 18,
    winAmount: 7.8,
    wp: { 7: [2, 3, 7], 8: [0, 5, 6] },
    // 2 - 0 2
    // 3 - 1 0
    // 7 - 2 1
    // 0 - 0 0
    // 5 - 1 2
    // 6 - 2 0
    // #R#7#021021#MV#18.0#MT#1#R#8#001220
    hashString: "0:8;7;8;5;7#1;9;7;5;7#7;8;5;5;7#R#7#021021#MV#18.0#MT#1#R#8#001220#MV#18.0#MT#1#MG#7.8#",
  },
  {
    // 需要从icons推导出wp,wp就是winPositions，也就是关键getWinPosition
    freeModeBetAmount: 0,
    icons: [7, 8, 8, 6, 5, 8, 7, 9, 8, 7, 8, 5, 8, 9, 9],

    /// J Q K A 金沙碗 三色花篮 油灯 姑娘 夺宝 百搭
    //  9 8 7 6   5      4     3   2    1   0

    // 8 7 8 5 7
    // 1 9 7 5 7
    // 7 8 5 5 7
    totalBet: 18,
    winAmount: 18,
    wp: { 8: [1, 2, 5, 8, 10, 12] },

    // #R#7#021021#MV#18.0#MT#1#R#8#001220
    hashString: "0:7;6;7;7;8#8;5;9;8;9#8;8;8;5;9#R#8#010212223140#MV#18.0#MT#1#MG#18.0#",
  },

  {
    freeModeBetAmount: 0,
    wp: { 8: [2, 4, 6] },
    icons: [7, 3, 8, 9, 8, 2, 8, 9, 9, 2, 2, 1, 8, 2, 5],
    totalBet: 0.9,
    winAmount: 0.15,
    hashString: "0:7;9;8;2;8#3;8;9;2;2#8;2;9;1;5#R#8#021120#MV#0.9#MT#1#MG#0#",
  },
  {
    freeModeBetAmount: 0,
    wp: { 5: [0, 3, 6, 10] },
    icons: [5, 4, 3, 5, 1, 1, 5, 7, 6, 7, 0, 1, 2, 4, 1],
    totalBet: 0.9,
    winAmount: 0,
    hashString: "0:5;5;5;7;2#4;1;7;0;4#3;1;6;1;1#R#5#00102031#MV#0.9#MT#1#MG#0#",
  },
];

// 有一个一维矩阵，有15个数字，着15个数字的取值是从0到9，转换成二维3行5列矩阵的顺序是从上到下，从左到右，
// 中奖的规则是：
// 1. 第一行和第5行不能出现0
// 2. 0可以替换成1到9中任意数字，
// 3.连续的三行或者连续的4行或者连续的5行，
// 4.第1行出现的数字n,必须出现在第第2行，第3行中，也可以出现第4行或者第5行，
// 但是如果1，2，3，5行出现了，只能把1，2，3行的中奖位置记录，因为第4行没有
// 不是连续行

//

prizeHashStringList.forEach((item) => {
  const matrix = convertTo2DArray(item.icons);

  console.log("matrix", matrix);
  const recordObj = recordNumbers(matrix);
  console.log("recordObj", recordObj);

  let winPosition = checkWinningNumbers(recordObj.winningNumbers);
  // console.log("mergeSame", { winPosition, rst: recordObj.rst });
  winPosition = mergeSame({ winPosition, rst: recordObj.rst });
  console.log("winPosition", winPosition);
  console.log("wp", item.wp);

  assert.deepStrictEqual(winPosition, item.wp, "Objects are not equal");
});

function convertTo2DArray(array: number[]): number[][] {
  if (array.length !== 15) {
    throw new Error("Input array must have a length of 15.");
  }

  const result: number[][] = [];
  for (let i = 0; i < 5; i++) {
    result.push(array.slice(i * 3, i * 3 + 3));
  }

  return result;
}

function recordNumbers(matrix: number[][]): {
  winningNumbers: Record<number, number[]>;
  rst: Record<number, number>;
} {
  const winningNumbers: Record<number, number[]> = {};
  // 第一行的数字 8 ,1 ,7
  const [first, second, third] = [matrix[0][0], matrix[0][1], matrix[0][2]];

  winningNumbers[0] = [0];
  winningNumbers[1] = [1];
  winningNumbers[2] = [2];
  const rst = {
    0: first,
    1: second,
    2: third,
  };
  // 第一行每个数字 上一个列的位置作为连续列判定
  //
  // let rowFirst = 0;
  // let rowSecond = 0;
  // let rowThird = 0;
  // 第一行每个数字 上一个列的位置作为连续列判定
  for (let row = 1; row < matrix.length; row++) {
    for (let col = 0; col < 3; col++) {
      // 第2行第1，2，3列和 first,second,third比较
      const rowColumn = matrix[row][col];
      console.log("rowColumn", rowColumn);
      if (rowColumn == first || rowColumn === 0) {
        winningNumbers[0].push(3 * row + col);
      }
      if (rowColumn == second || rowColumn === 0) {
        winningNumbers[1].push(3 * row + col);
      }
      if (rowColumn == third || rowColumn === 0) {
        winningNumbers[2].push(3 * row + col);
      }
    }
  }
  return { winningNumbers, rst };
}

function checkWinningNumbers(origin: Record<string, number[]>) {
  const keys = Object.keys(origin);
  const winningNumbers: Record<string, number[]> = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (origin[key].length >= 3) {
      const continuousRst = continuousColumn(origin[key]);
      if (continuousRst.flag) {
        console.log("origin[key]", origin[key]);
        console.log("continuousRst", continuousRst);
        winningNumbers[key] = origin[key].slice(0, continuousRst.index + 1);
      }
    }
  }
  return winningNumbers;
}

function calcWinningMagnification(winningNumbers: Record<string, number[]>) {
  return Object.keys(winningNumbers).reduce((obj: Record<string, number>, item) => {
    obj[item] = calcOneNumberWinningMagnification(winningNumbers[item]);
    return obj;
  }, {});
}

function calcOneNumberWinningMagnification(numbers: number[]) {
  const fiveLineWays: number[][] = [];
  let index = 0;
  let tempArr = [];
  for (let i = 0; i < numbers.length; i++) {
    const item = numbers[i];
    if (item >= (index + 2) * 3) {
      console.error(`\n\nwrong winning numbers!!!, numbers: ${numbers}\n\n`);
      return 0;
    }
    if (item >= (index + 1) * 3) {
      index += 1;
      fiveLineWays.push(tempArr);
      tempArr = [];
    }
    tempArr.push(item);
  }
  fiveLineWays.push(tempArr);
  console.log("fiveLineWays", fiveLineWays); // todos remove console
  return fiveLineWays.reduce((multiply, item) => {
    if (item.length !== 0) {
      multiply *= item.length;
    }
    return multiply;
  }, 1);
}

// Check for consecutive rows
// 0 6  9
// 012  345
function continuousColumn(nums: number[]) {
  let flag = true,
    index = -1;
  for (let i = 0; i < nums.length - 1; i++) {
    const nextRow = Math.trunc(nums[i + 1] / 3),
      nextColumn = nums[i + 1] % 3;
    const currentRow = Math.trunc(nums[i] / 3),
      currenColumn = nums[i] % 3;
    console.log("nums", nums);
    console.log("nums[i +1] nextRow,", nums[i + 1], nextRow);
    console.log("nums[i] currentRow,", nums[i], currentRow);
    console.log("i", i);
    console.log("nums[i] ", nums[i]);
    // 不是当前行，也不是相邻行
    if (currentRow !== nextRow && nextRow - currentRow !== 1) {
      if (currentRow >= 2) {
        console.log("i", i);
        flag = true;
        index = i;
        break;
      } else {
        flag = false;
        index = -1;
        break;
      }
    } else {
      console.log("i", i);
      flag = true;
      index = i + 1;
    }
  }
  return { flag, index };
}

function groupByValue(obj: Record<string, number>): Record<number, string[]> {
  const grouped: Record<number, string[]> = {};
  for (let key in obj) {
    const value = obj[key];
    if (grouped[value]) {
      grouped[value].push(key);
    } else {
      grouped[value] = [key];
    }
  }

  return grouped;
}

function mergeSame(data: { winPosition: Record<string, number[]>; rst: any }) {
  //
  let merge: Record<any, any[]> = {};
  const d1 = groupByValue(data.rst);
  const pKeys = Object.keys(data.winPosition);
  Object.keys(d1).forEach((k) => {
    merge[k] = [];
    // @ts-ignore
    const value = d1[k];
    value.forEach((d: string | number) => {
      // @ts-ignore
      if (pKeys.includes(d + "")) {
        merge[k].push(...data.winPosition[d]);
      }
    });
  });
  let distinct = {};
  Object.keys(merge).forEach((item) => {
    if (merge[item].length > 0) {
      // @ts-ignore
      distinct[item] = [...new Set(merge[item])];
      // @ts-ignore
      distinct[item] = distinct[item].sort((a, b) => a - b);
    }
  });
  return distinct;

  // 0 -q 8
  // 1 -q 8
  // 2 -k 8

  // {8: ["0",1]}
}

function hashStr(data: { freeModeBetAmount: any; icons: any[]; totalBet: number; winAmount: number; wp: any }) {
  const freeModeBetAmount = data.freeModeBetAmount;
  const icons = data.icons;
  const totalBet = data.totalBet;
  const winAmount = data.winAmount;
  let hashStr = `${freeModeBetAmount || 0}:${icons[0]};${icons[3]};${icons[6]};${icons[9]};${icons[12]}#${icons[1]};${icons[4]};${icons[7]};${icons[10]};${icons[13]}#${icons[2]};${icons[5]};${icons[8]};${icons[11]};${icons[14]}`;
  const betInfoStr = `#MV#${totalBet.toFixed(1)}#MT#1#MG#${winAmount.toFixed(1)}#`;
  hashStr = `${hashStr}${betInfoStr}`;
  return hashStr;
}

// noPrizeHashStringList.forEach((item) => {
//   const hashString = hashStr(item);
//   console.log(hashString === item.hashString);
//   console.log(item.hashString, "expect");
//   console.log(hashString, "simulate");
// });

// 游戏规则如下：
// 5列轴3行的矩阵，矩阵由符号表中的左侧符号组成
// ■ 游戏共有243个中奖路(固定)并规定了30条基础投 注,1到10的投注倍数和0.03到0.90的投注大小。
// ■ 投注大小可以在“投注大小”选项中设定。
// ■ 投注倍数可以在“投注倍数”选项中设定。
// ■ 投注总额可以在“投注总额”选项中设定。
// ■“现金钱包”用来显示下注者可用的现金余额。
// ■“自动旋转”可以根据玩家所选择的回合数量自动进行游 戏。
// ■ 中奖组合和奖金派发是根据“赔付表”进行的。
// ■ 一条中奖路所得的奖励等同于显示在“赔付表”上的符号赔 付值乘以投注大小和投注倍数。
// ■ 中奖路奖金按照从最左至右卷轴的顺序派发。
// ■ 中奖路的奖金计算方式是按照从卷轴的最左边到最右边, 每个赢奖符号相邻的数目乘以该符号的中奖路数目。
// ■ 获胜符号的赔付是由该符号的赔付值乘以中奖路的数目所 得。
// ■ 不同中奖路上的奖金会被叠加
// ■ 所有赢奖以现金显示。
// ■ 百搭符号可替代除夺宝符号外的所有符号。 Π
// ■ 百搭符号只出现在第2,第3和第4列卷轴上。
// ■ 免费旋转模式中投注大小和投注倍数和触发免费旋转模式 时的参数保持一致。
// 免费旋转模式
// ■ 当3、4或5个夺宝符号出现在卷轴的任意位置时,将触发 免费旋转模式并分别获得12、15或20次免费旋转。
// ■ 免费旋转模式开始时,所有所赢奖金将乘以2。
// ■ 任何出现在卷轴上的百搭符号将被收集。
// ■ 如果已收集3个百搭符号,倍数值将增加2,所收集的百搭 符号也将被重置为零。
// ■ 可实现的最大倍数值为x20。
// ■ 夺宝符号不会在色弗旋转塔式市出现
// ■ 百搭符号可以替换除夺宝符号以外的任意符号
// ■ 百搭符号只能出现在第2，3，4列卷轴上
// ■ 当3，4或5个夺宝奇符号出现在卷轴任意位置上，将触发免费模式并分别获得12，15或20次免费旋转
// ■ 免费旋转模式开始时，所有奖金将乘以2
// ■ 任何出现在卷轴的百搭符号将被收集
// ■ 如果已经收集3个百搭符号，倍数值将增加2，所收集的百搭符号也将被重制为0
// ■ 可以实现的最大倍数值为20
// ■ 中奖路奖金按照从最左至右卷轴的顺序派发
// ■ 中奖路的奖金计算方式是按照从卷轴的最左边到最右边, 每个赢奖符号相邻的数目乘以该符号的中奖路数目。
// ■ 获胜符号的赔付是由该符号的赔付值乘以中奖路的数目所得。
//
// 符号对应列表
// J  9
// Q  8
// K  7
// A  6
// 金沙碗 5
// 三色花篮 4
// 油灯  3
// 姑娘  2
// 夺宝  1
// 百搭  0

// 每个符号的赔付值以及中奖路的设置如下
// 姑娘 5路 150
// 姑娘 4路 60
// 姑娘 3路 30
// 油灯 5路 90
// 油灯 4路 45
// 油灯 3路 20
// 三色花篮 5路 60
// 三色花篮 4路 30
// 三色花篮 3路 15
// 金沙碗 5路 45
// 金沙碗 4路 15
// 金沙碗 3路 10
// A 5路 30
// A 4路 10
// A 3路 8
// K 5路 30
// K 4路 10
// K 3路 8
// Q 5路 15
// Q 4路 8
// Q 3路 5
// J 5路 15
// J 4路 8
// J 3路 5

const flipMatrix = (array2D: number[][]) => {
  const newArray = new Array(array2D[0].length).fill([]);
  for (let i = 0; i < array2D[0].length; i++) {
    newArray[i] = new Array(array2D.length).fill(0);
    for (let j = 0; j < array2D.length; j++) {
      newArray[i][j] = array2D[j][i];
    }
  }
  return newArray;
};

const console2DArray = (array2D: number[][]) => {
  for (let i = 0; i < array2D.length; i++) {
    console.log(array2D[i]);
  }
};
