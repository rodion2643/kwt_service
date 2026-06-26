(function () {
  'use strict';

  function initForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = fd.get('name')?.toString().trim() || '';
      const phone = fd.get('phone')?.toString().trim() || '';
      const service = fd.get('service')?.toString().trim() || '';
      const message = fd.get('message')?.toString().trim() || '';

      if (!name || !phone) {
        showStatus(form, 'Заполните имя и телефон', 'error');
        return;
      }

      const text = [
        '🛴 Заявка с сайта KWT Service',
        '',
        `👤 Имя: ${name}`,
        `📞 Телефон: ${phone}`,
        service ? `🔧 Услуга: ${service}` : '',
        message ? `💬 Сообщение: ${message}` : ''
      ].filter(Boolean).join('\n');

      const tgUrl = `${KWT.telegram}?text=${encodeURIComponent(text)}`;
      window.open(tgUrl, '_blank');
      showStatus(form, 'Открываем Telegram — отправьте заявку', 'success');
      form.reset();
    });
  }

  function showStatus(form, text, type) {
    let el = form.querySelector('.form-status');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-status';
      form.appendChild(el);
    }
    el.textContent = text;
    el.className = `form-status form-status--${type}`;
    setTimeout(() => { el.textContent = ''; el.className = 'form-status'; }, 5000);
  }

  function fillServiceSelect(selectId, preselect) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';
    Object.values(KWT.services).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.title;
      opt.textContent = s.title;
      if (preselect === s.slug) opt.selected = true;
      select.appendChild(opt);
    });
    const extra = document.createElement('option');
    extra.value = 'Каталог Б/У';
    extra.textContent = 'Покупка из каталога Б/У';
    select.appendChild(extra);
  }

  window.KWTForm = { initForm, fillServiceSelect };
})();
