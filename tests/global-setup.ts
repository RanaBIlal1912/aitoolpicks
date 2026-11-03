// Runs once before the tests. Starts a disposable PostgreSQL server, applies the migrations to a template database, and tells the tests how to
// reach it. Set SKIP_DB_TESTS=1 to skip all of that (the database tests are then skipped too).
import { createSql } from "../src/server/db/client.ts";
import { runMigrations } from "../src/server/db/migrations.ts";
import { findPostgresBin, startCluster, type Cluster } from "./helpers/pg-cluster.ts";
import type { TestProject } from "vitest/node";

export type PgInfo = { available: true; adminUrl: string; template: string } | { available: false; reason: string };

declare module "vitest" {
  export interface ProvidedContext {
    pg: PgInfo;
  }
}

let cluster: Cluster | undefined;

export default async function setup(project: TestProject) {
  if (process.env.SKIP_DB_TESTS === "1") {
    project.provide("pg", { available: false, reason: "SKIP_DB_TESTS=1" });
    return;
  }
  const bin = findPostgresBin();
  if (!bin) {
    project.provide("pg", { available: false, reason: "no PostgreSQL server binaries found (set PG_BIN_DIR to the folder holding initdb and pg_ctl)" });
    return;
  }
  try {
    cluster = await startCluster(bin);
    const admin = createSql(cluster.adminUrl(), { ssl: "disable" });
    await admin.unsafe("create database template_migrated");
    await admin.end({ timeout: 5 });
    const tpl = createSql(cluster.adminUrl("template_migrated"), { ssl: "disable" });
    await runMigrations(tpl);
    await tpl.end({ timeout: 5 });
    project.provide("pg", { available: true, adminUrl: cluster.adminUrl(), template: "template_migrated" });
  } catch (e) {
    cluster?.stop();
    cluster = undefined;
    project.provide("pg", { available: false, reason: `could not start the test database: ${e instanceof Error ? e.message.slice(0, 300) : String(e)}` });
  }
  return () => cluster?.stop();
}
