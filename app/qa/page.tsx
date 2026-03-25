"use client";

import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:9000/api/v1";

interface Source { title: string; source_url: string; source_type: string; similarity: number }
interface Message { role: "user" | "assistant"; content: string; sources?: Source[]; has_context?: boolean }

export default function QAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    const userMsg: Message = { role: "user", content: q };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "44px";

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res  = await fetch(`${API}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, conversation_history: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "请求失败");
      setMessages([...next, { role: "assistant", content: data.answer, sources: data.sources, has_context: data.has_context }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: `出错了：${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes wf-spin{to{transform:rotate(360deg)}}
        @keyframes wf-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        textarea:focus{outline:none;border-color:#2383E2!important;box-shadow:0 0 0 2px rgba(35,131,226,0.15)}
        .suggest-btn:hover{background:#F0F0EC!important}
      `}</style>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <a href="/" style={s.brand}>
            <span style={s.brandIcon}>悟</span>
            <span style={s.brandName}>WuFlow</span>
          </a>
          <div style={s.navLinks}>
            <a href="/ingest" style={s.navLink}>整理资料</a>
            <span style={{ ...s.navLink, ...s.navActive }}>知识库问答</span>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <main style={s.main}>
        <div style={s.feed}>

          {messages.length === 0 && (
            <div style={s.empty}>
              <div style={s.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2383E2" strokeWidth="1.5">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <h2 style={s.emptyTitle}>问问你的知识库</h2>
              <p style={s.emptySub}>基于你整理的笔记回答，每条回答都标注来源</p>
              <div style={s.suggests}>
                {["这些笔记的核心观点是什么？", "有哪些可以立刻执行的行动建议？", "人工智能有哪些主要应用领域？"].map((t, i) => (
                  <button key={i} className="suggest-btn" style={s.suggest} onClick={() => setInput(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ ...s.row, ...(m.role === "user" ? s.rowUser : {}) }}>
              {m.role === "assistant" && (
                <div style={s.avatar}>悟</div>
              )}
              <div style={{ ...s.bubble, ...(m.role === "user" ? s.bubbleUser : s.bubbleBot) }}>
                <p style={s.text}>{m.content}</p>

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
            onChange={autoResize}
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
  );
}

const BL = "#2383E2";
const s: Record<string, React.CSSProperties> = {
  page:      { minHeight: "100vh", background: "#F7F7F5", fontFamily: "'Noto Sans SC','PingFang SC',sans-serif", color: "#1A1A1A", display: "flex", flexDirection: "column" },
  nav:       { background: "#fff", borderBottom: "1px solid #E8E8E5", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 },
  navInner:  { maxWidth: 860, margin: "0 auto", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand:     { display: "flex", alignItems: "center", gap: 8, textDecoration: "none" },
  brandIcon: { fontSize: 18, fontWeight: 700, color: BL, fontFamily: "'Noto Serif SC',serif" },
  brandName: { fontSize: 15, fontWeight: 600, color: "#1A1A1A", letterSpacing: 0.5 },
  navLinks:  { display: "flex", gap: 24 },
  navLink:   { fontSize: 14, color: "#666", textDecoration: "none", cursor: "pointer" },
  navActive: { color: BL, fontWeight: 500 },
  main:      { flex: 1, overflow: "auto" },
  feed:      { maxWidth: 760, margin: "0 auto", padding: "32px 24px 24px", display: "flex", flexDirection: "column", gap: 16 },
  empty:     { textAlign: "center", padding: "48px 0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  emptyIcon: { width: 56, height: 56, borderRadius: "50%", background: "#EBF4FF", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyTitle:{ fontSize: 20, fontWeight: 700, margin: 0 },
  emptySub:  { fontSize: 14, color: "#888", margin: 0 },
  suggests:  { display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 440, marginTop: 4 },
  suggest:   { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 14, fontFamily: "inherit", textAlign: "left", color: "#333", transition: "background 0.15s" },
  row:       { display: "flex", gap: 12, alignItems: "flex-start", animation: "wf-in 0.25s ease" },
  rowUser:   { flexDirection: "row-reverse" },
  avatar:    { width: 32, height: 32, borderRadius: 8, background: BL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "'Noto Serif SC',serif" },
  bubble:    { maxWidth: "78%", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 },
  bubbleUser:{ background: BL, color: "#fff" },
  bubbleBot: { background: "#fff", border: "1px solid #E8E8E5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  bubbleLoad:{ flexDirection: "row", alignItems: "center", gap: 10 },
  text:      { margin: 0, fontSize: 14, lineHeight: 1.85, whiteSpace: "pre-wrap" },
  sources:   { borderTop: "1px solid #F0F0EC", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 },
  srcHead:   { fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: 0.8, textTransform: "uppercase" },
  srcRow:    { display: "flex", alignItems: "center", gap: 8 },
  srcDot:    { width: 5, height: 5, borderRadius: "50%", background: BL, flexShrink: 0 },
  srcTitle:  { fontSize: 13, color: "#333", flex: 1 },
  srcLink:   { fontSize: 12, color: BL, textDecoration: "none" },
  srcSim:    { fontSize: 11, color: "#bbb" },
  noCtx:     { fontSize: 13, color: "#888", borderTop: "1px solid #F0F0EC", paddingTop: 8 },
  noCtxLink: { color: BL, textDecoration: "none" },
  spinner:   { display: "inline-block", width: 14, height: 14, border: `2px solid ${BL}33`, borderTopColor: BL, borderRadius: "50%", animation: "wf-spin 0.7s linear infinite", flexShrink: 0 },
  loadTxt:   { fontSize: 13, color: "#888" },
  bar:       { borderTop: "1px solid #E8E8E5", background: "#fff", padding: "12px 24px 16px", flexShrink: 0 },
  barInner:  { maxWidth: 760, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" },
  textarea:  { flex: 1, border: "1px solid #E0E0DC", borderRadius: 8, fontSize: 14, padding: "10px 14px", color: "#1A1A1A", fontFamily: "inherit", resize: "none", lineHeight: 1.6, height: 44, maxHeight: 140, overflow: "auto", transition: "border-color 0.15s, box-shadow 0.15s" },
  send:      { width: 44, height: 44, background: BL, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.15s" },
  sendDis:   { opacity: 0.4, cursor: "not-allowed" },
  barHint:   { maxWidth: 760, margin: "6px auto 0", fontSize: 11, color: "#bbb", textAlign: "center" },
};
