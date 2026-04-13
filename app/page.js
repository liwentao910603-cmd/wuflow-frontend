'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const DEMO_URL = 'https://arxiv.org/abs/attention-is-all-you-need';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCount, setUserCount] = useState(null);
  const [latestPosts, setLatestPosts] = useState([]);
  const [demoState, setDemoState] = useState('typing'); // 'typing' | 'loading' | 'done'
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash && hash.includes('type=recovery')) {
        window.location.replace('/reset-password' + hash);
        return;
      }
      if (search && search.includes('error=access_denied')) {
        window.location.replace('/reset-password' + search + hash);
        return;
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    fetch(`${API_URL}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user_count) setUserCount(data.user_count); })
      .catch(() => {});
    fetch(`${API_URL}/blog/posts`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const list = Array.isArray(data) ? data : (data.posts ?? []);
        setLatestPosts(list.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  // 打字动画状态机
  useEffect(() => {
    let t;
    if (demoState === 'typing') {
      if (typedText.length < DEMO_URL.length) {
        t = setTimeout(() => setTypedText(DEMO_URL.slice(0, typedText.length + 1)), 55);
      } else {
        t = setTimeout(() => setDemoState('loading'), 600);
      }
    } else if (demoState === 'loading') {
      t = setTimeout(() => setDemoState('done'), 1800);
    } else if (demoState === 'done') {
      t = setTimeout(() => { setTypedText(''); setDemoState('typing'); }, 4500);
    }
    return () => clearTimeout(t);
  }, [demoState, typedText]);

  return (
    <main style={{ fontFamily: "'Inter','Noto Sans SC','PingFang SC',sans-serif", background: '#fff', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* 导航 */}
      <nav style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src="/android-chrome-192x192.png" width={28} height={28} style={{ borderRadius: 6 }} alt="WuFlow" />
          <span style={{ fontWeight: 700, fontSize: 18, color: 'rgba(0,0,0,0.87)', letterSpacing: '-0.3px' }}>悟流 WuFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 16 }}>
            <a href="#features" style={{ fontSize: 14, color: '#6b6b6b', textDecoration: 'none', padding: '8px 12px' }}>功能</a>
            <a href="#faq" style={{ fontSize: 14, color: '#6b6b6b', textDecoration: 'none', padding: '8px 12px' }}>FAQ</a>
            <Link href="/blog" style={{ fontSize: 14, color: '#6b6b6b', textDecoration: 'none', padding: '8px 12px' }}>博客</Link>
          </div>
          {isLoggedIn ? (
            <a href="/dashboard" style={{ background: '#111', color: '#fff', padding: '8px 18px', borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>进入我的空间 →</a>
          ) : (
            <>
              <a href="/login" style={{ fontSize: 14, color: '#6b6b6b', textDecoration: 'none', padding: '8px 14px' }}>登录</a>
              <a href="/register" style={{ background: '#111', color: '#fff', padding: '8px 18px', borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>免费注册</a>
            </>
          )}
        </div>
      </nav>

      {/* Hero — 深色背景 */}
      <section style={{ background: '#0D1117' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 40px 72px', display: 'flex', alignItems: 'center', gap: 60 }}>
          {/* 左侧文字 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)', borderRadius: 9999, padding: '4px 14px', fontSize: 12, color: '#00E5A0', marginBottom: 28, fontWeight: 600 }}>
              🎓 读文章 · 问AI · 不再遗忘
            </div>
            <h1 style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-2px', color: '#fff', margin: '0 0 28px' }}>
              让知识真正<br />流动起来
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 2.1, margin: '0 0 40px' }}>
              粘贴文章/PDF&nbsp;
              <span style={{ color: '#00E5A0', fontWeight: 700 }}>→</span>&nbsp;
              AI生成结构化笔记&nbsp;
              <span style={{ color: '#00E5A0', fontWeight: 700 }}>→</span>&nbsp;
              自动提取概念Wiki&nbsp;
              <span style={{ color: '#00E5A0', fontWeight: 700 }}>→</span>&nbsp;
              随时AI问答&nbsp;
              <span style={{ color: '#00E5A0', fontWeight: 700 }}>→</span>&nbsp;
              智能遗忘复习
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <a href="/register" style={{ background: '#00E5A0', color: '#0D1117', padding: '13px 28px', borderRadius: 6, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                免费开始使用 →
              </a>
              <a href="#features" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', padding: '13px 20px' }}>
                了解更多 ↓
              </a>
            </div>
            <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              已有账号？{' '}
              <a href="/login" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline' }}>直接登录</a>
            </p>
          </div>

          {/* 右侧 Mock 卡片 */}
          <div style={{ flexShrink: 0, width: 340 }}>
            <div style={{ background: '#161b22', borderRadius: 16, padding: '22px', boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#555', background: '#1a2030', padding: '2px 8px', borderRadius: 9999 }}>AI 笔记</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0', margin: '0 0 8px', lineHeight: 1.4 }}>理解 Transformer 架构</h3>
              <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.75, margin: '0 0 14px' }}>
                Transformer 通过自注意力机制并行处理序列数据，取代 RNN 的顺序计算瓶颈，成为现代大模型基础...
              </p>
              <div style={{ background: '#1a2030', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#3d4a5c', marginBottom: 8, fontWeight: 600, letterSpacing: '.6px', textTransform: 'uppercase' }}>核心概念</div>
                {['自注意力机制（Self-Attention）', 'Multi-Head Attention', '位置编码（Positional Encoding）'].map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#8892a4', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#00E5A0', fontSize: 9 }}>▸</span>{p}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {['#机器学习', '#神经网络', '#NLP'].map((tag, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#00E5A0', background: 'rgba(0,229,160,0.1)', padding: '3px 8px', borderRadius: 9999 }}>{tag}</span>
                ))}
              </div>
              <div style={{ background: '#00E5A0', borderRadius: 8, padding: '9px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#0D1117', cursor: 'pointer' }}>
                加入复习计划 →
              </div>
            </div>
          </div>
        </div>

        {/* 信任条 */}
        <div style={{ maxWidth: 1100, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, flexWrap: 'wrap' }}>
          {[
            `✅ 已有 ${userCount ? `${userCount}+` : '数百'} 位自学者在使用`,
            '✅ 数据仅自己可见',
            '✅ 完全免费开始',
          ].map((text, i) => (
            <span key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{text}</span>
          ))}
        </div>
      </section>

      {/* 功能区 — 交替左右布局 */}
      <section id="features">

        {/* F1: 整理资料 — 文左图右 */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '80px 40px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#00875a', background: '#e3fcf7', padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>已上线</span>
              <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px', color: 'rgba(0,0,0,0.87)', margin: '16px 0 12px' }}>📥 一键整理任何资料</h2>
              <p style={{ fontSize: 15, color: '#6b6b6b', lineHeight: 1.8, margin: '0 0 24px' }}>粘贴文章链接、上传 PDF，AI 自动提取知识点，生成结构化笔记。30秒搞定过去要1小时的整理工作。</p>
              <a href="/ingest" style={{ fontSize: 14, color: 'rgba(0,0,0,0.87)', fontWeight: 600, textDecoration: 'none' }}>立即体验 →</a>
            </div>
            <div style={{ flexShrink: 0, width: 380 }}>
              <div style={{ background: '#f8f9fa', borderRadius: 14, padding: '20px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12 }}>
                  <span style={{ color: '#aaa' }}>🔗</span>
                  <span style={{ color: '#999', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>https://arxiv.org/abs/attention-is-all-you-need</span>
                </div>
                <div style={{ background: '#0D1117', color: '#00E5A0', textAlign: 'center', borderRadius: 7, padding: '8px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>AI 整理中... ✨</div>
                <div style={{ background: '#fff', borderRadius: 10, padding: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Attention Is All You Need</div>
                  <div style={{ fontSize: 12, color: '#6b6b6b', lineHeight: 1.7, marginBottom: 10 }}>🎯 提出纯注意力机制的 Transformer 架构，取代 RNN 成为 NLP 主流范式...</div>
                  {['自注意力机制实现并行计算', '编码器-解码器架构', 'BLEU 分数超越所有 RNN 基线'].map((p, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#555', padding: '3px 0', display: 'flex', gap: 6 }}>
                      <span style={{ color: '#00875a' }}>✓</span>{p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* F2: 概念 Wiki — 图左文右 */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '80px 40px', background: '#fafafa' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexDirection: 'row-reverse' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#00875a', background: '#e3fcf7', padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>已上线</span>
              <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px', color: 'rgba(0,0,0,0.87)', margin: '16px 0 12px' }}>🧩 自动提取概念 Wiki</h2>
              <p style={{ fontSize: 15, color: '#6b6b6b', lineHeight: 1.8, margin: '0 0 24px' }}>每次整理后，AI 自动识别陌生概念并生成词条。学机器学习遇到&ldquo;注意力机制&rdquo;，自动建卡，不再卡壳。</p>
              <Link href="/notes" style={{ fontSize: 14, color: 'rgba(0,0,0,0.87)', fontWeight: 600, textDecoration: 'none' }}>查看知识库 →</Link>
            </div>
            <div style={{ flexShrink: 0, width: 380 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, background: 'rgba(0,229,160,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧩</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>注意力机制</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>Attention Mechanism</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#00875a', background: '#e3fcf7', padding: '2px 7px', borderRadius: 9999, whiteSpace: 'nowrap' }}>AI 生成</span>
                </div>
                <p style={{ fontSize: 12, color: '#6b6b6b', lineHeight: 1.75, margin: '0 0 14px', borderLeft: '2px solid #00E5A0', paddingLeft: 10 }}>
                  允许模型在处理序列时，动态关注输入中最相关的部分，而非平均加权所有位置。
                </p>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>相关概念</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Transformer', 'Self-Attention', 'Cross-Attention', 'BERT'].map((t, i) => (
                      <span key={i} style={{ fontSize: 11, color: '#555', background: '#f0f0f0', padding: '3px 8px', borderRadius: 9999 }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#深度学习', '#NLP'].map((t, i) => (
                    <span key={i} style={{ fontSize: 11, color: '#00875a', background: '#e3fcf7', padding: '3px 8px', borderRadius: 9999 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* F3: AI 问答 — 文左图右 */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '80px 40px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#00875a', background: '#e3fcf7', padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>已上线</span>
              <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px', color: 'rgba(0,0,0,0.87)', margin: '16px 0 12px' }}>💬 私人 AI 知识库问答</h2>
              <p style={{ fontSize: 15, color: '#6b6b6b', lineHeight: 1.8, margin: '0 0 24px' }}>基于你自己整理的笔记回答问题。不是泛泛的 ChatGPT，而是真正懂你在学什么的专属 AI 助手。</p>
              <a href="/qa" style={{ fontSize: 14, color: 'rgba(0,0,0,0.87)', fontWeight: 600, textDecoration: 'none' }}>开始问答 →</a>
            </div>
            <div style={{ flexShrink: 0, width: 380 }}>
              <div style={{ background: '#f8f9fa', borderRadius: 14, padding: '20px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <div style={{ background: '#111', color: '#fff', borderRadius: '12px 12px 2px 12px', padding: '10px 14px', fontSize: 12, maxWidth: '82%', lineHeight: 1.6 }}>
                    Self-Attention 和 Cross-Attention 有什么区别？
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,229,160,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
                  <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '2px 12px 12px 12px', padding: '10px 14px', fontSize: 12, lineHeight: 1.75, color: '#333' }}>
                    <strong>Self-Attention</strong> 在同一序列内计算关联，<strong>Cross-Attention</strong> 则跨越两个序列（如编码器→解码器）...
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11 }}>📄</span>
                  <span style={{ fontSize: 11, color: '#888' }}>来源：《理解 Transformer 架构》· 2天前整理</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* F4: 复习 — 图左文右 */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '80px 40px', background: '#fafafa' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexDirection: 'row-reverse' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#00875a', background: '#e3fcf7', padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>已上线</span>
              <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px', color: 'rgba(0,0,0,0.87)', margin: '16px 0 12px' }}>🔁 遗忘曲线智能复习</h2>
              <p style={{ fontSize: 15, color: '#6b6b6b', lineHeight: 1.8, margin: '0 0 24px' }}>在你最容易忘记的时间点，AI 主动出题考你。从被动存储变成主动学习伙伴，真正记住所学内容。</p>
              <a href="/review" style={{ fontSize: 14, color: 'rgba(0,0,0,0.87)', fontWeight: 600, textDecoration: 'none' }}>开始复习 →</a>
            </div>
            <div style={{ flexShrink: 0, width: 380 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: '#888' }}>今日复习 · 3/5 题</span>
                  <div style={{ height: 4, width: 80, background: '#f0f0f0', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '60%', background: '#00E5A0', borderRadius: 9999 }} />
                  </div>
                </div>
                <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>来自《Transformer 架构》</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.6 }}>Transformer 相比 RNN 的核心优势是什么？</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'A. 参数更少', correct: false },
                    { label: 'B. 可并行计算', correct: true },
                    { label: 'C. 更低显存', correct: false },
                    { label: 'D. 支持更长文本', correct: false },
                  ].map((opt, i) => (
                    <div key={i} style={{ border: `1px solid ${opt.correct ? '#00E5A0' : 'rgba(0,0,0,0.08)'}`, background: opt.correct ? 'rgba(0,229,160,0.08)' : '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: opt.correct ? '#00704a' : '#555', fontWeight: opt.correct ? 600 : 400 }}>
                      {opt.label}{opt.correct ? ' ✓' : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 30秒上手演示 */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />
      <section style={{ background: '#0D1117', padding: '80px 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#00E5A0', fontWeight: 700, letterSpacing: '.8px', marginBottom: 14 }}>DEMO</div>
          <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-1px', color: '#fff', margin: '0 0 10px' }}>30秒看懂 WuFlow</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: '0 0 44px' }}>粘贴一个链接，AI 帮你做完剩下的</p>

          <div style={{ background: '#161b22', borderRadius: 16, padding: '28px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>
            {/* 输入框 */}
            <div style={{ background: '#0D1117', border: `1px solid ${demoState === 'typing' ? 'rgba(0,229,160,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, transition: 'border-color 0.3s' }}>
              <span style={{ fontSize: 13, color: '#555', flexShrink: 0 }}>🔗</span>
              <span style={{ fontSize: 12, color: '#aaa', flex: 1, fontFamily: 'monospace', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {typedText}
                {demoState === 'typing' && (
                  <span style={{ display: 'inline-block', width: 2, height: 14, background: '#00E5A0', marginLeft: 1, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
                )}
              </span>
            </div>

            {demoState === 'typing' && (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#3d4a5c', padding: '28px 0' }}>
                正在输入链接...
              </div>
            )}

            {demoState === 'loading' && (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ width: 28, height: 28, border: '3px solid rgba(0,229,160,0.2)', borderTopColor: '#00E5A0', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: 13, color: '#00E5A0' }}>AI 正在生成结构化笔记...</div>
                <div style={{ fontSize: 11, color: '#3d4a5c', marginTop: 6 }}>提取关键信息 · 整理概念 · 生成摘要</div>
              </div>
            )}

            {demoState === 'done' && (
              <div style={{ animation: 'fadeInUp 0.5s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: '#00E5A0' }}>✓</span>
                  <span style={{ fontSize: 13, color: '#00E5A0', fontWeight: 600 }}>笔记生成完成</span>
                  <span style={{ fontSize: 11, color: '#3d4a5c', marginLeft: 'auto' }}>用时 28秒</span>
                </div>
                <div style={{ background: '#1a2030', borderRadius: 10, padding: '18px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 }}>Attention Is All You Need · 2017</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.75, marginBottom: 12 }}>
                    🎯 核心贡献：提出纯注意力机制的 Transformer 架构，取代 RNN 成为 NLP 主流范式...
                  </div>
                  {['自注意力机制实现并行计算', '编码器-解码器结构', 'BLEU 分数 SOTA'].map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#8892a4', padding: '3px 0', display: 'flex', gap: 6 }}>
                      <span style={{ color: '#00E5A0' }}>▸</span>{p}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                    {['#机器学习', '#Transformer', '#论文精读'].map((t, i) => (
                      <span key={i} style={{ fontSize: 11, color: '#00E5A0', background: 'rgba(0,229,160,0.1)', padding: '2px 8px', borderRadius: 9999 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 对比区 */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-1px', color: 'rgba(0,0,0,0.87)', margin: '0 0 12px' }}>
          WuFlow 解决的不是「存」，是「懂」
        </h2>
        <p style={{ fontSize: 15, color: '#6b6b6b', margin: '0 0 48px' }}>竞品在解决「找得到吗」，WuFlow 在解决「真的学会了吗」</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
          {[
            { label: '其他工具', items: ['存下来了吗？', '找得到吗？', '整理好了吗？', '你问它才回答'] },
            { label: 'WuFlow', items: ['真的学会了吗？', '哪里还没搞懂？', '下一步该学什么？', '主动发现你的盲区'] },
          ].map((col, i) => (
            <div key={i} style={{ background: i === 1 ? '#111' : '#f7f6f3', border: `1px solid ${i === 1 ? '#111' : 'rgba(0,0,0,0.08)'}`, borderRadius: 10, padding: '24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: i === 1 ? '#555' : '#6b6b6b', marginBottom: 16, letterSpacing: '.5px' }}>{col.label}</div>
              {col.items.map((item, j) => (
                <div key={j} style={{ fontSize: 14, color: i === 1 ? '#fff' : '#6b6b6b', padding: '8px 0', borderBottom: j < col.items.length - 1 ? `1px solid ${i === 1 ? '#222' : 'rgba(0,0,0,0.06)'}` : 'none', textDecoration: i === 0 ? 'line-through' : 'none', opacity: i === 0 ? 0.5 : 1 }}>
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
          <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-1px', color: 'rgba(0,0,0,0.87)', margin: '0 0 12px' }}>常见问题</h2>
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

      {/* 最新文章 */}
      {latestPosts.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(0,0,0,0.87)', margin: 0, letterSpacing: '-0.5px' }}>最新文章</h2>
            <Link href="/blog" style={{ fontSize: 13, color: '#6b6b6b', textDecoration: 'none' }}>全部 →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {latestPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', textDecoration: 'none', gap: 16 }}
              >
                <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.75)', fontWeight: 500, lineHeight: 1.5 }}>{post.title}</span>
                <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {new Date(post.published_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: '#0D1117', padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: '-1px' }}>
          开始构建你的私人知识库
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', margin: '0 0 32px' }}>完全免费 · 注册即用 · 数据仅自己可见</p>
        <a href="/register" style={{ background: '#00E5A0', color: '#0D1117', padding: '14px 36px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
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
