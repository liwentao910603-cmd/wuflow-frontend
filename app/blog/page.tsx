import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "博客 — 悟流 WuFlow",
  description: "WuFlow 团队关于 AI 学习、知识管理和自我成长的思考与分享。",
};

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

async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`${API}/blog/posts`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.posts ?? []);
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogListPage() {
  const posts = await getPosts();

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

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">博客</h1>
          <p className="text-gray-400 text-sm">关于 AI 学习、知识管理和自我成长的思考与分享</p>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-300 text-sm">暂无文章</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <article key={post.slug} className="py-8 group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex items-center gap-2 mb-2">
                    <time className="text-xs text-gray-400">{formatDate(post.published_at)}</time>
                    {post.tags?.map((tag) => (
                      <span key={tag} className="text-xs text-gray-300">#{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#2383E2] transition-colors mb-2 leading-snug">
                    {post.title}
                  </h2>
                  {post.summary && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{post.summary}</p>
                  )}
                  <span className="inline-block mt-3 text-xs text-[#2383E2] group-hover:underline">
                    阅读全文 →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 mt-16 flex justify-between items-center text-xs text-gray-400">
        <span>悟流 WuFlow · wuflow.cn</span>
        <span>让知识流动起来</span>
      </footer>
    </div>
  );
}
