const mysql = require("mysql");

const connectionPool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "nmtkma0550",
  database: "mobile_security_shop_shoes",
});

module.exports = connectionPool;
