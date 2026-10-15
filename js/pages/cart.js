/* ==========================================================================
   AURUM TECH — pages/cart.js
   Giỏ hàng (cart.html)
   Nạp SAU js/script.js: dùng dữ liệu, tiện ích và thành phần chung ở đó.
   ========================================================================== */
'use strict';

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

registerPage('cart', initCart);
