import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import { JobTrakrDB, DBStatus } from './jobtrakr';
import { BuildUniqueId } from './dbutils';
import { JobCategoryData } from './interfaces';

export class CategoryDB {
  private _db: SQLiteDatabase | null;
  private _jobTrakr: JobTrakrDB | null;
  readonly _tableName = 'categories';
  private _userId: number | undefined;

  public constructor(jobTrakr: JobTrakrDB) {
    this._jobTrakr = jobTrakr;
    this._db = this._jobTrakr.GetDb();
    this._userId = this._jobTrakr.GetUserId();
  }

  // Create a table if it does not exist
  public CreateCategoryTable(): DBStatus {
    this._db?.execSync(
      `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
        'JobId INTEGER, ' +
        'Code TEXT, ' +
        'CategoryName TEXT, ' +
        'StartDate Date, ' +
        'EstPrice NUMBER, ' +
        'CategoryStatus TEXT)',
    );

    return 'Success';
  }

  public async CreateCategory(cat: JobCategoryData): Promise<{ status: DBStatus; id: string }> {
    if (!this._db) {
      return { id: '0', status: 'Error' };
    }

    console.log('Creating category:', cat);
    let id: string | undefined = '0';
    let status: DBStatus = 'Error';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('preparing statement for category');
      const statement = await tx.prepareAsync(
        `INSERT INTO ${this._tableName} (_id, Code, JobId, CategoryName, EstPrice, CategoryStatus) ` +
          ' VALUES ($_id, $Code, $JobId, $CategoryName, $EstPrice, $CategoryStatus)',
      );

      console.log('CreateCategory statement created');

      try {
        if (this._userId) {
          const uid = await BuildUniqueId(tx, this._userId);

          id = uid.toString();

          console.log('BuildUniqueId for category returned :', uid);
          if (uid > -1n) {
            await statement.executeAsync<{
              _id: string;
              Code: string;
              JobId: string;
              CategoryName: string;
              EstPrice?: number;
              CategoryStatus: string;
            }>(
              uid?.toString(),
              cat.Code ? cat.Code : '',
              cat.JobId ? cat.JobId.toString() : null,
              cat.CategoryName,
              cat.EstPrice ? cat.EstPrice.toString() : null,
              cat.CategoryStatus ? cat.CategoryStatus : 'Active',
            );

            status = 'Success';
          }
        }
      } catch (error) {
        status = 'Error';
        console.error('Error creating category:', error);
      } finally {
        statement.finalizeAsync();
      }
    });

    return { id, status };
  }

  public async UpdateCategory(cat: JobCategoryData): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Updating category:', cat._id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for category:', cat._id);
      const statement = await tx.prepareAsync(
        `update ${this._tableName} set ` +
          ' jobId = $JobId, code = $Code, categoryname = $CategoryName, ' +
          ' EstPrice = $EstPrice, categoryStatus = $CategoryStatus' +
          ' where _id = $_id',
      );

      console.log('Updating category statement created for:', cat._id);

      try {
        let result = await statement.executeAsync<{
          JobId: string;
          Code: string;
          CategoryName: string;
          EstPrice?: number;
          CategoryStatus: string;
          _id: string;
        }>(
          cat.JobId ? cat.JobId.toString() : null,
          cat.Code ? cat.Code : '',
          cat.CategoryName,
          cat.EstPrice ? cat.EstPrice.toString() : null,
          cat.CategoryStatus ? cat.CategoryStatus : 'Active',
          cat._id ? cat._id.toString() : null,
        );

        if (result.changes > 0) {
          console.log(`Category updated: ${cat._id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Category updated: ${cat._id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error updating category:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from update statement:', cat._id);
    return status;
  }

  public async DeleteCategory(id: string): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Deleting category:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for category:', id);
      const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

      console.log('Delete category statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          _id: string;
        }>(id ? id.toString() : null);

        if (result.changes > 0) {
          console.log(`Category deleted: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Category deleted: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from delete statement:', id);
    return status;
  }

  public async FetchAllCategories(
    jobId: string,
  ): Promise<{ categories: JobCategoryData[]; status: DBStatus }> {
    if (!this._db) {
      return { categories: [], status: 'Error' };
    }
    let status: DBStatus = 'Error';
    let categories: JobCategoryData[] = [];

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, jobid, code, categoryname, EstPrice, CategoryStatus from ${this._tableName} where JobId = $JobId`,
      );

      try {
        const result = await statement?.executeAsync<{
          _id: string;
          JobId: string;
          Code: string;
          CategoryName: string;
          EstPrice?: number;
          CategoryStatus: string;
        }>(jobId.toString());

        if (result) {
          await result.getAllAsync().then((rows) => {
            for (const row of rows) {
              categories.push({
                _id: row._id,
                JobId: row.JobId,
                Code: row.Code,
                CategoryName: row.CategoryName,
                EstPrice: row.EstPrice,
                CategoryStatus: row.CategoryStatus,
              });
            }
          });
        }
        status = 'Success';
      } catch (error) {
        console.error('Error fetching categories:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { status, categories };
  }
}
