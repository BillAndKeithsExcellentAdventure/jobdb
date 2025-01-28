import { SQLiteDatabase } from "expo-sqlite";
export declare function BuildUniqueId(db: SQLiteDatabase | null, custId: number): Promise<bigint>;
