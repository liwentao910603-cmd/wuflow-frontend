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
    <main style={s.page}>
      <style>{`@keyframes wf-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={s.wrap}>

        <div style={s.hero}>
          <span style={s.logo}>悟流 WuFlow</span>
          <h1 style={s.h1}>一键整理资料</h1>
          <p style={s.sub}>粘贴任意文章链接，AI 自动生成结构化学习笔记</p>
        </div>

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
          <button style={{ ...s.btn, ...(loading ? s.btnDis : {}) }} onClick={submit} disabled={loading}>
            {loading ? <><Spin />&nbsp;整理中…</> : "✦ 整理"}
          </button>
        </div>

        {error && <div style={s.err}>⚠ {error}</div>}

        {loading && (
          <div style={s.loadBox}>
            <Spin size={18} />
            <span>AI 正在阅读并整理笔记，通常需要 10-20 秒…</span>
          </div>
        )}

        {note && <NoteResult note={note} />}

        {!loading && !note && (
          <p style={s.libLink}>
            查看已整理的笔记 → <a href="/notes" style={s.a}>我的知识库</a>
          </p>
        )}
      </div>
    </main>
  );
}

function NoteResult({ note }: { note: Note }) {
  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <h2 style={s.noteTitle}>{note.title}</h2>
        {note.source_url && (
          <a href={note.source_url} target="_blank" rel="noreferrer" style={s.srcLink}>
            查看原文 ↗
          </a>
        )}
      </div>

      <Section icon="📌" title="核心摘要">
        <p style={s.bodyText}>{note.summary}</p>
      </Section>

      {note.concepts?.length > 0 && (
        <Section icon="💡" title="核心概念">
          <div style={s.conceptGrid}>
            {note.concepts.map((c, i) => (
              <div key={i} style={s.conceptCard}>
                <span style={s.term}>{c.term}</span>
                <span style={s.def}>{c.definition}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {note.key_points?.length > 0 && (
        <Section icon="✦" title="核心要点">
          <ul style={s.ul}>
            {note.key_points.map((pt, i) => (
              <li key={i} style={s.li}><span style={s.dash}>—</span>{pt}</li>
            ))}
          </ul>
        </Section>
      )}

      {note.action_items?.length > 0 && (
        <Section icon="🎯" title="行动建议">
          <ul style={s.ul}>
            {note.action_items.map((a, i) => (
              <li key={i} style={s.li}><span style={s.idx}>{i + 1}</span>{a}</li>
            ))}
          </ul>
        </Section>
      )}

      <div style={s.footer}>
        <div style={s.tags}>
          {note.tags?.map((t, i) => <span key={i} style={s.tag}># {t}</span>)}
        </div>
        <div style={s.cite}>
          {note.source_url && (
            <span style={s.citeText}>
              📎 来源：
              <a href={note.source_url} target="_blank" rel="noreferrer" style={s.a}>
                {note.source_url.replace(/^https?:\/\//, "").slice(0, 55)}
              </a>
            </span>
          )}
          {note.tokens_used ? <span style={s.tokens}>{note.tokens_used} tokens</span> : null}
        </div>
      </div>

      <button style={s.again} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        ↑ 再整理一篇
      </button>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={s.section}>
      <h3 style={s.secTitle}>{icon}&nbsp;{title}</h3>
      {children}
    </div>
  );
}

function Spin({ size = 14 }: { size?: number }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "#C9A84C",
      borderRadius: "50%", animation: "wf-spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

const G = "#C9A84C", D = "#0D0D0D", SF = "#141414", B = "#252525", T = "#E8E8E8", M = "#777";
const s: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100vh", background: D, color: T, fontFamily: "'Noto Serif SC', Georgia, serif", padding: "0 16px 80px" },
  wrap:        { maxWidth: 720, margin: "0 auto", paddingTop: 60 },
  hero:        { textAlign: "center", marginBottom: 40 },
  logo:        { fontSize: 12, letterSpacing: 4, color: G, textTransform: "uppercase", display: "block", marginBottom: 16 },
  h1:          { fontSize: 30, fontWeight: 700, margin: "0 0 10px" },
  sub:         { fontSize: 15, color: M, margin: 0 },
  inputRow:    { display: "flex", gap: 10, marginBottom: 16 },
  input:       { flex: 1, background: SF, border: `1px solid ${B}`, borderRadius: 8, color: T, fontSize: 15, padding: "12px 16px", outline: "none", fontFamily: "inherit" },
  btn:         { background: G, color: D, border: "none", borderRadius: 8, padding: "12px 22px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  btnDis:      { opacity: 0.6, cursor: "not-allowed" },
  err:         { background: "#2A1010", border: "1px solid #5A2020", borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#EF9090", marginBottom: 16 },
  loadBox:     { display: "flex", alignItems: "center", gap: 12, padding: "24px 0", color: M, fontSize: 14 },
  libLink:     { textAlign: "center", marginTop: 40, fontSize: 14, color: M },
  a:           { color: G, textDecoration: "none" },
  card:        { background: SF, border: `1px solid ${B}`, borderRadius: 12, overflow: "hidden", marginTop: 24 },
  cardHead:    { padding: "20px 24px 16px", borderBottom: `1px solid ${B}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  noteTitle:   { margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.4 },
  srcLink:     { fontSize: 12, color: G, textDecoration: "none", flexShrink: 0, marginTop: 4 },
  section:     { padding: "16px 24px", borderBottom: `1px solid ${B}` },
  secTitle:    { margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: M, letterSpacing: 1.5, textTransform: "uppercase" },
  bodyText:    { margin: 0, fontSize: 15, lineHeight: 1.85, color: T },
  conceptGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 },
  conceptCard: { background: D, borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 5 },
  term:        { fontSize: 14, fontWeight: 700, color: G },
  def:         { fontSize: 13, color: M, lineHeight: 1.55 },
  ul:          { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 },
  li:          { display: "flex", gap: 10, fontSize: 14, lineHeight: 1.75, color: T, alignItems: "flex-start" },
  dash:        { color: G, flexShrink: 0, marginTop: 2 },
  idx:         { background: G + "22", color: G, borderRadius: 4, minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  footer:      { padding: "14px 24px", display: "flex", flexDirection: "column", gap: 10 },
  tags:        { display: "flex", flexWrap: "wrap", gap: 6 },
  tag:         { fontSize: 12, color: M, background: "#1A1A1A", padding: "3px 9px", borderRadius: 4 },
  cite:        { display: "flex", justifyContent: "space-between", alignItems: "center" },
  citeText:    { fontSize: 12, color: M },
  tokens:      { fontSize: 11, color: M, opacity: 0.45 },
  again:       { display: "block", width: "100%", background: "none", border: "none", borderTop: `1px solid ${B}`, color: M, padding: "13px 0", cursor: "pointer", fontFamily: "inherit", fontSize: 13 },
};
