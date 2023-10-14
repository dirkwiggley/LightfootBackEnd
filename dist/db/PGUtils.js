import pg from "pg";
import * as dotenv from "dotenv";
class PGUtils {
    constructor() {
        this.getPool = () => { return PGUtils.pool; };
        if (PGUtils._instance) {
            return PGUtils._instance;
        }
        if (!PGUtils.pool) {
            dotenv.config();
            PGUtils.pool = new pg.Pool({
                user: process.env.USER,
                host: process.env.HOST,
                database: process.env.DATABASE,
                password: process.env.PASSWORD,
                port: parseInt(process.env.PORT, 10),
                connectionTimeoutMillis: 20000,
                idleTimeoutMillis: 20000,
                allowExitOnIdle: false
            });
        }
    }
}
export default PGUtils;
//# sourceMappingURL=PGUtils.js.map