// Server-only: reads the full per-tool records. Never import this from a client component.
import fs from "node:fs";
import path from "node:path";
import type { ToolRecord } from "@/data/catalog-types";

const DIR = path.join(process.cwd(), "content", "tools");

export const RECORDS: ToolRecord[] = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf-8")) as ToolRecord);

export function getRecord(id: string): ToolRecord | undefined {
  return RECORDS.find((r) => r.id === id);
}
