import { createError } from "../utils/error.js";
import PGUtils from "./PGUtils.js";
class PGRoles {
    constructor() {
        this.pgUtils = new PGUtils();
        this.pool = this.pgUtils.getPool();
        this.getRoles = async (res, next) => {
            try {
                const { rows } = await this.pool.query("SELECT * FROM roles");
                res.send({ roles: rows });
            }
            catch (err) {
                console.error(err);
                return next(createError(400, "Unauthorized"));
            }
        };
        this.insertRole = async (name, displayName) => {
            await this.pool.query("INSERT INTO roles (name, display_name) VALUES ($1, $2)", [name, displayName]);
        };
        this.init = async (res, next) => {
            try {
                await PGUtils.client.query("DROP TABLE roles");
                await PGUtils.client.query("CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
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
            }
            catch (err) {
                return next(err);
            }
            finally {
                PGUtils.client?.release(true);
            }
        };
    }
}
export default PGRoles;
//# sourceMappingURL=PGRoles.js.map