(function () {
  'use strict';

  const isService = window.location.pathname.includes('/services/');
  const base = isService ? '../' : '';

  const homeHref = isService ? `${base}index.html` : '#home';
  const saleHref = isService ? `${base}index.html#sale` : '#sale';
  const catalogHref = isService ? `${base}index.html#catalog` : '#catalog';
  const requestHref = isService ? '#request-form' : '#request';

  const serviceLinks = Object.values(KWT.services)
    .filter(s => s.slug !== 'sale')
    .map(s => ({
      href: `${base}services/${s.slug}.html`,
      label: s.short,
      slug: s.slug
    }));

  const navItems = [
    { href: homeHref, label: 'Главная', id: 'home' },
    { href: saleHref, label: 'Продажа', id: 'sale' },
    ...serviceLinks.map(s => ({ href: s.href, label: s.label, id: s.slug })),
    { href: catalogHref, label: 'Каталог Б/У', id: 'catalog' }
  ];

  const currentPage = document.body.dataset.page || 'home';

  function navLink(item) {
    const active = currentPage === item.id ? ' nav__link--active' : '';
    return `<a href="${item.href}" class="nav__link${active}" data-nav="${item.id}">${item.label}</a>`;
  }

  const header = `
    <header class="header" id="header">
      <div class="container header__inner">
        <a href="${base}index.html" class="logo">
          <span class="logo__icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/></svg>
          </span>
          <span class="logo__text">
            <strong>KWT</strong>
            <small>Электротранспорт · Гомель</small>
          </span>
        </a>
        <nav class="nav" id="nav" aria-label="Основная навигация">
          ${navItems.map(navLink).join('')}
        </nav>
        <div class="header__actions">
          <a href="${KWT.phoneHref}" class="header__phone">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="2"/></svg>
            ${KWT.phone}
          </a>
          <a href="${KWT.telegram}" target="_blank" rel="noopener" class="btn btn--telegram btn--sm">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            Telegram
          </a>
          <button class="burger" id="burger" aria-label="Открыть меню" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>`;

  const footer = `
    <footer class="footer">
      <div class="container footer__inner">
        <div class="footer__brand">
          <a href="${base}index.html" class="logo logo--footer">
            <span class="logo__icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/></svg>
            </span>
            <span class="logo__text">
              <strong>KWT Service</strong>
              <small>Ремонт электротранспорта в Гомеле</small>
            </span>
          </a>
          <p class="footer__note">Цены на сайте носят информативный характер. Точную стоимость и наличие уточняйте по телефону или в Telegram.</p>
        </div>
        <div class="footer__links">
          <h4>Услуги</h4>
          ${serviceLinks.slice(0, 4).map(s => `<a href="${s.href}">${s.label}</a>`).join('')}
        </div>
        <div class="footer__links">
          <h4>Ещё</h4>
          ${serviceLinks.slice(4).map(s => `<a href="${s.href}">${s.label}</a>`).join('')}
          <a href="${catalogHref}">Каталог Б/У</a>
        </div>
        <div class="footer__links">
          <h4>Контакты</h4>
          <a href="${KWT.phoneHref}">${KWT.phone}</a>
          <a href="${KWT.telegram}" target="_blank" rel="noopener">Telegram</a>
          <a href="${KWT.mapUrl}" target="_blank" rel="noopener">Адрес на карте</a>
        </div>
      </div>
      <div class="footer__bottom">
        <div class="container">
          <p>© 2026 KWT Service · ${KWT.address} · Все цены в Br.</p>
        </div>
      </div>
    </footer>
    <div class="fab-group" aria-label="Быстрые действия">
      <button type="button" class="fab fab--top" id="fab-top" aria-label="Наверх">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="fab-row">
        <a href="${requestHref}" class="fab fab--request">Оставить заявку</a>
        <div class="fab-col">
          <a href="${KWT.phoneHref}" class="fab fab--phone" aria-label="Позвонить">
            <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="2"/></svg>
          </a>
          <a href="${KWT.telegram}" target="_blank" rel="noopener" class="fab fab--telegram" aria-label="Telegram">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
          </a>
        </div>
      </div>
    </div>`;

  const headerSlot = document.getElementById('site-header');
  const footerSlot = document.getElementById('site-footer');
  if (headerSlot) headerSlot.innerHTML = header;
  if (footerSlot) footerSlot.innerHTML = footer;
})();
