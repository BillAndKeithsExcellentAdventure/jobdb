import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite"; // Use 'react-native-sqlite-storage' if using React Native
import { JobTrakrDB, DBStatus } from "./jobtrakr";
import { BuildUniqueId } from "./dbutils";
import { PictureBucketData } from "./interfaces";
import * as MediaLibrary from "expo-media-library";

export class PictureBucketDB {
    private _db: SQLiteDatabase | null;
    private _jobTrakrDB: JobTrakrDB | null;
    readonly _tableName = "picturebucket";
    private _userId: number;

    public constructor(jt: JobTrakrDB, custId: number) {
        this._jobTrakrDB = jt;
        this._db = jt.GetDb();
        this._userId = custId;
    }

    // Create a table if it does not exist
    public CreatePictureBucketTable(): DBStatus {
        this._db?.execSync(
            `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
                "userId INTEGER, " +
                "JobId INTEGER, " +
                "DeviceId INTEGER, " +
                "AlbumId TEXT, " +
                "AssetId TEXT, " +
                "Longitude NUMBER, " +
                "Latitude NUMBER, " +
                "DateAdded Date, " +
                "PictureDate Date)"
        );

        return "Success";
    }

    private async GetAssetLatLong(
        photoAsset: MediaLibrary.Asset
    ): Promise<{ Latitude: number; Longitude: number } | null> {
        try {
            const asset = await MediaLibrary.getAssetInfoAsync(photoAsset.id);
            if (asset && asset.location) {
                const { latitude, longitude } = asset.location;
                console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
                return { Latitude: latitude, Longitude: longitude };
            } else {
                console.log("Location information is not available for this asset.");
                return null;
            }
        } catch (error) {
            console.error("Error fetching asset location:", error);
            return null;
        }
    }

    public async InsertPicture(id: { value: bigint }, jobId: bigint, asset: MediaLibrary.Asset): Promise<DBStatus> {
        if (!this._db) {
            return "Error";
        }

        const location: { Latitude: number; Longitude: number } | null = await this.GetAssetLatLong(asset);

        console.log("Inserting picture asset:", asset);
        console.log(`    Location: ${location?.Latitude}, ${location?.Longitude}`);

        let status: DBStatus = "Error";

        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("preparing statement for PictureBucket");
            const statement = await tx.prepareAsync(
                `INSERT INTO ${this._tableName} (_id, userId, DeviceId, JobId, AlbumId, AssetId, DateAdded, Longitude, Latitude, PictureDate) ` +
                    " VALUES ($_id, $userId, $DeviceId, $JobId, $AlbumId, $AssetId, $DateAdded, $Longitude, $Latitude, $PictureDate)"
            );

            console.log("Create PictureBucket statement created");

            try {
                id.value = await BuildUniqueId(tx, this._userId);

                const currentDate = new Date();
                const deviceId: string | undefined = this._jobTrakrDB?.GetDeviceId()
                    ? this._jobTrakrDB?.GetDeviceId()?.toString()
                    : undefined;

                console.log("BuildUniqueId for pictureBucket returned :", id.value);
                if (id.value > -1n) {
                    await statement.executeAsync<{
                        _id: string;
                        UserId: string;
                        DeviceId: string;
                        JobId: string;
                        AlbumId: string;
                        AssetId: string;
                        DateAdded?: Date;
                        Longitude?: number;
                        Latitude?: number;
                        PictureDate?: Date;
                    }>(
                        id.value.toString(),
                        this._userId ? this._userId.toString() : null,
                        deviceId ? deviceId : null,
                        jobId ? jobId.toString() : null,
                        asset.albumId ? asset.albumId : null,
                        asset.id ? asset.id : null,
                        currentDate ? currentDate.toString() : null,
                        location?.Longitude ? location.Longitude.toString() : null,
                        location?.Latitude ? location.Latitude.toString() : null,
                        asset.creationTime ? asset.creationTime.toString() : null
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
                `select _id, userId, DeviceId, JobId, AlbumId, AssetId, DateAdded, Longitude, Latitude, PictureDate from ${this._tableName} where JobId = $JobId`
            );

            try {
                const result = await statement?.executeAsync<{
                    _id: string;
                    userId: string;
                    DeviceId: string;
                    JobId: string;
                    AlbumId: string;
                    AssetId: string;
                    DateAdded: Date;
                    Longitude: number;
                    Latitude: number;
                    PictureDate: Date;
                }>(jobId.toString());

                if (result) {
                    await result.getAllAsync().then((rows) => {
                        for (const row of rows) {
                            pictures.push({
                                _id: BigInt(row._id),
                                JobId: BigInt(row.JobId),
                                DeviceId: BigInt(row.DeviceId),
                                UserId: BigInt(row.userId),
                                AlbumId: row.AlbumId,
                                AssetId: row.AssetId,
                                DateAdded: row.DateAdded,
                                Longitude: row.Longitude,
                                Latitude: row.Latitude,
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
