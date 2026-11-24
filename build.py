from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import Counter
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory

from jinja2 import Environment, FileSystemLoader, select_autoescape
from markdown_it import MarkdownIt
from markdown_it.token import Token
from markupsafe import Markup
from PIL import Image, ImageOps
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import TextLexer, get_lexer_by_name
from pygments.util import ClassNotFound


ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
STATIC = ROOT / 'static'
POST_START = re.compile(
    r'^#\s+([^\n]+)\n[ \t]*\n(\d{4}-\d{2}-\d{2})(?:[ \t]+·[ \t]+([^\n]*))?[ \t]*(?:\n|$)'
)
PHOTO_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
GITHUB = 'https://github.com/lycat475'

syntax = HtmlFormatter(nowrap=True)


def highlight_code(source: str, info: str, _attrs: str) -> str:
    language = info.split()[0] if info else 'text'
    try:
        lexer = get_lexer_by_name(language)
    except ClassNotFound:
        lexer = TextLexer()
    return highlight(source, lexer, syntax)


markdown = MarkdownIt('commonmark', {'html': False, 'highlight': highlight_code}).enable('table')
templates = Environment(
    loader=FileSystemLoader(ROOT / 'templates'),
    autoescape=select_autoescape(['html']),
    trim_blocks=True,
    lstrip_blocks=True,
)


@dataclass(frozen=True)
class Heading:
    text: str
    anchor: str
    depth: int


@dataclass(frozen=True)
class Post:
    slug: str
    title: str
    published: date
    description: str
    topic: str
    body: Markup
    headings: list[Heading]
    source: Path

    @property
    def url(self) -> str:
        return f'/posts/{self.slug}/'


def text_from_inline(inline: Token) -> str:
    return ''.join(
        token.content if token.type in {'text', 'code_inline', 'image'} else ' ' if token.type.endswith('break') else ''
        for token in inline.children or []
    ).strip()


def render_markdown(source: str) -> tuple[Markup, list[Heading]]:
    tokens = markdown.parse(source)
    headings = []
    used: set[str] = set()
    for index, token in enumerate(tokens):
        if token.type != 'heading_open':
            continue
        label = text_from_inline(tokens[index + 1])
        base = re.sub(r'[^\w-]+', '-', label.casefold()).strip('-') or 'section'
        anchor = base
        suffix = 2
        while anchor in used:
            anchor = f'{base}-{suffix}'
            suffix += 1
        used.add(anchor)
        token.attrSet('id', anchor)
        headings.append(Heading(label, anchor, int(token.tag[1:])))
    return Markup(markdown.renderer.render(tokens, markdown.options, {})), headings


def read_posts(source: Path) -> list[Post]:
    posts = []
    for folder in sorted((source / 'posts').iterdir()):
        if not folder.is_dir():
            continue
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', folder.name):
            raise ValueError(f'文章目录名必须使用小写字母、数字或连字符：{folder.name}')
        file = folder / f'{folder.name}.md'
        raw = file.read_text(encoding='utf-8-sig').lstrip()
        match = POST_START.match(raw)
        if not match:
            raise ValueError(f'文章开头需要一级标题、空行和日期：{file}')
        raw_title, published, lead = match.groups()
        title = text_from_inline(markdown.parseInline(raw_title)[0])
        is_ctf = 'ctf' in title.casefold()
        description = lead or ('Web 方向的 CTF 比赛笔记。' if is_ctf else '')
        body, headings = render_markdown(raw[match.end():].lstrip())
        if lead:
            intro, _ = render_markdown(lead)
            body = intro + body
        posts.append(Post(folder.name, title, date.fromisoformat(published), description, 'Web 安全' if is_ctf else '随笔', body, headings, folder))
    return sorted(posts, key=lambda entry: entry.published, reverse=True)


def photo_catalog(source: Path, output: Path) -> list[dict]:
    labels = json.loads((ROOT / 'photos.json').read_text(encoding='utf-8'))
    media = output / 'media'
    media.mkdir()
    entries = []
    for file in sorted((source / 'gallery').iterdir()):
        if not file.is_file() or file.suffix.lower() not in PHOTO_EXTENSIONS:
            continue
        name = file.stem
        if not re.fullmatch(r'[\w-]+', name):
            raise ValueError(f'照片文件名不受支持：{file.name}')
        title, category, alt = labels.get(name, [name, '其他', f'摄影作品 {name}'])
        original = media / file.name
        thumbnail = media / f'{name}-thumb.webp'
        shutil.copyfile(file, original)
        with Image.open(file) as photo:
            preview = ImageOps.exif_transpose(photo).convert('RGB')
            preview.thumbnail((800, 800))
            preview.save(thumbnail, format='WEBP', quality=86)
        width, height = preview.size
        entries.append(dict(name=name, title=title, category=category, alt=alt,
                            original=f'/media/{original.name}', preview=f'/media/{thumbnail.name}',
                            width=width, height=height))
    return entries


def locate_content(explicit: Path | None) -> Path:
    if explicit:
        return explicit.resolve(strict=True)
    for directory in ROOT.parents:
        source = directory / 'lycatblog-content'
        if (source / 'about.md').is_file():
            return source.resolve()
    raise FileNotFoundError('找不到 lycatblog-content，请通过 --content 指定目录。')


def build(site: Path, source: Path) -> None:
    shutil.copytree(STATIC, site, dirs_exist_ok=True)
    (site / 'code.css').write_text(syntax.get_style_defs('.prose pre'), encoding='utf-8')
    posts = read_posts(source)
    photos = photo_catalog(source, site)
    categories = Counter(photo['category'] for photo in photos)
    featured_ids = ('p02', 'p10', 'p22')
    featured = [photo for name in featured_ids for photo in photos if photo['name'] == name]
    about_source = (source / 'about.md').read_text(encoding='utf-8-sig')
    about_source = about_source.replace(f'：{GITHUB}', f'：<{GITHUB}>')
    about, _ = render_markdown(about_source)

    def render(template: str, destination: str, **context) -> None:
        file = site / destination
        file.parent.mkdir(parents=True, exist_ok=True)
        document = templates.get_template(template).render(posts=posts, github=GITHUB, **context)
        file.write_text(document + '\n', encoding='utf-8')

    render('home.html', 'index.html', current='home', featured=featured or photos[:3], photo_count=len(photos))
    render('archive.html', 'posts/index.html', current='posts', title='文章')
    render('gallery.html', 'gallery/index.html', current='gallery', title='摄影', photos=photos, categories=categories)
    render('about.html', 'about/index.html', current='about', title='关于', about=about)
    render('missing.html', '404.html', current='', title='找不到页面')
    for index, post in enumerate(posts):
        destination = site / 'posts' / post.slug
        render('post.html', f'posts/{post.slug}/index.html', current='posts', title=post.title, post=post,
               newer=posts[index - 1] if index else None,
               older=posts[index + 1] if index + 1 < len(posts) else None)
        assets = post.source / 'assets'
        if assets.is_dir():
            shutil.copytree(assets, destination / 'assets')
    print(f'已生成 {len(posts)} 篇文章、{len(photos)} 张照片和关于页。')


def main() -> None:
    parser = argparse.ArgumentParser(description='从内容仓库生成 lycat 的静态博客。')
    parser.add_argument('--content', type=Path, help='lycatblog-content 的文件夹路径')
    args = parser.parse_args()
    source = locate_content(args.content)
    if DIST.resolve() != DIST or source == DIST or source.is_relative_to(DIST):
        raise ValueError('构建输出必须是本工作树内的 dist 目录。')
    with TemporaryDirectory(prefix='.site-', dir=ROOT) as staging:
        site = Path(staging) / 'dist'
        build(site, source)
        if DIST.exists():
            shutil.rmtree(DIST)
        site.replace(DIST)


if __name__ == '__main__':
    main()
