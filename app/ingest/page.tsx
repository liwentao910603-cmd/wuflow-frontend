"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

type Tab = "url" | "pdf" | "text";
type Filter = "all" | "url" | "pdf" | "text";
type Template = "general" | "tech" | "paper" | "video" | "meeting";

const TEMPLATES: { id: Template; label: string; icon: string; desc: string }[] = [
  { id: "general", icon: "📄", label: "通用整理",   desc: "适合大多数文章" },
  { id: "tech",    icon: "⚙️", label: "技术文章",   desc: "AI/编程/产品技术" },
  { id: "paper",   icon: "📚", label: "论文速读",   desc: "学术论文专用" },
  { id: "video",   icon: "🎥", label: "视频笔记",   desc: "请粘贴视频字幕/文字稿，视频URL整理功能开发中" },
  { id: "meeting", icon: "📋", label: "会议/播客",  desc: "会议记录/文字稿" },
];

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
const PAGE_SIZE = 20;

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
  const [template, setTemplate] = useState<Template>("general");
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<0|1|2|3>(0);
  // 0=未开始, 1=正在抓取, 2=提取知识点, 3=生成笔记
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
  const [notesPage, setNotesPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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
  const fetchNotesRef = useRef<() => void>(() => {});
  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const params = new URLSearchParams({
        page: notesPage.toString(),
        page_size: PAGE_SIZE.toString(),
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
  }, [notesFilter, notesPage]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => { fetchNotesRef.current = fetchNotes; }, [fetchNotes]);

  // ── Realtime subscription ─────────────────────────────
  useEffect(() => {
    let channel = supabase
      .channel("notes-realtime-" + Date.now())
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notes"
      }, (payload) => {
        console.log("Realtime INSERT received:", payload);
        setTimeout(() => fetchNotesRef.current(), 500);
        setToast("✅ 新笔记已生成，知识库已更新");
        setTimeout(() => setToast(null), 6000);
      })
      .subscribe((status) => {
        console.log("[Realtime] status:", status);
      });
    return () => { supabase.removeChannel(channel); };
  }, []); // 注意：依赖数组改为空数组，fetchNotes 通过闭包调用

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
        setSubmitStep(1); // 正在抓取内容
        res = await fetch(`${API}/ingest`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ url: url.trim(), template }),
        });
      } else if (tab === "pdf") {
        if (!pdfFile) throw new Error("请选择 PDF 文件");
        setSubmitStep(2); // 提取知识点
        const form = new FormData();
        form.append("file", pdfFile);
        if (pdfTitle.trim()) form.append("title", pdfTitle.trim());
        form.append("template", template);
        res = await fetch(`${API}/ingest/pdf`, {
          method: "POST",
          headers: { ...authHeader },
          body: form,
        });
      } else {
        if (!textTitle.trim()) throw new Error("请填写标题");
        if (textContent.trim().length < 50) throw new Error("内容至少 50 字");
        setSubmitStep(2); // 提取知识点
        res = await fetch(`${API}/ingest/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            title: textTitle.trim(),
            text: textContent.trim(),
            source_url: textSource.trim() || "",
            template,
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

      setSubmitStep(3); // 生成笔记
      await new Promise(r => setTimeout(r, 800)); // 短暂展示第3步
      setToast("✅ 内容已保存，笔记后台生成中...");
      setTimeout(() => setToast(null), 6000);
      await fetchNotes();
      const noteId = (data.note as { id?: string } | null)?.id;
      if (noteId) setExpanded(noteId);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "未知错误，请稍后重试");
    } finally {
      setSubmitting(false);
      setSubmitStep(0);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif" }}>
      <Sidebar userEmail={userEmail ?? ""} />
      <div className="flex-1 flex flex-col overflow-hidden">

      {/* 主体：左侧表单 + 右侧知识库 */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

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

          {/* 模板选择 */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-2">整理模板</label>
              <div className="grid grid-cols-5 gap-1">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    title={t.desc}
                    className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg text-center transition-all ${
                      template === t.id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-xs font-medium leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-300 mt-1.5">
                {TEMPLATES.find(t => t.id === template)?.desc}
              </p>
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
                <p className="text-xs text-gray-400 mt-1.5">
                    支持少数派、36氪、掘金、简书、微信公众号、arXiv 等；
                    知乎/B站等需登录的网站建议复制正文后用「文本」功能整理
                  </p>
                {template === "video" && (
                  <p className="text-xs text-amber-500 mt-1">
                    💡 视频笔记建议切换到「文本」Tab，粘贴视频字幕或文字稿效果更好；视频URL直接整理功能开发中
                  </p>
                )}
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
                    placeholder={template === "video" ? "粘贴视频字幕文本或文字稿内容..." : "粘贴你想整理的文章、笔记、文字..."}
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
                  <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  {submitStep === 1 ? '正在抓取内容...' : submitStep === 2 ? '提取知识点中...' : submitStep === 3 ? '生成笔记中...' : '处理中...'}
                </span>
              ) : "开始整理 →"}
            </button>

            {/* 步骤进度条，仅 submitting 时显示 */}
            {submitting && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  {(tab === 'url' ? ['抓取内容', '提取知识点', '生成笔记'] : ['提取知识点', '生成笔记']).map((step, i) => {
                    const stepNum = tab === 'url' ? i + 1 : i + 2;
                    const isDone = submitStep > stepNum;
                    const isCurrent = submitStep === stepNum;
                    return (
                      <div key={step} className="flex items-center gap-1.5">
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone ? '#111' : isCurrent ? '#374151' : '#e5e7eb',
                          color: isDone || isCurrent ? '#fff' : '#9ca3af',
                          transition: 'all 0.3s'
                        }}>
                          {isDone ? '✓' : stepNum}
                        </div>
                        <span style={{ fontSize: 11, color: isCurrent ? '#111' : isDone ? '#6b7280' : '#d1d5db', transition: 'color 0.3s' }}>{step}</span>
                        {i < (tab === 'url' ? 2 : 1) && <div style={{ width: 20, height: 1, background: isDone ? '#111' : '#e5e7eb', margin: '0 4px', transition: 'background 0.3s' }} />}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 text-center">通常需要 15–30 秒，请勿关闭页面</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 右侧：知识库列表 ──────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-8 bg-gray-50/40 overflow-y-auto">
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
                onClick={() => { setNotesFilter(f); setNotesPage(1); }}
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
            <div className="space-y-2" onClick={() => setOpenMenu(null)}>
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

              {notesTotal > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                  <span className="text-xs text-gray-400">
                    共 {notesTotal} 条，第 {notesPage} / {Math.ceil(notesTotal / PAGE_SIZE)} 页
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setNotesPage(p => Math.max(1, p - 1))}
                      disabled={notesPage === 1}
                      className="px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setNotesPage(p => Math.min(Math.ceil(notesTotal / PAGE_SIZE), p + 1))}
                      disabled={notesPage >= Math.ceil(notesTotal / PAGE_SIZE)}
                      className="px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                    </button>
                  </div>
                </div>
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
    </div>
  );
}
