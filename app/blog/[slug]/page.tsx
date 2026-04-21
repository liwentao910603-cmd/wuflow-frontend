"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

/* ── Tag 映射 ───────────────────────────────────────────────────────── */
const TAG_MAP: Record<string, { bg: string; emoji: string }> = {
  学习方法:  { bg: "#E1F5EE", emoji: "🧠" },
  "AI工具":  { bg: "#EEEDFE", emoji: "⚡" },
  "AI 工具": { bg: "#EEEDFE", emoji: "⚡" },
  知识管理:  { bg: "#E6F1FB", emoji: "🗺️" },
  间隔重复:  { bg: "#E1F5EE", emoji: "🔁" },
  自学经验:  { bg: "#FAEEDA", emoji: "📊" },
  产品日志:  { bg: "#FAECE7", emoji: "✍️" },
};
const DEFAULT_TAG = { bg: "#F1EFE8", emoji: "📝" };

function tagStyle(tags?: string[]) {
  const first = tags?.[0];
  return (first && TAG_MAP[first]) ? TAG_MAP[first] : DEFAULT_TAG;
}

/* ── Types & helpers ────────────────────────────────────────────────── */
interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  published_at: string;
  updated_at?: string;
  tags?: string[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingMinutes(content: string) {
  const wordCount = content.length / 2;
  return Math.ceil(wordCount / 400);
}

/* ── Skeleton ───────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}>
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
        <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">悟流 WuFlow</Link>
        <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← 全部文章</Link>
      </nav>
      <div className="h-[200px] bg-gray-100 animate-pulse" />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
        <div className="pt-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${85 + (i % 3) * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function fetchPost() {
      const url = `${API}/blog/posts/${slug}`;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);
          if (!res.ok) {
            if (!cancelled) { setNotFound(true); setLoading(false); }
            return;
          }
          const data: Post = await res.json();
          if (!cancelled) { setPost(data); setLoading(false); }
          return;
        } catch (error) {
          clearTimeout(timer);
          console.error(`[getPost] Attempt ${attempt}/3 failed:`, {
            slug,
            url,
            error: error instanceof Error ? error.message : String(error),
          });
          if (attempt === 3) {
            if (!cancelled) { setNotFound(true); setLoading(false); }
            return;
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    fetchPost();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <Skeleton />;

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}>
        <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">悟流 WuFlow</Link>
          <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← 全部文章</Link>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-5xl">📄</p>
          <p className="text-lg font-semibold text-gray-800">文章不存在</p>
          <p className="text-sm text-gray-400">该文章可能已被删除或地址有误</p>
          <Link href="/blog" className="mt-2 text-sm text-[#2383E2] hover:underline">← 返回全部文章</Link>
        </div>
      </div>
    );
  }

  const { bg, emoji } = tagStyle(post.tags);
  const mins = readingMinutes(post.content);

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}
    >
      {/* 导航 */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
        <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
          悟流 WuFlow
        </Link>
        <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← 全部文章
        </Link>
      </nav>

      {/* 封面色块 */}
      <div
        style={{
          height: 200,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60,
        }}
      >
        {emoji}
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* 文章头 */}
        <header style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <time style={{ fontSize: 12, color: "#9ca3af" }}>{formatDate(post.published_at)}</time>
            <span style={{ fontSize: 12, color: "#c4c9d4" }}>·</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>约 {mins} 分钟阅读</span>
            {post.tags?.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  color: "#0F6E56",
                  background: "#E1F5EE",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-semibold text-gray-900 leading-snug tracking-tight mb-4">
            {post.title}
          </h1>

          {post.summary && (
            <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-gray-200 pl-4">
              {post.summary}
            </p>
          )}
        </header>

        {/* Markdown 正文 */}
        <div className="prose-blog">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-semibold text-gray-900 mt-10 mb-4 leading-snug">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "#111827", marginTop: 32, marginBottom: 12, lineHeight: 1.4 }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1f2937", marginTop: 24, marginBottom: 8, lineHeight: 1.4 }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.85, marginBottom: 16 }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 space-y-1.5 pl-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 space-y-1.5 pl-4 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li style={{ fontSize: 15, color: "#374151", lineHeight: 1.85, display: "flex", gap: 8 }}>
                  <span className="text-gray-300 shrink-0 mt-0.5">·</span>
                  <span>{children}</span>
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-gray-200 pl-4 my-4 text-sm text-gray-400 italic">
                  {children}
                </blockquote>
              ),
              code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; [key: string]: unknown }) =>
                inline ? (
                  <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-gray-50 border border-gray-100 rounded-lg p-4 overflow-x-auto my-4">
                    <code className="text-xs text-gray-700 font-mono leading-relaxed" {...props}>
                      {children}
                    </code>
                  </pre>
                ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2383E2] hover:underline"
                >
                  {children}
                </a>
              ),
              hr: () => <hr className="border-gray-100 my-8" />,
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-800">{children}</strong>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* CTA 卡片 */}
        <div
          style={{
            background: "#E1F5EE",
            borderRadius: 12,
            padding: "2rem",
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0F6E56", margin: "0 0 6px", lineHeight: 1.4 }}>
              用 WuFlow 把这篇文章变成你的知识
            </p>
            <p style={{ fontSize: 13, color: "#1D9E75", margin: 0, lineHeight: 1.6 }}>
              AI 自动提取关键概念，生成复习题，真正记住所读内容。
            </p>
          </div>
          <Link
            href="/register"
            style={{
              background: "#0F6E56",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 22px",
              borderRadius: 8,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            免费试用 →
          </Link>
        </div>

        {/* 底部导航 */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <Link
            href="/blog"
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← 返回全部文章
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 mt-8 flex justify-between items-center text-xs text-gray-400">
        <span>悟流 WuFlow · wuflow.cn</span>
        <span>让知识流动起来</span>
      </footer>
    </div>
  );
}
