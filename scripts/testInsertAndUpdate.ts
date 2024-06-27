import { prismaClient } from "../src/utils";
import sql from "../src/utils/db";

console.log("开始测试插入和更新数据");

console.log("prisma测试插入和更新数据,无事务");

const check1 = Date.now();

let record = await prismaClient.configThreeColumnsCardWeight.create({
  data: {
    cardID: 1,
    name: "test",
    gameID: 123,
    columnOne: 1,
    columnTwo: 2,
    columnThree: 3,
    payRate: 1,
  },
});

record = await prismaClient.configThreeColumnsCardWeight.update({
  where: {
    id: record.id,
  },
  data: {
    name: "test2",
  },
});

console.log("prisma测试插入和更新数据,无事务耗时:", Date.now() - check1, "ms");

console.log("prisma测试插入和更新数据,有事务");

const check2 = Date.now();

record = await prismaClient.$transaction(async (prisma) => {
  record = await prisma.configThreeColumnsCardWeight.create({
    data: {
      cardID: 1,
      name: "test",
      gameID: 123,
      columnOne: 1,
      columnTwo: 2,
      columnThree: 3,
      payRate: 1,
    },
  });

  record = await prisma.configThreeColumnsCardWeight.update({
    where: {
      id: record.id,
    },
    data: {
      name: "test2",
    },
  });
  return record;
});

console.log("prisma测试插入和更新数据,有事务耗时:", Date.now() - check2, "ms");

console.log("开始测试纯sql插入和更新数据, 没有事务");

const check3 = Date.now();

const name = "test";
const gameID = 123;
const cardID = 1;
const columnOne = 1;
const columnTwo = 2;
const columnThree = 3;
const payRate = 1;

let [sqlRecord] = await sql`INSERT INTO 
"public"."ConfigThreeColumnsCardWeight" 
("name","gameID","cardID","columnOne","columnTwo","columnThree","payRate","updatedAt") 
VALUES (${name},${gameID},${cardID},${columnOne},${columnTwo},${columnThree},${payRate},now()) 
RETURNING "public"."ConfigThreeColumnsCardWeight"."id", "public"."ConfigThreeColumnsCardWeight"."name", "public"."ConfigThreeColumnsCardWeight"."gameID", "public"."ConfigThreeColumnsCardWeight"."cardID", "public"."ConfigThreeColumnsCardWeight"."columnOne", "public"."ConfigThreeColumnsCardWeight"."columnTwo", "public"."ConfigThreeColumnsCardWeight"."columnThree", "public"."ConfigThreeColumnsCardWeight"."payRate", "public"."ConfigThreeColumnsCardWeight"."updatedAt"`;

const recordId = sqlRecord.id;

const updateRlt = await sql`UPDATE "public"."ConfigThreeColumnsCardWeight" SET "name" = ${"test2"},
  "updatedAt" = now() WHERE ("public"."ConfigThreeColumnsCardWeight"."id" = ${recordId} AND 1=1) 
  RETURNING "public"."ConfigThreeColumnsCardWeight"."id", "public"."ConfigThreeColumnsCardWeight"."name",
   "public"."ConfigThreeColumnsCardWeight"."gameID", "public"."ConfigThreeColumnsCardWeight"."cardID", 
   "public"."ConfigThreeColumnsCardWeight"."columnOne", "public"."ConfigThreeColumnsCardWeight"."columnTwo", 
   "public"."ConfigThreeColumnsCardWeight"."columnThree", "public"."ConfigThreeColumnsCardWeight"."payRate", "public"."ConfigThreeColumnsCardWeight"."updatedAt"`;

sqlRecord = updateRlt[0];

console.log("纯sql测试插入和更新数据,没有事务耗时:", Date.now() - check3, "ms");

console.log("开始测试纯sql插入和更新数据, 有事务");

const check4 = Date.now();

let sqlRecord2 = null;

await sql.begin(async (sql) => {
  const [sqlRecord] = await sql`INSERT INTO 
  "public"."ConfigThreeColumnsCardWeight" 
  ("name","gameID","cardID","columnOne","columnTwo","columnThree","payRate","updatedAt") 
  VALUES (${name},${gameID},${cardID},${columnOne},${columnTwo},${columnThree},${payRate},now()) 
  RETURNING "public"."ConfigThreeColumnsCardWeight"."id", "public"."ConfigThreeColumnsCardWeight"."name", "public"."ConfigThreeColumnsCardWeight"."gameID", "public"."ConfigThreeColumnsCardWeight"."cardID", "public"."ConfigThreeColumnsCardWeight"."columnOne", "public"."ConfigThreeColumnsCardWeight"."columnTwo", "public"."ConfigThreeColumnsCardWeight"."columnThree", "public"."ConfigThreeColumnsCardWeight"."payRate", "public"."ConfigThreeColumnsCardWeight"."updatedAt"`;

  const recordId = sqlRecord.id;

  const updateRlt = await sql`UPDATE "public"."ConfigThreeColumnsCardWeight" SET "name" = ${"test2"},
    "updatedAt" = now() WHERE ("public"."ConfigThreeColumnsCardWeight"."id" = ${recordId} AND 1=1) 
    RETURNING "public"."ConfigThreeColumnsCardWeight"."id", "public"."ConfigThreeColumnsCardWeight"."name",
     "public"."ConfigThreeColumnsCardWeight"."gameID", "public"."ConfigThreeColumnsCardWeight"."cardID", 
     "public"."ConfigThreeColumnsCardWeight"."columnOne", "public"."ConfigThreeColumnsCardWeight"."columnTwo", 
     "public"."ConfigThreeColumnsCardWeight"."columnThree", "public"."ConfigThreeColumnsCardWeight"."payRate", "public"."ConfigThreeColumnsCardWeight"."updatedAt"`;
});

console.log("纯sql测试插入和更新数据,有事务耗时:", Date.now() - check4, "ms");

process.exit(0);
