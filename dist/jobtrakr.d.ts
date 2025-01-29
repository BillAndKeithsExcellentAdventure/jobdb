import { SQLiteDatabase } from "expo-sqlite";
import { JobDB } from "./job";
import { CategoryDB } from "./Category";
import { ItemDB } from "./Item";
export type DBStatus = "Success" | "Error" | "NoChanges";
export declare class JobTrakrDB {
    private _db;
    private _dbName;
    private _userId;
    private _jobDB;
    private _categoryDB;
    private _itemDB;
    constructor(userId: number);
    DeleteDatabase: () => Promise<void>;
    CopyFileToDownloads: () => Promise<void>;
    OpenDatabase(): Promise<DBStatus>;
    GetDb(): SQLiteDatabase | null;
    CreateAutoIncrementTable(): void;
    GetJobDB(): JobDB;
    GetCategoryDB(): CategoryDB;
    GetItemDB(): ItemDB;
    CreateSampleData: () => Promise<void>;
}
