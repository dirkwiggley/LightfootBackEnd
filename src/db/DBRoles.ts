import { createError } from "../utils/error.js";
import DBUtils from "./DBUtils.js";

class DBRoles {
  private dbUtils: DBUtils | null = null;

  constructor() {
    this.dbUtils = new DBUtils();
  }

  getRoles = (res, next) => {
    try {
      let db = this.dbUtils.getDb();

      const get = db.prepare("SELECT * FROM roles");
      const results = get.all();

      res.send({ roles: results });
    } catch (err) {
      console.error(err);
      return next(createError(400, "Unauthorized"));
    }
  };

  init = (res, next) => {
    try {
      let db = this.dbUtils.getDb();

      try {
        const drop = db.prepare("DROP TABLE roles");
        drop.run();
      } catch (err) {
        console.log(err);
      }

      const create = db.prepare(
        "CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)"
      );
      create.run();
      const roles = [{ name: "ADMIN" }, { name: "USER" }];

      const insert = db.prepare("INSERT INTO roles (name) VALUES (?)");
      roles.forEach((role) => {
        insert.run(role.name);
      });

      res.send("Initialized role table");
    } catch (err) {
      return next(err);
    }
  };
}

export default DBRoles;
