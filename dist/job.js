import { BuildUniqueId } from "./dbutils";
export class JobDB {
    _db;
    _tableName = "jobs";
    _customerId;
    constructor(db, custId) {
        this._db = db;
        this._customerId = custId;
    }
    // Create a table if it does not exist
    CreateJobTable() {
        this._db?.execSync(`CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
            "Code TEXT, " +
            "Name TEXT, " +
            "JobTypeId INTEGER, " +
            "CustomerId INTEGER, " +
            "JobLocation TEXT, " +
            "JobStatus TEXT)");
        return "Success";
    }
    async CreateJob(job) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await tx.prepareAsync(`INSERT INTO ${this._tableName} (_id, code, name, JobTypeId, CustomerId, JobLocation, JobStatus) ` +
                " VALUES ($_id, $Code, $Name, $JobTypeId, $CustomerId, $JobLocation, $JobStatus)");
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
            }
            catch (error) {
                status = "Error";
            }
            finally {
                statement.finalizeAsync();
            }
        });
        return status;
    }
}
