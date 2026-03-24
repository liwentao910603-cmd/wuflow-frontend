'use client';

import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const initSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  
  return createClient(url, key);
};

const supabase = initSupabase();

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  // 简单的邮箱验证
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setStatus('error');
      setMessage('请输入有效的邮箱地址');
      return;
    }

    if (!supabase) {
      setStatus('error');
      setMessage('系统错误，请稍后重试');
      return;
    }

    setStatus('loading');

    const { error } = await supabase
      .from('waitlist')
      .insert([{ email: trimmedEmail }]);

    if (error) {
      if (error.code === '23505') {
        // 唯一约束冲突，邮箱已存在
        setStatus('error');
        setMessage('这个邮箱已经在名单里了 😊');
      } else {
        setStatus('error');
        setMessage('提交失败，请稍后再试');
      }
    } else {
      setStatus('success');
      setMessage('🎉 已加入！我们会第一时间通知你');
      setEmail('');
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 text-white">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-400">悟流</span>
          <span className="text-lg text-slate-400">WuFlow</span>
        </div>
        <button
          onClick={() => inputRef.current?.focus()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
        >
          提前加入
        </button>
      </nav>

      {/* 主标题区 */}
      <section className="max-w-6xl mx-auto px-8 py-24 text-center">
        <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-2 rounded-full mb-8">
          🚀 正在开发中，欢迎提前加入等待名单
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          让知识真正<span className="text-blue-400">流动</span>起来
        </h1>
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
          悟流 WuFlow 是专为跨界自学者打造的 AI 学习加速工具。
          把散乱的资料变成结构化知识，把重复的文档工作自动化。
        </p>

        {/* 邮件提交区 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus('idle');
              setMessage('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="输入你的邮箱，提前加入等待名单"
            disabled={status === 'loading' || status === 'success'}
            className="bg-slate-700 border border-slate-600 text-white px-6 py-3 rounded-full w-full sm:w-96 focus:outline-none focus:border-blue-400 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || status === 'success'}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-medium transition-colors whitespace-nowrap"
          >
            {status === 'loading' ? '提交中...' : status === 'success' ? '已加入 ✓' : '加入等待名单 →'}
          </button>
        </div>

        {/* 状态提示 */}
        {message && (
          <p className={`mt-4 text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}
      </section>

      {/* 三大功能 */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">三个核心功能，解决学习中最烦的事</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-3">资料一键整理</h3>
            <p className="text-slate-400">
              粘贴文章链接或上传 PDF，AI 自动提取关键知识点，生成结构化笔记。30秒搞定过去要1小时的整理工作。
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-3">学习进度追踪</h3>
            <p className="text-slate-400">
              每天30秒记录学习内容，AI 每周自动生成学习周报。看见自己的成长，保持学习动力。
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold mb-3">私人 AI 知识库</h3>
            <p className="text-slate-400">
              基于你自己整理的笔记回答问题，不是泛泛的 ChatGPT，而是真正懂你在学什么的专属 AI 助手。
            </p>
          </div>
        </div>
      </section>

      {/* 底部 */}
      <footer className="text-center py-12 text-slate-500 text-sm">
        <p>悟流 WuFlow · wuflow.cn · 让知识流动起来</p>
      </footer>
    </main>
  );
}
