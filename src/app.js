const express = require('express');
const { ApiError } = require('./utils/errors');

const tuongRouter = require('./routes/tuong.routes');
const taiKhoanRouter = require('./routes/taiKhoan.routes');
const trangPhucRouter = require('./routes/trangPhuc.routes');
const tranDauRouter = require('./routes/tranDau.routes');
const lichSuTranDauRouter = require('./routes/lichSuTranDau.routes');

const app = express();
app.disable('x-powered-by');

app.get('/api/health', (req, res) => res.json({ success: true, message: 'OK' }));

app.use('/api/tuong', tuongRouter);
app.use('/api/taikhoan', taiKhoanRouter);
app.use('/api/trangphuc', trangPhucRouter);
app.use('/api/trandau', tranDauRouter);
app.use('/api/lich-su-tran-dau', lichSuTranDauRouter);

// Không tìm thấy route
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Không tìm thấy đường dẫn ${req.method} ${req.path}.` });
});

// Xử lý lỗi tập trung. Không trả chi tiết lỗi SQL ra client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
});

module.exports = app;
