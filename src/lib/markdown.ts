import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';

export interface TocHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  headings: TocHeading[];
}

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, any>;
  children?: HastNode[];
}

function getTextContent(node: HastNode): string {
  if (node.type === 'text' && typeof node.value === 'string') return node.value;
  if (!Array.isArray(node.children)) return '';
  return node.children.map(getTextContent).join('');
}

function walkHast(node: HastNode, visitor: (n: HastNode, parent?: HastNode, idx?: number) => void, parent?: HastNode, idx?: number) {
  visitor(node, parent, idx);
  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      walkHast(node.children[i], visitor, node, i);
    }
  }
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  // Normalize ```plain fences to ```text for universal Shiki support
  const normalized = markdown.replace(/^```plain\b/gm, '```text');
  const headings: TocHeading[] = [];

  const rehypeCollectAndEnhance = () => (tree: HastNode) => {
    walkHast(tree, (node, parent, index) => {
      if (node.type !== 'element') return;

      // Collect H2-H4 headings for TOC
      if (node.tagName === 'h2' || node.tagName === 'h3' || node.tagName === 'h4') {
        const depth = Number(node.tagName.slice(1));
        const slug = String(node.properties?.id || '');
        const text = getTextContent(node).trim();
        if (slug && text) {
          headings.push({ depth, slug, text });
        }
      }

      // Enhance images for click-to-zoom lightbox
      if (node.tagName === 'img') {
        node.properties = {
          ...(node.properties || {}),
          loading: 'lazy',
          decoding: 'async',
          'data-zoomable': 'true',
          className: ['article-zoom-img'],
        };
      }

      // Wrap Shiki <pre> blocks in an editorial terminal code frame with copy button
      if (
        node.tagName === 'pre' &&
        parent &&
        typeof index === 'number' &&
        parent.properties?.['data-code-frame'] !== 'true'
      ) {
        const codeChild = node.children?.find((c) => c.tagName === 'code');
        const classList = Array.isArray(codeChild?.properties?.className)
          ? codeChild?.properties?.className
          : [];
        const langClass = classList.find((c: string) => String(c).startsWith('language-'));
        const rawLang = langClass
          ? String(langClass).replace('language-', '')
          : String(node.properties?.['data-language'] || 'text');
        const displayLang = rawLang === 'text' || rawLang === 'plaintext' ? 'PLAIN' : rawLang.toUpperCase();

        const wrapper: HastNode = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['code-frame'],
            'data-code-frame': 'true',
          },
          children: [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['code-frame-header'] },
              children: [
                {
                  type: 'element',
                  tagName: 'div',
                  properties: { className: ['code-frame-dots'] },
                  children: [
                    { type: 'element', tagName: 'span', properties: { className: ['dot-r'] }, children: [] },
                    { type: 'element', tagName: 'span', properties: { className: ['dot-y'] }, children: [] },
                    { type: 'element', tagName: 'span', properties: { className: ['dot-g'] }, children: [] },
                    {
                      type: 'element',
                      tagName: 'span',
                      properties: { className: ['code-frame-lang'] },
                      children: [{ type: 'text', value: displayLang }],
                    },
                  ],
                },
                {
                  type: 'element',
                  tagName: 'button',
                  properties: {
                    type: 'button',
                    className: ['code-copy-btn'],
                    'data-copy-code': 'true',
                    'aria-label': '复制代码',
                  },
                  children: [{ type: 'text', value: 'Copy' }],
                },
              ],
            },
            node,
          ],
        };

        parent.children![index] = wrapper;
      }

      // Open external links in new tab safely
      if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
        if (/^https?:\/\//i.test(node.properties.href)) {
          node.properties.target = '_blank';
          node.properties.rel = 'noopener noreferrer';
        }
      }
    });
  };

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeShiki, {
      themes: {
        light: 'github-light',
        dark: 'tokyo-night',
      },
      defaultColor: false,
      addLanguageClass: true,
    })
    .use(rehypeCollectAndEnhance)
    .use(rehypeStringify)
    .process(normalized);

  return {
    html: String(file),
    headings,
  };
}
