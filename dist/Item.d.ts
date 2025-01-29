import { SQLiteDatabase } from "expo-sqlite";
import { DBStatus } from "./jobtrakr";
import { JobCategoryItemData } from "./interfaces";
export declare class ItemDB {
    private _db;
    readonly _tableName = "items";
    private _userId;
    constructor(db: SQLiteDatabase, custId: number);
    CreateItemTable(): DBStatus;
    CreateItem(id: {
        value: bigint;
    }, item: JobCategoryItemData): Promise<DBStatus>;
    UpdateItem(item: JobCategoryItemData): Promise<DBStatus>;
    DeleteItem(id: bigint): Promise<DBStatus>;
    FetchAllItems(categoryId: bigint, items: JobCategoryItemData[]): Promise<DBStatus>;
}
