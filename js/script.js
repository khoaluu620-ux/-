/* =====================================================
   NOVASHOP - SCRIPT.JS
   Mục lục:
   1. Dữ liệu mẫu (danh mục, sản phẩm, đánh giá)
   2. Tiện ích chung (chọn phần tử, định dạng tiền, escape HTML)
   3. LocalStorage (giỏ hàng & yêu thích)
   4. Thông báo toast
   5. Render thẻ sản phẩm
   6. Header, menu mobile, nút nổi, animation khi cuộn
   7. Validate form
   8. Các trang: trang chủ, sản phẩm, chi tiết, giỏ hàng,
      thanh toán, đăng nhập/đăng ký, liên hệ, newsletter
   9. Khởi tạo (chạy khi trang tải xong)
   ===================================================== */

'use strict';

/* ---------- 1. DỮ LIỆU MẪU ---------- */

// Danh mục sản phẩm công nghệ. "icon" là class của Font Awesome.
const CATEGORIES = [
  { key: 'am-thanh', name: 'Âm thanh', icon: 'fa-headphones' },
  { key: 'thiet-bi-deo', name: 'Thiết bị đeo', icon: 'fa-clock' },
  { key: 'may-tinh', name: 'Laptop & PC', icon: 'fa-laptop' },
  { key: 'phu-kien', name: 'Phụ kiện', icon: 'fa-plug' },
  { key: 'gaming', name: 'Gaming', icon: 'fa-gamepad' },
];

// Sản phẩm mẫu. Ảnh nằm ở images/<id>.svg
// badge: 'sale' (giảm giá), 'hot' (bán chạy), 'new' (mới), hoặc '' (không có)
const PRODUCTS = [
  { id: 'p01', name: 'Tai nghe Bluetooth ANC Pro', category: 'am-thanh', price: 1290000, old: 1790000, rating: 4.8, reviews: 324, badge: 'sale', desc: 'Chống ồn chủ động, pin 30 giờ, kết nối đa điểm cho laptop và điện thoại.' },
  { id: 'p02', name: 'Đồng hồ thông minh Fit X', category: 'thiet-bi-deo', price: 2490000, old: 3290000, rating: 4.6, reviews: 210, badge: 'hot', desc: 'Theo dõi nhịp tim, giấc ngủ và 100+ chế độ thể thao. Chống nước IP68.' },
  { id: 'p03', name: 'Loa Bluetooth mini', category: 'am-thanh', price: 890000, old: 0, rating: 4.5, reviews: 156, badge: 'new', desc: 'Âm thanh 360°, chống nước IPX7, pin 12 giờ, dễ dàng mang theo.' },
  { id: 'p04', name: 'Chuột không dây Silent', category: 'phu-kien', price: 199000, old: 259000, rating: 4.4, reviews: 480, badge: 'sale', desc: 'Cảm biến 4000 DPI, click êm không gây tiếng ồn, pin dùng đến 6 tháng.' },
  { id: 'p05', name: 'Bàn phím cơ 75% RGB', category: 'phu-kien', price: 790000, old: 990000, rating: 4.7, reviews: 265, badge: 'hot', desc: 'Switch hot-swap, khung nhôm, đèn RGB, kết nối Bluetooth và USB-C.' },
  { id: 'p06', name: 'Sạc nhanh GaN 65W', category: 'phu-kien', price: 249000, old: 0, rating: 4.3, reviews: 98, badge: 'new', desc: 'Sạc 3 cổng cho laptop, điện thoại và tablet, nhỏ gọn nhờ công nghệ GaN.' },
  { id: 'p07', name: 'Laptop Ultrabook 14 inch', category: 'may-tinh', price: 15900000, old: 19900000, rating: 4.9, reviews: 512, badge: 'hot', desc: 'Chip thế hệ mới, RAM 16GB, SSD 512GB, màn hình 2.8K, pin 12 giờ.' },
  { id: 'p08', name: 'Máy tính bảng 10 inch', category: 'may-tinh', price: 6990000, old: 0, rating: 4.5, reviews: 143, badge: 'new', desc: 'Màn hình 10 inch 2K, hỗ trợ bút cảm ứng, phù hợp học tập và giải trí.' },
  { id: 'p09', name: 'Ổ cứng SSD NVMe 1TB', category: 'may-tinh', price: 1890000, old: 2290000, rating: 4.6, reviews: 233, badge: 'sale', desc: 'Tốc độ đọc 7000MB/s, tản nhiệt graphene, tương thích PC và laptop.' },
  { id: 'p10', name: 'Tay cầm chơi game không dây', category: 'gaming', price: 750000, old: 950000, rating: 4.7, reviews: 389, badge: 'hot', desc: 'Kết nối Bluetooth và 2.4GHz, rung kép, pin 40 giờ, tương thích PC và điện thoại.' },
  { id: 'p11', name: 'Webcam 2K Full HD', category: 'phu-kien', price: 890000, old: 0, rating: 4.5, reviews: 176, badge: 'new', desc: 'Quay 2K 30fps, micro khử ồn kép, lấy nét tự động, phù hợp họp online.' },
  { id: 'p12', name: 'Màn hình gaming 27 inch 165Hz', category: 'gaming', price: 4590000, old: 5490000, rating: 4.8, reviews: 201, badge: 'hot', desc: 'Tấm nền IPS 2K, tần số quét 165Hz, thời gian phản hồi 1ms, hỗ trợ FreeSync.' },
];

// Đánh giá mẫu hiển thị ở trang chi tiết sản phẩm
const REVIEWS = [
  { name: 'Minh Anh', initial: 'M', rating: 5, date: '12/09/2026', text: 'Sản phẩm đúng mô tả, đóng gói cẩn thận, giao hàng rất nhanh.' },
  { name: 'Hoàng Nam', initial: 'H', rating: 4, date: '03/09/2026', text: 'Hiệu năng tốt so với giá tiền. Mình sẽ ủng hộ shop thêm lần nữa.' },
  { name: 'Thu Trang', initial: 'T', rating: 5, date: '28/08/2026', text: 'Dùng vài tuần thấy rất ổn định, tư vấn nhiệt tình khi mình hỏi.' },
];

// Chính sách vận chuyển
const FREE_SHIP_MIN = 500000; // đơn từ mức này được miễn phí ship
const SHIPPING_FEE = 30000;   // phí ship khi chưa đủ điều kiện
const PRICE_LIMIT = 30000000; // giá tối đa trên thanh trượt
const PRICE_STEP = 500000;    // bước nhảy của thanh trượt

const CART_KEY = 'novashop_cart';
const WISH_KEY = 'novashop_wishlist';
const ANNOUNCE_KEY = 'novashop_announce_closed';

/* ---------- 2. TIỆN ÍCH CHUNG ---------- */

// Viết tắt cho document.querySelector / querySelectorAll
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// Định dạng số thành tiền Việt: 1290000 -> "1.290.000 ₫"
const formatVND = (number) => `${number.toLocaleString('vi-VN')} ₫`;

// Chống chèn mã HTML độc hại khi đưa dữ liệu người dùng vào giao diện
const escapeHTML = (text) =>
  String(text).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

// Đưa chuỗi về dạng không dấu, viết thường để tìm kiếm tiếng Việt dễ hơn
const normalizeText = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

const getProduct = (id) => PRODUCTS.find((product) => product.id === id);
const getCategoryName = (key) => (CATEGORIES.find((cat) => cat.key === key) || {}).name || '';
const discountPercent = (product) =>
  product.old ? Math.round((1 - product.price / product.old) * 100) : 0;

// Bọc LocalStorage trong try/catch để trang vẫn chạy khi trình duyệt chặn lưu trữ
const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Không thể lưu dữ liệu:', error);
    }
  },
};

// Gửi sự kiện tùy chỉnh để các phần khác của trang biết dữ liệu vừa thay đổi
const notify = (eventName) => window.dispatchEvent(new CustomEvent(eventName));

/* ---------- 3. GIỎ HÀNG & YÊU THÍCH (LOCALSTORAGE) ---------- */

// Giỏ hàng lưu dạng [{ id: 'p01', qty: 2 }]
function getCartItems() {
  return storage.get(CART_KEY, []).filter((item) => getProduct(item.id));
}

function saveCart(items) {
  storage.set(CART_KEY, items);
  notify('cart:change');
}

function addToCart(id, qty = 1) {
  const items = getCartItems();
  const existing = items.find((item) => item.id === id);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 99);
  } else {
    items.push({ id, qty });
  }
  saveCart(items);
  showToast(`Đã thêm "${getProduct(id).name}" vào giỏ hàng`, 'success');
}

function changeCartQty(id, step) {
  const items = getCartItems();
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  item.qty += step;
  if (item.qty < 1) {
    // Giảm về 0 thì coi như xóa sản phẩm
    removeFromCart(id);
    return;
  }
  item.qty = Math.min(item.qty, 99);
  saveCart(items);
}

function removeFromCart(id) {
  saveCart(getCartItems().filter((item) => item.id !== id));
  showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
}

// Tính tổng tiền: tạm tính, phí ship, tổng cộng, số lượng
function getCartTotals() {
  const items = getCartItems().map((item) => ({ ...item, product: getProduct(item.id) }));
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIP_MIN ? 0 : SHIPPING_FEE;
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  return { items, subtotal, shipping, total: subtotal + shipping, count };
}

function getWishlist() {
  return storage.get(WISH_KEY, []);
}

function isWished(id) {
  return getWishlist().includes(id);
}

// Thêm hoặc bỏ sản phẩm khỏi yêu thích, đồng thời cập nhật mọi nút tim cùng mã
function toggleWishlist(id) {
  const list = getWishlist();
  const index = list.indexOf(id);
  const added = index === -1;
  if (added) list.push(id);
  else list.splice(index, 1);
  storage.set(WISH_KEY, list);

  $$(`[data-wish="${id}"]`).forEach(updateWishButton);
  notify('wishlist:change');
  showToast(added ? 'Đã thêm vào danh sách yêu thích' : 'Đã bỏ khỏi danh sách yêu thích', added ? 'success' : 'info');
}

function updateWishButton(button) {
  const active = isWished(button.dataset.wish);
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));
  const icon = button.querySelector('i');
  if (icon) icon.className = `${active ? 'fa-solid' : 'fa-regular'} fa-heart`;
}

// Cập nhật số trên icon giỏ hàng và yêu thích ở mọi trang
function updateBadges() {
  const cartCount = getCartTotals().count;
  $$('[data-cart-count]').forEach((el) => { el.textContent = cartCount; });
  const wishCount = getWishlist().length;
  $$('[data-wish-count]').forEach((el) => { el.textContent = wishCount; });
}

/* ---------- 4. THÔNG BÁO TOAST ---------- */

// type: 'success' | 'error' | 'info'
function showToast(message, type = 'success') {
  const container = $('#toast-container');
  if (!container) return;

  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  // Tự ẩn sau khoảng 3 giây
  setTimeout(() => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ---------- 5. RENDER THẺ SẢN PHẨM ---------- */

// Tạo sao đánh giá: sao đầy, nửa sao, sao rỗng
function starsHTML(rating) {
  let html = '';
  for (let star = 1; star <= 5; star += 1) {
    if (rating >= star) html += '<i class="fa-solid fa-star"></i>';
    else if (rating >= star - 0.5) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

function badgeHTML(product) {
  if (!product.badge) return '';
  const labels = {
    sale: `-${discountPercent(product)}%`,
    hot: 'HOT',
    new: 'NEW',
  };
  return `<span class="badge-tag badge-tag--${product.badge}">${labels[product.badge]}</span>`;
}

// Trả về HTML của một thẻ sản phẩm
function productCardHTML(product) {
  const wished = isWished(product.id);
  const oldPrice = product.old ? `<del class="price-old">${formatVND(product.old)}</del>` : '';
  return `
    <article class="product-card">
      <div class="product-card__media">
        <a href="product-detail.html?id=${product.id}" aria-label="Xem chi tiết ${escapeHTML(product.name)}">
          <img src="images/${product.id}.svg" alt="${escapeHTML(product.name)}" loading="lazy">
        </a>
        ${badgeHTML(product)}
        <button type="button" class="wish-btn ${wished ? 'is-active' : ''}" data-wish="${product.id}"
          aria-pressed="${wished}" aria-label="Thêm vào yêu thích">
          <i class="${wished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
        <button type="button" class="btn btn--cart product-card__add" data-add="${product.id}">
          <i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ
        </button>
      </div>
      <div class="product-card__body">
        <span class="product-card__cat">${escapeHTML(getCategoryName(product.category))}</span>
        <h3 class="product-card__name">
          <a href="product-detail.html?id=${product.id}">${escapeHTML(product.name)}</a>
        </h3>
        <div class="rating" role="img" aria-label="Đánh giá ${product.rating} trên 5">
          ${starsHTML(product.rating)} <span>(${product.reviews})</span>
        </div>
        <div class="price">
          <span class="price-now">${formatVND(product.price)}</span>${oldPrice}
        </div>
      </div>
    </article>`;
}

// Đổ danh sách sản phẩm vào một vùng lưới
function renderProducts(container, products, emptyEl) {
  if (!container) return;
  container.innerHTML = products.map(productCardHTML).join('');
  if (emptyEl) emptyEl.hidden = products.length > 0;
}

/* ---------- 6. HEADER, MENU, NÚT NỔI, ANIMATION ---------- */

// Ẩn thanh thông báo và nhớ lựa chọn của người dùng
function initAnnouncement() {
  const bar = $('#announce-bar');
  if (!bar) return;
  if (storage.get(ANNOUNCE_KEY, false)) {
    bar.remove();
    return;
  }
  $('#announce-close').addEventListener('click', () => {
    bar.remove();
    storage.set(ANNOUNCE_KEY, true);
  });
}

// Menu hamburger trên mobile: mở/đóng, đóng khi bấm link hoặc nhấn Esc
function initMenu() {
  const toggle = $('.menu-toggle');
  const nav = $('#main-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    toggle.innerHTML = `<i class="fa-solid ${open ? 'fa-xmark' : 'fa-bars'}"></i>`;
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

// Đánh dấu link đang xem trên thanh điều hướng (aria-current)
function markActiveNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  const pageCategory = new URLSearchParams(location.search).get('category') || '';
  $$('.nav-list a').forEach((link) => {
    const [file, query = ''] = link.getAttribute('href').split('?');
    const linkCategory = new URLSearchParams(query).get('category') || '';
    if (file === current && linkCategory === pageCategory) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

// Đổi bóng header khi cuộn và hiện nút lên đầu trang
function initScrollEffects() {
  const header = $('.site-header');
  const toTop = $('#back-to-top');

  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 10);
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
}

// Hiệu ứng xuất hiện khi cuộn tới (IntersectionObserver)
let revealObserver = null;
function observeReveal(root = document) {
  const targets = root.querySelectorAll('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }
  targets.forEach((el) => revealObserver.observe(el));
}

/* ---------- 7. VALIDATE FORM ---------- */

// Kiểm tra một ô nhập. Trả về true nếu hợp lệ.
// Quy tắc đọc từ thuộc tính: required, data-rule (phone, email, password), data-match (ô cần khớp)
function validateField(field) {
  const group = field.closest('.form-group');
  if (!group) return true;

  const value = field.value.trim();
  let message = '';

  if (field.required && value === '') {
    message = 'Trường này là bắt buộc';
  } else if (value !== '') {
    if (field.dataset.rule === 'phone' && !/^(0|\+84)\d{9}$/.test(value.replace(/\s/g, ''))) {
      message = 'Số điện thoại không hợp lệ (gồm 10 số)';
    } else if (field.dataset.rule === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = 'Email không hợp lệ';
    } else if (field.dataset.rule === 'password' && value.length < 6) {
      message = 'Mật khẩu tối thiểu 6 ký tự';
    } else if (field.dataset.match) {
      const other = $(field.dataset.match);
      if (other && other.value !== field.value) message = 'Mật khẩu xác nhận không khớp';
    }
  }

  group.classList.toggle('is-invalid', message !== '');
  const errorEl = group.querySelector('.form-error');
  if (errorEl) errorEl.textContent = message;
  field.setAttribute('aria-invalid', String(message !== ''));
  return message === '';
}

// Kiểm tra toàn bộ form, focus vào ô lỗi đầu tiên
function validateForm(form) {
  const fields = $$('input[required], select[required], textarea[required], input[data-rule], input[data-match]', form)
    .filter((field) => field.type !== 'checkbox' && field.type !== 'radio');
  let firstInvalid = null;
  fields.forEach((field) => {
    if (!validateField(field) && !firstInvalid) firstInvalid = field;
  });
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

// Các hành động sau khi form hợp lệ, gắn theo id của form
const FORM_HANDLERS = {
  'newsletter-form': (form) => {
    showToast('Đăng ký nhận tin thành công! Ưu đãi sẽ sớm được gửi tới bạn.');
    form.reset();
  },
  'contact-form': (form) => {
    showToast('Cảm ơn bạn! Chúng tôi sẽ phản hồi trong vòng 24 giờ.');
    form.reset();
  },
  'login-form': () => {
    showToast('Đăng nhập thành công (bản demo, chưa kết nối máy chủ).');
  },
  'register-form': (form) => {
    showToast('Tạo tài khoản thành công (bản demo).');
    form.reset();
  },
  'checkout-form': () => handleCheckout(),
};

function initForms() {
  $$('form[data-validate]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validateForm(form)) {
        showToast('Vui lòng kiểm tra lại thông tin đã nhập.', 'error');
        return;
      }
      const handler = FORM_HANDLERS[form.id];
      if (handler) handler(form);
    });

    // Khi người dùng sửa lại ô đang báo lỗi, kiểm tra lại ngay để xóa lỗi
    form.addEventListener('input', (event) => {
      const group = event.target.closest('.form-group');
      if (group && group.classList.contains('is-invalid')) validateField(event.target);
    });
  });
}

/* ---------- 8. CÁC TRANG ---------- */

/* 8.1 Trang chủ */
function renderCategoryCards(container) {
  if (!container) return;
  container.innerHTML = CATEGORIES.map((cat) => {
    const count = PRODUCTS.filter((product) => product.category === cat.key).length;
    return `
      <a href="products.html?category=${cat.key}" class="category-card reveal">
        <span class="category-card__icon"><i class="fa-solid ${cat.icon}"></i></span>
        <h3>${cat.name}</h3>
        <small>${count} sản phẩm</small>
      </a>`;
  }).join('');
}

// Đếm ngược tới 24:00 hôm nay cho banner khuyến mãi
function startCountdown() {
  const hours = $('#cd-hours');
  if (!hours) return;
  const pad = (n) => String(n).padStart(2, '0');

  const tick = () => {
    const now = new Date();
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    const diff = Math.max(0, end - now);
    hours.textContent = pad(Math.floor(diff / 3600000));
    $('#cd-minutes').textContent = pad(Math.floor((diff % 3600000) / 60000));
    $('#cd-seconds').textContent = pad(Math.floor((diff % 60000) / 1000));
  };
  tick();
  setInterval(tick, 1000);
}

/* Slider banner đầu trang: kéo bằng chuột hoặc vuốt, tự chạy, có nút và chấm điều hướng */
function initHeroSlider() {
  const slider = $('#hero-slider');
  if (!slider) return;

  const viewport = $('.hero-slider__viewport', slider);
  const track = $('#hero-track', slider);
  const slides = $$('.hero-slide', slider);
  const dots = $$('[data-hero-dot]', slider);
  const AUTOPLAY_MS = 6000;
  const DRAG_THRESHOLD = 0.15; // kéo quá 15% chiều rộng thì chuyển slide

  let index = 0;
  let startX = 0;
  let dragX = 0;
  let dragging = false;
  let moved = false;
  let timer = null;

  // Dịch track theo chỉ số slide (tính bằng pixel để khớp chiều rộng thực tế)
  const offsetFor = (i) => -i * viewport.clientWidth;
  const show = (i, animate = true) => {
    index = (i + slides.length) % slides.length;
    track.classList.toggle('is-dragging', !animate);
    track.style.transform = `translate3d(${offsetFor(index)}px, 0, 0)`;
    dots.forEach((dot, n) => {
      dot.classList.toggle('is-active', n === index);
      dot.setAttribute('aria-current', String(n === index));
    });
  };

  const restartAutoplay = () => {
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), AUTOPLAY_MS);
  };

  // Kéo: dùng Pointer Events nên hoạt động cho cả chuột và cảm ứng
  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    dragX = 0;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
    track.classList.add('is-dragging');
    clearInterval(timer);
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dragX = event.clientX - startX;
    if (Math.abs(dragX) > 5) moved = true;
    track.style.transform = `translate3d(${offsetFor(index) + dragX}px, 0, 0)`;
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    const threshold = viewport.clientWidth * DRAG_THRESHOLD;
    if (dragX < -threshold) show(index + 1);
    else if (dragX > threshold) show(index - 1);
    else show(index);
    restartAutoplay();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);

  // Sau khi kéo, không để thao tác thả chuột mở đường dẫn trong slide
  viewport.addEventListener('click', (event) => {
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }
  }, true);
  viewport.addEventListener('dragstart', (event) => event.preventDefault());

  // Nút mũi tên và chấm điều hướng
  $('[data-hero-prev]', slider).addEventListener('click', () => { show(index - 1); restartAutoplay(); });
  $('[data-hero-next]', slider).addEventListener('click', () => { show(index + 1); restartAutoplay(); });
  dots.forEach((dot) => dot.addEventListener('click', () => {
    show(Number(dot.dataset.heroDot));
    restartAutoplay();
  }));

  // Tạm dừng tự chạy khi người dùng đưa chuột vào banner
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', restartAutoplay);

  window.addEventListener('resize', () => show(index, false));

  show(0, false);
  restartAutoplay();
}

function initHome() {
  initHeroSlider();
  renderCategoryCards($('#category-grid'));
  // Sản phẩm nổi bật: nhãn HOT
  renderProducts($('#featured-grid'), PRODUCTS.filter((p) => p.badge === 'hot').slice(0, 4));
  // Hàng mới: nhãn NEW
  renderProducts($('#new-grid'), PRODUCTS.filter((p) => p.badge === 'new').slice(0, 4));
  // Bán chạy: nhiều đánh giá nhất
  renderProducts($('#best-grid'), [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 4));
  startCountdown();
}

/* 8.2 Trang sản phẩm: tìm kiếm, lọc, sắp xếp */
const readFilters = () => ({
  q: normalizeText($('#filter-search').value),
  category: ($('input[name="category"]:checked') || {}).value || '',
  min: Number($('#price-min').value),
  max: Number($('#price-max').value),
  wishlistOnly: $('#filter-wishlist').checked,
  sort: $('#sort-select').value,
});

// Tô màu đoạn đã chọn trên thanh trượt giá
function updateRangeFill() {
  const min = Number($('#price-min').value);
  const max = Number($('#price-max').value);
  const fill = $('#range-fill');
  fill.style.left = `${(min / PRICE_LIMIT) * 100}%`;
  fill.style.width = `${((max - min) / PRICE_LIMIT) * 100}%`;
  $('#price-min-text').textContent = formatVND(min);
  $('#price-max-text').textContent = formatVND(max);
}

function applyFilters() {
  const f = readFilters();
  let list = PRODUCTS.filter((product) =>
    (!f.q || normalizeText(product.name).includes(f.q)) &&
    (!f.category || product.category === f.category) &&
    product.price >= f.min && product.price <= f.max &&
    (!f.wishlistOnly || isWished(product.id)));

  const sorters = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    name: (a, b) => a.name.localeCompare(b.name, 'vi'),
  };
  if (sorters[f.sort]) list = list.sort(sorters[f.sort]);

  renderProducts($('#product-grid'), list, $('#empty-state'));
  $('#result-count').textContent = `Tìm thấy ${list.length} sản phẩm`;
  updateRangeFill();
  observeReveal();
}

function initProductsPage() {
  const params = new URLSearchParams(location.search);
  const minSlider = $('#price-min');
  const maxSlider = $('#price-max');

  // Thiết lập giá trị ban đầu từ URL (ví dụ ?category=am-thanh&q=tai+nghe)
  [minSlider, maxSlider].forEach((slider) => {
    slider.max = PRICE_LIMIT;
    slider.step = PRICE_STEP;
  });
  minSlider.value = 0;
  maxSlider.value = PRICE_LIMIT;
  $('#filter-search').value = params.get('q') || '';
  const category = params.get('category') || '';
  const radio = $(`input[name="category"][value="${category}"]`) || $('input[name="category"][value=""]');
  radio.checked = true;
  $('#filter-wishlist').checked = params.get('wishlist') === '1';

  const title = $('#page-title');
  if (title && category) title.textContent = getCategoryName(category);

  // Thanh trượt giá: luôn giữ giá tối thiểu <= giá tối đa
  minSlider.addEventListener('input', () => {
    if (Number(minSlider.value) > Number(maxSlider.value)) minSlider.value = maxSlider.value;
    applyFilters();
  });
  maxSlider.addEventListener('input', () => {
    if (Number(maxSlider.value) < Number(minSlider.value)) maxSlider.value = minSlider.value;
    applyFilters();
  });

  // Tìm kiếm có độ trễ 200ms để không lọc lại liên tục khi gõ
  let searchTimer = null;
  $('#filter-search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 200);
  });

  $$('input[name="category"]').forEach((input) => input.addEventListener('change', applyFilters));
  $('#filter-wishlist').addEventListener('change', applyFilters);
  $('#sort-select').addEventListener('change', applyFilters);
  window.addEventListener('wishlist:change', applyFilters);

  $('#reset-filters').addEventListener('click', () => {
    $('#filter-search').value = '';
    $('input[name="category"][value=""]').checked = true;
    $('#filter-wishlist').checked = false;
    $('#sort-select').value = 'default';
    minSlider.value = 0;
    maxSlider.value = PRICE_LIMIT;
    applyFilters();
  });

  applyFilters();
}

/* 8.3 Trang chi tiết sản phẩm */
function initDetailPage() {
  const id = new URLSearchParams(location.search).get('id');
  const product = getProduct(id);
  const root = $('#detail-root');

  if (!product) {
    root.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-circle-exclamation"></i>
        <h2>Không tìm thấy sản phẩm</h2>
        <p>Sản phẩm bạn tìm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        <a href="products.html" class="btn btn--primary">Xem tất cả sản phẩm</a>
      </div>`;
    return;
  }

  document.title = `${product.name} | NovaShop`;
  const categoryName = getCategoryName(product.category);
  const oldPrice = product.old ? `<del class="price-old">${formatVND(product.old)}</del>` : '';
  const wished = isWished(product.id);

  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Đường dẫn">
      <a href="index.html">Trang chủ</a><span>/</span>
      <a href="products.html?category=${product.category}">${categoryName}</a><span>/</span>
      ${escapeHTML(product.name)}
    </nav>

    <div class="product-detail">
      <div class="product-detail__media">
        <img src="images/${product.id}.svg" alt="${escapeHTML(product.name)}">
        ${badgeHTML(product)}
      </div>

      <div class="product-detail__info">
        <span class="product-card__cat">${categoryName}</span>
        <h1>${escapeHTML(product.name)}</h1>
        <div class="rating" role="img" aria-label="Đánh giá ${product.rating} trên 5">
          ${starsHTML(product.rating)} <span>${product.rating} · ${product.reviews} đánh giá</span>
        </div>
        <div class="price"><span class="price-now">${formatVND(product.price)}</span>${oldPrice}</div>
        <p class="product-detail__desc">${escapeHTML(product.desc)}</p>

        <ul class="perks">
          <li><i class="fa-solid fa-truck-fast"></i> Giao nhanh 1-3 ngày, miễn phí đơn từ 500.000 ₫</li>
          <li><i class="fa-solid fa-rotate-left"></i> Đổi trả miễn phí trong 7 ngày</li>
          <li><i class="fa-solid fa-shield-halved"></i> Bảo hành chính hãng 12 tháng</li>
        </ul>

        <div class="buy-box">
          <div class="qty">
            <button type="button" id="qty-minus" aria-label="Giảm số lượng">−</button>
            <input type="number" id="detail-qty" value="1" min="1" max="99" aria-label="Số lượng">
            <button type="button" id="qty-plus" aria-label="Tăng số lượng">+</button>
          </div>
          <button type="button" class="btn btn--outline" id="detail-add">
            <i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ
          </button>
          <button type="button" class="btn btn--accent" id="detail-buy">Mua ngay</button>
          <button type="button" class="wish-btn wish-btn--inline ${wished ? 'is-active' : ''}"
            data-wish="${product.id}" aria-pressed="${wished}" aria-label="Thêm vào yêu thích">
            <i class="${wished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>
      </div>
    </div>

    <section class="reviews" aria-labelledby="reviews-title">
      <h2 class="section-title" id="reviews-title">Đánh giá khách hàng</h2>
      <div class="review-list">
        ${REVIEWS.map((review) => `
          <article class="review">
            <header>
              <strong>${review.name}</strong>
              <span class="rating">${starsHTML(review.rating)} <small>${review.date}</small></span>
            </header>
            <p>${review.text}</p>
          </article>`).join('')}
      </div>
    </section>`;

  // Bộ chọn số lượng
  const qtyInput = $('#detail-qty');
  const clampQty = () => {
    qtyInput.value = Math.min(99, Math.max(1, parseInt(qtyInput.value, 10) || 1));
  };
  $('#qty-minus').addEventListener('click', () => {
    qtyInput.value = Number(qtyInput.value) - 1;
    clampQty();
  });
  $('#qty-plus').addEventListener('click', () => {
    qtyInput.value = Number(qtyInput.value) + 1;
    clampQty();
  });
  qtyInput.addEventListener('change', clampQty);

  $('#detail-add').addEventListener('click', () => addToCart(product.id, Number(qtyInput.value)));
  $('#detail-buy').addEventListener('click', () => {
    addToCart(product.id, Number(qtyInput.value));
    window.location.href = 'cart.html';
  });

  // Sản phẩm liên quan: cùng danh mục, trừ sản phẩm đang xem
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const relatedSection = $('#related-section');
  if (related.length && relatedSection) {
    renderProducts($('#related-grid'), related);
    relatedSection.hidden = false;
  }
}

/* 8.4 Giỏ hàng */
function renderCart() {
  const totals = getCartTotals();
  const hasItems = totals.items.length > 0;

  $('#cart-layout').hidden = !hasItems;
  $('#cart-empty').hidden = hasItems;
  $('#cart-count').textContent = `${totals.count} sản phẩm`;

  $('#cart-items').innerHTML = totals.items.map(({ id, qty, product }) => `
    <article class="cart-item" data-id="${id}">
      <img src="images/${id}.svg" alt="${escapeHTML(product.name)}">
      <div>
        <h3><a href="product-detail.html?id=${id}">${escapeHTML(product.name)}</a></h3>
        <p class="cart-item__meta">${formatVND(product.price)} / sản phẩm</p>
        <div class="cart-item__actions">
          <div class="qty">
            <button type="button" data-cart-step="-1" data-id="${id}" aria-label="Giảm số lượng">−</button>
            <span aria-live="polite">${qty}</span>
            <button type="button" data-cart-step="1" data-id="${id}" aria-label="Tăng số lượng">+</button>
          </div>
          <button type="button" class="cart-item__remove" data-cart-remove="${id}">
            <i class="fa-solid fa-trash-can"></i> Xóa
          </button>
        </div>
      </div>
      <div class="cart-item__subtotal">${formatVND(product.price * qty)}</div>
    </article>`).join('');

  $('#sum-subtotal').textContent = formatVND(totals.subtotal);
  $('#sum-shipping').textContent = totals.shipping === 0 ? 'Miễn phí' : formatVND(totals.shipping);
  $('#sum-total').textContent = formatVND(totals.total);

  const note = $('#sum-note');
  const missing = FREE_SHIP_MIN - totals.subtotal;
  note.hidden = !hasItems || missing <= 0;
  note.textContent = `Mua thêm ${formatVND(missing)} để được miễn phí vận chuyển.`;
}

function initCartPage() {
  // Một listener cho cả vùng: tăng/giảm/xóa
  $('#cart-items').addEventListener('click', (event) => {
    const step = event.target.closest('[data-cart-step]');
    if (step) {
      changeCartQty(step.dataset.id, Number(step.dataset.cartStep));
      return;
    }
    const remove = event.target.closest('[data-cart-remove]');
    if (remove) removeFromCart(remove.dataset.cartRemove);
  });
  window.addEventListener('cart:change', renderCart);
  renderCart();
}

/* 8.5 Thanh toán */
let orderPlaced = false;

function renderCheckout() {
  if (orderPlaced) return;
  const totals = getCartTotals();
  const hasItems = totals.items.length > 0;

  $('#checkout-layout').hidden = !hasItems;
  $('#checkout-empty').hidden = hasItems;
  if (!hasItems) return;

  $('#checkout-items').innerHTML = totals.items.map(({ id, qty, product }) => `
    <div class="mini-item">
      <img src="images/${id}.svg" alt="${escapeHTML(product.name)}">
      <div class="mini-item__info">
        <strong>${escapeHTML(product.name)}</strong><br>
        <small>SL: ${qty} × ${formatVND(product.price)}</small>
      </div>
      <span>${formatVND(product.price * qty)}</span>
    </div>`).join('');

  $('#checkout-subtotal').textContent = formatVND(totals.subtotal);
  $('#checkout-shipping').textContent = totals.shipping === 0 ? 'Miễn phí' : formatVND(totals.shipping);
  $('#checkout-total').textContent = formatVND(totals.total);
}

function handleCheckout() {
  // Đây là bản demo: không gửi đơn tới máy chủ, chỉ tạo mã đơn và xóa giỏ hàng
  const code = `NS${Date.now().toString().slice(-8)}`;
  orderPlaced = true;
  saveCart([]);
  $('#checkout-layout').hidden = true;
  $('#checkout-empty').hidden = true;
  $('#order-code').textContent = code;
  $('#order-success').hidden = false;
  showToast('Đặt hàng thành công!');
}

function initCheckoutPage() {
  window.addEventListener('cart:change', renderCheckout);
  renderCheckout();
}

/* 8.6 Đăng nhập / đăng ký (chuyển tab) */
function initLoginPage() {
  const tabs = $$('[data-auth-tab]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.authTab;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      $('#login-form').hidden = target !== 'login';
      $('#register-form').hidden = target !== 'register';
    });
  });
}

/* ---------- 9. KHỞI TẠO ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Đánh dấu có JavaScript để CSS bật hiệu ứng reveal
  document.documentElement.classList.add('js');

  updateBadges();
  window.addEventListener('cart:change', updateBadges);
  window.addEventListener('wishlist:change', updateBadges);

  initAnnouncement();
  initMenu();
  initScrollEffects();
  markActiveNav();
  initForms();

  // Nút tim có sẵn trong HTML cần đồng bộ với danh sách yêu thích đã lưu
  $$('[data-wish]').forEach(updateWishButton);

  // Nút "Thêm vào giỏ" và nút tim dùng chung ở mọi trang (ủy quyền sự kiện)
  document.addEventListener('click', (event) => {
    const addBtn = event.target.closest('[data-add]');
    if (addBtn) addToCart(addBtn.dataset.add);

    const wishBtn = event.target.closest('[data-wish]');
    if (wishBtn && wishBtn.classList.contains('wish-btn')) toggleWishlist(wishBtn.dataset.wish);
  });

  const pages = {
    home: initHome,
    products: initProductsPage,
    detail: initDetailPage,
    cart: initCartPage,
    checkout: initCheckoutPage,
    login: initLoginPage,
  };
  const init = pages[document.body.dataset.page];
  if (init) init();

  observeReveal();
});
