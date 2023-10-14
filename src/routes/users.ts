import express from "express";

import { verifyAdmin, verifyUser } from "../middleware/auth.js";
import PGUsers from "../db/PGUsers.js";

const router = express.Router();
const users = new PGUsers();

//router.get('/', function(req, res, next) {  
router.get('/', verifyUser, function(req, res, next) {
  console.log(req.headers);
  users.getUsers(res, next);
});

/* Update/Insert a user */
router.post('/update', verifyAdmin, function(req, res, next) {
  const userInfo = req.body.userInfo;
  users.insertUser(userInfo, res, next);
});

router.get('/delete/:id', verifyAdmin, function(req, res, next) {
  users.deleteUser(Number(req.params.id), res, next);
});

router.get('/id/:id', verifyUser, function(req, res, next) {
  users.getUserById(Number(req.params.id), res, next);
});

router.get('/init', function(req, res, next) {
  users.init(res, next);
})

export default router;
