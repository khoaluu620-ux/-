const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'game',
  waitForConnections: true,
  connectionLimit: 10,
  // Trả DATETIME dạng chuỗi 'YYYY-MM-DD HH:mm:ss' thay vì Date, tránh lệch múi giờ trong JSON
  dateStrings: true,
});

/**
 * Chạy câu SQL có tham số (dấu ?) và trả về danh sách dòng.
 * Mọi giá trị người dùng nhập đều phải truyền qua `params`, không nối chuỗi trực tiếp.
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { pool, query };
