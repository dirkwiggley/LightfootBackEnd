import express from "express"
import DBUtils from "../db/DBUtils.js"
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router()
const dbUtils = new DBUtils()

/* GET methods listing. */
router.get('/', function(req, res, next) {
  // router.get('/', verifyAdmin, function(req, res, next) {
  const availableMethods = { "availableMethods": ["tables", "createtable", "droptable", "createcolumn", "dropcolumn", "insertrow", "deleterow", "updateelement"] }
  res.send(availableMethods)
});

// router.get('/tables', function(req, res, next) {
 router.get('/tables', verifyAdmin, function(req, res, next) {  
  dbUtils.getTables(res);
});

// router.get('/createtable/:tablename/:columnname', function (req, res, next) {
router.get('/createtable/:tablename/:columnname', verifyAdmin, function (req: { params: { tablename: string; columnname: string; }; }, res: any, next: any) {  
  dbUtils.createTable(res, req.params.tablename, req.params.columnname);
});

router.delete('/droptable/:tablename', verifyAdmin, function (req, res, next) {
  dbUtils.dropTable(res, req.params.tablename);
});

// router.get('/createcolumn/:tablename/:columnname', function(req, res, next) {
router.get('/createcolumn/:tablename/:columnname/:datatype', verifyAdmin, function(req, res, next) {  
  dbUtils.createColumn(res, req.params.tablename, req.params.columnname, req.params.datatype);
});

router.delete('/dropcolumn/:tablename/:columnmane', verifyAdmin, function(req, res, next) {
  dbUtils.dropColumn(res, req.params.tablename, req.params.columnmane);
});

router.get('/insertrow/:table/', verifyAdmin, function(req, res, next) {
  dbUtils.insertRow(res, req.params.table)
});

router.delete('/deleterow/:table/:id', verifyAdmin, function(req, res, next) {
  dbUtils.deleteRow(res, req.params.table, Number(req.params.id));
});

// router.get('/updateelement/:table/:id/:column/:data', function(req, res, next) {
router.get('/updateelement/:table/:id/:column/:data', verifyAdmin, function(req, res, next) {
  dbUtils.updateElement(res, req.params.table, req.params.id, req.params.column, req.params.data)
});

router.get('/:table/columns', verifyAdmin, function(req, res, next) {
  dbUtils.getColumns(res, req.params.table);
});

// router.get('/tabledata/:table', function(req, res, next) {
router.get('/tabledata/:table', verifyAdmin, function(req, res, next) {
  dbUtils.getTableData(res, req.params.table);
});

router.get('/tablerows/:table', verifyAdmin, function(req, res, next) {
  dbUtils.getTableRows(res, req.params.table);
});

router.get('/rename/table/:old_table/:new_table', verifyAdmin, function(req, res, next) {
  dbUtils.renameTable(res, req.params.old_table, req.params.new_table);
});

router.get('/rename/:table/column/:old_column/:new_column', verifyAdmin, function(req, res, next) {
  dbUtils.renameColumn(res, req.params.table, req.params.old_column, req.params.new_column);
});

router.get('/by/:tablename/:columnname/:value', verifyAdmin, function(req, res, next) {
  dbUtils.getBy(res, req.params.tablename, req.params.columnname, req.params.value);
});

router.get('/export/', verifyAdmin, function(req, res, next) {
  dbUtils.exportDB(res);
});

export default router;
