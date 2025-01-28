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
            "CustomerId INTEGER not null, " +
            "JobLocation TEXT, " +
            "StartDate Date, " +
            "PlannedFinish Date, " +
            "BidPrice NUMBER, " +
            "JobStatus TEXT)");
        return "Success";
    }
    async CreateJob(id, job) {
        if (!this._db) {
            return "Error";
        }
        console.log("Creating job:", job);
        let status = "Error";
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("preparing statement for job");
            const statement = await tx.prepareAsync(`INSERT INTO ${this._tableName} (_id, code, name, JobTypeId, CustomerId, JobLocation, StartDate, PlannedFinish, BidPrice, JobStatus) ` +
                " VALUES ($_id, $Code, $Name, $JobTypeId, $CustomerId, $JobLocation, $StartDate, $PlannedFinish, $BidPrice, $JobStatus)");
            console.log("CreateJob statement created");
            try {
                job._id = await BuildUniqueId(tx, this._customerId);
                id.value = job._id;
                console.log("BuildUniqueId returned :", job._id);
                if (job._id > -1n) {
                    await statement.executeAsync(job._id?.toString(), job.Code, job.Name, job.JobTypeId ? job.JobTypeId.toString() : null, job.CustomerId ? job.CustomerId.toString() : null, job.JobLocation, job.StartDate ? job.StartDate.toString() : null, job.PlannedFinish ? job.PlannedFinish.toString() : null, job.BidPrice ? job.BidPrice.toString() : null, job.JobStatus);
                    status = "Success";
                }
            }
            catch (error) {
                status = "Error";
                console.error("Error creating job:", error);
            }
            finally {
                statement.finalizeAsync();
            }
        });
        return status;
    }
    async UpdateJob(job) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        console.log("Updating job:", job._id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for job:", job._id);
            const statement = await tx.prepareAsync(`update ${this._tableName} set ` +
                " code = $Code, name = $Name, JobTypeId = $JobTypeId, CustomerId = $CustomerId, JobLocation = $JobLocation, " +
                " StartDate = $StartDate, PlannedFinish = $PlannedFinish, BidPrice = $BidPrice, JobStatus = $JobStatus" +
                " where _id = $_id");
            console.log("Updating job statement created for:", job._id);
            try {
                let result = await statement.executeAsync(job.Code, job.Name, job.JobTypeId ? job.JobTypeId.toString() : null, job.CustomerId ? job.CustomerId.toString() : null, job.JobLocation, job.StartDate ? job.StartDate.toString() : null, job.PlannedFinish ? job.PlannedFinish.toString() : null, job.BidPrice ? job.BidPrice.toString() : null, job.JobStatus, job._id ? job._id.toString() : null);
                if (result.changes > 0) {
                    console.log(`Job updated: ${job._id}. Changes = ${result.changes}`);
                    status = "Success";
                }
                else {
                    console.log(`Job updated: ${job._id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            }
            catch (error) {
                console.error("Error updating job:", error);
                status = "Error";
            }
            finally {
                statement.finalizeAsync();
            }
        });
        console.log("Returning from update statement:", job._id);
        return status;
    }
    async DeleteJob(id) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        console.log("Deleting job:", id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for job:", id);
            const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);
            console.log("Delete job statement created for:", id);
            try {
                let result = await statement.executeAsync(id ? id.toString() : null);
                if (result.changes > 0) {
                    console.log(`Job deleted: ${id}. Changes = ${result.changes}`);
                    status = "Success";
                }
                else {
                    console.log(`Job deleted: ${id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            }
            catch (error) {
                console.error("Error deleting job:", error);
                status = "Error";
            }
            finally {
                statement.finalizeAsync();
            }
        });
        console.log("Returning from delete statement:", id);
        return status;
    }
    async FetchAllJobs(jobs) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await this._db?.prepareAsync(`select _id, code, name, JobTypeId, CustomerId, JobLocation, StartDate, PlannedFinish, BidPrice, JobStatus from ${this._tableName}`);
            try {
                const result = await statement?.executeAsync();
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
                                StartDate: row.StartDate,
                                PlannedFinish: row.PlannedFinish,
                                BidPrice: row.BidPrice,
                                JobStatus: row.JobStatus,
                            });
                        }
                    });
                }
                status = "Success";
            }
            catch (error) {
                console.error("Error fetching jobs:", error);
                status = "Error";
            }
            finally {
                statement?.finalizeAsync();
            }
        });
        return status;
    }
}
