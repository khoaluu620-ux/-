-- Schema GIẢ ĐỊNH theo tên bảng/cột trong yêu cầu, kèm dữ liệu mẫu để kiểm thử.
-- Hãy đối chiếu với CSDL thật; nếu tên cột khác, sửa tại các câu SQL trong src/routes/.
-- Chạy: mysql -u root -p < sql/schema.sql   (script sẽ XÓA và tạo lại các bảng trong DB 'game')

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE game;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS LichSuGiaoDich, LichSuTranDau, TaiKhoan_Tuong, TrangPhuc, TranDau, TaiKhoan, Tuong;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Tuong (
  IDTuong       VARCHAR(20)  NOT NULL PRIMARY KEY,
  TenTuong      VARCHAR(100) NOT NULL,
  ViTriChienDau VARCHAR(50)  NOT NULL,
  LuongMau      INT          NOT NULL,
  SatThuong     INT          NOT NULL,
  GiaBan        INT          NOT NULL
);

CREATE TABLE TaiKhoan (
  IDTaiKhoan    VARCHAR(20)  NOT NULL PRIMARY KEY,
  TenTrongGame  VARCHAR(100) NOT NULL,
  MatKhau       VARCHAR(255) NOT NULL,
  DiaChi        VARCHAR(255),
  CapDoTK       INT          NOT NULL,
  DiemXepHang   INT          NOT NULL DEFAULT 0
);

CREATE TABLE TrangPhuc (
  IDTrangPhuc   VARCHAR(20)  NOT NULL PRIMARY KEY,
  TenGoi        VARCHAR(100) NOT NULL,
  BacDoHiem     VARCHAR(50)  NOT NULL,
  GiaBan        INT          NOT NULL,
  IDTuong       VARCHAR(20)  NOT NULL,
  FOREIGN KEY (IDTuong) REFERENCES Tuong(IDTuong)
);

CREATE TABLE TaiKhoan_Tuong (
  IDTaiKhoan    VARCHAR(20) NOT NULL,
  IDTuong       VARCHAR(20) NOT NULL,
  PRIMARY KEY (IDTaiKhoan, IDTuong),
  FOREIGN KEY (IDTaiKhoan) REFERENCES TaiKhoan(IDTaiKhoan),
  FOREIGN KEY (IDTuong)    REFERENCES Tuong(IDTuong)
);

CREATE TABLE TranDau (
  IDTranDau        VARCHAR(20) NOT NULL PRIMARY KEY,
  CheDoChoi        VARCHAR(50) NOT NULL,
  ThoiGianBatDau   DATETIME    NOT NULL,
  ThoiGianKetThuc  DATETIME    NOT NULL
);

CREATE TABLE LichSuTranDau (
  IDLichSu        INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  IDTaiKhoan      VARCHAR(20) NOT NULL,
  IDTranDau       VARCHAR(20) NOT NULL,
  IDTuong         VARCHAR(20) NOT NULL,
  KetQua          VARCHAR(20) NOT NULL,
  SoMangHaGuc     INT         NOT NULL DEFAULT 0,
  SoMangBiHaGuc   INT         NOT NULL DEFAULT 0,
  HaGuc           INT         NOT NULL DEFAULT 0,
  FOREIGN KEY (IDTaiKhoan) REFERENCES TaiKhoan(IDTaiKhoan),
  FOREIGN KEY (IDTranDau)  REFERENCES TranDau(IDTranDau),
  FOREIGN KEY (IDTuong)    REFERENCES Tuong(IDTuong)
);

CREATE TABLE LichSuGiaoDich (
  IDGiaoDich    INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  IDTaiKhoan    VARCHAR(20) NOT NULL,
  IDTrangPhuc   VARCHAR(20) NOT NULL,
  ThoiGianMua   DATETIME    NOT NULL,
  FOREIGN KEY (IDTaiKhoan)  REFERENCES TaiKhoan(IDTaiKhoan),
  FOREIGN KEY (IDTrangPhuc) REFERENCES TrangPhuc(IDTrangPhuc)
);

-- Dữ liệu mẫu
INSERT INTO Tuong (IDTuong, TenTuong, ViTriChienDau, LuongMau, SatThuong, GiaBan) VALUES
  ('T001', 'Yasuo',     'Đấu sĩ',  2500, 180,  6300),
  ('T002', 'Ashe',      'Xạ thủ',  2200, 150,  4800),
  ('T003', 'Malphite',  'Đỡ đòn',  3200, 120,  4800),
  ('T004', 'Lux',       'Pháp sư', 2000, 210,  3150),
  ('T005', 'Ahri',      'Pháp sư', 2000, 150,  4800);

INSERT INTO TaiKhoan (IDTaiKhoan, TenTrongGame, MatKhau, DiaChi, CapDoTK, DiemXepHang) VALUES
  ('TK001', 'DragonSlayer', 'matkhau1', 'Hà Nội',   35, 1500),
  ('TK002', 'NightWolf',    'matkhau2', 'TP.HCM',   12,  900),
  ('TK003', 'Dragonfly',    'matkhau3', 'Đà Nẵng',  25, 1200);

INSERT INTO TrangPhuc (IDTrangPhuc, TenGoi, BacDoHiem, GiaBan, IDTuong) VALUES
  ('TP001', 'Yasuo Hắc Kiếm',    'Sử thi',     1350, 'T001'),
  ('TP002', 'Malphite Thạch Giáp', 'Huyền thoại', 3150, 'T003'),
  ('TP003', 'Ashe Băng Giá',     'Sử thi',      975, 'T002');

INSERT INTO TaiKhoan_Tuong (IDTaiKhoan, IDTuong) VALUES
  ('TK001', 'T001'), ('TK001', 'T003'), ('TK002', 'T002'), ('TK003', 'T004');

INSERT INTO TranDau (IDTranDau, CheDoChoi, ThoiGianBatDau, ThoiGianKetThuc) VALUES
  ('TD001', 'Xếp hạng', '2026-01-10 10:00:00', '2026-01-10 10:30:00'),
  ('TD002', 'Thường',   '2026-02-15 20:00:00', '2026-02-15 20:25:00'),
  ('TD003', 'Xếp hạng', '2026-04-02 09:00:00', '2026-04-02 09:40:00');

INSERT INTO LichSuTranDau (IDTaiKhoan, IDTranDau, IDTuong, KetQua, SoMangHaGuc, SoMangBiHaGuc, HaGuc) VALUES
  ('TK001', 'TD001', 'T001', 'Thắng', 7, 2, 1),
  ('TK002', 'TD001', 'T002', 'Thua',   3, 7, 0),
  ('TK003', 'TD001', 'T004', 'Thua',   5, 6, 0),
  ('TK001', 'TD002', 'T003', 'Thắng', 4, 1, 2),
  ('TK002', 'TD002', 'T002', 'Thắng', 6, 3, 1),
  ('TK001', 'TD003', 'T001', 'Thắng', 9, 0, 0);

INSERT INTO LichSuGiaoDich (IDTaiKhoan, IDTrangPhuc, ThoiGianMua) VALUES
  ('TK001', 'TP001', '2026-01-05 12:00:00'),
  ('TK001', 'TP002', '2026-02-20 18:30:00'),
  ('TK002', 'TP003', '2026-03-31 23:59:59'),
  ('TK001', 'TP003', '2026-04-10 08:00:00');
