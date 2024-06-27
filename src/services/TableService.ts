import { getServerType } from "config";
import moment from "moment";
import { PgClient } from "utils";

export class TableService {
  static async getGameHistoryTable(day?: string) {
    day = day || moment().utc().format("YYYYMMDD");
    const tableName = `GameHistory_${day}`;

    const checkIfTableExists = await PgClient.query(
      `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '${String(tableName)}');`,
    );

    if (checkIfTableExists.rows[0].exists) {
      console.log(`Table ${tableName} already exists`);
      return tableName;
    }

    if (getServerType().includes("ORDERS_SERVICE")) {
      return tableName;
    }
    //create table sql
    await PgClient.query(`CREATE TABLE IF NOT EXISTS "public"."${String(tableName)}" (
        "historyId" int8 NOT NULL,
        currency text NOT NULL,
        fscc int4 NOT NULL DEFAULT 0,
        mgcc int4 NOT NULL DEFAULT 0,
        ge jsonb NOT NULL,
        "gameID" int4 NOT NULL,
        "totalBet" numeric(65, 30) NOT NULL,
        "operatorId" int4 NOT NULL,
        "playerId" int4 NOT NULL,
        profit numeric(65, 30) NOT NULL DEFAULT 0,
        "moneyPoolId" int4 NULL,
        "moneyPool" jsonb NULL,
        detail jsonb NULL,
        "isTesting" bool NOT NULL DEFAULT false,
        "operatorUsername" text NULL,
        "operatorAccountID" text NULL,
        "balanceBefore" numeric(65, 30) NULL,
        "balanceAfter" numeric(65, 30) NULL,
        "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "version" int4 NOT NULL DEFAULT 0,
        id serial4 NOT NULL,
        status public."GameHistoryStatus" NOT NULL DEFAULT 'Ready'::"GameHistoryStatus",
        CONSTRAINT "${tableName}_pkey" PRIMARY KEY (id)
    );
      CREATE INDEX IF NOT EXISTS "${tableName}_createdAt_idx" ON public."${tableName}" USING hash ("createdAt");

      CREATE INDEX IF NOT EXISTS "${tableName}_updatedAt_idx" ON public."${tableName}" USING hash ("updatedAt");

      CREATE INDEX IF NOT EXISTS "${tableName}_currency_idx" ON public."${tableName}" USING hash (currency);

      CREATE INDEX IF NOT EXISTS "${tableName}_gameID_idx" ON public."${tableName}" USING hash ("gameID");

      CREATE UNIQUE INDEX IF NOT EXISTS  "${tableName}_historyId_key" ON public."${tableName}" USING btree ("historyId");

      CREATE INDEX IF NOT EXISTS "${tableName}_operatorId_createdAt_idx" ON public."${tableName}" USING btree ("operatorId", "createdAt");

      CREATE INDEX IF NOT EXISTS "${tableName}_operatorId_updatedAt_idx" ON public."${tableName}" USING btree ("operatorId", "updatedAt");

      CREATE INDEX IF NOT EXISTS "${tableName}_operatorId_idx" ON public."${tableName}" USING hash ("operatorId");

      CREATE INDEX IF NOT EXISTS "${tableName}_playerId_idx" ON public."${tableName}" USING hash ("playerId");
    `);

    return tableName;
  }
}
