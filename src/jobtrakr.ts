import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import { JobDB } from './job';
import { CategoryDB } from './Category';
import { ItemDB } from './Item';
import { PictureBucketDB } from './pictureBucket';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { JobTrakrSampleData } from './SampleData';
import { DeviceDB } from './device';
import { TodoDB } from './todo';
import { JobData } from './interfaces';

export type DBStatus = 'Success' | 'Error' | 'NoChanges';

export class JobTrakrDB {
  private _db: SQLiteDatabase | null;
  private _dbName: string = 'jobdb.db';
  //private _logger: DBLogger | null;
  private _deviceId: bigint | undefined = undefined;
  private _userId: number;
  private _jobDB: JobDB | null = null;
  private _categoryDB: CategoryDB | null = null;
  private _itemDB: ItemDB | null = null;
  private _pictureBucketDB: PictureBucketDB | null = null;
  private _deviceDB: DeviceDB | null = null;
  private _todoDB: TodoDB | null = null;

  // custId is the customer ID obtained from the OAuth2 login process.
  // This number MUST be unique for each customer. It is used to ensure that each customer's data is kept separate.
  // This id must be a 32 bit integer and will be placed in the upper 32 bits of the 64 bit primary keys
  // found in all the database tables.
  public constructor(userId: number) {
    console.log('Constructing JobTrakrDB');
    this._userId = userId;
    this._db = null;
    //this._logger = new DBLogger(new ConsoleLogStrategy());

    console.log('Done constructing JobTrakrDB');
  }

  public DeleteDatabase = async () => {
    console.log('Deleting database');
    try {
      const filename = FileSystem.documentDirectory + `SQLite/${this._dbName}`;
      await FileSystem.deleteAsync(filename);
      console.log(`*********** Database deleted ${filename} ***********`);
    } catch (error) {
      console.error('Error deleting database:', error);
    }
  };

  public CopyFileToDownloads = async () => {
    try {
      const sourcePath = FileSystem.documentDirectory + `SQLite/${this._dbName}`;
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
        this.CreateAutoIncrementTable();
      }

      // Get the database id for this device.
      const id: { value: bigint | undefined } = { value: undefined };
      const status: DBStatus = await this.GetDeviceDB().GetDeviceId(id);
      if (status === 'Success') {
        this._deviceId = id.value;

        if (createSample) {
          const jobs = await this.GetJobDB().FetchAllJobs();
          if (jobs.status === 'Success' && jobs.jobs.length === 0) {
            await this.CreateSampleData();
          }
        }
      }

      return this._db ? 'Success' : 'Error';
    } catch (error) {
      //this._logger?.log(`Error opening database: ${error}`);
      return 'Error';
    }
  }

  public GetDeviceId(): bigint | undefined {
    return this._deviceId;
  }

  public GetUserId(): number | undefined {
    return this._userId;
  }

  public GetDb(): SQLiteDatabase | null {
    return this._db;
  }

  public CreateAutoIncrementTable(): void {
    this._db?.execSync(
      'CREATE TABLE IF NOT EXISTS jobtrakr_ids (_id INTEGER PRIMARY KEY AUTOINCREMENT) ',
    );
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

  public CreateSampleData = async () => {
    if (this._db) {
      const sampleData = new JobTrakrSampleData(this);
      sampleData.CreateSampleData();
    }
  };
}
