import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import { JobTrakrDB, DBStatus } from './jobtrakr';
import { BuildUniqueId } from './dbutils';
import { ReceiptBucketData } from './interfaces';
import * as MediaLibrary from 'expo-media-library';

export class ReceiptBucketDB {
  private _db: SQLiteDatabase | null;
  private _jobTrakrDB: JobTrakrDB | null;
  readonly _tableName = 'receiptbucket';
  private _userId: number | undefined;

  public constructor(jt: JobTrakrDB) {
    this._jobTrakrDB = jt;
    this._db = jt.GetDb();
    this._userId = jt.GetUserId();
  }

  // Create a table if it does not exist
  public CreateReceiptBucketTable(): DBStatus {
    this._db?.execSync(
      `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
        'userId INTEGER, ' +
        'JobId INTEGER, ' +
        'DeviceId INTEGER, ' +
        'Amount NUMBER, ' +
        'Vendor TEXT, ' +
        'Description TEXT, ' +
        'Notes TEXT, ' +
        'CategoryId NUMBER, ' +
        'ItemId NUMBER, ' +
        'AssetId TEXT, ' +
        'AlbumId TEXT, ' +
        'PictureUri TEXT) ',
    );

    return 'Success';
  }

  public async InsertReceipt(
    jobId: string,
    receipt: ReceiptBucketData,
  ): Promise<{ status: DBStatus; id: string }> {
    if (!this._db) {
      return { status: 'Error', id: '0' };
    }

    console.log('Inserting receipt asset:', receipt);

    let status: DBStatus = 'Error';
    let id: string | undefined = '0';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('preparing statement for ReceiptBucket');
      const statement = await tx.prepareAsync(
        `INSERT INTO ${this._tableName} (_id, userId, DeviceId, JobId, Vendor, Amount, Description, Notes, CategoryId, ItemId, AssetId, AlbumId, PictureUri) ` +
          ' VALUES ($_id, $userId, $DeviceId, $JobId, $Vendor, $Amount, $Description, $Notes, $CategoryId, $ItemId, $AssetId, $AlbumId, $PictureUri)',
      );

      console.log('Create ReceiptBucket statement created');

      try {
        if (this._userId) {
          let uid = await BuildUniqueId(tx, this._userId);
          id = uid.toString();

          const currentDate = new Date();
          const deviceId: string | undefined = this._jobTrakrDB?.GetDeviceId()
            ? this._jobTrakrDB?.GetDeviceId()?.toString()
            : undefined;

          console.log('BuildUniqueId for receiptBucket returned :', uid);
          if (uid > -1n) {
            await statement.executeAsync<{
              _id: string;
              UserId: string;
              DeviceId: string;
              JobId: string;
              Amount: number;
              Vendor: string;
              Description?: string;
              Notes?: string;
              CategoryId?: number;
              ItemId?: number;
              AssetId?: string;
              AlbumId?: string;
              PictureUri?: string;
            }>(
              uid.toString(),
              this._userId ? this._userId.toString() : null,
              deviceId ? deviceId : null,
              jobId ? jobId : null,
              receipt.Vendor ? receipt.Vendor : null,
              receipt.Amount ? receipt.Amount : null,
              receipt.Description ? receipt.Description : null,
              receipt.Notes ? receipt.Notes : null,
              receipt?.CategoryId ? receipt.CategoryId.toString() : null,
              receipt?.ItemId ? receipt.ItemId.toString() : null,
              receipt.AssetId ? receipt.AssetId : null,
              receipt.AlbumId ? receipt.AlbumId : null,
              receipt.PictureUri ? receipt.PictureUri : null,
            );

            status = 'Success';
          }
        }
      } catch (error) {
        status = 'Error';
        console.error('Error creating receipt bucket:', error);
      } finally {
        statement.finalizeAsync();
      }
    });

    return { status, id };
  }

  public async UpdateReceipt(receipt: ReceiptBucketData): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Updating receipt:', receipt._id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for receipt:', receipt._id);
      const statement = await tx.prepareAsync(
        `update ${this._tableName} set ` +
          ' DeviceId = $DeviceId, JobId = $JobId, Amount = $Amount, Vendor = $Vendor, Description = $Description,' +
          ' Notes = $Notes, CategoryId = $CategoryId, ItemId = $ItemId, AssetId = $AssetId, ' +
          ' AlbumId = $AlbumId, PictureUri = $PictureUri ' +
          ' where _id = $_id',
      );

      console.log('Updating receipt statement created for:', receipt._id);

      try {
        let result = await statement.executeAsync<ReceiptBucketData>(
          receipt.DeviceId ? receipt.DeviceId : null,
          receipt.JobId ? receipt.JobId.toString() : null,
          receipt.Amount ? receipt.Amount : null,
          receipt.Vendor ? receipt.Vendor : null,
          receipt.Description ? receipt.Description : null,
          receipt.Notes ? receipt.Notes : null,
          receipt.CategoryId ? receipt.CategoryId.toString() : null,
          receipt.ItemId ? receipt.ItemId.toString() : null,
          receipt.AssetId ? receipt.AssetId.toString() : null,
          receipt.AlbumId ? receipt.AlbumId.toString() : null,
          receipt.PictureUri ? receipt.PictureUri : null,
          receipt._id ? receipt._id.toString() : null,
        );

        if (result.changes > 0) {
          console.log(`Receipt updated: ${receipt._id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Receipt updated: ${receipt._id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error updating receipt:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from update statement:', receipt._id);
    return status;
  }

  public async UpdateJobId(id: bigint, jobId: bigint): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Updating jobId for receipt:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for picture bucket:', id);
      const statement = await tx.prepareAsync(
        `update ${this._tableName} set ` + ' jobId = $JobId ' + ' where _id = $_id',
      );

      console.log('Updating receipt bucket statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          JobId: string;
          _id: string;
        }>(jobId ? jobId.toString() : null, id ? id.toString() : null);

        if (result.changes > 0) {
          console.log(`ReceiptBucket updated: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`ReceiptBucket updated: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error updating receiptbucket:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from update statement:', id);
    return status;
  }

  public async DeleteReceipt(id: string): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Deleting receipt:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for picture:', id);
      const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

      console.log('Delete receipt statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          _id: string;
        }>(id ? id : null);

        if (result.changes > 0) {
          console.log(`Receipt deleted: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Receipt deleted: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error deleting Receipt:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from delete statement:', id);
    return status;
  }

  public async FetchJobReceipts(
    jobId: string | undefined,
  ): Promise<{ status: DBStatus; data: ReceiptBucketData[] | undefined }> {
    if (!this._db) {
      return { status: 'Error', data: undefined };
    }

    let status: DBStatus = 'Error';
    let data: ReceiptBucketData[] = [];

    console.log('Fetching receipts');

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, UserId, JobId, DeviceId, Amount, Vendor, Description, Notes, CategoryId, ItemId, AssetId, AlbumId, PictureUri from ${this._tableName} where JobId = $JobId`,
      );
      console.log('done building prepare statement for receipts');
      try {
        if (jobId) {
          const result = await statement?.executeAsync<{
            _id?: string;
            UserId?: string;
            JobId?: string;
            DeviceId?: string;
            Amount?: number;
            Vendor?: string;
            Description?: string;
            Notes?: string;
            CategoryId?: string;
            ItemId?: string;
            AssetId: string;
            AlbumId: string;
            PictureUri: string;
          }>(jobId);

          if (result) {
            await result.getAllAsync().then(async (rows) => {
              for (const row of rows) {
                console.log('Receipt Row:', row);
                data?.push(row);
              }
            });
          }
        }
        status = 'Success';
      } catch (error) {
        console.error('Error fetching receipts:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { status, data };
  }

  public async FetchJobReceipt(
    receiptId: string | undefined,
  ): Promise<{ status: DBStatus; data: ReceiptBucketData | undefined }> {
    if (!this._db) {
      return { status: 'Error', data: undefined };
    }

    let status: DBStatus = 'Error';
    let data: ReceiptBucketData | undefined = undefined;

    console.log(`Fetching receipt ${receiptId}`);

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, UserId, JobId, DeviceId, Amount, Vendor, Description, Notes, CategoryId, ItemId, AssetId, AlbumId, PictureUri from ${this._tableName} where _id = $_id`,
      );
      console.log('done building prepare statement for receipts');
      try {
        if (receiptId) {
          const result = await statement?.executeAsync<{
            _id?: string;
            UserId?: string;
            JobId?: string;
            DeviceId?: string;
            Amount?: number;
            Vendor?: string;
            Description?: string;
            Notes?: string;
            CategoryId?: string;
            ItemId?: string;
            AssetId: string;
            AlbumId: string;
            PictureUri: string;
          }>(receiptId);

          if (result) {
            await result.getFirstAsync().then(async (row) => {
              console.log('Receipt Row:', row);
              if (row) {
                data = row;
              }
            });
          }
        }
        status = 'Success';
      } catch (error) {
        console.error('Error fetching receipt:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { status, data };
  }
}
