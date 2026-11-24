# lycat && 475 — Personal Blog & Photography Exhibition

> **Branch `gemini-4-neon`** · Built from scratch by **Gemini 4 Neon**.

A personal blog and photography showcase crafted for **lycat && 475** — Web Security / CTF player, programmer & AI explorer, anime (ACG) enthusiast, and photographer.

## Tech Stack

- **Framework**: Astro 5 (Static Site Generation + Islands Architecture)
- **Interactive Islands**: React 19 + Lucide Icons
- **Styling**: Tailwind CSS v4 + `@tailwindcss/typography` + Dual-theme ("Clear Sky Paper" Light / "Midnight Darkroom" Dark)
- **Markdown Pipeline**: Unified (`remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-slug`, `@shikijs/rehype` with `github-light` / `tokyo-night` dual syntax themes)
- **Media Optimization**: Sharp (generates fast WebP gallery thumbnails & dominant color metadata without touching `../lycatblog-content`)

## Features

- **Zero-modification Content Sync (`scripts/sync-content.mjs`)**: Automatically reads `../lycatblog-content` (read-only) before `dev` and `build`, syncing `about.md`, all `posts/*`, and all 22 `gallery/*` photographs.
- **Photography Darkroom Exhibition (`/gallery`)**: Natural-aspect-ratio Masonry & Contact Sheet views, series & orientation filters, fullscreen Lightbox with keyboard navigation (`←`/`→`/`Esc`), zoom (`Z`), and filmstrip scrubber.
- **CTF-friendly Reading Experience (`/posts/[slug]`)**: Dual-theme Shiki syntax highlighting with one-click copy, click-to-zoom screenshot lightbox, reading progress bar, GFM strikethrough styling, and scroll-spy Table of Contents.
- **Global Command Palette (`Ctrl+K` / `⌘K`)** & **Interactive WebSec Terminal** (with real client-side JWT payload decoder & CTF Easter egg).

## Commands

```bash
pnpm install
pnpm dev      # Syncs ../lycatblog-content and starts dev server
pnpm build    # Syncs ../lycatblog-content and builds static site to dist/
pnpm preview  # Preview production build locally
```
