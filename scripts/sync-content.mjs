#!/usr/bin/env node
/**
 * 内容同步脚本 —— 把 lycatblog-content 里的原始内容「只读地」复制进博客工程。
 *
 *   源目录（默认 ../lycatblog-content，可用环境变量 LYCAT_CONTENT 覆盖）：
 *     about.md                    → src/content/pages/about.md
 *     posts/<slug>/<slug>.md      → src/content/posts/<slug>/index.md（自动补 frontmatter）
 *     posts/<slug>/assets/*       → src/content/posts/<slug>/assets/*
 *     gallery/*.{jpg,png,webp}    → src/assets/gallery/*
 *
 *   原始 Markdown 没有 frontmatter，约定格式为：
 *     # 标题
 *     2026-10-26 · 可选的一句话简介
 *     正文……
 *
 *   额外的元信息（标签、简介、封面）写在 src/data/posts-meta.json 里，按 slug 合并。
 *   本脚本绝不会写入源目录。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(root, process.env.LYCAT_CONTENT ?? '../lycatblog-content');

if (!fs.existsSync(src)) {
  console.log(`[sync] 未找到内容目录 ${src}，跳过同步（使用仓库内已有内容）。`);
  process.exit(0);
}

const out = {
  posts: path.join(root, 'src/content/posts'),
  pages: path.join(root, 'src/content/pages'),
  gallery: path.join(root, 'src/assets/gallery'),
};
const postsMeta = readJson(path.join(root, 'src/data/posts-meta.json'));

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

/** YAML 安全的字符串 */
const q = (s) => JSON.stringify(String(s));

/** 去掉 Markdown 行内强调符号，用于标题 */
const plain = (s) => s.replace(/\*\*|__|\*|_|`/g, '').trim();

function toFrontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      if (typeof v[0] === 'object') {
        lines.push(`${k}:`);
        for (const item of v) {
          const entries = Object.entries(item);
          entries.forEach(([ik, iv], i) => lines.push(`${i === 0 ? '  - ' : '    '}${ik}: ${q(iv)}`));
        }
      } else {
        lines.push(`${k}: [${v.map(q).join(', ')}]`);
      }
    } else if (typeof v === 'boolean') {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${q(v)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

/** 拆出 `# 标题` 与紧随其后的 `日期 · 简介` 行 */
function parseHeader(md) {
  const lines = md.replace(/^﻿/, '').replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  const skipBlank = () => {
    while (i < lines.length && !lines[i].trim()) i++;
  };
  skipBlank();
  let title;
  const h1 = lines[i]?.match(/^#\s+(.+)$/);
  if (h1) {
    title = plain(h1[1]);
    i++;
    skipBlank();
  }
  let date;
  let subtitle;
  const dl = lines[i]?.match(/^\s*(\d{4}-\d{2}-\d{2})(?:\s*[·•|\-—]\s*(.+))?\s*$/);
  if (dl) {
    date = dl[1];
    subtitle = dl[2]?.trim();
    i++;
  }
  return { title, date, subtitle, body: lines.slice(i).join('\n').replace(/^\n+/, '') };
}

/** 第一段正文作为兜底简介 */
function excerpt(body, len = 90) {
  const text = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/^#+\s.*$/gm, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[*_~`>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > len ? `${text.slice(0, len)}…` : text;
}

// ---------- posts ----------
resetDir(out.posts);
const postsDir = path.join(src, 'posts');
let postCount = 0;
for (const slug of fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : []) {
  const dir = path.join(postsDir, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  const mdFile = fs.existsSync(path.join(dir, `${slug}.md`))
    ? `${slug}.md`
    : fs.readdirSync(dir).find((f) => f.endsWith('.md'));
  if (!mdFile) continue;

  const { title, date, subtitle, body } = parseHeader(fs.readFileSync(path.join(dir, mdFile), 'utf8'));
  const meta = postsMeta[slug] ?? {};
  const stat = fs.statSync(path.join(dir, mdFile));

  // 相对图片统一写成 ./ 开头，交给 Astro 做图片优化
  const fixedBody = body.replace(/(!\[[^\]]*]\()(?!\.{0,2}\/|https?:|data:)([^)\s]+)/g, '$1./$2');

  const fm = toFrontmatter({
    title: meta.title ?? title ?? slug,
    date: meta.date ?? date ?? stat.mtime.toISOString().slice(0, 10),
    description: meta.description ?? subtitle ?? excerpt(fixedBody),
    tags: meta.tags ?? [],
    cover: meta.cover,
    draft: meta.draft,
  });

  const dest = path.join(out.posts, slug);
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'index.md'), fm + fixedBody.trimEnd() + '\n');
  const assets = path.join(dir, 'assets');
  if (fs.existsSync(assets)) fs.cpSync(assets, path.join(dest, 'assets'), { recursive: true });
  postCount++;
}

// ---------- about ----------
resetDir(out.pages);
const aboutFile = path.join(src, 'about.md');
if (fs.existsSync(aboutFile)) {
  const { title, body } = parseHeader(fs.readFileSync(aboutFile, 'utf8'));
  // `- 键：值` 形式的列表项提取成资料卡字段，其余内容保留为正文
  const fields = [];
  const rest = body
    .split('\n')
    .filter((line) => {
      const m = line.match(/^\s*[-*]\s*([^：:]{1,12})[：:]\s*(.+)$/);
      if (m) {
        fields.push({ k: m[1].trim(), v: m[2].trim() });
        return false;
      }
      return true;
    })
    .join('\n')
    .trim();
  fs.writeFileSync(path.join(out.pages, 'about.md'), toFrontmatter({ title: title ?? '关于', fields }) + rest + '\n');
}

// ---------- gallery ----------
resetDir(out.gallery);
const galleryDir = path.join(src, 'gallery');
let photoCount = 0;
for (const f of fs.existsSync(galleryDir) ? fs.readdirSync(galleryDir) : []) {
  if (!/\.(jpe?g|png|webp|avif)$/i.test(f)) continue;
  fs.copyFileSync(path.join(galleryDir, f), path.join(out.gallery, f));
  photoCount++;
}

console.log(`[sync] ${src} → 文章 ${postCount} 篇，照片 ${photoCount} 张，关于页 ${fs.existsSync(aboutFile) ? '✓' : '✗'}`);
