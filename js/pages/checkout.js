/* ==========================================================================
   AURUM TECH — pages/checkout.js
   Thanh toán mô phỏng (checkout.html)
   Nạp SAU js/script.js: dùng dữ liệu, tiện ích và thành phần chung ở đó.
   ========================================================================== */
'use strict';

/** Danh sách tỉnh/thành cho ô địa chỉ */
const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế',
  'Quảng Ninh', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình', 'Thanh Hoá', 'Nghệ An',
  'Hà Tĩnh', 'Quảng Trị', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hoà', 'Đắk Lắk',
  'Lâm Đồng', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Cà Mau',
  'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Tuyên Quang', 'Lạng Sơn', 'Cao Bằng',
  'Điện Biên', 'Lai Châu', 'Sơn La',
];

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

registerPage('checkout', initCheckout);
