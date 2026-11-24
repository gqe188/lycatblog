function configureSearch() {
  const dialog = document.querySelector('#search');
  if (!dialog?.showModal) return;
  const open = document.querySelector('[data-search-open]');
  const field = dialog.querySelector('input');
  const entries = [...dialog.querySelectorAll('[data-search-text]')];
  const empty = dialog.querySelector('[data-search-empty]');

  open.hidden = false;
  open.addEventListener('click', () => {
    dialog.showModal();
    field.focus();
  });
  dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  field.addEventListener('input', () => {
    const words = field.value.toLowerCase().trim().split(/\s+/);
    for (const entry of entries) {
      const text = entry.dataset.searchText.toLowerCase();
      entry.hidden = !words.every((word) => text.includes(word));
    }
    empty.hidden = entries.some((entry) => !entry.hidden);
  });
}

function configurePhotos() {
  const items = [...document.querySelectorAll('[data-photo]')];
  const filters = document.querySelector('[data-filters]');
  if (filters) {
    const buttons = [...filters.querySelectorAll('button')];
    const total = document.querySelector('[data-photo-total]');
    filters.hidden = false;
    for (const button of buttons) {
      button.addEventListener('click', () => {
        const category = button.dataset.filter;
        for (const candidate of buttons) candidate.setAttribute('aria-pressed', String(candidate === button));
        for (const item of items) item.hidden = Boolean(category && item.dataset.category !== category);
        total.textContent = `${items.filter((item) => !item.hidden).length} 张照片`;
      });
    }
  }

  const dialog = document.querySelector('#lightbox');
  if (!dialog?.showModal) return;
  const photo = dialog.querySelector('[data-view-image]');
  const title = dialog.querySelector('[data-view-title]');
  const count = dialog.querySelector('[data-view-count]');
  const original = dialog.querySelector('[data-view-original]');
  let visible = [];
  let active = 0;
  let origin;

  function show(index) {
    active = (index + visible.length) % visible.length;
    const link = visible[active];
    photo.src = link.href;
    photo.alt = link.dataset.alt;
    title.textContent = link.dataset.title;
    count.textContent = `${active + 1} / ${visible.length}`;
    original.href = link.href;
  }

  for (const item of items) {
    const link = item.querySelector('[data-view]');
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      visible = items.filter((candidate) => !candidate.hidden).map((candidate) => candidate.querySelector('[data-view]'));
      const index = visible.indexOf(link);
      if (index < 0) return;
      event.preventDefault();
      origin = link;
      show(index);
      dialog.showModal();
    });
  }

  dialog.querySelector('[data-view-close]').addEventListener('click', () => dialog.close());
  for (const button of dialog.querySelectorAll('[data-view-step]')) {
    button.addEventListener('click', () => show(active + Number(button.dataset.viewStep)));
  }
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(active + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  dialog.addEventListener('close', () => origin?.focus());
}

function configureCodeCopy() {
  if (!navigator.clipboard) return;
  for (const pre of document.querySelectorAll('#article pre')) {
    const code = pre.querySelector('code');
    if (!code) continue;
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrap';
    const button = document.createElement('button');
    button.className = 'copy';
    button.type = 'button';
    button.textContent = '复制代码';
    pre.replaceWith(wrapper);
    wrapper.append(pre, button);
    let reset;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = '已复制';
      } catch {
        button.textContent = '复制失败';
      }
      window.clearTimeout(reset);
      reset = window.setTimeout(() => { button.textContent = '复制代码'; }, 1400);
    });
  }
}

configureSearch();
configurePhotos();
configureCodeCopy();
