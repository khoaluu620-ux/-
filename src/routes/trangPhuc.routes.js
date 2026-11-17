const express = require('express');
const { query } = require('../config/db');
const { requiredString, optionalString } = require('../utils/params');
const { sendList } = require('../utils/respond');
const { escapeLike } = require('../utils/checks');
const { badRequest } = require('../utils/errors');
const asyncWrap = require('../utils/asyncWrap');

const router = express.Router();

// 4. Toàn bộ trang phục, sắp xếp giá bán tăng dần
router.get('/', asyncWrap(async (req, res) => {
  const rows = await query('SELECT * FROM TrangPhuc ORDER BY GiaBan ASC, IDTrangPhuc ASC');
  sendList(res, rows);
}));

// 7. Trang phục theo bậc độ hiếm, giá bán giảm dần
// GET /api/trangphuc/theo-bac-hiem?bacDoHiem=Sử thi
router.get('/theo-bac-hiem', asyncWrap(async (req, res) => {
  const bacDoHiem = requiredString(req.query, 'bacDoHiem');
  const rows = await query(
    'SELECT * FROM TrangPhuc WHERE BacDoHiem = ? ORDER BY GiaBan DESC, IDTrangPhuc ASC',
    [bacDoHiem]
  );
  sendList(res, rows);
}));

// 11. Trang phục kèm tên tướng sở hữu, lọc theo tên tướng và/hoặc bậc độ hiếm, giá bán tăng dần
// GET /api/trangphuc/kem-tuong?tenTuong=Yasuo&bacDoHiem=Sử thi
router.get('/kem-tuong', asyncWrap(async (req, res) => {
  const tenTuong = optionalString(req.query, 'tenTuong');
  const bacDoHiem = optionalString(req.query, 'bacDoHiem');
  if (tenTuong === undefined && bacDoHiem === undefined) {
    throw badRequest("Cần truyền ít nhất một trong hai tham số 'tenTuong' hoặc 'bacDoHiem'.");
  }

  const conditions = [];
  const params = [];
  if (tenTuong !== undefined) {
    conditions.push("t.TenTuong LIKE ? ESCAPE '!'");
    params.push(`%${escapeLike(tenTuong)}%`);
  }
  if (bacDoHiem !== undefined) {
    conditions.push('tp.BacDoHiem = ?');
    params.push(bacDoHiem);
  }

  const rows = await query(
    `SELECT tp.*, t.TenTuong
     FROM TrangPhuc tp
     JOIN Tuong t ON t.IDTuong = tp.IDTuong
     WHERE ${conditions.join(' AND ')}
     ORDER BY tp.GiaBan ASC, tp.IDTrangPhuc ASC`,
    params
  );
  sendList(res, rows);
}));

module.exports = router;
