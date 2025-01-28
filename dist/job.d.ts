import { SQLiteDatabase } from "expo-sqlite";
import { DBStatus } from "./jobtrakr";
export interface JobData {
    _id: bigint | null;
    Code: string | null;
    Name: string;
    JobTypeId: number;
    CustomerId: number;
    JobLocation: string | null;
    JobStatus: string | null;
}
export declare class JobDB {
    private _db;
    readonly _tableName = "jobs";
    private _customerId;
    constructor(db: SQLiteDatabase, custId: number);
    CreateJobTable(): DBStatus;
    CreateJob(job: JobData): Promise<DBStatus>;
}
