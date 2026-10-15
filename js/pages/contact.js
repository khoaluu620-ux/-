/* ==========================================================================
   AURUM TECH — pages/contact.js
   Liên hệ (contact.html)
   Nạp SAU js/script.js: dùng dữ liệu, tiện ích và thành phần chung ở đó.
   ========================================================================== */
'use strict';

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

registerPage('contact', initContact);
