const { query } = require('../config/db');
const { notFound } = require('./errors');

/** Ném 404 nếu tài khoản không tồn tại. */
async function assertAccountExists(idTaiKhoan) {
  const rows = await query('SELECT 1 FROM TaiKhoan WHERE IDTaiKhoan = ? LIMIT 1', [idTaiKhoan]);
  if (rows.length === 0) throw notFound(`Không tìm thấy tài khoản '${idTaiKhoan}'.`);
}

/** Escape ký tự đặc biệt của LIKE (dùng '!' làm ký tự escape) để từ khóa khớp như chuỗi thường. */
function escapeLike(text) {
  return text.replace(/[!%_]/g, (c) => `!${c}`);
}

module.exports = { assertAccountExists, escapeLike };
