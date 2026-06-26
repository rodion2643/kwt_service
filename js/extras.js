(function () {
  'use strict';

  const WISDOM = [
    'Если самокат не едет — возможно, он просто устал. Мы его разбудим.',
    'Зарядка 100% — главное, чтобы и вы тоже.',
    'Dualtron быстрый. Мастер — быстрее.',
    'Не лезь в контроллер без диагностики. Так говорит опыт (и гарантия).',
    'Лужа — законный конкурент любого IP65.',
    '«Сам починю» — фраза, после которой мы чаще всего и встречаемся.',
    'Тюнинг без тормозов — это уже экстрим, а не сервис.',
    'АКБ не бесконечная. Как и терпение к «ещё чуть-чуть и доеду».',
    'Скупка в любом состоянии. Да, даже после «я думал, проедет».',
    'Ninebot G30 — как кот: независимый, но без сервиса грустит.',
  ];

  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIdx = 0;
  let logoClicks = 0;
  let logoTimer = null;
  let turbo = false;

  function toast(msg, ms = 3200) {
    let el = document.getElementById('kwt-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kwt-toast';
      el.className = 'kwt-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('kwt-toast--show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('kwt-toast--show'), ms);
  }

  function serviceStatus() {
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = 11 * 60;
    const close = 19 * 60;
    const workDays = [3, 4, 5, 6, 0];

    if (!workDays.includes(day)) {
      return { open: false, label: 'Выходной — откроемся в среду в 11:00' };
    }
    if (mins < open) {
      const h = Math.floor((open - mins) / 60);
      const m = (open - mins) % 60;
      const wait = h ? `${h} ч ${m} мин` : `${m} мин`;
      return { open: false, label: `Откроемся через ${wait}` };
    }
    if (mins >= close) {
      return { open: false, label: 'Закрыто — ждём вас завтра с 11:00' };
    }
    const left = close - mins;
    const h = Math.floor(left / 60);
    const m = left % 60;
    const until = h ? `${h} ч ${m} мин` : `${m} мин`;
    return { open: true, label: `Сейчас открыто · ещё ${until}` };
  }

  function updateStatus() {
    const s = serviceStatus();
    const heroText = document.getElementById('status-text');
    const heroDot = document.getElementById('status-dot');
    const aboutText = document.getElementById('about-status-text');
    const aboutDot = document.getElementById('about-status-dot');

    if (heroText) heroText.textContent = s.label;
    if (aboutText) aboutText.textContent = s.open ? 'Сервис открыт' : 'Сервис закрыт';

    [heroDot, aboutDot].forEach(dot => {
      if (!dot) return;
      dot.classList.toggle('pulse-dot--closed', !s.open);
      dot.classList.toggle('about-card__dot--closed', !s.open);
      if (heroDot === dot) {
        dot.style.background = s.open ? '' : '#ef4444';
      }
    });
    if (aboutDot) {
      aboutDot.classList.toggle('about-card__dot--green', s.open);
    }
  }

  function initWisdom() {
    const track = document.getElementById('wisdom-track');
    if (!track) return;
    const items = [...WISDOM, ...WISDOM].map(t => `<span class="wisdom-ticker__item">${t}</span>`).join('');
    track.innerHTML = items;
  }

  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${pct}%`;
    }, { passive: true });
  }

  function getHeroScooterEl() {
    const photo = document.getElementById('hero-scooter-photo');
    if (photo && !photo.hidden) return photo;
    return document.getElementById('hero-scooter-svg');
  }

  function initSpeedo() {
    const val = document.getElementById('speedo-val');
    const speedo = document.getElementById('hero-speedo');
    if (!val || !speedo) return;

    let lastY = window.scrollY;
    let lastT = performance.now();
    let display = 0;

    window.addEventListener('scroll', () => {
      const now = performance.now();
      const dt = Math.max(now - lastT, 16);
      const dy = Math.abs(window.scrollY - lastY);
      const speed = Math.min(99, Math.round((dy / dt) * 120));
      lastY = window.scrollY;
      lastT = now;
      display = Math.max(display * 0.85, speed);
      val.textContent = Math.round(display);
      speedo.classList.toggle('hero__speedo--active', display > 8);
      const scooter = getHeroScooterEl();
      if (scooter && display > 35) {
        scooter.style.transform = `translateX(${Math.min(display * 0.4, 24)}px) rotate(${Math.min(display * 0.08, 6)}deg)`;
      } else if (scooter && !turbo) {
        scooter.style.transform = '';
      }
    }, { passive: true });
  }

  function initHeroTilt() {
    const visual = document.getElementById('hero-visual');
    if (!visual || window.matchMedia('(pointer: coarse)').matches) return;

    visual.addEventListener('mousemove', e => {
      if (turbo) return;
      const scooter = getHeroScooterEl();
      if (!scooter) return;
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      scooter.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) scale(1.02)`;
    });
    visual.addEventListener('mouseleave', () => {
      const scooter = getHeroScooterEl();
      if (scooter && !turbo) scooter.style.transform = '';
    });
  }

  function activateTurbo() {
    if (turbo) return;
    turbo = true;
    document.body.classList.add('turbo-mode');
    toast('🛴 NOS активирован! Максимальный тюнинг одобрен мастером');
    setTimeout(() => {
      turbo = false;
      document.body.classList.remove('turbo-mode');
    }, 5000);
  }

  function initEasterEggs() {
    document.addEventListener('keydown', e => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === KONAMI.length) {
          konamiIdx = 0;
          activateTurbo();
        }
      } else {
        konamiIdx = key === KONAMI[0] ? 1 : 0;
      }
    });

    document.addEventListener('click', e => {
      const logo = e.target.closest('.logo');
      if (!logo) return;
      logoClicks++;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(() => { logoClicks = 0; }, 1200);
      if (logoClicks === 5) {
        logoClicks = 0;
        toast('⚡ Секретный режим мастера: скидка на юмор — 100%');
        activateTurbo();
      }
    });

    const scooter = document.getElementById('hero-scooter');
    if (scooter) {
      let taps = 0;
      let tapTimer = null;
      scooter.addEventListener('click', () => {
        taps++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { taps = 0; }, 800);
        if (taps === 3) {
          taps = 0;
          toast('Бип-бип! Самокат готов к поездке. А вы — к ремонту? 😄');
        }
      });
      scooter.style.cursor = 'pointer';
    }
  }

  function initBackToTop() {
    const btn = document.getElementById('fab-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('fab--visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initPhoneCopy() {
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      link.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey) return;
        const num = link.textContent.trim();
        if (navigator.clipboard && window.matchMedia('(pointer: fine)').matches) {
          navigator.clipboard.writeText(num.replace(/\s/g, '')).catch(() => {});
          toast(`📋 ${num} — скопирован`);
        }
      });
    });
  }

  function initHeroPhoto() {
    const photo = document.getElementById('hero-scooter-photo');
    const svg = document.getElementById('hero-scooter-svg');
    if (!photo || !window.KWTAssets) return;
    photo.src = KWTAssets.url('img/scooter-hero.png');
    photo.onload = () => {
      photo.hidden = false;
      if (svg) svg.style.display = 'none';
    };
  }

  function init() {
    initWisdom();
    initHeroPhoto();
    updateStatus();
    setInterval(updateStatus, 60000);
    initScrollProgress();
    initSpeedo();
    initHeroTilt();
    initEasterEggs();
    initBackToTop();
    initPhoneCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
