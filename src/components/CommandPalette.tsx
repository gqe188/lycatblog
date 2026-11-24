import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  FileText,
  Camera,
  User,
  Home,
  Sun,
  Moon,
  ExternalLink,
  CornerDownLeft,
  Hash,
  X,
} from 'lucide-react';

interface SearchPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
}

interface CommandPaletteProps {
  posts: SearchPost[];
  galleryCount: number;
  githubUrl: string;
}

interface ActionItem {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  href?: string;
  action?: () => void;
  icon: 'home' | 'post' | 'gallery' | 'about' | 'theme' | 'github' | 'tag';
}

export default function CommandPalette({
  posts,
  galleryCount,
  githubUrl,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('lycat-theme', isDark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('lycat-theme-change', { detail: { isDark } }));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onCustomOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const items = useMemo<ActionItem[]>(() => {
    const navItems: ActionItem[] = [
      { id: 'nav-home', group: '页面导航', title: '首页 · Home', subtitle: '返回博客首页与概览', href: '/', icon: 'home' },
      { id: 'nav-posts', group: '页面导航', title: '文章归档 · Posts', subtitle: `全部 ${posts.length} 篇技术与随笔`, href: '/posts', icon: 'post' },
      { id: 'nav-gallery', group: '页面导航', title: '光影画廊 · Gallery', subtitle: `浏览 ${galleryCount} 幅摄影作品`, href: '/gallery', icon: 'gallery' },
      { id: 'nav-about', group: '页面导航', title: '关于作者 · About', subtitle: 'lycat && 475 · Web 安全 / AI / 二次元 / 摄影', href: '/about', icon: 'about' },
    ];

    const postItems: ActionItem[] = posts.map((p) => ({
      id: `post-${p.slug}`,
      group: '文章直达',
      title: p.title,
      subtitle: `${p.date} · ${p.category} · ${p.tags.join(' / ')}`,
      href: `/posts/${p.slug}`,
      icon: 'post',
    }));

    const quickItems: ActionItem[] = [
      {
        id: 'act-theme',
        group: '快捷操作',
        title: '切换明暗主题',
        subtitle: '晴空纸感 Light ↔ 暗房终端 Dark',
        action: toggleTheme,
        icon: 'theme',
      },
      {
        id: 'act-github',
        group: '快捷操作',
        title: '访问 GitHub 主页',
        subtitle: githubUrl,
        href: githubUrl,
        icon: 'github',
      },
    ];

    const all = [...postItems, ...navItems, ...quickItems];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.group.toLowerCase().includes(q)
    );
  }, [posts, galleryCount, githubUrl, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const executeItem = (item: ActionItem) => {
    setOpen(false);
    if (item.action) {
      item.action();
    } else if (item.href) {
      if (/^https?:\/\//.test(item.href)) {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.href;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault();
      executeItem(items[activeIndex]);
    }
  };

  if (!open) return null;

  const renderIcon = (icon: ActionItem['icon']) => {
    const cls = 'w-4 h-4 shrink-0';
    switch (icon) {
      case 'home': return <Home className={cls} />;
      case 'post': return <FileText className={cls} />;
      case 'gallery': return <Camera className={cls} />;
      case 'about': return <User className={cls} />;
      case 'theme': return <Sun className={cls} />;
      case 'github': return <ExternalLink className={cls} />;
      default: return <Hash className={cls} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="站内命令面板"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/95 dark:bg-[#111827]/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/70 dark:border-slate-800">
          <Search className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章、标签、画廊或切换主题..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="关闭搜索"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400 font-mono">
              404 // 未找到与 "{query}" 匹配的结果
            </div>
          ) : (
            items.map((item, idx) => {
              const prevGroup = idx > 0 ? items[idx - 1].group : null;
              const showGroup = item.group !== prevGroup;
              const active = idx === activeIndex;
              return (
                <React.Fragment key={item.id}>
                  {showGroup && (
                    <div className="px-3 pt-2.5 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {item.group}
                    </div>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => executeItem(item)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-sky-500/12 text-sky-700 dark:text-sky-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={active ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}>
                        {renderIcon(item.icon)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    {active && <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ 选择</span>
            <span>↵ 打开</span>
            <span>ESC 关闭</span>
          </div>
          <span className="flex items-center gap-1">
            <Moon className="w-3 h-3" /> lycat && 475
          </span>
        </div>
      </div>
    </div>
  );
}
