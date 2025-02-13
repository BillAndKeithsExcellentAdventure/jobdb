export interface JobData {
  _id?: string;
  Code?: string;
  Name: string;
  JobTypeId?: string;
  Location?: string;
  OwnerName?: string;
  StartDate?: Date;
  PlannedFinish?: Date;
  BidPrice?: number;
  Longitude?: number;
  Latitude?: number;
  Radius?: number;
  Favorite?: number;
  Thumbnail?: string;
  JobStatus?: string;
}

export interface JobCategoryData {
  _id?: string | null;
  JobId?: string | null;
  Code?: string | null;
  CategoryName: string;
  EstPrice?: number;
  CategoryStatus?: string | null;
}

export interface JobCategoryItemData {
  _id?: string | null;
  CategoryId?: string;
  Code?: string | null;
  ItemName: string;
  EstPrice?: number;
  ItemStatus?: string | null;
}

export interface PictureBucketData {
  _id?: string | null;
  UserId?: string | null;
  JobId?: string | null;
  DeviceId?: string | null;
  AlbumId?: string | null;
  AssetId?: string | null;
  Longitude?: number | null;
  Latitude?: number | null;
  DateAdded?: Date | null;
  PictureDate?: Date | null;
}
