import { SQLiteDatabase } from "expo-sqlite";
import { DBStatus } from "./jobtrakr";
import { JobCategoryData } from "./interfaces";
export declare class CategoryDB {
    private _db;
    readonly _tableName = "categories";
    private _userId;
    constructor(db: SQLiteDatabase, custId: number);
    CreateCategoryTable(): DBStatus;
    CreateCategory(id: {
        value: bigint;
    }, cat: JobCategoryData): Promise<DBStatus>;
    UpdateCategory(cat: JobCategoryData): Promise<DBStatus>;
    DeleteCategory(id: bigint): Promise<DBStatus>;
    FetchAllCategories(jobId: bigint, categories: JobCategoryData[]): Promise<DBStatus>;
}
