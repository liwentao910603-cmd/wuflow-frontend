"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

interface StreamNote {
  id: string;
  title?: string;
  content: string;
  source_url?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

function formatRelativeTime(iso: string) {
  const now = new Date();
  const d = new Date(iso);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StreamNotesPage() {
  const [notes, setNotes] = useState<StreamNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const tokenRef = useRef("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? "");
      tokenRef.current = session.access_token;
      fetchNotes(session.access_token);
    });
  }, []);

  async function fetchNotes(token: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/stream-notes?page_size=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setNotes(data.notes || data || []);
    } catch (e: unknown) {
      setError("加载失败，请刷新重试");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("确认删除这条流记？删除后无法恢复。")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API}/stream-notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (!res.ok) throw new Error();
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      alert("删除失败，请重试");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}>
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 overflow-y-auto bg-white relative">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* 标题栏 */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">流记</h1>
              <p className="text-sm text-gray-400">
                {loading ? "加载中..." : `${notes.length} 条随手记`}
              </p>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 加载中 */}
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
              <p className="text-gray-300 text-sm mb-4">还没有流记，写下第一条吧</p>
              <button
                onClick={() => { window.location.href = "/stream-notes/new"; }}
                className="text-sm underline transition-colors"
                style={{ color: "#00E5A0" }}
              >
                新建流记 →
              </button>
            </div>
          ) : (
            /* 时间流卡片列表 */
            <div className="relative">
              {/* 时间轴竖线 */}
              <div
                className="absolute left-[7px] top-2 bottom-2 w-px"
                style={{ background: "rgba(0,0,0,0.06)" }}
              />

              <div className="space-y-4 pl-7">
                {notes.map((note) => (
                  <div key={note.id} className="relative group">
                    {/* 时间轴圆点 */}
                    <div
                      className="absolute -left-7 top-4 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ background: "#00E5A0", boxShadow: "0 0 0 1px rgba(0,229,160,0.3)" }}
                    />

                    {/* 卡片 */}
                    <div
                      className="border border-gray-100 rounded-xl px-5 py-4 hover:border-gray-200 cursor-pointer transition-colors"
                      onClick={() => { window.location.href = `/stream-notes/${note.id}`; }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* 标题（有则显示） */}
                          {note.title && (
                            <h3 className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">
                              {note.title}
                            </h3>
                          )}

                          {/* 内容预览前100字 */}
                          <p className="text-sm text-gray-600 leading-relaxed break-words">
                            {note.content.slice(0, 100)}{note.content.length > 100 && "…"}
                          </p>

                          {/* 来源链接（有则显示） */}
                          {note.source_url && (
                            <a
                              href={note.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1 mt-2 text-xs text-gray-400 hover:text-gray-700 transition-colors truncate max-w-full"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                              </svg>
                              <span className="truncate">{note.source_url}</span>
                            </a>
                          )}

                          {/* 底部：标签 + 时间 */}
                          <div className="flex items-center gap-2 flex-wrap mt-2.5">
                            {note.tags && note.tags.length > 0 && note.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(0,229,160,0.08)", color: "#00b87a" }}
                              >
                                #{tag}
                              </span>
                            ))}
                            <span
                              className="text-xs text-gray-300"
                              title={formatFullDate(note.created_at)}
                            >
                              {formatRelativeTime(note.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => handleDelete(note.id, e)}
                          disabled={deleting === note.id}
                          title="删除"
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 text-gray-300 hover:text-red-500 transition-all disabled:opacity-50"
                        >
                          {deleting === note.id ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m2 0V5a1 1 0 011-1h4a1 1 0 011 1v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右下角浮动「+ 新建」按钮 */}
        <button
          onClick={() => { window.location.href = "/stream-notes/new"; }}
          className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: "#00E5A0", color: "#fff" }}
          title="新建流记"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建
        </button>
      </div>
    </div>
  );
}
