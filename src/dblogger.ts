import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type DBStatus = 'Success' | 'Error' | 'NoChanges';

export class DBLogger {
  private _db: SQLiteDatabase | null;
  private _dbName: string = 'job-logger.db';

  public constructor() {
    console.log('Constructing job-logger.db');
    this._db = null;

    console.log('Done constructing job-logger.db');
  }

  public DeleteDatabase = async () => {
    console.log('Deleting database');
    try {
      const filename = FileSystem.cacheDirectory + `SQLite/${this._dbName}`;
      await FileSystem.deleteAsync(filename);
      console.log(`*********** Database deleted ${filename} ***********`);
    } catch (error) {
      console.error('Error deleting database:', error);
    }
  };

  public CopyFileToDownloads = async () => {
    try {
      const sourcePath = FileSystem.cacheDirectory + `SQLite/${this._dbName}`;
      const targetPath = FileSystem.cacheDirectory + `Download/${this._dbName}`;

      // Ensure target directory exists
      await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'Download', {
        intermediates: true,
      });

      // Copy the file
      await FileSystem.copyAsync({
        from: sourcePath,
        to: targetPath,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetPath);
      } else {
        console.error('Sharing is not available on this device');
      }

      console.log('File copied to:', targetPath);
    } catch (error) {
      console.error('Error copying file:', error);
    }
  };

  public async OpenDatabase(
    createSample: boolean = false,
    replaceExisting: boolean = false,
  ): Promise<DBStatus> {
    try {
      if (replaceExisting) {
        const filename = FileSystem.documentDirectory + `SQLite/${this._dbName}`;
        const fileInfo = await FileSystem.getInfoAsync(filename);
        if (fileInfo.exists) {
          // If the file exists, delete it
          await FileSystem.deleteAsync(filename);
          console.log('Existing SQLite File deleted successfully');
        }
      }

      console.log(`Opening database ${this._dbName}`);
      this._db = await openDatabaseAsync(this._dbName);
      if (this._db) {
        this.CreateLogTable();
      }

      return this._db ? 'Success' : 'Error';
    } catch (error) {
      //this._logger?.log(`Error opening database: ${error}`);
      return 'Error';
    }
  }

  public GetDb(): SQLiteDatabase | null {
    return this._db;
  }

  public CreateLogTable(): void {
    this._db?.execSync('CREATE TABLE IF NOT EXISTS jobtrakr_log () ');
  }

  public GetJobDB(): JobDB {
    if (this._db && !this._jobDB) {
      this._jobDB = new JobDB(this);
      this._jobDB.CreateJobTable(); // Ensure the Jobs table exists. It will do a "Create if not exists" operation.
    }

    if (!this._jobDB) {
      throw new Error('JobDB is not initialized');
    }

    return this._jobDB;
  }

  public GetCategoryDB(): CategoryDB {
    if (this._db && !this._categoryDB) {
      this._categoryDB = new CategoryDB(this);
      this._categoryDB.CreateCategoryTable(); // Ensure the Category table exists. It will do a "Create if not exists" operation.
    }

    if (!this._categoryDB) {
      throw new Error('CategoryDB is not initialized');
    }

    return this._categoryDB;
  }

  public GetItemDB(): ItemDB {
    if (this._db && !this._itemDB) {
      this._itemDB = new ItemDB(this);
      this._itemDB.CreateItemTable(); // Ensure the Item table exists. It will do a "Create if not exists" operation.
    }

    if (!this._itemDB) {
      throw new Error('ItemDB is not initialized');
    }

    return this._itemDB;
  }

  public GetPictureBucketDB(): PictureBucketDB {
    if (this._db && !this._pictureBucketDB) {
      this._pictureBucketDB = new PictureBucketDB(this);
      this._pictureBucketDB?.CreatePictureBucketTable(); // Ensure the PictureBucket table exists. It will do a "Create if not exists" operation.
    }

    if (!this._pictureBucketDB) {
      throw new Error('PictureBucketDB is not initialized');
    }

    return this._pictureBucketDB;
  }

  public GetReceiptBucketDB(): ReceiptBucketDB {
    if (this._db && !this._receiptBucketDB) {
      this._receiptBucketDB = new ReceiptBucketDB(this);
      this._receiptBucketDB?.CreateReceiptBucketTable(); // Ensure the ReceipitBucket table exists. It will do a "Create if not exists" operation.
    }

    if (!this._receiptBucketDB) {
      throw new Error('ReceiptBucketDB is not initialized');
    }

    return this._receiptBucketDB;
  }

  public GetDeviceDB(): DeviceDB {
    if (this._db && !this._deviceDB) {
      this._deviceDB = new DeviceDB(this);
      this._deviceDB?.CreateDeviceTable(); // Ensure the Device table exists. It will do a "Create if not exists" operation.
    }

    if (!this._deviceDB) {
      throw new Error('DeviceDB is not initialized');
    }

    return this._deviceDB;
  }

  public GetTodoDB(): TodoDB {
    if (this._db && !this._todoDB) {
      this._todoDB = new TodoDB(this);
      this._todoDB.CreateTodoTable(); // Ensure the Todo table exists. It will do a "Create if not exists" operation.
    }

    if (!this._todoDB) {
      throw new Error('TodoDB is not initialized');
    }

    return this._todoDB;
  }

  public GetVendorDB(): VendorDB {
    if (this._db && !this._vendorDB) {
      this._vendorDB = new VendorDB(this);
      this._vendorDB.CreateVendorTable(); // Ensure the Vendor table exists. It will do a "Create if not exists" operation.
    }

    if (!this._vendorDB) {
      throw new Error('VendorDB is not initialized');
    }

    return this._vendorDB;
  }

  public CreateSampleData = async () => {
    if (this._db) {
      const sampleData = new JobTrakrSampleData(this);
      sampleData.CreateSampleData();
    }
  };
}
