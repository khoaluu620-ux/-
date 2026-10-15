/* ==========================================================================
   AURUM TECH — script.js
   JavaScript thuần (ES6+). Toàn bộ dữ liệu được lưu ở LocalStorage của
   trình duyệt; KHÔNG có backend, KHÔNG có cổng thanh toán thật.
   --------------------------------------------------------------------------
   Mục lục
   1.  Cấu hình & tiện ích
   2.  Biểu tượng (SVG icons)
   3.  Dữ liệu mẫu: danh mục & sản phẩm
   4.  Lưu trữ: Giỏ hàng, Yêu thích, Mã giảm giá, Tài khoản, Đơn hàng
   5.  Thành phần giao diện dùng chung (header, footer, toast, thẻ sản phẩm)
   6.  Tìm kiếm & menu mobile
   7.  Kiểm tra biểu mẫu (validation)
   8.  Tóm tắt đơn hàng & mã giảm giá (dùng chung giỏ hàng / thanh toán)
   9.  Khởi động (gọi hàm của trang hiện tại)
   Mã riêng của từng trang nằm trong js/pages/<tên-trang>.js
   ========================================================================== */
'use strict';

document.documentElement.classList.add('js');

/* ==========================================================================
   1. CẤU HÌNH & TIỆN ÍCH
   ========================================================================== */
const STORAGE = {
  cart: 'aurum_cart',
  wishlist: 'aurum_wishlist',
  coupon: 'aurum_coupon',
  users: 'aurum_users',
  session: 'aurum_session',
  orders: 'aurum_orders',
  reviews: 'aurum_reviews',
  messages: 'aurum_messages',
  newsletter: 'aurum_newsletter',
  view: 'aurum_view',
};

const FREE_SHIP_THRESHOLD = 5_000_000;
const SHIPPING_FEES = { standard: 40_000, express: 80_000 };
const MAX_QTY_PER_ITEM = 10;
const PAGE_SIZE = 9;

const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const formatVND = (value) => vndFormatter.format(Math.round(value));
const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value);
const formatDate = (iso) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu: "Điện thoại" → "dien thoai" */
const normalize = (text = '') => text.toString().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').trim();

const escapeHTML = (text = '') => String(text).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const debounce = (fn, delay = 200) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const getParams = () => new URLSearchParams(window.location.search);

/** URL ảnh thực tế từ Unsplash (tải bởi trình duyệt). Có ảnh dự phòng SVG cục bộ trong /images. */
const unsplash = (id, width = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

/** Lưu trữ an toàn: tránh lỗi khi LocalStorage bị chặn (chế độ riêng tư…) */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* bỏ qua */ }
  },
};

/* ==========================================================================
   2. BIỂU TƯỢNG SVG
   ========================================================================== */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"/>',
  bag: '<path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  menu: '<path d="M3 7h18M3 12h18M3 17h12"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  truck: '<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
  'chevron-left': '<path d="m15 6-6 6 6 6"/>',
  'chevron-right': '<path d="m9 6 6 6-6 6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 4s0 4 4 4zM12 8s1.5-5 4-4 0 4-4 4z"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
  sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/><path d="M19 15.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  building: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6M9 11h.01M15 11h.01"/>',
  logout: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
  package: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9 5 3-5 3z"/>',
};

const icon = (name, className = '') => (
  `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`
);

/** Thay <span data-icon="..."> trong HTML tĩnh bằng SVG tương ứng */
function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => {
    if (!el.dataset.hydrated) {
      el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
      el.dataset.hydrated = 'true';
    }
  });
}

/* ==========================================================================
   3. DỮ LIỆU MẪU
   Giá tham khảo thị trường Việt Nam (VNĐ), chỉ mang tính minh hoạ.
   ========================================================================== */
const IMG = {
  iphone: '1695048133142-1a20484d2569',
  iphone2: '1592899677977-9c10ca588bbd',
  samsung: '1610945415295-d9bbf067e59c',
  phone: '1511707171634-5f897ff02aa9',
  phone2: '1601784551446-20c9e07cdbdb',
  macbook: '1517336714731-489689fd1ca8',
  laptop: '1496181133206-80ce9b88a853',
  laptop2: '1588872657578-7efd1f1555ed',
  laptop3: '1593642632823-8f785ba67e45',
  laptop4: '1603302576837-37561b2e2302',
  ipad: '1544244015-0df4b3ffc6b0',
  ipad2: '1561154464-82e9adf32764',
  tablet: '1585790050230-5dd28404ccb9',
  watch: '1546868871-7041f2a55e12',
  watch2: '1579586337278-3befd40fd17a',
  watch3: '1508685096489-7aacd43bd3b1',
  headphone: '1505740420928-5e560c06d30e',
  headphone2: '1546435770-a3e426bf472b',
  headphone3: '1583394838336-acd977736f90',
  earbuds: '1606220945770-b5b6c2c55bf1',
  airpods: '1600294037681-c80b4cb5b434',
  speaker: '1608043152269-423dbba4e7e1',
  speaker2: '1545454675-3531b543be5d',
  camera: '1516035069371-29a1b244cc32',
  camera2: '1502920917128-1aa500764cbd',
  camera3: '1526170375885-4d8ecf77b99f',
  drone: '1473968512647-3e447244af8f',
  mouse: '1527864550417-7fd91fc51a46',
  keyboard: '1587829741301-dc798b83add3',
  keyboard2: '1618384887929-16ec33fab9ef',
  monitor: '1527443224154-c4a3942d3acf',
  controller: '1606144042614-b2417e99c4e3',
  gaming: '1542751371-adc38448a05e',
};

const CATEGORIES = {
  'dien-thoai': { name: 'Điện thoại', image: IMG.iphone2, desc: 'Flagship mới nhất' },
  laptop: { name: 'Laptop', image: IMG.macbook, desc: 'Hiệu năng & tinh tế' },
  tablet: { name: 'Máy tính bảng', image: IMG.ipad, desc: 'Sáng tạo mọi nơi' },
  'dong-ho': { name: 'Đồng hồ thông minh', image: IMG.watch, desc: 'Sức khoẻ & phong cách' },
  'am-thanh': { name: 'Âm thanh', image: IMG.headphone, desc: 'Tai nghe & loa Hi-End' },
  'may-anh': { name: 'Máy ảnh & Flycam', image: IMG.camera, desc: 'Lưu giữ khoảnh khắc' },
  'phu-kien': { name: 'Phụ kiện & Màn hình', image: IMG.keyboard, desc: 'Hoàn thiện góc làm việc' },
  gaming: { name: 'Gaming', image: IMG.controller, desc: 'Giải trí đỉnh cao' },
};

const APPLE_PRO_COLORS = [
  { name: 'Cam Vũ Trụ', hex: '#c8662f' },
  { name: 'Xanh Đậm', hex: '#2f3a52' },
  { name: 'Bạc', hex: '#d9d9d6' },
];

const PRODUCTS = [
  {
    id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', brand: 'Apple', category: 'dien-thoai',
    price: 37_990_000, oldPrice: 39_490_000, rating: 4.9, reviews: 1284, stock: 18, sold: 3420,
    isNew: true, featured: true, createdAt: '2025-09-19', warranty: '12 tháng',
    images: [IMG.iphone, IMG.iphone2, IMG.phone],
    short: 'Khung nhôm nguyên khối, chip A19 Pro và hệ thống ba camera 48MP với zoom quang học 8x.',
    description: 'iPhone 17 Pro Max là chiếc iPhone mạnh mẽ nhất từ trước đến nay với thiết kế khung nhôm nguyên khối tản nhiệt bằng buồng hơi, giúp duy trì hiệu năng cao lâu hơn. Màn hình 6,9 inch ProMotion sáng hơn, mặt kính Ceramic Shield 2 chống trầy tốt gấp ba lần.\nHệ thống camera Pro với ba ống kính 48MP mang lại khả năng zoom chất lượng quang học đến 8x, quay video ProRes RAW chuyên nghiệp. Thời lượng pin dài nhất từng có trên iPhone.',
    specs: { 'Màn hình': '6,9" Super Retina XDR, ProMotion 120Hz', Chip: 'Apple A19 Pro', 'Camera sau': '48MP Fusion + 48MP Ultra Wide + 48MP Telephoto', 'Camera trước': '18MP Center Stage', Pin: 'Lên đến 37 giờ xem video', 'Hệ điều hành': 'iOS 26' },
    colors: APPLE_PRO_COLORS,
    variants: [{ label: '256GB', add: 0 }, { label: '512GB', add: 6_500_000 }, { label: '1TB', add: 13_000_000 }],
  },
  {
    id: 'iphone-17-pro', name: 'iPhone 17 Pro', brand: 'Apple', category: 'dien-thoai',
    price: 34_990_000, oldPrice: null, rating: 4.8, reviews: 856, stock: 24, sold: 2610,
    isNew: true, featured: false, createdAt: '2025-09-19', warranty: '12 tháng',
    images: [IMG.iphone2, IMG.iphone, IMG.phone2],
    short: 'Sức mạnh Pro trong kích thước 6,3 inch gọn gàng, camera tele 48MP và chip A19 Pro.',
    description: 'iPhone 17 Pro mang toàn bộ sức mạnh của dòng Pro trong thân máy nhỏ gọn, dễ cầm nắm. Chip A19 Pro với GPU tích hợp bộ tăng tốc thần kinh cho trải nghiệm Apple Intelligence mượt mà.\nCamera Telephoto 48MP mới cho phép chụp chân dung và cận cảnh sắc nét, trong khi camera trước 18MP Center Stage tự động xoay khung hình khi chụp nhóm.',
    specs: { 'Màn hình': '6,3" Super Retina XDR, ProMotion 120Hz', Chip: 'Apple A19 Pro', 'Camera sau': '3 camera 48MP', 'Camera trước': '18MP Center Stage', Pin: 'Lên đến 33 giờ xem video', 'Hệ điều hành': 'iOS 26' },
    colors: APPLE_PRO_COLORS,
    variants: [{ label: '256GB', add: 0 }, { label: '512GB', add: 6_500_000 }, { label: '1TB', add: 13_000_000 }],
  },
  {
    id: 'galaxy-s25-ultra', name: 'Samsung Galaxy S25 Ultra', brand: 'Samsung', category: 'dien-thoai',
    price: 27_490_000, oldPrice: 33_990_000, rating: 4.8, reviews: 1102, stock: 30, sold: 4150,
    isNew: false, featured: true, createdAt: '2025-02-07', warranty: '12 tháng',
    images: [IMG.samsung, IMG.phone, IMG.phone2],
    short: 'Khung Titan, bút S Pen tích hợp, camera 200MP và Galaxy AI thông minh.',
    description: 'Galaxy S25 Ultra sở hữu khung Titan bền bỉ với các góc bo tròn mềm mại hơn, màn hình 6,9 inch chống chói Corning Gorilla Armor 2. Vi xử lý Snapdragon 8 Elite for Galaxy mang lại hiệu năng hàng đầu thế giới Android.\nGalaxy AI hỗ trợ dịch cuộc gọi trực tiếp, khoanh tròn để tìm kiếm, trợ lý ghi chú và chỉnh sửa ảnh tạo sinh – tất cả ngay trên máy.',
    specs: { 'Màn hình': '6,9" Dynamic AMOLED 2X, 120Hz', Chip: 'Snapdragon 8 Elite for Galaxy', 'Camera sau': '200MP + 50MP UW + 50MP 5x + 10MP 3x', RAM: '12GB', Pin: '5.000mAh, sạc nhanh 45W', 'Tính năng': 'S Pen, Galaxy AI, IP68' },
    colors: [{ name: 'Titan Đen', hex: '#2b2b2d' }, { name: 'Titan Xám', hex: '#8a8a88' }, { name: 'Titan Bạc Xanh', hex: '#b9c3c9' }],
    variants: [{ label: '256GB', add: 0 }, { label: '512GB', add: 4_000_000 }, { label: '1TB', add: 10_000_000 }],
  },
  {
    id: 'galaxy-z-fold7', name: 'Samsung Galaxy Z Fold7', brand: 'Samsung', category: 'dien-thoai',
    price: 46_990_000, oldPrice: null, rating: 4.7, reviews: 318, stock: 9, sold: 640,
    isNew: true, featured: false, createdAt: '2025-07-25', warranty: '12 tháng',
    images: [IMG.phone2, IMG.samsung, IMG.phone],
    short: 'Điện thoại gập mỏng nhẹ nhất của Samsung, màn hình chính 8 inch và camera 200MP.',
    description: 'Galaxy Z Fold7 mỏng chỉ 8,9mm khi gập và nhẹ hơn cả nhiều smartphone thông thường. Màn hình chính 8 inch rộng rãi cho làm việc đa nhiệm, màn hình ngoài 6,5 inch tỉ lệ chuẩn.\nLần đầu tiên dòng Fold được trang bị camera 200MP, cùng bản lề Armor FlexHinge bền bỉ hơn.',
    specs: { 'Màn hình chính': '8,0" Dynamic AMOLED 2X', 'Màn hình ngoài': '6,5" Dynamic AMOLED 2X', Chip: 'Snapdragon 8 Elite for Galaxy', 'Camera sau': '200MP + 12MP UW + 10MP 3x', Pin: '4.400mAh', 'Độ mỏng': '8,9mm (gập) / 4,2mm (mở)' },
    colors: [{ name: 'Xanh Navy', hex: '#1f2a44' }, { name: 'Đen Tuyền', hex: '#1a1a1a' }, { name: 'Bạc Bóng', hex: '#c9cacc' }],
    variants: [{ label: '256GB', add: 0 }, { label: '512GB', add: 4_000_000 }],
  },
  {
    id: 'xiaomi-15-ultra', name: 'Xiaomi 15 Ultra', brand: 'Xiaomi', category: 'dien-thoai',
    price: 29_990_000, oldPrice: 32_990_000, rating: 4.7, reviews: 274, stock: 12, sold: 820,
    isNew: false, featured: false, createdAt: '2025-03-02', warranty: '18 tháng',
    images: [IMG.phone, IMG.phone2, IMG.camera3],
    short: 'Camera Leica cảm biến 1 inch, ống kính tiềm vọng 200MP – chiếc máy ảnh trong túi.',
    description: 'Xiaomi 15 Ultra hợp tác cùng Leica với hệ thống bốn camera, trong đó cảm biến chính 1 inch 50MP và ống kính tiềm vọng 200MP cho khả năng zoom vượt trội.\nThiết kế lấy cảm hứng từ máy ảnh cổ điển, pin 5.410mAh và sạc nhanh 90W.',
    specs: { 'Màn hình': '6,73" AMOLED WQHD+, 120Hz', Chip: 'Snapdragon 8 Elite', 'Camera sau': '50MP 1" + 50MP UW + 50MP 3x + 200MP 4,3x', RAM: '16GB', Pin: '5.410mAh, sạc 90W', 'Ống kính': 'Leica Summilux' },
    colors: [{ name: 'Bạc Chrome', hex: '#c0c0bc' }, { name: 'Đen', hex: '#151515' }],
    variants: [{ label: '512GB', add: 0 }, { label: '1TB', add: 4_000_000 }],
  },
  {
    id: 'oppo-find-x8-pro', name: 'OPPO Find X8 Pro', brand: 'OPPO', category: 'dien-thoai',
    price: 26_990_000, oldPrice: 29_990_000, rating: 4.6, reviews: 198, stock: 15, sold: 560,
    isNew: false, featured: false, createdAt: '2024-11-21', warranty: '12 tháng',
    images: [IMG.phone2, IMG.phone, IMG.samsung],
    short: 'Hai camera tiềm vọng Hasselblad, pin 5.910mAh và chip Dimensity 9400.',
    description: 'OPPO Find X8 Pro là smartphone đầu tiên trang bị hai camera tiềm vọng, mang lại dải zoom linh hoạt từ 3x đến 6x chất lượng quang học. Màu sắc được tinh chỉnh bởi Hasselblad.\nViên pin silicon-carbon 5.910mAh cho thời gian sử dụng cả ngày dài.',
    specs: { 'Màn hình': '6,78" AMOLED 120Hz', Chip: 'MediaTek Dimensity 9400', 'Camera sau': '4 camera 50MP Hasselblad', RAM: '16GB', Pin: '5.910mAh, sạc 80W', 'Kháng nước': 'IP68 & IP69' },
    colors: [{ name: 'Trắng Ngọc Trai', hex: '#ece8e1' }, { name: 'Đen Không Gian', hex: '#1d1f22' }],
    variants: [{ label: '512GB', add: 0 }],
  },
  {
    id: 'macbook-air-m4-13', name: 'MacBook Air 13" M4', brand: 'Apple', category: 'laptop',
    price: 26_990_000, oldPrice: 28_490_000, rating: 4.9, reviews: 742, stock: 22, sold: 1980,
    isNew: false, featured: false, createdAt: '2025-03-12', warranty: '12 tháng',
    images: [IMG.macbook, IMG.laptop, IMG.laptop3],
    short: 'Mỏng nhẹ 1,24kg, chip M4 mạnh mẽ, 16GB RAM tiêu chuẩn và pin đến 18 giờ.',
    description: 'MacBook Air M4 kết hợp thiết kế siêu mỏng không quạt với hiệu năng vượt trội cho học tập, làm việc và sáng tạo. Bộ nhớ thống nhất 16GB tiêu chuẩn sẵn sàng cho Apple Intelligence.\nCamera Center Stage 12MP, hỗ trợ đến hai màn hình ngoài và thời lượng pin lên đến 18 giờ.',
    specs: { 'Màn hình': '13,6" Liquid Retina', Chip: 'Apple M4 (CPU 10 lõi, GPU 8 lõi)', RAM: '16GB bộ nhớ thống nhất', 'Lưu trữ': '256GB SSD', Pin: 'Lên đến 18 giờ', 'Trọng lượng': '1,24kg' },
    colors: [{ name: 'Xanh Da Trời', hex: '#a9c1d6' }, { name: 'Bạc', hex: '#d6d6d4' }, { name: 'Đêm Xanh Thẳm', hex: '#2e3641' }, { name: 'Ánh Sao', hex: '#e3d9c6' }],
    variants: [{ label: '16GB/256GB', add: 0 }, { label: '16GB/512GB', add: 5_000_000 }, { label: '24GB/512GB', add: 10_000_000 }],
  },
  {
    id: 'macbook-pro-14-m4-pro', name: 'MacBook Pro 14" M4 Pro', brand: 'Apple', category: 'laptop',
    price: 49_990_000, oldPrice: 52_990_000, rating: 4.9, reviews: 421, stock: 10, sold: 870,
    isNew: false, featured: true, createdAt: '2024-11-08', warranty: '12 tháng',
    images: [IMG.laptop, IMG.macbook, IMG.laptop4],
    short: 'Màn hình Liquid Retina XDR, chip M4 Pro với Thunderbolt 5 cho dân sáng tạo chuyên nghiệp.',
    description: 'MacBook Pro 14 inch với chip M4 Pro mang lại sức mạnh xử lý đồ hoạ, dựng video 8K và lập trình nặng một cách dễ dàng. Màn hình Liquid Retina XDR độ sáng 1.600 nit HDR, tuỳ chọn lớp phủ nano-texture.\nCổng Thunderbolt 5 tốc độ 120Gb/s, pin lên đến 22 giờ.',
    specs: { 'Màn hình': '14,2" Liquid Retina XDR 120Hz', Chip: 'Apple M4 Pro (CPU 12 lõi, GPU 16 lõi)', RAM: '24GB bộ nhớ thống nhất', 'Lưu trữ': '512GB SSD', 'Cổng kết nối': '3x Thunderbolt 5, HDMI, SDXC, MagSafe 3', Pin: 'Lên đến 22 giờ' },
    colors: [{ name: 'Đen Không Gian', hex: '#2e2e30' }, { name: 'Bạc', hex: '#d6d6d4' }],
    variants: [{ label: '24GB/512GB', add: 0 }, { label: '24GB/1TB', add: 10_000_000 }, { label: '48GB/1TB', add: 22_000_000 }],
  },
  {
    id: 'dell-xps-13-9350', name: 'Dell XPS 13 9350', brand: 'Dell', category: 'laptop',
    price: 42_990_000, oldPrice: 46_990_000, rating: 4.6, reviews: 156, stock: 7, sold: 310,
    isNew: false, featured: false, createdAt: '2024-09-24', warranty: '24 tháng',
    images: [IMG.laptop3, IMG.laptop2, IMG.laptop],
    short: 'Thiết kế không viền tối giản, Intel Core Ultra 7 tiết kiệm điện và màn OLED 2.8K.',
    description: 'Dell XPS 13 9350 là biểu tượng của laptop Windows cao cấp với khung nhôm CNC, bàn phím tràn viền và touchpad kính liền mạch. Vi xử lý Intel Core Ultra 7 258V tích hợp NPU cho tác vụ AI.\nMàn hình OLED 2.8K cảm ứng sắc nét, thời lượng pin ấn tượng.',
    specs: { 'Màn hình': '13,4" OLED 2.8K cảm ứng', CPU: 'Intel Core Ultra 7 258V', RAM: '32GB LPDDR5x', 'Lưu trữ': '1TB SSD', 'Đồ hoạ': 'Intel Arc 140V', 'Trọng lượng': '1,19kg' },
    colors: [{ name: 'Graphite', hex: '#3b3c3f' }, { name: 'Platinum', hex: '#dcdcdc' }],
    variants: [],
  },
  {
    id: 'asus-rog-zephyrus-g14', name: 'ASUS ROG Zephyrus G14 (2025)', brand: 'ASUS', category: 'laptop',
    price: 52_990_000, oldPrice: null, rating: 4.7, reviews: 133, stock: 6, sold: 245,
    isNew: true, featured: false, createdAt: '2025-03-20', warranty: '24 tháng',
    images: [IMG.laptop4, IMG.gaming, IMG.laptop2],
    short: 'Laptop gaming 14 inch vỏ nhôm, AMD Ryzen AI 9 HX 370, RTX 5070 Ti và màn OLED 3K 120Hz.',
    description: 'ROG Zephyrus G14 2025 là laptop gaming cao cấp mỏng nhẹ với vỏ nhôm CNC nguyên khối và dải đèn Slash Lighting đặc trưng. Cấu hình mạnh mẽ cho cả chơi game AAA lẫn làm đồ hoạ.\nMàn hình ROG Nebula OLED 3K 120Hz, chuẩn màu DCI-P3 100%.',
    specs: { 'Màn hình': '14" OLED 3K 120Hz', CPU: 'AMD Ryzen AI 9 HX 370', GPU: 'NVIDIA GeForce RTX 5070 Ti Laptop', RAM: '32GB LPDDR5X', 'Lưu trữ': '1TB SSD PCIe 4.0', 'Trọng lượng': '1,57kg' },
    colors: [{ name: 'Eclipse Gray', hex: '#3a3b3e' }, { name: 'Platinum White', hex: '#e2e2e0' }],
    variants: [],
  },
  {
    id: 'thinkpad-x1-carbon-gen13', name: 'Lenovo ThinkPad X1 Carbon Gen 13', brand: 'Lenovo', category: 'laptop',
    price: 45_990_000, oldPrice: 49_990_000, rating: 4.6, reviews: 92, stock: 8, sold: 180,
    isNew: false, featured: false, createdAt: '2025-01-15', warranty: '36 tháng',
    images: [IMG.laptop2, IMG.laptop3, IMG.keyboard],
    short: 'Doanh nhân siêu nhẹ dưới 1kg, sợi carbon, bàn phím ThinkPad huyền thoại.',
    description: 'ThinkPad X1 Carbon Gen 13 nặng chỉ 986g nhờ khung sợi carbon, đạt chuẩn độ bền quân đội MIL-STD-810H. Bàn phím ThinkPad danh tiếng cùng TrackPoint đỏ quen thuộc.\nBảo mật cấp doanh nghiệp với vân tay, IR camera và chip bảo mật dTPM 2.0.',
    specs: { 'Màn hình': '14" 2.8K OLED', CPU: 'Intel Core Ultra 7 268V', RAM: '32GB LPDDR5x', 'Lưu trữ': '1TB SSD', 'Trọng lượng': '986g', 'Bảo mật': 'Vân tay, IR camera, dTPM 2.0' },
    colors: [{ name: 'Đen Carbon', hex: '#1c1c1e' }],
    variants: [],
  },
  {
    id: 'ipad-pro-m4-11', name: 'iPad Pro 11" M4 Wi‑Fi', brand: 'Apple', category: 'tablet',
    price: 28_990_000, oldPrice: 30_990_000, rating: 4.9, reviews: 388, stock: 14, sold: 760,
    isNew: false, featured: true, createdAt: '2024-05-15', warranty: '12 tháng',
    images: [IMG.ipad, IMG.ipad2, IMG.tablet],
    short: 'Mỏng 5,3mm, màn hình Ultra Retina XDR OLED kép và chip M4 đầy uy lực.',
    description: 'iPad Pro M4 là thiết bị mỏng nhất Apple từng sản xuất với màn hình Ultra Retina XDR sử dụng công nghệ OLED kép (Tandem OLED) cho độ sáng và độ tương phản đáng kinh ngạc.\nKết hợp Apple Pencil Pro và Magic Keyboard để biến iPad thành chiếc máy tính sáng tạo hoàn hảo.',
    specs: { 'Màn hình': '11" Ultra Retina XDR Tandem OLED', Chip: 'Apple M4', 'Camera sau': '12MP Wide + LiDAR', 'Kết nối': 'Wi‑Fi 6E, Thunderbolt / USB 4', 'Độ mỏng': '5,3mm', 'Hỗ trợ': 'Apple Pencil Pro, Magic Keyboard' },
    colors: [{ name: 'Đen Không Gian', hex: '#2e2e30' }, { name: 'Bạc', hex: '#d6d6d4' }],
    variants: [{ label: '256GB', add: 0 }, { label: '512GB', add: 6_000_000 }, { label: '1TB', add: 16_000_000 }],
  },
  {
    id: 'ipad-air-m3-11', name: 'iPad Air 11" M3 Wi‑Fi', brand: 'Apple', category: 'tablet',
    price: 16_490_000, oldPrice: 16_990_000, rating: 4.8, reviews: 512, stock: 26, sold: 1340,
    isNew: false, featured: false, createdAt: '2025-03-12', warranty: '12 tháng',
    images: [IMG.ipad2, IMG.ipad, IMG.tablet],
    short: 'Chip M3 mạnh mẽ, hỗ trợ Apple Intelligence trong thiết kế nhẹ nhàng nhiều màu sắc.',
    description: 'iPad Air M3 mang hiệu năng đồ hoạ vượt trội với dò tia tăng tốc phần cứng, lý tưởng cho học tập, ghi chú và vẽ minh hoạ.\nTương thích Apple Pencil Pro và Magic Keyboard cho iPad Air mới.',
    specs: { 'Màn hình': '11" Liquid Retina', Chip: 'Apple M3', 'Camera trước': '12MP Center Stage (cạnh ngang)', 'Kết nối': 'Wi‑Fi 6E, USB‑C', 'Trọng lượng': '460g', 'Hỗ trợ': 'Apple Pencil Pro' },
    colors: [{ name: 'Xanh Dương', hex: '#a6b8cc' }, { name: 'Tím', hex: '#c5bcd6' }, { name: 'Ánh Sao', hex: '#e3d9c6' }, { name: 'Xám Không Gian', hex: '#5c5d60' }],
    variants: [{ label: '128GB', add: 0 }, { label: '256GB', add: 3_000_000 }, { label: '512GB', add: 8_500_000 }],
  },
  {
    id: 'galaxy-tab-s10-ultra', name: 'Samsung Galaxy Tab S10 Ultra', brand: 'Samsung', category: 'tablet',
    price: 29_990_000, oldPrice: 32_990_000, rating: 4.7, reviews: 167, stock: 9, sold: 290,
    isNew: false, featured: false, createdAt: '2024-10-03', warranty: '12 tháng',
    images: [IMG.tablet, IMG.ipad2, IMG.ipad],
    short: 'Màn hình 14,6 inch Dynamic AMOLED 2X chống chói, S Pen kèm theo và Galaxy AI.',
    description: 'Galaxy Tab S10 Ultra là máy tính bảng Android lớn nhất và mạnh mẽ nhất với màn hình 14,6 inch chống chói, lý tưởng cho giải trí và làm việc đa nhiệm.\nĐạt chuẩn IP68, đi kèm bút S Pen, tích hợp Galaxy AI hỗ trợ ghi chú, giải toán.',
    specs: { 'Màn hình': '14,6" Dynamic AMOLED 2X 120Hz', Chip: 'MediaTek Dimensity 9300+', RAM: '12GB', 'Lưu trữ': '256GB', Pin: '11.200mAh, sạc 45W', 'Phụ kiện': 'S Pen kèm theo' },
    colors: [{ name: 'Xám Titan', hex: '#6d6e70' }, { name: 'Bạc Titan', hex: '#c9cacc' }],
    variants: [{ label: '12GB/256GB', add: 0 }, { label: '12GB/512GB', add: 3_000_000 }],
  },
  {
    id: 'apple-watch-ultra-2', name: 'Apple Watch Ultra 2 (49mm)', brand: 'Apple', category: 'dong-ho',
    price: 21_990_000, oldPrice: 22_990_000, rating: 4.9, reviews: 403, stock: 11, sold: 690,
    isNew: false, featured: true, createdAt: '2024-09-20', warranty: '12 tháng',
    images: [IMG.watch2, IMG.watch, IMG.watch3],
    short: 'Vỏ Titan 49mm, màn hình sáng 3.000 nit, GPS hai tần số và pin đến 36 giờ.',
    description: 'Apple Watch Ultra 2 dành cho những người yêu phiêu lưu với vỏ Titan hàng không bền bỉ, mặt kính sapphire phẳng và nút Tác vụ tuỳ chỉnh.\nGPS hai tần số chính xác, lặn biển đến 40m, còi báo động 86 dB và chế độ tiết kiệm pin lên đến 72 giờ.',
    specs: { 'Kích thước': '49mm', 'Chất liệu': 'Titan, kính Sapphire', 'Màn hình': 'Retina LTPO3 3.000 nit', Chip: 'S9 SiP', Pin: '36 giờ (72 giờ tiết kiệm)', 'Kháng nước': 'WR100, lặn 40m' },
    colors: [{ name: 'Titan Tự Nhiên', hex: '#b8b2a7' }, { name: 'Titan Đen', hex: '#232325' }],
    variants: [],
  },
  {
    id: 'apple-watch-series-10', name: 'Apple Watch Series 10 GPS 46mm', brand: 'Apple', category: 'dong-ho',
    price: 11_490_000, oldPrice: 12_490_000, rating: 4.8, reviews: 588, stock: 20, sold: 1520,
    isNew: false, featured: false, createdAt: '2024-09-20', warranty: '12 tháng',
    images: [IMG.watch, IMG.watch2, IMG.watch3],
    short: 'Mỏng nhất từ trước đến nay, màn hình góc rộng OLED lớn nhất và sạc nhanh.',
    description: 'Apple Watch Series 10 có thiết kế mỏng hơn, màn hình lớn hơn và sáng hơn khi nhìn nghiêng. Tính năng phát hiện ngưng thở khi ngủ, đo nhiệt độ nước và độ sâu.\nSạc nhanh 80% chỉ trong khoảng 30 phút.',
    specs: { 'Kích thước': '46mm', 'Chất liệu': 'Nhôm', 'Màn hình': 'Retina LTPO3 góc rộng', Chip: 'S10 SiP', Pin: 'Lên đến 18 giờ', 'Sức khoẻ': 'ECG, SpO2, phát hiện ngưng thở khi ngủ' },
    colors: [{ name: 'Đen Bóng', hex: '#141414' }, { name: 'Bạc', hex: '#d6d6d4' }, { name: 'Vàng Hồng', hex: '#e7c4b4' }],
    variants: [],
  },
  {
    id: 'galaxy-watch-ultra', name: 'Samsung Galaxy Watch Ultra', brand: 'Samsung', category: 'dong-ho',
    price: 13_990_000, oldPrice: 16_990_000, rating: 4.6, reviews: 214, stock: 13, sold: 470,
    isNew: false, featured: false, createdAt: '2024-07-24', warranty: '12 tháng',
    images: [IMG.watch3, IMG.watch, IMG.watch2],
    short: 'Vỏ Titan cấp 4, màn hình sapphire 3.000 nit, pin đến 100 giờ ở chế độ tiết kiệm.',
    description: 'Galaxy Watch Ultra được thiết kế cho vận động viên và người thích khám phá: vỏ Titan, chống nước 10ATM, GPS kép L1+L5.\nChỉ số sức khoẻ toàn diện với Galaxy AI: điểm năng lượng, chỉ số AGEs và theo dõi giấc ngủ chuyên sâu.',
    specs: { 'Kích thước': '47mm', 'Chất liệu': 'Titan cấp 4, kính Sapphire', 'Màn hình': '1,5" Super AMOLED 3.000 nit', Chip: 'Exynos W1000', Pin: 'Đến 100 giờ (tiết kiệm)', 'Kháng nước': '10ATM, IP68' },
    colors: [{ name: 'Titan Xám', hex: '#6d6e70' }, { name: 'Titan Trắng', hex: '#e6e4df' }, { name: 'Titan Bạc', hex: '#b6b7b9' }],
    variants: [],
  },
  {
    id: 'airpods-pro-2', name: 'AirPods Pro 2 (USB‑C)', brand: 'Apple', category: 'am-thanh',
    price: 5_990_000, oldPrice: 6_790_000, rating: 4.8, reviews: 2210, stock: 40, sold: 6890,
    isNew: false, featured: false, createdAt: '2023-09-22', warranty: '12 tháng',
    images: [IMG.airpods, IMG.earbuds, IMG.headphone],
    short: 'Chống ồn chủ động gấp 2 lần, Âm thanh thích ứng và tính năng hỗ trợ thính giác.',
    description: 'AirPods Pro 2 với chip H2 mang lại khả năng chống ồn chủ động vượt trội, chế độ Âm thanh thích ứng tự động điều chỉnh theo môi trường.\nHộp sạc USB‑C có loa tích hợp, hỗ trợ tìm kiếm chính xác và chống nước IP54.',
    specs: { Chip: 'Apple H2', 'Chống ồn': 'ANC thế hệ mới, Xuyên âm thích ứng', Pin: '6 giờ (30 giờ kèm hộp)', 'Kết nối': 'Bluetooth 5.3, USB‑C', 'Kháng nước': 'IP54', 'Tính năng': 'Âm thanh không gian, hỗ trợ thính giác' },
    colors: [{ name: 'Trắng', hex: '#f4f4f2' }],
    variants: [],
  },
  {
    id: 'sony-wh-1000xm6', name: 'Sony WH‑1000XM6', brand: 'Sony', category: 'am-thanh',
    price: 9_990_000, oldPrice: null, rating: 4.9, reviews: 312, stock: 17, sold: 590,
    isNew: true, featured: true, createdAt: '2025-05-16', warranty: '12 tháng',
    images: [IMG.headphone3, IMG.headphone, IMG.headphone2],
    short: 'Tai nghe chống ồn hàng đầu thế giới, chip QN3 và 12 micro xử lý thông minh.',
    description: 'Sony WH‑1000XM6 nâng chuẩn chống ồn với bộ xử lý HD QN3 nhanh gấp 7 lần thế hệ trước và 12 micro. Âm thanh được tinh chỉnh cùng các kỹ sư phòng thu đạt giải Grammy.\nThiết kế gập gọn trở lại, hộp đựng nam châm tiện lợi và pin 30 giờ.',
    specs: { 'Chống ồn': 'HD Noise Cancelling QN3, 12 micro', 'Driver': '30mm sợi carbon', Pin: '30 giờ (ANC bật)', 'Kết nối': 'Bluetooth 5.3, LDAC, Multipoint', 'Sạc nhanh': '3 phút = 3 giờ nghe', 'Trọng lượng': '254g' },
    colors: [{ name: 'Đen', hex: '#1b1b1c' }, { name: 'Bạc Platinum', hex: '#d2d0cb' }, { name: 'Xanh Midnight', hex: '#283245' }],
    variants: [],
  },
  {
    id: 'bose-qc-ultra-headphones', name: 'Bose QuietComfort Ultra Headphones', brand: 'Bose', category: 'am-thanh',
    price: 8_990_000, oldPrice: 10_490_000, rating: 4.7, reviews: 265, stock: 12, sold: 410,
    isNew: false, featured: false, createdAt: '2023-10-05', warranty: '12 tháng',
    images: [IMG.headphone2, IMG.headphone3, IMG.headphone],
    short: 'Âm thanh vòm Bose Immersive Audio, chống ồn đẳng cấp và đệm tai êm ái.',
    description: 'Bose QuietComfort Ultra mang đến trải nghiệm âm thanh không gian Immersive Audio đưa âm nhạc ra khỏi tai nghe. Công nghệ CustomTune tự hiệu chỉnh theo khuôn tai của bạn.\nChất liệu cao cấp, khớp kim loại và đệm tai mềm mại cho cả ngày đeo thoải mái.',
    specs: { 'Chống ồn': 'CustomTune ANC', 'Âm thanh': 'Bose Immersive Audio', Pin: '24 giờ', 'Kết nối': 'Bluetooth 5.3, aptX Adaptive', 'Micro': '8 micro khử tiếng ồn', 'Trọng lượng': '250g' },
    colors: [{ name: 'Đen', hex: '#1b1b1c' }, { name: 'Trắng Khói', hex: '#e9e6df' }],
    variants: [],
  },
  {
    id: 'sony-wf-1000xm5', name: 'Sony WF‑1000XM5', brand: 'Sony', category: 'am-thanh',
    price: 5_490_000, oldPrice: 6_490_000, rating: 4.7, reviews: 489, stock: 21, sold: 1180,
    isNew: false, featured: false, createdAt: '2023-07-24', warranty: '12 tháng',
    images: [IMG.earbuds, IMG.airpods, IMG.headphone2],
    short: 'Tai nghe true wireless chống ồn tốt nhất của Sony, nhỏ gọn hơn 25%.',
    description: 'WF‑1000XM5 sở hữu hai bộ xử lý chống ồn, driver Dynamic Driver X mới cho âm trầm sâu và chi tiết. Thiết kế nhỏ gọn hơn, nút tai mút xốp ôm khít.\nHỗ trợ LDAC, âm thanh Hi‑Res Audio Wireless và DSEE Extreme.',
    specs: { 'Chống ồn': 'QN2e + V2', Driver: 'Dynamic Driver X 8,4mm', Pin: '8 giờ (24 giờ kèm hộp)', 'Kết nối': 'Bluetooth 5.3, LDAC', 'Kháng nước': 'IPX4', 'Sạc': 'USB‑C, không dây Qi' },
    colors: [{ name: 'Đen', hex: '#1b1b1c' }, { name: 'Bạc', hex: '#d2d0cb' }],
    variants: [],
  },
  {
    id: 'marshall-stanmore-iii', name: 'Marshall Stanmore III', brand: 'Marshall', category: 'am-thanh',
    price: 9_490_000, oldPrice: null, rating: 4.8, reviews: 176, stock: 8, sold: 260,
    isNew: false, featured: false, createdAt: '2022-09-15', warranty: '12 tháng',
    images: [IMG.speaker, IMG.speaker2, IMG.headphone],
    short: 'Loa Bluetooth biểu tượng phong cách rock, âm thanh mạnh mẽ lan toả cả căn phòng.',
    description: 'Marshall Stanmore III mang thiết kế ampli guitar huyền thoại vào phòng khách của bạn. Âm thanh phân tán rộng hơn với tweeter hướng ngoài, công suất 80W.\nNúm vặn bằng đồng thau điều chỉnh âm trầm, âm cao trực quan.',
    specs: { 'Công suất': '80W (50W woofer + 2x15W tweeter)', 'Dải tần': '45 – 20.000 Hz', 'Kết nối': 'Bluetooth 5.2, AUX 3.5mm, HDMI eARC', 'Ứng dụng': 'Marshall Bluetooth App', 'Kích thước': '35 x 20,3 x 18,8 cm', 'Trọng lượng': '4,25kg' },
    colors: [{ name: 'Đen', hex: '#1b1b1c' }, { name: 'Kem', hex: '#e8dfcc' }],
    variants: [],
  },
  {
    id: 'sony-a7-iv', name: 'Sony Alpha A7 IV', brand: 'Sony', category: 'may-anh',
    price: 46_990_000, oldPrice: 52_990_000, rating: 4.9, reviews: 287, stock: 5, sold: 340,
    isNew: false, featured: true, createdAt: '2021-12-10', warranty: '24 tháng',
    images: [IMG.camera, IMG.camera2, IMG.camera3],
    short: 'Máy ảnh full-frame 33MP lai hoàn hảo giữa chụp ảnh và quay phim 4K 60p.',
    description: 'Sony A7 IV là chiếc máy ảnh full-frame đa năng với cảm biến Exmor R 33MP, bộ xử lý BIONZ XR và lấy nét theo mắt thời gian thực cho người, động vật, chim.\nQuay video 4K 60p 10-bit 4:2:2, màn hình xoay lật đa góc phù hợp cho nhà sáng tạo nội dung.',
    specs: { 'Cảm biến': 'Full-frame Exmor R CMOS 33MP', 'Bộ xử lý': 'BIONZ XR', 'Lấy nét': '759 điểm, Real-time Eye AF', Video: '4K 60p 10-bit 4:2:2', 'Chống rung': '5 trục, 5,5 stop', 'Ngàm': 'Sony E' },
    colors: [{ name: 'Đen', hex: '#151515' }],
    variants: [{ label: 'Body', add: 0 }, { label: 'Kit FE 28-70mm', add: 4_000_000 }],
  },
  {
    id: 'fujifilm-x100vi', name: 'Fujifilm X100VI', brand: 'Fujifilm', category: 'may-anh',
    price: 42_990_000, oldPrice: null, rating: 4.9, reviews: 154, stock: 0, sold: 220,
    isNew: false, featured: false, createdAt: '2024-02-20', warranty: '24 tháng',
    images: [IMG.camera3, IMG.camera2, IMG.camera],
    short: 'Máy ảnh compact cao cấp 40MP, chống rung IBIS và 20 giả lập phim kinh điển.',
    description: 'Fujifilm X100VI kế thừa thiết kế cổ điển được yêu thích với cảm biến X-Trans CMOS 5 HR 40MP và lần đầu tiên có chống rung trong thân máy 6 stop.\nKính ngắm lai quang học/điện tử độc đáo và 20 chế độ giả lập phim Fujifilm, bao gồm REALA ACE.',
    specs: { 'Cảm biến': 'APS-C X-Trans CMOS 5 HR 40MP', 'Ống kính': '23mm f/2 (tương đương 35mm)', 'Chống rung': 'IBIS 6 stop', Video: '6.2K 30p, 4K 60p', 'Kính ngắm': 'Hybrid OVF/EVF', 'Trọng lượng': '521g' },
    colors: [{ name: 'Bạc', hex: '#c9c9c6' }, { name: 'Đen', hex: '#151515' }],
    variants: [],
  },
  {
    id: 'dji-mini-4-pro', name: 'DJI Mini 4 Pro', brand: 'DJI', category: 'may-anh',
    price: 21_990_000, oldPrice: 23_990_000, rating: 4.8, reviews: 236, stock: 10, sold: 520,
    isNew: false, featured: false, createdAt: '2023-09-25', warranty: '12 tháng',
    images: [IMG.drone, IMG.camera2, IMG.camera],
    short: 'Flycam dưới 249g, cảm biến tránh vật cản đa hướng, video 4K/60fps HDR.',
    description: 'DJI Mini 4 Pro nhỏ gọn dưới 249g nhưng sở hữu cảm biến 1/1.3 inch quay 4K/60fps HDR, chế độ quay dọc thực sự cho mạng xã hội.\nCảm biến tránh vật cản đa hướng, truyền hình ảnh O4 lên đến 20km và tính năng ActiveTrack 360°.',
    specs: { 'Trọng lượng': '< 249g', Camera: '1/1.3" CMOS 48MP', Video: '4K/60fps HDR, 4K/100fps slow-motion', 'Truyền hình ảnh': 'DJI O4, 20km', 'Thời gian bay': '34 phút', 'An toàn': 'Tránh vật cản đa hướng' },
    colors: [{ name: 'Xám', hex: '#8f9093' }],
    variants: [{ label: 'Tiêu chuẩn (RC‑N2)', add: 0 }, { label: 'Fly More Combo (DJI RC 2)', add: 6_000_000 }],
  },
  {
    id: 'logitech-mx-master-3s', name: 'Logitech MX Master 3S', brand: 'Logitech', category: 'phu-kien',
    price: 2_490_000, oldPrice: 2_790_000, rating: 4.8, reviews: 1320, stock: 45, sold: 3900,
    isNew: false, featured: false, createdAt: '2022-05-24', warranty: '12 tháng',
    images: [IMG.mouse, IMG.keyboard, IMG.keyboard2],
    short: 'Chuột không dây cao cấp, nhấp chuột yên tĩnh, cảm biến 8K DPI dùng trên mặt kính.',
    description: 'MX Master 3S là chuẩn mực chuột năng suất với con lăn MagSpeed cuộn 1.000 dòng/giây, thiết kế công thái học và nút bấm giảm 90% tiếng ồn.\nKết nối đồng thời 3 thiết bị, sạc USB‑C 1 phút dùng 3 giờ.',
    specs: { 'Cảm biến': 'Darkfield 8.000 DPI', 'Kết nối': 'Bluetooth, Logi Bolt', Pin: 'Đến 70 ngày', 'Số nút': '7 nút tuỳ chỉnh', 'Tương thích': 'Windows, macOS, Linux, iPadOS', 'Trọng lượng': '141g' },
    colors: [{ name: 'Graphite', hex: '#3b3c3f' }, { name: 'Pale Grey', hex: '#d8d8d6' }],
    variants: [],
  },
  {
    id: 'keychron-q1-max', name: 'Keychron Q1 Max', brand: 'Keychron', category: 'phu-kien',
    price: 5_290_000, oldPrice: null, rating: 4.7, reviews: 208, stock: 14, sold: 380,
    isNew: false, featured: false, createdAt: '2023-11-10', warranty: '12 tháng',
    images: [IMG.keyboard2, IMG.keyboard, IMG.mouse],
    short: 'Bàn phím cơ vỏ nhôm CNC, gasket mount, không dây 2.4GHz & Bluetooth, hot-swap.',
    description: 'Keychron Q1 Max là bàn phím cơ custom cao cấp với vỏ nhôm nguyên khối CNC, cấu trúc gasket mount cho cảm giác gõ êm ái và âm thanh "thocky" đặc trưng.\nHỗ trợ QMK/VIA tuỳ biến, hot-swap switch, kết nối 3 chế độ.',
    specs: { Layout: '75%, 81 phím', 'Chất liệu': 'Nhôm CNC 6063', Switch: 'Gateron Jupiter Banana (hot-swap)', 'Kết nối': '2.4GHz, Bluetooth 5.1, USB‑C', Pin: '4.000mAh', 'Phần mềm': 'QMK / VIA' },
    colors: [{ name: 'Đen Carbon', hex: '#2a2a2c' }, { name: 'Xám Bạc', hex: '#b7b8ba' }],
    variants: [],
  },
  {
    id: 'dell-ultrasharp-u2724d', name: 'Màn hình Dell UltraSharp 27" U2724D', brand: 'Dell', category: 'phu-kien',
    price: 9_990_000, oldPrice: 11_490_000, rating: 4.7, reviews: 143, stock: 11, sold: 300,
    isNew: false, featured: false, createdAt: '2023-08-01', warranty: '36 tháng',
    images: [IMG.monitor, IMG.laptop3, IMG.keyboard],
    short: 'Màn hình 27 inch QHD IPS Black 120Hz, chuẩn màu 100% sRGB cho dân văn phòng & thiết kế.',
    description: 'Dell UltraSharp U2724D sử dụng công nghệ IPS Black cho độ tương phản 2000:1, tần số quét 120Hz mượt mà và chứng nhận ComfortView Plus bảo vệ mắt.\nChân đế điều chỉnh linh hoạt nâng hạ, xoay, nghiêng và xoay dọc.',
    specs: { 'Kích thước': '27 inch', 'Độ phân giải': 'QHD 2560 x 1440', 'Tấm nền': 'IPS Black, 120Hz', 'Màu sắc': '100% sRGB, 98% DCI-P3', 'Cổng kết nối': 'DP 1.4, HDMI 2.1, USB hub', 'Bảo vệ mắt': 'ComfortView Plus 4 sao' },
    colors: [{ name: 'Bạc', hex: '#c9cacc' }],
    variants: [],
  },
  {
    id: 'ps5-pro', name: 'Sony PlayStation 5 Pro', brand: 'Sony', category: 'gaming',
    price: 18_990_000, oldPrice: 19_990_000, rating: 4.8, reviews: 342, stock: 9, sold: 780,
    isNew: false, featured: true, createdAt: '2024-11-07', warranty: '12 tháng',
    images: [IMG.controller, IMG.gaming, IMG.monitor],
    short: 'GPU mạnh hơn 45%, dò tia nâng cao và nâng cấp hình ảnh PSSR bằng AI.',
    description: 'PlayStation 5 Pro mang đến trải nghiệm chơi game mượt mà và sắc nét hơn với GPU nâng cấp, dò tia tiên tiến và công nghệ PlayStation Spectral Super Resolution dựa trên AI.\nỔ SSD 2TB, hỗ trợ Wi‑Fi 7 và tay cầm DualSense đi kèm.',
    specs: { CPU: 'AMD Zen 2, 8 nhân', GPU: 'AMD RDNA nâng cấp, dò tia nâng cao', 'Lưu trữ': 'SSD 2TB', 'Độ phân giải': 'Lên đến 8K, 4K 120Hz', 'Kết nối': 'Wi‑Fi 7, USB‑C, HDMI 2.1', 'Đi kèm': 'Tay cầm DualSense' },
    colors: [{ name: 'Trắng', hex: '#f1f1ef' }],
    variants: [],
  },
  {
    id: 'nintendo-switch-2', name: 'Nintendo Switch 2', brand: 'Nintendo', category: 'gaming',
    price: 12_990_000, oldPrice: null, rating: 4.8, reviews: 265, stock: 16, sold: 640,
    isNew: true, featured: false, createdAt: '2025-06-05', warranty: '12 tháng',
    images: [IMG.gaming, IMG.controller, IMG.monitor],
    short: 'Màn hình 7,9 inch 120Hz, Joy‑Con 2 gắn nam châm và xuất hình 4K trên TV.',
    description: 'Nintendo Switch 2 nâng cấp toàn diện với màn hình LCD 7,9 inch 1080p 120Hz HDR, Joy‑Con 2 gắn nam châm có thể dùng như chuột.\nKhi kết nối dock, máy xuất hình 4K trên TV. Tính năng GameChat cho phép trò chuyện cùng bạn bè.',
    specs: { 'Màn hình': '7,9" LCD 1080p 120Hz HDR10', 'Xuất hình TV': 'Lên đến 4K 60fps', 'Lưu trữ': '256GB UFS', 'Tay cầm': 'Joy‑Con 2 nam châm', Pin: '2 – 6,5 giờ', 'Tính năng': 'GameChat, tương thích ngược Switch' },
    colors: [{ name: 'Đen', hex: '#1d1d1f' }],
    variants: [{ label: 'Máy lẻ', add: 0 }, { label: 'Bundle Mario Kart World', add: 1_500_000 }],
  },
];

const getProduct = (id) => PRODUCTS.find((p) => p.id === id) || null;
const discountPercent = (p) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
const unitPrice = (p, variantLabel) => p.price + (p.variants.find((v) => v.label === variantLabel)?.add || 0);
const productUrl = (p) => `product-detail.html?id=${encodeURIComponent(p.id)}`;
const categoryName = (key) => CATEGORIES[key]?.name || '';

/** Thẻ <img> với ảnh dự phòng cục bộ nếu ảnh mạng lỗi/không có Internet */
const productImg = (p, index = 0, width = 600, attrs = '') => (
  `<img src="${unsplash(p.images[index] || p.images[0], width)}" alt="${escapeHTML(p.name)}" loading="lazy" decoding="async" data-fallback="images/${p.category}.svg" ${attrs}>`
);

/* ==========================================================================
   4. LƯU TRỮ: GIỎ HÀNG, YÊU THÍCH, MÃ GIẢM GIÁ, TÀI KHOẢN, ĐƠN HÀNG
   ========================================================================== */
const emit = (name) => document.dispatchEvent(new CustomEvent(name));

const Cart = {
  items() {
    return Store.get(STORAGE.cart, []).filter((item) => getProduct(item.id));
  },
  save(items) {
    Store.set(STORAGE.cart, items);
    emit('cart:change');
  },
  /** Thêm sản phẩm; mỗi tổ hợp màu + phiên bản là một dòng riêng */
  add(id, qty = 1, options = {}) {
    const product = getProduct(id);
    if (!product) return false;
    if (product.stock <= 0) {
      toast('Sản phẩm tạm hết hàng.', 'error');
      return false;
    }
    const color = options.color ?? product.colors[0]?.name ?? '';
    const variant = options.variant ?? product.variants[0]?.label ?? '';
    const key = [id, color, variant].join('|');
    const items = this.items();
    const existing = items.find((item) => item.key === key);
    const limit = Math.min(product.stock, MAX_QTY_PER_ITEM);
    const current = existing ? existing.qty : 0;
    const next = Math.min(current + qty, limit);

    if (next === current) {
      toast(`Bạn chỉ có thể mua tối đa ${limit} sản phẩm này.`, 'error');
      return false;
    }
    if (existing) existing.qty = next;
    else items.push({ key, id, color, variant, qty: next });
    this.save(items);
    return true;
  },
  setQty(key, qty) {
    const items = this.items();
    const item = items.find((i) => i.key === key);
    if (!item) return;
    const product = getProduct(item.id);
    item.qty = clamp(Number(qty) || 1, 1, Math.min(product.stock, MAX_QTY_PER_ITEM));
    this.save(items);
  },
  remove(key) {
    this.save(this.items().filter((i) => i.key !== key));
  },
  clear() {
    this.save([]);
  },
  count() {
    return this.items().reduce((sum, i) => sum + i.qty, 0);
  },
  lines() {
    return this.items().map((item) => {
      const product = getProduct(item.id);
      const unit = unitPrice(product, item.variant);
      return { ...item, product, unit, total: unit * item.qty };
    });
  },
  subtotal() {
    return this.lines().reduce((sum, line) => sum + line.total, 0);
  },
};

const Wishlist = {
  ids() {
    return Store.get(STORAGE.wishlist, []).filter((id) => getProduct(id));
  },
  has(id) {
    return this.ids().includes(id);
  },
  toggle(id) {
    const ids = this.ids();
    const exists = ids.includes(id);
    Store.set(STORAGE.wishlist, exists ? ids.filter((x) => x !== id) : [...ids, id]);
    emit('wishlist:change');
    return !exists;
  },
  clear() {
    Store.set(STORAGE.wishlist, []);
    emit('wishlist:change');
  },
};

/** Mã giảm giá mẫu (mô phỏng, kiểm tra hoàn toàn phía trình duyệt) */
const COUPONS = {
  AURUM10: { label: 'Giảm 10% (tối đa 2.000.000₫)', calc: (sub) => Math.min(sub * 0.1, 2_000_000) },
  GIAM500K: { label: 'Giảm 500.000₫ cho đơn từ 10.000.000₫', min: 10_000_000, calc: () => 500_000 },
  FREESHIP: { label: 'Miễn phí vận chuyển', freeShip: true, calc: () => 0 },
};

const Coupon = {
  get() {
    const code = Store.get(STORAGE.coupon, null);
    return code && COUPONS[code] ? { code, ...COUPONS[code] } : null;
  },
  apply(rawCode) {
    const code = rawCode.trim().toUpperCase();
    const coupon = COUPONS[code];
    if (!coupon) return { ok: false, message: 'Mã giảm giá không hợp lệ.' };
    if (coupon.min && Cart.subtotal() < coupon.min) {
      return { ok: false, message: `Mã ${code} áp dụng cho đơn từ ${formatVND(coupon.min)}.` };
    }
    Store.set(STORAGE.coupon, code);
    return { ok: true, message: `Đã áp dụng mã ${code}: ${coupon.label}.` };
  },
  remove() {
    Store.remove(STORAGE.coupon);
  },
};

function calcTotals(shippingMethod = 'standard') {
  const subtotal = Cart.subtotal();
  let coupon = Coupon.get();
  if (coupon?.min && subtotal < coupon.min) coupon = null; // giỏ hàng giảm dưới mức tối thiểu
  const discount = coupon ? Math.round(coupon.calc(subtotal)) : 0;

  let shipping = 0;
  if (subtotal > 0) {
    if (shippingMethod === 'express') shipping = SHIPPING_FEES.express;
    else shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEES.standard;
    if (coupon?.freeShip) shipping = 0;
  }
  return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping), coupon };
}

/**
 * Băm mật khẩu bằng SHA-256 trước khi lưu LocalStorage.
 * LƯU Ý: chỉ phục vụ demo, KHÔNG thay thế được xác thực phía máy chủ.
 */
async function hashPassword(password) {
  if (window.crypto?.subtle) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (const char of password) hash = (Math.imul(31, hash) + char.charCodeAt(0)) | 0;
  return `weak-${hash}`;
}

const Auth = {
  users() {
    return Store.get(STORAGE.users, []);
  },
  session() {
    try {
      const raw = sessionStorage.getItem(STORAGE.session);
      if (raw) return JSON.parse(raw);
    } catch { /* bỏ qua */ }
    return Store.get(STORAGE.session, null);
  },
  current() {
    const session = this.session();
    return session ? this.users().find((u) => u.email === session.email) || null : null;
  },
  startSession(email, remember) {
    const data = { email, at: new Date().toISOString() };
    if (remember) {
      Store.set(STORAGE.session, data);
    } else {
      try { sessionStorage.setItem(STORAGE.session, JSON.stringify(data)); } catch { Store.set(STORAGE.session, data); }
    }
    emit('auth:change');
  },
  async register({ name, email, phone, password }) {
    const users = this.users();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalizedEmail)) throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập.');
    const user = {
      name: name.trim(), email: normalizedEmail, phone: phone.trim(),
      passwordHash: await hashPassword(password), createdAt: new Date().toISOString(),
    };
    Store.set(STORAGE.users, [...users, user]);
    this.startSession(user.email, true);
    return user;
  },
  async login(email, password, remember = true) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users().find((u) => u.email === normalizedEmail);
    if (!user || user.passwordHash !== await hashPassword(password)) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }
    this.startSession(user.email, remember);
    return user;
  },
  logout() {
    Store.remove(STORAGE.session);
    try { sessionStorage.removeItem(STORAGE.session); } catch { /* bỏ qua */ }
    emit('auth:change');
  },
};

/* ==========================================================================
   5. THÀNH PHẦN GIAO DIỆN DÙNG CHUNG
   ========================================================================== */
const NAV_LINKS = [
  { href: 'index.html', label: 'Trang chủ', page: 'home' },
  { href: 'products.html', label: 'Sản phẩm', page: 'products' },
  { href: 'about.html', label: 'Giới thiệu', page: 'about' },
  { href: 'contact.html', label: 'Liên hệ', page: 'contact' },
];

function renderHeader() {
  const header = $('#site-header');
  if (!header) return;
  const page = document.body.dataset.page;
  const user = Auth.current();
  const firstName = user ? escapeHTML(user.name.split(' ').pop()) : '';

  if (!$('.announcement')) {
    header.insertAdjacentHTML('beforebegin', `
      <div class="announcement">
        <div class="container announcement__inner">
          <p><span data-icon="truck"></span> Miễn phí giao hàng cho đơn từ ${formatVND(FREE_SHIP_THRESHOLD)}</p>
          <p class="announcement__extra">Trả góp 0% · Bảo hành VIP · Hotline <a href="tel:02838226868">(028) 3822 6868</a></p>
        </div>
      </div>`);
  }

  header.innerHTML = `
    <div class="container header__inner">
      <button type="button" class="icon-btn menu-toggle" aria-label="Mở menu" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button>
      <a href="index.html" class="logo" aria-label="Aurum Tech – Trang chủ">
        <span class="logo__mark" aria-hidden="true">A</span>
        <span class="logo__text">Aurum<em>Tech</em></span>
      </a>
      <nav class="main-nav" aria-label="Điều hướng chính">
        <ul>
          ${NAV_LINKS.map((l) => `<li><a href="${l.href}" ${l.page === page ? 'aria-current="page" class="is-active"' : ''}>${l.label}</a></li>`).join('')}
        </ul>
      </nav>
      <div class="header__actions">
        <button type="button" class="icon-btn" data-open-search aria-label="Tìm kiếm (Ctrl + K)">${icon('search')}</button>
        <a href="wishlist.html" class="icon-btn header__wish" aria-label="Sản phẩm yêu thích">${icon('heart')}<span class="badge" data-wishlist-count hidden>0</span></a>
        <a href="login.html" class="icon-btn header__account ${user ? 'is-logged' : ''}" aria-label="${user ? `Tài khoản của ${firstName}` : 'Đăng nhập / Đăng ký'}">
          ${icon('user')}${user ? `<span class="header__user-name">${firstName}</span>` : ''}
        </a>
        <a href="cart.html" class="icon-btn" aria-label="Giỏ hàng">${icon('bag')}<span class="badge" data-cart-count hidden>0</span></a>
      </div>
    </div>`;

  if (!$('#search-overlay')) document.body.insertAdjacentHTML('beforeend', overlaysHTML(page));
  updateBadges();
}

function overlaysHTML(page) {
  const popular = ['iPhone 17', 'MacBook', 'Galaxy', 'Sony', 'iPad', 'Apple Watch'];
  return `
    <div class="search-overlay" id="search-overlay" role="dialog" aria-modal="true" aria-label="Tìm kiếm sản phẩm" hidden>
      <div class="search-overlay__panel">
        <div class="container">
          <form class="search-form" action="products.html" method="get" role="search">
            ${icon('search')}
            <input type="search" name="q" id="search-input" placeholder="Tìm iPhone, MacBook, tai nghe…" autocomplete="off" aria-label="Từ khoá tìm kiếm" aria-controls="search-results">
            <button type="button" class="icon-btn" data-close-search aria-label="Đóng tìm kiếm">${icon('close')}</button>
          </form>
          <div class="search-popular">
            <span>Tìm kiếm phổ biến:</span>
            ${popular.map((q) => `<a class="chip" href="products.html?q=${encodeURIComponent(q)}">${q}</a>`).join('')}
          </div>
          <div class="search-results" id="search-results" aria-live="polite"></div>
        </div>
      </div>
    </div>

    <div class="mobile-nav" id="mobile-nav" hidden>
      <div class="mobile-nav__backdrop" data-close-menu></div>
      <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
        <div class="mobile-nav__head">
          <a href="index.html" class="logo"><span class="logo__mark" aria-hidden="true">A</span><span class="logo__text">Aurum<em>Tech</em></span></a>
          <button type="button" class="icon-btn" data-close-menu aria-label="Đóng menu">${icon('close')}</button>
        </div>
        <form class="mobile-nav__search" action="products.html" method="get" role="search">
          ${icon('search')}
          <input type="search" name="q" placeholder="Tìm sản phẩm…" aria-label="Tìm sản phẩm">
        </form>
        <nav aria-label="Điều hướng mobile">
          <ul class="mobile-nav__links">
            ${NAV_LINKS.map((l) => `<li><a href="${l.href}" ${l.page === page ? 'aria-current="page"' : ''}>${l.label}</a></li>`).join('')}
          </ul>
          <p class="mobile-nav__label">Danh mục</p>
          <ul class="mobile-nav__cats">
            ${Object.entries(CATEGORIES).map(([key, c]) => `<li><a href="products.html?cat=${key}">${c.name}</a></li>`).join('')}
          </ul>
        </nav>
        <div class="mobile-nav__foot">
          <a href="login.html" class="btn btn--outline btn--block">${icon('user')} Tài khoản</a>
          <a href="wishlist.html" class="btn btn--ghost btn--block">${icon('heart')} Yêu thích</a>
        </div>
      </div>
    </div>`;
}

function renderFooter() {
  const footer = $('#site-footer');
  if (!footer) return;
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="footer__newsletter">
      <div class="container footer__newsletter-inner">
        <div>
          <p class="eyebrow">Aurum Insider</p>
          <h2>Nhận tin ra mắt sản phẩm &amp; ưu đãi riêng</h2>
        </div>
        <form class="newsletter-form" id="newsletter-form" novalidate>
          <label for="newsletter-email" class="sr-only">Email của bạn</label>
          <input class="input" type="email" id="newsletter-email" name="email" placeholder="Nhập email của bạn" autocomplete="email" required>
          <button type="submit" class="btn btn--gold">Đăng ký</button>
        </form>
      </div>
    </div>
    <div class="container footer__grid">
      <div class="footer__brand">
        <a href="index.html" class="logo"><span class="logo__mark" aria-hidden="true">A</span><span class="logo__text">Aurum<em>Tech</em></span></a>
        <p>Hệ thống bán lẻ công nghệ cao cấp – chính hãng, tinh tế và tận tâm.</p>
        <ul class="socials">
          <li><a href="#" aria-label="Facebook (liên kết mẫu)">${icon('facebook')}</a></li>
          <li><a href="#" aria-label="Instagram (liên kết mẫu)">${icon('instagram')}</a></li>
          <li><a href="#" aria-label="YouTube (liên kết mẫu)">${icon('youtube')}</a></li>
        </ul>
      </div>
      <nav class="footer__col" aria-label="Danh mục sản phẩm">
        <h3>Sản phẩm</h3>
        <ul>${Object.entries(CATEGORIES).slice(0, 6).map(([k, c]) => `<li><a href="products.html?cat=${k}">${c.name}</a></li>`).join('')}</ul>
      </nav>
      <nav class="footer__col" aria-label="Thông tin">
        <h3>Thông tin</h3>
        <ul>
          <li><a href="about.html">Giới thiệu</a></li>
          <li><a href="contact.html">Liên hệ</a></li>
          <li><a href="contact.html#faq">Câu hỏi thường gặp</a></li>
          <li><a href="login.html">Tài khoản</a></li>
          <li><a href="cart.html">Giỏ hàng</a></li>
        </ul>
      </nav>
      <div class="footer__col">
        <h3>Liên hệ</h3>
        <address>
          <p>${icon('pin')} 72 Lê Thánh Tôn, Phường Sài Gòn, TP. Hồ Chí Minh</p>
          <p>${icon('phone')} <a href="tel:02838226868">(028) 3822 6868</a></p>
          <p>${icon('mail')} <a href="mailto:cskh@aurumtech.vn">cskh@aurumtech.vn</a></p>
        </address>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="container footer__bottom-inner">
        <p>© ${year} Aurum Tech. Website demo phục vụ học tập.</p>
        <p class="footer__disclaimer">${icon('alert')} Giỏ hàng, tài khoản và thanh toán là <strong>mô phỏng</strong> (LocalStorage) – chưa kết nối backend hay cổng thanh toán thật.</p>
      </div>
    </div>
    <button type="button" class="back-to-top" id="back-to-top" aria-label="Lên đầu trang" hidden>${icon('arrow-up')}</button>`;

  $('#newsletter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#newsletter-email');
    const email = input.value.trim().toLowerCase();
    if (validators.email(email)) {
      toast('Vui lòng nhập email hợp lệ.', 'error');
      input.focus();
      return;
    }
    const list = Store.get(STORAGE.newsletter, []);
    if (!list.includes(email)) Store.set(STORAGE.newsletter, [...list, email]);
    input.value = '';
    toast('Cảm ơn bạn đã đăng ký nhận tin (mô phỏng)!');
  });

  const backToTop = $('#back-to-top');
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function updateBadges() {
  const cartCount = Cart.count();
  const wishCount = Wishlist.ids().length;
  $$('[data-cart-count]').forEach((el) => { el.textContent = cartCount; el.hidden = cartCount === 0; });
  $$('[data-wishlist-count]').forEach((el) => { el.textContent = wishCount; el.hidden = wishCount === 0; });
}

/** Thông báo nhỏ góc màn hình */
function toast(message, type = 'success', action = null) {
  let container = $('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.append(container);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `${icon(type === 'success' ? 'check' : 'alert')}<p>${escapeHTML(message)}</p>${action ? `<a href="${action.href}">${escapeHTML(action.label)}</a>` : ''}`;
  container.append(el);
  requestAnimationFrame(() => el.classList.add('is-visible'));
  setTimeout(() => {
    el.classList.remove('is-visible');
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

const starsHTML = (rating, size = '') => (
  `<span class="stars ${size}" style="--rating:${rating}" role="img" aria-label="${String(rating).replace('.', ',')} trên 5 sao"></span>`
);

function productCard(p) {
  const off = discountPercent(p);
  const liked = Wishlist.has(p.id);
  const outOfStock = p.stock <= 0;
  return `
    <article class="product-card ${outOfStock ? 'is-out' : ''}" data-id="${p.id}">
      <div class="product-card__media">
        <a href="${productUrl(p)}" class="product-card__img" tabindex="-1" aria-hidden="true">${productImg(p, 0, 600)}</a>
        <div class="product-card__badges">
          ${p.isNew ? '<span class="tag tag--new">Mới</span>' : ''}
          ${off ? `<span class="tag tag--sale">-${off}%</span>` : ''}
          ${outOfStock ? '<span class="tag tag--muted">Hết hàng</span>' : ''}
        </div>
        <button type="button" class="wish-btn ${liked ? 'is-active' : ''}" data-wish="${p.id}" aria-pressed="${liked}" aria-label="${liked ? 'Bỏ khỏi' : 'Thêm vào'} yêu thích: ${escapeHTML(p.name)}">${icon('heart')}</button>
      </div>
      <div class="product-card__body">
        <p class="product-card__brand">${escapeHTML(p.brand)} · ${categoryName(p.category)}</p>
        <h3 class="product-card__title"><a href="${productUrl(p)}">${escapeHTML(p.name)}</a></h3>
        <div class="rating">${starsHTML(p.rating, 'stars--sm')}<span>${String(p.rating).replace('.', ',')} (${formatNumber(p.reviews)})</span></div>
        <p class="product-card__desc">${escapeHTML(p.short)}</p>
        <div class="product-card__footer">
          <div class="price">
            <strong>${formatVND(p.price)}</strong>
            ${p.oldPrice ? `<del>${formatVND(p.oldPrice)}</del>` : ''}
          </div>
          <button type="button" class="btn btn--gold btn--sm product-card__add" data-add-cart="${p.id}" ${outOfStock ? 'disabled' : ''} aria-label="Thêm ${escapeHTML(p.name)} vào giỏ hàng">
            ${icon('bag')}<span>${outOfStock ? 'Hết hàng' : 'Thêm'}</span>
          </button>
        </div>
      </div>
    </article>`;
}

/** Xác nhận ngay trên nút: lần bấm đầu đổi nhãn, bấm lần nữa trong 3 giây mới thực hiện */
function confirmOnButton(btn, label = 'Bấm lần nữa để xác nhận') {
  if (btn.dataset.confirming === 'true') return true;
  btn.dataset.confirming = 'true';
  btn.dataset.original = btn.innerHTML;
  btn.classList.add('is-confirming');
  btn.innerHTML = `${icon('alert')} ${label}`;
  setTimeout(() => {
    if (!btn.isConnected) return;
    btn.dataset.confirming = '';
    btn.classList.remove('is-confirming');
    btn.innerHTML = btn.dataset.original;
  }, 3000);
  return false;
}

function emptyState({ iconName = 'bag', title, text, href = 'products.html', cta = 'Khám phá sản phẩm' }) {
  return `
    <div class="empty-state">
      <span class="empty-state__icon">${icon(iconName)}</span>
      <h2>${title}</h2>
      <p>${text}</p>
      ${href ? `<a href="${href}" class="btn btn--gold">${cta} ${icon('arrow-right')}</a>` : ''}
    </div>`;
}

function renderProductGrid(container, products) {
  if (!container) return;
  container.innerHTML = products.map(productCard).join('');
}

/** Ảnh dự phòng: bắt lỗi tải ảnh ở mọi nơi (kể cả ảnh render sau) */
function useFallback(img) {
  if (img.dataset.fallback && !img.dataset.failed) {
    img.dataset.failed = 'true';
    img.src = img.dataset.fallback;
  }
}
/* Ảnh tĩnh trong HTML có thể lỗi trước khi script chạy → kiểm tra lại một lần (bỏ qua ảnh lazy chưa tải) */
function checkBrokenImages(root = document) {
  $$('img[data-fallback]:not([loading="lazy"])', root).forEach((img) => {
    if (img.complete && img.naturalWidth === 0) useFallback(img);
  });
}

/** Hành động chung: thêm giỏ, yêu thích (event delegation) */
function initGlobalActions() {
  document.addEventListener('error', (e) => {
    if (e.target instanceof HTMLImageElement) useFallback(e.target);
  }, true);

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add-cart]');
    if (addBtn) {
      const product = getProduct(addBtn.dataset.addCart);
      if (product && Cart.add(product.id, 1)) {
        toast(`Đã thêm "${product.name}" vào giỏ hàng.`, 'success', { href: 'cart.html', label: 'Xem giỏ' });
        addBtn.classList.add('is-added');
        setTimeout(() => addBtn.classList.remove('is-added'), 900);
      }
      return;
    }

    const wishBtn = e.target.closest('[data-wish]');
    if (wishBtn) {
      const id = wishBtn.dataset.wish;
      const product = getProduct(id);
      const liked = Wishlist.toggle(id);
      $$(`[data-wish="${id}"]`).forEach((btn) => {
        btn.classList.toggle('is-active', liked);
        btn.setAttribute('aria-pressed', liked);
        btn.setAttribute('aria-label', `${liked ? 'Bỏ khỏi' : 'Thêm vào'} yêu thích: ${product.name}`);
      });
      toast(liked ? 'Đã thêm vào danh sách yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.', 'success', liked ? { href: 'wishlist.html', label: 'Xem' } : null);
    }
  });

  document.addEventListener('cart:change', updateBadges);
  document.addEventListener('wishlist:change', updateBadges);
  document.addEventListener('auth:change', renderHeader);

  // Đồng bộ khi mở nhiều tab
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE.cart) emit('cart:change');
    if (e.key === STORAGE.wishlist) emit('wishlist:change');
  });

  // Header thu gọn khi cuộn + nút lên đầu trang
  const onScroll = () => {
    const y = window.scrollY;
    $('#site-header')?.classList.toggle('is-scrolled', y > 10);
    const toTop = $('#back-to-top');
    if (toTop) toTop.hidden = y < 600;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/** Hiệu ứng xuất hiện khi cuộn */
function initReveal() {
  const items = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   6. TÌM KIẾM & MENU MOBILE
   ========================================================================== */
function searchProducts(query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return PRODUCTS.filter((p) => {
    const haystack = normalize(`${p.name} ${p.brand} ${categoryName(p.category)} ${p.short}`);
    return terms.every((t) => haystack.includes(t));
  });
}

/** Giữ focus bên trong hộp thoại khi dùng phím Tab */
function trapFocus(container, e) {
  if (e.key !== 'Tab') return;
  const focusable = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function initSearch() {
  const overlay = $('#search-overlay');
  const input = $('#search-input');
  const results = $('#search-results');
  if (!overlay) return;
  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    setTimeout(() => input.focus(), 50);
  };
  const close = () => {
    overlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { overlay.hidden = true; }, 250);
    lastFocus?.focus();
  };

  const render = (query) => {
    if (!query.trim()) { results.innerHTML = ''; return; }
    const found = searchProducts(query);
    if (!found.length) {
      results.innerHTML = `<p class="search-results__empty">Không tìm thấy sản phẩm phù hợp với “${escapeHTML(query)}”.</p>`;
      return;
    }
    results.innerHTML = `
      <ul class="search-results__list">
        ${found.slice(0, 6).map((p) => `
          <li>
            <a href="${productUrl(p)}" class="search-item">
              ${productImg(p, 0, 160)}
              <span class="search-item__info"><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.brand)} · ${categoryName(p.category)}</small></span>
              <span class="search-item__price">${formatVND(p.price)}</span>
            </a>
          </li>`).join('')}
      </ul>
      <a class="link-arrow search-results__all" href="products.html?q=${encodeURIComponent(query)}">Xem tất cả ${found.length} kết quả ${icon('arrow-right')}</a>`;
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-search]')) { e.preventDefault(); open(); }
    else if (e.target.closest('[data-close-search]') || e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
    if (!overlay.hidden) {
      if (e.key === 'Escape') close();
      trapFocus(overlay, e);
    }
  });
  input.addEventListener('input', debounce(() => render(input.value), 150));
}

function initMobileMenu() {
  const nav = $('#mobile-nav');
  if (!nav) return;
  const panel = $('.mobile-nav__panel', nav);
  const toggleBtn = () => $('.menu-toggle');

  const open = () => {
    nav.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => nav.classList.add('is-open'));
    toggleBtn()?.setAttribute('aria-expanded', 'true');
    setTimeout(() => $('a, button', panel)?.focus(), 50);
  };
  const close = () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    toggleBtn()?.setAttribute('aria-expanded', 'false');
    setTimeout(() => { nav.hidden = true; }, 300);
    toggleBtn()?.focus();
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('.menu-toggle')) open();
    else if (e.target.closest('[data-close-menu]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (nav.hidden) return;
    if (e.key === 'Escape') close();
    trapFocus(panel, e);
  });
  // Tự đóng khi chuyển lên màn hình lớn
  window.matchMedia('(min-width: 992px)').addEventListener('change', (mq) => {
    if (mq.matches && !nav.hidden) close();
  });
}

/* ==========================================================================
   7. KIỂM TRA BIỂU MẪU
   ========================================================================== */
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mỗi hàm trả về chuỗi lỗi, hoặc chuỗi rỗng nếu hợp lệ */
const validators = {
  email: (v) => (EMAIL_REGEX.test(v.trim()) ? '' : 'Email không hợp lệ (VD: ban@email.com).'),
  phone: (v) => (PHONE_REGEX.test(v.replace(/[\s.-]/g, '')) ? '' : 'Số điện thoại không hợp lệ (VD: 0912 345 678).'),
  password: (v) => (v.length >= 8 && /[a-zA-Z]/.test(v) && /\d/.test(v) ? '' : 'Mật khẩu tối thiểu 8 ký tự, gồm cả chữ và số.'),
  card: (v) => (luhnCheck(v.replace(/\s/g, '')) ? '' : 'Số thẻ không hợp lệ.'),
  expiry: (v) => {
    const match = v.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!match) return 'Định dạng MM/YY.';
    const expiry = new Date(2000 + Number(match[2]), Number(match[1]), 1);
    return expiry > new Date() ? '' : 'Thẻ đã hết hạn.';
  },
  cvv: (v) => (/^\d{3,4}$/.test(v) ? '' : 'CVV gồm 3 – 4 chữ số.'),
};

function luhnCheck(number) {
  if (!/^\d{13,19}$/.test(number)) return false;
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let digit = Number(number[i]);
    if (double) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function validateField(input) {
  const rules = (input.dataset.validate || '').split(' ').filter(Boolean);
  const value = input.type === 'checkbox' ? input.checked : input.value;
  const label = input.dataset.label || 'thông tin này';
  let message = '';

  for (const rule of rules) {
    if (rule === 'required') {
      if (input.type === 'checkbox' && !value) message = 'Vui lòng xác nhận để tiếp tục.';
      else if (input.type !== 'checkbox' && !String(value).trim()) message = `Vui lòng nhập ${label}.`;
    } else if (rule === 'phone-optional') {
      if (String(value).trim()) message = validators.phone(value);
    } else if (rule === 'match') {
      const target = $(input.dataset.match);
      if (target && value !== target.value) message = 'Mật khẩu xác nhận không khớp.';
    } else if (rule.startsWith('min:')) {
      const min = Number(rule.split(':')[1]);
      if (String(value).trim().length < min) message = `Vui lòng nhập ít nhất ${min} ký tự.`;
    } else if (validators[rule]) {
      message = validators[rule](String(value));
    }
    if (message) break;
  }

  const field = input.closest('.field');
  const errorEl = field?.querySelector('.field__error');
  field?.classList.toggle('has-error', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  if (errorEl) errorEl.textContent = message;
  return !message;
}

/** Kiểm tra toàn bộ form; bỏ qua trường nằm trong vùng ẩn */
function validateForm(form) {
  let firstInvalid = null;
  $$('[data-validate]', form).forEach((input) => {
    if (input.closest('[hidden]')) return;
    if (!validateField(input) && !firstInvalid) firstInvalid = input;
  });
  firstInvalid?.focus();
  return !firstInvalid;
}

/** Kiểm tra lại ngay khi người dùng sửa một trường đang báo lỗi */
function initLiveValidation(form) {
  const handler = (e) => {
    const input = e.target;
    if (input.matches('[data-validate]') && input.closest('.field')?.classList.contains('has-error')) validateField(input);
  };
  form.addEventListener('input', handler);
  form.addEventListener('change', handler);
  form.addEventListener('focusout', (e) => {
    const input = e.target;
    if (input.matches('[data-validate]') && input.type !== 'checkbox' && input.value.trim()) validateField(input);
  });
}

function initPasswordToggles(root = document) {
  $$('[data-toggle-password]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      btn.innerHTML = icon(show ? 'eye-off' : 'eye');
    });
  });
}

/* ==========================================================================
   8. THÀNH PHẦN TÓM TẮT ĐƠN HÀNG (dùng ở giỏ hàng & thanh toán)
   ========================================================================== */
function summaryRows(totals) {
  return `
    <dl class="summary-rows">
      <div><dt>Tạm tính</dt><dd>${formatVND(totals.subtotal)}</dd></div>
      ${totals.discount ? `<div class="is-discount"><dt>Giảm giá (${totals.coupon.code})</dt><dd>−${formatVND(totals.discount)}</dd></div>` : ''}
      <div><dt>Phí vận chuyển</dt><dd>${totals.shipping ? formatVND(totals.shipping) : 'Miễn phí'}</dd></div>
      <div class="summary-rows__total"><dt>Tổng cộng</dt><dd>${formatVND(totals.total)}<small>Đã bao gồm VAT</small></dd></div>
    </dl>`;
}

function couponBlock(totals) {
  return totals.coupon ? `
    <div class="coupon-applied">
      ${icon('gift')}<span><strong>${totals.coupon.code}</strong> – ${totals.coupon.label}</span>
      <button type="button" class="link-btn" data-remove-coupon>Gỡ</button>
    </div>` : `
    <div class="coupon-form">
      <label for="coupon-input" class="sr-only">Mã giảm giá</label>
      <input class="input" id="coupon-input" placeholder="Mã giảm giá" autocomplete="off" enterkeyhint="done">
      <button type="button" class="btn btn--outline" data-apply-coupon>Áp dụng</button>
    </div>
    <p class="coupon-hint">Thử: <button type="button" class="link-btn" data-fill-coupon="AURUM10">AURUM10</button>, <button type="button" class="link-btn" data-fill-coupon="GIAM500K">GIAM500K</button>, <button type="button" class="link-btn" data-fill-coupon="FREESHIP">FREESHIP</button></p>`;
}

/* Ô mã giảm giá dùng <div> (không dùng <form>) vì ở trang thanh toán nó nằm trong form đặt hàng */
function bindCouponEvents(root, onChange) {
  const applyCoupon = () => {
    const code = $('#coupon-input', root)?.value || '';
    if (!code.trim()) { toast('Vui lòng nhập mã giảm giá.', 'error'); return; }
    const result = Coupon.apply(code);
    toast(result.message, result.ok ? 'success' : 'error');
    if (result.ok) onChange();
  };
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'coupon-input') {
      e.preventDefault();
      applyCoupon();
    }
  });
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-apply-coupon]')) applyCoupon();
    if (e.target.closest('[data-remove-coupon]')) {
      Coupon.remove();
      toast('Đã gỡ mã giảm giá.');
      onChange();
    }
    const fill = e.target.closest('[data-fill-coupon]');
    if (fill) {
      const input = $('#coupon-input', root);
      input.value = fill.dataset.fillCoupon;
      input.focus();
    }
  });
}

/* ==========================================================================
   9. KHỞI ĐỘNG
   ========================================================================== */
/**
 * Mỗi trang có file riêng trong js/pages/ và tự đăng ký hàm khởi tạo:
 *   registerPage('home', initHome);
 * Trang được nhận diện qua <body data-page="...">.
 */
const PAGE_INIT = {};
const registerPage = (key, init) => { PAGE_INIT[key] = init; };

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  initGlobalActions();
  initSearch();
  initMobileMenu();
  PAGE_INIT[document.body.dataset.page]?.();
  hydrateIcons();
  initReveal();
  checkBrokenImages();
});
