const SLIDER_DEFAULTS = {
  testimonial: [1, 1, 1, 1, 1],
  feature: [3, 3, 3, 2, 1],
  logo: [6, 5, 4, 3, 2]
};

const SLIDER_TIERS = ['desktop', 'largeLaptop', 'laptop', 'tablet', 'mobile'];

const getSlideCounts = (el, mode) => {
  const defaults = SLIDER_DEFAULTS[mode] || SLIDER_DEFAULTS.feature;
  return SLIDER_TIERS.map((tier, index) => {
    const key = `slides${tier.charAt(0).toUpperCase()}${tier.slice(1)}`;
    const value = parseFloat(el.dataset[key]);
    return Number.isFinite(value) && value > 0 ? value : defaults[index];
  });
};

const initSliders = (root = document) => {
  if (typeof Swiper === 'undefined') return;
  root.querySelectorAll('[data-slider]').forEach((el) => {
    if (el.dataset.sliderInit === 'true') return;
    const mode = el.dataset.slider || 'feature';
    const scope = el.closest('[data-slider-scope]') || el.parentElement;
    const slideCount = el.querySelectorAll('.swiper-slide').length;
    const [desktop, largeLaptop, laptop, tablet, mobile] = getSlideCounts(el, mode);
    const gap = parseFloat(getComputedStyle(el).getPropertyValue('--grid-gap')) || 0;
    const tierOptions = (perView) => ({ slidesPerView: perView, loop: slideCount > perView });
    const options = {
      watchOverflow: true,
      spaceBetween: gap,
      a11y: { enabled: true },
      ...tierOptions(mobile),
      breakpoints: {
        768: tierOptions(tablet),
        992: tierOptions(laptop),
        1201: tierOptions(largeLaptop),
        1367: tierOptions(desktop)
      }
    };
    const nextEl = scope.querySelector('[data-slider-next]');
    const prevEl = scope.querySelector('[data-slider-prev]');
    const paginationEl = scope.querySelector('[data-slider-pagination]');
    if (nextEl && prevEl) options.navigation = { nextEl, prevEl };
    if (paginationEl) options.pagination = { el: paginationEl, clickable: true };
    new Swiper(el, options);
    el.dataset.sliderInit = 'true';
  });
};

initSliders();

let resizeTimer = null;

const initSiteHeader = (root = document) => {
  root.querySelectorAll('[data-site-header]').forEach((header) => {
    if (header.dataset.siteHeaderInit === 'true') return;
    header.dataset.siteHeaderInit = 'true';

    const wrap = header.closest('.site-header-wrap');
    const isSticky = header.hasAttribute('data-sticky');
    if (isSticky && wrap) {
      wrap.classList.add('is-sticky');
      const setHeight = () => {
        if (header.classList.contains('is-nav-open')) return;
        document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
      };
      setHeight();
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(setHeight).observe(header);
      else window.addEventListener('resize', setHeight);
    }

    const mobileQuery = window.matchMedia('(max-width: 991.98px)');
    const navToggle = header.querySelector('[data-header-toggle]');
    const items = Array.from(header.querySelectorAll('[data-header-item]'));
    let closeTimer = null;

    const getSubToggle = (item) => item.querySelector('[data-header-sub-toggle]');
    const isMega = header.hasAttribute('data-mega');

    const syncMega = () => {
      header.classList.toggle('is-mega-open', isMega && !mobileQuery.matches && items.some((item) => item.classList.contains('is-open')));
    };

    const setItemOpen = (item, open) => {
      const toggle = getSubToggle(item);
      item.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
      if (!open) delete item.dataset.hoverOpen;
      syncMega();
    };

    const closeItems = (except) => {
      items.forEach((item) => {
        if (item !== except && item.classList.contains('is-open')) setItemOpen(item, false);
      });
    };

    const setPanelTop = () => {
      header.style.setProperty('--site-header-bottom', `${Math.max(0, Math.round(header.getBoundingClientRect().bottom))}px`);
    };

    const setNavOpen = (open) => {
      if (!navToggle) return;
      navToggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('is-nav-open', open);
      document.documentElement.classList.toggle('is-scroll-locked', open);
      if (open) setPanelTop();
      if (!open) closeItems();
    };

    if (navToggle) {
      navToggle.addEventListener('click', () => setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true'));
    }

    items.forEach((item) => {
      const toggle = getSubToggle(item);
      if (!toggle) return;

      toggle.addEventListener('click', () => {
        if (item.dataset.hoverOpen === 'true') {
          delete item.dataset.hoverOpen;
          return;
        }
        const open = !item.classList.contains('is-open');
        closeItems(item);
        setItemOpen(item, open);
      });

      item.addEventListener('mouseenter', () => {
        if (mobileQuery.matches) return;
        clearTimeout(closeTimer);
        closeItems(item);
        if (!item.classList.contains('is-open')) {
          setItemOpen(item, true);
          item.dataset.hoverOpen = 'true';
        }
      });

      item.addEventListener('mouseleave', () => {
        if (mobileQuery.matches) return;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => setItemOpen(item, false), 200);
      });

      item.addEventListener('focusout', (event) => {
        if (mobileQuery.matches || item.contains(event.relatedTarget)) return;
        setItemOpen(item, false);
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const focusInside = header.contains(document.activeElement);
      const openItem = items.find((item) => item.classList.contains('is-open'));
      if (openItem) {
        setItemOpen(openItem, false);
        const toggle = getSubToggle(openItem);
        if (focusInside && toggle) toggle.focus();
        return;
      }
      if (header.classList.contains('is-nav-open')) {
        setNavOpen(false);
        if (focusInside) navToggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (header.contains(event.target)) return;
      closeItems();
      if (header.classList.contains('is-nav-open')) setNavOpen(false);
    });

    mobileQuery.addEventListener('change', () => {
      setNavOpen(false);
      syncMega();
    });
    window.addEventListener('resize', () => {
      document.documentElement.classList.add('is-resizing');
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => document.documentElement.classList.remove('is-resizing'), 150);
      if (header.classList.contains('is-nav-open')) setPanelTop();
    });
  });
};

initSiteHeader();
