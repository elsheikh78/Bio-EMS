import Database from "better-sqlite3";
import { AppError } from "./app-error";

export function mapSqliteError(error: unknown): never {

    if (error instanceof Database.SqliteError) {

        switch (error.code) {

            case "SQLITE_CONSTRAINT_UNIQUE":

                throw new AppError(
                    "Resource already exists",
                    409,
                    "RESOURCE_ALREADY_EXISTS"
                );

            case "SQLITE_CONSTRAINT_FOREIGNKEY":

                throw new AppError(
                    "Referenced resource not found",
                    400,
                    "FOREIGN_KEY_CONSTRAINT"
                );

            default:

                throw new AppError(
                    error.message,
                    500,
                    "SQLITE_ERROR"
                );

        }

    }

    throw error;

}