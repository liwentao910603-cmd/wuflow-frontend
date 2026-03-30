'use client';

import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const initSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const supabase = initSupabase();

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      setStatus('error'); setMessage('请输入有效的邮箱地址'); return;
    }
    if (!supabase) { setStatus('error'); setMessage('系统错误，请稍后重试'); return; }
    setStatus('loading');
    const { error } = await supabase.from('waitlist').insert([{ email: trimmed }]);
    if (error) {
      setStatus('error');
      setMessage(error.code === '23505' ? '这个邮箱已经在名单里了 😊' : '提交失败，请稍后再试');
    } else {
      setStatus('success'); setMessage('🎉 已加入！我们会第一时间通知你'); setEmail('');
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif" }}>

      {/* 导航 */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900 tracking-tight">悟流 WuFlow</span>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/ingest" className="hover:text-gray-900 transition-colors">整理资料</Link>
          <Link href="/notes" className="hover:text-gray-900 transition-colors">知识库</Link>
          <Link href="/qa" className="hover:text-gray-900 transition-colors">AI问答</Link>
          <button
            onClick={() => inputRef.current?.focus()}
            className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            提前加入
          </button>
        </div>
      </nav>

      {/* 主标题 */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="inline-block border border-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded-full mb-8">
          🚀 正在开发中，欢迎提前加入等待名单
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight">
          让知识真正<span className="border-b-4 border-gray-900">流动</span>起来
        </h1>
        <p className="text-lg text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
          悟流 WuFlow 是专为跨界自学者打造的 AI 学习加速工具。
          把散乱的资料变成结构化知识，把重复的文档工作自动化。
        </p>

        {/* 邮件提交 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setMessage(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="输入你的邮箱，提前加入等待名单"
            disabled={status === 'loading' || status === 'success'}
            className="border border-gray-200 text-gray-900 px-4 py-3 rounded-lg flex-1 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || status === 'success'}
            className="bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {status === 'loading' ? '提交中...' : status === 'success' ? '已加入 ✓' : '加入等待名单 →'}
          </button>
        </div>

        {message && (
          <p className={`mt-4 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}
      </section>

      {/* 三大功能 */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-semibold text-center mb-12 text-gray-900">
          三个核心功能，解决学习中最烦的事
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '📚',
              title: '资料一键整理',
              desc: '粘贴文章链接或上传 PDF，AI 自动提取关键知识点，生成结构化笔记。30秒搞定过去要1小时的整理工作。',
              href: '/ingest',
            },
            {
              icon: '📈',
              title: '学习进度追踪',
              desc: '每天30秒记录学习内容，AI 每周自动生成学习周报。看见自己的成长，保持学习动力。',
              href: null,
            },
            {
              icon: '🧠',
              title: '私人 AI 知识库',
              desc: '基于你自己整理的笔记回答问题，不是泛泛的 ChatGPT，而是真正懂你在学什么的专属 AI 助手。',
              href: '/qa',
            },
          ].map((f, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-6 hover:border-gray-200 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{f.desc}</p>
              {f.href && (
                <Link href={f.href} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  立即体验 →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 底部 */}
      <footer className="text-center py-12 text-gray-300 text-xs border-t border-gray-100">
        悟流 WuFlow · wuflow.cn · 让知识流动起来
      </footer>
    </main>
  );
}
