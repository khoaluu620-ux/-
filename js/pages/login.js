/* ==========================================================================
   AURUM TECH — pages/login.js
   Đăng nhập / Đăng ký / Tài khoản (login.html)
   Nạp SAU js/script.js: dùng dữ liệu, tiện ích và thành phần chung ở đó.
   ========================================================================== */
'use strict';

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

registerPage('login', initAuth);
