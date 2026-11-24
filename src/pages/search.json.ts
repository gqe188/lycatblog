import type { APIRoute } from 'astro';
import { getPosts, formatDate } from '../lib/site';

const strip = (md = '') =>
  md
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/```\w*\n?/g, '')
    .replace(/[#>*_~`|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const docs = posts.map((p) => ({
    title: p.data.title,
    url: `/posts/${p.id}/`,
    date: formatDate(p.data.date),
    tags: p.data.tags,
    description: p.data.description ?? '',
    text: strip(p.body),
  }));
  return new Response(JSON.stringify(docs), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
