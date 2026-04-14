"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

interface StreamNote {
  id: string;
  title?: string;
  content: string;
  source_url?: string;
  tags?: string[];
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

export default function StreamNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const tokenRef = useRef("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? "");
      tokenRef.current = session.access_token;
      if (!isNew) {
        fetchNote(id, session.access_token);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 新建时自动聚焦内容框
  useEffect(() => {
    if (isNew && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isNew]);

  // textarea 自动扩展高度
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  async function fetchNote(noteId: string, token: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/stream-notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: StreamNote = await res.json();
      setTitle(data.title || "");
      setContent(data.content || "");
      setSourceUrl(data.source_url || "");
      setTagsInput((data.tags || []).join(", "));
    } catch {
      setError("加载失败，请返回重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!content.trim()) {
      setError("正文不能为空");
      return;
    }
    setSaving(true);
    setError("");

    const tags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const body = {
      title: title.trim() || null,
      content: content.trim(),
      source_url: sourceUrl.trim() || null,
      tags: tags.length > 0 ? tags : [],
    };

    try {
      const res = await fetch(
        isNew ? `${API}/stream-notes` : `${API}/stream-notes/${id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      window.location.href = "/stream-notes";
    } catch {
      setError("保存失败，请重试");
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}>
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 overflow-y-auto bg-white">
        {/* 顶部导航栏 */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 h-14"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={() => { window.location.href = "/stream-notes"; }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            流记
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: content.trim() ? "#00E5A0" : "rgba(0,0,0,0.06)",
              color: content.trim() ? "#fff" : "#a0a0a0",
            }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        {/* 主体内容 */}
        <div className="max-w-2xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-32 text-gray-300 text-sm">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              加载中...
            </div>
          ) : (
            <>
              {/* 错误提示 */}
              {error && (
                <div className="mb-5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* 标题输入 */}
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="标题（可不填）"
                className="w-full text-xl font-semibold text-gray-900 placeholder-gray-200 outline-none border-none bg-transparent mb-4"
              />

              {/* 正文 textarea */}
              <textarea
                ref={contentRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="写点什么..."
                className="w-full text-sm text-gray-700 leading-relaxed placeholder-gray-300 outline-none border-none bg-transparent resize-none overflow-hidden mb-6"
                style={{ minHeight: "240px" }}
              />

              {/* 分隔线 */}
              <div className="h-px mb-6" style={{ background: "rgba(0,0,0,0.06)" }} />

              {/* 来源链接 */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">来源链接</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-100 focus-within:border-gray-300 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    placeholder="来源链接（可不填）"
                    className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none border-none bg-transparent"
                  />
                </div>
              </div>

              {/* 标签输入 */}
              <div className="mb-8">
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">标签</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-100 focus-within:border-gray-300 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="标签，逗号分隔（可不填）"
                    className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none border-none bg-transparent"
                  />
                </div>
                {/* 标签预览 */}
                {tagsInput.trim() && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tagsInput.split(",").map(t => t.trim()).filter(Boolean).map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(0,229,160,0.08)", color: "#00b87a" }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
