const rows = 5;
const clumns = 5;
const oddsTable = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //百搭
  [
    0, 0, 0, 30, 40, 70, 100, 200, 300, 500, 500, 500, 1000, 1000, 2000, 2000, 2000, 5000, 5000, 5000, 10000, 10000,
    10000, 10000, 20000,
  ], //红眼
  [
    0, 0, 0, 20, 30, 50, 80, 100, 200, 300, 300, 300, 600, 600, 800, 800, 800, 1000, 1000, 1000, 2000, 2000, 2000, 2000,
    5000,
  ], //红龙
  [
    0, 0, 0, 15, 20, 40, 70, 80, 100, 200, 200, 200, 400, 400, 500, 500, 500, 800, 800, 800, 1000, 1000, 1000, 1000,
    1000,
  ], //蓝龙
  [0, 0, 0, 10, 15, 30, 60, 70, 80, 100, 100, 100, 300, 300, 400, 400, 400, 600, 600, 600, 800, 800, 800, 800, 800], //绿龙
  [0, 0, 0, 5, 10, 15, 20, 30, 40, 50, 50, 50, 60, 60, 100, 100, 100, 500, 500, 500, 600, 600, 600, 600, 600], //黑桃
  [0, 0, 0, 4, 6, 9, 15, 20, 30, 40, 40, 40, 50, 50, 80, 80, 80, 300, 300, 300, 400, 400, 400, 400, 500], //红心
  [0, 0, 0, 3, 5, 6, 10, 15, 20, 30, 30, 30, 40, 40, 60, 60, 60, 200, 200, 200, 300, 300, 300, 300, 400], //梅花
  [0, 0, 0, 2, 3, 4, 6, 8, 10, 15, 15, 15, 20, 20, 40, 40, 40, 100, 100, 100, 200, 200, 200, 200, 300], //方片
];

//根据wp结果获取每一路的中奖个数
GetWinSc = (wp) => {
  let sc = {};
  for (let key in wp) {
    if (Array.isArray(wp[key])) {
      const arr = wp[key];
      sc[key + ""] = arr.length;
    }
  }
  return sc;
};
GetRwsp = (wp, sc) => {
  let rwsp = {};
  console.log("wp的值", wp);
  for (let key in wp) {
    let num = sc[key] ? sc[key] : 1;
    const arr = wp[key];
    console.log("wp的 下标" + key, arr);

    const element = arr.s;
    console.log("索引: " + key + ", 元素: " + element);

    rwsp[key + ""] = oddsTable[element][num];
  }
  console.log("rwsp", rwsp);
  return rwsp;
};
/**
 * 土龙模式 收集了10个赢奖符号 删除所有低倍符号
 */
EarthDargonData = (arr) => {
  let copiedArray = arr.slice();
  for (let i = 0; i < copiedArray.length; i++) {}
};

/**
 * 水龙模式 收集了30个  添加4个百搭 1,1  3,1 1,3  3,3
 */
WaterDargonData = (arr) => {
  let copiedArray = arr.slice();
};

/**
 * 火龙模式 收集了50个赢奖符号  --- 不知道什么情况
 */
FireDargonData = (arr) => {
  let copiedArray = arr.slice();
};

/**
 * 巨龙模式 收集了70个  低倍符号 随机变高倍或百搭
 */
GiantDragon = (arr) => {
  let copiedArray = arr.slice();
};

/**
 * 根据索引生成元素，再给用户
 */
GetNewAnswer = (arr, wp) => {
  wp = { 1: [3, 4, 2, 1], 2: [7, 2, 1, 8, 13] };
  console.log("arrdis,-----", arr);
  console.log("wpppp,-----", wp);
  let copiedArray = arr.slice();
  const result = Object.values(wp).reduce((array, subArray) => array.concat(subArray), []);
  const newresult = result.filter((value, index, self) => {
    //去除重复
    return self.indexOf(value) === index;
  });
  console.log("要消失的索引", newresult);
  let rns = new Array(rows);
  for (let i = 0; i < rns.length; i++) {
    rns[i] = [];
  }
  for (let i = 0; i < newresult.length; i++) {
    let newele = Math.floor(Math.random() * 9);
    copiedArray[newresult[i]] = -1; //先把这个元素变为-1
    const clumnsidx = Math.floor(newresult[i] / clumns);
    rns["" + clumnsidx].push(newele);
  }
  copiedArray = convertTo2DArray(copiedArray);
  let filteredArray = copiedArray.map((subArray) => subArray.filter((num) => num !== -1));
  for (let i = 0; i < rns.length; i++) {
    filteredArray[i] = rns[i].concat(filteredArray[i]); //拼接成新数组
  }
  console.log("最后结果", filteredArray);
  console.log("每列的值", rns);

  return { newarray: convertTo1DArray(filteredArray), rns: rns };
};

/**
 * 根据一维数组查询可以消除元素
 * @param arr
 */
GetAnwser = (arr) => {
  const answer = SearchAnswer(convertTo2DArray(arr));
  let result = [];
  for (let i = 0; i < answer.length; i++) {
    for (let j = 0; j < answer[i].length; j++) {
      result.push(convertTo1DIndex(answer[i][j].x, answer[i][j].y));
    }
  }
  let wp = [];
  if (answer) {
    for (let i = 0; i < answer.length; i++) {
      wp["" + (i + 1)] = [];
      for (let j = 0; j < answer[i].length; j++) {
        wp["" + (i + 1)].push(convertTo1DIndex(answer[i][j].x, answer[i][j].y));
      }
    }
  }
  let sw = GetWinSw(arr, wp, 1, 1);
  let sc = GetWinSc(wp);
  let rwsp = GetRwsp(sw, sc);
  console.log("索引转换后", wp);
  console.log("准备生成新的", arr);
  GetNewAnswer(arr, wp);
  return wp;
};

//根据wp结果获取每一路的中奖符号
GetWinSw = (arr, wp, ml, cs) => {
  let sw = {};
  console.log("arrrrrrrr", arr);
  for (let key in wp) {
    if (Array.isArray(wp[key])) {
      const itemarr = wp[key];
      for (let index = 0; index < itemarr.length; index++) {
        const element = itemarr[index];
        if (arr[element] != 0) {
          sw[key + ""] = {};
          sw[key + ""]["s"] = arr[element];
          sw[key + ""]["wa"] = oddsTable[arr[element]][arr.length - 1] * ml * cs;
          break;
        }
      }
    }
  }
  //   console.log("")
  return sw;
};
/**
 * 计算最优解
 * @param {*} data 二维数组
 */
SearchAnswer = (data) => {
  let p = { x: -1, y: -1 };
  let answer = [];
  var remove = [];

  remove = new Array(rows);

  for (let q = 0; q < data.length; q++) {
    remove[q] = new Array(clumns);
    for (let w = 0; w < data[q].length; w++) {
      remove[q][w] = data[q][w];
    }
  }
  for (let i = 0; i < remove.length; i++) {
    for (let j = 0; j < remove[i].length; j++) {
      if (remove[i][j] == -1) {
        // -1 代表该元素已经判断过了
        continue;
      }
      if (remove[i][j] == 0) {
        // 0 代表该元素是百搭
        continue;
      }
      p.x = i;
      p.y = j;

      let list = SearchRemoveList(remove, p);
      // if (list.length >= 4) {
      //     answer.push(list);
      // }
      if (list.length >= 4) {
        //这个是获取最优的一个解
        let result = [];
        result.length = list.length;
        for (let k = 0; k < list.length; k++) {
          let an = { x: -1, y: -1 };
          an.x = list[k].x;
          an.y = list[k].y;
          result[k] = an;
        }
        console.log("添加", result);
        answer.push(result);
      }
      for (let k = 0; k < list.length; k++) {
        if (remove[list[k].x][list[k].y] == 0) {
          continue;
        }
        remove[list[k].x][list[k].y] = -1;
      }
    }
  }

  console.log("answer", answer);
  return answer;
};
//查找相同
SearchRemoveList = (data, p) => {
  let list = [];
  let tempList = [];
  tempList.push(p);
  let tag = data[p.x][p.y];
  do {
    let any = tempList.pop();
    if (!any) {
      console.log("逻辑异常");
      break;
    }
    //左
    if ((any.y - 1 >= 0 && tag == data[any.x][any.y - 1]) || (any.y - 1 >= 0 && data[any.x][any.y - 1] == 0)) {
      let tp = { x: any.x, y: any.y - 1 };
      if (!indexOfV2(list, tp) && !indexOfV2(tempList, tp)) {
        tempList.push(tp);
      }
    }
    //右
    if ((any.y + 1 < clumns && tag == data[any.x][any.y + 1]) || (any.y + 1 < clumns && 0 == data[any.x][any.y + 1])) {
      let tp = { x: any.x, y: any.y + 1 };
      if (!indexOfV2(list, tp) && !indexOfV2(tempList, tp)) {
        tempList.push(tp);
      }
    }
    //下
    if ((any.x - 1 >= 0 && tag == data[any.x - 1][any.y]) || (any.x - 1 >= 0 && 0 == data[any.x - 1][any.y])) {
      let tp = { x: any.x - 1, y: any.y };
      if (!indexOfV2(list, tp) && !indexOfV2(tempList, tp)) {
        tempList.push(tp);
      }
    }
    //上
    if ((any.x + 1 < rows && tag == data[any.x + 1][any.y]) || (any.x + 1 < rows && 0 == data[any.x + 1][any.y])) {
      let tp = { x: any.x + 1, y: any.y };
      if (!indexOfV2(list, tp) && !indexOfV2(tempList, tp)) {
        tempList.push(tp);
      }
    }
    list.push(any);
  } while (tempList.length > 0);
  return list;
};

//是否已经在数组中(防止重复)
indexOfV2 = (array, p) => {
  return array.some(function (elem, index, arr) {
    return elem.x == p.x && elem.y == p.y;
  });
};
convertTo2DArray = (arr) => {
  console.log("aInput arrayrr", arr);
  if (arr.length !== clumns * rows) {
    throw new Error("Input array length is corrent.");
  }
  const result = [];
  const length = arr.length;

  for (let i = 0; i < length; i += rows) {
    const row = arr.slice(i, i + rows);
    result.push(row);
  }
  console.log("转二维数组", result);

  return result;
};
// 反转换为一维数组
convertTo1DArray = (arr) => {
  return arr.flat();
};
/**
 * 一维数组索引转二维
 * @param index
 * @returns
 */
convertTo2DIndex = (index) => {
  const row = Math.floor(index / rows);
  const col = index % clumns;
  return [row, col];
};
/**
 * 二维数组索引转一维
 * @param row
 * @param col
 * @returns
 */
convertTo1DIndex = (row, col) => {
  if (row < 0 || row >= rows || col < 0 || col >= clumns) {
    throw new Error("Invalid row or column index.");
  }
  return row * clumns + col;
};

const data = [2, 4, 1, 6, 1, 7, 0, 4, 0, 1, 1, 8, 0, 2, 8, 8, 1, 4, 1, 3, 4, 6, 0, 5, 0];
const data2 = [4, 0, 7, 4, 4, 2, 2, 8, 1, 8, 4, 2, 5, 7, 7, 6, 0, 5, 7, 3, 7, 5, 2, 4, 7];
const data3 = [6, 4, 4, 4, 5, 4, 2, 8, 2, 2, 4, 4, 7, 7, 4, 6, 3, 4, 6, 2, 7, 2, 6, 2, 2];
//  GetNewAnswer(null,null)
console.log(GetAnwser(data3));

// GetAnwser(data3)

// const obj = {
//     "1": [ 5, 10, 15, 11 ],
//     "2": [ 16, 21, 11, 10 ],
//   }

//   console.log(Object.values(obj).length)

const MD5 = require("crypto-js/md5");
function createSign(input, secret) {
  const inputOrdered = Object.keys(input).sort();
  let sign = "";
  for (let key of inputOrdered) {
    sign += `${key}=${input[key]}&`;
  }
  sign += `key=${secret}`;
  sign = MD5(sign).toString();
  return sign;
}
console.log(
  createSign(
    {
      gameID: "57",
      accessKey: "HkFPivzCZIdq7cOVJ4h7m",
      token: "QiqpsPbHNQSZuxMQ7EwLm",
      lang: "zh",
    },
    "5o8QzrpuZO3p6PkmkEyLb",
  ),
);
