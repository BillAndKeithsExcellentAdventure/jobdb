import { BuildUniqueId } from "./dbutils";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";
export class DeviceDB {
    _db;
    _tableName = "devices";
    _userId;
    constructor(db, userId) {
        this._db = db;
        this._userId = userId;
    }
    // Create a table if it does not exist
    CreateDeviceTable() {
        this._db?.execSync(`CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
            "UserId INTEGER not null, " +
            "Name TEXT, " +
            "DeviceId TEXT, " +
            "DeviceType TEXT)");
        return "Success";
    }
    async GetDeviceInternalId() {
        if (Platform.OS === "android") {
            return Application.getAndroidId();
        }
        else if (Platform.OS === "ios") {
            return Application.getIosIdForVendorAsync();
        }
        return "Unknown"; // Probably should mark all desktop computers as something like "Desktop" or "Cloud". I don't see users capturing photos on a desktop.
    }
    async AddDevice(id, deviceId) {
        if (!this._db) {
            return "Error";
        }
        console.log(`"Adding device: ${deviceId}, ${Platform.OS}`);
        let status = "Error";
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("preparing device statement for user: ", this._userId);
            const statement = await tx.prepareAsync(`INSERT INTO ${this._tableName} (_id, UserId, Name, DeviceId, DeviceType) ` +
                " VALUES ($_id, $UserId, $Name, $DeviceId, $DeviceType)");
            console.log("CreateDevice statement created");
            try {
                id.value = await BuildUniqueId(tx, this._userId);
                console.log("BuildUniqueId returned :", id.value);
                if (id.value > -1n) {
                    await statement.executeAsync(id.value?.toString(), this._userId.toString(), Device.deviceName, deviceId, Platform.OS);
                    status = "Success";
                }
            }
            catch (error) {
                status = "Error";
                console.error("Error creating device:", error);
            }
            finally {
                statement.finalizeAsync();
            }
        });
        return status;
    }
    async DeleteDevice(id) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        console.log("Deleting device:", id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for device:", id);
            const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);
            console.log("Delete device statement created for:", id);
            try {
                let result = await statement.executeAsync(id ? id.toString() : null);
                if (result.changes > 0) {
                    console.log(`Device deleted: ${id}. Changes = ${result.changes}`);
                    status = "Success";
                }
                else {
                    console.log(`Device deleted: ${id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            }
            catch (error) {
                console.error("Error deleting device:", error);
                status = "Error";
            }
            finally {
                statement.finalizeAsync();
            }
        });
        console.log("Returning from delete statement:", id);
        return status;
    }
    async GetDeviceId(id) {
        if (!this._db) {
            return "Error";
        }
        const deviceInternalId = await this.GetDeviceInternalId();
        if (!deviceInternalId) {
            return "Error";
        }
        let bStatus = "Error";
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await this._db?.prepareAsync(`select _id from ${this._tableName} where DeviceId = $deviceId`);
            try {
                const result = await statement?.executeAsync(deviceInternalId);
                if (result) {
                    await result.getFirstAsync().then((row) => {
                        id.value = row?._id;
                    });
                    if (id?.value ? id.value : 0 > 0n) {
                        bStatus = "Success";
                    }
                    else {
                        bStatus = await this.AddDevice(id, deviceInternalId);
                    }
                }
            }
            catch (error) {
                console.error("Error fetching deviceid:", error);
            }
            finally {
                statement?.finalizeAsync();
            }
        });
        return bStatus;
    }
}
