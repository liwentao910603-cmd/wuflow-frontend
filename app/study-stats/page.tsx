"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCache, setCache } from "@/lib/cache";
import Sidebar from "@/components/Sidebar";

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

interface RadarPoint {
  tag: string;
  avg_score: number;
  count: number;
}

interface WeakNote {
  note_id: string;
  title: string;
  score: number;
}

interface WeakSpot {
  tag: string;
  avg_score: number;
  count: number;
  notes: WeakNote[];
}

interface BlindSpotsData {
  has_enough_data: boolean;
  radar_data: RadarPoint[];
  weak_spots: WeakSpot[];
}

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
    if (minutes === 0) return "#ebedf0";
    const intensity = minutes / maxMinutes;
    if (intensity < 0.25) return "#c6e48b";
    if (intensity < 0.5) return "#7bc96f";
    if (intensity < 0.75) return "#239a3b";
    return "#196127";
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
            <div key={i} style={{ position: "absolute", left: m.col * 17, fontSize: 11, color: "#bbb" }}>
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
                  title={day.date ? (() => { const d = new Date(day.date); return `${d.getMonth()+1}月${d.getDate()}日 · 学习${day.minutes}分钟`; })() : ""}
                  style={{
                    width: 15, height: 15, borderRadius: 3,
                    background: day.date ? getColor(day.minutes) : "transparent",
                    cursor: day.date && day.minutes > 0 ? "pointer" : "default",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        {/* 图例 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: "#bbb" }}>少</span>
          {["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"].map((c, i) => (
            <div key={i} style={{ width: 15, height: 15, borderRadius: 3, background: c }} />
          ))}
          <span style={{ fontSize: 11, color: "#bbb" }}>多</span>
        </div>
      </div>
    </div>
  );
}

// 雷达图组件（纯 SVG）
function RadarChart({ data }: { data: RadarPoint[] }) {
  const dims = data.slice(0, 8);
  const N = dims.length;
  if (N < 3) return <p style={{ fontSize: 13, color: "#a0a0a0", textAlign: "center", padding: "20px 0" }}>数据维度不足，暂无雷达图</p>;

  const cx = 160, cy = 160, R = 110, labelR = 148, layers = 5;

  const getPoint = (r: number, i: number): [number, number] => {
    const angle = (2 * Math.PI * i / N) - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const toPath = (pts: [number, number][]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ") + " Z";

  const ringPaths = Array.from({ length: layers }, (_, k) =>
    toPath(dims.map((_, i) => getPoint(R * (k + 1) / layers, i)))
  );

  const dataPath = toPath(dims.map((d, i) => getPoint(R * Math.min(d.avg_score, 5) / 5, i)));

  return (
    <svg width="320" height="320" viewBox="0 0 320 320" style={{ display: "block", margin: "0 auto" }}>
      {/* 同心多边形背景 */}
      {ringPaths.map((d, k) => (
        <path key={k} d={d} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}

      {/* 轴线 */}
      {dims.map((_, i) => {
        const [x, y] = getPoint(R, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
      })}

      {/* 数据多边形 */}
      <path d={dataPath} fill="rgba(0,229,160,0.18)" stroke="#00C896" strokeWidth="2" strokeLinejoin="round" />

      {/* 数据顶点 */}
      {dims.map((d, i) => {
        const [x, y] = getPoint(R * Math.min(d.avg_score, 5) / 5, i);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="#00C896" stroke="#fff" strokeWidth="1.5" />;
      })}

      {/* 刻度数字（沿第一轴） */}
      {[1, 2, 3, 4, 5].map(v => {
        const [x, y] = getPoint(R * v / 5, 0);
        return <text key={v} x={x + 4} y={y + 3} fontSize="9" fill="#c0c0c0">{v}</text>;
      })}

      {/* 维度标签 */}
      {dims.map((d, i) => {
        const angle = (2 * Math.PI * i / N) - Math.PI / 2;
        const [x, y] = getPoint(labelR, i);
        const cosA = Math.cos(angle);
        const anchor = cosA > 0.15 ? "start" : cosA < -0.15 ? "end" : "middle";
        const label = d.tag.length > 7 ? d.tag.slice(0, 7) + "…" : d.tag;
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="11" fill="#6b6b6b" fontWeight="500">
            {label}
          </text>
        );
      })}
    </svg>
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
  const [blindSpots, setBlindSpots] = useState<BlindSpotsData | null>(null);
  const [blindSpotsLoading, setBlindSpotsLoading] = useState(true);

  const fetchAll = useCallback(async (token: string) => {
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

    // 盲点诊断（独立请求，不阻塞主内容）
    try {
      const bsRes = await fetch(`${API}/diagnostics/blind-spots`, { headers: h });
      if (bsRes.ok) {
        const bsData = await bsRes.json();
        setBlindSpots(bsData);
      }
    } catch {
      // 静默失败
    } finally {
      setBlindSpotsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? "");
      fetchAll(session.access_token);
    });
  }, [fetchAll]);

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

          {/* ── 知识雷达 ────────────────────────────────── */}
          <section style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b6b6b", marginBottom: 16, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              📊 知识雷达
            </div>

            {/* 骨架屏 */}
            {blindSpotsLoading && (
              <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "40px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ width: 220, height: 220, borderRadius: "50%", background: "#f1f0ed" }} />
                <div style={{ width: 160, height: 12, borderRadius: 6, background: "#f1f0ed" }} />
                <div style={{ width: 120, height: 12, borderRadius: 6, background: "#f1f0ed" }} />
              </div>
            )}

            {/* 数据不足提示 */}
            {!blindSpotsLoading && blindSpots && !blindSpots.has_enough_data && (
              <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "36px 28px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
                <div style={{ fontSize: 14, color: "#6b6b6b" }}>复习数据积累中</div>
                <div style={{ fontSize: 13, color: "#a0a0a0", marginTop: 6 }}>完成 5 次以上复习后查看知识雷达图</div>
              </div>
            )}

            {/* 雷达图 + 薄弱点 */}
            {!blindSpotsLoading && blindSpots?.has_enough_data && (
              <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)" }}>

                {/* 雷达图 */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                  <RadarChart data={blindSpots.radar_data || []} />
                </div>

                {/* 分隔线 */}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginBottom: 24 }} />

                {/* 薄弱点列表 */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#6b6b6b", marginBottom: 16, letterSpacing: "0.3px" }}>
                    需要加强
                  </div>

                  {!blindSpots.weak_spots || blindSpots.weak_spots.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "16px 0", fontSize: 14, color: "#a0a0a0" }}>
                      🎉 暂无明显薄弱点，继续保持！
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {blindSpots.weak_spots.map((ws, i) => (
                        <div key={i} style={{ padding: "16px", background: "#fafafa", borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)" }}>
                          {/* tag + 分数 + 次数 */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "2px 10px", borderRadius: 99 }}>
                              {ws.tag}
                            </span>
                            <span style={{ fontSize: 13, color: "#6b6b6b" }}>
                              ⭐ {ws.avg_score.toFixed(1)} / 5
                            </span>
                            <span style={{ fontSize: 12, color: "#a0a0a0" }}>
                              复习 {ws.count} 次
                            </span>
                          </div>

                          {/* 低分笔记列表 */}
                          {ws.notes && ws.notes.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {ws.notes.slice(0, 3).map((n, j) => (
                                <button
                                  key={j}
                                  onClick={() => { window.location.href = `/notes/${n.note_id}`; }}
                                  style={{ textAlign: "left", background: "none", border: "none", padding: "3px 0", cursor: "pointer", fontSize: 13, color: "#4338ca", textDecoration: "underline", textUnderlineOffset: 2, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                >
                                  {n.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
