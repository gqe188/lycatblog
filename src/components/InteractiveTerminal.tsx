import { useRef, useState } from 'react';
import { Terminal, CornerDownLeft, Sparkles } from 'lucide-react';

interface TerminalPost {
  slug: string;
  title: string;
  date: string;
  category: string;
}

interface InteractiveTerminalProps {
  author: string;
  focus: string;
  github: string;
  posts: TerminalPost[];
  galleryCount: number;
  compact?: boolean;
}

interface Line {
  id: number;
  type: 'cmd' | 'out' | 'accent' | 'error';
  text: string;
  href?: string;
}

const DEMO_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJseWNhdDQ3NSIsInJvbGUiOiJtZW1iZXIiLCJmb2N1cyI6IldlYiBTZWN1cml0eSIsImludGVyZXN0cyI6WyJBQ0ciLCJBSSIsIlBob3RvZ3JhcGh5Il19.sig';

function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function InteractiveTerminal({
  author,
  focus,
  github,
  posts,
  galleryCount,
  compact = false,
}: InteractiveTerminalProps) {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { id: 1, type: 'accent', text: 'lycat@475-node // WebSec × ACG × Shutter Console v2.6' },
    { id: 2, type: 'out', text: '输入 help 查看可用指令，或点击下方快捷命令体验（含 JWT 解码 / CTF 彩蛋）。' },
  ]);
  const nextId = useRef(3);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pushLines = (newLines: Omit<Line, 'id'>[]) => {
    setLines((prev) => [
      ...prev,
      ...newLines.map((l) => ({ ...l, id: nextId.current++ })),
    ]);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 20);
  };

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const [cmd, ...args] = trimmed.split(/\s+/);
    const lower = cmd.toLowerCase();
    const out: Omit<Line, 'id'>[] = [{ type: 'cmd', text: `$ ${trimmed}` }];

    if (lower === 'clear') {
      setLines([]);
      setInput('');
      return;
    }

    switch (lower) {
      case 'help':
        out.push(
          { type: 'accent', text: '可用指令列表:' },
          { type: 'out', text: '  whoami       — 查看博主档案与跨界标签' },
          { type: 'out', text: '  cat about.md — 读取原始 about.md 内容' },
          { type: 'out', text: '  ls posts     — 列出全部博客文章（点击可跳转）' },
          { type: 'out', text: '  ls gallery   — 查看摄影画廊概览' },
          { type: 'out', text: '  jwt [token]  — 解码 JWT Payload（默认演示样本）' },
          { type: 'out', text: '  flag         — 试试看能不能拿到彩蛋 Flag?' },
          { type: 'out', text: '  clear        — 清空终端屏幕' }
        );
        break;
      case 'whoami':
        out.push(
          { type: 'accent', text: `uid=475(lycat) gid=1337(websec) groups=acg,ai,ctf,photography` },
          { type: 'out', text: `作者: ${author} | 主攻方向: ${focus}` },
          { type: 'out', text: `日常: 挖 Web 洞 / 写代码折腾 AI / 追番看漫画 / 带着相机捕捉黄昏流云` }
        );
        break;
      case 'cat':
        if (args[0] === 'about.md' || !args[0]) {
          out.push(
            { type: 'accent', text: '# 关于' },
            { type: 'out', text: `- 作者：${author}` },
            { type: 'out', text: `- 方向：${focus}` },
            { type: 'out', text: `- GitHub：${github}`, href: github }
          );
        } else {
          out.push({ type: 'error', text: `cat: ${args[0]}: Permission denied (try: cat about.md)` });
        }
        break;
      case 'ls':
        if (args[0] === 'gallery') {
          out.push(
            { type: 'accent', text: `total ${galleryCount} frames in /gallery` },
            { type: 'out', text: '→ 前往完整摄影画廊 (山水荷风 / 苍穹流云 / 生灵静物 / 城隅烟火)', href: '/gallery' }
          );
        } else {
          out.push({ type: 'accent', text: `total ${posts.length} articles in /posts` });
          posts.forEach((p) => {
            out.push({
              type: 'out',
              text: `  [${p.date}] (${p.category}) ${p.title}`,
              href: `/posts/${p.slug}`,
            });
          });
        }
        break;
      case 'jwt': {
        const token = args[0] && args[0] !== 'demo' ? args[0] : DEMO_JWT;
        try {
          const parts = token.split('.');
          if (parts.length < 2) throw new Error('Invalid JWT format');
          const header = JSON.stringify(JSON.parse(decodeBase64Url(parts[0])), null, 2);
          const payload = JSON.stringify(JSON.parse(decodeBase64Url(parts[1])), null, 2);
          out.push(
            { type: 'accent', text: '// JWT Decoded Header:' },
            { type: 'out', text: header },
            { type: 'accent', text: '// JWT Decoded Payload:' },
            { type: 'out', text: payload }
          );
        } catch {
          out.push({ type: 'error', text: 'JWT 解析失败：请传入合法的 header.payload.signature 或直接输入 jwt demo' });
        }
        break;
      }
      case 'flag':
        out.push(
          { type: 'accent', text: '✨ HTTP/1.1 200 OK · X-Powered-By: lycat475-curiosity' },
          { type: 'out', text: 'QCTF{w3lc0me_t0_lycat475_w3bs3c_&_shutt3r_w0rld!}' }
        );
        break;
      default:
        out.push({ type: 'error', text: `zsh: command not found: ${cmd} (输入 help 查看指令)` });
    }

    pushLines(out);
    setInput('');
  };

  const quickCommands = ['whoami', 'ls posts', 'jwt demo', 'cat about.md', 'flag'];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#0d1321] text-slate-200 shadow-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/90" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
          <span className="ml-2 flex items-center gap-1.5 font-mono text-xs text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            lycat@475: ~/sec-lab
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400/90">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ONLINE
        </span>
      </div>

      <div
        ref={scrollRef}
        className={`p-4 font-mono text-xs leading-relaxed overflow-y-auto space-y-1.5 ${
          compact ? 'h-48' : 'h-64'
        }`}
      >
        {lines.map((line) => (
          <div key={line.id} className="whitespace-pre-wrap break-all">
            {line.href ? (
              <a
                href={line.href}
                target={line.href.startsWith('http') ? '_blank' : undefined}
                rel={line.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-sky-400 hover:text-sky-300 underline underline-offset-4"
              >
                {line.text}
              </a>
            ) : (
              <span
                className={
                  line.type === 'cmd'
                    ? 'text-rose-300 font-semibold'
                    : line.type === 'accent'
                      ? 'text-sky-300'
                      : line.type === 'error'
                        ? 'text-rose-400'
                        : 'text-slate-300'
                }
              >
                {line.text}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-slate-800/90 bg-slate-900/60 flex flex-wrap items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-sky-400 mr-0.5 shrink-0" />
        {quickCommands.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => runCommand(q)}
            className="px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-sky-500/20 hover:text-sky-300 border border-slate-700/70 text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(input);
        }}
        className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-800 bg-slate-950/70"
      >
        <span className="font-mono text-xs text-sky-400 shrink-0">lycat@475:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入指令 (help / jwt demo / flag)..."
          className="w-full bg-transparent font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          aria-label="终端命令输入"
        />
        <button
          type="submit"
          className="p-1 rounded text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
          aria-label="运行命令"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
