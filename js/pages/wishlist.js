/* ==========================================================================
   AURUM TECH — pages/wishlist.js
   Yêu thích (wishlist.html)
   Nạp SAU js/script.js: dùng dữ liệu, tiện ích và thành phần chung ở đó.
   ========================================================================== */
'use strict';

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

registerPage('wishlist', initWishlist);
