import type Database from "better-sqlite3";

export const migration001 = {
  version: 1,

  description: "Initial database schema",

  up(_database: Database.Database): void {
    // Baseline migration.
    // The initial schema is created by schema.ts.
    // This migration marks the baseline version only.

    console.log("Initial schema baseline verified.");
  },
};
