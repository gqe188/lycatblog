/**
 * 安全处理：把 Markdown 正文里「代码块之外」的裸 HTML 当成普通文本显示。
 *
 * 站长写 Web 安全 / CTF writeup，正文里很可能直接出现
 * `<script>alert(1)</script>`、`<img src=x onerror=...>` 这类 payload。
 * 默认的 Markdown 管线会把它们当真 HTML 渲染（会执行或弄乱页面）；
 * 直接禁用 / 净化又会让 payload 从文章里消失。所以这里选择「原样显示为文本」。
 *
 * 白名单：不带任何属性的少量排版标签（<kbd> <br> <sup> 等）和 HTML 注释照常生效。
 * 代码块与行内代码本来就是文本，不受影响。
 */
const SAFE_TAG = /^<\/?(br|kbd|sup|sub|mark|u|s|del|ins|small|details|summary)\s*\/?>$/i;
const COMMENT = /^<!--[\s\S]*-->$/;
const BLOCK_PARENTS = new Set(['root', 'blockquote', 'listItem', 'footnoteDefinition']);

export default function remarkHtmlAsText() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'html') {
          const value = child.value.trim();
          if (SAFE_TAG.test(value) || COMMENT.test(value)) return child;
          const text = { type: 'text', value: child.value, position: child.position };
          return BLOCK_PARENTS.has(node.type) ? { type: 'paragraph', children: [text], position: child.position } : text;
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
