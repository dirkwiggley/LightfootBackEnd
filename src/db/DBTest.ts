import DBUtils from "./DBUtils.js";

class DBTest {
  private dbUtils: DBUtils | null = null;

  constructor() {
    this.dbUtils = new DBUtils();
  }

  getTest = (res, next) => {
    try {
      let db = this.dbUtils.getDb();

      const select = db.prepare("SELECT * FROM test");
      const results = select.all();
      res.send(results);
    } catch (err) {
      console.error(err);
      return next(err);
    }
  };

  init = (res, next) => {
    try {
      let db = this.dbUtils.getDb();
      const create = db.prepare(
        "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, abbr TEXT, desc TEXT)"
      );
      create.run();

      const attributes = [
        { name: "Agility", abbr: "AGI", desc: "agility" },
        { name: "Smarts", abbr: "SMA", desc: "smarts" },
        { name: "Spirit", abbr: "SPI", desc: "spirit" },
        { name: "Strength", abbr: "STR", desc: "agility" },
        { name: "Vigor", abbr: "VIG", desc: "vigor" },
        { name: "Fighting", abbr: "FIGHTING", desc: "fighting" },
        { name: "Shooting", abbr: "SHOOTING", desc: "shooting" },
        { name: "Athletics", abbr: "ATHLETICS", desc: "athletics" },
      ];

      const insert = db.prepare(
        "INSERT INTO test(name, abbr, desc) VALUES (?, ?, ?)"
      );
      attributes.forEach((attribute) => {
        insert.run(attribute.name, attribute.abbr, attribute.desc);
      });
      res.send("Initialized attributes");
    } catch (err) {
      console.error(err);
      return next(err);
    }
  };

  drop = (res, next) => {
    try {
      let db = this.dbUtils.getDb();
      const drop = db.prepare("DROP TABLE test");
      drop.run("DROP TABLE test", function (err) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          console.log("Dropped table");
          res.send("Dropped test table");
        }
      });
    } catch (err) {
      console.error(err);
      return next(err);
    }
  };
}

export default DBTest;
