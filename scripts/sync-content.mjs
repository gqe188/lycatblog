import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PROJECT_ROOT = process.cwd();
const CONTENT_ROOT = path.resolve(PROJECT_ROOT, '..', 'lycatblog-content');
const GENERATED_DIR = path.join(PROJECT_ROOT, 'src', 'generated');
const MEDIA_DIR = path.join(PROJECT_ROOT, 'public', 'media');

// Curated visual metadata for the photography exhibition (all 22 photos from lycatblog-content/gallery)
const GALLERY_CURATION = {
  'p01.jpg': { title: '暮云压山', series: 'sky', mood: '黄昏微光' },
  'p02.jpg': { title: '镜湖浮云', series: 'landscape', mood: '晴日倒影' },
  'p03.jpg': { title: '夏日荷塘与积云', series: 'landscape', mood: '盛夏晴空' },
  'p04.jpg': { title: '汀步远峰', series: 'landscape', mood: '山水清音' },
  'p05.jpg': { title: '荷风水道', series: 'landscape', mood: '翠荷连天' },
  'p06.jpg': { title: '孤峰汀洲', series: 'landscape', mood: '水墨喀斯特' },
  'p07.jpg': { title: '画舫映柳', series: 'landscape', mood: '江南水韵' },
  'p08.jpg': { title: '逆光江港', series: 'urban', mood: '银辉船影' },
  'p09.jpg': { title: '朱檐宫灯', series: 'urban', mood: '古韵红流苏' },
  'p10.jpg': { title: '落日溪影', series: 'landscape', mood: '金辉满川' },
  'p11.jpg': { title: '双影黑天鹅', series: 'life', mood: '湖畔生灵' },
  'p12.jpg': { title: '孤树栖鹭', series: 'life', mood: '澄空群羽' },
  'p13.jpg': { title: '古樟溪径', series: 'landscape', mood: '绿荫斜阳' },
  'p14.jpg': { title: '曲径亭池', series: 'landscape', mood: '园林幽境' },
  'p15.jpg': { title: '粉墙黛瓦', series: 'landscape', mood: '水乡旧屋' },
  'p16.jpg': { title: '竹风铃与晴天', series: 'life', mood: '清风掠影' },
  'p17.jpg': { title: '栈道木鹿', series: 'life', mood: '午后暖光' },
  'p18.jpg': { title: '云隙明珠', series: 'sky', mood: '仰望天际' },
  'p19.jpg': { title: '航迹与红旗', series: 'sky', mood: '高空云带' },
  'p20.jpg': { title: '暮枝剪影', series: 'sky', mood: '蓝调时刻' },
  'p21.jpg': { title: '夜灯星芒', series: 'sky', mood: '夏夜绿荫' },
  'p22.jpg': { title: '黄昏电线杆', series: 'sky', mood: '二次元逢魔时' },
};

const SERIES_LABELS = {
  landscape: '山水荷风',
  sky: '苍穹流云',
  life: '生灵静物',
  urban: '城隅烟火',
};

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function stripMarkdownFormatting(text) {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;!?]|$)/g, '$1$2')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeReadingStats(markdown) {
  const plain = stripMarkdownFormatting(markdown);
  const cjkCount = (plain.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWords = (plain.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length;
  const totalWords = cjkCount + latinWords;
  const readingMinutes = Math.max(1, Math.ceil(totalWords / 280));
  return { totalWords, readingMinutes };
}

function inferTagsAndCategory(slug, title, body) {
  const combined = `${slug} ${title} ${body}`.toLowerCase();
  const tags = new Set();
  let category = '随笔';

  if (combined.includes('ctf') || combined.includes('flag{') || combined.includes('wp')) {
    category = 'CTF WriteUp';
    tags.add('CTF');
    tags.add('WriteUp');
  }
  if (combined.includes('jwt') || combined.includes('## web') || combined.includes('cookies')) {
    tags.add('Web安全');
  }
  if (combined.includes('## misc') || combined.includes('zipcrypto') || combined.includes('ihdr')) {
    tags.add('MISC');
  }
  if (combined.includes('hello world') || slug === 'hello-world') {
    category = '日志';
    tags.add('Hello World');
    tags.add('建站记录');
  }

  if (tags.size === 0) tags.add('笔记');
  return { category, tags: Array.from(tags) };
}

function parsePostMarkdown(slug, rawContent) {
  const lines = rawContent.replace(/\r\n/g, '\n').split('\n');
  let title = slug;
  let titleLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)$/);
    if (m) {
      title = m[1].replace(/\*\*/g, '').trim();
      titleLineIndex = i;
      break;
    }
  }

  let date = '2026-11-01';
  let subtitle = '';
  let bodyStartLine = titleLineIndex >= 0 ? titleLineIndex + 1 : 0;

  // Look for date line shortly after H1
  for (let i = bodyStartLine; i < Math.min(lines.length, bodyStartLine + 4); i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    const dm = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:\s*[·•-]\s*(.+))?$/);
    if (dm) {
      date = dm[1];
      if (dm[2]) subtitle = dm[2].trim();
      bodyStartLine = i + 1;
    }
    break;
  }

  let bodyMarkdown = lines.slice(bodyStartLine).join('\n').trim();
  if (subtitle && !bodyMarkdown.includes(subtitle)) {
    bodyMarkdown = `${subtitle}\n\n${bodyMarkdown}`;
  }

  // Rewrite relative asset URLs to /media/posts/<slug>/assets/...
  bodyMarkdown = bodyMarkdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/|\/)(?:\.\/)?([^)]+)\)/g,
    (_, alt, relPath) => `![${alt}](/media/posts/${slug}/${relPath.replace(/\\/g, '/')})`
  );

  // Extract first image as optional cover
  const imgMatch = bodyMarkdown.match(/!\[[^\]]*\]\((\/media\/posts\/[^)]+)\)/);
  const coverImage = imgMatch ? imgMatch[1] : null;

  // Build clean excerpt
  const excerptSource = bodyMarkdown
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .trim();
  const cleanExcerpt = stripMarkdownFormatting(excerptSource);
  const excerpt =
    cleanExcerpt.length > 140 ? `${cleanExcerpt.slice(0, 140).trim()}…` : cleanExcerpt || title;

  const { totalWords, readingMinutes } = computeReadingStats(bodyMarkdown);
  const { category, tags } = inferTagsAndCategory(slug, title, bodyMarkdown);

  return {
    slug,
    title,
    date,
    category,
    tags,
    excerpt,
    coverImage,
    totalWords,
    readingMinutes,
    markdown: bodyMarkdown,
  };
}

async function copyDir(src, dest) {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function syncPosts() {
  const postsRoot = path.join(CONTENT_ROOT, 'posts');
  const entries = await fs.readdir(postsRoot, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const postDir = path.join(postsRoot, slug);
    const files = await fs.readdir(postDir);
    const mdFile = files.find((f) => f.endsWith('.md'));
    if (!mdFile) continue;

    const raw = await fs.readFile(path.join(postDir, mdFile), 'utf8');
    const post = parsePostMarkdown(slug, raw);
    posts.push(post);

    // Copy post assets if present
    const assetsDir = path.join(postDir, 'assets');
    if (await exists(assetsDir)) {
      await copyDir(assetsDir, path.join(MEDIA_DIR, 'posts', slug, 'assets'));
    }
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

async function syncAbout() {
  const aboutPath = path.join(CONTENT_ROOT, 'about.md');
  const raw = await fs.readFile(aboutPath, 'utf8');
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const meta = {
    author: 'lycat && 475',
    focus: 'Web 安全',
    github: 'https://github.com/lycat475',
  };

  for (const line of lines) {
    const a = line.match(/作者[：:]\s*(.+)/);
    if (a) meta.author = a[1].trim();
    const f = line.match(/方向[：:]\s*(.+)/);
    if (f) meta.focus = f[1].trim();
    const g = line.match(/GitHub[：:]\s*(https?:\/\/\S+)/i);
    if (g) meta.github = g[1].trim();
  }

  return {
    raw: raw.trim(),
    ...meta,
  };
}

function getAspectLabel(width, height) {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.06) return { orientation: 'square', aspectLabel: '1:1' };
  if (ratio > 1.6) return { orientation: 'landscape', aspectLabel: '16:9' };
  if (ratio > 1.42) return { orientation: 'landscape', aspectLabel: '3:2' };
  if (ratio > 1) return { orientation: 'landscape', aspectLabel: '4:3' };
  return { orientation: 'portrait', aspectLabel: '3:4' };
}

async function syncGallery() {
  const galleryRoot = path.join(CONTENT_ROOT, 'gallery');
  const outFullDir = path.join(MEDIA_DIR, 'gallery');
  const outThumbDir = path.join(MEDIA_DIR, 'gallery', 'thumbs');
  await ensureDir(outFullDir);
  await ensureDir(outThumbDir);

  const files = (await fs.readdir(galleryRoot))
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const photos = [];
  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const srcPath = path.join(galleryRoot, file);
    const destFull = path.join(outFullDir, file);
    const baseName = file.replace(/\.[^.]+$/, '');
    const thumbFile = `${baseName}.webp`;
    const destThumb = path.join(outThumbDir, thumbFile);

    // Copy original untouched
    await fs.copyFile(srcPath, destFull);

    // Extract metadata, dominant color & generate optimized thumbnail
    const img = sharp(srcPath);
    const metadata = await img.metadata();
    const width = metadata.width || 2000;
    const height = metadata.height || 1500;
    const stats = await img.stats();
    const dom = stats.dominant || { r: 30, g: 41, b: 59 };
    const dominantHex = `#${[dom.r, dom.g, dom.b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')}`;

    // Skip regenerating thumbnail if already newer than source
    let needThumb = true;
    if (await exists(destThumb)) {
      const [srcStat, thumbStat] = await Promise.all([fs.stat(srcPath), fs.stat(destThumb)]);
      if (thumbStat.mtimeMs >= srcStat.mtimeMs) needThumb = false;
    }
    if (needThumb) {
      await sharp(srcPath)
        .resize({ width: 960, height: 960, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(destThumb);
    }

    const { orientation, aspectLabel } = getAspectLabel(width, height);
    const curated = GALLERY_CURATION[file] || {
      title: `Frame #${String(idx + 1).padStart(2, '0')}`,
      series: 'landscape',
      mood: '光影纪实',
    };

    photos.push({
      id: baseName,
      index: idx + 1,
      frameCode: `NO.${String(idx + 1).padStart(2, '0')}`,
      filename: file,
      title: curated.title,
      series: curated.series,
      seriesLabel: SERIES_LABELS[curated.series] || '光影',
      mood: curated.mood,
      width,
      height,
      orientation,
      aspectLabel,
      dominantHex,
      src: `/media/gallery/${file}`,
      thumb: `/media/gallery/thumbs/${thumbFile}`,
    });
  }

  return photos;
}

async function main() {
  if (!(await exists(CONTENT_ROOT))) {
    console.warn(`[sync-content] External content dir not found at ${CONTENT_ROOT}; keeping existing generated files if present.`);
    return;
  }

  await ensureDir(GENERATED_DIR);
  await ensureDir(MEDIA_DIR);

  const [about, posts, gallery] = await Promise.all([
    syncAbout(),
    syncPosts(),
    syncGallery(),
  ]);

  const payload = {
    syncedAt: new Date().toISOString(),
    about,
    posts,
    gallery,
  };

  await fs.writeFile(
    path.join(GENERATED_DIR, 'content.json'),
    JSON.stringify(payload, null, 2),
    'utf8'
  );

  console.log(
    `[sync-content] Synced ${posts.length} posts, ${gallery.length} gallery photos, and about.md from ../lycatblog-content (read-only).`
  );
}

main().catch((err) => {
  console.error('[sync-content] Failed:', err);
  process.exit(1);
});
