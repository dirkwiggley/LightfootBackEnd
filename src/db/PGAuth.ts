import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Express from "express";

import { createError } from "../utils/error.js";
import PGUtils from "./PGUtils.js";
import PGUsers from "./PGUsers.js";
import { hash, compareHash } from "./CommonAuth.js"
import { UserInterface, objectIsDecodedToken, objectIsUserInterface } from "./types.js";

class PGAuth {
  private pgUtils = new PGUtils();
  pool = this.pgUtils.getPool();

  createUserObjForTokens(userId: number, login: string, isAdmin: boolean, timestamp: number) {
    return {
      user_id: userId,
      login: login,
      isAdmin: isAdmin,
      timestamp: timestamp,
    }
  }

  generateAccessToken = (user: UserInterface) => {
    const isAdmin = user.roles.includes("ADMIN");
    const timestamp = Date.now();
    const tokenKey: string | undefined = process.env.ACCESS_KEY;
    if (!tokenKey) {
      console.error("Could not locate ACCESS_KEY");
      return;
    }

    return jwt.sign(
      this.createUserObjForTokens(user.id, user.login, isAdmin, timestamp),
      tokenKey,
      { expiresIn: '2h' }
    );
  };

  generateRefreshToken = (user: UserInterface) => {
    const isAdmin = user.roles.includes("ADMIN");
    const timestamp = Date.now();
    const refreshKey: string | undefined = process.env.REFRESH_KEY;
    if (!refreshKey) {
      console.error("Could not locate REFRESH_KEY");
      return;
    }
    return jwt.sign(
      this.createUserObjForTokens(user.id, user.login, isAdmin, timestamp),
      refreshKey,
      { expiresIn: '1h' }
    );
  };

  login = async (
    res: Express.Response,
    login: string,
    password: string,
    next: any
  ) => {
    try {
      if (!login || login === "" || !password || password === "") {
        console.error("Illegal login params");
        return next(createError(500, "Illegal login params"));
      }

      await this.pool.connect();
      const {rows} = await this.pool.query("SELECT * FROM users WHERE login = $1", [login]);
      let result = null;
      let user = null;
      if (rows && Array.isArray(rows)) {
        if (objectIsUserInterface(rows[0])) {
          user = { ...rows[0] };
          result = compareHash(password, user.pwd);
        } else {
          console.error("No user found");
          return next(createError(400, "No user found"));
        }
      }

      if (result) {
        // Do not send the pwd back with the user!
        delete user.pwd;

        // Create tokens
        // This token lives on the user object
        const refreshToken = this.generateRefreshToken(user);
        if (!refreshToken) {
          console.error("Could not get refresh token");
          return next(createError(500, "Could not get refresh token"));
        } else {
          // Add the access token to the user object
          user.refreshtoken = refreshToken;
          const pgUsers = new PGUsers();
          pgUsers.updateUser(user);
        }
        const accessToken = this.generateAccessToken(user);
        // This token lives in a cookie
        if (!accessToken) {
          next(createError(500, "Could not generate access token"));
        }

        // Store the access token on the client side as a cookie marked HTTPOnly
        // the refresh token is returned as data and should only be stored
        // on the client side in memory
        res
          .cookie("access_token", accessToken, {
            expires: new Date(new Date().getTime() + (1000 * 60 * 15)),
            httpOnly: true, 
            // sameSite: "none", 
            // secure: true 
          })
          .status(200)
          .json({
            ...user
          });
      } else {
        return next(createError(400, "Unauthorized"));
      }
    } catch (err) {
      console.error(err);
      return next(err);
    }
  };

  // When the access token has expired, use the refresh token to create a
  // new one
  refresh = async (accessToken: string, res: Express.Response, next: any) => {
    try {
      // send error if there is no token or it's invalid
      if (!accessToken)
        return res.status(401).json("You are not authenticated");

      // verify the access token
      const config = process.env;
      const decodedToken = jwt.verify(accessToken, config.ACCESS_KEY);
      // get the user from the db
      await this.pool.connect();
      let user: UserInterface = null;
      if (objectIsDecodedToken(decodedToken)) {
        const {rows} = await this.pool.query("SELECT * FROM users WHERE id = $1", [decodedToken.user_id]);
        if (rows && Array.isArray(rows) && objectIsUserInterface(rows[0])) {
          user = rows[0];
          if (!user.active || !user.active) {
            next(createError(410, "User has been disabled"));
          }
        }
      }
      if (!user) {
        next(createError(500, "Could not find user"));
      }

      // generate a new refresh token
      const refreshKey: string | undefined = process.env.REFRESH_KEY;
      if (!refreshKey) {
        console.log("Could not get REFRESH_KEY");
        next(createError(400, "Could not get REFRESH_KEY"));
      }

      const newRefreshToken = this.generateRefreshToken(user);
      // Store the refresh token on the client side as a cookie marked HttpOnly
      // the access token is returned as data and should only be stored
      // on the client side in memory
      if (!newRefreshToken) {
        console.log("Could not create refresh token");
        next(createError(400, "Could not create refresh token"));
      }
      res
        .cookie("refresh_token", newRefreshToken, { expires: new Date(new Date().getTime() + (1000 * 60 * 15)), httpOnly: true })
        .status(200)
        .json({
          ...user
        });
    } catch (err) {
      console.error(err);
      return next(err);
    }
  };

  resetPwd = async (id: number, pwd: string, res: Express.Response, next: any) => {
    let client = await this.pool.connect();
    try {
      const {rows} = await client.query("SELECT * FROM users WHERE id = $1", [id]);
      let userInfo = null;
      if (objectIsUserInterface(rows[0])) {
        userInfo = rows[0];
        const hashPwd = hash(pwd)
        await client.query("UPDATE users SET pwd = ($1), resetpwd = ($2) WHERE id = ($3)", [hashPwd, false, userInfo.id]);
  
        res.status(204).send()

      } else {
        return next(createError(500, "No such user"))
      }
    } catch (err) {
      console.error(err)
      return next(err)
    } finally {
      client?.release(true);
    }
  };

  logout = (
    userId: number,
    req: Express.Request,
    res: Express.Response,
    next: any
  ) => {
    const pgUsers = new PGUsers;
    pgUsers.logoutUser(userId, res, next);
  };

}

export default PGAuth;