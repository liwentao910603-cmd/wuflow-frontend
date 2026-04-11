"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

interface Concept {
  term: string;
  summary: string;
  content: string;
  status: "processing" | "done" | "error";
  related_note_ids: string[];
  updated_at: string;
}

interface RelatedNote {
  id: string;
  title: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

// ── Markdown 渲染（与 qa/page.tsx 保持一致）─────────────────
function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>");
}

function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    if (h3) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<p style="font-weight:700;font-size:14px;margin:12px 0 4px 0">${inline(h3[1])}</p>`);
      continue;
    }
    if (h2) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<p style="font-weight:700;font-size:15px;margin:16px 0 4px 0">${inline(h2[1])}</p>`);
      continue;
    }
    if (h1) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<p style="font-weight:700;font-size:16px;margin:16px 0 4px 0">${inline(h1[1])}</p>`);
      continue;
    }
    const li = line.match(/^[\*\-]\s+(.+)/);
    if (li) {
      if (!inList) { result.push('<ul style="margin:4px 0;padding-left:20px;list-style:disc">'); inList = true; }
      result.push(`<li style="margin:2px 0;line-height:1.75">${inline(li[1])}</li>`);
      continue;
    }
    const oli = line.match(/^\d+\.\s+(.+)/);
    if (oli) {
      if (!inList) { result.push('<ul style="margin:4px 0;padding-left:20px;list-style:decimal">'); inList = true; }
      result.push(`<li style="margin:2px 0;line-height:1.75">${inline(oli[1])}</li>`);
      continue;
    }
    if (line.trim() === "") {
      if (inList) { result.push("</ul>"); inList = false; }
      else { result.push('<div style="height:6px"></div>'); }
      continue;
    }
    if (inList) { result.push("</ul>"); inList = false; }
    result.push(`<p style="margin:0 0 6px 0;line-height:1.85">${inline(line)}</p>`);
  }
  if (inList) result.push("</ul>");
  return result.join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function ConceptDetailPage() {
  const params = useParams();
  const term = decodeURIComponent(params.term as string);

  const [concept, setConcept] = useState<Concept | null>(null);
  const [pageStatus, setPageStatus] = useState<"loading" | "processing" | "done" | "timeout" | "error">("loading");
  const [error, setError] = useState("");
  const [relatedNotes, setRelatedNotes] = useState<RelatedNote[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef(0);

  const fetchRelatedNotes = async (token: string, ids: string[]) => {
    if (!ids?.length) return;
    setRelatedLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.slice(0, 5).map((id) =>
          fetch(`${API}/notes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : null))
        )
      );
      const notes: RelatedNote[] = results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => {
          const n = (r as PromiseFulfilledResult<{ id: string; title: string }>).value;
          return { id: n.id, title: n.title };
        });
      setRelatedNotes(notes);
    } catch {
      // 静默失败
    } finally {
      setRelatedLoading(false);
    }
  };

  const fetchConcept = (token: string) => {
    fetch(`${API}/concepts/${encodeURIComponent(term)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("概念不存在或加载失败");
        return res.json();
      })
      .then((data: Concept) => {
        setConcept(data);
        if (data.status === "processing") {
          setPageStatus("processing");
          if (elapsedRef.current < 60000) {
            elapsedRef.current += 3000;
            pollTimerRef.current = setTimeout(() => fetchConcept(token), 3000);
          } else {
            setPageStatus("timeout");
          }
        } else if (data.status === "done") {
          setPageStatus("done");
          fetchRelatedNotes(token, data.related_note_ids || []);
        } else {
          setPageStatus("error");
          setError("概念 Wiki 生成失败，请稍后重试");
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "加载失败，请稍后重试");
        setPageStatus("error");
      });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? null);
      fetchConcept(session.access_token);
    });
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

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
            onClick={() => { window.location.href = "/concepts"; }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回概念库
          </button>

          {/* 初始加载 */}
          {pageStatus === "loading" && (
            <div className="flex items-center justify-center py-32 text-gray-300 text-sm">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              加载中...
            </div>
          )}

          {/* 生成中（轮询） */}
          {pageStatus === "processing" && (
            <div className="text-center py-32">
              <div className="flex items-center justify-center mb-5">
                <svg className="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-2">
                正在为你生成「{term}」的知识 Wiki
              </p>
              <p className="text-gray-400 text-xs">通常需要 10–20 秒，请稍候...</p>
            </div>
          )}

          {/* 生成超时 */}
          {pageStatus === "timeout" && (
            <div className="text-center py-32">
              <p className="text-gray-400 text-sm mb-4">Wiki 生成超时，请刷新页面重试</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-indigo-500 hover:text-indigo-700 underline"
              >
                刷新重试
              </button>
            </div>
          )}

          {/* 错误 */}
          {pageStatus === "error" && (
            <div className="text-center py-32">
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => { window.location.href = "/concepts"; }}
                className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors"
              >
                返回概念库
              </button>
            </div>
          )}

          {/* 内容 */}
          {pageStatus === "done" && concept && (
            <>
              {/* 标题区 */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-500">概念</span>
                  {concept.updated_at && (
                    <span className="text-xs text-gray-300">{formatDate(concept.updated_at)}</span>
                  )}
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 leading-snug">{concept.term}</h1>
              </div>

              {/* 一句话定义卡片 */}
              {concept.summary && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 mb-8">
                  <p className="text-sm text-gray-700 leading-relaxed">{concept.summary}</p>
                </div>
              )}

              {/* Markdown 内容 */}
              {concept.content && (
                <div
                  className="text-sm text-gray-600 leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(concept.content) }}
                />
              )}

              {/* 来源笔记 */}
              {(relatedLoading || relatedNotes.length > 0) && (
                <section className="mt-10 pt-8 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 mb-4 uppercase tracking-wider">📌 来源笔记</p>
                  {relatedLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {relatedNotes.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { window.location.href = `/notes/${n.id}`; }}
                          className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="hover:underline">{n.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
