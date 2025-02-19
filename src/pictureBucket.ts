import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import { JobTrakrDB, DBStatus } from './jobtrakr';
import { BuildUniqueId } from './dbutils';
import { PictureBucketAsset, PictureBucketData } from './interfaces';
import * as MediaLibrary from 'expo-media-library';

export class PictureBucketDB {
  private _db: SQLiteDatabase | null;
  private _jobTrakrDB: JobTrakrDB | null;
  readonly _tableName = 'picturebucket';
  private _userId: number | undefined;

  public constructor(jt: JobTrakrDB) {
    this._jobTrakrDB = jt;
    this._db = jt.GetDb();
    this._userId = jt.GetUserId();
  }

  // Create a table if it does not exist
  public CreatePictureBucketTable(): DBStatus {
    this._db?.execSync(
      `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
        'userId INTEGER, ' +
        'JobId INTEGER, ' +
        'DeviceId INTEGER, ' +
        'AlbumId TEXT, ' +
        'AssetId TEXT, ' +
        'Longitude NUMBER, ' +
        'Latitude NUMBER, ' +
        'DateAdded Date, ' +
        'PictureDate Date)',
    );

    return 'Success';
  }

  private async GetAssetLatLong(
    photoAsset: MediaLibrary.Asset,
  ): Promise<{ Latitude: number; Longitude: number } | null> {
    try {
      const asset = await MediaLibrary.getAssetInfoAsync(photoAsset.id);
      if (asset && asset.location) {
        const { latitude, longitude } = asset.location;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        return { Latitude: latitude, Longitude: longitude };
      } else {
        console.log('Location information is not available for this asset.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching asset location:', error);
      return null;
    }
  }

  public async InsertPicture(
    jobId: string,
    asset: MediaLibrary.Asset,
  ): Promise<{ status: DBStatus; id: string }> {
    if (!this._db) {
      return { status: 'Error', id: '0' };
    }

    const location: { Latitude: number; Longitude: number } | null = await this.GetAssetLatLong(
      asset,
    );

    console.log('Inserting picture asset:', asset);
    console.log(`    Location: ${location?.Latitude}, ${location?.Longitude}`);

    let status: DBStatus = 'Error';
    let id: string | undefined = '0';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('preparing statement for PictureBucket');
      const statement = await tx.prepareAsync(
        `INSERT INTO ${this._tableName} (_id, userId, DeviceId, JobId, AlbumId, AssetId, DateAdded, Longitude, Latitude, PictureDate) ` +
          ' VALUES ($_id, $userId, $DeviceId, $JobId, $AlbumId, $AssetId, $DateAdded, $Longitude, $Latitude, $PictureDate)',
      );

      console.log('Create PictureBucket statement created');

      try {
        if (this._userId) {
          let uid = await BuildUniqueId(tx, this._userId);
          id = uid.toString();

          const currentDate = new Date();
          const deviceId: string | undefined = this._jobTrakrDB?.GetDeviceId()
            ? this._jobTrakrDB?.GetDeviceId()?.toString()
            : undefined;

          console.log('BuildUniqueId for pictureBucket returned :', uid);
          if (uid > -1n) {
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
              uid.toString(),
              this._userId ? this._userId.toString() : null,
              deviceId ? deviceId : null,
              jobId ? jobId : null,
              asset.albumId ? asset.albumId : null,
              asset.id ? asset.id : null,
              currentDate ? currentDate.toString() : null,
              location?.Longitude ? location.Longitude.toString() : null,
              location?.Latitude ? location.Latitude.toString() : null,
              asset.creationTime ? asset.creationTime.toString() : null,
            );

            status = 'Success';
          }
        }
      } catch (error) {
        status = 'Error';
        console.error('Error creating picture bucket:', error);
      } finally {
        statement.finalizeAsync();
      }
    });

    return { status, id };
  }

  public async UpdateJobId(id: bigint, jobId: bigint): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Updating jobId for picture:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for picture bucket:', id);
      const statement = await tx.prepareAsync(
        `update ${this._tableName} set ` + ' jobId = $JobId ' + ' where _id = $_id',
      );

      console.log('Updating picture bucket statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          JobId: string;
          _id: string;
        }>(jobId ? jobId.toString() : null, id ? id.toString() : null);

        if (result.changes > 0) {
          console.log(`PictureBucket updated: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`PictureBucket updated: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error updating picturebucket:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from update statement:', id);
    return status;
  }

  public async DeletePicture(id: string): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Deleting picture:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for picture:', id);
      const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

      console.log('Delete picture statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          _id: string;
        }>(id ? id : null);

        if (result.changes > 0) {
          console.log(`Picture deleted: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Picture deleted: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error deleting picture:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from delete statement:', id);
    return status;
  }

  private async getAssetById(assetId: string, albumId: string): Promise<MediaLibrary.Asset | null> {
    try {
      const asset = await MediaLibrary.getAssetInfoAsync(assetId);
      if (asset && asset.albumId === albumId) {
        return asset;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching asset by ID: ${error}`);
      return null;
    }
  }

  public async FetchJobAssets(
    jobId: string | undefined,
  ): Promise<{ status: DBStatus; assets: PictureBucketAsset[] | undefined }> {
    if (!this._db) {
      return { status: 'Error', assets: undefined };
    }

    let status: DBStatus = 'Error';
    let assets: PictureBucketAsset[] = [];

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, AlbumId, AssetId from ${this._tableName} where JobId = $JobId and DeviceId = $DeviceId`,
      );

      try {
        if (jobId) {
          const deviceId: string = this._jobTrakrDB?.GetDeviceId()?.toString() || '';

          const result = await statement?.executeAsync<{
            _id: string;
            AlbumId: string;
            AssetId: string;
          }>(jobId, deviceId);

          if (result) {
            await result.getAllAsync().then(async (rows) => {
              for (const row of rows) {
                const asset = await this.getAssetById(row.AssetId, row.AlbumId);
                if (asset) {
                  assets?.push({ _id: row._id, asset });
                }
              }
            });
          }
        }
        status = 'Success';
      } catch (error) {
        console.error('Error fetching assets:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { status, assets };
  }

  public async FetchJobPictures(jobId: string, pictures: PictureBucketData[]): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, userId, DeviceId, JobId, AlbumId, AssetId, DateAdded, Longitude, Latitude, PictureDate from ${this._tableName} where JobId = $JobId`,
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
        }>(jobId);

        if (result) {
          await result.getAllAsync().then((rows) => {
            for (const row of rows) {
              pictures.push({
                _id: row._id,
                JobId: row.JobId,
                DeviceId: row.DeviceId,
                UserId: row.userId,
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
        status = 'Success';
      } catch (error) {
        console.error('Error fetching pictures:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return status;
  }
}
