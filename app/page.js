"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:9000/api/v1";

export default function HomePage() {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");

  async function joinWaitlist() {
    if (!email.trim() || status === "loading") return;
    setStatus("loading");
    try {
      const res  = await fetch(`${API.replace("/api/v1", "")}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "提交失败");
      setStatus("done");
      setMessage("已加入等待名单，我们会第一时间通知你 🎉");
    } catch (e) {
      setStatus("error");
      setMessage(e.message);
    }
  }

  return (
    <div style={s.page}>
      <style>{`
        *{box-sizing:border-box}
        a{text-decoration:none}
        input:focus{outline:none;border-color:#2383E2!important;box-shadow:0 0 0 2px rgba(35,131,226,0.15)}
        .card:hover{border-color:#2383E2!important;box-shadow:0 4px 16px rgba(35,131,226,0.08)!important;transform:translateY(-2px)}
        .nav-link:hover{color:#1A1A1A!important}
        .btn-ghost:hover{background:#F0F0EC!important}
        @keyframes wf-fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade1{animation:wf-fade 0.5s ease both}
        .fade2{animation:wf-fade 0.5s 0.1s ease both}
        .fade3{animation:wf-fade 0.5s 0.2s ease both}
      `}</style>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.brand}>
            <span style={s.brandIcon}>悟</span>
            <span style={s.brandName}>WuFlow</span>
            <span style={s.badge}>Beta</span>
          </div>
          <div style={s.navRight}>
            <a href="/ingest" className="nav-link" style={s.navLink}>整理资料</a>
            <a href="/qa" className="nav-link" style={s.navLink}>知识库问答</a>
            <a href="/ingest" style={s.navCta}>开始使用 →</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div className="fade1" style={s.heroPill}>🚀 正在开发中，欢迎提前加入等待名单</div>
          <h1 className="fade2" style={s.h1}>
            让知识真正<span style={s.h1Blue}>流动</span>起来
          </h1>
          <p className="fade3" style={s.heroSub}>
            悟流 WuFlow 是专为跨界自学者打造的 AI 学习加速工具。<br />
            把散乱的资料变成结构化知识，用自己的笔记回答问题。
          </p>

          {/* CTA 入口 */}
          <div className="fade3" style={s.ctaRow}>
            <a href="/ingest" style={s.ctaPrimary}>
              ✦ 一键整理资料
            </a>
            <a href="/qa" style={s.ctaSecondary}>
              ◈ 知识库问答
            </a>
          </div>

          {/* 等待名单 */}
          <div className="fade3" style={s.waitlistBox}>
            {status === "done" ? (
              <p style={s.successMsg}>{message}</p>
            ) : (
              <>
                <div style={s.waitlistRow}>
                  <input
                    style={s.emailInput}
                    type="email"
                    placeholder="输入你的邮箱，提前加入等待名单"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && joinWaitlist()}
                    disabled={status === "loading"}
                  />
                  <button
                    style={{ ...s.waitlistBtn, ...(status === "loading" ? s.btnDis : {}) }}
                    onClick={joinWaitlist}
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "提交中…" : "加入等待名单 →"}
                  </button>
                </div>
                {status === "error" && <p style={s.errMsg}>{message}</p>}
                <p style={s.waitlistHint}>已有 200+ 人加入，不发垃圾邮件</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section style={s.features}>
        <div style={s.featuresInner}>
          <h2 style={s.secTitle}>两个核心功能，解决学习中最烦的事</h2>
          <div style={s.cardGrid}>

            <a href="/ingest" className="card" style={s.card}>
              <div style={s.cardIcon}>📥</div>
              <h3 style={s.cardTitle}>资料一键整理</h3>
              <p style={s.cardDesc}>
                粘贴文章链接，AI 自动提取核心内容，生成包含摘要、核心概念、要点和行动建议的结构化笔记，每条都附来源引用。
              </p>
              <div style={s.cardLink}>立即体验 →</div>
            </a>

            <a href="/qa" className="card" style={s.card}>
              <div style={s.cardIcon}>💬</div>
              <h3 style={s.cardTitle}>私人 AI 知识库问答</h3>
              <p style={s.cardDesc}>
                基于你自己整理的笔记回答问题，不是泛泛的 ChatGPT，而是真正懂你知识库的私人助手，回答标注来源。
              </p>
              <div style={s.cardLink}>开始提问 →</div>
            </a>

          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={s.how}>
        <div style={s.howInner}>
          <h2 style={s.secTitle}>三步开始使用</h2>
          <div style={s.steps}>
            {[
              { n: "1", title: "整理资料", desc: "粘贴文章 URL，AI 生成结构化笔记并存入知识库" },
              { n: "2", title: "积累知识", desc: "持续整理，知识库越来越丰富，检索越来越准确" },
              { n: "3", title: "随时问答", desc: "有问题直接问，AI 基于你的笔记给出带来源的回答" },
            ].map((step, i) => (
              <div key={i} style={s.step}>
                <div style={s.stepNum}>{step.n}</div>
                <h4 style={s.stepTitle}>{step.title}</h4>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerBrand}>悟流 WuFlow</span>
          <span style={s.footerMeta}>© 2026 · 正在开发中</span>
          <div style={s.footerLinks}>
            <a href="/ingest" style={s.footerLink}>整理资料</a>
            <a href="/qa" style={s.footerLink}>知识库问答</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const BL = "#2383E2";
const s = {
  page:        { minHeight: "100vh", background: "#fff", fontFamily: "'Noto Sans SC','PingFang SC',sans-serif", color: "#1A1A1A" },
  // Nav
  nav:         { borderBottom: "1px solid #E8E8E5", position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)" },
  navInner:    { maxWidth: 1000, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand:       { display: "flex", alignItems: "center", gap: 8 },
  brandIcon:   { fontSize: 20, fontWeight: 700, color: BL, fontFamily: "'Noto Serif SC',serif" },
  brandName:   { fontSize: 16, fontWeight: 700, color: "#1A1A1A" },
  badge:       { fontSize: 11, fontWeight: 600, color: BL, background: "#EBF4FF", padding: "2px 7px", borderRadius: 4 },
  navRight:    { display: "flex", alignItems: "center", gap: 24 },
  navLink:     { fontSize: 14, color: "#666", transition: "color 0.15s" },
  navCta:      { fontSize: 14, fontWeight: 600, color: "#fff", background: BL, padding: "7px 16px", borderRadius: 7 },
  // Hero
  hero:        { background: "#F7F7F5", borderBottom: "1px solid #E8E8E5" },
  heroInner:   { maxWidth: 720, margin: "0 auto", padding: "72px 24px 64px", textAlign: "center" },
  heroPill:    { display: "inline-block", fontSize: 13, color: "#666", background: "#fff", border: "1px solid #E8E8E5", borderRadius: 20, padding: "5px 14px", marginBottom: 24 },
  h1:          { fontSize: 44, fontWeight: 800, margin: "0 0 16px", letterSpacing: -1, lineHeight: 1.2 },
  h1Blue:      { color: BL },
  heroSub:     { fontSize: 17, color: "#555", lineHeight: 1.8, margin: "0 0 36px" },
  ctaRow:      { display: "flex", gap: 12, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" },
  ctaPrimary:  { fontSize: 15, fontWeight: 600, color: "#fff", background: BL, padding: "12px 28px", borderRadius: 8, transition: "opacity 0.15s" },
  ctaSecondary:{ fontSize: 15, fontWeight: 600, color: BL, background: "#EBF4FF", padding: "12px 28px", borderRadius: 8, transition: "opacity 0.15s" },
  waitlistBox: { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 12, padding: "24px", maxWidth: 520, margin: "0 auto", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  waitlistRow: { display: "flex", gap: 10, marginBottom: 10 },
  emailInput:  { flex: 1, border: "1px solid #E0E0DC", borderRadius: 7, fontSize: 14, padding: "10px 14px", fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s" },
  waitlistBtn: { background: BL, color: "#fff", border: "none", borderRadius: 7, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  btnDis:      { opacity: 0.6, cursor: "not-allowed" },
  waitlistHint:{ fontSize: 12, color: "#aaa", margin: 0 },
  successMsg:  { fontSize: 14, color: "#16A34A", margin: 0, padding: "8px 0" },
  errMsg:      { fontSize: 13, color: "#DC2626", margin: "4px 0 0" },
  // Features
  features:    { padding: "72px 24px" },
  featuresInner:{ maxWidth: 860, margin: "0 auto" },
  secTitle:    { fontSize: 26, fontWeight: 700, textAlign: "center", margin: "0 0 40px", letterSpacing: -0.3 },
  cardGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 },
  card:        { display: "block", background: "#fff", border: "1px solid #E8E8E5", borderRadius: 12, padding: "28px", transition: "all 0.2s", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  cardIcon:    { fontSize: 32, marginBottom: 16 },
  cardTitle:   { fontSize: 18, fontWeight: 700, margin: "0 0 10px", color: "#1A1A1A" },
  cardDesc:    { fontSize: 14, color: "#555", lineHeight: 1.75, margin: "0 0 16px" },
  cardLink:    { fontSize: 14, fontWeight: 600, color: BL },
  // How
  how:         { background: "#F7F7F5", padding: "72px 24px", borderTop: "1px solid #E8E8E5" },
  howInner:    { maxWidth: 860, margin: "0 auto" },
  steps:       { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 },
  step:        { textAlign: "center" },
  stepNum:     { width: 40, height: 40, borderRadius: "50%", background: "#EBF4FF", color: BL, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" },
  stepTitle:   { fontSize: 16, fontWeight: 700, margin: "0 0 8px" },
  stepDesc:    { fontSize: 14, color: "#666", lineHeight: 1.7, margin: 0 },
  // Footer
  footer:      { borderTop: "1px solid #E8E8E5", padding: "24px" },
  footerInner: { maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  footerBrand: { fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginRight: "auto" },
  footerMeta:  { fontSize: 13, color: "#aaa" },
  footerLinks: { display: "flex", gap: 16 },
  footerLink:  { fontSize: 13, color: "#666" },
};
