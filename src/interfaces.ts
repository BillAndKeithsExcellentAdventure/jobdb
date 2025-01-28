export interface JobData {
    _id: bigint | null;
    Code: string | null;
    Name: string | null;
    JobTypeId: bigint | null;
    CustomerId: bigint | null;
    JobLocation: string | null;
    StartDate?: Date;
    PlannedFinish?: Date;
    BidPrice?: number;
    JobStatus: string | null;
}

export interface JobCategoryData {
    _id: bigint | null;
    JobId: bigint;
    Code: string | null;
    CategoryName: string;
    EstPrice?: number;
    CategoryStatus: string | null;
}

export interface JobCategoryItemData {
    _id: bigint | null;
    CategoryId: bigint;
    Code: string | null;
    ItemName: string;
    EstPrice?: number;
    ItemStatus: string | null;
}
