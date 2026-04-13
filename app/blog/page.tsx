"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  cover_image?: string;
  published_at: string;
  tags?: string[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const TAG_MAP: Record<string, { bg: string; emoji: string }> = {
  学习方法: { bg: "#E1F5EE", emoji: "🧠" },
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

/* ── Featured Card ─────────────────────────────────────────────────── */
function FeaturedCard({ post }: { post: Post }) {
  const { emoji } = tagStyle(post.tags);
  const firstTag = post.tags?.[0];

  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <article
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          border: "1px solid rgba(0,0,0,0.09)",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
          transition: "border-color 0.15s",
          marginBottom: 40,
        }}
        className="group hover:[border-color:rgba(0,0,0,0.25)]"
      >
        {/* 左侧深色背景 */}
        <div
          style={{
            background: "#0D1117",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            minHeight: 180,
          }}
        >
          <span style={{ fontSize: 40 }}>{emoji}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#00E5A0", letterSpacing: "0.12em" }}>
            FEATURED
          </span>
        </div>

        {/* 右侧内容 */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {firstTag && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#1D9E75",
                  background: "#E1F5EE",
                  padding: "2px 8px",
                  borderRadius: 20,
                }}
              >
                {firstTag}
              </span>
            )}
            <time style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(post.published_at)}</time>
          </div>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "rgba(0,0,0,0.87)",
              margin: 0,
              lineHeight: 1.4,
              letterSpacing: "-0.3px",
              transition: "color 0.15s",
            }}
            className="group-hover:text-[#1D9E75]"
          >
            {post.title}
          </h2>

          {post.summary && (
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 1.65,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.summary}
            </p>
          )}

          <span style={{ fontSize: 13, color: "#1D9E75", fontWeight: 500, marginTop: 4 }}>
            阅读全文 →
          </span>
        </div>
      </article>
    </Link>
  );
}

/* ── Grid Card ──────────────────────────────────────────────────────── */
function GridCard({ post }: { post: Post }) {
  const { bg, emoji } = tagStyle(post.tags);
  const firstTag = post.tags?.[0];

  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <article
        style={{
          border: "1px solid rgba(0,0,0,0.09)",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
          transition: "border-color 0.15s",
        }}
        className="group hover:[border-color:rgba(0,0,0,0.25)]"
      >
        {/* 彩色封面区 */}
        <div
          style={{
            height: 96,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          {emoji}
        </div>

        {/* 卡片体 */}
        <div style={{ padding: "16px 18px 18px" }}>
          {firstTag && (
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
              #{firstTag}
            </span>
          )}

          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(0,0,0,0.85)",
              margin: "6px 0 6px",
              lineHeight: 1.45,
              letterSpacing: "-0.2px",
              transition: "color 0.15s",
            }}
            className="group-hover:text-[#1D9E75]"
          >
            {post.title}
          </h3>

          {post.summary && (
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                lineHeight: 1.6,
                margin: "0 0 12px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.summary}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <time style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(post.published_at)}</time>
            <span style={{ fontSize: 12, color: "#1D9E75", fontWeight: 500 }}>阅读 →</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ── Loading Skeleton ───────────────────────────────────────────────── */
function Skeleton() {
  return (
    <>
      {/* Featured skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 40,
          minHeight: 180,
        }}
      >
        <div style={{ background: "#f3f4f6" }} />
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ height: 12, background: "#f3f4f6", borderRadius: 4, width: "25%" }} />
          <div style={{ height: 20, background: "#f3f4f6", borderRadius: 4, width: "70%" }} />
          <div style={{ height: 12, background: "#f3f4f6", borderRadius: 4, width: "90%" }} />
          <div style={{ height: 12, background: "#f3f4f6", borderRadius: 4, width: "60%" }} />
        </div>
      </div>
      {/* Grid skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 96, background: "#f3f4f6" }} />
            <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 11, background: "#f3f4f6", borderRadius: 4, width: "30%" }} />
              <div style={{ height: 15, background: "#f3f4f6", borderRadius: 4, width: "80%" }} />
              <div style={{ height: 11, background: "#f3f4f6", borderRadius: 4, width: "95%" }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function BlogListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/blog/posts`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setPosts(Array.isArray(data) ? data : (data.posts ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [featured, ...rest] = posts;

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
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <Link href="/login" className="hover:text-gray-900 transition-colors">登录</Link>
          <Link href="/register" className="bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">免费注册</Link>
        </div>
      </nav>

      {/* 内容区 */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px 80px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#1D9E75",
                background: "#E1F5EE",
                padding: "4px 12px",
                borderRadius: 20,
              }}
            >
              <span style={{ fontSize: 8, lineHeight: 1 }}>●</span>
              学习方法 · 知识管理 · 独立开发
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "rgba(0,0,0,0.87)", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            博客
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            关于 AI 学习、间隔重复与自我成长的深度思考，每周更新。
          </p>
        </div>

        {/* 文章区 */}
        {loading ? (
          <Skeleton />
        ) : posts.length === 0 ? (
          <p style={{ fontSize: 13, color: "#d1d5db" }}>暂无文章</p>
        ) : (
          <>
            {featured && <FeaturedCard post={featured} />}

            {rest.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 16,
                }}
              >
                {rest.map((post) => (
                  <GridCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#c4c9d4" }}>悟流 WuFlow · wuflow.cn</span>
        <span style={{ fontSize: 12, color: "#c4c9d4" }}>让知识流动起来</span>
      </footer>
    </div>
  );
}
