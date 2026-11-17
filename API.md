# Tài liệu API

Base URL: `http://localhost:3000/api` (đổi cổng bằng biến môi trường `PORT`).

## Cài đặt và chạy

Yêu cầu: Node.js >= 18, MySQL/MariaDB.

```bash
npm install
mysql -u root -p < sql/schema.sql      # tạo DB 'game' + dữ liệu mẫu (script xóa và tạo lại các bảng)
DB_USER=root DB_PASSWORD=... npm start
npm test                               # chạy test tích hợp (cần DB đã nạp schema.sql)
```

Biến môi trường: `DB_HOST` (mặc định `127.0.0.1`), `DB_PORT` (`3306`), `DB_USER` (`root`), `DB_PASSWORD`, `DB_NAME` (`game`), `PORT` (`3000`).

## Quy ước chung

- Thành công: `{ "success": true, "count": n, "data": [...] }`
- Lỗi: `{ "success": false, "message": "..." }`
  - `400` tham số thiếu / sai định dạng / vượt khoảng cho phép
  - `404` không tìm thấy đường dẫn hoặc tài khoản
  - `500` lỗi máy chủ (chi tiết được ghi log phía server, không trả ra client)
- Ngày: `YYYY-MM-DD`. Khoảng ngày `tuNgay`/`denNgay` bao gồm cả hai đầu.
- Tất cả giá trị truy vấn đều dùng tham số hóa (`?`), không nối chuỗi trực tiếp vào SQL.
- Mọi API tài khoản chỉ trả về `IDTaiKhoan, TenTrongGame, CapDoTK, DiemXepHang`; không có `MatKhau`, `DiaChi`.

## Danh sách endpoint

| # | Method | Đường dẫn | Mô tả |
|---|--------|-----------|-------|
| 1 | GET | `/tuong` | Toàn bộ tướng, đủ cột |
| 2 | GET | `/taikhoan` | Tất cả tài khoản (thông tin công khai) |
| 3 | GET | `/trandau?cheDoChoi=` | Trận đấu theo chế độ chơi |
| 4 | GET | `/trangphuc` | Toàn bộ trang phục, `GiaBan` tăng dần |
| 5 | GET | `/taikhoan/tim-kiem?tuKhoa=` | Tài khoản có `TenTrongGame` chứa từ khóa |
| 6 | GET | `/tuong/vi-tri?viTriChienDau=&luongMauToiThieu=` | Tướng theo vị trí và `LuongMau >=` ngưỡng |
| 7 | GET | `/trangphuc/theo-bac-hiem?bacDoHiem=` | Trang phục theo bậc hiếm, `GiaBan` giảm dần |
| 8 | GET | `/taikhoan/cap-do?minLevel=&maxLevel=` | Tài khoản có `CapDoTK` trong khoảng, `DiemXepHang` giảm dần |
| 9 | GET | `/tuong/mua-duoc?soVang=` | Tướng có `GiaBan <= soVang`, `SatThuong` giảm dần rồi `TenTuong` tăng dần |
| 10 | GET | `/lich-su-tran-dau?ketQua=&soMangHaGucToiThieu=` | Lịch sử trận theo kết quả và `SoMangHaGuc >=` ngưỡng, giảm dần |
| 11 | GET | `/trangphuc/kem-tuong?tenTuong=&bacDoHiem=` | Trang phục kèm `TenTuong`, lọc theo tên tướng và/hoặc bậc hiếm (cần ít nhất một), `GiaBan` tăng dần |
| 12 | GET | `/taikhoan/:id/tuong-so-huu` | Tướng tài khoản sở hữu, sắp xếp `ViTriChienDau`, `TenTuong` |
| B1 | GET | `/taikhoan/:id/giao-dich?tuNgay=&denNgay=` | Lịch sử mua trang phục trong khoảng ngày, kèm `TenGoi`, `TenTuong`, mới nhất trước |
| B2 | GET | `/taikhoan/:id/lich-su-tran-dau?cheDoChoi=` | Lịch sử đấu theo chế độ, kèm `TenTuong`, `ThoiGianBatDau`, mới nhất trước |
| B3 | GET | `/trandau/theo-thoi-gian?tuNgay=&denNgay=` | Trận có `ThoiGianBatDau >= tuNgay` và `ThoiGianKetThuc` không vượt quá cuối ngày `denNgay`; mỗi trận có mảng `NguoiChoi` sắp xếp `SoMangHaGuc` giảm dần |

Các endpoint có ID hoặc tham số bắt buộc trả `400` nếu thiếu. API 8 và B1/B3 trả `400` nếu khoảng không hợp lệ (min > max, từ ngày > đến ngày).

## Ví dụ

```bash
curl "http://localhost:3000/api/trandau?cheDoChoi=X%E1%BA%BFp%20h%E1%BA%A1ng"
curl "http://localhost:3000/api/taikhoan/cap-do?minLevel=10&maxLevel=30"
curl "http://localhost:3000/api/tuong/mua-duoc?soVang=4800"
curl "http://localhost:3000/api/taikhoan/TK001/giao-dich?tuNgay=2026-01-01&denNgay=2026-03-31"
curl "http://localhost:3000/api/trandau/theo-thoi-gian?tuNgay=2026-01-01&denNgay=2026-03-31"
```

Mẫu response B3:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "IDTranDau": "TD001",
      "CheDoChoi": "Xếp hạng",
      "ThoiGianBatDau": "2026-01-10 10:00:00",
      "ThoiGianKetThuc": "2026-01-10 10:30:00",
      "NguoiChoi": [
        { "TenTrongGame": "DragonSlayer", "TenTuong": "Yasuo", "SoMangHaGuc": 7, "SoMangBiHaGuc": 2, "HaGuc": 1, "KetQua": "Thắng" }
      ]
    }
  ]
}
```

## Giả định về schema

Repo ban đầu chưa có mã nguồn hay schema nên dự án được viết theo tên bảng và cột trong yêu cầu. Các cột/khóa **chưa được xác nhận** và cần đối chiếu với CSDL thật:

- Khóa chính: `Tuong.IDTuong`, `TaiKhoan.IDTaiKhoan`, `TrangPhuc.IDTrangPhuc`, `TranDau.IDTranDau`; kiểu `VARCHAR`.
- `TrangPhuc.IDTuong` (tướng sở hữu trang phục), `LichSuGiaoDich.IDTaiKhoan / IDTrangPhuc / ThoiGianMua`, `LichSuTranDau.IDTaiKhoan / IDTranDau / IDTuong / KetQua / SoMangHaGuc / SoMangBiHaGuc / HaGuc`, `TaiKhoan_Tuong.IDTaiKhoan / IDTuong`.
- Các câu SQL nằm trong `src/routes/*.routes.js`, nên nếu tên cột khác chỉ cần sửa tại đó.
- Tham số `ketQua` được so sánh như chuỗi (ví dụ `Thắng`). Nếu `KetQua` là số hoặc mã khác, cần đổi.

## Phiên bản C# (ASP.NET Core, thư mục `csharp/GameApi`)

Mới có API 3 theo kiểu controller + EF Core (`_context`), dùng Pomelo MySQL:

```
GET /api/trandau?CheDoChoi=Xếp hạng
```

Chuỗi kết nối đặt trong `ConnectionStrings:DefaultConnection` (hoặc biến môi trường `ConnectionStrings__DefaultConnection`). Chạy:

```bash
cd csharp/GameApi
dotnet run
```
