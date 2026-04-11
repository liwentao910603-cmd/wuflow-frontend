'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      console.log('Landing hash:', hash);
      console.log('Landing search:', search);

      // 检查 hash 里有 type=recovery
      if (hash && hash.includes('type=recovery')) {
        window.location.replace('/reset-password' + hash);
        return;
      }
      // 检查 search 里有 error（Supabase 有时把错误放在 query string）
      if (search && search.includes('error=access_denied')) {
        window.location.replace('/reset-password' + search + hash);
        return;
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <main style={{ fontFamily: "'Inter','Noto Sans SC','PingFang SC',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {/* 导航 */}
      <nav style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', zIndex: 100 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.87)', letterSpacing: '-0.3px' }}>悟流 WuFlow</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 16 }}>
            <a href="#features" style={{ fontSize: 14, color: '#6b6b6b', textDecoration: 'none', padding: '8px 12px' }}>功能</a>
            <a href="#faq" style={{ fontSize: 14, color: '#6b6b6b', textDecoration: 'none', padding: '8px 12px' }}>FAQ</a>
          </div>
          {isLoggedIn ? (
            <a href="/dashboard" style={{ background: '#111', color: '#fff', padding: '8px 18px', borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>进入我的空间 →</a>
          ) : (
            <>
              <a href="/login" style={{ fontSize: 14, color: '#6b6b6b', textDecoration: 'none', padding: '8px 14px' }}>登录</a>
              <a href="/login" style={{ background: '#111', color: '#fff', padding: '8px 18px', borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>免费注册</a>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '100px 40px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#f7f6f3', borderRadius: 9999, padding: '4px 14px', fontSize: 12, color: '#6b6b6b', marginBottom: 28, fontWeight: 500 }}>
          🎓 专为自学者打造的 AI 学习工具
        </div>
        <h1 style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-2px', color: 'rgba(0,0,0,0.87)', margin: '0 0 24px' }}>
          让知识真正<br />流动起来
        </h1>
        <p style={{ fontSize: 18, color: '#6b6b6b', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          整理资料、问答知识库、追踪学习进度。<br />不只是存储，而是真正学会。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          <a href="/login" style={{ background: '#111', color: '#fff', padding: '13px 28px', borderRadius: 6, fontSize: 15, fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.2px' }}>
            免费开始使用 →
          </a>
          <a href="#features" style={{ color: '#6b6b6b', fontSize: 14, textDecoration: 'none', padding: '13px 20px' }}>
            了解更多 ↓
          </a>
        </div>
      </section>

      {/* 分隔 */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />

      {/* Features */}
      <section id="features" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1px', color: 'rgba(0,0,0,0.87)', margin: '0 0 12px' }}>
            从「存下来」到「真正懂」
          </h2>
          <p style={{ fontSize: 16, color: '#6b6b6b', margin: 0 }}>三个核心功能，覆盖完整学习闭环</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            {
              icon: '📥',
              title: '资料一键整理',
              desc: '粘贴文章链接、上传 PDF，AI 自动提取知识点，生成结构化笔记。30秒搞定过去要1小时的整理工作。',
              tag: '已上线',
              tagColor: '#e8f5e9',
              tagText: '#2e7d32',
              href: '/ingest',
            },
            {
              icon: '💬',
              title: '私人 AI 知识库',
              desc: '基于你自己整理的笔记回答问题。不是泛泛的 ChatGPT，而是真正懂你在学什么的专属 AI 助手。',
              tag: '已上线',
              tagColor: '#e8f5e9',
              tagText: '#2e7d32',
              href: '/qa',
            },
            {
              icon: '🔁',
              title: '遗忘曲线复习',
              desc: '在你最容易忘记的时间点，AI 主动出题考你。从被动存储变成主动学习伙伴，真正记住所学内容。',
              tag: '已上线',
              tagColor: '#e8f5e9',
              tagText: '#2e7d32',
              href: '/review',
            },
          ].map((f, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '32px 28px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: 'rgba(0,0,0,0.87)', margin: 0 }}>{f.title}</h3>
                <span style={{ fontSize: 11, background: f.tagColor, color: f.tagText, padding: '2px 8px', borderRadius: 9999, fontWeight: 500, flexShrink: 0 }}>{f.tag}</span>
              </div>
              <p style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.7, margin: '0 0 20px', flex: 1 }}>{f.desc}</p>
              {f.href ? (
                <a href={f.href} style={{ fontSize: 13, color: 'rgba(0,0,0,0.87)', fontWeight: 500, textDecoration: 'none' }}>立即体验 →</a>
              ) : (
                <span style={{ fontSize: 13, color: '#a0a0a0' }}>敬请期待</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 分隔 */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />

      {/* 对比区 */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', color: 'rgba(0,0,0,0.87)', margin: '0 0 12px' }}>
          WuFlow 解决的不是「存」，是「懂」
        </h2>
        <p style={{ fontSize: 15, color: '#6b6b6b', margin: '0 0 48px' }}>竞品在解决「找得到吗」，WuFlow 在解决「真的学会了吗」</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
          {[
            { label: '其他工具', items: ['存下来了吗？', '找得到吗？', '整理好了吗？', '你问它才回答'], dim: true },
            { label: 'WuFlow', items: ['真的学会了吗？', '哪里还没搞懂？', '下一步该学什么？', '主动发现你的盲区'], dim: false },
          ].map((col, i) => (
            <div key={i} style={{ background: i === 1 ? '#111' : '#f7f6f3', border: `1px solid ${i === 1 ? '#111' : 'rgba(0,0,0,0.08)'}`, borderRadius: 10, padding: '24px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: i === 1 ? '#a0a0a0' : '#6b6b6b', marginBottom: 16, letterSpacing: '.5px' }}>{col.label}</div>
              {col.items.map((item, j) => (
                <div key={j} style={{ fontSize: 14, color: i === 1 ? '#fff' : '#6b6b6b', padding: '8px 0', borderBottom: j < col.items.length - 1 ? `1px solid ${i === 1 ? '#333' : 'rgba(0,0,0,0.06)'}` : 'none', textDecoration: i === 0 ? 'line-through' : 'none', opacity: i === 0 ? 0.6 : 1 }}>
                  {i === 1 ? '✓ ' : ''}{item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />
      <section id="faq" style={{ maxWidth: 860, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', color: 'rgba(0,0,0,0.87)', margin: '0 0 12px' }}>常见问题</h2>
          <p style={{ fontSize: 15, color: '#6b6b6b', margin: 0 }}>有疑问？这里有答案</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {[
            { q: '我的数据安全吗？', a: '你的笔记仅对你可见，采用行级安全隔离（RLS），我们不会用你的数据训练 AI。' },
            { q: '支持哪些格式？', a: '目前支持网页 URL、PDF 文件、纯文本粘贴，视频字幕文本也可以直接粘贴整理。' },
            { q: '和 Notion 有什么区别？', a: 'Notion 解决「存」，WuFlow 解决「懂」。我们会在你快要遗忘时主动出题考你，不只是帮你整理笔记。' },
            { q: '免费版有什么限制？', a: '目前完全免费，Pro 功能即将上线，现在注册的用户享有早鸟权益。' },
            { q: 'AI 回答的来源是哪里？', a: '只基于你自己整理的笔记回答，不会混入外部信息，答案 100% 来自你的知识库。' },
            { q: '知乎等需要登录的网站支持吗？', a: '需要登录的网站建议用「文本模式」，复制文章内容粘贴进来整理即可。' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.87)', marginBottom: 8 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.7 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#111', padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', margin: '0 0 16px', letterSpacing: '-1px' }}>
          开始构建你的私人知识库
        </h2>
        <a href="/login" style={{ background: '#fff', color: '#111', padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
          免费开始使用 →
        </a>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#a0a0a0' }}>悟流 WuFlow · wuflow.cn</span>
        <span style={{ fontSize: 13, color: '#a0a0a0' }}>让知识流动起来</span>
      </footer>
    </main>
  );
}
