(function () {
  'use strict';

  const cfg = window.KWT_LISTINGS_CONFIG || {};
  let cache = null;

  function staticSaleCatalog() {
    return typeof KWT !== 'undefined' && Array.isArray(KWT.saleCatalog) ? KWT.saleCatalog : [];
  }

  function normalize(item) {
    return {
      id: item.id || 'admin-' + Date.now(),
      name: item.name || '',
      type: item.type || 'Самокат',
      badge: item.badge || 'продажа',
      price: item.price || '',
      image: item.image || '',
      remote: item.remote || '',
      specs: Array.isArray(item.specs) ? item.specs : [],
    };
  }

  async function fetchRemote() {
    if (!cfg.apiUrl) return { items: [], hidden: [] };
    try {
      const res = await fetch(cfg.apiUrl, { cache: 'no-store' });
      if (!res.ok) return { items: [], hidden: [] };
      const data = await res.json();
      if (Array.isArray(data)) {
        return { items: data.map(normalize), hidden: [] };
      }
      return {
        items: (data.items || []).map(normalize),
        hidden: data.hidden || [],
      };
    } catch {
      return { items: [], hidden: [] };
    }
  }

  async function getSaleCatalog() {
    if (cache) return cache;
    const { items: remote, hidden } = await fetchRemote();
    const hiddenSet = new Set(hidden);
    const remoteIds = new Set(remote.map(i => i.id));
    const local = staticSaleCatalog()
      .filter(i => !hiddenSet.has(i.id) && !remoteIds.has(i.id));
    cache = [...remote, ...local];
    return cache;
  }

  function invalidate() {
    cache = null;
  }

  window.KWTListings = { getSaleCatalog, invalidate, fetchRemote };
})();
