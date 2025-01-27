import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite";

async function GetNextId(db: SQLiteDatabase): Promise<number> {
    let nextId: number = 1;

    try {
        const statement = db.prepareSync("insert into jobtrakr_ids default values");
        try {
            const result = statement.executeSync(101);
            console.log("lastInsertRowId:", result.lastInsertRowId);
            console.log("changes:", result.changes);
        } finally {
            statement.finalizeSync();
        }

        const statement2 = db.prepareSync("SELECT value FROM test WHERE value > ?");
        try {
            const result = statement2.executeSync<{ value: number }>();
            for (const row of result) {
                nextId = row.value;
                console.log("row value:", row.value);
                break;
            }
        } finally {
            statement.finalizeSync();
        }

        return nextId;
    } catch (error) {
        console.error("Error getting next id", error);
        return -1;
    }
}

export async function BuildUniqueId(db: SQLiteDatabase | null, custId: number): Promise<number> {
    let uniqueId: number = -1;

    if (!db) {
        return -1;
    }

    let nextId = await GetNextId(db);

    if (nextId === -1) {
        return -1;
    }

    uniqueId = (custId << 32) | nextId;

    return uniqueId;
}
