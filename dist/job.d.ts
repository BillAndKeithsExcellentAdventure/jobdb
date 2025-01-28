import { SQLiteDatabase } from "expo-sqlite";
import { DBStatus } from "./jobtrakr";
import { JobData } from "./jobData";
export declare class JobDB {
    private _db;
    readonly _tableName = "jobs";
    private _customerId;
    constructor(db: SQLiteDatabase, custId: number);
    CreateJobTable(): DBStatus;
    CreateJob(id: {
        value: bigint;
    }, job: JobData): Promise<DBStatus>;
    UpdateJob(job: JobData): Promise<DBStatus>;
    DeleteJob(id: bigint): Promise<DBStatus>;
    FetchAllJobs(jobs: JobData[]): Promise<DBStatus>;
}
