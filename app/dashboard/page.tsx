"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

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
  const [notesTotal, setNotesTotal] = useState(0);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = userEmail.split("@")[0] || "用户";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? "");
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
    <div className="flex h-screen overflow-hidden bg-gray-50/30" style={{ fontFamily: "'Noto Sans SC','PingFang SC',sans-serif" }}>
      <Sidebar userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-2xl mx-auto px-10 py-12">
          {/* 问候 */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            {getGreeting()}，{displayName.length > 8 ? "同学" : displayName}
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            今天学了什么？知识库里有 {notesTotal} 篇笔记在等你。
          </p>

          {/* 统计 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "知识库笔记", value: notesTotal, hint: "篇" },
              { label: "今日待复习", value: 0, hint: "篇", red: true },
              { label: "连续学习", value: 0, hint: "天" },
              { label: "本周时长", value: 0, hint: "小时" },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                <div className={`text-2xl font-medium ${s.red ? "text-red-500" : "text-gray-900"}`}>{s.value}</div>
                <div className="text-xs text-gray-300 mt-0.5">{s.hint}</div>
              </div>
            ))}
          </div>

          {/* 快捷入口 */}
          <div className="text-xs font-medium text-gray-400 mb-2 tracking-wide">快捷入口</div>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { href: "/ingest", icon: "📥", title: "整理新资料", desc: "URL / PDF / 文本" },
              { href: "/qa", icon: "💬", title: "AI 问答", desc: "问问你的知识库" },
              { href: "/notes", icon: "📚", title: "浏览知识库", desc: `全部 ${notesTotal} 篇笔记` },
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
              >
                <div className="text-base mb-1.5">{a.icon}</div>
                <div className="text-sm font-medium text-gray-900 mb-0.5">{a.title}</div>
                <div className="text-xs text-gray-400">{a.desc}</div>
              </Link>
            ))}
          </div>

          {/* 最近整理 */}
          {recentNotes.length > 0 && (
            <>
              <div className="text-xs font-medium text-gray-400 mb-2 tracking-wide">最近整理</div>
              <div className="grid grid-cols-3 gap-2">
                {recentNotes.map((note) => (
                  <div key={note.id} className="bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors cursor-pointer">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-2 ${tagColor[note.source_type] || "bg-gray-100 text-gray-500"}`}>
                      {tagLabel[note.source_type] || note.source_type}
                    </span>
                    <div className="text-xs font-medium text-gray-900 leading-snug mb-1 line-clamp-2">{note.title}</div>
                    <div className="text-xs text-gray-300">{formatDate(note.created_at)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
