"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

interface Note {
  id: string;
  title: string;
  summary: string;
  concepts: string[];
  key_points: string[];
  action_items: string[];
  tags: string[];
  source_url: string;
  source_type: string;
  tokens_used: number;
  created_at: string;
}

type Filter = "all" | "url" | "pdf" | "text";

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

function SourceBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    url:  { label: "网页", cls: "bg-blue-50 text-blue-500" },
    pdf:  { label: "PDF",  cls: "bg-orange-50 text-orange-500" },
    text: { label: "文本", cls: "bg-green-50 text-green-500" },
  };
  const c = config[type] || { label: type, cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      setAccessToken(session?.access_token ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "12",
        ...(filter !== "all" ? { source_type: filter } : {}),
      });
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API}/notes?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setNotes(data.notes || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确认删除这条笔记？删除后无法恢复。")) return;
    setDeleting(id);
    try {
      const token = accessToken;
      await fetch(`${API}/notes/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } finally {
      setDeleting(null);
      fetchNotes();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif" }}>
      <Sidebar userEmail={userEmail ?? ""} />
      <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* 整合提示 */}
        <div className="mb-8 bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-700 font-medium mb-0.5">想边整理、边查看笔记？</p>
            <p className="text-xs text-gray-400">整理资料页提供双栏模式，左侧提交新资料，右侧实时显示知识库。</p>
          </div>
          <Link
            href="/ingest"
            className="shrink-0 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-center"
          >
            前往整理页 →
          </Link>
        </div>

        {/* 标题栏 */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">知识库</h1>
            <p className="text-gray-400 text-sm">
              {loading ? "加载中..." : `共 ${total} 条笔记`}
            </p>
          </div>
          <Link
            href="/ingest"
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + 添加资料
          </Link>
        </div>

        {/* 过滤器 */}
        <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-lg w-fit">
          {(["all", "url", "pdf", "text"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {f === "all" ? "全部" : f === "url" ? "🔗 网页" : f === "pdf" ? "📄 PDF" : "✏️ 文本"}
            </button>
          ))}
        </div>

        {/* 笔记列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-300 text-sm">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
            </svg>
            加载中...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-gray-300 text-sm mb-4">
              {filter !== "all" ? "这个分类还没有笔记" : "知识库还是空的"}
            </p>
            <Link
              href="/ingest"
              className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors"
            >
              去整理第一条资料 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3" onClick={() => setOpenMenu(null)}>
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors"
              >
                <div
                  className="px-5 py-4 cursor-pointer flex items-start justify-between gap-4"
                  onClick={() => setExpanded(expanded === note.id ? null : note.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <SourceBadge type={note.source_type} />
                      <span className="text-xs text-gray-300">{formatDate(note.created_at)}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 leading-snug">{note.title}</h3>
                    {expanded !== note.id && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {note.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 mt-0.5">
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === note.id ? null : note.id); }}
                        className="text-gray-300 hover:text-gray-500 transition-colors"
                        style={{ fontSize: 10, letterSpacing: '-3px', padding: '1px 1px', lineHeight: 1 }}
                      >
                        ···
                      </button>
                      {openMenu === note.id && (
                        <div
                          style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 100, padding: '4px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => { setOpenMenu(null); handleDelete(note.id, e); }}
                            disabled={deleting === note.id}
                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            {deleting === note.id ? '删除中...' : '删除'}
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-300 text-xs select-none">
                      {expanded === note.id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {expanded === note.id && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">📝 摘要</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{note.summary}</p>
                    </div>

                    {note.concepts?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">💡 核心概念</p>
                        <div className="flex flex-wrap gap-1.5">
                          {note.concepts.map((c, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {note.key_points?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">✅ 核心要点</p>
                        <ul className="space-y-1.5">
                          {note.key_points.map((p, i) => (
                            <li key={i} className="text-sm text-gray-600 flex gap-2">
                              <span className="text-gray-300 shrink-0">·</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {note.action_items?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">🚀 行动建议</p>
                        <ul className="space-y-1.5">
                          {note.action_items.map((a, i) => (
                            <li key={i} className="text-sm text-gray-600 flex gap-2">
                              <span className="text-gray-300 shrink-0">{i + 1}.</span>{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex flex-wrap gap-1.5">
                        {note.tags?.map((tag, i) => (
                          <span key={i} className="text-xs text-gray-300">#{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4">
                        {note.source_url &&
                          !note.source_url.startsWith("pdf://") &&
                          !note.source_url.startsWith("text://") && (
                            <a
                              href={note.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors"
                            >
                              查看原文 →
                            </a>
                          )}
                        <Link href="/qa" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                          💬 去问答
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors"
            >
              ← 上一页
            </button>
            <span className="text-sm text-gray-400">第 {page} 页，共 {totalPages} 页</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors"
            >
              下一页 →
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
