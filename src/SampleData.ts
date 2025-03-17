import { SQLiteDatabase } from 'expo-sqlite';
import { DBStatus, JobTrakrDB } from './jobtrakr';

export class JobTrakrSampleData {
  private _jobTrakr: JobTrakrDB | null;
  private _userId: number | undefined;

  public constructor(jobTrakr: JobTrakrDB) {
    this._jobTrakr = jobTrakr;
    this._userId = jobTrakr.GetUserId();
  }

  private CreateSampleItems = async (data: {
    CatId: string;
    Code: string;
    Name: string;
    EstPrice: number;
  }): Promise<{ id: string; status: DBStatus } | undefined> => {
    const createStatus = await this._jobTrakr?.GetItemDB().CreateItem({
      Code: data.Code,
      CategoryId: data.CatId,
      ItemName: data.Name,
      EstPrice: data.EstPrice,
      ItemStatus: 'Active',
    });

    return createStatus;
  };

  private CreateSampleCategory = async (data: {
    JobId: string;
    Code: string;
    Name: string;
    EstPrice: number;
  }): Promise<{ status: DBStatus; id: string } | undefined> => {
    const createStatus = await this._jobTrakr?.GetCategoryDB().CreateCategory({
      Code: data.Code,
      JobId: data.JobId.toString(),
      CategoryName: data.Name,
      EstPrice: data.EstPrice,
      CategoryStatus: 'Active',
    });

    return createStatus;
  };

  private CreateSampleCategories = async (jobId: string): Promise<DBStatus> => {
    let status = await this.CreateSampleCategory({
      JobId: jobId,
      Code: '100',
      Name: 'Pre-Construction',
      EstPrice: 1000.0,
    });
    if (status) {
      if (status.status === 'Success') {
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '100.1',
          Name: 'Permit',
          EstPrice: 100.0,
        });
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '100.2',
          Name: 'Site Plan',
          EstPrice: 200.0,
        });
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '100.3',
          Name: 'Survey',
          EstPrice: 600.0,
        });
      }
    }

    status = await this.CreateSampleCategory({
      JobId: jobId,
      Code: '200',
      Name: 'SiteWork',
      EstPrice: 2000.0,
    });
    if (status) {
      if (status.status === 'Success') {
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '200.1',
          Name: 'Clear Trees and Brush',
          EstPrice: 9000.0,
        });
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '200.2',
          Name: 'Add silt socks',
          EstPrice: 1500.0,
        });
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '200.3',
          Name: 'Level lot',
          EstPrice: 1300.0,
        });
      }
    }

    status = await this.CreateSampleCategory({
      JobId: jobId,
      Code: '300',
      Name: 'Concrete',
      EstPrice: 8000.0,
    });

    if (status) {
      if (status.status === 'Success') {
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '300.1',
          Name: 'Footer',
          EstPrice: 12000.0,
        });
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '300.2',
          Name: 'Basement Walls',
          EstPrice: 25000.0,
        });
        await this.CreateSampleItems({
          CatId: status.id,
          Code: '300.3',
          Name: 'Basement Floor',
          EstPrice: 1800.0,
        });
      }
    }

    return 'Success';
  };

  public CreateSampleData = async () => {
    if (this._jobTrakr) {
      let createStatus = await this._jobTrakr?.GetJobDB().CreateJob({
        Code: '100',
        Name: 'Lot 82',
        JobTypeId: '1',
        OwnerName: 'Keith Bertram',
        Location: '9940 Blacksmith Way',
        StartDate: new Date(),
        PlannedFinish: new Date(),
        BidPrice: 1000.0,
        Longitude: 32.0,
        Latitude: -89.0,
        Radius: 500.0,
        Thumbnail: undefined,
        JobStatus: 'Active',
      });
      console.log('Create Job Status: ', createStatus);
      if (createStatus.status === 'Success') {
        await this.CreateSampleCategories(createStatus.id);
      }

      createStatus = await this._jobTrakr?.GetJobDB().CreateJob({
        Code: '200',
        Name: 'Lot 110',
        JobTypeId: '1',
        OwnerName: 'Bill Steinbock',
        Location: 'Louisville, KY',
        StartDate: new Date(),
        PlannedFinish: new Date(),
        BidPrice: 2000.0,
        Longitude: 31.0,
        Latitude: -89.0,
        Radius: 500.0,
        Thumbnail: undefined,
        JobStatus: 'Active',
      });
      console.log('Create Job Status: ', createStatus);
      if (createStatus.status === 'Success') {
        await this.CreateSampleCategories(createStatus.id);
      }

      createStatus = await this._jobTrakr?.GetJobDB().CreateJob({
        Code: '100',
        Name: 'Lot 10',
        JobTypeId: '1',
        Location: 'California',
        OwnerName: 'Clint Eastwood',
        StartDate: new Date(),
        PlannedFinish: new Date(),
        BidPrice: 1000.0,
        Longitude: 34.0,
        Latitude: -89.0,
        Radius: 500.0,
        Thumbnail: undefined,
        JobStatus: 'Active',
      });
      console.log('Create Job Status: ', createStatus);
      if (createStatus.status === 'Success') {
        await this.CreateSampleCategories(createStatus.id);
      }
    }
  };
}
