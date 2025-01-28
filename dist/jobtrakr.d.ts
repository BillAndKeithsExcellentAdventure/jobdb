import { SQLiteDatabase } from "expo-sqlite";
import { JobDB } from "./job";
export type DBStatus = "Success" | "Error" | "NoChanges";
export declare class JobTrakrDB {
    private _db;
    private _dbName;
    private _customerId;
    private _jobDB;
    constructor(custId: number);
    CopyFileToDownloads: () => Promise<void>;
    OpenDatabase(): Promise<DBStatus>;
    GetDb(): SQLiteDatabase | null;
    CreateAutoIncrementTable(): void;
    GetJobDB(): JobDB;
}
