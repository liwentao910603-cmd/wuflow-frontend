"use client";

import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:9000/api/v1";

interface Source {
  title: string;
  source_url: string;
  source_type: string;
  similarity: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  has_context?: boolean;
}

export default function QAPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = { role: "user", content: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // 构建发送给后端的对话历史（不含 sources 字段）
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const res  = await fetch(`${API}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, conversation_history: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "请求失败");

      setMessages([...newMessages, {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        has_context: data.has_context,
      }]);
    } catch (e: any) {
      setMessages([...newMessages, {
        role: "assistant",
        content: `⚠ 出错了：${e.message}`,
        sources: [],
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.root}>
      <style>{`@keyframes wf-spin{to{transform:rotate(360deg)}} @keyframes wf-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <span style={s.logoMark}>悟</span>
            <span style={s.logoText}>WuFlow</span>
          </div>
          <nav style={s.nav}>
            <a href="/ingest" style={s.navLink}>整理资料</a>
            <span style={{ ...s.navLink, ...s.navActive }}>知识库问答</span>
          </nav>
        </div>
      </header>

      {/* Chat area */}
      <main style={s.main}>
        <div style={s.chatWrap}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={s.empty}>
              <div style={s.emptyIcon}>◈</div>
              <p style={s.emptyTitle}>问问你的知识库</p>
              <p style={s.emptyHint}>基于你整理的笔记来回答，每条回答都标注来源</p>
              <div style={s.suggestions}>
                {["这些笔记的核心观点是什么？", "有哪些可以立刻执行的行动建议？", "人工智能有哪些主要应用领域？"].map((s_text, i) => (
                  <button key={i} style={s.suggestion} onClick={() => setInput(s_text)}>
                    {s_text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} style={{ ...s.msgRow, ...(msg.role === "user" ? s.msgRowUser : {}) }}>
              {msg.role === "assistant" && <div style={s.avatar}>悟</div>}
              <div style={{ ...s.bubble, ...(msg.role === "user" ? s.bubbleUser : s.bubbleAssistant) }}>
                <p style={s.msgText}>{msg.content}</p>

                {/* 来源引用 */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={s.sources}>
                    <span style={s.sourcesLabel}>📎 引用来源</span>
                    {msg.sources.map((src, j) => (
                      <div key={j} style={s.sourceItem}>
                        <span style={s.sourceTitle}>{src.title}</span>
                        {src.source_url && (
                          <a href={src.source_url} target="_blank" rel="noreferrer" style={s.sourceLink}>
                            查看原文 ↗
                          </a>
                        )}
                        <span style={s.sourceSim}>相关度 {Math.round(src.similarity * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 没有上下文提示 */}
                {msg.has_context === false && (
                  <div style={s.noContext}>
                    💡 知识库暂无相关内容，
                    <a href="/ingest" style={s.noContextLink}>去整理资料 →</a>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div style={s.msgRow}>
              <div style={s.avatar}>悟</div>
              <div style={{ ...s.bubble, ...s.bubbleAssistant, ...s.bubbleLoading }}>
                <span style={s.spinner} />
                <span style={s.loadingText}>正在检索知识库并生成回答…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <div style={s.inputArea}>
        <div style={s.inputInner}>
          <textarea
            style={s.textarea}
            placeholder="问问你的知识库…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={1}
          />
          <button
            style={{ ...s.sendBtn, ...(loading || !input.trim() ? s.sendBtnDis : {}) }}
            onClick={send}
            disabled={loading || !input.trim()}
          >
            ↑
          </button>
        </div>
        <p style={s.inputHint}>Enter 发送 · Shift+Enter 换行 · 回答仅基于你的知识库</p>
      </div>
    </div>
  );
}

const G = "#C9A84C", D = "#0D0D0D", SF = "#141414", B = "#252525", T = "#E8E8E8", M = "#666";

const s: Record<string, React.CSSProperties> = {
  root:         { minHeight: "100vh", background: D, color: T, fontFamily: "'Noto Serif SC', Georgia, serif", display: "flex", flexDirection: "column" },
  header:       { borderBottom: `1px solid ${B}`, padding: "0 24px", flexShrink: 0 },
  headerInner:  { maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 },
  logo:         { display: "flex", alignItems: "center", gap: 8 },
  logoMark:     { fontSize: 20, fontWeight: 700, color: G },
  logoText:     { fontSize: 15, color: T, letterSpacing: 1 },
  nav:          { display: "flex", gap: 20 },
  navLink:      { color: M, textDecoration: "none", fontSize: 13 },
  navActive:    { color: G },
  main:         { flex: 1, overflow: "auto", padding: "24px 24px 0" },
  chatWrap:     { maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, paddingBottom: 16 },
  empty:        { textAlign: "center", padding: "60px 0 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  emptyIcon:    { fontSize: 36, opacity: 0.25 },
  emptyTitle:   { fontSize: 20, fontWeight: 600, margin: 0 },
  emptyHint:    { fontSize: 14, color: M, margin: 0 },
  suggestions:  { display: "flex", flexDirection: "column", gap: 8, marginTop: 8, width: "100%", maxWidth: 480 },
  suggestion:   { background: SF, border: `1px solid ${B}`, color: M, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", textAlign: "left", transition: "border-color 0.2s" },
  msgRow:       { display: "flex", gap: 12, alignItems: "flex-start", animation: "wf-fade 0.3s ease" },
  msgRowUser:   { flexDirection: "row-reverse" },
  avatar:       { width: 32, height: 32, borderRadius: "50%", background: G + "22", border: `1px solid ${G}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: G, fontWeight: 700, flexShrink: 0 },
  bubble:       { maxWidth: "80%", borderRadius: 12, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 },
  bubbleUser:   { background: G + "18", border: `1px solid ${G}33` },
  bubbleAssistant: { background: SF, border: `1px solid ${B}` },
  bubbleLoading:{ flexDirection: "row", alignItems: "center", gap: 10 },
  msgText:      { margin: 0, fontSize: 14, lineHeight: 1.85, whiteSpace: "pre-wrap" },
  sources:      { borderTop: `1px solid ${B}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 },
  sourcesLabel: { fontSize: 11, color: M, letterSpacing: 1, textTransform: "uppercase" },
  sourceItem:   { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  sourceTitle:  { fontSize: 12, color: T, fontWeight: 500 },
  sourceLink:   { fontSize: 11, color: G, textDecoration: "none" },
  sourceSim:    { fontSize: 11, color: M, marginLeft: "auto" },
  noContext:    { fontSize: 12, color: M, borderTop: `1px solid ${B}`, paddingTop: 8 },
  noContextLink:{ color: G, textDecoration: "none" },
  spinner:      { display: "inline-block", width: 14, height: 14, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: G, borderRadius: "50%", animation: "wf-spin 0.7s linear infinite", flexShrink: 0 },
  loadingText:  { fontSize: 13, color: M },
  inputArea:    { borderTop: `1px solid ${B}`, padding: "16px 24px 20px", flexShrink: 0, background: D },
  inputInner:   { maxWidth: 800, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" },
  textarea:     { flex: 1, background: SF, border: `1px solid ${B}`, borderRadius: 10, color: T, fontSize: 14, padding: "12px 16px", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.6, maxHeight: 120, overflow: "auto" },
  sendBtn:      { background: G, color: D, border: "none", borderRadius: 10, width: 44, height: 44, fontSize: 18, cursor: "pointer", fontWeight: 700, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  sendBtnDis:   { opacity: 0.4, cursor: "not-allowed" },
  inputHint:    { maxWidth: 800, margin: "6px auto 0", fontSize: 11, color: M, textAlign: "center" },
};
