import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export class DBLogger {
  private _db: SQLiteDatabase | null;
  private _dbName: string = 'job-logger.db';

  public constructor() {
    console.log('Constructing job-logger.db');
    this._db = null;

    console.log('Done constructing job-logger.db');
  }

  public GetLogFileName(): string {
    return FileSystem.documentDirectory + `SQLite/${this._dbName}`;
  }

  public Share = async () => {
    try {
      const sourcePath = this.GetLogFileName();
      const targetPath = FileSystem.cacheDirectory + `Download/${this._dbName}`;

      console.log('Copying file:', sourcePath, 'to:', targetPath);
      // Ensure target directory exists
      await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'Download', {
        intermediates: true,
      });

      // Copy the file
      await FileSystem.copyAsync({
        from: sourcePath,
        to: targetPath,
      });

      console.log('File copied to:', targetPath);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetPath);
        console.log('Done sharing:', targetPath);
      } else {
        console.error('Sharing is not available on this device');
      }

      console.log('File copied to:', targetPath);
    } catch (error) {
      console.error('Error copying file:', getErrorMessage(error));
    }
  };

  public DeleteDatabase = async () => {
    console.log('Deleting database');
    try {
      const filename = this.GetLogFileName();
      await FileSystem.deleteAsync(filename);
      console.log(`*********** Database deleted ${filename} ***********`);
    } catch (error) {
      console.error('Error deleting database:', getErrorMessage(error));
    }
  };

  public CopyFileToDownloads = async () => {
    try {
      const sourcePath = this.GetLogFileName();
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
      console.error('Error copying file:', getErrorMessage(error));
    }
  };

  public async OpenDatabase(replaceExisting: boolean = false): Promise<string> {
    try {
      if (replaceExisting) {
        const filename = this.GetLogFileName();
        console.log('Checking if file exists:', filename);
        const fileInfo = await FileSystem.getInfoAsync(filename);
        if (fileInfo.exists) {
          // If the file exists, delete it
          await FileSystem.deleteAsync(filename);
          console.log('Existing SQLite File deleted successfully');
        }
      }

      console.log(`Opening logging database ${this._dbName}`);
      this._db = await openDatabaseAsync(this._dbName);
      console.log('Opened logging database:', this._dbName);
      if (this._db) {
        this._db.execSync('PRAGMA journal_mode = WAL;');
        this.CreateLogTable();
      }

      return this._db ? 'Success' : 'Error';
    } catch (error) {
      console.error('Error opening logging database:', getErrorMessage(error));
      return 'Error';
    }
  }

  public GetDb(): SQLiteDatabase | null {
    return this._db;
  }

  public CreateLogTable(): void {
    this._db?.execSync(
      "CREATE TABLE IF NOT EXISTS jobtrakr_log (_id INTEGER PRIMARY KEY AUTOINCREMENT, logDate DATE DEFAULT (datetime('now', 'localtime')), msgType string, message TEXT)",
    );
  }

  public async InsertLog(msgType: string, message: string): Promise<string> {
    if (!this._db) {
      return 'Error';
    }

    let status: string = 'Error';
    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this._db.withExclusiveTransactionAsync(async (tx) => {
          const statement = await tx.prepareAsync(
            `INSERT INTO jobtrakr_log (logDate, msgType, message) VALUES (datetime('now', 'localtime'), $msgType, $message)`,
          );

          try {
            await statement.executeAsync({ $msgType: msgType, $message: message });
            status = 'Success';
          } catch (error) {
            console.error('Error inserting log:', getErrorMessage(error));
            status = 'Error';
          } finally {
            statement.finalizeAsync();
          }
        });

        if (status === 'Success') {
          break;
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        if (errorMessage.includes('database is locked')) {
          console.warn(`Database is locked, retrying... (${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms before retrying
        } else {
          console.error('Unexpected error:', errorMessage);
          break;
        }
      }

      attempt++;
    }

    return status;
  }

  public async RemoveOld(days: number): Promise<string> {
    if (!this._db) {
      return 'Error';
    }

    let status: string = 'Error';

    try {
      await this._db.withExclusiveTransactionAsync(async (tx) => {
        const statement = await tx.prepareAsync(
          `DELETE FROM jobtrakr_log WHERE logDate < datetime('now', '-${days} days')`,
        );

        try {
          await statement.executeAsync();
          console.log(`Deleted logs older than ${days} days`);
          status = 'Success';
        } catch (error) {
          console.error('Error deleting old logs:', getErrorMessage(error));
          status = 'Error';
        } finally {
          statement.finalizeAsync();
        }
      });
    } catch (error) {
      console.error('Error in RemoveOld:', getErrorMessage(error));
    }

    return status;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
