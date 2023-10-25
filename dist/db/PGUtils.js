import pg from "pg";
import * as dotenv from "dotenv";
class PGUtils {
    constructor() {
        this.query = async (text, params) => {
            const start = Date.now();
            const res = await PGUtils.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('executed query', { text, duration, rows: res.rowCount });
            return res;
        };
        this.getClient = async () => {
            const client = await PGUtils.pool.connect();
            const query = client.query;
            const release = client.release;
            // set a timeout of 5 seconds, after which we will log this client's last query
            const timeout = setTimeout(() => {
                console.error('A client has been checked out for more than 5 seconds!');
                // console.error(`The last executed query on this client was: ${client.lastQuery}`)
            }, 5000);
            // monkey patch the query method to keep track of the last query executed
            client.query = (...args) => {
                PGUtils.lastQuery = args;
                return query.apply(client, args);
            };
            client.release = () => {
                // clear our timeout
                clearTimeout(timeout);
                // set the methods back to their old un-monkey-patched version
                client.query = query;
                client.release = release;
                return release.apply(client);
            };
            return client;
        };
        this.getPool = () => { return PGUtils.pool; };
        this.keepDBAlive = async () => {
            if (!PGUtils.keepAlive) {
                PGUtils.client = await PGUtils.pool.connect();
                PGUtils.keepAliveInterval = setInterval(async () => {
                    try {
                        PGUtils.keepAlive = true;
                        const result = await PGUtils.pool.query("SELECT * FROM pg_user");
                        if (result && !PGUtils.connFailed) {
                            const currentDate = new Date();
                            console.log("x");
                            console.log(`Pinging database: ${currentDate.getDay()}/${currentDate.getMonth()}/${currentDate.getFullYear()} @ ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`);
                        }
                    }
                    catch (err) {
                        PGUtils.connFailed = true;
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
PGUtils.connFailed = false;
PGUtils.lastQuery = null;
export default PGUtils;
//# sourceMappingURL=PGUtils.js.map