import { SQLiteDatabase } from "expo-sqlite";
import { DBStatus } from "./jobtrakr";
import { PictureBucketData } from "./interfaces";
import * as MediaLibrary from "expo-media-library";
export declare class PictureBucketDB {
    private _db;
    readonly _tableName = "picturebucket";
    private _userId;
    constructor(db: SQLiteDatabase, custId: number);
    CreatePictureBucketTable(): DBStatus;
    private GetAssetLatLong;
    InsertPicture(id: {
        value: bigint;
    }, jobId: bigint, asset: MediaLibrary.Asset): Promise<DBStatus>;
    UpdateJobId(id: bigint, jobId: bigint): Promise<DBStatus>;
    DeletePicture(id: bigint): Promise<DBStatus>;
    FetchAllPictures(jobId: bigint, pictures: PictureBucketData[]): Promise<DBStatus>;
}
