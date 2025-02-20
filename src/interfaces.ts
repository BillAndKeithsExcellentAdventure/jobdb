import * as MediaLibrary from 'expo-media-library';

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

export interface PictureBucketAsset {
  _id?: string | null;
  asset?: MediaLibrary.Asset;
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

export interface TodoData {
  _id?: string | null;
  UserId?: string | null;
  JobId?: string | null;
  Todo?: string | null;
  Completed?: boolean | null;
}

export interface ReceiptBucketAsset {
  _id?: string | null;
  asset?: MediaLibrary.Asset;
}

export interface ReceiptBucketData {
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
  AssetId?: string;
  AlbumId?: string;
  PictureUri?: string;
}

export interface VendorData {
  _id?: string;
  UserId?: string;
  VendorName?: string;
  Address?: string;
  Address2?: string;
  City?: string;
  State?: string;
  Zip?: string;
  MobilePhone?: string;
  BusinessPhone?: string;
  Notes?: string;
}
