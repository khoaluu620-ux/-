/** Bọc handler async để lỗi được chuyển sang middleware xử lý lỗi (dùng cho Express 4). */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
