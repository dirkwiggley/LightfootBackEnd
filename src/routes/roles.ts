import express from "express"

import DBRoles from "../db/DBRoles.js"
import { verifyAdmin, verifyUser } from "../middleware/auth.js"

const router = express.Router()

router.get('/', verifyUser, function (req, res, next) {
  const dbRoles = new DBRoles()
  dbRoles.getRoles(res, next)
})

router.get('/init', verifyAdmin, function (req, res, next) {
  const dbRoles = new DBRoles()
  dbRoles.init(res, next)
})

export default router
