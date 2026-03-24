'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000';

export default function IngestPage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [history, setHistory] = useState([]);

  const isValidUrl = (str) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed || !isValidUrl(trimmed)) {
      setStatus('error');
      setErrorMsg('请输入有效的网页链接，例如 https://example.com/article');
      return;
    }

    setStatus('loading');
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.detail || '抓取失败，请检查链接是否可访问');
        return;
      }

      setStatus('success');
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 10));
      setUrl('');
    } catch (e) {
      setStatus('error');
      setErrorMsg('网络错误，请确认后端服务正在运行');
    }
  };

  const preview = result?.content?.slice(0, 300);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* 导航 */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl font-bold text-blue-400">悟流</span>
          <span className="text-lg text-slate-400">WuFlow</span>
        </Link>
        <span className="text-sm text-slate-500 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
          资料整理 · Beta
        </span>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* 标题 */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            📎 一键抓取网页正文
          </h1>
          <p className="text-slate-400">
            粘贴任意文章链接，AI 自动提取正文内容并存入你的知识库
          </p>
        </div>

        {/* 输入区 */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
          <label className="block text-sm text-slate-400 mb-3">文章链接</label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="https://example.com/article"
              disabled={status === 'loading'}
              className="flex-1 bg-slate-900 border border-slate-600 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-400 disabled:opacity-50 text-sm font-mono"
            />
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap text-sm"
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  抓取中...
                </span>
              ) : '抓取正文 →'}
            </button>
          </div>

          {/* 错误提示 */}
          {status === 'error' && (
            <p className="mt-3 text-sm text-red-400 flex items-center gap-1">
              <span>⚠️</span> {errorMsg}
            </p>
          )}
        </div>

        {/* 结果卡片 */}
        {status === 'success' && result && (
          <div className="bg-slate-800 border border-green-500/30 rounded-2xl p-6 mb-8 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400 text-sm font-medium">✓ 抓取成功</span>
                  <span className="text-slate-500 text-xs">· {result.word_count} 字</span>
                </div>
                <h2 className="text-lg font-semibold text-white leading-snug">
                  {result.title || '（无标题）'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-mono truncate max-w-lg">
                  {result.url}
                </p>
              </div>
              <span className="text-xs text-slate-600 whitespace-nowrap ml-4 mt-1">
                ID: {result.id?.slice(0, 8)}...
              </span>
            </div>

            {/* 正文预览 */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <p className="text-xs text-slate-500 mb-2">正文预览</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {preview}
                {result.content?.length > 300 && (
                  <span className="text-slate-500"> ...（共 {result.word_count} 字）</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">本次会话记录</h3>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 hover:border-slate-600 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">
                      {item.title || '（无标题）'}
                    </p>
                    <p className="text-xs text-slate-500 truncate font-mono mt-0.5">
                      {item.url}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 ml-4 whitespace-nowrap">
                    {item.word_count} 字
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
