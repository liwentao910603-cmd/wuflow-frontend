"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCache, setCache, invalidatePrefix } from "@/lib/cache";
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
  status?: string;
  concepts_detail?: { term: string; definition: string }[];
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

  // 复习状态：noteId -> true(已加入) | false(未加入) | 'loading'
  const [reviewStatus, setReviewStatus] = useState<Record<string, boolean | "loading">>({});
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const tokenRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const pollCount = useRef<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? null);
      setAccessToken(session.access_token);
      tokenRef.current = session.access_token;
      fetchNotes(session.access_token);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const fetchNotes = useCallback(async (t: string) => {
    const cacheKey = `notes:list:${page}:${filter}`;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    // 检查缓存（仅在无处理中笔记时使用）
    const cached = getCache(cacheKey) as { notes: Note[]; total: number; totalPages: number } | null;
    if (cached) {
      setNotes(cached.notes);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "12",
        ...(filter !== "all" ? { source_type: filter } : {}),
      });
      const res = await fetch(`${API}/notes?${params}`, {
        headers: { Authorization: `Bearer ${t}` },
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      const notesList: Note[] = data.notes || [];

      // #11 — 超过20次轮询标记为超时
      const timedOutIds = new Set<string>();
      notesList.forEach(n => {
        if (n.status === 'processing') {
          pollCount.current[n.id] = (pollCount.current[n.id] || 0) + 1;
          if (pollCount.current[n.id] > 20) {
            timedOutIds.add(n.id);
            delete pollCount.current[n.id];
          }
        } else {
          delete pollCount.current[n.id];
        }
      });
      const finalNotes = notesList.map(n =>
        timedOutIds.has(n.id) ? { ...n, status: 'error' } : n
      );
      setNotes(finalNotes);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);

      const stillProcessing = finalNotes.filter(n => n.status === 'processing');
      if (stillProcessing.length > 0) {
        setTimeout(() => fetchNotes(tokenRef.current), 3000);
      } else {
        // 所有笔记已生成完成，写入缓存
        setCache(cacheKey, { notes: finalNotes, total: data.total || 0, totalPages: data.total_pages || 1 });
      }
      setLoading(false);
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return;
      setNotes([]);
      setLoading(false);
    }
  }, [page, filter]);

  // page/filter 变化时重新拉取（token 已就绪后才触发）
  useEffect(() => {
    if (tokenRef.current) fetchNotes(tokenRef.current);
  }, [page, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // 展开笔记时拉取复习状态
  const fetchReviewStatus = useCallback(async (noteId: string) => {
    if (reviewStatus[noteId] !== undefined) return;
    setReviewStatus(prev => ({ ...prev, [noteId]: "loading" }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API}/review/status/${noteId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setReviewStatus(prev => ({ ...prev, [noteId]: data.in_review ?? false }));
    } catch {
      setReviewStatus(prev => ({ ...prev, [noteId]: false }));
    }
  }, [reviewStatus]);

  const handleExpand = (noteId: string) => {
    const next = expanded === noteId ? null : noteId;
    setExpanded(next);
    if (next) fetchReviewStatus(noteId);
  };

  // 加入/取消复习
  const toggleReview = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReviewLoading(noteId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const inReview = reviewStatus[noteId] === true;

      if (inReview) {
        await fetch(`${API}/review/remove/${noteId}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setReviewStatus(prev => ({ ...prev, [noteId]: false }));
      } else {
        await fetch(`${API}/review/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ note_id: noteId }),
        });
        setReviewStatus(prev => ({ ...prev, [noteId]: true }));
      }
    } catch {
      // 失败静默处理
    } finally {
      setReviewLoading(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确认删除这条笔记？删除后无法恢复。")) return;
    setDeleting(id);
    try {
      await fetch(`${API}/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      setNotes(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
      invalidatePrefix('notes:list');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}>
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
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors"
              >
                <div
                  className="px-5 py-4 cursor-pointer flex items-start justify-between gap-4"
                  onClick={() => handleExpand(note.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <SourceBadge type={note.source_type} />
                      <span className="text-xs text-gray-300">{formatDate(note.created_at)}</span>
                      {/* 已加入复习的 badge */}
                      {reviewStatus[note.id] === true && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-400 font-medium">
                          📚 复习中
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 leading-snug">{note.title}</h3>
                      {note.status === 'processing' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 font-medium animate-pulse">
                          整理中...
                        </span>
                      )}
                      {note.status === 'error' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-400 font-medium">
                          生成超时
                        </span>
                      )}
                    </div>
                    {expanded !== note.id && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {note.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <button
                      onClick={(e) => handleDelete(note.id, e)}
                      disabled={deleting === note.id}
                      title="删除笔记"
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all disabled:opacity-50"
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

                    {(note.concepts_detail?.length > 0 || note.concepts?.length > 0) && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">💡 核心概念</p>
                        {note.concepts_detail?.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {note.concepts_detail.map((c, i) => (
                              <div key={i} className="flex gap-2 items-start">
                                <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium shrink-0">{c.term}</span>
                                <span className="text-xs text-gray-500 leading-relaxed pt-0.5">{c.definition}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {note.concepts.map((c, i) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{c}</span>
                            ))}
                          </div>
                        )}
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

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex flex-wrap gap-1.5">
                        {note.tags?.map((tag, i) => (
                          <span key={i} className="text-xs text-gray-300">#{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* 加入复习按钮 */}
                        <button
                          onClick={(e) => toggleReview(note.id, e)}
                          disabled={reviewLoading === note.id || reviewStatus[note.id] === "loading"}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            reviewStatus[note.id] === true
                              ? "border-indigo-200 bg-indigo-50 text-indigo-500 hover:bg-red-50 hover:border-red-200 hover:text-red-400"
                              : "border-gray-200 text-gray-400 hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50"
                          } disabled:opacity-50`}
                        >
                          {reviewLoading === note.id || reviewStatus[note.id] === "loading"
                            ? "..."
                            : reviewStatus[note.id] === true
                            ? "✓ 复习中（点击取消）"
                            : "📚 加入复习"}
                        </button>

                        {note.source_url && !note.source_url.startsWith("text://") && (
                          note.source_url.startsWith("pdf://") ? (
                            <span className="text-xs text-gray-400">
                              📄 {note.source_url.replace("pdf://", "")}
                            </span>
                          ) : (
                            <a
                              href={note.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors"
                            >
                              查看原文 →
                            </a>
                          )
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
