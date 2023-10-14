import express from "express"
import DBTest from "../db/DBTest.js"
import PGUsers from "../db/PGUsers.js";

const router = express.Router()

/* GET test listing. */
router.get('/', function(req: any, res: any, next: any) {
  const dBTest = new DBTest()
  dBTest.getTest(res, next)
});

router.get('/init', function (req, res, next) {
  const dBTest = new DBTest();
  dBTest.init(res, next);
});

router.get('/drop', function (req, res, next) {
  const dBTest = new DBTest();
  dBTest.drop(res, next);
});

export default router;
