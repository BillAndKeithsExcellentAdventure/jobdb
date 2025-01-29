import { SQLiteDatabase } from "expo-sqlite";
import { DBStatus } from "./jobtrakr";
import { PictureBucketData } from "./interfaces";
export declare class PictureBucketDB {
    private _db;
    readonly _tableName = "picturebucket";
    private _userId;
    constructor(db: SQLiteDatabase, custId: number);
    CreatePictureBucketTable(): DBStatus;
    InsertPicture(id: {
        value: bigint;
    }, pict: PictureBucketData): Promise<DBStatus>;
    UpdateJobId(id: bigint, jobId: bigint): Promise<DBStatus>;
    DeletePicture(id: bigint): Promise<DBStatus>;
    FetchAllPictures(jobId: bigint, pictures: PictureBucketData[]): Promise<DBStatus>;
}
