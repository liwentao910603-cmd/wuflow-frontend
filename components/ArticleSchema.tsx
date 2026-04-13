interface ArticleSchemaProps {
  title: string
  description: string
  slug: string
  publishedAt: string
  updatedAt?: string
  tags?: string[]
}

export default function ArticleSchema({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  tags = [],
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    author: {
      "@type": "Person",
      name: "怪仔 Guaizai",
      url: "https://wuflow.cn/about",
    },
    publisher: {
      "@type": "Organization",
      name: "WuFlow 悟流",
      url: "https://wuflow.cn",
      logo: {
        "@type": "ImageObject",
        url: "https://wuflow.cn/logo.png",
      },
    },
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://wuflow.cn/blog/${slug}`,
    },
    keywords: tags.join(", "),
    inLanguage: "zh-CN",
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
