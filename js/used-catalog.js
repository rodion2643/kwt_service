(function () {
  'use strict';

  const grid = document.getElementById('catalog-grid');
  const filter = document.getElementById('catalog-filter');
  if (!grid) return;

  let catalog = [];

  function render(items) {
    if (!items.length) {
      grid.innerHTML = '<p class="form-hint">Б/У позиций пока нет. Уточняйте наличие по телефону или в Telegram.</p>';
      return;
    }
    grid.innerHTML = items.map(item => KWTProducts.renderCard(item, 'каталог Б/У')).join('');
    KWTProducts.bindOrderButtons(grid, 'каталог Б/У');
    if (window.kwtObserveReveal) window.kwtObserveReveal(grid.querySelectorAll('.reveal'));
  }

  function updateCount(n) {
    const el = document.getElementById('used-count');
    if (!el) return;
    const word = n === 1 ? 'позиция' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'позиции' : 'позиций';
    el.textContent = `${n} ${word} — цены в белорусских рублях (Br)`;
  }

  function init() {
    if (window.KWTListings?.getUsedCatalogSync) {
      catalog = KWTListings.getUsedCatalogSync();
    } else if (typeof KWT !== 'undefined' && KWT.catalog) {
      catalog = KWT.catalog;
    } else {
      catalog = [];
    }
    updateCount(catalog.length);
    render(catalog);

    if (window.KWTListings?.getUsedCatalog) {
      KWTListings.getUsedCatalog().then(items => {
        catalog = items;
        updateCount(catalog.length);
        render(catalog);
      });
    }
  }

  init();

  if (filter) {
    filter.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      filter.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      const type = btn.dataset.filter;
      const items = type === 'all' ? catalog : catalog.filter(i => i.type === type);
      render(items);
    });
  }
})();
