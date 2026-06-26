(function () {
  'use strict';

  function renderForm() {
    return `
      <form class="request-form reveal" id="request-form-el">
        <div class="form-row">
          <label class="form-field">
            <span>Ваше имя *</span>
            <input type="text" name="name" required placeholder="Иван">
          </label>
          <label class="form-field">
            <span>Телефон *</span>
            <input type="tel" name="phone" required placeholder="+375 (29) 000-00-00">
          </label>
        </div>
        <label class="form-field">
          <span>Услуга</span>
          <select name="service" id="form-service"></select>
        </label>
        <label class="form-field">
          <span>Сообщение</span>
          <textarea name="message" rows="4" placeholder="Опишите проблему или вопрос..."></textarea>
        </label>
        <button type="submit" class="btn btn--primary btn--lg">Отправить заявку</button>
        <p class="form-hint">Заявка откроется в Telegram — нажмите «Отправить» в мессенджере</p>
      </form>`;
  }

  const slug = document.body.dataset.service;
  const service = KWT.services[slug];
  if (!service) return;

  document.title = `${service.title} — KWT Service`;

  const main = document.getElementById('service-content');
  if (!main) return;

  main.innerHTML = `
    <section class="page-hero">
      <div class="container page-hero__inner">
        <div class="page-hero__content reveal">
          <a href="../index.html#services" class="breadcrumb">← Все услуги</a>
          <h1>${service.title}</h1>
          <p>${service.desc}</p>
          <div class="page-hero__actions">
            <a href="${KWT.phoneHref}" class="btn btn--primary">Позвонить</a>
            <a href="#request-form" class="btn btn--ghost">Оставить заявку</a>
          </div>
        </div>
        <div class="page-hero__image reveal">
          ${window.KWTAssets ? KWTAssets.imgHtml({ image: service.image, remote: service.remote, name: service.title }, { className: 'page-hero__img' }) : `<img src="../${service.image}" alt="${service.title}" width="480" height="480">`}
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="page-split">
          <div class="reveal">
            <span class="section__tag">Что входит</span>
            <h2 class="section__title">Что мы делаем</h2>
            <ul class="check-list">
              ${service.features.map(f => `<li><span class="check-list__mark">✓</span>${f}</li>`).join('')}
            </ul>
            <p class="price-note">${service.priceNote}</p>
          </div>
          <div class="info-card reveal">
            <h3>Контакты</h3>
            <div class="info-card__row"><span>Телефон</span><a href="${KWT.phoneHref}">${KWT.phone}</a></div>
            <div class="info-card__row"><span>Telegram</span><a href="${KWT.telegram}" target="_blank" rel="noopener">Написать</a></div>
            <div class="info-card__row"><span>Адрес</span><strong>${KWT.address}</strong></div>
            <div class="info-card__row"><span>График</span><strong>${KWT.hours}</strong></div>
            <div class="info-card__row"><span>Выходные</span><strong>${KWT.daysOff}</strong></div>
          </div>
        </div>
      </div>
    </section>

    ${slug === 'sale' ? `
    <section class="section">
      <div class="container">
        <div class="section__header reveal">
          <span class="section__tag">В наличии</span>
          <h2 class="section__title">Объявления</h2>
        </div>
        <div class="catalog-grid" id="sale-grid"></div>
      </div>
    </section>` : ''}

    ${slug === 'used' ? `
    <section class="section">
      <div class="container">
        <div class="section__header reveal">
          <span class="section__tag">Каталог</span>
          <h2 class="section__title">Б/У в наличии</h2>
        </div>
        <div class="catalog-grid" id="catalog-grid"></div>
      </div>
    </section>` : ''}

    <section class="section${slug === 'sale' || slug === 'used' ? '' : ' section--alt'}" id="request-form">
      <div class="container container--narrow">
        <div class="section__header section__header--center reveal">
          <span class="section__tag">Заявка</span>
          <h2 class="section__title">Оставить заявку</h2>
          <p class="section__desc">Заполните форму — мы свяжемся с вами для уточнения деталей</p>
        </div>
        ${renderForm()}
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <h2 class="section__title reveal" style="margin-bottom:24px">Другие услуги</h2>
        <div class="services-mini">
          ${Object.values(KWT.services)
            .filter(s => s.slug !== slug)
            .map(s => `
              <a href="${s.slug}.html" class="services-mini__item reveal">
                <strong>${s.short}</strong>
                <span>Подробнее →</span>
              </a>`).join('')}
        </div>
      </div>
    </section>`;

  KWTForm.initForm('request-form-el');
  KWTForm.fillServiceSelect('form-service', slug);

  if (slug === 'used') {
    const heroActions = main.querySelector('.page-hero__actions');
    if (heroActions) {
      const catalogBtn = document.createElement('a');
      catalogBtn.href = '../index.html#catalog';
      catalogBtn.className = 'btn btn--ghost';
      catalogBtn.textContent = 'Каталог Б/У';
      heroActions.appendChild(catalogBtn);
    }
  }

  if (slug === 'sale') {
    const grid = document.getElementById('sale-grid');
    if (grid) {
      (async () => {
        const catalog = window.KWTListings
          ? await KWTListings.getSaleCatalog()
          : (KWT.saleCatalog || []);
        grid.innerHTML = catalog.map(item => KWTProducts.renderCard(item, 'продажа')).join('');
        KWTProducts.bindOrderButtons(grid, 'продажа');
        if (window.kwtObserveReveal) window.kwtObserveReveal(grid.querySelectorAll('.reveal'));
      })();
    }
  }

  if (slug === 'used' && KWT.catalog) {
    const grid = document.getElementById('catalog-grid');
    if (grid) {
      grid.innerHTML = KWT.catalog.map(item => KWTProducts.renderCard(item, 'каталог Б/У')).join('');
      KWTProducts.bindOrderButtons(grid, 'каталог Б/У');
      if (window.kwtObserveReveal) window.kwtObserveReveal(grid.querySelectorAll('.reveal'));
    }
  }
})();
