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
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "64px 24px 80px" }}>

        {/* 页头 */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "rgba(0,0,0,0.87)", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            博客
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            关于 AI 学习、知识管理和自我成长的思考
          </p>
        </div>

        {/* 文章列表 */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ padding: "20px 0", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ height: 18, background: "#f3f4f6", borderRadius: 4, width: "60%", marginBottom: 8 }} />
                <div style={{ height: 12, background: "#f3f4f6", borderRadius: 4, width: "20%", marginBottom: 8 }} />
                <div style={{ height: 12, background: "#f3f4f6", borderRadius: 4, width: "85%" }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p style={{ fontSize: 13, color: "#d1d5db" }}>暂无文章</p>
        ) : (
          <div>
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ display: "block", textDecoration: "none" }}
              >
                <article
                  style={{
                    padding: "20px 0",
                    borderTop: i === 0 ? "1px solid rgba(0,0,0,0.07)" : undefined,
                    borderBottom: "1px solid rgba(0,0,0,0.07)",
                    cursor: "pointer",
                  }}
                  className="group"
                >
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "rgba(0,0,0,0.85)",
                      margin: "0 0 6px",
                      lineHeight: 1.45,
                      letterSpacing: "-0.2px",
                      transition: "color 0.15s",
                    }}
                    className="group-hover:text-[#2383E2]"
                  >
                    {post.title}
                  </h2>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: post.summary ? 8 : 0 }}>
                    <time style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(post.published_at)}</time>
                    {post.tags?.map((tag) => (
                      <span key={tag} style={{ fontSize: 11, color: "#c4c9d4" }}>#{tag}</span>
                    ))}
                  </div>

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
                </article>
              </Link>
            ))}
          </div>
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
