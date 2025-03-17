import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import { JobTrakrDB, DBStatus } from './jobtrakr';
import { BuildUniqueId } from './dbutils';
import { JobCategoryItemData } from './interfaces';

export class ItemDB {
  private _db: SQLiteDatabase | null;
  private _jobTrakr: JobTrakrDB | null;
  readonly _tableName = 'items';
  private _userId: number | undefined;

  public constructor(jobTrakr: JobTrakrDB) {
    this._jobTrakr = jobTrakr;
    this._db = this._jobTrakr.GetDb();
    this._userId = this._jobTrakr.GetUserId();
  }

  // Create a table if it does not exist
  public CreateItemTable(): DBStatus {
    this._db?.execSync(
      `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
        'CategoryId INTEGER, ' +
        'Code TEXT, ' +
        'ItemName TEXT, ' +
        'EstPrice NUMBER, ' +
        'ItemStatus TEXT)',
    );

    return 'Success';
  }

  public async CreateItem(item: JobCategoryItemData): Promise<{ status: DBStatus; id: string }> {
    if (!this._db) {
      return { status: 'Error', id: '0' };
    }
    console.log('Creating item:', item);

    let status: DBStatus = 'Error';
    let id: string | undefined = '0';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('preparing statement for item');
      const statement = await tx.prepareAsync(
        `INSERT INTO ${this._tableName} (_id, Code, CategoryId, ItemName, EstPrice, ItemStatus) ` +
          ' VALUES ($_id, $Code, $CategoryId, $ItemName, $EstPrice, $ItemStatus)',
      );

      console.log('CreateItem statement created');

      try {
        if (this._userId) {
          const uid = await BuildUniqueId(tx, this._userId);

          id = uid.toString();

          console.log('BuildUniqueId for item returned :', uid);
          if (uid > -1n) {
            await statement.executeAsync<{
              _id: string;
              Code: string;
              CategoryId: string;
              ItemName: string;
              EstPrice?: number;
              ItemStatus: string;
            }>(
              uid?.toString(),
              item.Code ? item.Code : null,
              item.CategoryId ? item.CategoryId.toString() : null,
              item.ItemName,
              item.EstPrice ? item.EstPrice.toString() : null,
              item.ItemStatus ? item.ItemStatus : 'Active',
            );

            status = 'Success';
          }
        }
      } catch (error) {
        status = 'Error';
        console.error('Error creating item:', error);
      } finally {
        statement.finalizeAsync();
      }
    });

    return { status, id };
  }

  public async UpdateItem(item: JobCategoryItemData): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Updating item:', item._id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for category:', item._id);
      const statement = await tx.prepareAsync(
        `update ${this._tableName} set ` +
          ' categoryId = $CategoryId, code = $Code, itemname = $ItemName, ' +
          ' EstPrice = $EstPrice, itemStatus = $ItemStatus' +
          ' where _id = $_id',
      );

      console.log('Updating item statement created for:', item._id);

      try {
        let result = await statement.executeAsync<{
          CategoryId: string;
          Code: string;
          ItemName: string;
          EstPrice?: number;
          ItemStatus: string;
          _id: string;
        }>(
          item.CategoryId ? item.CategoryId.toString() : null,
          item.Code ? item.Code : null,
          item.ItemName,
          item.EstPrice ? item.EstPrice.toString() : null,
          item.ItemStatus ? item.ItemStatus : 'Active',
          item._id ? item._id.toString() : null,
        );

        if (result.changes > 0) {
          console.log(`Item updated: ${item._id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Item updated: ${item._id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error updating item:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from update statement:', item._id);
    return status;
  }

  public async DeleteItem(id: string): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Deleting item:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for item:', id);
      const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

      console.log('Delete item statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          _id: string;
        }>(id);

        if (result.changes > 0) {
          console.log(`Item deleted: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Item deleted: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from delete statement:', id);
    return status;
  }

  public async FetchAllItems(
    categoryId: string,
  ): Promise<{ items: JobCategoryItemData[]; status: DBStatus }> {
    if (!this._db) {
      return { items: [], status: 'Error' };
    }

    let status: DBStatus = 'Error';
    let items: JobCategoryItemData[] = [];

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, categoryid, code, itemname, EstPrice, ItemStatus from ${this._tableName} where CategoryId = $CategoryId`,
      );

      try {
        const result = await statement?.executeAsync<{
          _id: string;
          CategoryId: string;
          Code: string;
          ItemName: string;
          EstPrice?: number;
          ItemStatus: string;
        }>(categoryId.toString());

        if (result) {
          await result.getAllAsync().then((rows) => {
            for (const row of rows) {
              items.push({
                _id: row._id,
                CategoryId: row.CategoryId,
                Code: row.Code,
                ItemName: row.ItemName,
                EstPrice: row.EstPrice,
                ItemStatus: row.ItemStatus,
              });
            }
          });
        }
        status = 'Success';
      } catch (error) {
        console.error('Error fetching items:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { status, items };
  }
}
