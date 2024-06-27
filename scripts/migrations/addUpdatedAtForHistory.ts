import moment from "moment";

import { PgClient } from "../../src/utils/pg";

let day = moment.utc().format("YYYYMMDD");

for (let index = 0; index < 20; index++) {
  const tableName = `GameHistory_${day}`;

  const checkIfTableExists = await PgClient.query(
    `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '${String(tableName)}');`,
  );

  if (checkIfTableExists.rows[0].exists) {
    console.log(`Table ${tableName}  exists`);
    await PgClient.query(
      `
    CREATE INDEX IF NOT EXISTS "${tableName}_operatorId_updatedAt_idx" ON public."${tableName}" USING btree ("operatorId", "updatedAt");
    CREATE INDEX IF NOT EXISTS "${tableName}_updatedAt_idx" ON public."${tableName}" USING hash ("updatedAt");
    `,
    );
  }
  day = moment.utc(day).subtract(1, "days").format("YYYYMMDD");
}

process.exit(0);
