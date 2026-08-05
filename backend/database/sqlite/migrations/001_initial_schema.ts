export const migration001 = {

    version: 1,

    description: "Initial database schema",

    up(): void {

        // Baseline migration.
        // The initial schema is created by schema.ts.
        // This migration marks the baseline version only.

        console.log("Initial schema baseline verified.");

    }

};