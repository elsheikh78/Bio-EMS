import Database from "better-sqlite3";
import { resolveSqlitePath } from "./sqlite.config";

const dbPath = resolveSqlitePath(process.env, process.cwd());

export const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

console.log("SQLite Connected");
