# lycatblog 🐱☁️

> 在代码与天空之间 —— lycat 的个人博客
>
> **本分支 `claude-opus-5.5` 由 Claude Opus 5.5 设计并搭建。**

Web 安全 / CTF / 逆向 / AI / 二次元 / 摄影。

## 设计

- **双主题「晴空 / 夜空」**：浅色是天蓝 + 樱粉的二次元晴空，深色是深靛 + 霓虹青 + 终端绿的 Hacker 夜空，跟随系统并可手动切换（记忆在 localStorage）。
- **首页**：站长自己的照片做头图（晴空主题用蓝天倒影，夜空主题用暮色山脊），叠加手绘电线杆剪影、打字机终端自我介绍和可以戳的看板猫。
- **看板猫 lycat**：原创矢量小猫，会眨眼、摇尾巴。
- **文章页**：目录与滚动高亮、阅读进度条、代码块窗口栏 + 一键复制、图片点击放大、上一篇 / 下一篇。
- **画廊**：瀑布流 + 分类筛选 + PhotoSwipe 灯箱，构建时自动生成多尺寸 WebP。
- **其它**：`Ctrl K` / `/` 站内搜索、标签页、RSS、sitemap、404 页面、控制台彩蛋（给 CTFer 的）。

## 技术栈

| 用途 | 选型 | 许可 |
| --- | --- | --- |
| 框架 | [Astro 7](https://astro.build)（纯静态输出） | MIT |
| 代码高亮 | Shiki + Catppuccin Latte / Mocha | MIT |
| 正文字体 | 霞鹜文楷 Screen（`lxgw-wenkai-screen-webfont`，按需分片加载） | OFL-1.1 |
| 代码字体 | JetBrains Mono（`@fontsource-variable`） | OFL-1.1 |
| 灯箱 | PhotoSwipe 5 | MIT |
| 图片处理 | sharp（Astro 内置图片优化） | Apache-2.0 |

图标与插画均为手写 SVG，无外部素材依赖。

## 内容从哪来

博客内容放在同级目录 **`../lycatblog-content`**（独立仓库，本工程只读不写）：

```
lycatblog-content/
├── about.md                     # 关于页：`- 键：值` 列表会被做成资料卡
├── gallery/*.jpg                # 画廊照片
└── posts/<slug>/<slug>.md       # 文章：首行 `# 标题`，第二行 `YYYY-MM-DD · 可选简介`
    └── assets/                  # 文章图片
```

`npm run dev` / `npm run build` 前会自动执行 `scripts/sync-content.mjs`，把内容复制到：

- `src/content/posts/<slug>/index.md`（自动补 frontmatter）
- `src/content/pages/about.md`
- `src/assets/gallery/`

同步结果也提交在仓库里，所以即使没有内容目录也能直接构建。用环境变量 `LYCAT_CONTENT` 可以指定别的内容路径。

原始 Markdown 里没有的元信息放在这里补充：

- `src/data/posts-meta.json` —— 每篇文章的标签、简介、封面
- `src/data/gallery-meta.json` —— 每张照片的分类和标题
- `src/data/interests.ts` —— 首页 / 关于页的兴趣卡片文案

## 命令

```bash
npm install
npm run dev       # 本地开发 http://localhost:4321
npm run build     # 构建到 dist/
npm run preview   # 预览构建结果
npm run sync      # 只同步内容
```

## 部署

`dist/` 是纯静态文件，可以直接放到 GitHub Pages / Cloudflare Pages / Vercel / Netlify 或任意静态服务器。
部署前把 `astro.config.mjs` 和 `public/robots.txt` 里的 `site` 改成真实域名。
