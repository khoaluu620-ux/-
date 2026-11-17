const express = require('express');
const { query } = require('../config/db');
const { requiredString, requiredInt } = require('../utils/params');
const { sendList } = require('../utils/respond');
const asyncWrap = require('../utils/asyncWrap');

const router = express.Router();

// 10. Lịch sử trận đấu theo kết quả, số mạng hạ gục >= ngưỡng, sắp xếp SoMangHaGuc giảm dần
// GET /api/lich-su-tran-dau?ketQua=Thắng&soMangHaGucToiThieu=5
router.get('/', asyncWrap(async (req, res) => {
  const ketQua = requiredString(req.query, 'ketQua');
  const soMangHaGucToiThieu = requiredInt(req.query, 'soMangHaGucToiThieu', { min: 0 });
  const rows = await query(
    `SELECT * FROM LichSuTranDau
     WHERE KetQua = ? AND SoMangHaGuc >= ?
     ORDER BY SoMangHaGuc DESC, IDLichSu ASC`,
    [ketQua, soMangHaGucToiThieu]
  );
  sendList(res, rows);
}));

module.exports = router;
