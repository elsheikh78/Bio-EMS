import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "bioems.db");

export const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");

console.log("SQLite Connected");