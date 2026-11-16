const initSiteHeader = (root = document) => {
  root.querySelectorAll('[data-site-header]').forEach((header) => {
    if (header.dataset.siteHeaderInit === 'true') return;
    header.dataset.siteHeaderInit = 'true';

    const mobileQuery = window.matchMedia('(max-width: 991.98px)');
    const navToggle = header.querySelector('[data-header-toggle]');
    const items = Array.from(header.querySelectorAll('[data-header-item]'));
    let closeTimer = null;

    const getSubToggle = (item) => item.querySelector('[data-header-sub-toggle]');

    const setItemOpen = (item, open) => {
      const toggle = getSubToggle(item);
      item.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
      if (!open) delete item.dataset.hoverOpen;
    };

    const closeItems = (except) => {
      items.forEach((item) => {
        if (item !== except && item.classList.contains('is-open')) setItemOpen(item, false);
      });
    };

    const setNavOpen = (open) => {
      if (!navToggle) return;
      navToggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('is-nav-open', open);
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

    mobileQuery.addEventListener('change', () => setNavOpen(false));
  });
};

initSiteHeader();
