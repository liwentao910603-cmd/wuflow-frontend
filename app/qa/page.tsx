"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

// 轻量 Markdown → HTML 转换（无需引入外部库）
function renderMarkdown(text: string): string {
  return text
    // 先处理来源标注 **来源**：... → 单独一行的粗体
    // 粗体 **text**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // 斜体 *text*（确保不是列表符号，即前面不是行首空格+*）
    .replace(/(?<![*\n])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>")
    // 无序列表行：`* ` 或 `- ` 开头
    .replace(/^[\*\-]\s+(.+)$/gm, "<li>$1</li>")
    // 连续 li 包裹成 ul
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // 数字列表 `1. `
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // 段落：空行分隔
    .replace(/\n{2,}/g, "</p><p>")
    // 单个换行
    .replace(/\n/g, "<br/>")
    // 首尾包裹 p
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    // 清理 ul 内多余的 p 标签
    .replace(/<p>(<ul>)/g, "$1")
    .replace(/(<\/ul>)<\/p>/g, "$1")
    .replace(/<p><\/p>/g, "")
    .replace(/<p><br\/>/g, "<p>");
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:9000/api/v1";
const supabase = createClient();

interface Source { title: string; source_url: string; source_type: string; similarity: number }
interface Message { role: "user" | "assistant"; content: string; sources?: Source[]; has_context?: boolean }

const HISTORY_KEY = (uid: string) => `wuflow_qa_history_${uid}`;
const MAX_HISTORY = 40; // 最多保留40条消息

export default function QAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Auth + 加载历史 ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? null);
      setAccessToken(session.access_token ?? null);
      const uid = session.user.id;
      setUserId(uid);
      // 从 localStorage 恢复历史
      try {
        const raw = localStorage.getItem(HISTORY_KEY(uid));
        if (raw) setMessages(JSON.parse(raw));
      } catch { /* ignore */ }
    });
  }, []);

  // ── 持久化历史到 localStorage ────────────────────────────────
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    try {
      // 超过上限时截断最早的消息，保留最新的
      const toSave = messages.length > MAX_HISTORY
        ? messages.slice(messages.length - MAX_HISTORY)
        : messages;
      localStorage.setItem(HISTORY_KEY(userId), JSON.stringify(toSave));
    } catch { /* ignore quota errors */ }
  }, [messages, userId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const clearHistory = () => {
    setMessages([]);
    if (userId) localStorage.removeItem(HISTORY_KEY(userId));
  };

  // ── 滚动到底部 ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Bug1 修复：用 useEffect 做 textarea resize，不在 onChange 里操作 DOM ──
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "44px";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    const userMsg: Message = { role: "user", content: q };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/qa/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ question: q, conversation_history: history }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as any).detail ?? "请求失败");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accContent = "";
      let sources: Source[] = [];
      let streamStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") break;
          try {
            const event = JSON.parse(raw);
            if (event.type === "sources") {
              sources = event.data || [];
            } else if (event.type === "text") {
              accContent += event.data;
              setMessages(prev => {
                const arr = [...prev];
                const last = arr[arr.length - 1];
                if (last?.role === "assistant") {
                  arr[arr.length - 1] = { ...last, content: accContent };
                } else {
                  if (!streamStarted) {
                    streamStarted = true;
                    setLoading(false);
                  }
                  arr.push({ role: "assistant", content: accContent, sources, has_context: true });
                }
                return arr;
              });
            } else if (event.type === "done") {
              const has_context = event.has_context ?? true;
              setMessages(prev => {
                const arr = [...prev];
                arr[arr.length - 1] = { ...arr[arr.length - 1], sources, has_context };
                return arr;
              });
            } else if (event.type === "error") {
              throw new Error(event.data);
            }
          } catch {
            // 跳过解析失败的行
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => {
        const arr = [...prev];
        if (arr[arr.length - 1]?.role === "assistant" && !arr[arr.length - 1].content) {
          arr[arr.length - 1] = { role: "assistant", content: `出错了：${e.message}` };
        } else {
          arr.push({ role: "assistant", content: `出错了：${e.message}` });
        }
        return arr;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...s.page, flexDirection: "row" }}>
      <Sidebar userEmail={userEmail ?? ""} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @keyframes wf-spin{to{transform:rotate(360deg)}}
        @keyframes wf-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        textarea:focus{outline:none;border-color:rgba(0,0,0,0.25)!important;}
        .suggest-btn:hover{background:#F0F0EC!important}
        .clear-btn:hover{background:#f5f5f2!important}
        /* Markdown 渲染样式 */
        .wf-md p{margin:0 0 8px 0;line-height:1.85}
        .wf-md p:last-child{margin-bottom:0}
        .wf-md strong{font-weight:600;color:inherit}
        .wf-md em{font-style:italic}
        .wf-md ul{margin:6px 0 8px 0;padding-left:18px;list-style:disc}
        .wf-md li{margin-bottom:4px;line-height:1.75}
        .wf-md br{display:block;content:"";margin-top:2px}
      `}</style>

      {/* Messages */}
      <main style={s.main}>
        <div style={s.feed}>

          {messages.length === 0 && (
            <div style={s.empty}>
              <div style={s.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <h2 style={s.emptyTitle}>问问你的知识库</h2>
              <p style={s.emptySub}>基于你整理的笔记回答，每条回答都标注来源</p>
              <div style={s.suggests}>
                {["帮我总结知识库的主要内容", "有哪些值得深入学习的概念？", "给我列出所有笔记的主题"].map((t, i) => (
                  <button key={i} className="suggest-btn" style={s.suggest} onClick={() => setInput(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 有历史时显示清空按钮 */}
          {messages.length > 0 && (
            <div style={s.historyBar}>
              <span style={s.historyCount}>共 {messages.length} 条对话</span>
              <button className="clear-btn" style={s.clearBtn} onClick={clearHistory}>
                清空历史
              </button>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ ...s.row, ...(m.role === "user" ? s.rowUser : {}) }}>
              {m.role === "assistant" && (
                <div style={s.avatar}>悟</div>
              )}
              <div style={{ ...s.bubble, ...(m.role === "user" ? s.bubbleUser : s.bubbleBot) }}>
                {m.role === "assistant" ? (
                  <div
                    className="wf-md"
                    style={s.mdText}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                  />
                ) : (
                  <p style={s.text}>{m.content}</p>
                )}

                {m.sources && m.sources.length > 0 && (
                  <div style={s.sources}>
                    <div style={s.srcHead}>引用来源</div>
                    {m.sources.map((src, j) => (
                      <div key={j} style={s.srcRow}>
                        <span style={s.srcDot} />
                        <span style={s.srcTitle}>{src.title}</span>
                        {src.source_url && (
                          <a href={src.source_url} target="_blank" rel="noreferrer" style={s.srcLink}>↗</a>
                        )}
                        <span style={s.srcSim}>{Math.round(src.similarity * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {m.has_context === false && (
                  <div style={s.noCtx}>
                    知识库暂无相关内容，<a href="/ingest" style={s.noCtxLink}>去整理资料 →</a>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={s.row}>
              <div style={s.avatar}>悟</div>
              <div style={{ ...s.bubble, ...s.bubbleBot, ...s.bubbleLoad }}>
                <span style={s.spinner} />
                <span style={s.loadTxt}>正在检索知识库并生成回答…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input bar */}
      <div style={s.bar}>
        <div style={s.barInner}>
          <textarea
            ref={textareaRef}
            style={s.textarea}
            placeholder="问问你的知识库…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
          />
          <button
            style={{ ...s.send, ...(!input.trim() || loading ? s.sendDis : {}) }}
            onClick={send}
            disabled={!input.trim() || loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
        <p style={s.barHint}>Enter 发送 · Shift+Enter 换行 · 回答仅基于你的知识库</p>
      </div>
      </div>
    </div>
  );
}

const BL = "#111";
const s: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100vh", background: "#ffffff", fontFamily: "'Inter','Noto Sans SC','PingFang SC',sans-serif", color: "rgba(0,0,0,0.87)", display: "flex", flexDirection: "column" },
  main:        { flex: 1, overflow: "auto" },
  feed:        { maxWidth: 760, margin: "0 auto", padding: "32px 24px 24px", display: "flex", flexDirection: "column", gap: 16 },
  empty:       { textAlign: "center", padding: "48px 0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  emptyIcon:   { width: 56, height: 56, borderRadius: "50%", background: "#f7f6f3", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyTitle:  { fontSize: 20, fontWeight: 700, margin: 0 },
  emptySub:    { fontSize: 14, color: "#6b6b6b", margin: 0 },
  suggests:    { display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 440, marginTop: 4 },
  suggest:     { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontSize: 14, fontFamily: "inherit", textAlign: "left", color: "rgba(0,0,0,0.87)", transition: "background 0.15s" },
  historyBar:  { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0 4px" },
  historyCount:{ fontSize: 12, color: "#a0a0a0" },
  clearBtn:    { fontSize: 12, color: "#6b6b6b", background: "none", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" },
  row:         { display: "flex", gap: 12, alignItems: "flex-start", animation: "wf-in 0.25s ease" },
  rowUser:     { flexDirection: "row-reverse" },
  avatar:      { width: 32, height: 32, borderRadius: 8, background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "'Noto Serif SC',serif" },
  bubble:      { maxWidth: "78%", borderRadius: 8, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 },
  bubbleUser:  { background: "#111", color: "#fff" },
  bubbleBot:   { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)" },
  bubbleLoad:  { flexDirection: "row", alignItems: "center", gap: 10 },
  text:        { margin: 0, fontSize: 14, lineHeight: 1.85, whiteSpace: "pre-wrap" },
  mdText:      { fontSize: 14, lineHeight: 1.85, color: "inherit" },
  sources:     { borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 },
  srcHead:     { fontSize: 11, fontWeight: 600, color: "#a0a0a0", letterSpacing: 0.8, textTransform: "uppercase" },
  srcRow:      { display: "flex", alignItems: "center", gap: 8 },
  srcDot:      { width: 5, height: 5, borderRadius: "50%", background: "#111", flexShrink: 0 },
  srcTitle:    { fontSize: 13, color: "rgba(0,0,0,0.87)", flex: 1 },
  srcLink:     { fontSize: 12, color: "#111", textDecoration: "none" },
  srcSim:      { fontSize: 11, color: "#a0a0a0" },
  noCtx:       { fontSize: 13, color: "#6b6b6b", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 8 },
  noCtxLink:   { color: "#111", textDecoration: "none" },
  spinner:     { display: "inline-block", width: 14, height: 14, border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "#111", borderRadius: "50%", animation: "wf-spin 0.7s linear infinite", flexShrink: 0 },
  loadTxt:     { fontSize: 13, color: "#6b6b6b" },
  bar:         { borderTop: "1px solid rgba(0,0,0,0.08)", background: "#fff", padding: "12px 24px 16px", flexShrink: 0 },
  barInner:    { maxWidth: 760, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" },
  textarea:    { flex: 1, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, fontSize: 14, padding: "10px 14px", color: "rgba(0,0,0,0.87)", fontFamily: "inherit", resize: "none", lineHeight: 1.6, height: 44, maxHeight: 140, overflow: "auto", transition: "border-color 0.15s" },
  send:        { width: 44, height: 44, background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.15s" },
  sendDis:     { opacity: 0.4, cursor: "not-allowed" },
  barHint:     { maxWidth: 760, margin: "6px auto 0", fontSize: 11, color: "#a0a0a0", textAlign: "center" },
};
