(function () {
  'use strict';

  const grid = document.getElementById('sale-grid');
  const filter = document.getElementById('sale-filter');
  if (!grid) return;

  let catalog = [];

  function render(items) {
    if (!items.length) {
      grid.innerHTML = '<p class="form-hint">Объявлений пока нет. Уточняйте наличие по телефону или в Telegram.</p>';
      return;
    }
    grid.innerHTML = items.map(item => KWTProducts.renderCard(item, 'продажа')).join('');
    KWTProducts.bindOrderButtons(grid, 'продажа');
    if (window.kwtObserveReveal) window.kwtObserveReveal(grid.querySelectorAll('.reveal'));
  }

  async function init() {
    grid.innerHTML = '<p class="form-hint">Загрузка объявлений…</p>';
    catalog = window.KWTListings
      ? await KWTListings.getSaleCatalog()
      : (KWT.saleCatalog || []);
    render(catalog);
  }

  init();

  if (filter) {
    filter.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      filter.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      const type = btn.dataset.filter;
      const items = type === 'all'
        ? catalog
        : catalog.filter(i => i.type === type);
      render(items);
    });
  }
})();
