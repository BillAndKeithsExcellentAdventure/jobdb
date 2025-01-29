import { BuildUniqueId } from "./dbutils";
export class ItemDB {
    _db;
    _tableName = "items";
    _customerId;
    constructor(db, custId) {
        this._db = db;
        this._customerId = custId;
    }
    // Create a table if it does not exist
    CreateItemTable() {
        this._db?.execSync(`CREATE TABLE IF NOT EXISTS ${this._tableName} (_id INTEGER PRIMARY KEY, ` +
            "CategoryId INTEGER, " +
            "Code TEXT, " +
            "ItemName TEXT, " +
            "EstPrice NUMBER, " +
            "ItemStatus TEXT)");
        return "Success";
    }
    async CreateItem(id, item) {
        if (!this._db) {
            return "Error";
        }
        console.log("Creating item:", item);
        let status = "Error";
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("preparing statement for item");
            const statement = await tx.prepareAsync(`INSERT INTO ${this._tableName} (_id, Code, CategoryId, ItemName, EstPrice, ItemStatus) ` +
                " VALUES ($_id, $Code, $CategoryId, $ItemName, $EstPrice, $ItemStatus)");
            console.log("CreateItem statement created");
            try {
                item._id = await BuildUniqueId(tx, this._customerId);
                id.value = item._id;
                console.log("BuildUniqueId for item returned :", item._id);
                if (item._id > -1n) {
                    await statement.executeAsync(item._id?.toString(), item.Code, item.CategoryId ? item.CategoryId.toString() : null, item.ItemName, item.EstPrice ? item.EstPrice.toString() : null, item.ItemStatus);
                    status = "Success";
                }
            }
            catch (error) {
                status = "Error";
                console.error("Error creating item:", error);
            }
            finally {
                statement.finalizeAsync();
            }
        });
        return status;
    }
    async UpdateItem(item) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        console.log("Updating item:", item._id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for category:", item._id);
            const statement = await tx.prepareAsync(`update ${this._tableName} set ` +
                " categoryId = $CategoryId, code = $Code, itemname = $ItemName, " +
                " EstPrice = $EstPrice, itemStatus = $ItemStatus" +
                " where _id = $_id");
            console.log("Updating item statement created for:", item._id);
            try {
                let result = await statement.executeAsync(item.CategoryId ? item.CategoryId.toString() : null, item.Code, item.ItemName, item.EstPrice ? item.EstPrice.toString() : null, item.ItemStatus, item._id ? item._id.toString() : null);
                if (result.changes > 0) {
                    console.log(`Item updated: ${item._id}. Changes = ${result.changes}`);
                    status = "Success";
                }
                else {
                    console.log(`Item updated: ${item._id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            }
            catch (error) {
                console.error("Error updating item:", error);
                status = "Error";
            }
            finally {
                statement.finalizeAsync();
            }
        });
        console.log("Returning from update statement:", item._id);
        return status;
    }
    async DeleteItem(id) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        console.log("Deleting item:", id);
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            console.log("Inside withExclusiveTransactionAsync for item:", id);
            const statement = await tx.prepareAsync(`delete from ${this._tableName} where _id = $id`);
            console.log("Delete item statement created for:", id);
            try {
                let result = await statement.executeAsync(id ? id.toString() : null);
                if (result.changes > 0) {
                    console.log(`Item deleted: ${id}. Changes = ${result.changes}`);
                    status = "Success";
                }
                else {
                    console.log(`Item deleted: ${id}. Changes = ${result.changes}`);
                    status = "NoChanges";
                }
            }
            catch (error) {
                console.error("Error deleting item:", error);
                status = "Error";
            }
            finally {
                statement.finalizeAsync();
            }
        });
        console.log("Returning from delete statement:", id);
        return status;
    }
    async FetchAllItems(categoryId, items) {
        if (!this._db) {
            return "Error";
        }
        let status = "Error";
        await this._db.withExclusiveTransactionAsync(async (tx) => {
            const statement = await this._db?.prepareAsync(`select _id, categoryid, code, itemname, EstPrice, ItemStatus from ${this._tableName} where CategoryId = $CategoryId`);
            try {
                const result = await statement?.executeAsync(categoryId.toString());
                if (result) {
                    await result.getAllAsync().then((rows) => {
                        for (const row of rows) {
                            items.push({
                                _id: BigInt(row._id),
                                CategoryId: BigInt(row.CategoryId),
                                Code: row.Code,
                                ItemName: row.ItemName,
                                EstPrice: row.EstPrice,
                                ItemStatus: row.ItemStatus,
                            });
                        }
                    });
                }
                status = "Success";
            }
            catch (error) {
                console.error("Error fetching items:", error);
                status = "Error";
            }
            finally {
                statement?.finalizeAsync();
            }
        });
        return status;
    }
}
