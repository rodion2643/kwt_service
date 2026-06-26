(function () {
  'use strict';

  const cfg = window.KWT_LISTINGS_CONFIG || {};
  const CACHE_KEY = 'kwt_listings_cache_v2';
  const CACHE_TTL = cfg.cacheTtlMs || 120000;

  let remoteData = null;
  let fetchPromise = null;

  function staticSaleCatalog() {
    return typeof KWT !== 'undefined' && Array.isArray(KWT.saleCatalog) ? KWT.saleCatalog : [];
  }

  function staticUsedCatalog() {
    return typeof KWT !== 'undefined' && Array.isArray(KWT.catalog) ? KWT.catalog : [];
  }

  function itemCategory(item) {
    const cat = String(item.category || '').toLowerCase().trim();
    if (cat === 'used') return 'used';
    if (cat === 'sale') return 'sale';
    const badge = String(item.badge || '').toLowerCase().trim();
    if (badge === 'б/у' || badge === 'used' || badge === 'bu' || badge === 'b/u') return 'used';
    return 'sale';
  }

  function normalize(item) {
    const category = itemCategory(item);
    return {
      id: item.id || 'admin-' + Date.now(),
      name: item.name || '',
      type: item.type || 'Самокат',
      badge: item.badge || (category === 'used' ? 'Б/У' : 'продажа'),
      category,
      price: item.price || '',
      image: item.image || '',
      remote: item.remote || '',
      specs: Array.isArray(item.specs) ? item.specs : [],
    };
  }

  function readCache() {
    if (!cfg.apiUrl) return null;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.url !== cfg.apiUrl || Date.now() - parsed.t > CACHE_TTL) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    if (!cfg.apiUrl) return;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), url: cfg.apiUrl, data }));
    } catch { /* quota */ }
  }

  async function fetchRemoteFromNetwork() {
    if (!cfg.apiUrl) return { items: [], hidden: [] };
    const res = await fetch(cfg.apiUrl);
    if (!res.ok) return { items: [], hidden: [] };
    const data = await res.json();
    if (Array.isArray(data)) {
      return { items: data.map(normalize), hidden: [] };
    }
    return {
      items: (data.items || []).map(normalize),
      hidden: data.hidden || [],
    };
  }

  async function fetchRemote() {
    if (remoteData) return remoteData;
    const cached = readCache();
    if (cached) {
      remoteData = cached;
      return remoteData;
    }
    if (!fetchPromise) {
      fetchPromise = fetchRemoteFromNetwork()
        .then(data => {
          remoteData = data;
          writeCache(data);
          return data;
        })
        .finally(() => { fetchPromise = null; });
    }
    return fetchPromise;
  }

  function mergeCatalog(remote, hidden, staticItems) {
    const hiddenSet = new Set(hidden || []);
    const remoteIds = new Set(remote.map(i => i.id));
    const local = staticItems.filter(i => !hiddenSet.has(i.id) && !remoteIds.has(i.id));
    return [...remote, ...local];
  }

  function buildFromData(data, category) {
    const items = data?.items || [];
    const hidden = data?.hidden || [];
    const remote = items.filter(i => itemCategory(i) === category);
    const staticItems = category === 'used' ? staticUsedCatalog() : staticSaleCatalog();
    return mergeCatalog(remote, hidden, staticItems);
  }

  function getSaleCatalogSync() {
    return buildFromData(remoteData, 'sale');
  }

  function getUsedCatalogSync() {
    return buildFromData(remoteData, 'used');
  }

  async function getSaleCatalog() {
    await fetchRemote();
    return getSaleCatalogSync();
  }

  async function getUsedCatalog() {
    await fetchRemote();
    return getUsedCatalogSync();
  }

  function invalidate() {
    remoteData = null;
    try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
  }

  if (cfg.apiUrl) {
    const cached = readCache();
    if (cached) remoteData = cached;
    else fetchRemote();
  }

  window.KWTListings = {
    getSaleCatalog,
    getUsedCatalog,
    getSaleCatalogSync,
    getUsedCatalogSync,
    invalidate,
    fetchRemote,
  };
})();
