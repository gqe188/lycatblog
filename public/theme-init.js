// 在首屏渲染前确定主题，防止明暗闪烁（由 <head> 同步加载）
(() => {
  let t = null;
  try {
    t = localStorage.getItem('lycat-theme');
  } catch {}
  if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
})();
