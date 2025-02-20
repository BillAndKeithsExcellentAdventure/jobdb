import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import { DBStatus, JobTrakrDB } from './jobtrakr';
import { BuildUniqueId } from './dbutils';
import { VendorData } from './interfaces';

export class VendorDB {
  private _db: SQLiteDatabase | null;
  private _jobTrackr: JobTrakrDB | null;
  readonly _tableName = 'vendors';
  private _userId: number | undefined;

  public constructor(jobTrakr: JobTrakrDB) {
    this._jobTrackr = jobTrakr;
    this._db = this._jobTrackr.GetDb();
    this._userId = this._jobTrackr.GetUserId();
  }

  // Create a table if it does not exist
  public CreateVendorTable(): DBStatus {
    this._db?.execSync(
      `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
        'UserId INTEGER not null, ' +
        'VendorName TEXT, ' +
        'Address TEXT, ' +
        'Address2 TEXT, ' +
        'City TEXT, ' +
        'State TEXT, ' +
        'Zip TEXT, ' +
        'MobilePhone TEXT, ' +
        'BusinessPhone TEXT, ' +
        'Notes TEXT)',
    );

    return 'Success';
  }

  public async CreateVendor(vendor: VendorData): Promise<{ id: string; status: DBStatus }> {
    if (!this._db) {
      return { id: '0', status: 'Error' };
    }
    console.log('Creating Vendor:', vendor);

    let status: DBStatus = 'Error';
    let id: string = '0';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('preparing job statement for user: ', this._userId);
      const statement = await tx.prepareAsync(
        `INSERT INTO ${this._tableName} (_id, UserId, VendorName, Address, Address2, City, State, Zip, MobilePhone, BusinessPhone, Notes) ` +
          ' VALUES ($_id, $UserId, $VendorName, $Address, $Address2, $City, $State, $Zip, $MobilePhone, $BusinessPhone, $Notes)',
      );

      console.log('CreateVendor statement created');

      try {
        if (this._userId) {
          const uid = await BuildUniqueId(tx, this._userId);

          console.log('BuildUniqueId returned :', uid);
          if (uid > -1n) {
            id = uid.toString();
            await statement.executeAsync<{
              _id: string;
              UserId: string;
              VendorName: string;
              Address: string;
              Address2: string;
              City: string;
              State: string;
              Zip: string;
              MobilePhone: string;
              BusinessPhone: string;
              Notes: string;
            }>(
              uid.toString(),
              this._userId ? this._userId.toString() : null,
              vendor.VendorName ? vendor.VendorName : null,
              vendor.Address ? vendor.Address : null,
              vendor.Address2 ? vendor.Address2 : null,
              vendor.City ? vendor.City : null,
              vendor.State ? vendor.State : null,
              vendor.Zip ? vendor.Zip : null,
              vendor.MobilePhone ? vendor.MobilePhone : null,
              vendor.BusinessPhone ? vendor.BusinessPhone : null,
              vendor.Notes ? vendor.Notes : null,
            );

            status = 'Success';
          }
        }
      } catch (error) {
        status = 'Error';
        console.error('Error creating vendor:', error);
      } finally {
        statement.finalizeAsync();
      }
    });

    return { status, id };
  }

  public async UpdateVendor(vendor: VendorData): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Updating vendor:', vendor._id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for vendor:', vendor._id);
      const statement = await tx.prepareAsync(
        `update ${this._tableName} set ` +
          ' VendorName = $VendorName, Address = $Address, Address2 = $Address2, ' +
          ' City = $City, State = $State, Zip = $Zip, ' +
          ' MobilePhone = $MobilePhone, BusinessPhone = $BusinessPhone, Notes = $Notes' +
          ' where _id = $_id',
      );

      console.log('Updating vendor statement created for:', vendor._id);

      try {
        let result = await statement.executeAsync<VendorData>(
          vendor.VendorName ? vendor.VendorName : null,
          vendor.Address ? vendor.Address : null,
          vendor.Address2 ? vendor.Address2 : null,
          vendor.City ? vendor.City : null,
          vendor.State ? vendor.State : null,
          vendor.Zip ? vendor.Zip : null,
          vendor.MobilePhone ? vendor.MobilePhone : null,
          vendor.BusinessPhone ? vendor.BusinessPhone : null,
          vendor.Notes ? vendor.Notes : null,
          vendor._id ? vendor._id.toString() : null,
        );

        if (result.changes > 0) {
          console.log(`Vendor updated: ${vendor._id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Vendor updated: ${vendor._id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error updating vendor:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from update statement:', vendor._id);
    return status;
  }

  public async DeleteVendor(id: string): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Deleting vendor:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for vendor:', id);
      const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

      console.log('Delete vendor statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          _id: string;
        }>(id ? id.toString() : null);

        if (result.changes > 0) {
          console.log(`Vendor deleted: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Vendor deleted: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error deleting vendor:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from delete statement:', id);
    return status;
  }

  public async FetchVendorById(id: string): Promise<{ vendor: VendorData; status: DBStatus }> {
    let vendorData: VendorData = {};

    if (!this._db) {
      return { vendor: vendorData, status: 'Error' };
    }

    if (!this._userId) {
      return { vendor: vendorData, status: 'Error' };
    }

    let status: DBStatus = 'Error';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, UserId, VendorName, Address, Address2, City, State, Zip, MobilePhone, BusinessPhone, Notes ` +
          `  from ${this._tableName} where _id = $id`,
      );

      try {
        if (this._userId) {
          const result = await statement?.executeAsync<VendorData>(id);

          if (result) {
            await result.getFirstAsync().then((row) => {
              (vendorData._id = row?._id?.toString()),
                (vendorData.UserId = row?.UserId),
                (vendorData.VendorName = row?.VendorName ? row?.VendorName : ''),
                (vendorData.Address = row?.Address),
                (vendorData.Address2 = row?.Address2),
                (vendorData.City = row?.City),
                (vendorData.State = row?.State),
                (vendorData.Zip = row?.Zip),
                (vendorData.MobilePhone = row?.MobilePhone),
                (vendorData.BusinessPhone = row?.BusinessPhone),
                (vendorData.Notes = row?.Notes);
            });

            status = 'Success';
          }
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { vendor: vendorData, status };
  }

  public async FetchAllVendors(): Promise<{ vendors: VendorData[]; status: DBStatus }> {
    if (!this._db) {
      return { vendors: [], status: 'Error' };
    }

    if (!this._userId) {
      return { vendors: [], status: 'Error' };
    }

    let vendors: VendorData[] = [];

    let status: DBStatus = 'Error';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, UserId, VendorName, Address, Address2, City, State, Zip, MobilePhone, BusinessPhone, Notes ` +
          `  from ${this._tableName} where UserId = $UserId`,
      );

      try {
        if (this._userId) {
          const result = await statement?.executeAsync<VendorData>(this._userId.toString());

          if (result) {
            await result.getAllAsync().then((rows) => {
              for (const row of rows) {
                vendors.push({
                  _id: row?._id?.toString(),
                  UserId: row?.UserId,
                  VendorName: row?.VendorName ? row?.VendorName : '',
                  Address: row?.Address,
                  Address2: row?.Address2,
                  City: row?.City,
                  State: row?.State,
                  Zip: row?.Zip,
                  MobilePhone: row?.MobilePhone,
                  BusinessPhone: row?.BusinessPhone,
                  Notes: row?.Notes,
                });
              }
            });
          }
          status = 'Success';
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { vendors, status };
  }
}
