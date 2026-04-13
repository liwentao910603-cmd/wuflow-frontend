import type { MetadataRoute } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const BASE_URL = "https://www.wuflow.cn";

interface Post {
  slug: string;
  published_at: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静态页面
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // 动态博客文章
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/api/v1/blog/posts`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const posts: Post[] = Array.isArray(data) ? data : (data.posts ?? []);
      blogRoutes = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.published_at),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // 构建时后端不可达则只输出静态路由
  }

  return [...staticRoutes, ...blogRoutes];
}
