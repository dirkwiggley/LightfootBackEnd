import pg from "pg";
import * as dotenv from "dotenv"

class PGUtils {
  private static _instance: PGUtils;
  private static pool;

  constructor() {
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

  getPool = () => { return PGUtils.pool }
}

export default PGUtils;