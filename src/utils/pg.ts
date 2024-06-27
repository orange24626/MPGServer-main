import pg from "pg";
const { Pool } = pg;

import { getDataBaseUrl } from "../config";
const parse = require("pg-connection-string").parse;
const parsed = parse(getDataBaseUrl() as string);

export const PgClient = new Pool({
  user: parsed.user,
  host: parsed.host,
  database: parsed.database,
  password: parsed.password,
  port: parsed.port,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
  max: 32,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});
