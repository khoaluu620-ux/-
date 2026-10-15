# NovaShop - Website bán hàng E-commerce

Website bán hàng thuần HTML5, CSS3 và JavaScript ES6+ (không dùng framework).

## Cách chạy

Không cần cài đặt hay máy chủ. Mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox, Safari):

1. Mở thư mục dự án.
2. Nhấp đúp vào `index.html`.

Cần kết nối Internet để tải Google Fonts và Font Awesome (icon) từ CDN.

## Cấu trúc dự án

```
css/style.css        Toàn bộ giao diện: biến CSS, layout, responsive, animation
js/script.js         Dữ liệu sản phẩm, giỏ hàng, yêu thích, lọc, validate form
images/              Ảnh minh họa sản phẩm và banner (SVG)
index.html           Trang chủ
about.html           Giới thiệu
products.html        Danh sách sản phẩm (tìm kiếm, lọc, sắp xếp)
product-detail.html  Chi tiết sản phẩm (đọc ?id= trên URL)
cart.html            Giỏ hàng
checkout.html        Thanh toán
login.html           Đăng nhập / đăng ký
contact.html         Liên hệ và câu hỏi thường gặp
```

## Ghi chú

- Giỏ hàng và danh sách yêu thích được lưu trong `localStorage`, nên vẫn còn sau khi tải lại trang.
- Đăng nhập, đăng ký và đặt hàng chỉ là bản demo, không gửi dữ liệu tới máy chủ.
- Để thêm sản phẩm, sửa mảng `PRODUCTS` trong `js/script.js` và thêm ảnh `images/<id>.svg` tương ứng.
