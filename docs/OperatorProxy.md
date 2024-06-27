# 运营商服务接口

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [运营商服务接口](#运营商服务接口)
  - [1.请求说明](#1请求说明)
  - [2.API文档](#2api文档)
    - [2.1 创建玩家，获取用户](#21-创建玩家获取用户)
      - [请求](#请求)
      - [返回](#返回)
    - [2.2 获取游戏启动链接](#22-获取游戏启动链接)
      - [请求](#请求-1)
      - [返回](#返回-1)
    - [2.3 设置玩家返奖率](#23-设置玩家返奖率)
      - [请求](#请求-2)
      - [返回](#返回-2)
    - [2.4 设置多个玩家返奖率](#24-设置多个玩家返奖率)
      - [请求](#请求-3)
      - [返回](#返回-3)
    - [2.5 查询玩家返奖率](#25-查询玩家返奖率)
      - [请求](#请求-4)
    - [返回](#返回-4)
    - [2.6 查询游戏记录](#26-查询游戏记录)
      - [请求](#请求-5)
    - [返回](#返回-5)
    - [2.7 查询余额](#27-查询余额)
      - [请求](#请求-6)
    - [返回](#返回-6)
    - [2.8 转入余额](#28-转入余额)
      - [请求](#请求-7)
    - [返回](#返回-7)
      - [大小限制](#大小限制)
    - [2.9 转出余额](#29-转出余额)
      - [请求](#请求-8)
    - [返回](#返回-8)
    - [2.10 查询单笔转账记录](#210-查询单笔转账记录)
      - [请求](#请求-9)
    - [返回](#返回-9)
    - [2.10 查询多笔转账记录](#210-查询多笔转账记录)
      - [请求](#请求-10)
    - [返回](#返回-10)
  - [3. 返回status 定义：](#3-返回status-定义)
  - [3. 平台支持语言：](#3-平台支持语言)
  - [4. 货币代码 货币名称 基础单位](#4-货币代码-货币名称-基础单位)
  - [6. RTP档位定义](#6-rtp档位定义)

<!-- /code_chunk_output -->

## 1.请求说明

API 对于所有的接口都JSON格式, 其内容类型如下：Content-Type: application/json
签名方式：

sign 把除了sign 外的key 按字母从小到大排序后 key=value 用&连接最后添上&key=secret 计算出小写md5

js 签名示例：

```js

  import MD5 from "crypto-js/md5";
  function createSign(input: any, secret: string) {
    const inputOrdered = Object.keys(input).sort();
    let sign = "";
    for (let key of inputOrdered) {
      sign += `${key}=${input[key]}&`;
    }
    sign += `key=${secret}`;
    sign = MD5(sign).toString();
    return sign;
  }
```

接口主要地址：https://api.pga-nmga.com/

## 2.API文档

### 2.1 创建玩家，获取用户

API地址： /operator-proxy/session
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                                                              |
| --------- | -------- | ---- | ----------------------------------------------------------------- |
| accessKey | String   | 是   | 运营商唯一标识                                                    |
| username  | String   | 是   | 玩家的用户名                                                      |
| channelID | String   | 否   | 运营商渠道名                                                      |
| test      | Boolean  | 否   | 是否是试玩用户                                                    |
| userID    | String   | 是   | 玩家的唯一标识符只允许使用字母、数字和”\_” 符号注：最多 32 个字符 |
| currency  | String   | 是   | 默认BRL注：货币代码在文档最后                                     |
| isTest    | Boolean  | 否   | 是否是试玩（推广）用户                                            |
| sign      | String   | 是   | 签名                                                              |

#### 返回

```typescript
{
  "token": "aTcYVXGw_GRNigiFvl6AA",
  "isNew": true,
  "balance": 0,
  "operatorUserID": "12345",
  "playerID": "7"
}
```

### 2.2 获取游戏启动链接

API地址： /operator-proxy/get-game-url
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                                             |
| --------- | -------- | ---- | ------------------------------------------------ |
| accessKey | String   | 是   | 运营商唯一标识                                   |
| gameId    | String   | 是   | 游戏接口                                         |
| lang      | String   | 是   | 语言                                             |
| token     | String   | 是   | 在/operator-proxy/session中获取的运营商用户token |
| sign      | String   | 是   | 签名                                             |

#### 返回

```typescript
{
  "gameUrl": "https://mpg.local:3001/126/index.html?l=pt&btt=1&oc=0&iwk=1&ot=B45JUccKckFUdLBFIurpl&ops=pnHvYgQCX0ROAkCEpgvsW&l=pt&op=1&or=mpg.local:3001&__refer=mpg.local:3001&__hv=Y4TSVv_g-x5ZWgSRxSAQ3"
}
```

### 2.3 设置玩家返奖率

API地址： /operator-proxy/set-user-rtp
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                           |
| --------- | -------- | ---- | ------------------------------ |
| accessKey | String   | 是   | 运营商唯一标识                 |
| userID    | String   | 是   | 用户ID，来自运营商注册的用户ID |
| rtp       | number   | 是   | rtp档位 0-14                   |
| sign      | String   | 是   | 签名                           |

#### 返回

成功示例：

```typescript
{
  "status": 0,
  "msg": "success",
  "data": {
    "rtp": 11,
    "userID": "12345"
  }
}
```

失败示例：

```typescript
{
  "status": 1038,
  "msg": "operator user not found",
  "data": ""
}
```

### 2.4 设置多个玩家返奖率

API地址： /operator-proxy/set-user-rtp-batch
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                                       |
| --------- | -------- | ---- | ------------------------------------------ |
| accessKey | String   | 是   | 运营商唯一标识                             |
| userIDs   | String   | 是   | 用户ID，来自运营商注册的用户ID，由“｜”分割 |
| rtp       | number   | 是   | rtp档位 0-14                               |
| sign      | String   | 是   | 签名                                       |

#### 返回

```typescript
{
  "status": 0,
  "msg": "success",
  "data": {
    "success": 2
  }
}
```

### 2.5 查询玩家返奖率

API地址： /operator-proxy/get-user-rtp
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                         |
| --------- | -------- | ---- | ---------------------------- |
| accessKey | String   | 是   | 运营商唯一标识               |
| userID    | String   | 是   | 用户ID，来自运营商注册的用ID |
| sign      | String   | 是   | 签名                         |

### 返回

```typescript
{
  "status": 0,
  "msg": "success",
  "data": {
    "rtp": 11,
    "userID": "13800138000"
  }
}
```

### 2.6 查询游戏记录

API地址： /operator-proxy/get-game-records
method: POST

#### 请求

| 参数名称    | 数据类型 | 必需 | 描述                                    |
| ----------- | -------- | ---- | --------------------------------------- |
| accessKey   | String   | 是   | 运营商唯一标识                          |
| userID      | String   | 否   | 用户ID，来自运营商注册的用户            |
| gameID      | String   | 否   | 游戏ID                                  |
| startedAt   | String   | 是   | 开始时间, 符合标准的时间戳字符串都可以  |
| endedAt     | String   | 是   | 结束时间， 符合标准的时间戳字符串都可以 |
| page        | Number   | 否   | 页数，默认1                             |
| pageSize    | Number   | 否   | 页数，默认20                            |
| gameOrderID | String   | 否   | 游戏历史记录单号                        |
| sort        | Number   | 否   | 排序方式，默认-1倒序，1正序             |
| sign        | String   | 是   | 签名                                    |

### 返回

```typescript
{
  "status": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "gameID": 126,
        "operatorUserName": "123456",
        "operatorUserId": "123456",
        "betAmount": "0.15",
        "winAmount": "0.39",
        "orderID": "1740184682081",
        "happenedAt": "2024-03-21T21:08:01.524Z"
      },
      {
        "gameID": 126,
        "operatorUserName": "123456",
        "operatorUserId": "123456",
        "betAmount": "0.15",
        "winAmount": "0.00",
        "orderID": "1717411880246",
        "happenedAt": "2024-03-21T21:07:58.551Z"
      }
    ],
    "total": 2,
    "page": 1,
    "pageSize": 20
  }
}
```

### 2.7 查询余额

API地址： /operator-proxy/get-user-balance
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                         |
| --------- | -------- | ---- | ---------------------------- |
| accessKey | String   | 是   | 运营商唯一标识               |
| userID    | String   | 是   | 用户ID，来自运营商注册的用ID |
| currency  | String   | 否   | 货币，默认BRL                |
| sign      | String   | 是   | 签名                         |

### 返回

```typescript
{
  "status": 0,
  "msg": "success",
  "data": {

    "userID": "13800138000",
    "balance": "100000"
  }
}
```

### 2.8 转入余额

API地址： /operator-proxy/pay-in
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                           |
| --------- | -------- | ---- | ------------------------------ |
| accessKey | String   | 是   | 运营商唯一标识                 |
| userID    | String   | 是   | 用户ID，来自运营商注册的用户ID |
| orderID   | String   | 是   | 运营商订单号                   |
| amount    | Number   | 是   | 金额                           |
| currency  | String   | 是   | 货币 BRL                       |
| sign      | String   | 是   | 签名                           |

### 返回

```typescript
{
  "status": 0,
  "msg": "success",
  "data": {
    "operatorOrderNo": "123456789",
    "gameOrderNo": "JqGoPBr5pUglpy5C3upKA",
    "balance": "11999.79"
  }
}
```

#### 大小限制

```typescript

  "status": 1039,
  "msg": "amount must be greater than 0",
  "data": ""
}
```

### 2.9 转出余额

API地址： /operator-proxy/pay-out
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                           |
| --------- | -------- | ---- | ------------------------------ |
| accessKey | String   | 是   | 运营商唯一标识                 |
| userID    | String   | 是   | 用户ID，来自运营商注册的用户ID |
| orderID   | String   | 是   | 运营商订单号                   |
| amount    | Number   | 是   | 金额                           |
| all       | Number   | 否   | 1: 全部取出, 0: 不是取出       |
| current   | String   | 是   | 货币 BRL                       |
| sign      | String   | 是   | 签名                           |

### 返回

```typescript
{
  "status": 0,
  "msg": "success",
  "data": {
    "operatorOrderNo": "87654321",
    "gameOrderNo": "hnxvdizQT61iASPFblZuG",
    "amount": "11899.79",
    "all": 0,
    "balance": "11799.79"
  }
}
```

### 2.10 查询单笔转账记录

API地址： /operator-proxy/get-transaction
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述           |
| --------- | -------- | ---- | -------------- |
| accessKey | String   | 是   | 运营商唯一标识 |
| orderID   | String   | 是   | 订单号         |
| sign      | String   | 是   | 签名           |

### 返回

```typescript
{
  "status": 0,
  "msg": "",
  "data": {
    "operatorUserId": "12345",
    "orderID": "123456789",
    "gameOrderId": "rCA-UGQnNIvZFjqsYhFoQ",
    "operatorUsername": "12345",
    "type": "Deposit", //Deposit 入账, Withdraw 取回
    "amount": "4000",
    "time": 1711054526219
  }
}
```

### 2.10 查询多笔转账记录

API地址： /operator-proxy/get-transactions
method: POST

#### 请求

| 参数名称  | 数据类型 | 必需 | 描述                                    |
| --------- | -------- | ---- | --------------------------------------- |
| accessKey | String   | 是   | 运营商唯一标识                          |
| startedAt | String   | 是   | 开始时间戳                              |
| endedAt   | String   | 是   | 结束时间戳.注：查询时间范围最大一个小时 |
| sign      | String   | 是   | 签名                                    |

### 返回

```typescript
{
  "status": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "amount": "4000",
        "gameOrderId": "rCA-UGQnNIvZFjqsYhFoQ",
        "operatorOrderId": "123456789",
        "operatorUserId": "12345",
        "operatorUsername": "12345",
        "time": 1711054526219
      },
      {
        "amount": "0",
        "gameOrderId": "MKoPXY1KROShJuYeVPi_N",
        "operatorOrderId": null,
        "operatorUserId": "123456",
        "operatorUsername": "123456",
        "time": 1711054614125
      },
      {
        "amount": "4000",
        "gameOrderId": "8cEP7WfNdH45qGe5J09bo",
        "operatorOrderId": "123456789",
        "operatorUserId": "12345",
        "operatorUsername": "12345",
        "time": 1711054646374
      },
      {
        "amount": "4000",
        "gameOrderId": "ExJApcod6ROLUy9SuCHoA",
        "operatorOrderId": "123456789",
        "operatorUserId": "12345",
        "operatorUsername": "12345",
        "time": 1711054669405
      },
      {
        "amount": "100",
        "gameOrderId": "fMoL_HbRO7d3uUItlcdFv",
        "operatorOrderId": null,
        "operatorUserId": "12345",
        "operatorUsername": "12345",
        "time": 1711054801128
      },
      {
        "amount": "100",
        "gameOrderId": "z1JAd4VgrxBqQjvrjn-hO",
        "operatorOrderId": null,
        "operatorUserId": "12345",
        "operatorUsername": "12345",
        "time": 1711054806320
      },
      {
        "amount": "4000",
        "gameOrderId": "1W1PEAiMdlKan-RzReg-f",
        "operatorOrderId": "123456789",
        "operatorUserId": "123456",
        "operatorUsername": "123456",
        "time": 1711055256491
      },
      {
        "amount": "11",
        "gameOrderId": "EGvxVyXgtTaUAqoLeqket",
        "operatorOrderId": "123456789",
        "operatorUserId": "123456",
        "operatorUsername": "123456",
        "time": 1711056435704
      }
    ],
    "total": 8
  }
}
```

## 3. 返回status 定义：

请求无效 = 1034
操作失败 = 1035
签名错误 = 1036
时间戳过期 = 1037
参数错误 = 1038
内部服务器错误 = 1200
无效的运营商 = 1204
无效的PlayerSession = 1300
玩家不存在 = 1301
玩家已被冻结 = 1309
游戏正在维护中 = 1401
有游戏未结算完不能转出 = 1402
订单号重复 = 1501
数值不能为空 = 3004
玩家钱包不存在 = 3006
玩家钱包已存在 = 3009
余额不足 = 3014
上分日限额 = 3015
订单不存在 = 4016
调用接口频率过快 = 5001

## 3. 平台支持语言：

en 英文 （默认）
da 丹麦文
de 德文
es 西班牙文
fi 芬兰文
fr 法文
id 印尼文
it 意大利文
ja 日文
ko 韩文
nl 荷兰文
no 挪威文
pl 波兰文
pt 葡萄牙文
ro 罗马尼亚文
ru 俄文
sv 瑞典文
th 泰文
tr 土耳其文
vi 越南文
zh 中文
my 缅甸文

## 4. 货币代码 货币名称 基础单位

AED 阿拉伯联合酋长国迪拉姆 1
AFN 阿富汗 1
ALL 阿尔巴尼亚列克 1
AMD 亚美尼亚德拉姆 1
ANG 安的列斯盾 1
AOA 安哥拉宽扎 1
ARS 阿根廷比索 1
AUD 澳大利亚元 1
AWG 阿鲁巴弗罗林 1
AZN 阿塞拜疆马纳特 1
BAM 波黑可兑换马克 1
BBD 巴巴多斯元 1
BDT 孟加拉塔卡 1
BGN 保加利亚列弗 1
BHD 巴林第纳尔 1
BIF 布隆迪法郎 1000
BMD 百慕大元 1
BND 汶莱元 1
BOB 玻利维亚诺 1
BRL 巴西里亚伊（雷亚尔） 1
BSD 巴哈马元 1
BTN 不丹努尔特鲁姆 1
BWP 博茨瓦纳普拉 1
BYN 白俄罗斯卢布 1
BYR 白俄罗斯卢布 1
BZD 伯利兹元 1
CAD 加拿大元 1
CDF 刚果法郎 1000
CHF 瑞士法郎 1
CLP 智利比索 1
CNY 人民币 1
COP 哥伦比亚比索 1000
CRC 哥斯达黎加科朗 1
CSD 塞爾維亞第納爾 1
CUP 古巴比索 1
CVE 佛得角埃斯库多 1
CZK 捷克克朗 1
DJF 吉布提法郎 1
DKK 丹麦克朗 1
DOP 多米尼加比索 1
DZD 阿尔及利亚第纳尔 1
EGP 埃及镑 1
ERN 厄立特里亚纳克法 1
ESP 比塞塔 1
ETB 埃塞俄比亚比尔 1
EUR 欧元 1
FJD 斐济元 1
FKP 福克兰岛磅 1
GBP 英镑 1
GEL 格鲁吉亚拉里 1
GHS 加纳塞地 1
GIP 直布罗陀庞德 1
GMD 冈比亚货币 1
GNF 几内亚法郎 1000
GTQ 危地马拉格查尔 1
GYD 圭亚那元 1
HNL 洪都拉斯伦皮拉 1
HRK 克罗地亚库纳 1
HTG 海地古德 1
HUF 匈牙利福林 1
IDR 印度尼西亚卢比盾 1000
ILS 以色列谢克尔 1
INR 印度卢比 1
IQD 伊拉克第纳尔 1000
IRR 伊朗里亚尔 1000
ISK 冰岛克朗 1
JMD 牙买加元 1
JOD 约旦第纳尔 1
JPY 日元 1
KES 肯尼亚先令 1
KGS 吉尔吉斯斯坦索姆 1
KHR 柬埔寨利尔斯 1000
KMF 科摩罗法郎 1
KPW 北朝鲜元 1
KRW 韩元 1000
KWD 科威特第纳尔 1
KYD 开曼岛元 1
KZT 坚戈 1
LAK 老挝基普 1000
LBP 黎巴嫩镑 1000
LKR 斯里兰卡卢比 1
LRD 黎巴嫩元 1
LSL 莱索托洛蒂 1
LVL 拉脱维亚拉特 1
LYD 利比亚第纳 1
MAD 摩洛哥迪拉姆 1
MBTC 比特币（虚拟货币） 1
MDL 摩尔多瓦列伊 1
MGA 马达加斯加阿里亚里 1000
MKD 马其顿第纳尔 1
MMK 缅甸元 1000
MNT 蒙古圖格裡克 1000
MUR 毛里求斯卢比 1
MVR 马尔代夫罗非亚 1
MWK 马拉维克瓦查 1
MXN 墨西哥比索 1
MZN 莫桑比克梅蒂卡尔 1
NAD 纳米比亚元 1
NGN 尼日利亚奈拉 1
NIO 尼加拉瓜科多巴 1
NOK 挪威克朗 1
NPR 尼泊尔卢比 1
NZD 新西兰元 1
OMR 阿曼里亚尔 1
PAB 巴拿马巴波亚 1
PEN 秘鲁索尔 1
PGK 巴布亚新几内亚基纳 1
PHP 菲律宾比索 1
PKR 巴基斯坦卢比 1
PLN 波兰兹罗提 1
PYG 巴拉圭瓜拉尼 1000
QAR 卡塔尔里亚尔 1
RON 罗马尼亚列伊 1
RSD 塞尔维亚第纳尔 1
RUB 俄罗斯卢布 1
RWF 卢旺达法郎 1000
SAR 沙特里亚尔 1
SBD 所罗门群岛元 1
SCR 塞舌尔卢比 1
SDG 苏丹镑 1
SEK 瑞典克朗 1
SHP 圣赫勒拿磅 1
SLL 塞拉利昂利昂 1000
SOS 索马里先令 1
SRD 苏里南元 1
STD 圣多美和普林西比多布猎 1000
SVC 萨尔瓦多科朗 1
SYP 叙利亚镑 1
SZL 斯威士马兰吉尼 1
THB 泰铢 1
TJS 塔吉克斯坦索莫尼 1
TMT 土库曼斯坦新马纳特 1
TND 突尼斯第纳尔 1
TOP 汤加潘加 1
TRL 土耳其里拉 1
TRY 土耳其里拉 1
TTD 特立尼达与多巴哥元 1
TUSD TrueUSD（虚拟货币） 1
TZS 坦桑尼亚先令 1000
UAH 乌克兰赫夫米 1
UBTC 微型比特币 1
UGX 乌干达先令 1000
USD 美元 1
USDC USD Coin（虚拟货币） 1
USDT 泰达币 1
UYU 乌拉圭比索 1
UZS 乌兹别克斯坦苏姆 1000
VND 越南盾 1000
VUV 瓦努阿图瓦图 1
WST 萨摩亚塔拉 1
XAF 中非金融合作法郎 1
XCD 东加勒比元 1
XOF CFA 法郎 1
XPF 太平洋法郎 1
YER 也门里亚尔 1
ZAR 南非兰特 1
ZMW 赞比亚克瓦查 1
MYR 马来西亚林吉

## 6. RTP档位定义

| 档位编号 | 最小值 | 最大值 | 奖池预定返奖区间     |
| -------- | ------ | ------ | -------------------- |
| 1        | 0      | 15%    | 小于等于15%          |
| 2        | 15%    | 25%    | 大于15%小于等于25%   |
| 3        | 25%    | 35%    | 大于25%小于等于35%   |
| 4        | 35%    | 45%    | 大于35%小于等于45%   |
| 5        | 45%    | 55%    | 大于45%小于等于55%   |
| 6        | 55%    | 65%    | 大于55%小于等于65%   |
| 7        | 65%    | 70%    | 大于65%小于等于70%   |
| 8        | 70%    | 75%    | 大于70%小于等于75%   |
| 9        | 75%    | 80%    | 大于75%小于等于80%   |
| 10       | 80%    | 85%    | 大于80%小于等于85%   |
| 11       | 85%    | 90%    | 大于85%小于等于90%   |
| 12       | 90%    | 95%    | 大于90%小于等于95%   |
| 13       | 95%    | 99%    | 大于95%小于等于99%   |
| 14       | 130%   | 145%   | 大于130%小于等于145% |
