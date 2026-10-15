/* ==========================================================================
   AURUM TECH — pages/products.js
   Danh sách sản phẩm: tìm kiếm, lọc, sắp xếp, phân trang (products.html)
   Nạp SAU js/script.js: dùng dữ liệu, tiện ích và thành phần chung ở đó.
   ========================================================================== */
'use strict';

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

registerPage('products', initProducts);
