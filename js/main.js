(function () {
  'use strict';

  const header = document.getElementById('header');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  if (header) {
    function onScroll() {
      header.classList.toggle('header--scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('nav--open');
      burger.classList.toggle('burger--active', open);
      burger.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        burger.classList.remove('burger--active');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.06}s`;
    revealObserver.observe(el);
  });

  // Подсветка пункта меню при скролле (только на главной)
  if (document.body.dataset.page === 'home') {
    const navLinks = document.querySelectorAll('.nav__link[data-nav]');
    const sections = document.querySelectorAll('section[id]');

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('nav__link--active', link.dataset.nav === id);
        });
      });
    }, { root: null, rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(section => sectionObserver.observe(section));

    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  window.kwtObserveReveal = function (elements) {
    const list = elements instanceof NodeList ? [...elements] : (Array.isArray(elements) ? elements : [elements]);
    list.forEach(el => {
      if (!el || !el.classList.contains('reveal')) return;
      revealObserver.observe(el);
    });
  };
})();
