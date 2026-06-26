(function () {
  'use strict';

  const grid = document.getElementById('catalog-grid');
  const filter = document.getElementById('catalog-filter');
  if (!grid || !KWT.catalog) return;

  function render(items) {
    grid.innerHTML = items.map(item => KWTProducts.renderCard(item, 'каталог Б/У')).join('');
    KWTProducts.bindOrderButtons(grid, 'каталог Б/У');
    if (window.kwtObserveReveal) window.kwtObserveReveal(grid.querySelectorAll('.reveal'));
  }

  render(KWT.catalog);

  if (filter) {
    filter.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      filter.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      const type = btn.dataset.filter;
      const items = type === 'all' ? KWT.catalog : KWT.catalog.filter(i => i.type === type);
      render(items);
    });
  }
})();
