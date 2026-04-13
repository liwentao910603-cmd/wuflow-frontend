import Link from "next/link";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  published_at: string;
  tags?: string[];
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API}/blog/posts/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getAllSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/blog/posts`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const posts: Post[] = Array.isArray(data) ? data : (data.posts ?? []);
    return posts.map((p) => p.slug);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "文章不存在 — 悟流 WuFlow" };

  return {
    title: `${post.title} — 悟流 WuFlow`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
      type: "article",
      publishedTime: post.published_at,
      siteName: "悟流 WuFlow",
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPost(slug);

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

      <div className="max-w-2xl mx-auto px-6 py-16">
        {!post ? (
          <div className="text-center py-32">
            <p className="text-gray-400 text-sm mb-4">文章不存在或已被删除</p>
            <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900 underline">
              返回博客
            </Link>
          </div>
        ) : (
          <>
            {/* 文章头 */}
            <header className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <time className="text-xs text-gray-400">{formatDate(post.published_at)}</time>
                {post.tags?.map((tag) => (
                  <span key={tag} className="text-xs text-gray-300">#{tag}</span>
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
                    <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3 leading-snug">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-gray-800 mt-6 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 space-y-1.5 pl-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 space-y-1.5 pl-4 list-decimal">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-gray-600 leading-relaxed flex gap-2">
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

            {/* 底部导航 */}
            <div className="mt-16 pt-8 border-t border-gray-100">
              <Link
                href="/blog"
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                ← 返回全部文章
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 mt-8 flex justify-between items-center text-xs text-gray-400">
        <span>悟流 WuFlow · wuflow.cn</span>
        <span>让知识流动起来</span>
      </footer>
    </div>
  );
}
