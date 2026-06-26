(function () {
  'use strict';

  function renderCard(item, orderLabel) {
    const badge = item.badge ? `<span class="catalog-card__badge">${item.badge}</span>` : '';
    const specs = item.specs ? `
      <ul class="catalog-card__specs">
        ${item.specs.map(s => `<li>${s}</li>`).join('')}
      </ul>` : '';
    const meta = item.specs ? '' : `
      <ul class="catalog-card__meta">
        <li><span>Год</span><strong>${item.year || '—'}</strong></li>
        <li><span>Состояние</span><strong>${item.condition || '—'}</strong></li>
        <li><span>АКБ</span><strong>${item.battery || '—'}</strong></li>
      </ul>`;

    const img = window.KWTAssets
      ? KWTAssets.imgHtml(item, { className: '' })
      : `<img src="${item.image}" alt="${item.name}" loading="lazy">`;

    return `
      <article class="catalog-card reveal${item.badge === 'Б/У' ? ' catalog-card--used' : ''}" data-type="${item.type}">
        <div class="catalog-card__image">
          ${img}
        </div>
        <div class="catalog-card__body">
          <div class="catalog-card__head">
            <span class="catalog-card__type">${item.type}</span>
            ${badge}
          </div>
          <h3>${item.name}</h3>
          ${specs}
          <div class="catalog-card__footer">
            <span class="catalog-card__price">${item.price}</span>
            <button type="button" class="btn btn--primary btn--sm catalog-order"
              data-name="${item.name}" data-price="${item.price}" data-label="${orderLabel}">Заказать</button>
          </div>
        </div>
      </article>`;
  }

  function bindOrderButtons(container, defaultLabel) {
    container.querySelectorAll('.catalog-order').forEach(btn => {
      btn.addEventListener('click', () => {
        const label = btn.dataset.label || defaultLabel;
        const text = `Здравствуйте! Интересует ${btn.dataset.name} (${btn.dataset.price}) — ${label} на сайте KWT Service.`;
        window.open(`${KWT.telegram}?text=${encodeURIComponent(text)}`, '_blank');
      });
    });
  }

  window.KWTProducts = { renderCard, bindOrderButtons };
})();
