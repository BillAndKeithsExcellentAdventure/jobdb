import { JobTrakrDB, DBStatus } from "./jobtrakr";
import { PictureBucketData } from "./interfaces";
import * as MediaLibrary from "expo-media-library";
export declare class PictureBucketDB {
    private _db;
    private _jobTrakrDB;
    readonly _tableName = "picturebucket";
    private _userId;
    constructor(jt: JobTrakrDB, custId: number);
    CreatePictureBucketTable(): DBStatus;
    private GetAssetLatLong;
    InsertPicture(id: {
        value: bigint;
    }, jobId: bigint, asset: MediaLibrary.Asset): Promise<DBStatus>;
    UpdateJobId(id: bigint, jobId: bigint): Promise<DBStatus>;
    DeletePicture(id: bigint): Promise<DBStatus>;
    private getAssetById;
    FetchJobAssets(jobId: bigint | null, assets: MediaLibrary.Asset[] | null): Promise<DBStatus>;
    FetchJobPictures(jobId: bigint, pictures: PictureBucketData[]): Promise<DBStatus>;
}
