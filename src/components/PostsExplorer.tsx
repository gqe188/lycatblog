import { useEffect, useMemo, useState } from 'react';
import { Search, Calendar, Clock, ArrowUpRight, Tag, X } from 'lucide-react';
import type { PostItem } from '../lib/content';

interface PostsExplorerProps {
  posts: PostItem[];
  tags: { name: string; count: number }[];
}

export default function PostsExplorer({ posts, tags }: PostsExplorerProps) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tag');
    if (t) setSelectedTag(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (selectedTag !== 'all' && !post.tags.includes(selectedTag)) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, query, selectedTag]);

  return (
    <div>
      {/* Search + Tag Bar */}
      <div className="surface-card rounded-2xl p-4 mb-8 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章标题、CTF 题名、关键词..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="清空搜索"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 mr-1">
            <Tag className="w-3.5 h-3.5" /> TAGS:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedTag === 'all'
                ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
            }`}
          >
            全部 ({posts.length})
          </button>
          {tags.map((t) => {
            const active = selectedTag === t.name;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTag(t.name)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                }`}
              >
                #{t.name} <span className="font-mono opacity-70">{t.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Article Cards */}
      {filtered.length === 0 ? (
        <div className="surface-card rounded-2xl py-16 text-center font-mono text-sm text-slate-500">
          未找到符合条件的文章，试试清空筛选条件。
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((post) => (
            <a
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group surface-card surface-card-hover rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-stretch"
            >
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-semibold">
                      {post.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readingMinutes} 分钟阅读 · {post.totalWords} 字
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {post.title}
                  </h2>

                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800/70">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-sky-600 dark:text-sky-400">
                    阅读全文
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>

              {post.coverImage ? (
                <div className="md:w-64 lg:w-72 shrink-0 rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-[16/10] md:aspect-auto">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="md:w-64 lg:w-72 shrink-0 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-[#0d1321] p-4 flex flex-col justify-between font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ml-1.5 text-[10px] text-slate-500">{post.slug}.md</span>
                  </div>
                  <div className="my-4 text-sky-300">
                    <span className="text-slate-500">&gt; </span>
                    console.log(<span className="text-rose-300">"Hello World"</span>)
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    DISPATCH // {post.date}
                  </div>
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
