"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:9000/api/v1";

interface Concept { term: string; definition: string }
interface Note {
  title: string; summary: string;
  concepts: Concept[]; key_points: string[];
  action_items: string[]; tags: string[];
  source_url?: string; tokens_used?: number;
}

export default function IngestPage() {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote]       = useState<Note | null>(null);
  const [error, setError]     = useState("");

  async function submit() {
    if (!url.trim()) return;
    setError(""); setNote(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), generate_note: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "请求失败");
      if (data.note) setNote(data.note);
      else setError("笔记生成失败，请重试");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes wf-spin { to { transform: rotate(360deg) } }
        @keyframes wf-slide { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing: border-box; }
        input:focus, textarea:focus { outline: none; border-color: #2383E2 !important; box-shadow: 0 0 0 2px rgba(35,131,226,0.15); }
        button:hover:not(:disabled) { opacity: 0.85; }
        a:hover { opacity: 0.7; }
      `}</style>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <a href="/" style={s.brand}>
            <span style={s.brandIcon}>悟</span>
            <span style={s.brandName}>WuFlow</span>
          </a>
          <div style={s.navLinks}>
            <span style={{ ...s.navLink, ...s.navActive }}>整理资料</span>
            <a href="/qa" style={s.navLink}>知识库问答</a>
          </div>
        </div>
      </nav>

      <main style={s.main}>
        {/* Hero */}
        <div style={s.hero}>
          <h1 style={s.h1}>一键整理资料</h1>
          <p style={s.sub}>粘贴任意文章链接，AI 自动生成结构化学习笔记</p>
        </div>

        {/* Input card */}
        <div style={s.card}>
          <label style={s.label}>文章链接</label>
          <div style={s.inputRow}>
            <input
              style={s.input}
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              disabled={loading}
            />
            <button
              style={{ ...s.btn, ...(loading ? s.btnDis : {}) }}
              onClick={submit}
              disabled={loading}
            >
              {loading ? <><Spin />整理中…</> : "整理"}
            </button>
          </div>

          {error && <div style={s.err}>⚠ {error}</div>}

          {loading && (
            <div style={s.loadRow}>
              <Spin color="#2383E2" />
              <span style={s.loadText}>AI 正在阅读并整理笔记，通常需要 10–20 秒…</span>
            </div>
          )}
        </div>

        {/* Note result */}
        {note && <NoteCard note={note} />}

        {!loading && !note && (
          <p style={s.hint}>
            已整理的笔记 → <a href="/qa" style={s.link}>去知识库问答</a>
          </p>
        )}
      </main>
    </div>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div style={nc.wrap}>
      {/* Title */}
      <div style={nc.head}>
        <h2 style={nc.title}>{note.title}</h2>
        {note.source_url && (
          <a href={note.source_url} target="_blank" rel="noreferrer" style={nc.srcLink}>
            查看原文 ↗
          </a>
        )}
      </div>

      {/* Summary */}
      <Sec label="摘要">
        <p style={nc.body}>{note.summary}</p>
      </Sec>

      {/* Concepts */}
      {note.concepts?.length > 0 && (
        <Sec label="核心概念">
          <div style={nc.conceptGrid}>
            {note.concepts.map((c, i) => (
              <div key={i} style={nc.concept}>
                <span style={nc.term}>{c.term}</span>
                <span style={nc.def}>{c.definition}</span>
              </div>
            ))}
          </div>
        </Sec>
      )}

      {/* Key points */}
      {note.key_points?.length > 0 && (
        <Sec label="核心要点">
          <ul style={nc.ul}>
            {note.key_points.map((p, i) => (
              <li key={i} style={nc.li}>
                <span style={nc.bullet} />
                {p}
              </li>
            ))}
          </ul>
        </Sec>
      )}

      {/* Actions */}
      {note.action_items?.length > 0 && (
        <Sec label="行动建议">
          <ul style={nc.ul}>
            {note.action_items.map((a, i) => (
              <li key={i} style={nc.li}>
                <span style={nc.num}>{i + 1}</span>
                {a}
              </li>
            ))}
          </ul>
        </Sec>
      )}

      {/* Footer */}
      <div style={nc.footer}>
        <div style={nc.tags}>
          {note.tags?.map((t, i) => <span key={i} style={nc.tag}>{t}</span>)}
        </div>
        {note.source_url && (
          <span style={nc.cite}>
            来源：<a href={note.source_url} target="_blank" rel="noreferrer" style={nc.citeLink}>
              {note.source_url.replace(/^https?:\/\//, "").slice(0, 50)}
            </a>
          </span>
        )}
      </div>

      <div style={nc.actions}>
        <button style={nc.again} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          ↑ 再整理一篇
        </button>
        <a href="/qa" style={nc.toQA}>去知识库提问 →</a>
      </div>
    </div>
  );
}

function Sec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={nc.sec}>
      <div style={nc.secLabel}>{label}</div>
      {children}
    </div>
  );
}

function Spin({ color = "#fff", size = 14 }: { color?: string; size?: number }) {
  return <span style={{
    display: "inline-block", width: size, height: size, flexShrink: 0,
    border: `2px solid ${color}33`, borderTopColor: color,
    borderRadius: "50%", animation: "wf-spin 0.7s linear infinite",
  }} />;
}

/* ── Styles ── */
const s: Record<string, React.CSSProperties> = {
  page:     { minHeight: "100vh", background: "#F7F7F5", fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif", color: "#1A1A1A" },
  nav:      { background: "#fff", borderBottom: "1px solid #E8E8E5", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 860, margin: "0 auto", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand:    { display: "flex", alignItems: "center", gap: 8, textDecoration: "none" },
  brandIcon:{ fontSize: 18, fontWeight: 700, color: "#2383E2", fontFamily: "'Noto Serif SC', serif" },
  brandName:{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", letterSpacing: 0.5 },
  navLinks: { display: "flex", gap: 24 },
  navLink:  { fontSize: 14, color: "#666", textDecoration: "none", cursor: "pointer" },
  navActive:{ color: "#2383E2", fontWeight: 500 },
  main:     { maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" },
  hero:     { textAlign: "center", marginBottom: 32 },
  h1:       { fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: "#1A1A1A", letterSpacing: -0.5 },
  sub:      { fontSize: 15, color: "#888", margin: 0 },
  card:     { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 10, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  label:    { fontSize: 13, color: "#888", fontWeight: 500 },
  inputRow: { display: "flex", gap: 10 },
  input:    { flex: 1, border: "1px solid #E0E0DC", borderRadius: 7, fontSize: 14, padding: "10px 14px", color: "#1A1A1A", background: "#fff", fontFamily: "inherit", transition: "border-color 0.15s" },
  btn:      { background: "#2383E2", color: "#fff", border: "none", borderRadius: 7, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", transition: "opacity 0.15s" },
  btnDis:   { opacity: 0.6, cursor: "not-allowed" },
  err:      { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#DC2626" },
  loadRow:  { display: "flex", alignItems: "center", gap: 10, color: "#888", fontSize: 13 },
  loadText: {},
  hint:     { textAlign: "center", marginTop: 24, fontSize: 13, color: "#aaa" },
  link:     { color: "#2383E2", textDecoration: "none" },
};

const nc: Record<string, React.CSSProperties> = {
  wrap:        { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 10, marginTop: 20, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "wf-slide 0.35s ease" },
  head:        { padding: "20px 24px 16px", borderBottom: "1px solid #F0F0EC", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  title:       { margin: 0, fontSize: 18, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.4 },
  srcLink:     { fontSize: 12, color: "#2383E2", textDecoration: "none", flexShrink: 0, marginTop: 2 },
  sec:         { padding: "14px 24px", borderBottom: "1px solid #F0F0EC" },
  secLabel:    { fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  body:        { margin: 0, fontSize: 14, lineHeight: 1.85, color: "#333" },
  conceptGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 },
  concept:     { background: "#F7F7F5", borderRadius: 7, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 },
  term:        { fontSize: 13, fontWeight: 600, color: "#2383E2" },
  def:         { fontSize: 12, color: "#666", lineHeight: 1.5 },
  ul:          { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
  li:          { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#333", lineHeight: 1.7 },
  bullet:      { width: 6, height: 6, borderRadius: "50%", background: "#2383E2", flexShrink: 0, marginTop: 6 },
  num:         { background: "#EBF4FF", color: "#2383E2", borderRadius: 4, minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  footer:      { padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  tags:        { display: "flex", flexWrap: "wrap", gap: 6 },
  tag:         { fontSize: 12, color: "#666", background: "#F0F0EC", padding: "2px 8px", borderRadius: 4 },
  cite:        { fontSize: 12, color: "#aaa" },
  citeLink:    { color: "#2383E2", textDecoration: "none" },
  actions:     { padding: "12px 24px", borderTop: "1px solid #F0F0EC", display: "flex", gap: 12, alignItems: "center" },
  again:       { background: "none", border: "1px solid #E0E0DC", color: "#666", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  toQA:        { fontSize: 13, color: "#2383E2", textDecoration: "none", marginLeft: "auto" },
};
