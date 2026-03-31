"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tab = "url" | "pdf" | "text";
type Status = "idle" | "loading" | "success" | "error";

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

export default function IngestPage() {
  const [tab, setTab] = useState<Tab>("url");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [note, setNote] = useState<Note | null>(null);

  // Auth
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // URL
  const [url, setUrl] = useState("");

  // PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textSource, setTextSource] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      setAccessToken(session?.access_token ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const reset = () => {
    setStatus("idle");
    setError("");
    setNote(null);
  };

  // ── PDF 文件处理 ──────────────────────────────────────
  const handlePdfFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("请选择 PDF 文件");
      setStatus("error");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("PDF 不能超过 20MB");
      setStatus("error");
      return;
    }
    setPdfFile(f);
    if (!pdfTitle) setPdfTitle(f.name.replace(/\.pdf$/i, ""));
    setStatus("idle");
    setError("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handlePdfFile(f);
  };

  // ── 提交 ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setStatus("loading");
    setError("");
    setNote(null);

    const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

    try {
      let res: Response;

      if (tab === "url") {
        if (!url.trim()) throw new Error("请输入URL");
        res = await fetch(`${API}/ingest`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ url: url.trim() }),
        });
      } else if (tab === "pdf") {
        if (!pdfFile) throw new Error("请选择PDF文件");
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
        if (textContent.trim().length < 50) throw new Error("内容至少50字");
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "整理失败");
      setNote(data.note);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "未知错误");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
          悟流 WuFlow
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/ingest" className="text-gray-900 font-medium">整理资料</Link>
          <Link href="/notes" className="hover:text-gray-900 transition-colors">知识库</Link>
          <Link href="/qa" className="hover:text-gray-900 transition-colors">AI问答</Link>
          {userEmail && (
            <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
              <span className="text-gray-400 text-xs">{userEmail}</span>
              <button
                onClick={handleSignOut}
                className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
              >
                退出
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">整理资料</h1>
          <p className="text-gray-400 text-sm">支持网页URL、PDF文件、或直接粘贴文本</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-lg w-fit">
          {(["url", "pdf", "text"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); reset(); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "url" ? "🔗 网页URL" : t === "pdf" ? "📄 PDF文件" : "✏️ 粘贴文本"}
            </button>
          ))}
        </div>

        {/* 表单 */}
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
                少数派、知乎、微信公众号等中文网站效果最佳
              </p>
            </div>
          )}

          {/* PDF Tab */}
          {tab === "pdf" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  PDF文件 <span className="text-gray-400">（最大20MB）</span>
                </label>

                {/* 拖拽区域 */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg px-6 py-10 text-center cursor-pointer transition-all select-none ${
                    isDragging
                      ? "border-gray-400 bg-gray-50 scale-[1.01]"
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
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · 点击或拖拽重新选择
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
                      <p className="text-sm text-gray-400">点击选择或拖拽PDF文件到此处</p>
                      <p className="text-xs text-gray-300 mt-1">仅支持 .pdf 格式，最大 20MB</p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePdfFile(f);
                  }}
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
                <label className="block text-sm text-gray-600 mb-1.5">
                  标题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="给这段内容起个名字"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  内容 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="粘贴你想整理的文章、笔记、文字..."
                  rows={8}
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
                  placeholder="https://... （原文链接，方便追溯）"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {status === "error" && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={status === "loading"}
            className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                </svg>
                AI正在整理，通常需要15–30秒...
              </span>
            ) : (
              "开始整理 →"
            )}
          </button>
        </div>

        {/* 结果展示 */}
        {status === "success" && note && (
          <div className="mt-8 border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">整理完成 ✓</span>
              <Link href="/notes" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                查看知识库 →
              </Link>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{note.title}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    note.source_type === "url"
                      ? "bg-blue-50 text-blue-600"
                      : note.source_type === "pdf"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-green-50 text-green-600"
                  }`}>
                    {note.source_type === "url" ? "网页" : note.source_type === "pdf" ? "PDF" : "文本"}
                  </span>
                  {note.source_url &&
                    !note.source_url.startsWith("pdf://") &&
                    !note.source_url.startsWith("text://") && (
                      <a
                        href={note.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-gray-600 truncate max-w-xs transition-colors"
                      >
                        {note.source_url}
                      </a>
                    )}
                </div>
              </div>

              <NoteSection title="摘要" icon="📝">
                <p className="text-sm text-gray-600 leading-relaxed">{note.summary}</p>
              </NoteSection>

              {note.concepts?.length > 0 && (
                <NoteSection title="核心概念" icon="💡">
                  <div className="flex flex-wrap gap-2">
                    {note.concepts.map((c, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </NoteSection>
              )}

              {note.key_points?.length > 0 && (
                <NoteSection title="核心要点" icon="✅">
                  <ul className="space-y-1.5">
                    {note.key_points.map((p, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-gray-300 shrink-0">·</span>{p}
                      </li>
                    ))}
                  </ul>
                </NoteSection>
              )}

              {note.action_items?.length > 0 && (
                <NoteSection title="行动建议" icon="🚀">
                  <ul className="space-y-1.5">
                    {note.action_items.map((a, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-gray-300 shrink-0">{i + 1}.</span>{a}
                      </li>
                    ))}
                  </ul>
                </NoteSection>
              )}

              {note.tags?.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="text-xs text-gray-400">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
