import { number } from "zod";

export enum DRAGONTHICON {
    BAIDA = 0,
    YANJING = 1,
    REDLONG = 2,
    BLUELONG = 3,
    GREELONG = 4,
    HEITAO = 5,
    HONGXIN = 6,
    MEIHUA = 7,
    FANGPIAN = 8,
}





export default class DragonTHLogic {

    private static clumns: number = 5;//列
    private static rows: number = 5;//行

    
    public static oddsTable = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],//百搭
        [0,0,0,30,40,70,100,200,300,500,500,500,1000,1000,2000,2000,2000,5000,5000,5000,10000,10000,10000,10000,20000],//红眼
        [0,0,0,20,30,50,80,100,200,300,300,300,600,600,800,800,800,1000,1000,1000,2000,2000,2000,2000,5000],//红龙
        [0,0,0,15,20,40,70,80,100,200,200,200,400,400,500,500,500,800,800,800,1000,1000,1000,1000,1000],//蓝龙
        [0,0,0,10,15,30,60,70,80,100,100,100,300,300,400,400,400,600,600,600,800,800,800,800,800],//绿龙
        [0,0,0,5,10,15,20,30,40,50,50,50,60,60,100,100,100,500,500,500,600,600,600,600,600],//黑桃
        [0,0,0,4,6,9,15,20,30,40,40,40,50,50,80,80,80,300,300,300,400,400,400,400,500],//红心
        [0,0,0,3,5,6,10,15,20,30,30,30,40,40,60,60,60,200,200,200,300,300,300,300,400],//梅花
        [0,0,0,2,3,4,6,8,10,15,15,15,20,20,40,40,40,100,100,100,200,200,200,200,300],//方片
    ]

    /**
     *               t[t.LAUNCH = 0] = "LAUNCH",
                t[t.NORMAL = 1] = "NORMAL",
                t[t.FREESPIN_TRANSITION = 2] = "FREESPIN_TRANSITION",
                t[t.FREESPIN = 3] = "FREESPIN",
                t[t.NORMAL_TRANSITION = 4] = "NORMAL_TRANSITION",
     */
/**
 * 土龙模式 收集了10个赢奖符号 删除所有低倍符号
 */
public static EarthDargonData(arr:any){
    let copiedArray = arr.slice();
    let p = [];
    for(let i = 0;i<copiedArray.length;i++){
        if(copiedArray[i]>=DRAGONTHICON.HEITAO){
            p.push(i);
            copiedArray[i] = -1;
        }
    }

    return {copiedArray,p};
}

/**
 * 水龙模式 收集了30个  添加4个百搭 1,1  3,1 1,3  3,3
 */
public static WaterDargonData(arr:number[]){
    let copiedArray = arr.slice();
    const index1 = DragonTHLogic.convertTo1DIndex(1,1)
    const index2 = DragonTHLogic.convertTo1DIndex(3,1)
    const index3 = DragonTHLogic.convertTo1DIndex(1,3)
    const index4 = DragonTHLogic.convertTo1DIndex(3,3)
    copiedArray[index1] = -1;
    copiedArray[index2] = -1;
    copiedArray[index3] = -1;
    copiedArray[index4] = -1;
}

/**
* 火龙模式 收集了50个赢奖符号 棋盘格纹添加到卷轴中
*/
public static FireDargonData(arr:number[]){
    let copiedArray = arr.slice();
}

/**
 * 巨龙模式 收集了70个  低倍符号 随机变高倍或百搭
 */
public static GiantDragon(arr:number[]){
    let mdf = [{
        tp:[],
        os:5,
        ns:Math.floor(Math.random()*4+1)
    },{
        tp:[],
        os:6,
        ns:Math.floor(Math.random()*4+1)
    },{
        tp:[],
        os:7,
        ns:Math.floor(Math.random()*4+1)
    },{
        tp:[],
        os:8,
        ns:Math.floor(Math.random()*4+1)
    }];
    let copiedArray = arr.slice();
    for(let i = 0;i<copiedArray.length;i++){
        switch(copiedArray[i]){
            case 5:mdf[0].tp.push(i); copiedArray[i] = mdf[0].ns;break;
            case 6:mdf[1].tp.push(i); copiedArray[i] = mdf[1].ns;break;
            case 7:mdf[2].tp.push(i); copiedArray[i] = mdf[2].ns;break;
            case 8:mdf[3].tp.push(i); copiedArray[i] = mdf[3].ns;break;
        }
        
    }

    return{newarray:copiedArray,mdf:mdf}

}



    /* 根据索引生成元素，再给用户
       */
    public static GetNewAnswer = (arr: number[],wp:{}) => {
        console.log("arrdis,-----",arr);
        console.log("wpppp,-----",wp);
        if(!wp){
            let copiedArray = arr.slice();

            let rns = new Array(DragonTHLogic.rows);
            for (let i = 0; i < rns.length; i++) {
                rns[i] = [];
            }
            for (let i = 0; i < copiedArray.length; i++) {
                if(copiedArray[i] == -1){
                    let newele =  Math.floor(Math.random() * 9);
                    const clumnsidx = Math.floor(i / DragonTHLogic.clumns);
                    rns["" + clumnsidx].push(newele);
                }

      
            }
            let copiedArray2d = DragonTHLogic.convertTo2DArray(copiedArray);
            let filteredArray = copiedArray2d.map(subArray => subArray.filter(num => num !== -1));
            for(let i = 0;i<rns.length;i++){
                filteredArray[i] =  rns[i].concat(filteredArray[i]);//拼接成新数组
              }
            return {newarray:DragonTHLogic.convertTo1DArray(filteredArray),rns:rns}
        }
        let copiedArray = arr.slice();
        const result = Object.values(wp).reduce((array:any[], subArray) => array.concat(subArray), []);
        const newresult = result.filter((value, index, self) => { //去除重复
            return self.indexOf(value) === index;
          });
        console.log("要消失的索引", newresult);
        let rns = new Array(DragonTHLogic.rows);
        for (let i = 0; i < rns.length; i++) {
            rns[i] = [];
        }
        for (let i = 0; i < newresult.length; i++) {
            let newele =  Math.floor(Math.random() * 9);
            copiedArray[newresult[i]] = -1;//先把这个元素变为-1
            const clumnsidx = Math.floor(newresult[i] / DragonTHLogic.clumns);
            rns["" + clumnsidx].push(newele);
  
        }
        let copiedArray2d = DragonTHLogic.convertTo2DArray(copiedArray);
        let filteredArray = copiedArray2d.map(subArray => subArray.filter(num => num !== -1));
        for(let i = 0;i<rns.length;i++){
          filteredArray[i] =  rns[i].concat(filteredArray[i]);//拼接成新数组
        }
        console.log("最后结果", DragonTHLogic.convertTo1DArray(filteredArray));
        console.log("每列的值", rns);
  
        return {newarray:DragonTHLogic.convertTo1DArray(filteredArray),rns:rns}
    }

    //根据wp结果获取每一路的中奖符号
    public static GetWinSw(arr:number[],wp:any,ml:number,cs:number){
    
        let sw = {}
        for (let key in wp) {
            if (Array.isArray(wp[key])) {
              const itemarr = wp[key];
              for (let index = 0; index < itemarr.length; index++) {
                const element = itemarr[index];
                 console.log("key="+key+"索引: " + index + ", 元素: " + element+"value="+arr[element]);
                if(arr[element]!=0){
                    sw[key+""]={}
                    sw[key+""]["s"] = arr[element]
                    sw[key+""]["wa"] = DragonTHLogic.oddsTable[arr[element]][itemarr.length-1] * ml *cs
                    break;
                }

              }
            }
          }
          return sw;
    }
    //根据wp结果获取每一路的中奖个数
    public static GetWinSc(wp:any){
        let sc = {}
        for (let key in wp) {
            if (Array.isArray(wp[key])) {
              const arr = wp[key];
              sc[key+""] = arr.length
            }
          }
          return sc;
    }
    
 //根据sw结果获取每一路的中奖元素
    public static GetRwsp(sw:any,sc:any){
        let rwsp = {}
        for (let key in sw) {
            let num = sc[key]?sc[key]:1
              const arr = sw[key];
             
       
                const element = arr.s;
               
            
                rwsp[key+""] = DragonTHLogic.oddsTable[element][num]
             
    
              
            
          }
          console.log("rwsp",rwsp)
          return rwsp;
    }
    public static GetWinTotalWin(sw:any):number{
        let totalwin = 0
        for (let key in sw) {
          
              const arr = sw[key];
              totalwin+=sw[key+""]["wa"];
            
          }
          return totalwin;
    }
    /**
     * 根据一维数组查询可以消除元素
     * @param arr 
     */
    public static GetAnwser(arr: number[]) {
        const answer = DragonTHLogic.SearchAnswer(DragonTHLogic.convertTo2DArray(arr));
        let result = [];
        for (let i = 0; i < answer.length; i++) {
            for (let j = 0; j < answer[i].length; j++) {
                result.push(DragonTHLogic.convertTo1DIndex(answer[i][j].x, answer[i][j].y))
            }
    
        }
        let wp = {}
        if (answer) {
            for (let i = 0; i < answer.length; i++) {
                wp["" + (i+1)] = [];
                for (let j = 0; j < answer[i].length; j++) {
                    wp["" + (i+1)].push(DragonTHLogic.convertTo1DIndex(answer[i][j].x, answer[i][j].y))
                }
    
            }
        }
    
         console.log("索引转换后", wp);
        // console.log("准备生成新的", arr);
        // DragonTHLogic.GetNewAnswer(arr, wp);
        return wp;
    }

    /**
     * 根据wp获取本局一共要消除多少个
     */
    public static GetWpArrayCount(wp:any){
        let sum = 0
        for (let key in wp) {
            if (Array.isArray(wp[key])) {
              sum+=wp[key].length;
            }
          }
          return sum;
    }

    /**
     * 计算最优解
     * @param {*} data 二维数组
     */
    public static SearchAnswer(data: number[][]): { x: number, y: number }[][] {
        let p = { x: -1, y: -1 }
    let answer = [];
    var remove = [];

    remove = new Array(DragonTHLogic.rows);

    for (let q = 0; q < data.length; q++) {
        remove[q] = new Array(DragonTHLogic.clumns);
        for (let w = 0; w < data[q].length; w++) {
            remove[q][w] = data[q][w];
        }

    }
    for (let i = 0; i < remove.length; i++) {
        for (let j = 0; j < remove[i].length; j++) {
            if (remove[i][j] == -1) {// -1 代表该元素已经判断过了
                continue;
            }
            if (remove[i][j] == 0) {// 0 代表该元素是百搭
                continue;
            }
            p.x = i;
            p.y = j;

            let list = DragonTHLogic.SearchRemoveList(remove, p);
            // if (list.length >= 4) {
            //     answer.push(list);
            // }
            if (list.length >= 4) { //这个是获取最优的一个解
                let result = []
                result.length = list.length;
                for (let k = 0; k < list.length; k++) {
                    let an = { x: -1, y: -1 }
                    an.x = list[k].x;
                    an.y = list[k].y
                    result[k] = an;
                }
                console.log("添加", result)
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
    }
    //查找相同
    public static SearchRemoveList(data: [][], p: { x: number, y: number }) {
        let list = [];
        let tempList = [];
        tempList.push(p);
        let tag = data[p.x][p.y];
        do {
    
            let any = tempList.pop();
            if (!any) {
                console.log("逻辑异常")
                break;
            }
            //左
            if ((any.y - 1 >= 0 && tag == data[any.x][any.y - 1]) || (any.y - 1 >= 0 && data[any.x][any.y - 1] == 0)) {
                let tp = { x: any.x, y: any.y - 1 };
                if (!DragonTHLogic.indexOfV2(list, tp) && !DragonTHLogic.indexOfV2(tempList, tp)) {
                    tempList.push(tp);
                }
            }
            //右
            if ((any.y + 1 < DragonTHLogic.clumns && tag == data[any.x][any.y + 1]) || (any.y + 1 < DragonTHLogic.clumns && 0 == data[any.x][any.y + 1])) {
                let tp = { x: any.x, y: any.y + 1 };
                if (!DragonTHLogic.indexOfV2(list, tp) && !DragonTHLogic.indexOfV2(tempList, tp)) {
                    tempList.push(tp);
                }
            }
            //下
            if ((any.x - 1 >= 0 && tag == data[any.x - 1][any.y]) || (any.x - 1 >= 0 && 0 == data[any.x - 1][any.y])) {
                let tp = { x: any.x - 1, y: any.y };
                if (!DragonTHLogic.indexOfV2(list, tp) && !DragonTHLogic.indexOfV2(tempList, tp)) {
                    tempList.push(tp);
                }
            }
            //上
            if ((any.x + 1 < DragonTHLogic.rows && tag == data[any.x + 1][any.y]) || (any.x + 1 < DragonTHLogic.rows && 0 == data[any.x + 1][any.y])) {
                let tp = { x: any.x + 1, y: any.y };
                if (!DragonTHLogic.indexOfV2(list, tp) && !DragonTHLogic.indexOfV2(tempList, tp)) {
                    tempList.push(tp);
                }
            }
            list.push(any);
        } while (tempList.length > 0);
        return list;
    }

    //是否已经在数组中(防止重复)
    public static indexOfV2(array: { x: number, y: number }[], p: { x: number, y: number }) {
        return array.some(function (elem: { x: number, y: number }, index, arr) {
            return elem.x == p.x && elem.y == p.y
        });
    }
    public static convertTo2DArray(arr: number[]): number[][] {
        console.log("aInput arrayrr", arr)
        if (arr.length !== DragonTHLogic.clumns * DragonTHLogic.rows) {
            throw new Error('Input array length is corrent.');
        }

        const result: number[][] = [];

        for (let i = 0; i < DragonTHLogic.rows; i++) {
            const row: number[] = [];

            for (let j = 0; j < DragonTHLogic.clumns; j++) {
                const index = i * DragonTHLogic.clumns + j;
                row.push(arr[index]);
            }

            result.push(row);
        }
        console.log("转二维数组", result);

        return result;
    }

    /**
     * 一维数组索引转二维
     * @param index 
     * @returns 
     */
    public static convertTo2DIndex(index: number): [number, number] {
        const row = Math.floor(index / DragonTHLogic.rows);
        const col = index % DragonTHLogic.clumns;
        return [row, col];
    }
    /**
     * 二维数组索引转一维
     * @param row 
     * @param col 
     * @returns 
     */
    public static convertTo1DIndex(row: number, col: number): number {
        if (row < 0 || row >= DragonTHLogic.rows || col < 0 || col >= DragonTHLogic.clumns) {
            throw new Error('Invalid row or column index.');
        }
        return row * DragonTHLogic.clumns + col;
    }








     /**
     * 
     * @param cb 一共消除了多少块
     * @param df df数组
     * @param isWin 本局是否有可以消除的
     */
     public static getdfValue(dt:number,df:any,isWin:boolean){
        let copydf;
        let temp:boolean = false;
        if(!df || df == null){
          copydf = [];
        }else{
          copydf = df.slice();
        }
      
         let canspecial = false;
         let specialidx = -1;
         for(let i = 0;i<copydf.length;i++){
           if(copydf[i].dt == dt){
             specialidx = i;
             canspecial = true;
             break;
           }
         }
         if(canspecial){ // 历史df已经有水龙
           if(!isWin){
            if(!copydf[specialidx].idh){ //未触发过
              console.log("要触发特殊模式"+dt)
              temp = true;
            }
           }
         }else{//历史df没有水龙的数据
           if(!isWin){
            console.log("要触发特殊模式"+dt)
            temp = true;
           }
           
         }
         return temp;
      }


// 反转换为一维数组
public static convertTo1DArray = (arr:any) => {
    return arr.flat();
}



}
