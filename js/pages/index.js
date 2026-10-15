/* ==========================================================================
   AURUM TECH — pages/index.js
   Trang chủ (index.html)
   Nạp SAU js/script.js: dùng dữ liệu, tiện ích và thành phần chung ở đó.
   ========================================================================== */
'use strict';

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

registerPage('home', initHome);
