/** Trả về danh sách với cấu trúc thống nhất: { success, count, data }. */
function sendList(res, rows) {
  res.json({ success: true, count: rows.length, data: rows });
}

module.exports = { sendList };
