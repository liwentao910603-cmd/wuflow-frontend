'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email ?? '');
    });
  }, []);

  return (
    <main className="min-h-screen text-gray-900" style={{ background: '#F7F7F5', fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif" }}>

      {/* 导航 */}
      <nav className="border-b border-gray-200/50 px-8 py-4 flex items-center justify-between" style={{ background: 'transparent' }}>
        <span className="text-lg font-semibold text-gray-900 tracking-tight">悟流 WuFlow</span>
        <div className="flex items-center gap-3 text-sm">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xs hidden sm:inline">{userEmail}</span>
              <Link
                href="/dashboard"
                className="bg-black text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                进入应用 →
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-black text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              登录 / 注册
            </Link>
          )}
        </div>
      </nav>

      {/* 主标题 */}
      <section className="max-w-4xl mx-auto px-8 py-24">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
          让知识真正<br/>流动起来。
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl leading-relaxed">
          WuFlow 是专为自学者设计的 AI 学习工具。整理资料、问答知识库、追踪学习进度——一个工具全搞定。
        </p>

        {/* CTA */}
        {isLoggedIn ? (
          <div className="flex flex-col items-start gap-3">
            <Link
              href="/dashboard"
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-base font-medium transition-colors"
            >
              进入我的空间 →
            </Link>
            <p className="text-sm text-gray-400">已登录为 {userEmail}</p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <button
              onClick={() => { window.location.href = "/login"; }}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-base font-medium transition-colors"
            >
              免费开始使用 →
            </button>
            <p className="text-sm text-gray-400">
              已有账号？{' '}
              <a href="/login" className="text-gray-600 hover:text-gray-900 hover:underline">立即登录</a>
            </p>
          </div>
        )}
      </section>

      {/* 三大功能 */}
      <section className="max-w-4xl mx-auto px-8 py-16 border-t border-gray-200/60">
        <h2 className="text-2xl font-bold mb-10 text-gray-900">
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
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-colors">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{f.desc}</p>
              <Link
                href={f.href ?? '/login'}
                className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
              >
                开始使用 →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 底部 */}
      <footer className="max-w-4xl mx-auto px-8 py-12 text-gray-400 text-xs border-t border-gray-200/60">
        悟流 WuFlow · wuflow.cn · 让知识流动起来
      </footer>
    </main>
  );
}
