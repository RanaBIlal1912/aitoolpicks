// The database entry point for Next.js server code (pages, Server Actions, Route Handlers).
// "server-only" makes the build fail if a Client Component ever imports this file, which keeps the connection string out of the browser bundle.
import "server-only";
import { getEnv } from "../env.ts";
import { createDb, createSql, type Db, type Sql } from "./client.ts";

let sql: Sql | undefined;
let db: Db | undefined;

/** One shared connection per server instance (the pooler multiplexes them). Created on first use, so importing this file never connects. */
export function getSql(): Sql {
  if (!sql) {
    const env = getEnv(["database"]);
    sql = createSql(env.DATABASE_URL, { ssl: env.DATABASE_SSL, max: 1 });
  }
  return sql;
}

export function getDb(): Db {
  return (db ??= createDb(getSql()));
}
