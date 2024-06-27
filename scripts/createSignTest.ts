import MD5 from "crypto-js/md5";
import { Decimal } from "@prisma/client/runtime/library";

import moment from "moment";

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

const now = moment().toDate();
const start = moment("2024-04-24T06:00:00.000Z").toDate().getTime().toString();
const end = moment("2024-04-24T07:00:00.000Z").toDate().getTime().toString();

const out = new Decimal(100000).plus(-3);

console.log(out.toString());

const input = {
  accessKey: "UuSNOLW5bnZubiGE0M0pu",
  startedAt: start,
  endedAt: end,
  page: 1,
  pageSize: 10,
  sort: -1,
};
const sign = createSign(input, "85PQumTTkJtkPCqHxoF1e");

console.log(
  JSON.stringify({
    ...input,
    sign,
  }),
);
