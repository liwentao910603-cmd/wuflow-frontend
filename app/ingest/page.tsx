"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tab = "url" | "pdf" | "text";
type Filter = "all" | "url" | "pdf" | "text";

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
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

function SourceBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    url:  { label: "网页", cls: "bg-blue-50 text-blue-500" },
    pdf:  { label: "PDF",  cls: "bg-orange-50 text-orange-500" },
    text: { label: "文本", cls: "bg-green-50 text-green-500" },
  };
  const c = map[type] ?? { label: type, cls: "bg-gray-100 text-gray-500" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.cls}`}>{c.label}</span>;
}

export default function IngestPage() {
  // ── Auth ─────────────────────────────────────────────
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // ── Form ─────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("url");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [url, setUrl] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textSource, setTextSource] = useState("");

  // ── Toast ─────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);

  // ── Notes list ────────────────────────────────────────
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesTotal, setNotesTotal] = useState(0);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesFilter, setNotesFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Init ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // ── Fetch notes ───────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "20",
        ...(notesFilter !== "all" ? { source_type: notesFilter } : {}),
      });
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API}/notes?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setNotes(data.notes || []);
      setNotesTotal(data.total || 0);
    } catch {
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, [notesFilter]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // ── Realtime subscription ─────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("notes-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notes"
      }, () => {
        fetchNotes();
        setToast("✅ 新笔记已生成");
        setTimeout(() => setToast(null), 6000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotes]);

  // ── Delete note ───────────────────────────────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确认删除这条笔记？删除后无法恢复。")) return;
    setDeleting(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch(`${API}/notes/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } finally {
      setDeleting(null);
      fetchNotes();
    }
  };

  // ── PDF handling ──────────────────────────────────────
  const handlePdfFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setFormError("请选择 PDF 文件"); return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setFormError("PDF 不能超过 20MB"); return;
    }
    setPdfFile(f);
    if (!pdfTitle) setPdfTitle(f.name.replace(/\.pdf$/i, ""));
    setFormError("");
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setFormError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      let res: Response;

      if (tab === "url") {
        if (!url.trim()) throw new Error("请输入 URL");
        res = await fetch(`${API}/ingest`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ url: url.trim() }),
        });
      } else if (tab === "pdf") {
        if (!pdfFile) throw new Error("请选择 PDF 文件");
        const form = new FormData();
        form.append("file", pdfFile);
        if (pdfTitle.trim()) form.append("title", pdfTitle.trim());
        res = await fetch(`${API}/ingest/pdf`, {
          method: "POST",
          headers: { ...authHeader },
          body: form,
        });
      } else {
        if (!textTitle.trim()) throw new Error("请填写标题");
        if (textContent.trim().length < 50) throw new Error("内容至少 50 字");
        res = await fetch(`${API}/ingest/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            title: textTitle.trim(),
            text: textContent.trim(),
            source_url: textSource.trim() || "",
          }),
        });
      }

      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* 非 JSON 响应体，忽略 */ }

      if (!res.ok) {
        console.log("后端错误原文:", data);
        const detail = data.detail;
        let msg: string;
        if (typeof detail === "string" && detail) {
          // 后端有中文错误信息，直接显示
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = "请求参数有误，请检查输入";
        } else if (res.status === 401 || res.status === 403) {
          // 无 detail 时才用状态码兜底
          msg = "登录已过期，请重新登录";
        } else {
          msg = "整理失败，请稍后重试";
        }
        throw new Error(msg);
      }

      setToast("✅ 内容已保存，笔记后台生成中...");
      setTimeout(() => setToast(null), 6000);
      await fetchNotes();
      const noteId = (data.note as { id?: string } | null)?.id;
      if (noteId) setExpanded(noteId);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "未知错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif" }}>

      {/* 导航 */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
          悟流 WuFlow
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/ingest" className="text-gray-900 font-medium">整理资料</Link>
          <Link href="/notes" className="hover:text-gray-900 transition-colors">知识库</Link>
          <Link href="/qa" className="hover:text-gray-900 transition-colors">AI问答</Link>
          {userEmail && (
            <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
              <span className="text-gray-400 text-xs hidden sm:inline">{userEmail}</span>
              <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
                退出
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 主体：左侧表单 + 右侧知识库 */}
      <div className="flex flex-col lg:flex-row flex-1">

        {/* ── 左侧：整理表单 ─────────────────────────────── */}
        <div className="w-full lg:w-[440px] shrink-0 px-6 py-8 border-b lg:border-b-0 lg:border-r border-gray-100">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">整理资料</h1>
            <p className="text-gray-400 text-sm">支持网页URL、PDF文件、或直接粘贴文本</p>
          </div>

          {/* Tab 切换 */}
          <div className="flex gap-1 mb-5 bg-gray-50 p-1 rounded-lg w-fit">
            {(["url", "pdf", "text"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setFormError(""); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "url" ? "🔗 网页" : t === "pdf" ? "📄 PDF" : "✏️ 文本"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* URL Tab */}
            {tab === "url" && (
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">网页地址</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <p className="text-xs text-gray-400 mt-1.5">少数派、知乎、微信公众号等中文网站效果最佳</p>
              </div>
            )}

            {/* PDF Tab */}
            {tab === "pdf" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    PDF文件 <span className="text-gray-400">（最大20MB）</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault(); setIsDragging(false);
                      const f = e.dataTransfer.files?.[0]; if (f) handlePdfFile(f);
                    }}
                    className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-all select-none ${
                      isDragging
                        ? "border-gray-400 bg-gray-50"
                        : pdfFile
                        ? "border-gray-300 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pdfFile ? (
                      <div>
                        <p className="text-2xl mb-2">📄</p>
                        <p className="text-sm font-medium text-gray-700">{pdfFile.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · 点击重新选择
                        </p>
                      </div>
                    ) : isDragging ? (
                      <div>
                        <p className="text-2xl mb-2">⬇️</p>
                        <p className="text-sm text-gray-500 font-medium">放开以上传</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl mb-2">📂</p>
                        <p className="text-sm text-gray-400">点击选择或拖拽PDF到此处</p>
                        <p className="text-xs text-gray-300 mt-1">仅支持 .pdf，最大 20MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfFile(f); }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    标题 <span className="text-gray-400">（可选，默认用文件名）</span>
                  </label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    placeholder="这份PDF的标题"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* 文本 Tab */}
            {tab === "text" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">标题 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="给这段内容起个名字"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">内容 <span className="text-red-400">*</span></label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="粘贴你想整理的文章、笔记、文字..."
                    rows={7}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{textContent.length} 字 · 至少50字</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    来源链接 <span className="text-gray-400">（可选）</span>
                  </label>
                  <input
                    type="url"
                    value={textSource}
                    onChange={(e) => setTextSource(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {formError && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
                ⚠️ {formError}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  AI正在整理，通常需要15–30秒...
                </span>
              ) : "开始整理 →"}
            </button>
          </div>
        </div>

        {/* ── 右侧：知识库列表 ──────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-8 bg-gray-50/40">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">知识库</h2>
              {notesTotal > 0 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  {notesTotal}
                </span>
              )}
            </div>
            <Link href="/qa" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
              💬 去问答 →
            </Link>
          </div>

          {/* 过滤器 */}
          <div className="flex gap-1 mb-5 bg-white border border-gray-100 p-1 rounded-lg w-fit">
            {(["all", "url", "pdf", "text"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setNotesFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  notesFilter === f
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {f === "all" ? "全部" : f === "url" ? "网页" : f === "pdf" ? "PDF" : "文本"}
              </button>
            ))}
          </div>

          {/* 笔记列表 */}
          {notesLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-300 text-sm gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              加载中...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-300 text-sm">
                {notesFilter !== "all" ? "这个分类还没有笔记" : "知识库还是空的，左侧整理第一条资料吧"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors"
                >
                  {/* 卡片头部 */}
                  <div
                    className="px-4 py-3.5 cursor-pointer flex items-start justify-between gap-3"
                    onClick={() => setExpanded(expanded === note.id ? null : note.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <SourceBadge type={note.source_type} />
                        <span className="text-xs text-gray-300">{formatDate(note.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{note.title}</p>
                      {expanded !== note.id && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{note.summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <button
                        onClick={(e) => handleDelete(note.id, e)}
                        disabled={deleting === note.id}
                        className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                      >
                        {deleting === note.id ? "..." : "删除"}
                      </button>
                      <span className="text-gray-300 text-xs select-none">
                        {expanded === note.id ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {expanded === note.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">📝 摘要</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{note.summary}</p>
                      </div>

                      {note.concepts?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">💡 核心概念</p>
                          <div className="flex flex-wrap gap-1.5">
                            {note.concepts.map((c, i) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {note.key_points?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">✅ 核心要点</p>
                          <ul className="space-y-1">
                            {note.key_points.map((p, i) => (
                              <li key={i} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-gray-300 shrink-0">·</span>{p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {note.action_items?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">🚀 行动建议</p>
                          <ul className="space-y-1">
                            {note.action_items.map((a, i) => (
                              <li key={i} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-gray-300 shrink-0">{i + 1}.</span>{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                        <div className="flex flex-wrap gap-1.5">
                          {note.tags?.map((tag, i) => (
                            <span key={i} className="text-xs text-gray-300">#{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
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
                            💬 问答
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {notesTotal > 20 && (
                <p className="text-xs text-center text-gray-300 pt-2">
                  显示最新 20 条，共 {notesTotal} 条
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm px-5 py-3 rounded-lg shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
