import { SQLiteDatabase } from "expo-sqlite";
import { DBStatus } from "./jobtrakr";
export declare class DeviceDB {
    private _db;
    readonly _tableName = "devices";
    private _userId;
    constructor(db: SQLiteDatabase, userId: number);
    CreateDeviceTable(): DBStatus;
    private GetDeviceInternalId;
    private AddDevice;
    DeleteDevice(id: bigint): Promise<DBStatus>;
    GetDeviceId(id: {
        value: bigint | undefined;
    }): Promise<DBStatus>;
}
