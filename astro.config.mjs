// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeCodeBlock from './src/lib/rehype-code-block.mjs';
import remarkHtmlAsText from './src/lib/remark-html-as-text.mjs';

// 部署前把 site 改成你的真实域名（RSS / sitemap / canonical 都依赖它）
export default defineConfig({
  site: 'https://lycat475.github.io',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    // 用 unified 处理器以便挂载自定义插件；关闭 smartypants，保留 CTF 文本里的原始引号与 --
    // remarkHtmlAsText：正文里的裸 HTML（XSS payload 等）一律显示为文本，绝不执行
    processor: unified({ remarkPlugins: [remarkHtmlAsText], rehypePlugins: [rehypeCodeBlock], smartypants: false }),
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
  // CSP（以 <meta> 形式注入每个页面）：script-src 只允许本站文件 + 构建期自动计算 hash 的内联脚本。
  // 防主题闪烁脚本放在 public/theme-init.js，由 'self' 覆盖，无需手动维护 hash。
  // style-src 放行 'unsafe-inline'，因为 Shiki 代码高亮依赖内联样式（Astro 官方说明的限制）；
  // font-src 放行 data:，因为 Vite 会把很小的字体分片内联成 data URI。
  security: {
    csp: {
      directives: ["default-src 'self'", "img-src 'self' data:", "font-src 'self' data:", "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"],
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  devToolbar: { enabled: false },
});
