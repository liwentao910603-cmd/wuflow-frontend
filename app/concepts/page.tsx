"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

interface ConceptSummary {
  term: string;
  summary: string;
  status: "processing" | "done" | "error";
  updated_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

function StatusBadge({ status }: { status: ConceptSummary["status"] }) {
  if (status === "done") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-500">
        已生成
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400 animate-pulse">
        生成中
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-400">
      生成失败
    </span>
  );
}

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<ConceptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? null);
      try {
        const res = await fetch(`${API}/concepts`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list: ConceptSummary[] = Array.isArray(data) ? data : (data.concepts || []);
          setConcepts(list);
        }
      } catch {
        // 静默失败
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}
    >
      <Sidebar userEmail={userEmail ?? ""} />
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto px-6 py-10">

          {/* 标题栏 */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">概念库</h1>
              <p className="text-gray-400 text-sm">
                {loading ? "加载中..." : `共 ${concepts.length} 个概念 · 点击笔记中的概念标签自动生成`}
              </p>
            </div>
          </div>

          {/* 加载中 */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                  <div className="h-5 bg-gray-100 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {!loading && concepts.length === 0 && (
            <div className="text-center py-32">
              <div className="text-4xl mb-4">📖</div>
              <p className="text-gray-400 text-sm mb-2">还没有概念 Wiki</p>
              <p className="text-gray-300 text-xs mb-6">去知识库点击笔记中的概念标签开始生成吧</p>
              <button
                onClick={() => { window.location.href = "/notes"; }}
                className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors"
              >
                前往知识库 →
              </button>
            </div>
          )}

          {/* 概念卡片网格 */}
          {!loading && concepts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {concepts.map((c) => (
                <button
                  key={c.term}
                  onClick={() => { window.location.href = `/concepts/${encodeURIComponent(c.term)}`; }}
                  disabled={c.status === "error"}
                  className="text-left border border-gray-100 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-gray-300">{formatDate(c.updated_at)}</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">{c.term}</h3>
                  {c.summary && (
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {c.summary.length > 60 ? c.summary.slice(0, 60) + "…" : c.summary}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
