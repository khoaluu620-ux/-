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
   8.  Các trang: Trang chủ, Danh sách, Chi tiết, Giỏ hàng, Thanh toán,
       Liên hệ, Đăng nhập/Đăng ký, Yêu thích
   9.  Khởi động
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

const SAMPLE_REVIEWS = [
  { name: 'Phạm Thu Hà', rating: 5, date: '2026-09-02', text: 'Sản phẩm chính hãng, đóng gói rất sang trọng. Nhân viên gọi xác nhận nhanh, giao đúng hẹn.' },
  { name: 'Đỗ Mạnh Hùng', rating: 5, date: '2026-08-18', text: 'Dùng được 2 tuần, hiệu năng và chất lượng hoàn thiện xuất sắc. Rất hài lòng với dịch vụ của Aurum.' },
  { name: 'Võ Ngọc Lan', rating: 4, date: '2026-07-27', text: 'Máy đẹp, giá tốt hơn nhiều nơi. Trừ 1 sao vì mình phải đợi thêm 1 ngày cho màu mình chọn.' },
  { name: 'Bùi Đức Long', rating: 5, date: '2026-07-11', text: 'Được hỗ trợ cài đặt và chuyển dữ liệu miễn phí tại showroom. Rất đáng tiền!' },
  { name: 'Hoàng Mai Phương', rating: 4, date: '2026-06-30', text: 'Thiết kế tinh tế, cầm rất chắc tay. Sẽ tiếp tục ủng hộ cửa hàng.' },
];

const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế',
  'Quảng Ninh', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình', 'Thanh Hoá', 'Nghệ An',
  'Hà Tĩnh', 'Quảng Trị', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hoà', 'Đắk Lắk',
  'Lâm Đồng', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Cà Mau',
  'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Tuyên Quang', 'Lạng Sơn', 'Cao Bằng',
  'Điện Biên', 'Lai Châu', 'Sơn La',
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
   8. CÁC TRANG
   ========================================================================== */

/* ---------- 8.1 Trang chủ ---------- */
function initHome() {
  const catGrid = $('#home-categories');
  if (catGrid) {
    catGrid.innerHTML = Object.entries(CATEGORIES).map(([key, c]) => {
      const count = PRODUCTS.filter((p) => p.category === key).length;
      return `
        <a href="products.html?cat=${key}" class="category-card" data-reveal>
          <img src="${unsplash(c.image, 500)}" alt="" loading="lazy" data-fallback="images/${key}.svg">
          <span class="category-card__content">
            <strong>${c.name}</strong>
            <small>${count} sản phẩm · ${c.desc}</small>
          </span>
          <span class="category-card__arrow">${icon('arrow-right')}</span>
        </a>`;
    }).join('');
  }

  const tabs = $$('[data-home-tab]');
  const grid = $('#home-products');
  const lists = {
    featured: PRODUCTS.filter((p) => p.featured),
    new: [...PRODUCTS].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    best: [...PRODUCTS].sort((a, b) => b.sold - a.sold),
  };
  const showTab = (key) => {
    tabs.forEach((t) => {
      const active = t.dataset.homeTab === key;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active);
    });
    renderProductGrid(grid, lists[key].slice(0, 8));
  };
  tabs.forEach((t) => t.addEventListener('click', () => showTab(t.dataset.homeTab)));
  if (grid) showTab('featured');

  const flash = [...PRODUCTS].filter((p) => p.stock > 0 && p.oldPrice)
    .sort((a, b) => discountPercent(b) - discountPercent(a)).slice(0, 4);
  renderProductGrid($('#flash-products'), flash);
  initCountdown();
}

function initCountdown() {
  const box = $('#countdown');
  if (!box) return;
  const parts = { h: $('[data-cd="h"]', box), m: $('[data-cd="m"]', box), s: $('[data-cd="s"]', box) };
  const tick = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const diff = Math.max(0, end - now);
    const pad = (n) => String(n).padStart(2, '0');
    parts.h.textContent = pad(Math.floor(diff / 3_600_000));
    parts.m.textContent = pad(Math.floor((diff % 3_600_000) / 60_000));
    parts.s.textContent = pad(Math.floor((diff % 60_000) / 1000));
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- 8.2 Danh sách sản phẩm: tìm kiếm, lọc, sắp xếp, phân trang ---------- */
const PRICE_RANGES = {
  '0-5': [0, 5], '5-15': [5, 15], '15-30': [15, 30], '30-': [30, Infinity],
};

const SORTERS = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.sold - a.sold,
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  best: (a, b) => b.sold - a.sold,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  discount: (a, b) => discountPercent(b) - discountPercent(a),
  rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  name: (a, b) => a.name.localeCompare(b.name, 'vi'),
};

function initProducts() {
  const form = $('#filter-form');
  const list = $('#product-list');
  const brands = [...new Set(PRODUCTS.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));

  // Đọc trạng thái từ URL để có thể chia sẻ đường dẫn bộ lọc
  const params = getParams();
  const splitParam = (key) => (params.get(key) ? params.get(key).split(',').filter(Boolean) : []);
  const state = {
    q: params.get('q') || '',
    cats: new Set(splitParam('cat').filter((c) => CATEGORIES[c])),
    brands: new Set(splitParam('brand')),
    price: params.get('price') || 'all',
    min: params.get('min') || '',
    max: params.get('max') || '',
    rating: Number(params.get('rating')) || 0,
    sale: params.get('sale') === '1',
    isNew: params.get('new') === '1',
    stock: params.get('stock') === '1',
    sort: SORTERS[params.get('sort')] ? params.get('sort') : 'featured',
    page: Math.max(1, Number(params.get('page')) || 1),
    view: params.get('view') || Store.get(STORAGE.view, 'grid'),
  };
  if (state.min || state.max) state.price = 'custom';
  if (state.price !== 'custom' && state.price !== 'all' && !PRICE_RANGES[state.price]) state.price = 'all';
  if (!['grid', 'list'].includes(state.view)) state.view = 'grid';

  // Render nhóm checkbox danh mục & thương hiệu
  $('#filter-categories').innerHTML = Object.entries(CATEGORIES).map(([key, c]) => `
    <label class="check"><input type="checkbox" name="cat" value="${key}"><span>${c.name}</span><em>${PRODUCTS.filter((p) => p.category === key).length}</em></label>`).join('');
  $('#filter-brands').innerHTML = brands.map((b) => `
    <label class="check"><input type="checkbox" name="brand" value="${escapeHTML(b)}"><span>${escapeHTML(b)}</span></label>`).join('');

  // Đồng bộ trạng thái → form
  const syncForm = () => {
    form.q.value = state.q;
    $$('input[name="cat"]', form).forEach((i) => { i.checked = state.cats.has(i.value); });
    $$('input[name="brand"]', form).forEach((i) => { i.checked = state.brands.has(i.value); });
    $$('input[name="price"]', form).forEach((i) => { i.checked = i.value === state.price; });
    form.min.value = state.min;
    form.max.value = state.max;
    $$('input[name="rating"]', form).forEach((i) => { i.checked = Number(i.value) === state.rating; });
    form.sale.checked = state.sale;
    form.new.checked = state.isNew;
    form.stock.checked = state.stock;
    $('#sort-select').value = state.sort;
  };

  // Đọc form → trạng thái
  const readForm = () => {
    state.q = form.q.value.trim();
    state.cats = new Set($$('input[name="cat"]:checked', form).map((i) => i.value));
    state.brands = new Set($$('input[name="brand"]:checked', form).map((i) => i.value));
    state.price = form.querySelector('input[name="price"]:checked')?.value || 'all';
    state.min = form.min.value;
    state.max = form.max.value;
    state.rating = Number(form.querySelector('input[name="rating"]:checked')?.value || 0);
    state.sale = form.sale.checked;
    state.isNew = form.new.checked;
    state.stock = form.stock.checked;
  };

  const filterProducts = () => {
    let result = state.q ? searchProducts(state.q) : [...PRODUCTS];
    if (state.cats.size) result = result.filter((p) => state.cats.has(p.category));
    if (state.brands.size) result = result.filter((p) => state.brands.has(p.brand));

    let range = null;
    if (state.price === 'custom') {
      const min = parseFloat(state.min);
      const max = parseFloat(state.max);
      range = [Number.isFinite(min) ? min : 0, Number.isFinite(max) ? max : Infinity];
    } else if (PRICE_RANGES[state.price]) {
      range = PRICE_RANGES[state.price];
    }
    if (range) result = result.filter((p) => p.price >= range[0] * 1e6 && p.price <= range[1] * 1e6);

    if (state.rating) result = result.filter((p) => p.rating >= state.rating);
    if (state.sale) result = result.filter((p) => p.oldPrice);
    if (state.isNew) result = result.filter((p) => p.isNew);
    if (state.stock) result = result.filter((p) => p.stock > 0);
    return result.sort(SORTERS[state.sort]);
  };

  const syncURL = () => {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.cats.size) p.set('cat', [...state.cats].join(','));
    if (state.brands.size) p.set('brand', [...state.brands].join(','));
    if (state.price !== 'all' && state.price !== 'custom') p.set('price', state.price);
    if (state.price === 'custom') {
      if (state.min) p.set('min', state.min);
      if (state.max) p.set('max', state.max);
    }
    if (state.rating) p.set('rating', state.rating);
    if (state.sale) p.set('sale', '1');
    if (state.isNew) p.set('new', '1');
    if (state.stock) p.set('stock', '1');
    if (state.sort !== 'featured') p.set('sort', state.sort);
    if (state.page > 1) p.set('page', state.page);
    const query = p.toString();
    history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  // Các "chip" bộ lọc đang áp dụng – bấm để xoá nhanh
  const activeChips = () => {
    const chips = [];
    if (state.q) chips.push({ type: 'q', label: `“${state.q}”` });
    state.cats.forEach((c) => chips.push({ type: 'cat', value: c, label: categoryName(c) }));
    state.brands.forEach((b) => chips.push({ type: 'brand', value: b, label: b }));
    if (state.price === 'custom' && (state.min || state.max)) chips.push({ type: 'price', label: `${state.min || 0} – ${state.max || '∞'} triệu` });
    else if (state.price !== 'all' && state.price !== 'custom') chips.push({ type: 'price', label: $(`input[name="price"][value="${state.price}"]`, form).nextElementSibling.textContent });
    if (state.rating) chips.push({ type: 'rating', label: `Từ ${String(state.rating).replace('.', ',')} sao` });
    if (state.sale) chips.push({ type: 'sale', label: 'Đang giảm giá' });
    if (state.isNew) chips.push({ type: 'new', label: 'Hàng mới' });
    if (state.stock) chips.push({ type: 'stock', label: 'Còn hàng' });
    return chips;
  };

  const updateHeading = () => {
    const title = $('#listing-title');
    const desc = $('#listing-desc');
    if (state.q) {
      title.textContent = `Kết quả cho “${state.q}”`;
      desc.textContent = 'Tìm kiếm không phân biệt dấu – thử “dien thoai” hoặc “tai nghe”.';
    } else if (state.cats.size === 1) {
      const key = [...state.cats][0];
      title.textContent = categoryName(key);
      desc.textContent = `${CATEGORIES[key].desc} – chính hãng 100%, bảo hành tận tâm.`;
    } else {
      title.textContent = 'Tất cả sản phẩm';
      desc.textContent = 'Tuyển chọn thiết bị công nghệ cao cấp, chính hãng 100%.';
    }
    document.title = `${title.textContent} | Aurum Tech`;
  };

  const renderPagination = (totalPages) => {
    const nav = $('#pagination');
    if (totalPages <= 1) { nav.innerHTML = ''; return; }
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    nav.innerHTML = `
      <button type="button" class="page-btn" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="Trang trước">${icon('chevron-left')}</button>
      ${pages.map((n) => `<button type="button" class="page-btn ${n === state.page ? 'is-active' : ''}" data-page="${n}" ${n === state.page ? 'aria-current="page"' : ''} aria-label="Trang ${n}">${n}</button>`).join('')}
      <button type="button" class="page-btn" data-page="${state.page + 1}" ${state.page === totalPages ? 'disabled' : ''} aria-label="Trang sau">${icon('chevron-right')}</button>`;
  };

  const render = () => {
    const result = filterProducts();
    const totalPages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
    state.page = clamp(state.page, 1, totalPages);
    const pageItems = result.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    list.classList.toggle('is-list', state.view === 'list');
    $$('[data-view]').forEach((btn) => {
      const active = btn.dataset.view === state.view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active);
    });

    if (!result.length) {
      list.innerHTML = `<div class="grid-full">${emptyState({ iconName: 'search', title: 'Không tìm thấy sản phẩm phù hợp', text: 'Hãy thử bỏ bớt bộ lọc hoặc dùng từ khoá khác.', href: 'products.html', cta: 'Xem tất cả sản phẩm' })}</div>`;
    } else {
      renderProductGrid(list, pageItems);
    }

    const from = result.length ? (state.page - 1) * PAGE_SIZE + 1 : 0;
    const to = Math.min(state.page * PAGE_SIZE, result.length);
    $('#result-count').innerHTML = result.length
      ? `Hiển thị <strong>${from}–${to}</strong> trong <strong>${result.length}</strong> sản phẩm`
      : 'Không có sản phẩm';

    const chips = activeChips();
    $('#active-filters').innerHTML = chips.length ? `
      ${chips.map((c) => `<button type="button" class="chip chip--removable" data-remove-filter="${c.type}" data-value="${escapeHTML(c.value || '')}" aria-label="Bỏ lọc ${escapeHTML(c.label)}">${escapeHTML(c.label)} ${icon('close')}</button>`).join('')}
      <button type="button" class="link-btn" data-clear-filters>Xoá tất cả</button>` : '';
    const countEl = $('#filter-count');
    countEl.textContent = chips.length;
    countEl.hidden = chips.length === 0;

    renderPagination(totalPages);
    updateHeading();
    syncURL();
  };

  const resetState = () => {
    Object.assign(state, {
      q: '', cats: new Set(), brands: new Set(), price: 'all', min: '', max: '',
      rating: 0, sale: false, isNew: false, stock: false, page: 1,
    });
  };

  // Sự kiện
  form.addEventListener('change', (e) => {
    if (e.target.name === 'min' || e.target.name === 'max') {
      form.querySelector('input[name="price"][value="custom"]').checked = true;
    }
    if (e.target.name === 'price' && e.target.value !== 'custom') {
      form.min.value = '';
      form.max.value = '';
    }
    readForm();
    state.page = 1;
    render();
  });
  form.q.addEventListener('input', debounce(() => { readForm(); state.page = 1; render(); }, 250));
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('reset', (e) => {
    e.preventDefault();
    resetState();
    syncForm();
    render();
  });

  $('#sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.page = 1;
    render();
  });

  $$('[data-view]').forEach((btn) => btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    Store.set(STORAGE.view, state.view);
    render();
  }));

  $('#pagination').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (!btn || btn.disabled) return;
    state.page = Number(btn.dataset.page);
    render();
    $('.toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#active-filters').addEventListener('click', (e) => {
    if (e.target.closest('[data-clear-filters]')) {
      resetState();
    } else {
      const chip = e.target.closest('[data-remove-filter]');
      if (!chip) return;
      const { removeFilter: type, value } = chip.dataset;
      if (type === 'q') state.q = '';
      if (type === 'cat') state.cats.delete(value);
      if (type === 'brand') state.brands.delete(value);
      if (type === 'price') { state.price = 'all'; state.min = ''; state.max = ''; }
      if (type === 'rating') state.rating = 0;
      if (type === 'sale') state.sale = false;
      if (type === 'new') state.isNew = false;
      if (type === 'stock') state.stock = false;
      state.page = 1;
    }
    syncForm();
    render();
  });

  // Bộ lọc dạng ngăn kéo trên mobile/tablet
  const filters = $('#filters');
  const openBtn = $('[data-open-filters]');
  const setFiltersOpen = (open) => {
    filters.classList.toggle('is-open', open);
    document.body.classList.toggle('filters-open', open);
    document.body.classList.toggle('no-scroll', open);
    openBtn.setAttribute('aria-expanded', open);
    if (open) $('.filters__close', filters).focus();
    else openBtn.focus();
  };
  openBtn.addEventListener('click', () => setFiltersOpen(true));
  $$('[data-close-filters]').forEach((el) => el.addEventListener('click', () => setFiltersOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && filters.classList.contains('is-open')) setFiltersOpen(false);
  });

  syncForm();
  render();
}

/* ---------- 8.3 Chi tiết sản phẩm ---------- */
function initProductDetail() {
  const root = $('#product-detail');
  const product = getProduct(getParams().get('id'));

  if (!product) {
    root.innerHTML = emptyState({ iconName: 'search', title: 'Không tìm thấy sản phẩm', text: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.', cta: 'Quay lại cửa hàng' });
    $('#related-section')?.remove();
    return;
  }

  const p = product;
  const state = { color: p.colors[0]?.name || '', variant: p.variants[0]?.label || '', qty: 1 };
  const maxQty = Math.min(p.stock, MAX_QTY_PER_ITEM);
  const off = discountPercent(p);
  const outOfStock = p.stock <= 0;
  document.title = `${p.name} | Aurum Tech`;
  $('meta[name="description"]')?.setAttribute('content', p.short);

  const stockText = outOfStock ? 'Tạm hết hàng – liên hệ để đặt trước'
    : p.stock <= 5 ? `Chỉ còn ${p.stock} sản phẩm` : 'Còn hàng – sẵn sàng giao ngay';
  const reviews = () => [...Store.get(STORAGE.reviews, {})[p.id] || [], ...SAMPLE_REVIEWS.slice(0, 3 + (p.id.length % 3))];

  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="index.html">Trang chủ</a></li>
        <li><a href="products.html">Sản phẩm</a></li>
        <li><a href="products.html?cat=${p.category}">${categoryName(p.category)}</a></li>
        <li aria-current="page">${escapeHTML(p.name)}</li>
      </ol>
    </nav>

    <div class="pd">
      <div class="pd__gallery">
        <div class="pd__main" id="pd-main">
          ${productImg(p, 0, 1100, 'id="pd-main-img" loading="eager"')}
          <div class="product-card__badges">
            ${p.isNew ? '<span class="tag tag--new">Mới</span>' : ''}
            ${off ? `<span class="tag tag--sale">-${off}%</span>` : ''}
          </div>
        </div>
        <div class="pd__thumbs" role="group" aria-label="Ảnh sản phẩm">
          ${p.images.map((_, i) => `<button type="button" class="pd__thumb ${i === 0 ? 'is-active' : ''}" data-thumb="${i}" aria-label="Xem ảnh ${i + 1}" aria-pressed="${i === 0}">${productImg(p, i, 200)}</button>`).join('')}
        </div>
      </div>

      <div class="pd__info">
        <p class="eyebrow">${escapeHTML(p.brand)} · ${categoryName(p.category)}</p>
        <h1 class="pd__title">${escapeHTML(p.name)}</h1>
        <div class="pd__meta">
          <a href="#tab-reviews" class="rating" data-goto-reviews>${starsHTML(p.rating)}<span>${String(p.rating).replace('.', ',')} · ${formatNumber(p.reviews)} đánh giá</span></a>
          <span>Đã bán ${formatNumber(p.sold)}</span>
          <span>Mã: ${p.id.toUpperCase()}</span>
        </div>

        <div class="pd__price" id="pd-price" aria-live="polite"></div>
        <p class="pd__short">${escapeHTML(p.short)}</p>

        ${p.colors.length ? `
          <div class="option-group">
            <p class="option-group__label" id="color-label">Màu sắc: <strong id="pd-color-name">${escapeHTML(state.color)}</strong></p>
            <div class="swatches" role="radiogroup" aria-labelledby="color-label">
              ${p.colors.map((c, i) => `<button type="button" class="swatch ${i === 0 ? 'is-active' : ''}" role="radio" aria-checked="${i === 0}" data-color="${escapeHTML(c.name)}" style="--swatch:${c.hex}" aria-label="${escapeHTML(c.name)}" title="${escapeHTML(c.name)}"></button>`).join('')}
            </div>
          </div>` : ''}

        ${p.variants.length > 1 ? `
          <div class="option-group">
            <p class="option-group__label" id="variant-label">Phiên bản</p>
            <div class="variants" role="radiogroup" aria-labelledby="variant-label">
              ${p.variants.map((v, i) => `<button type="button" class="variant ${i === 0 ? 'is-active' : ''}" role="radio" aria-checked="${i === 0}" data-variant="${escapeHTML(v.label)}"><span>${escapeHTML(v.label)}</span><small>${formatVND(p.price + v.add)}</small></button>`).join('')}
            </div>
          </div>` : ''}

        <p class="stock ${outOfStock ? 'stock--out' : p.stock <= 5 ? 'stock--low' : ''}">${icon(outOfStock ? 'alert' : 'check')} ${stockText}</p>

        <div class="pd__actions">
          <div class="qty" role="group" aria-label="Số lượng">
            <button type="button" data-qty="-1" aria-label="Giảm số lượng" ${outOfStock ? 'disabled' : ''}>${icon('minus')}</button>
            <input type="number" id="pd-qty" value="1" min="1" max="${Math.max(1, maxQty)}" aria-label="Số lượng" ${outOfStock ? 'disabled' : ''}>
            <button type="button" data-qty="1" aria-label="Tăng số lượng" ${outOfStock ? 'disabled' : ''}>${icon('plus')}</button>
          </div>
          <button type="button" class="btn btn--gold btn--lg pd__add" id="pd-add" ${outOfStock ? 'disabled' : ''}>${icon('bag')} Thêm vào giỏ</button>
          <button type="button" class="icon-btn icon-btn--bordered wish-btn ${Wishlist.has(p.id) ? 'is-active' : ''}" data-wish="${p.id}" aria-pressed="${Wishlist.has(p.id)}" aria-label="${Wishlist.has(p.id) ? 'Bỏ khỏi' : 'Thêm vào'} yêu thích: ${escapeHTML(p.name)}">${icon('heart')}</button>
        </div>
        <button type="button" class="btn btn--outline btn--lg btn--block" id="pd-buy" ${outOfStock ? 'disabled' : ''}>Mua ngay</button>

        <ul class="perks">
          <li>${icon('truck')}<span><strong>Giao nhanh 2 giờ</strong> nội thành HN &amp; TP.HCM</span></li>
          <li>${icon('shield')}<span><strong>Bảo hành ${p.warranty}</strong> chính hãng</span></li>
          <li>${icon('refresh')}<span><strong>1 đổi 1</strong> trong 30 ngày nếu lỗi</span></li>
          <li>${icon('card')}<span><strong>Trả góp 0%</strong> (mô phỏng)</span></li>
        </ul>
      </div>
    </div>

    <section class="pd-tabs" aria-label="Thông tin chi tiết">
      <div class="tabs" role="tablist">
        <button type="button" class="tab is-active" role="tab" id="tab-desc" aria-controls="panel-desc" aria-selected="true">Mô tả</button>
        <button type="button" class="tab" role="tab" id="tab-specs" aria-controls="panel-specs" aria-selected="false" tabindex="-1">Thông số kỹ thuật</button>
        <button type="button" class="tab" role="tab" id="tab-reviews" aria-controls="panel-reviews" aria-selected="false" tabindex="-1">Đánh giá (<span id="review-count">${reviews().length}</span>)</button>
      </div>
      <div class="tab-panel" id="panel-desc" role="tabpanel" aria-labelledby="tab-desc" tabindex="0">
        <div class="prose">${p.description.split('\n').map((para) => `<p>${escapeHTML(para)}</p>`).join('')}</div>
      </div>
      <div class="tab-panel" id="panel-specs" role="tabpanel" aria-labelledby="tab-specs" tabindex="0" hidden>
        <table class="spec-table">
          <caption class="sr-only">Thông số kỹ thuật ${escapeHTML(p.name)}</caption>
          <tbody>
            <tr><th scope="row">Thương hiệu</th><td>${escapeHTML(p.brand)}</td></tr>
            ${Object.entries(p.specs).map(([k, v]) => `<tr><th scope="row">${escapeHTML(k)}</th><td>${escapeHTML(v)}</td></tr>`).join('')}
            <tr><th scope="row">Bảo hành</th><td>${p.warranty}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="tab-panel" id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews" tabindex="0" hidden>
        <div class="reviews">
          <div class="reviews__summary">
            <strong>${String(p.rating).replace('.', ',')}</strong>
            ${starsHTML(p.rating)}
            <span>${formatNumber(p.reviews)} lượt đánh giá</span>
          </div>
          <ul class="reviews__list" id="review-list"></ul>
          <form class="review-form" id="review-form" novalidate>
            <h3>Viết đánh giá của bạn</h3>
            <fieldset class="star-input">
              <legend>Chấm điểm</legend>
              ${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="star-${n}" value="${n}" ${n === 5 ? 'checked' : ''}><label for="star-${n}" title="${n} sao"><span class="sr-only">${n} sao</span>★</label>`).join('')}
            </fieldset>
            <div class="field">
              <label for="rv-name">Tên của bạn</label>
              <input class="input" id="rv-name" name="name" type="text" data-validate="required" data-label="tên" value="${escapeHTML(Auth.current()?.name || '')}">
              <p class="field__error"></p>
            </div>
            <div class="field">
              <label for="rv-text">Nhận xét</label>
              <textarea class="input" id="rv-text" name="text" rows="3" data-validate="required min:10" data-label="nhận xét"></textarea>
              <p class="field__error"></p>
            </div>
            <button type="submit" class="btn btn--gold">Gửi đánh giá</button>
          </form>
        </div>
      </div>
    </section>`;

  // Giá theo phiên bản
  const renderPrice = () => {
    const unit = unitPrice(p, state.variant);
    const variantAdd = unit - p.price;
    $('#pd-price').innerHTML = `
      <strong>${formatVND(unit)}</strong>
      ${p.oldPrice ? `<del>${formatVND(p.oldPrice + variantAdd)}</del><span class="tag tag--sale">Tiết kiệm ${formatVND(p.oldPrice - p.price)}</span>` : ''}`;
  };
  renderPrice();

  // Thư viện ảnh
  const mainImg = $('#pd-main-img');
  $$('[data-thumb]', root).forEach((btn) => btn.addEventListener('click', () => {
    const index = Number(btn.dataset.thumb);
    mainImg.dataset.failed = '';
    mainImg.src = unsplash(p.images[index], 1100);
    $$('[data-thumb]', root).forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
  }));

  // Phóng to ảnh khi rê chuột (desktop)
  const main = $('#pd-main');
  main.addEventListener('mousemove', (e) => {
    const rect = main.getBoundingClientRect();
    mainImg.style.transformOrigin = `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`;
    main.classList.add('is-zoom');
  });
  main.addEventListener('mouseleave', () => main.classList.remove('is-zoom'));

  // Chọn màu / phiên bản (radio tuỳ biến)
  const selectRadio = (group, btn) => {
    $$('[role="radio"]', group).forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-checked', b === btn);
    });
  };
  root.addEventListener('click', (e) => {
    const swatch = e.target.closest('[data-color]');
    if (swatch) {
      state.color = swatch.dataset.color;
      $('#pd-color-name').textContent = state.color;
      selectRadio(swatch.parentElement, swatch);
    }
    const variant = e.target.closest('[data-variant]');
    if (variant) {
      state.variant = variant.dataset.variant;
      selectRadio(variant.parentElement, variant);
      renderPrice();
    }
    const step = e.target.closest('[data-qty]');
    if (step) {
      const input = $('#pd-qty');
      input.value = clamp(Number(input.value) + Number(step.dataset.qty), 1, Math.max(1, maxQty));
    }
    if (e.target.closest('[data-goto-reviews]')) {
      e.preventDefault();
      activateTab($('#tab-reviews'));
      $('.pd-tabs').scrollIntoView({ behavior: 'smooth' });
    }
  });
  $('#pd-qty')?.addEventListener('change', (e) => {
    e.target.value = clamp(Math.floor(Number(e.target.value)) || 1, 1, Math.max(1, maxQty));
  });

  const addCurrent = () => Cart.add(p.id, Number($('#pd-qty').value) || 1, { color: state.color, variant: state.variant });
  $('#pd-add').addEventListener('click', () => {
    if (addCurrent()) toast(`Đã thêm "${p.name}" vào giỏ hàng.`, 'success', { href: 'cart.html', label: 'Xem giỏ' });
  });
  $('#pd-buy').addEventListener('click', () => {
    if (addCurrent()) window.location.href = 'checkout.html';
  });

  // Tabs có hỗ trợ phím mũi tên
  const tabs = $$('[role="tab"]', root);
  const activateTab = (tab) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active);
      t.tabIndex = active ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !active;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      activateTab(next);
      next.focus();
    });
  });

  // Đánh giá
  const renderReviews = () => {
    const all = reviews();
    $('#review-count').textContent = all.length;
    $('#review-list').innerHTML = all.map((r) => `
      <li class="review">
        <div class="review__head">
          <span class="review__avatar" aria-hidden="true">${escapeHTML(r.name.trim().charAt(0).toUpperCase())}</span>
          <div><strong>${escapeHTML(r.name)}</strong><small>${new Date(r.date).toLocaleDateString('vi-VN')}${r.mine ? ' · Đánh giá của bạn' : ' · Đã mua hàng'}</small></div>
          ${starsHTML(r.rating, 'stars--sm')}
        </div>
        <p>${escapeHTML(r.text)}</p>
      </li>`).join('');
  };
  renderReviews();

  const reviewForm = $('#review-form');
  initLiveValidation(reviewForm);
  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(reviewForm)) return;
    const all = Store.get(STORAGE.reviews, {});
    const entry = {
      name: reviewForm.name.value.trim(),
      rating: Number(reviewForm.rating.value),
      text: reviewForm.text.value.trim(),
      date: new Date().toISOString(),
      mine: true,
    };
    all[p.id] = [entry, ...(all[p.id] || [])];
    Store.set(STORAGE.reviews, all);
    reviewForm.text.value = '';
    renderReviews();
    toast('Cảm ơn bạn đã đánh giá! (lưu cục bộ trên trình duyệt)');
  });

  // Sản phẩm liên quan: cùng danh mục, sau đó cùng thương hiệu
  const related = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category)
    .concat(PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category && x.brand === p.brand))
    .slice(0, 4);
  renderProductGrid($('#related-products'), related);
}

/* ---------- 8.4 Giỏ hàng ---------- */
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

function initCart() {
  const root = $('#cart-root');

  const render = () => {
    const lines = Cart.lines();
    if (!lines.length) {
      root.innerHTML = emptyState({ title: 'Giỏ hàng của bạn đang trống', text: 'Khám phá những sản phẩm công nghệ cao cấp và thêm vào giỏ nhé.' });
      return;
    }
    const totals = calcTotals('standard');
    const remain = FREE_SHIP_THRESHOLD - totals.subtotal;
    const progress = clamp((totals.subtotal / FREE_SHIP_THRESHOLD) * 100, 0, 100);

    root.innerHTML = `
      <div class="cart-layout">
        <section class="cart" aria-label="Sản phẩm trong giỏ hàng">
          <div class="cart__head" aria-hidden="true">
            <span>Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Thành tiền</span><span></span>
          </div>
          <ul class="cart__list">
            ${lines.map((l) => {
              const max = Math.min(l.product.stock, MAX_QTY_PER_ITEM);
              return `
              <li class="cart-item" data-key="${escapeHTML(l.key)}">
                <a href="${productUrl(l.product)}" class="cart-item__img">${productImg(l.product, 0, 240)}</a>
                <div class="cart-item__info">
                  <a href="${productUrl(l.product)}" class="cart-item__name">${escapeHTML(l.product.name)}</a>
                  <p class="cart-item__opts">${[l.color, l.variant].filter(Boolean).map(escapeHTML).join(' · ')}</p>
                  <p class="cart-item__unit-mobile">${formatVND(l.unit)}</p>
                </div>
                <div class="cart-item__price">${formatVND(l.unit)}</div>
                <div class="qty qty--sm" role="group" aria-label="Số lượng ${escapeHTML(l.product.name)}">
                  <button type="button" data-cart-step="-1" aria-label="Giảm" ${l.qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
                  <input type="number" value="${l.qty}" min="1" max="${max}" data-cart-input aria-label="Số lượng">
                  <button type="button" data-cart-step="1" aria-label="Tăng" ${l.qty >= max ? 'disabled' : ''}>${icon('plus')}</button>
                </div>
                <div class="cart-item__total">${formatVND(l.total)}</div>
                <button type="button" class="icon-btn cart-item__remove" data-cart-remove aria-label="Xoá ${escapeHTML(l.product.name)} khỏi giỏ">${icon('trash')}</button>
              </li>`;
            }).join('')}
          </ul>
          <div class="cart__actions">
            <a href="products.html" class="btn btn--ghost">${icon('chevron-left')} Tiếp tục mua sắm</a>
            <button type="button" class="btn btn--ghost" data-cart-clear>${icon('trash')} Xoá tất cả</button>
          </div>
        </section>

        <aside class="summary-card" aria-label="Tóm tắt đơn hàng">
          <h2 class="summary-card__title">Tóm tắt đơn hàng</h2>
          <div class="freeship">
            <p>${remain > 0 ? `Mua thêm <strong>${formatVND(remain)}</strong> để được miễn phí giao hàng` : `${icon('check')} Đơn hàng được <strong>miễn phí giao hàng</strong>`}</p>
            <div class="freeship__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}" aria-label="Tiến độ miễn phí giao hàng"><span style="width:${progress}%"></span></div>
          </div>
          ${couponBlock(totals)}
          ${summaryRows(totals)}
          <a href="checkout.html" class="btn btn--gold btn--lg btn--block">Tiến hành thanh toán ${icon('arrow-right')}</a>
          <p class="summary-card__note">${icon('lock')} Thanh toán mô phỏng – không phát sinh giao dịch thật.</p>
        </aside>
      </div>`;
  };

  root.addEventListener('click', (e) => {
    const item = e.target.closest('[data-key]');
    const clearBtn = e.target.closest('[data-cart-clear]');
    if (clearBtn) {
      if (confirmOnButton(clearBtn, 'Bấm lần nữa để xoá hết')) {
        Cart.clear();
        toast('Đã xoá toàn bộ giỏ hàng.');
      }
      return;
    }
    if (!item) return;
    const key = item.dataset.key;
    if (e.target.closest('[data-cart-remove]')) {
      Cart.remove(key);
      toast('Đã xoá sản phẩm khỏi giỏ hàng.');
    }
    const step = e.target.closest('[data-cart-step]');
    if (step) {
      const current = Cart.items().find((i) => i.key === key)?.qty || 1;
      Cart.setQty(key, current + Number(step.dataset.cartStep));
    }
  });
  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-cart-input]')) Cart.setQty(e.target.closest('[data-key]').dataset.key, e.target.value);
  });
  bindCouponEvents(root, render);
  document.addEventListener('cart:change', render);
  render();
}

/* ---------- 8.5 Thanh toán (mô phỏng) ---------- */
function initCheckout() {
  const root = $('#checkout-root');
  const form = $('#checkout-form');
  const summary = $('#checkout-summary');

  if (!Cart.items().length) {
    root.innerHTML = emptyState({ title: 'Chưa có sản phẩm để thanh toán', text: 'Giỏ hàng của bạn đang trống. Hãy chọn sản phẩm trước khi thanh toán.' });
    return;
  }

  // Danh sách tỉnh/thành
  form.province.insertAdjacentHTML('beforeend', PROVINCES.map((p) => `<option>${p}</option>`).join(''));

  // Điền sẵn thông tin nếu đã đăng nhập
  const user = Auth.current();
  if (user) {
    form.name.value = user.name;
    form.email.value = user.email;
    form.phone.value = user.phone || '';
  }

  const shippingMethod = () => form.querySelector('input[name="shipping"]:checked').value;

  const renderSummary = () => {
    const totals = calcTotals(shippingMethod());
    const standard = calcTotals('standard').shipping;
    $('#ship-standard-fee').textContent = standard ? formatVND(standard) : 'Miễn phí';
    $('#ship-express-fee').textContent = totals.coupon?.freeShip ? 'Miễn phí' : formatVND(SHIPPING_FEES.express);

    summary.innerHTML = `
      <h2 class="summary-card__title">Đơn hàng (${Cart.count()} sản phẩm)</h2>
      <ul class="mini-cart">
        ${Cart.lines().map((l) => `
          <li>
            <span class="mini-cart__img">${productImg(l.product, 0, 160)}<em>${l.qty}</em></span>
            <span class="mini-cart__info"><strong>${escapeHTML(l.product.name)}</strong><small>${[l.color, l.variant].filter(Boolean).map(escapeHTML).join(' · ')}</small></span>
            <span class="mini-cart__price">${formatVND(l.total)}</span>
          </li>`).join('')}
      </ul>
      ${couponBlock(totals)}
      ${summaryRows(totals)}`;
  };

  // Ẩn/hiện khối thông tin theo phương thức thanh toán
  const togglePaymentPanels = () => {
    const method = form.querySelector('input[name="payment"]:checked').value;
    $$('[data-payment-panel]', form).forEach((panel) => { panel.hidden = panel.dataset.paymentPanel !== method; });
  };

  // Định dạng số thẻ "4242 4242 4242 4242" và hạn "MM/YY"
  form.card.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  form.exp.addEventListener('input', (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  });
  form.cvv.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });

  form.addEventListener('change', (e) => {
    if (e.target.name === 'shipping') renderSummary();
    if (e.target.name === 'payment') togglePaymentPanels();
  });
  bindCouponEvents(summary, renderSummary);
  initLiveValidation(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(form)) {
      toast('Vui lòng kiểm tra lại các thông tin còn thiếu.', 'error');
      return;
    }
    const submitBtn = $('#place-order');
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    $('.btn__label', submitBtn).textContent = 'Đang xử lý…';

    // Giả lập thời gian xử lý của cổng thanh toán
    setTimeout(() => {
      const method = shippingMethod();
      const totals = calcTotals(method);
      const payment = form.querySelector('input[name="payment"]:checked').value;
      const paymentLabels = { cod: 'Thanh toán khi nhận hàng', bank: 'Chuyển khoản (mô phỏng)', card: 'Thẻ tín dụng (mô phỏng)', wallet: 'Ví điện tử (mô phỏng)' };
      const order = {
        code: `AT${Date.now().toString().slice(-8)}`,
        createdAt: new Date().toISOString(),
        status: payment === 'cod' ? 'Chờ xác nhận' : 'Đã thanh toán (mô phỏng)',
        customer: {
          name: form.name.value.trim(),
          phone: form.phone.value.trim(),
          email: form.email.value.trim().toLowerCase(),
          address: `${form.address.value.trim()}, ${form.ward.value.trim()}, ${form.province.value}`,
          note: form.note.value.trim(),
        },
        shipping: method,
        payment: paymentLabels[payment],
        items: Cart.lines().map((l) => ({ id: l.id, name: l.product.name, color: l.color, variant: l.variant, qty: l.qty, unit: l.unit })),
        totals: { subtotal: totals.subtotal, discount: totals.discount, shipping: totals.shipping, total: totals.total, coupon: totals.coupon?.code || null },
      };
      // Không lưu dữ liệu thẻ dưới bất kỳ hình thức nào
      Store.set(STORAGE.orders, [order, ...Store.get(STORAGE.orders, [])]);
      Cart.clear();
      Coupon.remove();
      root.innerHTML = emptyState({
        iconName: 'check',
        title: `Đơn hàng #${order.code} đã được ghi nhận`,
        text: 'Đây là đơn hàng mô phỏng, được lưu trong trình duyệt. Bạn có thể xem lại trong trang Tài khoản (nếu đặt bằng email đã đăng ký).',
        cta: 'Tiếp tục mua sắm',
      });
      showOrderModal(order);
    }, 1500);
  });

  togglePaymentPanels();
  renderSummary();
}

function showOrderModal(order) {
  const modal = $('#order-modal');
  $('#order-modal-text').textContent = `Cảm ơn ${order.customer.name}! Đơn hàng mô phỏng của bạn đã được ghi nhận. Ở phiên bản thật, email xác nhận sẽ được gửi tới ${order.customer.email}.`;
  $('#order-modal-details').innerHTML = `
    <div><dt>Mã đơn hàng</dt><dd>${order.code}</dd></div>
    <div><dt>Tổng thanh toán</dt><dd>${formatVND(order.totals.total)}</dd></div>
    <div><dt>Thanh toán</dt><dd>${escapeHTML(order.payment)}</dd></div>
    <div><dt>Giao hàng</dt><dd>${order.shipping === 'express' ? 'Hoả tốc 2 giờ' : 'Tiêu chuẩn 2 – 4 ngày'}</dd></div>`;
  $$('.steps li').forEach((li, i) => {
    li.classList.toggle('is-done', i < 2);
    li.classList.toggle('is-active', i === 2);
  });
  if (typeof modal.showModal === 'function') modal.showModal();
  else modal.setAttribute('open', '');
  window.scrollTo({ top: 0 });
}

/* ---------- 8.6 Liên hệ ---------- */
function initContact() {
  const form = $('#contact-form');
  if (!form) return;
  initLiveValidation(form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const data = Object.fromEntries(new FormData(form).entries());
    Store.set(STORAGE.messages, [{ ...data, createdAt: new Date().toISOString() }, ...Store.get(STORAGE.messages, [])]);
    form.reset();
    toast('Đã ghi nhận tin nhắn! Chúng tôi sẽ phản hồi sớm (mô phỏng).');
  });
}

/* ---------- 8.7 Đăng nhập / Đăng ký / Tài khoản ---------- */
function initAuth() {
  const authView = $('#auth-view');
  const accountView = $('#account-view');

  const renderAccount = () => {
    const user = Auth.current();
    authView.hidden = Boolean(user);
    accountView.hidden = !user;
    if (!user) return;

    const orders = Store.get(STORAGE.orders, []).filter((o) => o.customer.email === user.email);
    accountView.innerHTML = `
      <div class="account">
        <aside class="account__card">
          <span class="account__avatar" aria-hidden="true">${escapeHTML(user.name.trim().charAt(0).toUpperCase())}</span>
          <h1>Xin chào, ${escapeHTML(user.name)}</h1>
          <p class="account__tier">${icon('award')} Thành viên Aurum Privilege</p>
          <dl class="account__info">
            <div><dt>Email</dt><dd>${escapeHTML(user.email)}</dd></div>
            <div><dt>Điện thoại</dt><dd>${escapeHTML(user.phone || '—')}</dd></div>
            <div><dt>Ngày tham gia</dt><dd>${new Date(user.createdAt).toLocaleDateString('vi-VN')}</dd></div>
          </dl>
          <button type="button" class="btn btn--outline btn--block" id="logout-btn">${icon('logout')} Đăng xuất</button>
        </aside>
        <section class="account__orders" aria-labelledby="orders-title">
          <h2 class="section-title" id="orders-title">Lịch sử đơn hàng</h2>
          ${orders.length ? `
            <ul class="order-list">
              ${orders.map((o) => `
                <li class="order">
                  <div class="order__head">
                    <div><strong>#${o.code}</strong><small>${formatDate(o.createdAt)}</small></div>
                    <span class="tag tag--muted">${escapeHTML(o.status)}</span>
                  </div>
                  <ul class="order__items">
                    ${o.items.map((i) => `<li><span>${escapeHTML(i.name)} ${[i.color, i.variant].filter(Boolean).length ? `<small>(${[i.color, i.variant].filter(Boolean).map(escapeHTML).join(' · ')})</small>` : ''} × ${i.qty}</span><span>${formatVND(i.unit * i.qty)}</span></li>`).join('')}
                  </ul>
                  <div class="order__foot"><span>${escapeHTML(o.payment)}</span><strong>${formatVND(o.totals.total)}</strong></div>
                </li>`).join('')}
            </ul>` : emptyState({ iconName: 'package', title: 'Chưa có đơn hàng', text: 'Các đơn hàng (mô phỏng) đặt bằng email này sẽ xuất hiện tại đây.' })}
        </section>
      </div>`;
    $('#logout-btn').addEventListener('click', () => {
      Auth.logout();
      toast('Bạn đã đăng xuất.');
      renderAccount();
    });
  };

  // Tabs Đăng nhập / Đăng ký
  const tabs = $$('[data-auth-tab]');
  const showTab = (name, focus = false) => {
    tabs.forEach((t) => {
      const active = t.dataset.authTab === name;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active);
      t.tabIndex = active ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !active;
      if (active && focus) t.focus();
    });
  };
  tabs.forEach((t) => {
    t.addEventListener('click', () => showTab(t.dataset.authTab));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') showTab(t.dataset.authTab === 'login' ? 'register' : 'login', true);
    });
  });
  if (getParams().get('tab') === 'register') showTab('register');

  initPasswordToggles(authView);

  const showAlert = (el, message) => {
    el.textContent = message;
    el.hidden = !message;
  };

  // Đăng nhập
  const loginForm = $('#login-form');
  initLiveValidation(loginForm);
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert($('#login-alert'), '');
    if (!validateForm(loginForm)) return;
    try {
      const user = await Auth.login(loginForm.email.value, loginForm.password.value, loginForm.remember.checked);
      toast(`Chào mừng trở lại, ${user.name}!`);
      loginForm.reset();
      renderAccount();
      window.scrollTo({ top: 0 });
    } catch (err) {
      showAlert($('#login-alert'), err.message);
    }
  });

  // Đăng ký
  const registerForm = $('#register-form');
  initLiveValidation(registerForm);
  const strengthBar = $('#rg-strength-bar');
  const strengthText = $('#rg-strength-text');
  registerForm.password.addEventListener('input', (e) => {
    const v = e.target.value;
    const score = [v.length >= 8, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v), v.length >= 12]
      .filter(Boolean).length;
    const levels = ['Rất yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh', 'Rất mạnh'];
    strengthBar.style.width = `${(score / 5) * 100}%`;
    strengthBar.dataset.level = score;
    strengthText.textContent = v ? `Độ mạnh: ${levels[score]}` : 'Tối thiểu 8 ký tự, gồm chữ và số.';
  });
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert($('#register-alert'), '');
    if (!validateForm(registerForm)) return;
    try {
      const user = await Auth.register({
        name: registerForm.name.value,
        email: registerForm.email.value,
        phone: registerForm.phone.value,
        password: registerForm.password.value,
      });
      toast(`Tạo tài khoản thành công. Chào mừng ${user.name}!`);
      registerForm.reset();
      renderAccount();
      window.scrollTo({ top: 0 });
    } catch (err) {
      showAlert($('#register-alert'), err.message);
    }
  });

  $('#forgot-password').addEventListener('click', () => {
    toast('Chức năng mô phỏng: cần backend để gửi email đặt lại mật khẩu.', 'info');
  });
  $$('[data-social]').forEach((btn) => btn.addEventListener('click', () => {
    toast(`Đăng nhập bằng ${btn.dataset.social} là mô phỏng – cần tích hợp OAuth phía máy chủ.`, 'info');
  }));

  renderAccount();
}

/* ---------- 8.8 Yêu thích ---------- */
function initWishlist() {
  const root = $('#wishlist-root');
  const render = () => {
    const items = Wishlist.ids().map(getProduct);
    if (!items.length) {
      root.innerHTML = emptyState({ iconName: 'heart', title: 'Chưa có sản phẩm yêu thích', text: 'Nhấn biểu tượng trái tim trên sản phẩm để lưu lại và xem sau.' });
      return;
    }
    root.innerHTML = `
      <div class="wishlist-bar">
        <p><strong>${items.length}</strong> sản phẩm đã lưu</p>
        <div class="wishlist-bar__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-wish-clear>${icon('trash')} Xoá tất cả</button>
          <button type="button" class="btn btn--gold btn--sm" data-wish-all>${icon('bag')} Thêm tất cả vào giỏ</button>
        </div>
      </div>
      <div class="product-grid product-grid--4" id="wishlist-grid"></div>`;
    renderProductGrid($('#wishlist-grid'), items);
  };

  root.addEventListener('click', (e) => {
    const clearBtn = e.target.closest('[data-wish-clear]');
    if (clearBtn && confirmOnButton(clearBtn, 'Bấm lần nữa để xoá hết')) {
      Wishlist.clear();
    }
    if (e.target.closest('[data-wish-all]')) {
      const added = Wishlist.ids().map(getProduct).filter((p) => p.stock > 0 && Cart.add(p.id, 1)).length;
      if (added) toast(`Đã thêm ${added} sản phẩm vào giỏ hàng.`, 'success', { href: 'cart.html', label: 'Xem giỏ' });
    }
  });
  document.addEventListener('wishlist:change', render);
  render();
}

/* ==========================================================================
   9. KHỞI ĐỘNG
   ========================================================================== */
const PAGE_INIT = {
  home: initHome,
  products: initProducts,
  detail: initProductDetail,
  cart: initCart,
  checkout: initCheckout,
  contact: initContact,
  login: initAuth,
  wishlist: initWishlist,
};

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
