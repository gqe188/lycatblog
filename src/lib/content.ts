import fs from 'node:fs';
import path from 'node:path';

export interface PostItem {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  coverImage: string | null;
  totalWords: number;
  readingMinutes: number;
  markdown: string;
}

export interface GalleryPhoto {
  id: string;
  index: number;
  frameCode: string;
  filename: string;
  title: string;
  series: 'landscape' | 'sky' | 'life' | 'urban' | string;
  seriesLabel: string;
  mood: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait' | 'square';
  aspectLabel: string;
  dominantHex: string;
  src: string;
  thumb: string;
}

export interface AboutData {
  raw: string;
  author: string;
  focus: string;
  github: string;
}

export interface SiteContent {
  syncedAt: string;
  about: AboutData;
  posts: PostItem[];
  gallery: GalleryPhoto[];
}

let cachedContent: SiteContent | null = null;

export function getSiteContent(): SiteContent {
  if (cachedContent) return cachedContent;
  const jsonPath = path.join(process.cwd(), 'src', 'generated', 'content.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  cachedContent = JSON.parse(raw) as SiteContent;
  return cachedContent;
}

export function getAllPosts(): PostItem[] {
  return getSiteContent().posts;
}

export function getPostBySlug(slug: string): PostItem | undefined {
  return getSiteContent().posts.find((p) => p.slug === slug);
}

export function getAllGalleryPhotos(): GalleryPhoto[] {
  return getSiteContent().gallery;
}

export function getAboutData(): AboutData {
  return getSiteContent().about;
}

export function getAllTags(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}
