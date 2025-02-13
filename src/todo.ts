import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite'; // Use 'react-native-sqlite-storage' if using React Native
import { DBStatus, JobTrakrDB } from './jobtrakr';
import { BuildUniqueId } from './dbutils';
import { TodoData } from './interfaces';

export class TodoDB {
  private _db: SQLiteDatabase | null;
  private _jobTrackr: JobTrakrDB | null;
  readonly _tableName = 'todos';
  private _userId: number | undefined;

  public constructor(jobTrakr: JobTrakrDB) {
    this._jobTrackr = jobTrakr;
    this._db = this._jobTrackr.GetDb();
    this._userId = this._jobTrackr.GetUserId();
  }

  // Create a table if it does not exist
  public CreateTodoTable(): DBStatus {
    this._db?.execSync(
      `CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
        'JobId INTEGER, ' +
        'UserId INTEGER not null, ' +
        'Todo TEXT, ' +
        'Completed boolean)',
    );

    return 'Success';
  }

  public async CreateTodo(todo: TodoData): Promise<{ id: string; status: DBStatus }> {
    if (!this._db) {
      return { id: '0', status: 'Error' };
    }
    console.log('Creating Todo:', todo);

    let status: DBStatus = 'Error';
    let id: string = '0';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('preparing todo statement for user: ', this._userId);
      const statement = await tx.prepareAsync(
        `INSERT INTO ${this._tableName} (_id, JobId, UserId, Todo, Completed) ` +
          ' VALUES ($_id, $JobId, $UserId, $Todo, $Completed)',
      );

      console.log('CreateTodo statement created');

      try {
        if (this._userId) {
          const uid = await BuildUniqueId(tx, this._userId);

          console.log('BuildUniqueId returned :', uid);
          if (uid > -1n) {
            id = uid.toString();
            await statement.executeAsync<{
              _id: string;
              JobId: string;
              UserId: string;
              Todo?: string;
              Completed: boolean;
            }>(
              uid.toString(),
              todo.JobId ? todo.JobId.toString() : null,
              this._userId ? this._userId.toString() : null,
              todo.Todo ? todo.Todo.toString() : null,
              todo.Completed ? todo.Completed : null,
            );

            status = 'Success';
          }
        }
      } catch (error) {
        status = 'Error';
        console.error('Error creating todo item:', error);
      } finally {
        statement.finalizeAsync();
      }
    });

    return { status, id };
  }

  public async UpdateJob(todo: TodoData): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Updating todo:', todo._id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for todo:', todo._id);
      const statement = await tx.prepareAsync(
        `update ${this._tableName} set ` +
          ' JobId = $JobId, UserId = $UserId, Todo = $Todo, Completed = $Completed' +
          ' where _id = $_id',
      );

      console.log('Updating todo statement created for:', todo._id);

      try {
        let result = await statement.executeAsync<TodoData>(
          todo.JobId ? todo.JobId.toString() : null,
          this._userId ? this._userId.toString() : null,
          todo.Todo ? todo.Todo : null,
          todo.Completed ? todo.Completed : null,
          todo._id ? todo._id.toString() : null,
        );

        if (result.changes > 0) {
          console.log(`Todo updated: ${todo._id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Todo updated: ${todo._id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error updating todo:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from todo update statement:', todo._id);
    return status;
  }

  public async SetCompleted(id: string): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Updating todo as completed:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await tx.prepareAsync(
        `update ${this._tableName} set ` + ' Completed = true ' + ' where _id = $_id',
      );

      console.log('Updating todo completed statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          _id: string;
        }>(id ? id : null);

        if (result.changes > 0) {
          console.log(`Todo completed updated: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Todo completed updated: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error updating todo completed:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from updating completed update statement:', id);
    return status;
  }

  public async DeleteTodo(id: string): Promise<DBStatus> {
    if (!this._db) {
      return 'Error';
    }

    let status: DBStatus = 'Error';

    console.log('Deleting todo:', id);
    await this._db.withExclusiveTransactionAsync(async (tx) => {
      console.log('Inside withExclusiveTransactionAsync for todo:', id);
      const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);

      console.log('Delete todo statement created for:', id);

      try {
        let result = await statement.executeAsync<{
          _id: string;
        }>(id ? id.toString() : null);

        if (result.changes > 0) {
          console.log(`Todo deleted: ${id}. Changes = ${result.changes}`);
          status = 'Success';
        } else {
          console.log(`Todo deleted: ${id}. Changes = ${result.changes}`);
          status = 'NoChanges';
        }
      } catch (error) {
        console.error('Error deleting todo:', error);
        status = 'Error';
      } finally {
        statement.finalizeAsync();
      }
    });

    console.log('Returning from delete statement:', id);
    return status;
  }

  public async FetchJobTodos(jobId: string): Promise<{ todos: TodoData[]; status: DBStatus }> {
    if (!this._db) {
      return { todos: [], status: 'Error' };
    }

    if (!this._userId) {
      return { todos: [], status: 'Error' };
    }

    let todos: TodoData[] = [];

    let status: DBStatus = 'Error';

    await this._db.withExclusiveTransactionAsync(async (tx) => {
      const statement = await this._db?.prepareAsync(
        `select _id, JobId, UserId, Todo, Completed from ${this._tableName} where JobId = $JobId`,
      );

      try {
        if (this._userId) {
          const result = await statement?.executeAsync<TodoData>(jobId);

          if (result) {
            await result.getAllAsync().then((rows) => {
              for (const row of rows) {
                todos.push({
                  _id: row._id,
                  JobId: row.JobId,
                  UserId: row.UserId,
                  Todo: row.Todo,
                  Completed: row.Completed,
                });
              }
            });
          }
          status = 'Success';
        }
      } catch (error) {
        console.error('Error fetching todos:', error);
        status = 'Error';
      } finally {
        statement?.finalizeAsync();
      }
    });

    return { todos, status };
  }
}
