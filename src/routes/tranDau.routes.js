const express = require('express');
const { query } = require('../config/db');
const { requiredString, dateRange } = require('../utils/params');
const { sendList } = require('../utils/respond');
const asyncWrap = require('../utils/asyncWrap');

const router = express.Router();

// 3. Trận đấu theo chế độ chơi
// GET /api/trandau?cheDoChoi=Xếp hạng
router.get('/', asyncWrap(async (req, res) => {
  const cheDoChoi = requiredString(req.query, 'cheDoChoi');
  const rows = await query(
    'SELECT * FROM TranDau WHERE CheDoChoi = ? ORDER BY ThoiGianBatDau DESC, IDTranDau ASC',
    [cheDoChoi]
  );
  sendList(res, rows);
}));

// Trận đấu diễn ra trong khoảng thời gian, kèm kết quả từng người chơi
// Trận nằm trong khoảng khi ThoiGianBatDau >= tuNgay và ThoiGianKetThuc <= cuối ngày denNgay.
// Người chơi trong mỗi trận được sắp xếp theo SoMangHaGuc giảm dần.
// GET /api/trandau/theo-thoi-gian?tuNgay=2026-01-01&denNgay=2026-03-31
router.get('/theo-thoi-gian', asyncWrap(async (req, res) => {
  const { from, toExclusive } = dateRange(req.query, 'tuNgay', 'denNgay');

  const matches = await query(
    `SELECT * FROM TranDau
     WHERE ThoiGianBatDau >= ? AND ThoiGianKetThuc < ?
     ORDER BY ThoiGianBatDau ASC, IDTranDau ASC`,
    [from, toExclusive]
  );
  if (matches.length === 0) return sendList(res, []);

  const players = await query(
    `SELECT lsd.IDTranDau, tk.TenTrongGame, t.TenTuong,
            lsd.SoMangHaGuc, lsd.SoMangBiHaGuc, lsd.HaGuc, lsd.KetQua
     FROM LichSuTranDau lsd
     JOIN TaiKhoan tk ON tk.IDTaiKhoan = lsd.IDTaiKhoan
     JOIN Tuong t ON t.IDTuong = lsd.IDTuong
     WHERE lsd.IDTranDau IN (?)
     ORDER BY lsd.IDTranDau ASC, lsd.SoMangHaGuc DESC, tk.TenTrongGame ASC`,
    [matches.map((m) => m.IDTranDau)]
  );

  // Gom người chơi theo từng trận
  const playersByMatch = new Map();
  for (const p of players) {
    const { IDTranDau, ...info } = p;
    if (!playersByMatch.has(IDTranDau)) playersByMatch.set(IDTranDau, []);
    playersByMatch.get(IDTranDau).push(info);
  }

  const result = matches.map((m) => ({
    ...m,
    NguoiChoi: playersByMatch.get(m.IDTranDau) || [],
  }));
  sendList(res, result);
}));

module.exports = router;
