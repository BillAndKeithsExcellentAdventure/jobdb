export interface JobData {
    _id: bigint | null;
    Code: string | null;
    Name: string | null;
    JobTypeId: bigint | null;
    UserId: number | null;
    JobLocation: string | null;
    StartDate?: Date;
    PlannedFinish?: Date;
    BidPrice?: number;
    Longitude?: number;
    Latitude?: number;
    Radius?: number;
    Thumbnail: string | undefined;
    JobStatus: string | null;
}

export interface JobCategoryData {
    _id: bigint | null;
    JobId: bigint | null;
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

export interface PictureBucketData {
    _id: bigint | null;
    UserId: bigint | null;
    JobId: bigint | null;
    DeviceId: bigint | null;
    AlbumId: string | null;
    AssetId: string | null;
    Longitude?: number | null;
    Latitude?: number | null;
    DateAdded?: Date | null;
    PictureDate?: Date | null;
}
