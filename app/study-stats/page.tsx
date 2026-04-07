"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCache, setCache } from "@/lib/cache";
import Sidebar from "@/components/Sidebar";

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

interface StudyLog {
  id: string;
  content: string;
  duration_minutes: number;
  mood: number;
  logged_date: string;
  created_at: string;
}

const MOOD_EMOJI = ["", "😩", "😕", "😊", "😄", "🚀"];
const MOOD_LABEL = ["", "很差", "较差", "一般", "不错", "超棒"];

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// 热力图组件
function Heatmap({ data }: { data: Record<string, number> }) {
  const today = new Date();
  const days: { date: string; minutes: number }[] = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, minutes: data[key] || 0 });
  }

  const maxMinutes = Math.max(...days.map(d => d.minutes), 1);

  const getColor = (minutes: number) => {
    if (minutes === 0) return "#f1f0ed";
    const intensity = minutes / maxMinutes;
    if (intensity < 0.25) return "#c7d2fe";
    if (intensity < 0.5) return "#818cf8";
    if (intensity < 0.75) return "#6366f1";
    return "#4338ca";
  };

  // 按周分组
  const weeks: typeof days[] = [];
  let week: typeof days = [];
  const firstDay = new Date(days[0].date).getDay();
  for (let i = 0; i < firstDay; i++) week.push({ date: "", minutes: 0 });
  for (const day of days) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) weeks.push(week);

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, wi) => {
    w.forEach(d => {
      if (!d.date) return;
      const m = new Date(d.date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: `${m + 1}月`, col: wi });
        lastMonth = m;
      }
    });
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ position: "relative", paddingTop: 20, display: "inline-block" }}>
        {/* 月份标签 */}
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0 }}>
          {monthLabels.map((m, i) => (
            <div key={i} style={{ position: "absolute", left: m.col * 14, fontSize: 11, color: "#bbb" }}>
              {m.label}
            </div>
          ))}
        </div>
        {/* 格子 */}
        <div style={{ display: "flex", gap: 2 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day.date ? `${day.date}：${day.minutes} 分钟` : ""}
                  style={{
                    width: 12, height: 12, borderRadius: 2,
                    background: day.date ? getColor(day.minutes) : "transparent",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        {/* 图例 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: "#bbb" }}>少</span>
          {["#f1f0ed", "#c7d2fe", "#818cf8", "#6366f1", "#4338ca"].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
          ))}
          <span style={{ fontSize: 11, color: "#bbb" }}>多</span>
        </div>
      </div>
    </div>
  );
}

export default function StudyStatsPage() {
  const [userEmail, setUserEmail] = useState("");
  const [stats, setStats] = useState({ week_hours: 0, streak_days: 0, logged_today: false });
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? "");
      fetchAll(session.access_token);
    });
  }, []);

  const fetchAll = async (token: string) => {
    const h = { Authorization: `Bearer ${token}` };
    try {
      const cachedHeatmap = getCache('stats:heatmap') as Record<string, number> | null;
      const cachedLogs = getCache('stats:logs') as StudyLog[] | null;

      if (cachedHeatmap && cachedLogs) {
        // heatmap + logs 命中缓存，仅刷新 stats
        const statsRes = await fetch(`${API}/study/stats`, { headers: h });
        const statsData = await statsRes.json();
        setStats(statsData);
        setHeatmap(cachedHeatmap);
        setLogs(cachedLogs);
        setTotalDays(Object.keys(cachedHeatmap).filter(k => cachedHeatmap[k] > 0).length);
        setTotalMinutes(cachedLogs.reduce((sum, l) => sum + l.duration_minutes, 0));
      } else {
        const [statsRes, heatmapRes, historyRes] = await Promise.all([
          fetch(`${API}/study/stats`, { headers: h }),
          fetch(`${API}/study/heatmap`, { headers: h }),
          fetch(`${API}/study/history`, { headers: h }),
        ]);
        const [statsData, heatmapData, historyData] = await Promise.all([
          statsRes.json(), heatmapRes.json(), historyRes.json(),
        ]);

        setStats(statsData);
        setHeatmap(heatmapData.heatmap || {});
        setLogs(historyData.logs || []);

        const hm = heatmapData.heatmap || {};
        setTotalDays(Object.keys(hm).filter(k => hm[k] > 0).length);
        const allLogs = historyData.logs || [];
        setTotalMinutes(allLogs.reduce((sum: number, l: StudyLog) => sum + l.duration_minutes, 0));

        setCache('stats:heatmap', hm);
        setCache('stats:logs', allLogs);
      }
    } catch {
      setLoadError(true);
    }
    setLoading(false);
  };

  const statCards = [
    { label: "连续打卡", value: stats.streak_days, unit: "天", icon: "🔥" },
    { label: "本周学习", value: stats.week_hours, unit: "小时", icon: "⏱️" },
    { label: "累计打卡", value: totalDays, unit: "天", icon: "📅" },
    { label: "累计时长", value: Math.round(totalMinutes / 60 * 10) / 10, unit: "小时", icon: "📚" },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter','Noto Sans SC','PingFang SC',sans-serif" }}>
      <Sidebar userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto" style={{ background: "#ffffff" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 32px" }}>

          {/* 标题 */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: "rgba(0,0,0,0.87)", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              学习统计 📊
            </h1>
            <p style={{ fontSize: 14, color: "#6b6b6b", margin: 0 }}>
              {loading ? "加载中..." : loadError ? "数据加载失败，请刷新" : `共打卡 ${totalDays} 天，累计学习 ${Math.round(totalMinutes / 60 * 10) / 10} 小时`}
            </p>
          </div>

          {/* 加载失败提示 */}
          {loadError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '20px', marginBottom: 24, textAlign: 'center', fontSize: 14, color: '#dc2626' }}>
              数据加载失败，请刷新页面重试
            </div>
          )}

          {/* 统计卡片 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 32 }}>
            {statCards.map((s, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 600, color: s.value === 0 ? "#a0a0a0" : "rgba(0,0,0,0.87)", letterSpacing: "-1px" }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: 13, color: "#a0a0a0" }}>{s.unit}</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b6b6b" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 热力图 */}
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "24px 28px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b6b6b", marginBottom: 16, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              过去 90 天学习热力图
            </div>
            {loading ? (
              <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a0", fontSize: 13 }}>加载中...</div>
            ) : (
              <Heatmap data={heatmap} />
            )}
          </div>

          {/* 打卡历史 */}
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b6b6b", marginBottom: 20, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              打卡历史
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#a0a0a0", fontSize: 13 }}>加载中...</div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 14, color: "#a0a0a0" }}>还没有打卡记录</div>
                <div style={{ fontSize: 13, color: "#a0a0a0", marginTop: 6 }}>回到主页完成第一次打卡</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {logs.map((log, i) => (
                  <div key={log.id}>
                    {(i === 0 || logs[i - 1].logged_date !== log.logged_date) && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#a0a0a0", padding: "12px 0 8px", letterSpacing: "0.5px" }}>
                        {formatDate(log.logged_date)}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{MOOD_EMOJI[log.mood]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.87)", margin: "0 0 6px", lineHeight: 1.6 }}>{log.content}</p>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#a0a0a0" }}>⏱ {log.duration_minutes} 分钟</span>
                          <span style={{ fontSize: 12, color: "#a0a0a0" }}>状态：{MOOD_LABEL[log.mood]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
