const express = require('express');
const { query } = require('../config/db');
const { requiredString, requiredInt, requiredId, dateRange } = require('../utils/params');
const { sendList } = require('../utils/respond');
const { assertAccountExists, escapeLike } = require('../utils/checks');
const { badRequest } = require('../utils/errors');
const asyncWrap = require('../utils/asyncWrap');

const router = express.Router();

// Chỉ trả về thông tin công khai: không có MatKhau, DiaChi
const PUBLIC_COLUMNS = 'IDTaiKhoan, TenTrongGame, CapDoTK, DiemXepHang';

// 2. Danh sách tài khoản (thông tin công khai)
router.get('/', asyncWrap(async (req, res) => {
  const rows = await query(`SELECT ${PUBLIC_COLUMNS} FROM TaiKhoan ORDER BY IDTaiKhoan`);
  sendList(res, rows);
}));

// 5. Tìm tài khoản theo tên trong game (chứa từ khóa)
// GET /api/taikhoan/tim-kiem?tuKhoa=dragon
router.get('/tim-kiem', asyncWrap(async (req, res) => {
  const tuKhoa = requiredString(req.query, 'tuKhoa');
  const rows = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM TaiKhoan
     WHERE TenTrongGame LIKE ? ESCAPE '!'
     ORDER BY TenTrongGame`,
    [`%${escapeLike(tuKhoa)}%`]
  );
  sendList(res, rows);
}));

// 8. Tài khoản có cấp độ trong khoảng [minLevel, maxLevel], xếp hạng giảm dần
// GET /api/taikhoan/cap-do?minLevel=10&maxLevel=30
router.get('/cap-do', asyncWrap(async (req, res) => {
  const minLevel = requiredInt(req.query, 'minLevel', { min: 0 });
  const maxLevel = requiredInt(req.query, 'maxLevel', { min: 0 });
  if (minLevel > maxLevel) throw badRequest("'minLevel' không được lớn hơn 'maxLevel'.");

  const rows = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM TaiKhoan
     WHERE CapDoTK BETWEEN ? AND ?
     ORDER BY DiemXepHang DESC, IDTaiKhoan ASC`,
    [minLevel, maxLevel]
  );
  sendList(res, rows);
}));

// 12. Tướng mà tài khoản đang sở hữu (qua bảng TaiKhoan_Tuong)
// GET /api/taikhoan/:id/tuong-so-huu
router.get('/:id/tuong-so-huu', asyncWrap(async (req, res) => {
  const id = requiredId(req.params.id, 'IDTaiKhoan');
  await assertAccountExists(id);

  const rows = await query(
    `SELECT t.*
     FROM TaiKhoan_Tuong tt
     JOIN Tuong t ON t.IDTuong = tt.IDTuong
     WHERE tt.IDTaiKhoan = ?
     ORDER BY t.ViTriChienDau ASC, t.TenTuong ASC`,
    [id]
  );
  sendList(res, rows);
}));

// Lịch sử giao dịch mua trang phục của tài khoản trong khoảng ngày, mới nhất trước
// GET /api/taikhoan/:id/giao-dich?tuNgay=2026-01-01&denNgay=2026-03-31
router.get('/:id/giao-dich', asyncWrap(async (req, res) => {
  const id = requiredId(req.params.id, 'IDTaiKhoan');
  const { from, toExclusive } = dateRange(req.query, 'tuNgay', 'denNgay');
  await assertAccountExists(id);

  const rows = await query(
    `SELECT g.*, tp.TenGoi, t.TenTuong
     FROM LichSuGiaoDich g
     JOIN TrangPhuc tp ON tp.IDTrangPhuc = g.IDTrangPhuc
     JOIN Tuong t ON t.IDTuong = tp.IDTuong
     WHERE g.IDTaiKhoan = ?
       AND g.ThoiGianMua >= ? AND g.ThoiGianMua < ?
     ORDER BY g.ThoiGianMua DESC`,
    [id, from, toExclusive]
  );
  sendList(res, rows);
}));

// Lịch sử đấu của tài khoản theo chế độ chơi, sắp xếp theo thời gian bắt đầu trận giảm dần
// GET /api/taikhoan/:id/lich-su-tran-dau?cheDoChoi=Xếp hạng
router.get('/:id/lich-su-tran-dau', asyncWrap(async (req, res) => {
  const id = requiredId(req.params.id, 'IDTaiKhoan');
  const cheDoChoi = requiredString(req.query, 'cheDoChoi');
  await assertAccountExists(id);

  const rows = await query(
    `SELECT lsd.*, td.CheDoChoi, td.ThoiGianBatDau, t.TenTuong
     FROM LichSuTranDau lsd
     JOIN TranDau td ON td.IDTranDau = lsd.IDTranDau
     JOIN Tuong t ON t.IDTuong = lsd.IDTuong
     WHERE lsd.IDTaiKhoan = ? AND td.CheDoChoi = ?
     ORDER BY td.ThoiGianBatDau DESC`,
    [id, cheDoChoi]
  );
  sendList(res, rows);
}));

module.exports = router;
