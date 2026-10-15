# Aurum Tech — Website E-commerce Tech Store (phong cách Sang trọng)

Website bán lẻ thiết bị công nghệ cao cấp, xây dựng bằng **HTML5 + CSS3 + JavaScript thuần (ES6+)**. Không dùng framework, không cần build.

> ⚠️ **Đây là bản demo chỉ có front-end.** Không có máy chủ, cơ sở dữ liệu hay cổng thanh toán thật. Xem mục [Chức năng mô phỏng](#chức-năng-mô-phỏng-chưa-kết-nối-backend).

## 1. Cấu trúc thư mục

```
.
├── index.html            Trang chủ
├── about.html            Giới thiệu
├── products.html         Danh sách sản phẩm (tìm kiếm, lọc, sắp xếp, phân trang)
├── product-detail.html   Chi tiết sản phẩm (?id=...)
├── cart.html             Giỏ hàng
├── checkout.html         Thanh toán mô phỏng
├── contact.html          Liên hệ + FAQ + bản đồ
├── login.html            Đăng nhập / Đăng ký / Tài khoản & lịch sử đơn
├── wishlist.html         Sản phẩm yêu thích
├── css/
│   ├── style.css         Dùng chung: biến thiết kế, reset, nút, header, footer,
│   │                     thẻ sản phẩm, biểu mẫu, tóm tắt đơn hàng, toast…
│   └── pages/            Giao diện riêng từng trang (cùng tên với file .html)
│       ├── index.css  about.css  products.css  product-detail.css  cart.css
│       └── checkout.css  contact.css  login.css  wishlist.css
├── js/
│   ├── script.js         Dùng chung: dữ liệu sản phẩm, giỏ hàng, yêu thích, tài khoản,
│   │                     header/footer, tìm kiếm, menu mobile, kiểm tra form, khởi động
│   └── pages/            Chức năng riêng từng trang (about.html không cần JS riêng)
│       ├── index.js  products.js  product-detail.js  cart.js
│       └── checkout.js  contact.js  login.js  wishlist.js
└── images/               Ảnh dự phòng SVG theo danh mục, favicon
```

Mỗi trang nạp **file chung trước, file riêng sau**:

```html
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/pages/cart.css">
...
<script src="js/script.js" defer></script>
<script src="js/pages/cart.js" defer></script>
```

File JS của trang tự đăng ký hàm khởi tạo bằng `registerPage('cart', initCart)`; `script.js` gọi đúng hàm theo `<body data-page="cart">`. Thêm trang mới: tạo `ten-trang.html`, `css/pages/ten-trang.css`, `js/pages/ten-trang.js` và đặt `data-page` tương ứng.

Header, footer, menu mobile và hộp tìm kiếm được `script.js` dựng chung cho mọi trang để đảm bảo nhất quán; nội dung chính mỗi trang là HTML semantic (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `dl`, `fieldset`…).

## 2. Cách chạy

**Cách 1 – mở trực tiếp:** nhấp đúp `index.html`. Mọi chức năng đều chạy được với `file://`.

**Cách 2 – máy chủ tĩnh (khuyến nghị):**

```bash
# Python 3
python3 -m http.server 8080
# hoặc Node.js
npx serve .
```

Sau đó mở `http://localhost:8080`. Với VS Code có thể dùng extension *Live Server*.

Cần kết nối Internet để tải font Google Fonts, ảnh sản phẩm thực tế (Unsplash) và bản đồ Google Maps. Khi offline, ảnh tự chuyển sang ảnh SVG trong `images/`.

### Dùng thử nhanh

| Tình huống | Cách thử |
|---|---|
| Tìm kiếm | Bấm 🔍 hoặc `Ctrl + K`, gõ “dien thoai” (không dấu vẫn tìm được) |
| Lọc & sắp xếp | `products.html?cat=laptop&sort=price-asc` – bộ lọc được lưu trên URL, chia sẻ được |
| Mã giảm giá | `AURUM10` (−10%, tối đa 2 triệu), `GIAM500K` (đơn từ 10 triệu), `FREESHIP` |
| Thẻ thanh toán mẫu | `4242 4242 4242 4242`, hạn bất kỳ trong tương lai (VD `12/30`), CVV bất kỳ |
| Sản phẩm hết hàng | Fujifilm X100VI |
| Xoá dữ liệu demo | DevTools → Application → Local Storage → xoá các khoá `aurum_*` |

## 3. Chức năng

- **Trang chủ:** hero, thương hiệu, danh mục (đếm số sản phẩm), tab Nổi bật/Mới về/Bán chạy, Flash Sale có đồng hồ đếm ngược đến cuối ngày, banner khuyến mãi, đặc quyền, đánh giá khách hàng, đăng ký nhận tin.
- **Tìm kiếm:** gợi ý tức thì (tên, thương hiệu, danh mục, mô tả), không phân biệt dấu tiếng Việt.
- **Lọc & sắp xếp:** danh mục, thương hiệu, khoảng giá (mức có sẵn hoặc tuỳ chọn theo triệu đồng), điểm đánh giá, đang giảm giá / hàng mới / còn hàng; 8 kiểu sắp xếp; chip bộ lọc đang áp dụng; phân trang; chuyển dạng lưới/danh sách; bộ lọc thành ngăn kéo trên tablet/mobile.
- **Chi tiết sản phẩm:** thư viện ảnh + phóng to khi rê chuột, chọn màu & phiên bản (giá cập nhật theo phiên bản), số lượng giới hạn theo tồn kho, Thêm vào giỏ / Mua ngay, tab Mô tả – Thông số – Đánh giá (có form viết đánh giá), sản phẩm liên quan.
- **Giỏ hàng (LocalStorage):** tách dòng theo màu + phiên bản, tăng/giảm/xoá, thanh tiến độ miễn phí giao hàng, mã giảm giá, tính phí ship; đồng bộ giữa các tab.
- **Yêu thích (LocalStorage):** nút trái tim trên mọi sản phẩm, trang `wishlist.html`, thêm tất cả vào giỏ.
- **Thanh toán mô phỏng:** kiểm tra form (SĐT Việt Nam, email, thẻ theo thuật toán Luhn, hạn thẻ…), chọn giao tiêu chuẩn/hoả tốc, 4 phương thức thanh toán, tạo mã đơn và hiển thị hộp thoại thành công.
- **Đăng nhập/Đăng ký:** tab, hiện/ẩn mật khẩu, đo độ mạnh mật khẩu, ghi nhớ đăng nhập, trang tài khoản với lịch sử đơn hàng.
- **Liên hệ:** form có kiểm tra dữ liệu, bản đồ, FAQ dạng `<details>`.
- **Responsive & truy cập:** mobile-first, các breakpoint 1200 / 992 / 768 / 480px, menu mobile off-canvas (giữ focus, đóng bằng Esc), skip link, ARIA cho tab/radio/dialog, `prefers-reduced-motion`.
- **Tiền tệ:** định dạng VNĐ bằng `Intl.NumberFormat('vi-VN', { currency: 'VND' })` → `37.990.000 ₫`.

## 4. Chức năng mô phỏng (chưa kết nối backend)

| Chức năng | Hiện trạng trong bản demo | Cần làm khi đưa vào sử dụng thật |
|---|---|---|
| Thanh toán (thẻ, chuyển khoản, ví điện tử) | **Giả lập** 1,5 giây rồi báo thành công. Không có giao dịch, **không lưu hay gửi dữ liệu thẻ**. Thông tin ngân hàng là dữ liệu mẫu. | Tích hợp cổng thanh toán (VNPay, MoMo, ZaloPay, Stripe…) qua backend |
| Đơn hàng | Lưu ở LocalStorage của trình duyệt (`aurum_orders`) | API đơn hàng + cơ sở dữ liệu, email xác nhận |
| Đăng ký / đăng nhập | Tài khoản lưu ở LocalStorage, mật khẩu băm SHA-256 phía trình duyệt — **không an toàn cho dữ liệu thật** | Xác thực phía máy chủ (băm bcrypt/argon2, session/JWT, HTTPS) |
| Quên mật khẩu, đăng nhập Google/Apple | Chỉ hiện thông báo | Gửi email đặt lại mật khẩu, OAuth |
| Mã giảm giá, tồn kho, giá | Cố định trong `js/script.js` | Kiểm tra & tính lại giá phía máy chủ |
| Đánh giá sản phẩm, form liên hệ, đăng ký nhận tin | Lưu ở LocalStorage của trình duyệt | API + kiểm duyệt nội dung |
| Trả góp 0%, AppleCare+ tặng kèm | Nội dung minh hoạ | Theo chính sách thật của cửa hàng |

Giỏ hàng và danh sách yêu thích dùng LocalStorage là đúng yêu cầu; dữ liệu chỉ tồn tại trên trình duyệt hiện tại.

## 5. Dữ liệu & hình ảnh

- 30 sản phẩm thuộc 8 danh mục (iPhone 17 Pro Max, Galaxy S25 Ultra, MacBook Pro M4 Pro, iPad Pro M4, Sony WH‑1000XM6, Sony A7 IV, PS5 Pro…) với **giá tham khảo** thị trường Việt Nam (chỉ mang tính minh hoạ), thông số, màu sắc, phiên bản.
- **Ảnh thực tế** lấy từ [Unsplash](https://unsplash.com) (giấy phép Unsplash) qua URL, nên là ảnh minh hoạ theo loại sản phẩm, không phải ảnh chính thức của từng mẫu. Nếu một ảnh không tải được, `script.js` tự thay bằng ảnh SVG tương ứng trong `images/`.
- Tên thương hiệu “Aurum Tech”, địa chỉ, hotline, email đều là **dữ liệu mẫu**.

**Thay ảnh bằng ảnh của bạn:** chép ảnh vào `images/` rồi trong mảng `PRODUCTS` (`js/script.js`) đổi hàm `productImg` hoặc giá trị `images`. Ví dụ, để dùng file cục bộ, sửa `unsplash()` trả về `images/${id}` và ghi `images: ['iphone-17-pro-max.jpg']`.

**Thêm sản phẩm:** thêm một object vào `PRODUCTS` theo mẫu có sẵn (`id`, `name`, `brand`, `category`, `price`, `oldPrice`, `stock`, `images`, `specs`, `colors`, `variants`…). Danh sách, bộ lọc, tìm kiếm và trang chi tiết tự cập nhật.

## 6. Tương thích

Chrome, Edge, Firefox, Safari bản mới (cần hỗ trợ ES2020, CSS Grid, `<dialog>`).
