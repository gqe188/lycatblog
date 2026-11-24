import { useEffect, useMemo, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  LayoutGrid,
  Columns3,
  Aperture,
  Maximize2,
} from 'lucide-react';
import type { GalleryPhoto } from '../lib/content';

interface GalleryExhibitionProps {
  photos: GalleryPhoto[];
}

const SERIES_TABS = [
  { key: 'all', label: '全部作品' },
  { key: 'landscape', label: '山水荷风' },
  { key: 'sky', label: '苍穹流云' },
  { key: 'life', label: '生灵静物' },
  { key: 'urban', label: '城隅烟火' },
];

const ORIENTATION_FILTERS = [
  { key: 'all', label: '全部画幅' },
  { key: 'landscape', label: '横幅' },
  { key: 'portrait', label: '竖幅' },
  { key: 'square', label: '方形' },
];

export default function GalleryExhibition({ photos }: GalleryExhibitionProps) {
  const [series, setSeries] = useState<string>('all');
  const [orientation, setOrientation] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'masonry' | 'sheet'>('masonry');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      if (series !== 'all' && p.series !== series) return false;
      if (orientation !== 'all' && p.orientation !== orientation) return false;
      return true;
    });
  }, [photos, series, orientation]);

  // Distribute photos across 3 balanced masonry columns (preserving left-to-right visual flow & eager above-fold loading)
  const masonryColumns = useMemo(() => {
    const cols: { photo: GalleryPhoto; idx: number }[][] = [[], [], []];
    const heights = [0, 0, 0];
    filtered.forEach((photo, idx) => {
      let minCol = 0;
      if (heights[1] < heights[minCol]) minCol = 1;
      if (heights[2] < heights[minCol]) minCol = 2;
      cols[minCol].push({ photo, idx });
      heights[minCol] += photo.height / Math.max(1, photo.width);
    });
    return cols;
  }, [filtered]);

  // Open photo directly if URL hash has #photo=p22
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/photo=([a-zA-Z0-9_-]+)/);
    if (match) {
      const idx = photos.findIndex((p) => p.id === match[1]);
      if (idx >= 0) {
        setSeries('all');
        setOrientation('all');
        setActiveIndex(idx);
      }
    }
  }, [photos]);

  const activePhoto = activeIndex !== null ? filtered[activeIndex] : null;

  useEffect(() => {
    if (activeIndex === null) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
        setZoomed(false);
      } else if (e.key === 'ArrowRight') {
        setZoomed(false);
        setActiveIndex((prev) => (prev === null ? null : (prev + 1) % filtered.length));
      } else if (e.key === 'ArrowLeft') {
        setZoomed(false);
        setActiveIndex((prev) =>
          prev === null ? null : (prev - 1 + filtered.length) % filtered.length
        );
      } else if (e.key.toLowerCase() === 'z') {
        setZoomed((z) => !z);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeIndex, filtered.length]);

  const countForSeries = (key: string) =>
    key === 'all' ? photos.length : photos.filter((p) => p.series === key).length;

  return (
    <div>
      {/* Control Toolbar */}
      <div className="surface-card rounded-2xl p-3.5 sm:p-4 mb-8 flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Series filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SERIES_TABS.map((tab) => {
            const active = series === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSeries(tab.key);
                  setActiveIndex(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[11px] ${
                    active ? 'opacity-80' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {countForSeries(tab.key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orientation + View mode */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-200/70 dark:border-slate-800">
          <div className="inline-flex items-center rounded-xl bg-slate-100/90 dark:bg-slate-800/70 p-1">
            {ORIENTATION_FILTERS.map((opt) => {
              const active = orientation === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setOrientation(opt.key);
                    setActiveIndex(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center rounded-xl bg-slate-100/90 dark:bg-slate-800/70 p-1">
            <button
              type="button"
              onClick={() => setViewMode('masonry')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'masonry'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="瀑布流视图"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">瀑布流</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sheet')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'sheet'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="胶片联系表视图"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">联系表</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="surface-card rounded-2xl py-20 text-center">
          <Aperture className="w-8 h-8 mx-auto text-slate-400 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            当前筛选条件下暂无作品，请切换画幅或系列。
          </p>
        </div>
      ) : viewMode === 'masonry' ? (
        /* Balanced Masonry Exhibition */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {masonryColumns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-5">
              {col.map(({ photo, idx }) => (
                <figure
                  key={photo.id}
                  onClick={() => {
                    setZoomed(false);
                    setActiveIndex(idx);
                  }}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/90 bg-slate-100 dark:bg-slate-900 cursor-zoom-in shadow-xs hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: photo.dominantHex }}
                >
                  <img
                    src={photo.thumb}
                    alt={photo.title}
                    width={photo.width}
                    height={photo.height}
                    loading={idx < 12 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-auto block transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  {/* Subtle viewfinder corner hint on hover */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent flex flex-col justify-between p-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950/60 backdrop-blur-md text-[11px] font-mono text-white/90 border border-white/15">
                        {photo.frameCode} · {photo.aspectLabel}
                      </span>
                      <span className="p-1.5 rounded-full bg-slate-950/55 backdrop-blur-md text-white/90 border border-white/15">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2 text-white">
                      <div>
                        <figcaption className="text-sm font-semibold tracking-tight">
                          {photo.title}
                        </figcaption>
                        <p className="text-xs text-slate-200/85 mt-0.5">
                          {photo.seriesLabel} · {photo.mood}
                        </p>
                      </div>
                      <span
                        className="w-3 h-3 rounded-full border border-white/60 shrink-0 mb-1"
                        style={{ backgroundColor: photo.dominantHex }}
                        title={`主色调 ${photo.dominantHex}`}
                      />
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Contact Sheet Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((photo, idx) => (
            <article
              key={photo.id}
              onClick={() => {
                setZoomed(false);
                setActiveIndex(idx);
              }}
              className="group surface-card surface-card-hover rounded-2xl overflow-hidden cursor-zoom-in flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-950/5 dark:bg-slate-950/60 flex items-center justify-center p-3">
                <img
                  src={photo.thumb}
                  alt={photo.title}
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-950/65 text-white text-[10px] font-mono tracking-wider">
                  {photo.frameCode}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between gap-3 border-t border-slate-200/70 dark:border-slate-800/80">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {photo.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {photo.seriesLabel} · {photo.mood}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                    {photo.width}×{photo.height}
                  </span>
                  <span
                    className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: photo.dominantHex }}
                    title={photo.dominantHex}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pro Darkroom Lightbox */}
      {activePhoto && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#070b14]/95 backdrop-blur-md flex flex-col select-none"
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title}
        >
          {/* Top HUD */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 text-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 font-mono text-xs text-sky-300 shrink-0">
                {activePhoto.frameCode}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {activePhoto.title}
                </div>
                <div className="text-xs font-mono text-slate-400 truncate">
                  {activePhoto.seriesLabel} · {activePhoto.width} × {activePhoto.height} ({activePhoto.aspectLabel}) · {activeIndex + 1}/{filtered.length}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={zoomed ? '还原大小 (Z)' : '放大细节 (Z)'}
              >
                {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>
              <a
                href={activePhoto.src}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="在新标签页查看高清原图"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setActiveIndex(null);
                  setZoomed(false);
                }}
                className="p-2 rounded-xl text-slate-300 hover:text-rose-300 hover:bg-white/10 transition-colors cursor-pointer"
                title="关闭 (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stage */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-auto p-4 sm:p-8"
            onClick={() => {
              setActiveIndex(null);
              setZoomed(false);
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(false);
                setActiveIndex((activeIndex - 1 + filtered.length) % filtered.length);
              }}
              className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-slate-900/75 hover:bg-sky-500/25 border border-white/15 text-white transition-all cursor-pointer"
              aria-label="上一张"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <img
              src={activePhoto.src}
              alt={activePhoto.title}
              onClick={(e) => {
                e.stopPropagation();
                setZoomed((z) => !z);
              }}
              className={`rounded-xl shadow-2xl transition-transform duration-300 ${
                zoomed
                  ? 'max-w-none max-h-none scale-125 cursor-zoom-out'
                  : 'max-w-full max-h-[70vh] object-contain cursor-zoom-in'
              }`}
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(false);
                setActiveIndex((activeIndex + 1) % filtered.length);
              }}
              className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-slate-900/75 hover:bg-sky-500/25 border border-white/15 text-white transition-all cursor-pointer"
              aria-label="下一张"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Filmstrip */}
          <div className="border-t border-white/10 bg-slate-950/80 px-4 py-3 overflow-x-auto">
            <div className="flex items-center justify-start sm:justify-center gap-2 min-w-max">
              {filtered.map((p, i) => {
                const isCurrent = i === activeIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setZoomed(false);
                      setActiveIndex(i);
                    }}
                    className={`relative w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'border-sky-400 scale-105 opacity-100 shadow-md shadow-sky-500/30'
                        : 'border-transparent opacity-45 hover:opacity-85'
                    }`}
                    title={`${p.frameCode} ${p.title}`}
                  >
                    <img
                      src={p.thumb}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
