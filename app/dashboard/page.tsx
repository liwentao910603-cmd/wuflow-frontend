"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import CheckinModal from "./CheckinModal";

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "深夜了";
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

interface Note {
  id: string; title: string; source_type: string; created_at: string;
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("");
  const [token, setToken] = useState("");
  const [notesTotal, setNotesTotal] = useState(0);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayReviewCount, setTodayReviewCount] = useState(0);
  const [tomorrowReview, setTomorrowReview] = useState<{count: number, items: {notes: {title: string}}[]}>({ count: 0, items: [] });
  const [studyStats, setStudyStats] = useState({ week_hours: 0, streak_days: 0, logged_today: false });
  const [showCheckin, setShowCheckin] = useState(false);

  const displayName = userEmail.split("@")[0] || "用户";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? "");
      setToken(session.access_token);
      fetchData(session.access_token);
    });
  }, []);

  const fetchData = async (token: string) => {
    try {
      const res = await fetch(`${API}/notes?page=1&page_size=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotesTotal(data.total || 0);
      setRecentNotes(data.notes?.slice(0, 3) || []);
    } catch {}
    try {
      const reviewRes = await fetch(`${API}/review/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reviewData = await reviewRes.json();
      setTodayReviewCount(reviewData.count || 0);
    } catch {}
    try {
      const tmrRes = await fetch(`${API}/review/tomorrow`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tmrData = await tmrRes.json();
      setTomorrowReview(tmrData);
    } catch {}
    try {
      const statsRes = await fetch(`${API}/study/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setStudyStats(statsData);
    } catch {}
    setLoading(false);
  };

  const tagColor: Record<string, string> = {
    url: "bg-blue-50 text-blue-600",
    pdf: "bg-amber-50 text-amber-700",
    text: "bg-green-50 text-green-700",
  };
  const tagLabel: Record<string, string> = { url: "网页", pdf: "PDF", text: "文本" };

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "今天";
    if (diff === 1) return "昨天";
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter','Noto Sans SC','PingFang SC',sans-serif" }}>
      <Sidebar userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto" style={{ background: '#f9f9f8' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 48px 48px' }}>

          {/* 问候 */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 30, fontWeight: 600, color: '#111', letterSpacing: '-0.5px', margin: '0 0 6px' }}>
              {getGreeting()}，{displayName.length > 8 ? '同学' : displayName} 👋
            </h1>
            <p style={{ fontSize: 15, color: '#888', margin: 0 }}>
              今天学了什么？知识库里有 {notesTotal} 篇笔记在等你。
            </p>
            {tomorrowReview.count > 0 && (
              <p style={{ fontSize: 13, color: '#a78bfa', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📅</span>
                <span>
                  明天有 {tomorrowReview.count} 篇待复习：
                  {tomorrowReview.items.slice(0, 2).map(item => item.notes?.title).filter(Boolean).join('、')}
                  {tomorrowReview.count > 2 ? `...等` : ''}
                </span>
              </p>
            )}
            <button
              onClick={() => setShowCheckin(true)}
              style={{
                marginTop: 16, background: studyStats.logged_today ? '#f0fdf4' : '#111',
                color: studyStats.logged_today ? '#16a34a' : '#fff',
                border: studyStats.logged_today ? '1px solid #bbf7d0' : 'none',
                borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer'
              }}
            >
              {studyStats.logged_today ? '✓ 今日已打卡' : '📝 30秒打卡'}
            </button>
          </div>

          {/* 统计卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>
            {[
              { label: '知识库笔记', value: notesTotal, unit: '篇', hint: '累计整理', emptyHint: '整理第一篇笔记开始记录 →' },
              { label: '今日待复习', value: todayReviewCount, unit: '篇', hint: '基于遗忘曲线', red: true, emptyHint: '加入复习计划后显示' },
              { label: '连续学习', value: studyStats.streak_days, unit: '天', hint: '保持节奏', emptyHint: '每天整理一篇来打卡' },
              { label: '本周时长', value: studyStats.week_hours, unit: '小时', hint: '专注学习', emptyHint: '开始第一次学习' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 10, fontWeight: 500 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 600, color: s.value === 0 ? '#ddd' : (s.red ? '#e53e3e' : '#111'), letterSpacing: '-1px' }}>{s.value}</span>
                  <span style={{ fontSize: 13, color: '#bbb' }}>{s.unit}</span>
                </div>
                {s.value === 0
                  ? <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>{s.emptyHint}</div>
                  : <div style={{ fontSize: 12, color: '#bbb' }}>{s.hint}</div>
                }
              </div>
            ))}
          </div>

          {/* 快捷入口 */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#999', letterSpacing: '0.5px', marginBottom: 14, textTransform: 'uppercase' }}>快捷入口</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {[
                { href: '/ingest', icon: '📥', title: '整理新资料', desc: '粘贴 URL、上传 PDF 或文本', color: '#f0f4ff' },
                { href: '/qa', icon: '💬', title: 'AI 问答', desc: '基于你的知识库智能回答', color: '#f0fff4' },
                { href: '/notes', icon: '📚', title: '浏览知识库', desc: `已整理 ${notesTotal} 篇笔记`, color: '#fff8f0' },
              ].map((a) => (
                <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: '22px 22px', cursor: 'pointer', transition: 'border-color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#ebebeb')}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{a.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 5 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>{a.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 最近整理 */}
          {recentNotes.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>最近整理</div>
                <Link href="/notes" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>查看全部 →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {recentNotes.map((note) => (
                  <Link key={note.id} href="/notes" style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: '18px 20px', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#ebebeb')}
                    >
                      <span style={{
                        display: 'inline-block', fontSize: 11, padding: '3px 9px', borderRadius: 99, marginBottom: 10, fontWeight: 500,
                        background: note.source_type === 'url' ? '#e8f0fe' : note.source_type === 'pdf' ? '#fff3e0' : '#e8f5e9',
                        color: note.source_type === 'url' ? '#1a56db' : note.source_type === 'pdf' ? '#e65100' : '#2e7d32',
                      }}>
                        {note.source_type === 'url' ? '网页' : note.source_type === 'pdf' ? 'PDF' : '文本'}
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.title}</div>
                      <div style={{ fontSize: 12, color: '#bbb' }}>{formatDate(note.created_at)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : !loading && (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📥</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 8 }}>还没有笔记</div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>整理第一篇资料，开始构建你的专属知识库</div>
              <a href="/ingest" style={{ background: '#111', color: '#fff', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>去整理资料 →</a>
            </div>
          )}

        </div>
      </main>
    {showCheckin && (
        <CheckinModal
          token={token}
          onClose={() => setShowCheckin(false)}
          onSuccess={() => { setShowCheckin(false); fetchData(token); }}
        />
      )}
    </div>
  );
}
