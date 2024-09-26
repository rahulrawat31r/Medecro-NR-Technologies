var mysql = require("mysql2");

// Connections for the localhost 
// var pool = mysql.createPool({
//   host: "containers-us-west-118.railway.app",
//   port: 6821,
//   user: "root",
//   password:"rv6ztolARVLSGl89lhL0",
//   database:"railway",
//   charset : 'utf8mb4',
//   connectionLimit: 100,
// });



// Connections for the online database


// var mysql = require("mysql2");
// var pool = mysql.createPool({
//   host: "containers-us-west-193.railway.app",
//   port : 5778,
//   user: "root",
//   password: "1WudmRxLCy4uTvZ2ZufZ",
//   database: "railway",
//   connectionLimit : 10
 
// });


// Connections for the localhost 
var pool = mysql.createPool({
  host: process.env.MYSQLHOST ||  "localhost",
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER || "rahul",
  password:process.env.MYSQLPASSWORD || "kake",
  database:process.env.MYSQLDATABASE || "medecro",
  connectionLimit: 100,
});


module.exports = pool;
