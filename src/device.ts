import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import { JobTrakrDB, DBStatus } from './jobtrakr';
import { BuildUniqueId } from './dbutils';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export class DeviceDB {
  private _db: SQLiteDatabase | null;
  private _jobTrakr: JobTrakrDB | null;
  readonly _tableName = 'devices';
  private _userId: number | undefined;

  public constructor(jobTrakr: JobTrakrDB) {
    this._jobTrakr = jobTrakr;
    this._db = this._jobTrakr.GetDb();
    this._userId = this._jobTrakr.GetUserId();
  }

  // Create a table if it does not exist
  public CreateDeviceTable(): DBStatus {
    this._db?.execSync(
      `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
        'UserId INTEGER not null, ' +
        'Name TEXT, ' +
        'DeviceId TEXT, ' +
        'DeviceType TEXT)',
    );

    return 'Success';
  }

  private async GetDeviceInternalId(): Promise<string | null> {
    if (Platform.OS === 'android') {
      return Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      return Application.getIosIdForVendorAsync();
    }

    return 'Unknown'; // Probably should mark all desktop computers as something like "Desktop" or "Cloud". I don't see users capturing photos on a desktop.
  }

  private async AddDevice(deviceId: string | null): Promise<{ id: string; status: DBStatus }> {
    if (!this._db) {
      return { id: '0', status: 'Error' };
    }

    let newId: bigint = 0n;
    console.log(`"Adding device: ${deviceId}, ${Platform.OS}`);

    let status: DBStatus = 'Error';
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('preparing device statement for user: ', this._userId);
      const statement = await tx.prepareAsync(
        `INSERT INTO ${this._tableName} (_id, UserId, Name, DeviceId, DeviceType) ` +
          ' VALUES ($_id, $UserId, $Name, $DeviceId, $DeviceType)',
      );

      console.log('CreateDevice statement created');

      try {
        if (this._userId) {
          newId = await BuildUniqueId(tx, this._userId);

          console.log('BuildUniqueId returned :', newId);
          if (newId > -1n) {
            await statement.executeAsync<{
              _id: string;
              UserId: string;
              Name: string;
              DeviceId: string;
              DeviceType: string;
            }>(newId.toString(), this._userId.toString(), Device.deviceName, deviceId, Platform.OS);

            status = 'Success';
          }
        }
      } catch (error) {
        status = 'Error';
        console.error('Error creating device:', error);
      } finally {
        statement.finalizeAsync();
      }
    });

    return { id: newId.toString(), status };
  }

  public async DeleteDevice(id: string): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Deleting device:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for device:', id);
      const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

      console.log('Delete device statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          _id: string;
        }>(id ? id.toString() : null);

        if (result.changes > 0) {
          console.log(`Device deleted: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Device deleted: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error deleting device:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from delete statement:', id);
    return status;
  }

  public async GetDeviceId(): Promise<{ id: string; status: DBStatus }> {
    if (!this._db) {
      return { id: '0', status: 'Error' };
    }

    const deviceInternalId: string | null = await this.GetDeviceInternalId();

    if (!deviceInternalId) {
      return { id: '0', status: 'Error' };
    }

    let bStatus: DBStatus = 'Error';
    let newId: string = '0';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id from ${this._tableName} where DeviceId = $deviceId`,
      );

      try {
        const result = await statement?.executeAsync<{
          _id: string;
        }>(deviceInternalId);

        if (result) {
          await result.getFirstAsync().then((row) => {
            newId = row?._id ? row?._id : '0';
          });

          if (newId ? newId : 0 > 0n) {
            bStatus = 'Success';
          } else {
            let newDeviceId = await this.AddDevice(deviceInternalId);
            if (newDeviceId.status === 'Success') {
              bStatus = 'Success';
              newId = newDeviceId.id;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching deviceid:', error);
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { id: newId, status: bStatus };
  }
}
