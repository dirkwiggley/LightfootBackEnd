import { createError } from "../utils/error.js";
import PGUtils from "./PGUtils.js";

class PGRoles {
  private pgUtils = new PGUtils();
  pool = this.pgUtils.getPool();

  getRoles = async (res, next) => {
    try {
      await this.pool.connect();
      const {rows} = await this.pool.query("SELECT * FROM roles");

      res.send({ roles: rows });
    } catch (err) {
      console.error(err);
      return next(createError(400, "Unauthorized"));
    }
  };

  insertRole = async(name: string, displayName: string) => {
    await this.pool.query("INSERT INTO roles (name, display_name) VALUES ($1, $2)", [name, displayName]);
  }

  init = async (res, next) => {
    let client = null;
    try {
      client = await this.pool.connect();
      await client.query("DROP TABLE roles");
      await client.query("CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
      const roles = [
        { name: "admin", displayName: "Admin" }, 
        { name: "associate", displayName: "Associate" }, 
        { name: "project_developer", displayName: "Project Developer" },
        { name: "retail_investor", displayName: "Retail Investor" },
        { name: "auditor", displayName: "Auditor" }
      ];

      roles.forEach(role => {
        this.insertRole(role.name, role.displayName);
      });
      res.send("Initialized role table");
    } catch (err) {
      return next(err);
    } finally {
      client?.release(true);
    }
  };
}

export default PGRoles;
