import DatabaseConstructor, { Database } from "better-sqlite3";
import Express from "express";

class DBUtils {
  private static _instance: DBUtils;
  public db: Database | null = null;

  constructor() {
    if (DBUtils._instance) {
      return DBUtils._instance;
    }
  }

  getDb = () => {
    if (!this.db) {
      this.db = new DatabaseConstructor("./database.db", {
        verbose: console.log,
      });
      console.log("database initialized");
    }
    if (this.db === null) {
      throw new Error("Could not open database");
    }
    return this.db;
  };

  getTablesReusable = () => {
    var result: string[] = [];
    try {
      let db = this.getDb();
      const select = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      const data: any = select.all();
      data.forEach((element) => {
        if (element.name !== "sqlite_sequence") {
          result.push(element.name);
        }
      });
    } catch (err) {
      result = []; // Don't blow up, just log
      console.error(err);
    }
    return result;
  }

  getTables = (res: Express.Response) => {
    var result = this.getTablesReusable();
    res.send(result);
  };

  tableExists = (tableName: string): boolean => {
    const tables = this.getTablesReusable();
    return tables.includes(tableName);
  }

  getColumnsReusable = (table_name: string): string[] => {
    let result: string[] = [];
    try {
      let db = this.getDb();
      const tableName = table_name.toLowerCase();
      if (!this.tableExists(tableName)) {
        throw Error("Table does not exist");
      }

      const select = db.prepare(
        "SELECT sql from sqlite_schema WHERE tbl_name = '" + tableName + "'"
      );
      const data: any = select.all();
      if (data) {
        let a = data[0].sql;
        let b = a.substring(a.indexOf("(") + 1, a.length - 1);
        let c = b.split(",");
        let d: string[] = [];
        c.forEach(function (item: string) {
          let val = (item = item.replace(/^\s+/g, ""));
          let newVal = "";
          if (!val.includes("UNIQUE")) {
            let x = val.indexOf(" ");
            if (x > 0) {
              newVal = val.substring(0, x);
              d.push(newVal);
            }
          }
        });
        result = d;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }

    return result;
  };

  getColumns = (res: Express.Response, table_name: string) => {
    const columns = this.getColumnsReusable(table_name);
    res.send(columns);
  };

  columnExists = (tableName: string, columnName: string): boolean => {
    let columns: Array<string> = [];
    try {
      columns = this.getColumnsReusable(tableName);
    } catch (err) {
      return false;
    }
    return columns.includes(columnName);
  }

    getTableDataReusable = (table_name: string) => {
    let result = null;
    try {
      let db = this.getDb();
      const tableName = (table_name + "").toLowerCase();
      // Let's prevent SQL injection
      if (!this.tableExists(tableName)) {
        throw new Error("Table does not exist");
      }
      const dataString = "SELECT * FROM " + tableName;
      const colNames = this.getColumnsReusable(tableName);
      const dataQuery = db.prepare(dataString);
      const dataResult = dataQuery.all();
      const schema = db.pragma(`table_info = ${table_name}`);
      result = {
        table: table_name,
        columnNames: colNames,
        data: dataResult,
        schema: schema,
      };
    } catch (err) {
      console.error(err);
    }
    return result;
  };

  getTableData = (res: Express.Response, table_name: string) => {
    const result = this.getTableDataReusable(table_name);

    res.send(result);
  };

  getTableRows = (res: Express.Response, table_name: string) => {
    let result = null;
    try {
      let db = this.getDb();
      const tableName = (table_name + "").toLowerCase();
      // Let's prevent SQL injection
      if (!this.tableExists(tableName)) {
        throw new Error("Table does not exist");
      }
      
      const dataString = "SELECT * FROM " + tableName;
      const dataQuery = db.prepare(dataString);
      result = dataQuery.all();
    } catch (err) {
      console.error(err);
      result = err;
    }
    res.send(result);
  };

  // Reusable method
  insertRowReusable = (table_name: string, colData: any) => {
    let result = null;
    try {
      const tableName = table_name.toLowerCase();
      if (!this.tableExists(tableName)) {
        throw new Error("Table does not exist");
      }
      const colArray: string[] = this.getColumnsReusable(tableName);
      let insertString = "INSERT INTO " + tableName + " (";
      for (let i = 1; i < colArray.length; i++) {
        if (i > 1) {
          insertString += ", ";
        }
        if (colArray[i]) {
          insertString += colArray[i];
        }
      }
      insertString += ") VALUES (";
      for (let i = 0; i < colData.length; i++) {
        if (i > 0) {
          insertString += ", ";
        }
        insertString += "?";
      }
      insertString += ")";

      let db = this.getDb();
      const insertQuery = db.prepare(insertString);
      insertQuery.run(colData);

      // Return the table data
      result = this.getTableDataReusable(tableName);
    } catch (err) {
      result = err;
      console.log(err);
    }

    return result;
  };

  insertRow = (res: Express.Response, table_name: string) => {
    let result = null;
    const rowArray = [];
    try {
      const columns: string[] = this.getColumnsReusable(table_name);
      const columnCount = columns.length;
      // Remove id since it's autoincrement
      for (let x = 0; x < columnCount - 1; x++) {
        rowArray.push("");
      }
      result = this.insertRowReusable(table_name, rowArray);
    } catch (err) {
      console.error(err);
      result = err;
    }
    res.send(result);
  };

  deleteRow = (res: Express.Response, table_name: string, id: number) => {
    let result = null;
    try {
      const tableName = table_name.toLowerCase();
      if (!this.tableExists(tableName)) {
        throw new Error("Table does not exist");
      }
      const deleteString = "DELETE FROM " + tableName + " WHERE id = ?";
      let db = this.getDb();
      const deleteQuery = db.prepare(deleteString);
      deleteQuery.run(id);

      // Return the table data
      result = this.getTableDataReusable(tableName);
    } catch (err) {
      console.log(err);
      throw err;
    }
    res.send(result);
  };

  updateElement = (
    res: Express.Response,
    table_name: string,
    idVal: string,
    column_name: string,
    data: any
  ) => {
    let result = null;
    const tableName = table_name.toLowerCase();
    const columnName = column_name.toLowerCase();
    if (!this.columnExists(table_name, column_name)) {
      throw new Error("Column does not exist");
    }
    if (columnName === "id") {
      const errMsg = "Error: can not update id";
      console.error(errMsg);
      res.send(errMsg);
      return;
    }
    try {
      let id = null;
      // In case it isn't a string
      try {
        id = parseInt(idVal);
      } catch (parseErr) {
        id = idVal;
      }
      const updateString =
        "UPDATE " + tableName + " SET " + columnName + "=? WHERE id=?";
      let db = this.getDb();
      const updateQuery = db.prepare(updateString);
      updateQuery.run([data, id]);

      // Return the table data
      result = this.getTableDataReusable(tableName);
    } catch (err) {
      console.log(err);
      result = err;
    }
    res.send(result);
  };

  createTable = (
    res: Express.Response,
    table_name: string,
    column_name: string
  ) => {
    let result = null;

    try {
      let db = this.getDb();
      const tableName = table_name.toLowerCase();
      const columnName = column_name.toLowerCase();
      if (this.isNotAllowedName(tableName)) {
        throw new Error("Invalid table name");
      }
      if (this.isNotAllowedName(columnName)) {
        throw new Error("Invalid column name");
      }
      const data = [tableName];
      const columnString =
        "SELECT COUNT(*) AS total FROM sqlite_master WHERE type='table' AND name = ?";
      const columnQuery = db.prepare(columnString);
      const columnData: any = columnQuery.get(data);
      const count = columnData.total;

      // Create a table with just one column and allow only one at a time to 
      // prevent pollution of the db
      if (count === 0) {
        const createString =
          "CREATE TABLE " +
          tableName +
          ` (id INTEGER PRIMARY KEY AUTOINCREMENT, ${columnName} text)`;
        const createQuery = db.prepare(createString);
        createQuery.run();
      }

      // Get the list of all table names
      const selectQuery = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      result = selectQuery.all();
    } catch (err) {
      console.error(err);
      result = err;
    }

    res.send(result);
  };

  dropTable = (
    res: Express.Response,
    table_name: string,
  ) => {
    let result = null;

    try {
      let db = this.getDb();
      const tableName = table_name.toLowerCase();
      if (!this.tableExists(tableName)) {
        throw new Error("Table does not exist");
      }
      const dropString = "DROP TABLE " + tableName;
      const dropQuery = db.prepare(dropString);
      dropQuery.run();

      result = "Table successfully dropped";
    } catch (err) {
      console.error(err);
      result = err;
    }

    res.send(result);
  };

  createColumn = (
    res: Express.Response,
    table_name: string,
    colName: string,
    colDataType: string
  ) => {
    let result = null;

    try {
      let db = this.getDb();
      const tableName = table_name.toLowerCase();
      const columnName = colName.toLowerCase();
      if (!this.tableExists(tableName)) {
        throw new Error("Table does not exist");
      }
      if (this.isNotAllowedName(columnName)) {
        throw new Error("Invalid column name");
      }
      const dataType = colDataType.toUpperCase();
      const dataTypes = ["TEXT", "INTEGER", "REAL", "NUMERIC", "BLOB"];
      if (!dataTypes.includes(dataType)) {
        throw new Error("Bad data type selected");
      }
      const columnString =
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${dataType}`;
      const columnQuery = db.prepare(columnString);
      columnQuery.run();

      // Return the table data
      result = this.getTableDataReusable(tableName);
    } catch (err) {
      console.error(err);
    }

    res.send(result);
  };

  dropColumn = (
    res: Express.Response,
    table_name: string,
    column_name: string
  ) => {
    let result = null;
    try {
      const tableName = table_name.toLowerCase();
      const columnName = column_name.toLowerCase();
      // Let's prevent SQL injection
      if (!this.columnExists(table_name, columnName)) {
        res.send("Invalid name");
        return;
      }

      let db = this.getDb();
      const dropString =
        `ALTER TABLE ${table_name} DROP COLUMN ${columnName}`;
      const dropQuery = db.prepare(dropString);
      dropQuery.run();

      // Return the table data
      result = this.getTableDataReusable(tableName);
    } catch (err) {
      console.error(err);
      result = err;
    }
    res.send(result);
  };

  // Reusable method
  renameTableReusable = (old_table_name: string, new_table_name: string) => {
    let result = null;
    try {
      let db = this.getDb();

      const oldTableName = old_table_name.toLowerCase();
      const newTableName = new_table_name.toLowerCase();

      // Let's prevent SQL injection
      if (!this.tableExists(old_table_name)) {
        throw new Error("Table does not exist");
      }
      if (this.isNotAllowedName(new_table_name)) {
        throw new Error("Invalid table name");
      }

      const renameString =
        "ALTER TABLE " + oldTableName + " RENAME TO " + newTableName;
      const renameQuery = db.prepare(renameString);
      renameQuery.run();

      // Return the table data
      result = this.getTableDataReusable(newTableName);
    } catch (err) {
      console.error(err);
      result = err;
    }
    return result;
  };

  renameTable = (
    res: Express.Response,
    old_table_name: string,
    new_table_name: string
  ) => {
    const result = this.renameTableReusable(old_table_name, new_table_name);
    res.send(result);
  };

  // Must start with alpha and allow only alpha and underscore
  isNotAllowedName = (str) => {
    return str.search(/^[A-Za-z0-9_]*$/) === -1;
  }

  /**
   * The version of SQLite3 I'm using doesn't do rename column
   * so we have to do it this way
   * @param {*} res
   * @param {*} table_name
   * @param {*} old_column_name
   * @param {*} new_column_name
   */
  renameColumn = (
    res: Express.Response,
    table_name: string,
    old_column_name: string,
    new_column_name: string
  ) => {
    let result = null;
    let db = this.getDb();

    try {
      const tableName = table_name.toLowerCase();
      const tempTableName = "tmp_" + tableName;
      const oldColumnName = old_column_name.toLowerCase();
      const newColumnName = new_column_name.toLowerCase();
      // Let's prevent SQL injection
      if (this.isNotAllowedName(newColumnName)) {
        throw new Error("Can't invalid column name");
      }
      if (!this.columnExists(tableName, oldColumnName)) {
        throw new Error("Table or column does not exist");
      }

      // Can't change id
      if (oldColumnName === "id") {
        throw new Error("Can't rename id column");
      }

      const renameString = `ALTER TABLE ${tableName} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
      const renameQuery = db.prepare(renameString);
      renameQuery.run();

      // Return data for the new table
      result = this.getTableDataReusable(tableName);
    } catch (err) {
      console.error(err);
      result = err;
    }
    res.send(result);
  };

  getBy = (
    res: Express.Response,
    table_name: string,
    column_name: string,
    val: string
  ) => {
    let result = null
    try {
      const db = this.getDb()
      const tableName = table_name.toLowerCase()
      const columnName = column_name.toLowerCase()
      const value = val.toLowerCase()
      // Let's prevent SQL injection
      if (!this.tableExists(tableName)) {
        throw new Error("Table does not exist")
      }
      const columns = this.getColumnsReusable(tableName)
      if (columns instanceof Error || !columns.includes(columnName)) {
        throw new Error("Column does not exist")
      }
      const select =
        "SELECT * FROM " + tableName + " WHERE " + columnName + " = ?";
      const selectQuery = db.prepare(select);
      result = selectQuery.get(value);
    } catch (err) {
      console.error(err);
      result = err;
    }
    res.send(result);
  };

  backupDB = (res: Express.Response) => {
    let db = this.getDb();

    db.backup(`backup-${Date.now()}.db`)
      .then(() => {
        console.log("backup complete!");
      })
      .catch((err) => {
        console.log("backup failed:", err);
      });
  };

  exportDB = (res: Express.Response) => {
    this.backupDB(res);

    res.send("Success");
  };
}

export default DBUtils;
