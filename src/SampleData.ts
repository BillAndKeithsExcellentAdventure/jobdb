import { DBStatus, JobTrakrDB } from "./jobtrakr";

export class JobTrakrSampleData {
    private _db: JobTrakrDB;
    private _userId: number;

    public constructor(db: JobTrakrDB, userId: number) {
        this._db = db;
        this._userId = userId;
    }

    private CreateSampleItems = async (data: {
        CatId: bigint;
        Code: string;
        Name: string;
        EstPrice: number;
    }): Promise<DBStatus> => {
        let newId = { value: 0n };
        const createStatus = await this._db?.GetItemDB().CreateItem(newId, {
            _id: 0n,
            Code: data.Code,
            CategoryId: data.CatId,
            ItemName: data.Name,
            EstPrice: data.EstPrice,
            ItemStatus: "Active",
        });

        return createStatus;
    };

    private CreateSampleCategory = async (
        id: { value: bigint },
        data: { JobId: bigint; Code: string; Name: string; EstPrice: number }
    ): Promise<DBStatus> => {
        let newId = { value: 0n };
        const createStatus = await this._db?.GetCategoryDB().CreateCategory(newId, {
            _id: 0n,
            Code: data.Code,
            JobId: data.JobId,
            CategoryName: data.Name,
            EstPrice: data.EstPrice,
            CategoryStatus: "Active",
        });

        if (createStatus === "Success") {
            id.value = newId.value;
        }

        return createStatus;
    };

    private CreateSampleCategories = async (jobId: bigint): Promise<DBStatus> => {
        let newId = { value: 0n };
        let status = await this.CreateSampleCategory(newId, {
            JobId: jobId,
            Code: "100",
            Name: "Pre-Construction",
            EstPrice: 1000.0,
        });
        if (status === "Success") {
            await this.CreateSampleItems({ CatId: newId.value, Code: "100.1", Name: "Permit", EstPrice: 100.0 });
            await this.CreateSampleItems({ CatId: newId.value, Code: "100.2", Name: "Site Plan", EstPrice: 200.0 });
            await this.CreateSampleItems({ CatId: newId.value, Code: "100.3", Name: "Survey", EstPrice: 600.0 });
        }

        status = await this.CreateSampleCategory(newId, {
            JobId: jobId,
            Code: "200",
            Name: "SiteWork",
            EstPrice: 2000.0,
        });
        if (status === "Success") {
            await this.CreateSampleItems({
                CatId: newId.value,
                Code: "200.1",
                Name: "Clear Trees and Brush",
                EstPrice: 9000.0,
            });
            await this.CreateSampleItems({
                CatId: newId.value,
                Code: "200.2",
                Name: "Add silt socks",
                EstPrice: 1500.0,
            });
            await this.CreateSampleItems({ CatId: newId.value, Code: "200.3", Name: "Level lot", EstPrice: 1300.0 });
        }

        status = await this.CreateSampleCategory(newId, {
            JobId: jobId,
            Code: "300",
            Name: "Concrete",
            EstPrice: 8000.0,
        });
        if (status === "Success") {
            await this.CreateSampleItems({ CatId: newId.value, Code: "300.1", Name: "Footer", EstPrice: 12000.0 });
            await this.CreateSampleItems({
                CatId: newId.value,
                Code: "300.2",
                Name: "Basement Walls",
                EstPrice: 25000.0,
            });
            await this.CreateSampleItems({
                CatId: newId.value,
                Code: "300.3",
                Name: "Basement Floor",
                EstPrice: 1800.0,
            });
        }

        return "Success";
    };

    public CreateSampleData = async () => {
        if (this._db) {
            let newId = { value: 0n };
            let createStatus = await this._db?.GetJobDB().CreateJob(newId, {
                _id: 0n,
                Code: "100",
                Name: "Keith Bertram",
                JobTypeId: 1n,
                UserId: this._userId,
                JobLocation: "9940 Blacksmith Way",
                StartDate: new Date(),
                PlannedFinish: new Date(),
                BidPrice: 1000.0,
                Longitude: 32.0,
                Latitude: -89.0,
                Radius: 500.0,
                JobStatus: "Active",
            });

            if (createStatus === "Success") {
                await this.CreateSampleCategories(newId.value);
            }

            createStatus = await this._db?.GetJobDB().CreateJob(newId, {
                _id: 0n,
                Code: "200",
                Name: "Bill Steinbock",
                JobTypeId: 1n,
                UserId: this._userId,
                JobLocation: "Louisville, KY",
                StartDate: new Date(),
                PlannedFinish: new Date(),
                BidPrice: 2000.0,
                Longitude: 31.0,
                Latitude: -89.0,
                Radius: 500.0,
                JobStatus: "Active",
            });

            if (createStatus === "Success") {
                await this.CreateSampleCategories(newId.value);
            }

            createStatus = await this._db?.GetJobDB().CreateJob(newId, {
                _id: 0n,
                Code: "100",
                Name: "Clint Eastwood",
                JobTypeId: 1n,
                UserId: this._userId,
                JobLocation: "California",
                StartDate: new Date(),
                PlannedFinish: new Date(),
                BidPrice: 1000.0,
                Longitude: 34.0,
                Latitude: -89.0,
                Radius: 500.0,
                JobStatus: "Active",
            });

            if (createStatus === "Success") {
                await this.CreateSampleCategories(newId.value);
            }
        }
    };
}
