import pg from "pg";
import * as dotenv from "dotenv";
class PGUtils {
    constructor() {
        this.getPool = () => { return PGUtils.pool; };
        this.keepDBAlive = async () => {
            if (!PGUtils.keepAlive) {
                PGUtils.client = await PGUtils.pool.connect();
                PGUtils.keepAliveInterval = setInterval(async () => {
                    try {
                        PGUtils.keepAlive = true;
                        await PGUtils.pool.query("SELECT * FROM pg_user");
                        const currentDate = new Date();
                        console.log(`Pinging database: ${currentDate.getDay()}/${currentDate.getMonth()}/${currentDate.getFullYear()} @ ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`);
                    }
                    catch (err) {
                        console.error(err);
                        PGUtils.keepAlive = false;
                        clearInterval(PGUtils.keepAliveInterval);
                        this.keepDBAlive();
                    }
                }, 5000);
            }
        };
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
                connectionTimeoutMillis: 60000,
                idleTimeoutMillis: 60000,
                allowExitOnIdle: false
            });
            if (!PGUtils.keepAlive) {
                this.keepDBAlive();
            }
        }
    }
}
PGUtils.keepAlive = false;
PGUtils.keepAliveInterval = null;
PGUtils.client = null;
export default PGUtils;
//# sourceMappingURL=PGUtils.js.map