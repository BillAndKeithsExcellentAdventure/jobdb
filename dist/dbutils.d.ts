import { SQLiteDatabase } from "expo-sqlite";
export declare function BuildUniqueId(db: SQLiteDatabase | null, userId: number): Promise<bigint>;
