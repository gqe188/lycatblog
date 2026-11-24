/**
 * 把 Shiki 生成的 <pre> 包进一个带「窗口栏 + 语言名 + 复制按钮」的容器。
 * 构建期完成，零运行时依赖；复制功能由文章页的小脚本接管。
 */
const LANG_NAMES = { text: 'text', plain: 'text', js: 'javascript', ts: 'typescript', py: 'python', sh: 'shell', bash: 'shell' };

function el(tagName, properties = {}, children = []) {
  return { type: 'element', tagName, properties, children };
}

export default function rehypeCodeBlock() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'pre' && !child.properties?.dataWrapped) {
          const cls = [].concat(child.properties?.className ?? []);
          const code = child.children?.find((c) => c.tagName === 'code');
          const codeCls = [].concat(code?.properties?.className ?? []);
          let lang =
            child.properties?.dataLanguage ??
            codeCls.find((c) => String(c).startsWith('language-'))?.slice(9) ??
            (cls.includes('astro-code') ? 'text' : null);
          if (lang === null) return child;
          lang = LANG_NAMES[lang] ?? lang;
          child.properties.dataWrapped = true;
          return el('div', { className: ['code-block'] }, [
            el('div', { className: ['code-bar'] }, [
              el('span', { className: ['dots'], ariaHidden: 'true' }, [el('i'), el('i'), el('i')]),
              el('span', { className: ['lang'] }, [{ type: 'text', value: lang }]),
              el('button', { type: 'button', className: ['copy'], ariaLabel: '复制代码' }, [{ type: 'text', value: 'copy' }]),
            ]),
            child,
          ]);
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
