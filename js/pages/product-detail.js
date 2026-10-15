/* ==========================================================================
   AURUM TECH — pages/product-detail.js
   Chi tiết sản phẩm (product-detail.html)
   Nạp SAU js/script.js: dùng dữ liệu, tiện ích và thành phần chung ở đó.
   ========================================================================== */
'use strict';

/** Đánh giá mẫu hiển thị kèm đánh giá người dùng lưu trong LocalStorage */
const SAMPLE_REVIEWS = [
  { name: 'Phạm Thu Hà', rating: 5, date: '2026-09-02', text: 'Sản phẩm chính hãng, đóng gói rất sang trọng. Nhân viên gọi xác nhận nhanh, giao đúng hẹn.' },
  { name: 'Đỗ Mạnh Hùng', rating: 5, date: '2026-08-18', text: 'Dùng được 2 tuần, hiệu năng và chất lượng hoàn thiện xuất sắc. Rất hài lòng với dịch vụ của Aurum.' },
  { name: 'Võ Ngọc Lan', rating: 4, date: '2026-07-27', text: 'Máy đẹp, giá tốt hơn nhiều nơi. Trừ 1 sao vì mình phải đợi thêm 1 ngày cho màu mình chọn.' },
  { name: 'Bùi Đức Long', rating: 5, date: '2026-07-11', text: 'Được hỗ trợ cài đặt và chuyển dữ liệu miễn phí tại showroom. Rất đáng tiền!' },
  { name: 'Hoàng Mai Phương', rating: 4, date: '2026-06-30', text: 'Thiết kế tinh tế, cầm rất chắc tay. Sẽ tiếp tục ủng hộ cửa hàng.' },
];

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

registerPage('detail', initProductDetail);
