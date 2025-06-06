const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '192.250.229.162',
  port: 3306,
  user: 'nisapoti_nis',
  password: 'Alvin@2025',
  database: 'nisapoti_nis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000
});

module.exports = pool;
