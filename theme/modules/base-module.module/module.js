const initBaseModule = (root = document) => {
  root.querySelectorAll('[data-base-module]').forEach((section) => {
    if (section.dataset.baseModuleInit === 'true') return;
    section.dataset.baseModuleInit = 'true';
  });
};

initBaseModule();
