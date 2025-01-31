import { BuildUniqueId } from "./dbutils";
export class JobDB {
    _db;
    _tableName = "jobs";
    _userId;
    constructor(db, userId) {
        this._db = db;
        this._userId = userId;
    }
    // Create a table if it does not exist
    CreateJobTable() {
        this._db?.execSync(`CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
            "Code TEXT, " +
            "Name TEXT, " +
            "JobTypeId INTEGER, " +
            "UserId INTEGER not null, " +
            "JobLocation TEXT, " +
            "StartDate Date, " +
            "PlannedFinish Date, " +
            "BidPrice NUMBER, " +
            "Longitude NUMBER, " +
            "Latitude NUMBER, " +
            "Radius NUMBER, " +
            "Thumbnail TEXT, " +
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
            console.log("preparing job statement for user: ", this._userId);
            const statement = await tx.prepareAsync(`INSERT INTO ${this._tableName} (_id, code, name, JobTypeId, UserId, JobLocation, StartDate, PlannedFinish, BidPrice, Longitude, Latitude, Radius, Thumbnail, JobStatus) ` +
                " VALUES ($_id, $Code, $Name, $JobTypeId, $UserId, $JobLocation, $StartDate, $PlannedFinish, $BidPrice, $Longitude, $Latitude, $Radius, $Thumbnail, $JobStatus)");
            console.log("CreateJob statement created");
            try {
                job._id = await BuildUniqueId(tx, this._userId);
                id.value = job._id;
                console.log("BuildUniqueId returned :", job._id);
                if (job._id > -1n) {
                    await statement.executeAsync(job._id?.toString(), job.Code, job.Name, job.JobTypeId ? job.JobTypeId.toString() : null, this._userId ? this._userId.toString() : null, job.JobLocation, job.StartDate ? job.StartDate.toString() : null, job.PlannedFinish ? job.PlannedFinish.toString() : null, job.BidPrice ? job.BidPrice.toString() : null, job.Longitude ? job.Longitude.toString() : null, job.Latitude ? job.Latitude.toString() : null, job.Radius ? job.Radius.toString() : null, job.Thumbnail ? job.Thumbnail.toString() : null, job.JobStatus);
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
                " code = $Code, name = $Name, JobTypeId = $JobTypeId, UserId = $UserId, JobLocation = $JobLocation, " +
                " StartDate = $StartDate, PlannedFinish = $PlannedFinish, BidPrice = $BidPrice, JobStatus = $JobStatus, " +
                " Longitude = $Longitude, Latitude = $Latitude, Radius = $Radius" +
                " where _id = $_id");
            console.log("Updating job statement created for:", job._id);
            try {
                let result = await statement.executeAsync(job.Code, job.Name, job.JobTypeId ? job.JobTypeId.toString() : null, this._userId ? this._userId.toString() : null, job.JobLocation, job.StartDate ? job.StartDate.toString() : null, job.PlannedFinish ? job.PlannedFinish.toString() : null, job.BidPrice ? job.BidPrice.toString() : null, job.JobStatus, job.Longitude ? job.Longitude.toString() : null, job.Latitude ? job.Latitude.toString() : null, job.Radius ? job.Radius.toString() : null, job._id ? job._id.toString() : null);
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
    async UpdateLocationInformation(long, lat, radius, id) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        console.log("Updating jobs long/lat/radius:", id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for job:", id);
            const statement = await tx.prepareAsync(`update ${this._tableName} set ` +
                " Longitude = $Longitude, Latitude = $Latitude, Radius = $Radius" +
                " where _id = $_id");
            console.log("Updating job long/lat/radius statement created for:", id);
            try {
                let result = await statement.executeAsync(long ? long.toString() : null, lat ? lat.toString() : null, radius ? radius.toString() : null, id ? id.toString() : null);
                if (result.changes > 0) {
                    console.log(`Job long/lat/radius updated: ${id}. Changes = ${result.changes}`);
                    status = "Success";
                }
                else {
                    console.log(`Job long/lat/radius updated: ${id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            }
            catch (error) {
                console.error("Error updating job long/lat/radius:", error);
                status = "Error";
            }
            finally {
                statement.finalizeAsync();
            }
        });
        console.log("Returning from long/lat/radius update statement:", id);
        return status;
    }
    async UpdateThumbnail(thumbnailInBase64, id) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        console.log("Updating thumbnail for job:", id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await tx.prepareAsync(`update ${this._tableName} set ` + " Thumbnail = $Thumbnail" + " where _id = $_id");
            try {
                let result = await statement.executeAsync(thumbnailInBase64 ? thumbnailInBase64 : null, id ? id.toString() : null);
                if (result.changes > 0) {
                    console.log(`Job thumbnail updated: ${id}. Changes = ${result.changes}`);
                    status = "Success";
                }
                else {
                    console.log(`Job thumbnail updated: ${id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            }
            catch (error) {
                console.error("Error updating job thumbnail:", error);
                status = "Error";
            }
            finally {
                statement.finalizeAsync();
            }
        });
        console.log("Returning from thumbnail update statement:", id);
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
    async FetchThumbnail(id) {
        if (!this._db) {
            return undefined;
        }
        let thumbnail = undefined;
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await this._db?.prepareAsync(`select thumbnail from ${this._tableName} where _id = $id`);
            try {
                const result = await statement?.executeAsync(id.toString());
                if (result) {
                    await result.getFirstAsync().then((row) => (thumbnail = row?.thumbnail));
                }
            }
            catch (error) {
                console.error("Error fetching thumbnail:", error);
            }
            finally {
                statement?.finalizeAsync();
            }
        });
        return thumbnail;
    }
    async FetchAllJobs(jobs) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await this._db?.prepareAsync(`select _id, code, name, JobTypeId, UserId, JobLocation, StartDate, PlannedFinish, BidPrice, Longitude, Latitude, Radius, Thumbnail, JobStatus from ${this._tableName}`);
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
                                UserId: row.UserId,
                                JobLocation: row.JobLocation,
                                StartDate: row.StartDate,
                                PlannedFinish: row.PlannedFinish,
                                BidPrice: row.BidPrice,
                                Longitude: row.Longitude,
                                Latitude: row.Latitude,
                                Radius: row.Radius,
                                Thumbnail: row.Thumbnail,
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
