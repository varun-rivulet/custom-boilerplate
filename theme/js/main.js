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

const initNavToggles = (root = document) => {
  root.querySelectorAll('[data-nav-toggle]').forEach((button) => {
    if (button.dataset.navInit === 'true') return;
    const nav = document.getElementById(button.getAttribute('aria-controls'));
    if (!nav) return;
    const setOpen = (open) => {
      button.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.focus();
    });
    button.dataset.navInit = 'true';
  });
};

initSliders();
initNavToggles();
