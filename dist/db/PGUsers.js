import PGUtils from "./PGUtils.js";
import { objectIsUserInterface } from "./types.js";
import { createError } from "../utils/error.js";
import { hash } from "./CommonAuth.js";
class PGUsers {
    constructor() {
        this.getUsers = async (res, next) => {
            let client = null;
            try {
                let outArray = [];
                const db = new PGUtils();
                const { rows } = await db.query("SELECT * FROM users", []);
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
                const db = new PGUtils();
                const { rows } = await db.query("SELECT active FROM users WHERE id = $1", [id]);
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
                    let password = null;
                    if (userInfo.password) {
                        password = userInfo.password;
                    }
                    else {
                        password = "password";
                    }
                    const tempPwd = hash(password);
                    delete userInfo.id;
                    const db = new PGUtils();
                    result = await db.query("INSERT INTO users (login, pwd, nickname, email, roles, locale, active, reset_password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *", [userInfo.login, tempPwd, userInfo.nickname, userInfo.email, userInfo.roles, userInfo.locale, userInfo.active, userInfo.reset_password]);
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
            if (userInfo.id === null) {
                throw new Error("Invalid user");
            }
            else {
                const refreshToken = userInfo.refresh_token ? userInfo.refresh_token : null;
                try {
                    const db = new PGUtils();
                    return await db.query("UPDATE users SET login = ($1), nickname = ($2), email = ($3), roles = ($4), locale = ($5), active = ($6), reset_password = ($7), refresh_token = ($8) WHERE id = ($9) RETURNING *", [userInfo.login, userInfo.nickname, userInfo.email, userInfo.roles, userInfo.locale, userInfo.active, userInfo.reset_password, refreshToken, userInfo.id]);
                }
                catch (err) {
                    console.error(err);
                    throw err;
                }
            }
        };
        this.logoutUser = async (userId, res, next) => {
            let user = null;
            try {
                if (userId === null) {
                    next(createError(500, "Invalid user, can not logout"));
                }
                else {
                    const db = new PGUtils();
                    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
                    if (rows && Array.isArray(rows)) {
                        user = rows[0];
                    }
                    else {
                        next(createError(500, "Could not find user"));
                    }
                    if (objectIsUserInterface(user)) {
                        try {
                            await db.query("UPDATE users SET login = ($1), nickname = ($2), email = ($3), roles = ($4), locale = ($5), active = ($6), reset_password = ($7), refresh_token = ($8) WHERE id = ($9)", [user.login, user.nickname, user.email, user.roles, user.locale, user.active, user.reset_password, null, user.id]);
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
            res.status(204).send();
        };
        this.deleteUser = async (id, res, next) => {
            try {
                const db = new PGUtils();
                await db.query("DELETE FROM users WHERE id = $1", [id]);
                res.status(200).send("Success");
            }
            catch (err) {
                console.error(err);
                return next(err);
            }
        };
        this.getUserById = async (id, res, next) => {
            try {
                const db = new PGUtils();
                let { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
                let user = null;
                if (rows && Array.isArray(rows)) {
                    user = rows[0];
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