// db.js
import { getDataBaseUrl } from "config";
import postgres from "postgres";
const parse = require("pg-connection-string").parse;

const parsed = parse(getDataBaseUrl() as string);

const sql = postgres({
  types: {
    bigint: postgres.BigInt,
  },
  ...parsed,
  username: parsed.user,
  password: parsed.password,
  host: parsed.host,
  port: parsed.port,
  database: parsed.database,
  max: 32,
  connect_timeout: 10,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
  onclose: (connId)=>{
    console.log(`数据库断开connId: ${ connId }, time: ${ Date.now() }`)
  }
}); // will use psql environment variables

export default sql;
