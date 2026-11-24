// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeCodeBlock from './src/lib/rehype-code-block.mjs';

// 部署前把 site 改成你的真实域名（RSS / sitemap / canonical 都依赖它）
export default defineConfig({
  site: 'https://lycat475.github.io',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    // 用 unified 处理器以便挂载自定义 rehype 插件；关闭 smartypants，保留 CTF 文本里的原始引号与 --
    processor: unified({ rehypePlugins: [rehypeCodeBlock], smartypants: false }),
    shikiConfig: {
      themes: { light: 'catppuccin-latte', dark: 'catppuccin-mocha' },
      defaultColor: false,
      langAlias: { plain: 'text' },
      wrap: false,
    },
  },
  image: {
    responsiveStyles: false,
  },
  devToolbar: { enabled: false },
});
