(function () {
  'use strict';

  const REMOTE_BASE = 'https://kwtservice.com/php/';

  /** GitHub Pages: username.github.io/repo-name/ */
  function detectBasePath() {
    const meta = document.querySelector('meta[name="kwt-base"]');
    if (meta && meta.content) return meta.content.replace(/\/?$/, '/');

    const { hostname, pathname } = window.location;
    if (hostname.endsWith('github.io')) {
      const seg = pathname.split('/').filter(Boolean)[0];
      if (seg && !seg.includes('.')) return `/${seg}/`;
    }
    return '';
  }

  const basePath = detectBasePath();

  function url(localPath) {
    if (!localPath) return '';
    if (/^https?:\/\//i.test(localPath)) return localPath;
    const clean = localPath.replace(/^\.\//, '').replace(/^\//, '');
    return `${basePath}${clean}`;
  }

  function remote(remotePath) {
    if (!remotePath) return '';
    if (/^https?:\/\//i.test(remotePath)) return remotePath;
    return REMOTE_BASE + remotePath.replace(/^\//, '');
  }

  function driveImageUrl(raw) {
    if (!raw || !/drive\.google\.com|googleusercontent\.com/i.test(raw)) return raw;
    const m = raw.match(/[?&]id=([^&]+)/) || raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) return raw;
    return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1400`;
  }

  function imgSrc(item) {
    const raw = item.image || item.img || '';
    if (/^https?:\/\//i.test(raw)) return driveImageUrl(raw);
    return url(raw);
  }

  function imgFallback(item) {
    return item.remote || item.remoteImage ? remote(item.remote || item.remoteImage) : '';
  }

  function imgHtml(item, opts) {
    const alt = opts?.alt || item.name || item.title || '';
    const cls = opts?.className || '';
    const src = imgSrc(item);
    const fb = imgFallback(item);
    const raw = item.image || item.img || '';
    const driveId = (raw.match(/[?&]id=([^&]+)/) || raw.match(/\/d\/([a-zA-Z0-9_-]+)/))?.[1];
    const driveAlt = driveId ? `https://lh3.googleusercontent.com/d/${driveId}=w1400` : '';
    let onerr = '';
    if (driveAlt && fb) {
      onerr = ` onerror="if(this.dataset.s!=='1'){this.dataset.s='1';this.src='${driveAlt.replace(/'/g, "\\'")}';}else if(this.dataset.s!=='2'){this.dataset.s='2';this.src='${fb.replace(/'/g, "\\'")}';}"`;
    } else if (driveAlt) {
      onerr = ` onerror="if(this.dataset.s!=='1'){this.dataset.s='1';this.src='${driveAlt.replace(/'/g, "\\'")}';}"`;
    } else if (fb) {
      onerr = ` onerror="if(this.dataset.s!=='1'){this.dataset.s='1';this.src='${fb.replace(/'/g, "\\'")}';}"`;
    }
    return `<img src="${src}" alt="${alt.replace(/"/g, '&quot;')}" class="${cls}" loading="lazy"${onerr}>`;
  }

  window.KWTAssets = { basePath, url, remote, imgSrc, imgFallback, imgHtml, driveImageUrl };
})();
