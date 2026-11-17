// Kiểm thử tích hợp: cần CSDL đã nạp sql/schema.sql (có dữ liệu mẫu).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { pool } = require('../src/config/db');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await pool.end();
});

async function get(path) {
  const res = await fetch(base + path);
  const body = await res.json();
  return { status: res.status, body };
}

// Lấy khóa chính của danh sách; mỗi bảng có khóa khác nhau (IDTuong dùng chung với TrangPhuc nên truyền rõ tên khóa)
const ids = (rows, key) => rows.map((r) => r[key]);

test('health check', async () => {
  const { status, body } = await get('/health');
  assert.equal(status, 200);
  assert.equal(body.success, true);
});

// 1
test('1. GET /tuong trả về toàn bộ tướng với đầy đủ cột', async () => {
  const { status, body } = await get('/tuong');
  assert.equal(status, 200);
  assert.equal(body.count, 5);
  assert.deepEqual(Object.keys(body.data[0]).sort(),
    ['GiaBan', 'IDTuong', 'LuongMau', 'SatThuong', 'TenTuong', 'ViTriChienDau']);
});

// 2
test('2. GET /taikhoan không trả MatKhau và DiaChi', async () => {
  const { status, body } = await get('/taikhoan');
  assert.equal(status, 200);
  assert.equal(body.count, 3);
  for (const acc of body.data) {
    assert.deepEqual(Object.keys(acc).sort(), ['CapDoTK', 'DiemXepHang', 'IDTaiKhoan', 'TenTrongGame']);
  }
});

// 3
test('3. GET /trandau lọc theo cheDoChoi', async () => {
  const { status, body } = await get('/trandau?cheDoChoi=' + encodeURIComponent('Xếp hạng'));
  assert.equal(status, 200);
  assert.deepEqual(ids(body.data, 'IDTranDau'), ['TD003', 'TD001']);
  assert.ok(body.data.every((m) => m.CheDoChoi === 'Xếp hạng'));
});

// 4
test('4. GET /trangphuc sắp xếp GiaBan tăng dần', async () => {
  const { body } = await get('/trangphuc');
  assert.deepEqual(ids(body.data, 'IDTrangPhuc'), ['TP003', 'TP001', 'TP002']);
});

// 5
test('5. GET /taikhoan/tim-kiem tìm theo từ khóa, không phân biệt hoa thường', async () => {
  const { status, body } = await get('/taikhoan/tim-kiem?tuKhoa=dragon');
  assert.equal(status, 200);
  assert.deepEqual(body.data.map((a) => a.TenTrongGame).sort(), ['DragonSlayer', 'Dragonfly']);
  assert.equal(body.data[0].MatKhau, undefined);
});

test('5b. Ký tự % trong từ khóa được coi là chuỗi thường', async () => {
  const { body } = await get('/taikhoan/tim-kiem?tuKhoa=' + encodeURIComponent('%'));
  assert.equal(body.count, 0);
});

// 6
test('6. GET /tuong/vi-tri lọc vị trí và lượng máu tối thiểu', async () => {
  const { status, body } = await get(
    '/tuong/vi-tri?viTriChienDau=' + encodeURIComponent('Đỡ đòn') + '&luongMauToiThieu=3000');
  assert.equal(status, 200);
  assert.deepEqual(ids(body.data, 'IDTuong'), ['T003']);
});

// 7
test('7. GET /trangphuc/theo-bac-hiem sắp xếp GiaBan giảm dần', async () => {
  const { body } = await get('/trangphuc/theo-bac-hiem?bacDoHiem=' + encodeURIComponent('Sử thi'));
  assert.deepEqual(ids(body.data, 'IDTrangPhuc'), ['TP001', 'TP003']);
});

// 8
test('8. GET /taikhoan/cap-do lọc khoảng cấp độ, xếp hạng giảm dần', async () => {
  const { status, body } = await get('/taikhoan/cap-do?minLevel=10&maxLevel=30');
  assert.equal(status, 200);
  assert.deepEqual(ids(body.data, 'IDTaiKhoan'), ['TK003', 'TK002']);
});

// 9
test('9. GET /tuong/mua-duoc: sát thương giảm dần, sau đó theo tên tăng dần', async () => {
  const { body } = await get('/tuong/mua-duoc?soVang=4800');
  assert.deepEqual(ids(body.data, 'IDTuong'), ['T004', 'T005', 'T002', 'T003']); // T005 và T002 cùng 150 sát thương: Ahri trước Ashe
});

// 10
test('10. GET /lich-su-tran-dau lọc kết quả và ngưỡng hạ gục, giảm dần', async () => {
  const { status, body } = await get('/lich-su-tran-dau?ketQua=' + encodeURIComponent('Thắng') + '&soMangHaGucToiThieu=4');
  assert.equal(status, 200);
  assert.deepEqual(body.data.map((r) => r.SoMangHaGuc), [9, 7, 6, 4]);
  assert.ok(body.data.every((r) => r.KetQua === 'Thắng'));
});

// 11
test('11. GET /trangphuc/kem-tuong lọc theo tên tướng', async () => {
  const { status, body } = await get('/trangphuc/kem-tuong?tenTuong=Yasuo');
  assert.equal(status, 200);
  assert.deepEqual(ids(body.data, 'IDTrangPhuc'), ['TP001']);
  assert.equal(body.data[0].TenTuong, 'Yasuo');
});

test('11b. GET /trangphuc/kem-tuong lọc theo bậc hiếm và sắp xếp GiaBan tăng dần', async () => {
  const { body } = await get('/trangphuc/kem-tuong?bacDoHiem=' + encodeURIComponent('Sử thi'));
  assert.deepEqual(ids(body.data, 'IDTrangPhuc'), ['TP003', 'TP001']);
});

test('11c. Không truyền cả hai bộ lọc thì trả 400', async () => {
  const { status } = await get('/trangphuc/kem-tuong');
  assert.equal(status, 400);
});

// 12
test('12. GET /taikhoan/:id/tuong-so-huu trả tướng đang sở hữu', async () => {
  const { status, body } = await get('/taikhoan/TK001/tuong-so-huu');
  assert.equal(status, 200);
  assert.deepEqual(body.data.map((t) => t.TenTuong).sort(), ['Malphite', 'Yasuo']);
});

test('12b. Tài khoản không tồn tại trả 404', async () => {
  const { status } = await get('/taikhoan/TK999/tuong-so-huu');
  assert.equal(status, 404);
});

// Block 2 - 1
test('B2-1. GET /taikhoan/:id/giao-dich lọc khoảng ngày và sắp xếp mới nhất trước', async () => {
  const { status, body } = await get('/taikhoan/TK001/giao-dich?tuNgay=2026-01-01&denNgay=2026-03-31');
  assert.equal(status, 200);
  assert.deepEqual(body.data.map((g) => g.TenGoi), ['Malphite Thạch Giáp', 'Yasuo Hắc Kiếm']);
  assert.equal(body.data[0].TenTuong, 'Malphite');
});

test('B2-1b. Ngày denNgay bao gồm cả giao dịch trong ngày (23:59:59)', async () => {
  const { body } = await get('/taikhoan/TK002/giao-dich?tuNgay=2026-03-31&denNgay=2026-03-31');
  assert.equal(body.count, 1);
});

// Block 2 - 2
test('B2-2. GET /taikhoan/:id/lich-su-tran-dau lọc theo chế độ, thời gian bắt đầu giảm dần', async () => {
  const { status, body } = await get(
    '/taikhoan/TK001/lich-su-tran-dau?cheDoChoi=' + encodeURIComponent('Xếp hạng'));
  assert.equal(status, 200);
  assert.deepEqual(body.data.map((r) => r.IDTranDau), ['TD003', 'TD001']);
  assert.equal(body.data[0].TenTuong, 'Yasuo');
});

// Block 2 - 3
test('B2-3. GET /trandau/theo-thoi-gian: trận trong khoảng, người chơi theo SoMangHaGuc giảm dần', async () => {
  const { status, body } = await get('/trandau/theo-thoi-gian?tuNgay=2026-01-01&denNgay=2026-03-31');
  assert.equal(status, 200);
  assert.deepEqual(ids(body.data, 'IDTranDau'), ['TD001', 'TD002']);
  const td001 = body.data[0];
  assert.deepEqual(td001.NguoiChoi.map((p) => p.SoMangHaGuc), [7, 5, 3]);
  assert.deepEqual(Object.keys(td001.NguoiChoi[0]).sort(),
    ['HaGuc', 'KetQua', 'SoMangBiHaGuc', 'SoMangHaGuc', 'TenTrongGame', 'TenTuong']);
  assert.equal(td001.NguoiChoi[0].TenTrongGame, 'DragonSlayer');
});

test('B2-3b. Khoảng không có trận trả danh sách rỗng', async () => {
  const { status, body } = await get('/trandau/theo-thoi-gian?tuNgay=2000-01-01&denNgay=2000-01-31');
  assert.equal(status, 200);
  assert.equal(body.count, 0);
});

// Kiểm tra lỗi đầu vào
test('Thiếu tham số bắt buộc trả 400', async () => {
  for (const path of ['/trandau', '/tuong/mua-duoc', '/taikhoan/cap-do?minLevel=1',
    '/lich-su-tran-dau?ketQua=Thắng', '/taikhoan/TK001/lich-su-tran-dau']) {
    const { status } = await get(path);
    assert.equal(status, 400, path);
  }
});

test('Số không hợp lệ hoặc min > max trả 400', async () => {
  assert.equal((await get('/tuong/mua-duoc?soVang=abc')).status, 400);
  assert.equal((await get('/taikhoan/cap-do?minLevel=30&maxLevel=10')).status, 400);
});

test('Ngày sai định dạng, không tồn tại, hoặc từ sau đến trả 400', async () => {
  assert.equal((await get('/taikhoan/TK001/giao-dich?tuNgay=01-01-2026&denNgay=2026-03-31')).status, 400);
  assert.equal((await get('/taikhoan/TK001/giao-dich?tuNgay=2026-02-30&denNgay=2026-03-31')).status, 400);
  assert.equal((await get('/taikhoan/TK001/giao-dich?tuNgay=2026-04-01&denNgay=2026-03-31')).status, 400);
});

test('Tham số lặp lại (mảng) trả 400 thay vì lỗi máy chủ', async () => {
  const { status } = await get('/trandau?cheDoChoi=a&cheDoChoi=b');
  assert.equal(status, 400);
});

test('ID tài khoản chứa ký tự lạ (thử SQL injection) trả 400', async () => {
  const { status } = await get("/taikhoan/TK001'%20OR%20'1'='1/giao-dich?tuNgay=2026-01-01&denNgay=2026-03-31");
  assert.equal(status, 400);
});

test('Đường dẫn không tồn tại trả 404', async () => {
  const { status } = await get('/khongtontai');
  assert.equal(status, 404);
});
