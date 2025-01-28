import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite"; // Use 'react-native-sqlite-storage' if using React Native
import { DBStatus } from "./jobtrakr";
import { BuildUniqueId } from "./dbutils";
import { JobData } from "./jobData";

// Use for Inserts and updates. If inserting, _id should be null. If updating, _id should be the primary key of the record.
// export interface JobData {
//     _id: bigint | null;
//     Code: string | null;
//     Name: string | null;
//     JobTypeId: bigint | null;
//     CustomerId: bigint | null;
//     JobLocation: string | null;
//     JobStatus: string | null;
// }

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
                "CustomerId INTEGER not null, " +
                "JobLocation TEXT, " +
                "JobStatus TEXT)"
        );

        return "Success";
    }

    public async CreateJob(id: { value: bigint }, job: JobData): Promise<DBStatus> {
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

                id.value = job._id;

                console.log("BuildUniqueId returned :", job._id);
                if (job._id > -1n) {
                    await statement.executeAsync<{
                        _id: string;
                        Code: string;
                        Name: string;
                        JobTypeId: string;
                        CustomerId: string;
                        JobLocation: string;
                        JobStatus: string;
                    }>(
                        job._id?.toString(),
                        job.Code,
                        job.Name,
                        job.JobTypeId ? job.JobTypeId.toString() : null,
                        job.CustomerId ? job.CustomerId.toString() : null,
                        job.JobLocation,
                        job.JobStatus
                    );

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

    public async UpdateJob(job: JobData): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }

        let status: DBStatus = "Error";

        console.log("Updating job:", job._id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for job:", job._id);
            const statement = await tx.prepareAsync(
                `update ${this._tableName} set ` +
                    " code = $Code, name = $Name, JobTypeId = $JobTypeId, CustomerId = $CustomerId, JobLocation = $JobLocation, JobStatus = $JobStatus" +
                    " where _id = $_id"
            );

            console.log("Updating job statement created for:", job._id);

            try {
                let result = await statement.executeAsync<{
                    Code: string;
                    Name: string;
                    JobTypeId: string;
                    CustomerId: string;
                    JobLocation: string;
                    JobStatus: string;
                    _id: string;
                }>(
                    job.Code,
                    job.Name,
                    job.JobTypeId ? job.JobTypeId.toString() : null,
                    job.CustomerId ? job.CustomerId.toString() : null,
                    job.JobLocation,
                    job.JobStatus,
                    job._id ? job._id.toString() : null
                );

                if (result.changes > 0) {
                    console.log(`Job updated: ${job._id}. Changes = ${result.changes}`);
                    status = "Success";
                } else {
                    console.log(`Job updated: ${job._id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            } catch (error) {
                console.error("Error updating job:", error);
                status = "Error";
            } finally {
                statement.finalizeAsync();
            }
        });

        console.log("Returning from update statement:", job._id);
        return status;
    }

    public async DeleteJob(id: bigint): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }

        let status: DBStatus = "Error";

        console.log("Deleting job:", id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for job:", id);
            const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

            console.log("Delete job statement created for:", id);

            try {
                let result = await statement.executeAsync<{
                    _id: string;
                }>(id ? id.toString() : null);

                if (result.changes > 0) {
                    console.log(`Job deleted: ${id}. Changes = ${result.changes}`);
                    status = "Success";
                } else {
                    console.log(`Job deleted: ${id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            } catch (error) {
                console.error("Error deleting job:", error);
                status = "Error";
            } finally {
                statement.finalizeAsync();
            }
        });

        console.log("Returning from delete statement:", id);
        return status;
    }

    public async FetchAllJobs(jobs: JobData[]): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }

        let status: DBStatus = "Error";

        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await this._db?.prepareAsync(
                `select _id, code, name, JobTypeId, CustomerId, JobLocation, JobStatus from ${this._tableName}`
            );

            try {
                const result = await statement?.executeAsync<{
                    _id: string;
                    Code: string;
                    Name: string;
                    JobTypeId: string;
                    CustomerId: string;
                    JobLocation: string;
                    JobStatus: string;
                }>();

                if (result) {
                    await result.getAllAsync().then((rows) => {
                        for (const row of rows) {
                            jobs.push({
                                _id: BigInt(row._id),
                                Code: row.Code,
                                Name: row.Name,
                                JobTypeId: BigInt(row.JobTypeId),
                                CustomerId: BigInt(row.CustomerId),
                                JobLocation: row.JobLocation,
                                JobStatus: row.JobStatus,
                            });
                        }
                    });
                }
                status = "Success";
            } catch (error) {
                console.error("Error fetching jobs:", error);
                status = "Error";
            } finally {
                statement?.finalizeAsync();
            }
        });

        return status;
    }
}
