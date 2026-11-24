import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import galleryMeta from '../data/gallery-meta.json';

export const SITE = {
  name: 'lycatblog',
  title: 'lycat 的晴空日志',
  author: 'lycat',
  description: '在代码与天空之间 —— Web 安全、CTF、逆向、AI、二次元与摄影。',
  github: 'https://github.com/lycat475',
};

export const NAV = [
  { href: '/', label: '首页', en: 'home' },
  { href: '/posts/', label: '文章', en: 'posts' },
  { href: '/gallery/', label: '画廊', en: 'gallery' },
  { href: '/about/', label: '关于', en: 'about' },
];

export type Post = CollectionEntry<'posts'>;

export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(d: Date, style: 'long' | 'short' = 'long') {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return style === 'long' ? `${y}-${m}-${day}` : `${m}-${day}`;
}

/** 中文按字、英文按词估算阅读时长 */
export function readingTime(body = '') {
  const text = body.replace(/```[\s\S]*?```/g, (m) => m.slice(0, Math.min(m.length, 200)));
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const words = (text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9_]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

export function tagSlug(tag: string) {
  return encodeURIComponent(tag.toLowerCase());
}

export function allTags(posts: Post[]) {
  const map = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// ---------- gallery ----------
export type Photo = {
  file: string;
  src: ImageMetadata;
  category: string;
  title: string;
  index: number;
};

const photoModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/gallery/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

export const PHOTO_CATEGORIES = ['天空', '山水', '建筑', '生灵', '拾光'];

export function getPhotos(): Photo[] {
  const meta = galleryMeta as Record<string, { category?: string; title?: string } | string>;
  return Object.entries(photoModules)
    .map(([p, mod]) => {
      const file = p.split('/').pop()!;
      const m = typeof meta[file] === 'object' ? (meta[file] as { category?: string; title?: string }) : {};
      return { file, src: mod.default, category: m.category ?? '拾光', title: m.title ?? '' };
    })
    .sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }))
    .map((p, i) => ({ ...p, index: i + 1 }));
}
