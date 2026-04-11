"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;
const SESSION_KEY = "wf_admin_pw";

interface AdminStats {
  total_users: number;
  new_users_today: number;
  total_notes: number;
  active_users_7d: number;
  retention_7d: number;
  total_feedbacks: number;
}

interface Feedback {
  id: string;
  type: "bug" | "feature" | "other";
  content: string;
  email: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  bug:     { label: "🐛 Bug",   bg: "#fef2f2", color: "#dc2626" },
  feature: { label: "✨ 建议",  bg: "#f0fdf4", color: "#16a34a" },
  other:   { label: "💬 其他",  bg: "#f8fafc", color: "#6b7280" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function StatCard({ icon, label, value, unit, large }: { icon: string; label: string; value: number | string; unit?: string; large?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: large ? 36 : 28, fontWeight: 700, color: "rgba(0,0,0,0.87)", letterSpacing: "-1px" }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: "#a0a0a0" }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 12, color: "#6b6b6b" }}>{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authing, setAuthing] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [storedPw, setStoredPw] = useState("");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (pw: string) => {
    setDataLoading(true);
    setDataError("");
    const headers = { "X-Admin-Password": pw };
    try {
      const [statsRes, fbRes] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }),
        fetch(`${API}/admin/feedback`, { headers }),
      ]);
      if (!statsRes.ok) throw new Error("数据加载失败");
      const statsData: AdminStats = await statsRes.json();
      setStats(statsData);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        const list: Feedback[] = Array.isArray(fbData) ? fbData : (fbData.feedbacks || []);
        setFeedbacks(list);
      }
      setLastUpdated(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      setDataError("数据加载失败，请刷新重试");
    } finally {
      setDataLoading(false);
    }
  }, []);

  // 从 sessionStorage 恢复验证状态 + 启动 30s 自动刷新
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setStoredPw(saved);
      setAuthed(true);
      fetchData(saved);
      intervalRef.current = setInterval(() => fetchData(saved), 30000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const handleAuth = async () => {
    if (!password.trim()) return;
    setAuthing(true);
    setAuthError("");
    try {
      const res = await fetch(`${API}/admin/stats`, {
        headers: { "X-Admin-Password": password },
      });
      if (!res.ok) {
        setAuthError("密码错误");
        return;
      }
      const data: AdminStats = await res.json();
      sessionStorage.setItem(SESSION_KEY, password);
      setStoredPw(password);
      setStats(data);
      setAuthed(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => fetchData(password), 30000);
      // 单独拉反馈
      const fbRes = await fetch(`${API}/admin/feedback`, {
        headers: { "X-Admin-Password": password },
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        const list: Feedback[] = Array.isArray(fbData) ? fbData : (fbData.feedbacks || []);
        setFeedbacks(list);
      }
    } catch {
      setAuthError("请求失败，请检查网络");
    } finally {
      setAuthing(false);
    }
  };

  const handleLogout = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setStats(null);
    setFeedbacks([]);
    setLastUpdated("");
    setPassword("");
  };

  const s = { fontFamily: "'Inter','system-ui',sans-serif", minHeight: "100vh", background: "#f8fafc" };

  // ── 密码验证页 ────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "40px 36px", width: 360, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: "rgba(0,0,0,0.87)", margin: "0 0 4px" }}>WuFlow 运营后台</h1>
            <p style={{ fontSize: 13, color: "#a0a0a0", margin: 0 }}>请输入管理员密码</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setAuthError(""); }}
            onKeyDown={e => e.key === "Enter" && handleAuth()}
            placeholder="管理员密码"
            autoFocus
            style={{ width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
          />
          {authError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 13, color: "#dc2626" }}>
              {authError}
            </div>
          )}
          <button
            onClick={handleAuth}
            disabled={!password.trim() || authing}
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: password.trim() ? "#111" : "rgba(0,0,0,0.08)", color: password.trim() ? "#fff" : "#a0a0a0", fontSize: 14, fontWeight: 500, cursor: password.trim() ? "pointer" : "not-allowed" }}
          >
            {authing ? "验证中..." : "进入后台"}
          </button>
        </div>
      </div>
    );
  }

  // ── 后台主页 ──────────────────────────────────────────────
  return (
    <div style={s}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>

        {/* 顶栏 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(0,0,0,0.87)", margin: "0 0 2px" }}>WuFlow 运营后台</h1>
            <p style={{ fontSize: 13, color: "#a0a0a0", margin: 0 }}>
              每 30 秒自动刷新
              {lastUpdated && <span style={{ marginLeft: 8, color: "#10b981" }}>· 最后更新 {lastUpdated}</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => fetchData(storedPw)} disabled={dataLoading}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "#fff", fontSize: 13, color: "#6b6b6b", cursor: "pointer" }}>
              {dataLoading ? "刷新中..." : "🔄 刷新"}
            </button>
            <button onClick={handleLogout}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#fee2e2", fontSize: 13, color: "#dc2626", cursor: "pointer" }}>
              退出
            </button>
          </div>
        </div>

        {dataError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#dc2626" }}>
            {dataError}
          </div>
        )}

        {/* 第一行：4 个核心指标 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 14 }}>
          <StatCard icon="👥" label="总用户数" value={stats?.total_users ?? "—"} />
          <StatCard icon="🆕" label="今日新增" value={stats?.new_users_today ?? "—"} unit="人" />
          <StatCard icon="📝" label="总笔记数" value={stats?.total_notes ?? "—"} />
          <StatCard icon="🔥" label="7日活跃" value={stats?.active_users_7d ?? "—"} unit="人" />
        </div>

        {/* 第二行：留存率 + 反馈数 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <StatCard
            icon="📈"
            label="7日留存率"
            value={stats ? `${stats.retention_7d.toFixed(1)}%` : "—"}
            large
          />
          <StatCard icon="💬" label="总反馈数" value={stats?.total_feedbacks ?? "—"} />
        </div>

        {/* 运营预警 */}
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "24px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "rgba(0,0,0,0.87)", margin: "0 0 16px" }}>⚠️ 运营提醒</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
              <span style={{ fontSize: 18 }}>☁️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.87)" }}>阿里云 ECS 到期</div>
                <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>到期日期：<strong>2026年7月1日 15:00:00</strong></div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.87)" }}>DeepSeek API 余额</div>
                <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                  手动更新 ·{" "}
                  <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" style={{ color: "#16a34a" }}>
                    登录控制台查看 →
                  </a>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }}>
              <span style={{ fontSize: 18 }}>🗄️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.87)" }}>Supabase 免费额度</div>
                <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2 }}>
                  每月 500MB，请定期检查 ·{" "}
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>
                    前往 Dashboard →
                  </a>
                </div>
              </div>
            </div>

            {/* 域名到期 */}
            {[
              { domain: "wuflow.cn",     note: "主域名，到期日期：2027年3月21日" },
              { domain: "wuflow.top",    note: "备用域名，到期日期：2027年3月21日" },
              { domain: "api.wuflow.cn", note: "与 ECS 绑定，到期时间同 ECS（2026年7月1日）" },
            ].map(({ domain, note }) => (
              <div key={domain} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                <span style={{ fontSize: 18 }}>🌐</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.87)" }}>域名：{domain}</div>
                  <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>{note}</div>
                </div>
              </div>
            ))}

            {/* Vercel */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: 18 }}>▲</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.87)" }}>Vercel 免费计划</div>
                <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                  每月 100GB 带宽，目前用量极低，无需付费。关注时机：月活 &gt;1000 用户后检查用量。
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 最近反馈 */}
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "rgba(0,0,0,0.87)", margin: "0 0 16px" }}>最近反馈</h2>
          {dataLoading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#a0a0a0", fontSize: 13 }}>加载中...</div>
          ) : feedbacks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#a0a0a0", fontSize: 13 }}>暂无反馈</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    {["时间", "类型", "内容", "邮箱"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#6b6b6b", fontSize: 11, letterSpacing: "0.3px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((fb) => {
                    const t = TYPE_LABEL[fb.type] || TYPE_LABEL.other;
                    return (
                      <tr key={fb.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "12px 12px", color: "#6b6b6b", whiteSpace: "nowrap" }}>{formatDate(fb.created_at)}</td>
                        <td style={{ padding: "12px 12px" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: t.bg, color: t.color, fontWeight: 600 }}>
                            {t.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 12px", color: "rgba(0,0,0,0.87)", maxWidth: 500 }}>
                          <div title={fb.content} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "help" }}>
                            {fb.content.length > 100 ? fb.content.slice(0, 100) + "…" : fb.content}
                          </div>
                        </td>
                        <td style={{ padding: "12px 12px", color: "#6b6b6b" }}>{fb.email || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
