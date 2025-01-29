import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite"; // Use 'react-native-sqlite-storage' if using React Native
import { DBStatus } from "./jobtrakr";
import { BuildUniqueId } from "./dbutils";
import { PictureBucketData } from "./interfaces";

export class PictureBucketDB {
    private _db: SQLiteDatabase | null;
    readonly _tableName = "picturebucket";
    private _customerId: number;

    public constructor(db: SQLiteDatabase, custId: number) {
        this._db = db;
        this._customerId = custId;
    }

    // Create a table if it does not exist
    public CreatePictureBucketTable(): DBStatus {
        this._db?.execSync(
            `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
                "CustomerId INTEGER, " +
                "JobId INTEGER, " +
                "DeviceId INTEGER, " +
                "FolderName TEXT, " +
                "PictureName TEXT, " +
                "DateAdded Date, " +
                "PictureDate Date"
        );

        return "Success";
    }

    public async InsertPicture(id: { value: bigint }, pict: PictureBucketData): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }
        console.log("Inserting picture:", pict);

        let status: DBStatus = "Error";

        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("preparing statement for PictureBucket");
            const statement = await tx.prepareAsync(
                `INSERT INTO ${this._tableName} (_id, CustomerId, DeviceId, JobId, FolderName, PictureName, DateAdded, PictureDate) ` +
                    " VALUES ($_id, $CustomerId, $DeviceId, $JobId, $FolderName, $PictureName, $DateAdded, $PictureDate)"
            );

            console.log("Create PictureBucket statement created");

            try {
                pict._id = await BuildUniqueId(tx, this._customerId);

                id.value = pict._id;

                console.log("BuildUniqueId for pictureBucket returned :", pict._id);
                if (pict._id > -1n) {
                    await statement.executeAsync<{
                        _id: string;
                        CustomerId: string;
                        DeviceId: string;
                        JobId: string;
                        FolderName: string;
                        PictureName: string;
                        DateAdded?: Date;
                        PictureDate?: Date;
                    }>(
                        pict._id?.toString(),
                        pict.CustomerId ? pict.CustomerId.toString() : null,
                        pict.DeviceId ? pict.DeviceId.toString() : null,
                        pict.JobId ? pict.JobId.toString() : null,
                        pict.FolderName,
                        pict.PictureName,
                        pict.DateAdded ? pict.DateAdded.toString() : null,
                        pict.PictureDate ? pict.PictureDate.toString() : null
                    );

                    status = "Success";
                }
            } catch (error) {
                status = "Error";
                console.error("Error creating picture bucket:", error);
            } finally {
                statement.finalizeAsync();
            }
        });

        return status;
    }

    public async UpdateJobId(id: bigint, jobId: bigint): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }

        let status: DBStatus = "Error";

        console.log("Updating jobId for picture:", id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for picture bucket:", id);
            const statement = await tx.prepareAsync(
                `update ${this._tableName} set ` + " jobId = $JobId " + " where _id = $_id"
            );

            console.log("Updating picture bucket statement created for:", id);

            try {
                let result = await statement.executeAsync<{
                    JobId: string;
                    _id: string;
                }>(jobId ? jobId.toString() : null, id ? id.toString() : null);

                if (result.changes > 0) {
                    console.log(`PictureBucket updated: ${id}. Changes = ${result.changes}`);
                    status = "Success";
                } else {
                    console.log(`PictureBucket updated: ${id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            } catch (error) {
                console.error("Error updating picturebucket:", error);
                status = "Error";
            } finally {
                statement.finalizeAsync();
            }
        });

        console.log("Returning from update statement:", id);
        return status;
    }

    public async DeletePicture(id: bigint): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }

        let status: DBStatus = "Error";

        console.log("Deleting picture:", id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for picture:", id);
            const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

            console.log("Delete picture statement created for:", id);

            try {
                let result = await statement.executeAsync<{
                    _id: string;
                }>(id ? id.toString() : null);

                if (result.changes > 0) {
                    console.log(`Picture deleted: ${id}. Changes = ${result.changes}`);
                    status = "Success";
                } else {
                    console.log(`Picture deleted: ${id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            } catch (error) {
                console.error("Error deleting picture:", error);
                status = "Error";
            } finally {
                statement.finalizeAsync();
            }
        });

        console.log("Returning from delete statement:", id);
        return status;
    }

    public async FetchAllPictures(jobId: bigint, pictures: PictureBucketData[]): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }

        let status: DBStatus = "Error";

        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await this._db?.prepareAsync(
                `select _id, CustomerId, DeviceId, JobId, FolderName, PictureName, DateAdded, PictureDate from ${this._tableName} where JobId = $JobId`
            );

            try {
                const result = await statement?.executeAsync<{
                    _id: string;
                    CustomerId: string;
                    DeviceId: string;
                    JobId: string;
                    FolderName: string;
                    PictureName: string;
                    DateAdded: Date;
                    PictureDate: Date;
                }>(jobId.toString());

                if (result) {
                    await result.getAllAsync().then((rows) => {
                        for (const row of rows) {
                            pictures.push({
                                _id: BigInt(row._id),
                                JobId: BigInt(row.JobId),
                                DeviceId: BigInt(row.DeviceId),
                                CustomerId: BigInt(row.CustomerId),
                                FolderName: row.FolderName,
                                PictureName: row.PictureName,
                                DateAdded: row.DateAdded,
                                PictureDate: row.PictureDate,
                            });
                        }
                    });
                }
                status = "Success";
            } catch (error) {
                console.error("Error fetching pictures:", error);
                status = "Error";
            } finally {
                statement?.finalizeAsync();
            }
        });

        return status;
    }
}
