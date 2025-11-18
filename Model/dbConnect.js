const mysql = require("mysql2");

const pool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.log("Database Connection Error:", err.message);
    } else {
        console.log("Database Connected");
        connection.release();
    }
});


module.exports = pool;