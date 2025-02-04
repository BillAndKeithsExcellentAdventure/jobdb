import { openDatabaseAsync } from "expo-sqlite"; // Use 'react-native-sqlite-storage' if using React Native
import { JobDB } from "./job";
import { CategoryDB } from "./Category";
import { ItemDB } from "./Item";
import { PictureBucketDB } from "./pictureBucket";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { JobTrakrSampleData } from "./SampleData";
import { DeviceDB } from "./device";
export class JobTrakrDB {
    _db;
    _dbName = "jobdb.db";
    //private _logger: DBLogger | null;
    _deviceId = undefined;
    _userId;
    _jobDB = null;
    _categoryDB = null;
    _itemDB = null;
    _pictureBucketDB = null;
    _deviceDB = null;
    // custId is the customer ID obtained from the OAuth2 login process.
    // This number MUST be unique for each customer. It is used to ensure that each customer's data is kept separate.
    // This id must be a 32 bit integer and will be placed in the upper 32 bits of the 64 bit primary keys
    // found in all the database tables.
    constructor(userId) {
        console.log("Constructing JobTrakrDB");
        this._userId = userId;
        this._db = null;
        //this._logger = new DBLogger(new ConsoleLogStrategy());
        console.log("Done constructing JobTrakrDB");
    }
    DeleteDatabase = async () => {
        console.log("Deleting database");
        try {
            const filename = FileSystem.documentDirectory + `SQLite/${this._dbName}`;
            await FileSystem.deleteAsync(filename);
            console.log(`*********** Database deleted ${filename} ***********`);
        }
        catch (error) {
            console.error("Error deleting database:", error);
        }
    };
    CopyFileToDownloads = async () => {
        try {
            const sourcePath = FileSystem.documentDirectory + `SQLite/${this._dbName}`;
            const targetPath = FileSystem.cacheDirectory + `Download/${this._dbName}`;
            // Ensure target directory exists
            await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + "Download", { intermediates: true });
            // Copy the file
            await FileSystem.copyAsync({
                from: sourcePath,
                to: targetPath,
            });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(targetPath);
            }
            else {
                console.error("Sharing is not available on this device");
            }
            console.log("File copied to:", targetPath);
        }
        catch (error) {
            console.error("Error copying file:", error);
        }
    };
    async OpenDatabase() {
        try {
            console.log(`Opening database ${this._dbName}`);
            this._db = await openDatabaseAsync(this._dbName);
            if (this._db) {
                this.CreateAutoIncrementTable();
            }
            // Get the database id for this device.
            const id = { value: undefined };
            const status = await this.GetDeviceDB().GetDeviceId(id);
            if (status === "Success") {
                this._deviceId = id.value;
            }
            return this._db ? "Success" : "Error";
        }
        catch (error) {
            //this._logger?.log(`Error opening database: ${error}`);
            return "Error";
        }
    }
    GetDb() {
        return this._db;
    }
    CreateAutoIncrementTable() {
        this._db?.execSync("CREATE TABLE IF NOT EXISTS jobtrakr_ids (_id INTEGER PRIMARY KEY AUTOINCREMENT) ");
    }
    GetJobDB() {
        if (this._db && !this._jobDB) {
            this._jobDB = new JobDB(this._db, this._userId);
            this._jobDB.CreateJobTable(); // Ensure the Jobs table exists. It will do a "Create if not exists" operation.
        }
        if (!this._jobDB) {
            throw new Error("JobDB is not initialized");
        }
        return this._jobDB;
    }
    GetCategoryDB() {
        if (this._db && !this._categoryDB) {
            this._categoryDB = new CategoryDB(this._db, this._userId);
            this._categoryDB.CreateCategoryTable(); // Ensure the Category table exists. It will do a "Create if not exists" operation.
        }
        if (!this._categoryDB) {
            throw new Error("CategoryDB is not initialized");
        }
        return this._categoryDB;
    }
    GetItemDB() {
        if (this._db && !this._itemDB) {
            this._itemDB = new ItemDB(this._db, this._userId);
            this._itemDB.CreateItemTable(); // Ensure the Item table exists. It will do a "Create if not exists" operation.
        }
        if (!this._itemDB) {
            throw new Error("ItemDB is not initialized");
        }
        return this._itemDB;
    }
    GetPictureBucketDB() {
        if (this._db && !this._pictureBucketDB) {
            this._pictureBucketDB = new PictureBucketDB(this._db, this._userId);
            this._pictureBucketDB?.CreatePictureBucketTable(); // Ensure the PictureBucket table exists. It will do a "Create if not exists" operation.
        }
        if (!this._pictureBucketDB) {
            throw new Error("PictureBucketDB is not initialized");
        }
        return this._pictureBucketDB;
    }
    GetDeviceDB() {
        if (this._db && !this._deviceDB) {
            this._deviceDB = new DeviceDB(this._db, this._userId);
            this._deviceDB?.CreateDeviceTable(); // Ensure the PictureBucket table exists. It will do a "Create if not exists" operation.
        }
        if (!this._deviceDB) {
            throw new Error("DeviceDB is not initialized");
        }
        return this._deviceDB;
    }
    CreateSampleData = async () => {
        if (this._db) {
            const sampleData = new JobTrakrSampleData(this, this._userId);
            sampleData.CreateSampleData();
        }
    };
}
