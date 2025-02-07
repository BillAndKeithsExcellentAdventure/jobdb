import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';

async function GetNextId(db: SQLiteDatabase): Promise<number> {
  let nextId: number = 1;

  try {
    const statement = db.prepareSync('insert into jobtrakr_ids default values');
    try {
      const result = statement.executeSync();

      nextId = result.lastInsertRowId;

      console.log('lastInsertRowId:', result.lastInsertRowId);
      console.log('nextId:', nextId);
      console.log('changes:', result.changes);
    } finally {
      statement.finalizeSync();
    }

    const firstRow = (await db.getFirstAsync(
      'SELECT seq FROM sqlite_sequence WHERE name = "jobtrakr_ids"',
    )) as {
      seq: number;
    };
    nextId = firstRow.seq;
    console.log(`Seq from getFirstAsync: ${firstRow.seq}`);

    return nextId;
  } catch (error) {
    console.error('Error getting next id', error);
    return -1;
  }
}

export async function BuildUniqueId(
  db: SQLiteDatabase | null,
  userId: number,
): Promise<bigint> {
  let uniqueId: bigint = -1n;

  if (!db) {
    return -1 as unknown as bigint;
  }

  let nextId = await GetNextId(db);

  if (nextId === -1) {
    return -1 as unknown as bigint;
  }

  uniqueId = (BigInt(userId) << (32n as bigint)) | BigInt(nextId);
  console.log(
    `NextId: ${nextId}, CustomerId: ${userId} => UniqueId: ${uniqueId}`,
  );

  return uniqueId;
}
