"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  status?: string;
  concepts_detail?: { term: string; definition: string }[];
}

interface RelatedNote {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  source_type: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSource(url: string) {
  if (url?.startsWith("pdf://")) return url.replace("pdf://", "");
  return url;
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

function RelatedSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
          <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-3 bg-gray-100 rounded w-4/5 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-3/5" />
        </div>
      ))}
    </div>
  );
}

export default function NoteDetailPage() {
  const params = useParams();
  const noteId = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [related, setRelated] = useState<RelatedNote[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 复习计划状态
  const [inReview, setInReview] = useState<boolean | null>(null); // null = 查询中
  const [reviewPlanId, setReviewPlanId] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? null);
      setUserId(session.user.id);
      const token = session.access_token;

      // 拉取笔记详情
      try {
        const res = await fetch(`${API}/notes/${noteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("笔记不存在或已被删除");
        const data = await res.json();
        setNote(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "加载失败，请稍后重试");
      } finally {
        setLoading(false);
      }

      // 查询复习计划状态（不阻塞主内容）
      supabase
        .from("review_plans")
        .select("id")
        .eq("source_note_id", noteId)
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .maybeSingle()
        .then(({ data }) => {
          if (data) { setInReview(true); setReviewPlanId(data.id); }
          else setInReview(false);
        });

      // 拉取相关笔记（不阻塞主内容）
      try {
        const res = await fetch(`${API}/notes/${noteId}/related`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.related || []);
          setRelated(list.slice(0, 5));
        }
      } catch {
        // 静默失败，不展示错误
      } finally {
        setRelatedLoading(false);
      }
    });
  }, [noteId]);

  const handleAddReview = async () => {
    if (!userId || reviewLoading) return;
    setReviewLoading(true);
    setReviewError(null);
    const { data, error: err } = await supabase
      .from("review_plans")
      .insert({ source_note_id: noteId, user_id: userId, status: "active" })
      .select("id")
      .single();
    if (err || !data) {
      setReviewError("加入复习计划失败，请稍后重试");
    } else {
      setInReview(true);
      setReviewPlanId(data.id);
    }
    setReviewLoading(false);
  };

  const handleCancelReview = async () => {
    if (!reviewPlanId || reviewLoading) return;
    setReviewLoading(true);
    setReviewError(null);
    const { error: err } = await supabase
      .from("review_plans")
      .update({ status: "inactive" })
      .eq("id", reviewPlanId);
    if (err) {
      setReviewError("取消复习计划失败，请稍后重试");
    } else {
      setInReview(false);
      setReviewPlanId(null);
    }
    setReviewLoading(false);
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}
    >
      <Sidebar userEmail={userEmail ?? ""} />
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-6 py-10">

          {/* 返回按钮 */}
          <button
            onClick={() => { window.location.href = "/notes"; }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回知识库
          </button>

          {/* 加载中 */}
          {loading && (
            <div className="flex items-center justify-center py-32 text-gray-300 text-sm">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              加载中...
            </div>
          )}

          {/* 加载失败 */}
          {!loading && error && (
            <div className="text-center py-32">
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => { window.location.href = "/notes"; }}
                className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors"
              >
                返回知识库
              </button>
            </div>
          )}

          {/* 笔记正文 */}
          {!loading && note && (
            <>
              {/* 标题区 */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <SourceBadge type={note.source_type} />
                  <span className="text-xs text-gray-300">{formatDate(note.created_at)}</span>
                  {note.status === "processing" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 font-medium animate-pulse">
                      整理中...
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 leading-snug mb-4">
                  {note.title}
                </h1>
                {note.source_url && !note.source_url.startsWith("text://") && (
                  <div className="text-xs text-gray-400">
                    {note.source_url.startsWith("pdf://") ? (
                      <span>📄 {formatSource(note.source_url)}</span>
                    ) : (
                      <a
                        href={note.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-700 underline transition-colors break-all"
                      >
                        🔗 {formatSource(note.source_url)}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* 摘要 */}
              <section className="mb-8">
                <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">📝 摘要</p>
                <p className="text-sm text-gray-600 leading-relaxed">{note.summary}</p>
              </section>

              {/* 核心概念 */}
              {(note.concepts_detail?.length > 0 || note.concepts?.length > 0) && (
                <section className="mb-8">
                  <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">💡 核心概念</p>
                  {note.concepts_detail?.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {note.concepts_detail.map((c, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <button
                            onClick={() => { window.location.href = `/concepts/${encodeURIComponent(c.term)}`; }}
                            className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium shrink-0 hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            {c.term}
                          </button>
                          <span className="text-sm text-gray-500 leading-relaxed pt-0.5">{c.definition}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {note.concepts.map((c, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* 核心要点 */}
              {note.key_points?.length > 0 && (
                <section className="mb-8">
                  <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">✅ 核心要点</p>
                  <ul className="space-y-2">
                    {note.key_points.map((p, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-gray-300 shrink-0 mt-0.5">·</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 行动建议 */}
              {note.action_items?.length > 0 && (
                <section className="mb-8">
                  <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">🚀 行动建议</p>
                  <ul className="space-y-2">
                    {note.action_items.map((a, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-gray-300 shrink-0">{i + 1}.</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 标签 */}
              {note.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="text-xs text-gray-300">#{tag}</span>
                  ))}
                </div>
              )}

              {/* 复习操作错误提示 */}
              {reviewError && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  <span>{reviewError}</span>
                  <button onClick={() => setReviewError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
              )}

              {/* 操作栏 */}
              <div className="flex items-center gap-3 pb-10 border-b border-gray-100">
                <Link
                  href="/qa"
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  💬 去问答
                </Link>

                {/* 加入复习 / 取消复习 */}
                {inReview === null ? (
                  <span className="text-sm px-4 py-2 rounded-lg border border-gray-100 text-gray-300">
                    检查中...
                  </span>
                ) : inReview ? (
                  <button
                    onClick={handleCancelReview}
                    disabled={reviewLoading}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {reviewLoading ? "处理中..." : "✓ 已加入复习 · 取消"}
                  </button>
                ) : (
                  <button
                    onClick={handleAddReview}
                    disabled={reviewLoading}
                    className="text-sm px-4 py-2 rounded-lg border border-green-200 text-green-600 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-colors disabled:opacity-50"
                  >
                    {reviewLoading ? "添加中..." : "＋ 加入复习计划"}
                  </button>
                )}
              </div>

              {/* 相关笔记 */}
              <section className="mt-10">
                <p className="text-xs font-medium text-gray-400 mb-4 uppercase tracking-wider">🔗 相关笔记</p>

                {note.status === "processing" ? (
                  <p className="text-sm text-gray-400">笔记处理中，相关推荐稍后可用</p>
                ) : relatedLoading ? (
                  <RelatedSkeleton />
                ) : related.length === 0 ? (
                  <p className="text-sm text-gray-300">暂无相关笔记</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {related.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { window.location.href = `/notes/${r.id}`; }}
                        className="text-left border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="mb-2">
                          <SourceBadge type={r.source_type} />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1.5 leading-snug line-clamp-2">
                          {r.title}
                        </p>
                        {r.summary && (
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {r.summary.length > 80 ? r.summary.slice(0, 80) + "…" : r.summary}
                          </p>
                        )}
                        {r.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs text-gray-300">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
