"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const TOOLTIP_W = 280;

const STEPS = [
  { targetId: "ob-ingest",     icon: "📥", title: "整理资料",   desc: "粘贴文章链接或上传 PDF，AI 自动提取知识点，30 秒生成结构化笔记。" },
  { targetId: "ob-notes",      icon: "📚", title: "浏览知识库", desc: "查看和管理你整理的所有笔记，支持搜索和概念标签。" },
  { targetId: "ob-sidebar-qa", icon: "💬", title: "AI 问答",    desc: "基于你自己的笔记，随时向 AI 提问，答案 100% 来自你的知识库。" },
  { targetId: "ob-checkin",    icon: "📝", title: "学习打卡",   desc: "每天打卡记录学习时长，坚持积累，养成学习习惯。" },
  { targetId: "ob-review",     icon: "🔄", title: "开始复习",   desc: "在你快遗忘时，AI 主动出题帮你巩固，真正记住所学内容。" },
];

const TOTAL = STEPS.length;

interface Pos {
  top: number;
  left: number;
  arrowDir: "left" | "right" | "top" | "bottom";
  arrowOffset: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function calcPos(el: Element): Pos {
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 16;

  // right
  if (r.right + gap + TOOLTIP_W + 24 <= vw) {
    const top = clamp(r.top + r.height / 2 - 90, 10, vh - 220);
    return { top, left: r.right + gap, arrowDir: "left", arrowOffset: r.top + r.height / 2 - top - 8 };
  }
  // left
  if (r.left - gap - TOOLTIP_W >= 4) {
    const top = clamp(r.top + r.height / 2 - 90, 10, vh - 220);
    return { top, left: r.left - gap - TOOLTIP_W, arrowDir: "right", arrowOffset: r.top + r.height / 2 - top - 8 };
  }
  // below
  const left = clamp(r.left + r.width / 2 - TOOLTIP_W / 2, 10, vw - TOOLTIP_W - 10);
  if (r.bottom + gap + 190 <= vh) {
    return { top: r.bottom + gap, left, arrowDir: "top", arrowOffset: r.left + r.width / 2 - left - 8 };
  }
  // above
  return { top: r.top - gap - 190, left, arrowDir: "bottom", arrowOffset: r.left + r.width / 2 - left - 8 };
}

export default function OnboardingTooltip({
  step,
  onNext,
  onClose,
}: {
  step: number;
  onNext: () => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState<Pos | null>(null);
  const prevElRef = useRef<HTMLElement | null>(null);
  const isLast = step === TOTAL - 1;
  const current = STEPS[step];

  const applyHighlight = useCallback((el: HTMLElement) => {
    el.style.position = "relative";
    el.style.zIndex = "1001";
    el.style.borderRadius = "10px";
    el.style.boxShadow = "0 0 0 3px #2383E2, 0 0 0 7px rgba(35,131,226,0.18)";
    el.style.transition = "box-shadow 0.25s";
  }, []);

  const removeHighlight = useCallback((el: HTMLElement) => {
    el.style.position = "";
    el.style.zIndex = "";
    el.style.boxShadow = "";
    el.style.transition = "";
    el.style.borderRadius = "";
  }, []);

  useEffect(() => {
    const el = document.getElementById(current.targetId) as HTMLElement | null;
    if (!el) return;

    if (prevElRef.current && prevElRef.current !== el) {
      removeHighlight(prevElRef.current);
    }

    applyHighlight(el);
    prevElRef.current = el;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const t = setTimeout(() => setPos(calcPos(el)), 160);
    return () => clearTimeout(t);
  }, [step, current.targetId, applyHighlight, removeHighlight]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevElRef.current) removeHighlight(prevElRef.current);
    };
  }, [removeHighlight]);

  // recalc on resize
  useEffect(() => {
    const onResize = () => {
      const el = document.getElementById(current.targetId);
      if (el) setPos(calcPos(el));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [current.targetId]);

  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    ...(pos?.arrowDir === "left"   && { left: -8,   top:    pos.arrowOffset, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight:  "8px solid #fff" }),
    ...(pos?.arrowDir === "right"  && { right: -8,  top:    pos.arrowOffset, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft:   "8px solid #fff" }),
    ...(pos?.arrowDir === "top"    && { top: -8,    left:   pos.arrowOffset, borderLeft: "8px solid transparent", borderRight: "8px solid transparent",  borderBottom: "8px solid #fff" }),
    ...(pos?.arrowDir === "bottom" && { bottom: -8, left:   pos.arrowOffset, borderLeft: "8px solid transparent", borderRight: "8px solid transparent",  borderTop:    "8px solid #fff" }),
  };

  if (!pos) return null;

  return (
    <>
      {/* 遮罩 */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.32)", zIndex: 999 }}
        onClick={onClose}
      />

      {/* 气泡卡片 */}
      <div
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: TOOLTIP_W,
          zIndex: 1002,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
          padding: "20px 20px 16px",
          fontFamily: "'Inter','Noto Sans SC','PingFang SC',sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 箭头 */}
        <div style={arrowStyle} />

        {/* 跳过 */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", fontSize: 12, color: "#a0a0a0", cursor: "pointer", padding: "2px 6px", lineHeight: 1 }}
        >
          跳过
        </button>

        {/* 内容 */}
        <div style={{ marginBottom: 16, marginRight: 28 }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>{current.icon}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(0,0,0,0.87)", marginBottom: 6 }}>{current.title}</div>
          <div style={{ fontSize: 13, color: "#6b6b6b", lineHeight: 1.65 }}>{current.desc}</div>
        </div>

        {/* 底部：圆点进度 + 按钮 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 9999,
                  background: i === step ? "#111" : "#e5e7eb",
                  transition: "width 0.2s, background 0.2s",
                }}
              />
            ))}
          </div>

          <button
            onClick={isLast ? onClose : onNext}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {isLast ? "开始使用 →" : "下一步"}
          </button>
        </div>
      </div>
    </>
  );
}
