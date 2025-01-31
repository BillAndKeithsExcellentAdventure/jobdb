import { SQLiteDatabase } from "expo-sqlite";
import { DBStatus } from "./jobtrakr";
import { JobData } from "./interfaces";
export declare class JobDB {
    private _db;
    readonly _tableName = "jobs";
    private _userId;
    constructor(db: SQLiteDatabase, userId: number);
    CreateJobTable(): DBStatus;
    CreateJob(id: {
        value: bigint;
    }, job: JobData): Promise<DBStatus>;
    UpdateJob(job: JobData): Promise<DBStatus>;
    UpdateLocationInformation(long: number, lat: number, radius: number, id: bigint): Promise<DBStatus>;
    UpdateThumbnail(thumbnailInBase64: string | undefined, id: bigint): Promise<DBStatus>;
    DeleteJob(id: bigint): Promise<DBStatus>;
    FetchThumbnail(id: number): Promise<string | undefined>;
    FetchAllJobs(jobs: JobData[]): Promise<DBStatus>;
}
