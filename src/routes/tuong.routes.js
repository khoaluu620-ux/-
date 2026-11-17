const express = require('express');
const { query } = require('../config/db');
const { requiredString, requiredNumber } = require('../utils/params');
const { sendList } = require('../utils/respond');
const asyncWrap = require('../utils/asyncWrap');

const router = express.Router();

// 1. Toàn bộ tướng, đầy đủ thông tin
router.get('/', asyncWrap(async (req, res) => {
  const rows = await query('SELECT * FROM Tuong ORDER BY IDTuong');
  sendList(res, rows);
}));

// 6. Tướng theo vị trí chiến đấu và lượng máu tối thiểu
// GET /api/tuong/vi-tri?viTriChienDau=Đỡ đòn&luongMauToiThieu=1000
router.get('/vi-tri', asyncWrap(async (req, res) => {
  const viTri = requiredString(req.query, 'viTriChienDau');
  const luongMau = requiredNumber(req.query, 'luongMauToiThieu', { min: 0 });
  const rows = await query(
    'SELECT * FROM Tuong WHERE ViTriChienDau = ? AND LuongMau >= ? ORDER BY IDTuong',
    [viTri, luongMau]
  );
  sendList(res, rows);
}));

// 9. Tướng có giá bán <= số vàng, ưu tiên sát thương giảm dần rồi tên tăng dần
// GET /api/tuong/mua-duoc?soVang=5000
router.get('/mua-duoc', asyncWrap(async (req, res) => {
  const soVang = requiredNumber(req.query, 'soVang', { min: 0 });
  const rows = await query(
    'SELECT * FROM Tuong WHERE GiaBan <= ? ORDER BY SatThuong DESC, TenTuong ASC',
    [soVang]
  );
  sendList(res, rows);
}));

module.exports = router;
