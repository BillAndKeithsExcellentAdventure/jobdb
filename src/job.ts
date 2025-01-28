import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite"; // Use 'react-native-sqlite-storage' if using React Native
import { DBStatus } from "./jobtrakr";
import { BuildUniqueId } from "./dbutils";
import { Transaction } from "react-native-sqlite-storage";

// Use for Inserts and updates. If inserting, _id should be null. If updating, _id should be the primary key of the record.
export interface JobData {
    _id: bigint | null;
    Code: string | null;
    Name: string;
    JobTypeId: number;
    CustomerId: number;
    JobLocation: string | null;
    JobStatus: string | null;
}

export class JobDB {
    private _db: SQLiteDatabase | null;
    readonly _tableName = "jobs";
    private _customerId: number;

    public constructor(db: SQLiteDatabase, custId: number) {
        this._db = db;
        this._customerId = custId;
    }

    // Create a table if it does not exist
    public CreateJobTable(): DBStatus {
        this._db?.execSync(
            `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
                "Code TEXT, " +
                "Name TEXT, " +
                "JobTypeId INTEGER, " +
                "CustomerId INTEGER, " +
                "JobLocation TEXT, " +
                "JobStatus TEXT)"
        );

        return "Success";
    }

    public async CreateJob(job: JobData): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }

        let status: DBStatus = "Error";

        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await tx.prepareAsync(
                `INSERT INTO ${this._tableName} (_id, code, name, JobTypeId, CustomerId, JobLocation, JobStatus) ` +
                    " VALUES ($_id, $Code, $Name, $JobTypeId, $CustomerId, $JobLocation, $JobStatus)"
            );

            try {
                job._id = await BuildUniqueId(tx, this._customerId);
                console.log("BuildUniqueId returned :", job._id);
                if (job._id > -1n) {
                    await statement.executeAsync({
                        $_id: job._id.toString(),
                        $Code: job.Code,
                        $Name: job.Name,
                        $JobTypeId: job.JobTypeId,
                        $CustomerId: job.CustomerId,
                        $JobLocation: job.JobLocation,
                        $JobStatus: job.JobStatus,
                    });

                    status = "Success";
                }
            } catch (error) {
                status = "Error";
            } finally {
                statement.finalizeAsync();
            }
        });

        return status;
    }
}
