import express from "express";
import PGRoles from "../db/PGRoles.js";
import { verifyAdmin, verifyUser } from "../middleware/auth.js";
const router = express.Router();
router.get('/', verifyUser, function (req, res, next) {
    const pgRoles = new PGRoles();
    pgRoles.getRoles(res, next);
});
router.get('/init', verifyAdmin, function (req, res, next) {
    const pgRoles = new PGRoles();
    pgRoles.init(res, next);
});
export default router;
//# sourceMappingURL=roles.js.map