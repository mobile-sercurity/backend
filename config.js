const mysql = require("mysql");

const connectionPool = mysql.createPool({
  connectionLimit: 10,
  host: "127.0.0.1",
  user: "ha",
  password: "ha@123456",
  database: "shop_shoe",
});

module.exports = connectionPool;
