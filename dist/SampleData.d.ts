import { JobTrakrDB } from "./jobtrakr";
export declare class JobTrakrSampleData {
    private _db;
    private _userId;
    constructor(db: JobTrakrDB, userId: number);
    private CreateSampleItems;
    private CreateSampleCategory;
    private CreateSampleCategories;
    CreateSampleData: () => Promise<void>;
}
