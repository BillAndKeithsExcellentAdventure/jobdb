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
