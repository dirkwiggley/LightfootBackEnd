import PGUtils from "./PGUtils.js";
import { objectIsUserInterface } from "./types.js";
import { createError } from "../utils/error.js";
import { hash } from "./CommonAuth.js";
class PGUsers {
    constructor() {
        this.pgUtils = new PGUtils();
        this.pool = this.pgUtils.getPool();
        this.getUsers = async (res, next) => {
            let client = null;
            try {
                client = await this.pool.connect();
                let outArray = [];
                const { rows } = await client.query("SELECT * FROM users");
                rows.forEach((element) => {
                    if (objectIsUserInterface(element)) {
                        delete element.password;
                        outArray.push(element);
                    }
                });
                if (outArray.length == 0) {
                    return next(createError(500, "No data in users table"));
                }
                const users = { users: outArray };
                res.send(users);
            }
            catch (error) {
                return next(createError(500, error.message));
            }
            finally {
                client?.release(true);
            }
        };
        this.isActive = async (id) => {
            try {
                await this.pool.connect();
                const { rows } = await this.pool.query("SELECT active FROM users WHERE id = $1", [id]);
                if (rows && rows.length === 1) {
                    return rows[0].active;
                }
            }
            catch (err) {
                // if error, don't crash but don't validate
                console.error(err);
                return false;
            }
        };
        this.insertUserReusable = async (userInfo, next) => {
            let result = null;
            try {
                // New user has no id
                if (userInfo.id === null || userInfo.id === undefined) {
                    await this.pool.connect();
                    let password = null;
                    if (userInfo.password) {
                        password = userInfo.password;
                    }
                    else {
                        password = "password";
                    }
                    const tempPwd = hash(password);
                    delete userInfo.id;
                    result = await this.pool.query("INSERT INTO users (login, pwd, nickname, email, roles, locale, active, reset_password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *", [userInfo.login, tempPwd, userInfo.nickname, userInfo.email, userInfo.roles, userInfo.locale, userInfo.active, userInfo.reset_password]);
                }
                else {
                    result = await this.updateUser(userInfo);
                }
            }
            catch (err) {
                console.error(err);
                return next(err);
            }
            return result;
        };
        this.insertUser = async (userInfo, res, next) => {
            let result = null;
            try {
                result = this.insertUserReusable(userInfo, next);
            }
            catch (err) {
                console.error(err);
                return next(err);
            }
            res.status(200).send(result);
        };
        // Do not update the pwd here, there should be a separate function for that
        this.updateUser = async (userInfo) => {
            // let db = this.dbUtils.getDb();
            // if (typeof userInfo.roles !== 'string') {
            //   userInfo.roles = JSON.stringify(userInfo.roles);
            // }
            if (userInfo.id === null) {
                throw new Error("Invalid user");
            }
            else {
                const refreshToken = userInfo.refresh_token ? userInfo.refresh_token : null;
                try {
                    await this.pool.connect();
                    return await this.pool.query("UPDATE users SET login = ($1), nickname = ($2), email = ($3), roles = ($4), locale = ($5), active = ($6), reset_password = ($7), refresh_token = ($8) WHERE id = ($9) RETURNING *", [userInfo.login, userInfo.nickname, userInfo.email, userInfo.roles, userInfo.locale, userInfo.active, userInfo.reset_password, refreshToken, userInfo.id]);
                }
                catch (err) {
                    console.error(err);
                    throw err;
                }
            }
        };
        this.logoutUser = async (userId, res, next) => {
            let user = null;
            let client = null;
            try {
                client = await this.pool.connect();
                if (userId === null) {
                    next(createError(500, "Invalid user, can not logout"));
                }
                else {
                    let result = await client.query("SELECT * FROM users WHERE id = $1", [userId]);
                    let rows = result?.rows;
                    if (rows && Array.isArray(rows)) {
                        user = rows[0];
                    }
                    else {
                        next(createError(500, "Could not find user"));
                    }
                    if (objectIsUserInterface(user)) {
                        try {
                            client.query("UPDATE users SET login = ($1), nickname = ($2), email = ($3), roles = ($4), locale = ($5), active = ($6), reset_password = ($7), refresh_token = ($8) WHERE id = ($9)", [user.login, user.nickname, user.email, user.roles, user.locale, user.active, user.reset_password, null, user.id]);
                        }
                        catch (err) {
                            console.error(err);
                            throw err;
                        }
                    }
                    else
                        throw new Error("Object is not a user");
                }
            }
            catch (err) {
                console.error(err);
                return next(err);
            }
            finally {
                client?.release(false);
            }
            res.status(204).send();
        };
        this.deleteUser = async (id, res, next) => {
            try {
                await this.pool.connect();
                await this.pool.query("DELETE FROM users WHERE id = $1", [id]);
                res.status(200).send("Success");
            }
            catch (err) {
                console.error(err);
                return next(err);
            }
        };
        this.getUserById = async (id, res, next) => {
            try {
                await this.pool.connect();
                let user = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
                if (user && Array.isArray(user)) {
                    user = user[0];
                }
                else {
                    next(createError(500, "Could not find user"));
                }
                if (objectIsUserInterface(user)) {
                    if (user) {
                        delete user.password;
                        res.send({ user: user });
                    }
                    else {
                        return next(createError(401, "Unauthorized"));
                    }
                }
                throw new Error("Object is not a user");
            }
            catch (err) {
                return next(err);
            }
        };
        this.init = async (res, next) => {
            try {
                // let db = this.dbUtils.getDb();
                // try {
                //   const drop = db.prepare("DROP TABLE IF EXISTS users");
                //   const changes = drop.run();
                //   console.log(changes);
                // } catch (err) {
                //   console.error(err);
                // }
                // const create = db.prepare(
                //   "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, pwd TEXT, nickname TEXT, email TEXT, roles TEXT, locale TEXT ,active INTEGER, reset_password INTEGER, refresh_token TEXT)"
                // );
                // create.run();
                const users = [
                    {
                        login: "admin",
                        password: "admin",
                        nickname: "Admin",
                        email: "na@donotreply.com",
                        roles: ["admin", "user"],
                        locale: "enUS",
                        active: 1,
                        reset_password: 0,
                    },
                    {
                        login: "user",
                        password: "user",
                        nickname: "User",
                        email: "na2@donotreply.com",
                        roles: ["user"],
                        locale: "enUS",
                        active: 1,
                        reset_password: 0,
                    },
                ];
                users.forEach(async (user) => {
                    await this.insertUserReusable(user, next);
                });
                res.send("Initialized user table");
            }
            catch (err) {
                return next(err);
            }
        };
    }
}
export default PGUsers;
//# sourceMappingURL=PGUsers.js.map