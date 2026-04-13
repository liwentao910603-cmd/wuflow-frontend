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

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  cover_image: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

interface PostForm {
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string;
  status: "draft" | "published";
}

const EMPTY_FORM: PostForm = {
  slug: "", title: "", summary: "", content: "", tags: "", status: "draft",
};

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

function StatCard({ icon, label, value, unit, large }: {
  icon: string; label: string; value: number | string; unit?: string; large?: boolean;
}) {
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

  // Blog state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null); // null = new post
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fetchBlogPosts = useCallback(async (pw: string) => {
    setBlogLoading(true);
    try {
      const res = await fetch(`${API}/blog/admin/posts`, {
        headers: { "X-Admin-Password": pw },
      });
      if (res.ok) {
        const data = await res.json();
        setBlogPosts(data.posts || []);
      }
    } catch {
      // 静默失败，不影响其他功能
    } finally {
      setBlogLoading(false);
    }
  }, []);

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

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setStoredPw(saved);
      setAuthed(true);
      fetchData(saved);
      fetchBlogPosts(saved);
      intervalRef.current = setInterval(() => fetchData(saved), 30000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData, fetchBlogPosts]);

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
      const fbRes = await fetch(`${API}/admin/feedback`, {
        headers: { "X-Admin-Password": password },
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        const list: Feedback[] = Array.isArray(fbData) ? fbData : (fbData.feedbacks || []);
        setFeedbacks(list);
      }
      fetchBlogPosts(password);
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
    setBlogPosts([]);
    setLastUpdated("");
    setPassword("");
  };

  const openNewPost = () => {
    setEditSlug(null);
    setForm(EMPTY_FORM);
    setSaveError("");
    setShowEditor(true);
  };

  const openEditPost = async (slug: string) => {
    setEditSlug(slug);
    setForm(EMPTY_FORM);
    setSaveError("");
    setFormLoading(true);
    setShowEditor(true);
    try {
      const res = await fetch(`${API}/blog/admin/posts/${slug}`, {
        headers: { "X-Admin-Password": storedPw },
      });
      if (res.ok) {
        const post = await res.json();
        setForm({
          slug: post.slug,
          title: post.title,
          summary: post.summary || "",
          content: post.content || "",
          tags: (post.tags || []).join(", "),
          status: post.status,
        });
      }
    } catch {
      setSaveError("加载文章内容失败");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title.trim()) {
      setSaveError("slug 和标题为必填项");
      return;
    }
    setSaving(true);
    setSaveError("");
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      status: form.status,
    };
    try {
      const isNew = editSlug === null;
      const url = isNew ? `${API}/blog/posts` : `${API}/blog/posts/${editSlug}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError((err as { detail?: string }).detail || "保存失败");
        return;
      }
      setShowEditor(false);
      fetchBlogPosts(storedPw);
    } catch {
      setSaveError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`确认删除文章「${title}」？此操作不可恢复。`)) return;
    setDeletingSlug(slug);
    try {
      await fetch(`${API}/blog/posts/${slug}`, {
        method: "DELETE",
        headers: { "X-Admin-Password": storedPw },
      });
      setBlogPosts(prev => prev.filter(p => p.slug !== slug));
    } catch {
      // 失败静默处理
    } finally {
      setDeletingSlug(null);
    }
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
            <button onClick={() => { fetchData(storedPw); fetchBlogPosts(storedPw); }} disabled={dataLoading}
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
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "24px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
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

        {/* 博客管理 */}
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "rgba(0,0,0,0.87)", margin: 0 }}>博客管理</h2>
            <button
              onClick={openNewPost}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#111", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              + 新文章
            </button>
          </div>
          {/* ── 内联编辑器 ── */}
          {showEditor && (
            <div style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(0,0,0,0.87)" }}>
                  {editSlug === null ? "新文章" : `编辑：${editSlug}`}
                </span>
                <button onClick={() => setShowEditor(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#a0a0a0", cursor: "pointer", lineHeight: 1 }}>✕</button>
              </div>

              {formLoading ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#a0a0a0", fontSize: 13 }}>加载中...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* slug + status */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                        Slug <span style={{ color: "#dc2626" }}>*</span>
                      </span>
                      <input
                        value={form.slug}
                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                        placeholder="my-article-slug"
                        disabled={editSlug !== null}
                        style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7, padding: "8px 11px", fontSize: 13, outline: "none", background: editSlug !== null ? "#f1f5f9" : "#fff", color: editSlug !== null ? "#a0a0a0" : "inherit" }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.3px" }}>状态</span>
                      <select
                        value={form.status}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value as "draft" | "published" }))}
                        style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7, padding: "8px 11px", fontSize: 13, outline: "none", background: "#fff", cursor: "pointer" }}
                      >
                        <option value="draft">草稿</option>
                        <option value="published">已发布</option>
                      </select>
                    </label>
                  </div>

                  {/* title */}
                  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      标题 <span style={{ color: "#dc2626" }}>*</span>
                    </span>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="文章标题"
                      style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7, padding: "8px 11px", fontSize: 14, outline: "none", background: "#fff" }}
                    />
                  </label>

                  {/* summary */}
                  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.3px" }}>摘要</span>
                    <textarea
                      value={form.summary}
                      onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                      placeholder="150 字以内的摘要"
                      rows={3}
                      style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7, padding: "8px 11px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", background: "#fff" }}
                    />
                  </label>

                  {/* tags */}
                  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      Tags <span style={{ fontSize: 11, color: "#a0a0a0", fontWeight: 400, textTransform: "none" }}>逗号分隔</span>
                    </span>
                    <input
                      value={form.tags}
                      onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="学习方法, AI, 知识管理"
                      style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7, padding: "8px 11px", fontSize: 13, outline: "none", background: "#fff" }}
                    />
                  </label>

                  {/* content */}
                  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      正文 <span style={{ fontSize: 11, color: "#a0a0a0", fontWeight: 400, textTransform: "none" }}>Markdown</span>
                    </span>
                    <textarea
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder={"## 标题\n\n正文内容..."}
                      rows={20}
                      style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7, padding: "8px 11px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "monospace", lineHeight: 1.6, background: "#fff" }}
                    />
                  </label>

                  {saveError && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "9px 13px", fontSize: 13, color: "#dc2626" }}>
                      {saveError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setShowEditor(false)}
                      style={{ padding: "9px 18px", borderRadius: 7, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: 13, color: "#6b6b6b", cursor: "pointer" }}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{ padding: "9px 22px", borderRadius: 7, border: "none", background: saving ? "rgba(0,0,0,0.08)" : "#111", color: saving ? "#a0a0a0" : "#fff", fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer" }}
                    >
                      {saving ? "保存中..." : "保存"}
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

          {blogLoading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#a0a0a0", fontSize: 13 }}>加载中...</div>
          ) : blogPosts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#a0a0a0", fontSize: 13 }}>暂无文章，点击「+ 新文章」创建</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    {["标题", "状态", "发布时间", "操作"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#6b6b6b", fontSize: 11, letterSpacing: "0.3px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blogPosts.map(post => (
                    <tr key={post.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <td style={{ padding: "12px 12px" }}>
                        <button
                          onClick={() => openEditPost(post.slug)}
                          style={{ background: "none", border: "none", padding: 0, fontSize: 13, color: "rgba(0,0,0,0.87)", fontWeight: 500, cursor: "pointer", textAlign: "left" }}
                        >
                          {post.title}
                        </button>
                        <div style={{ fontSize: 11, color: "#a0a0a0", marginTop: 2 }}>{post.slug}</div>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
                          background: post.status === "published" ? "#f0fdf4" : "#f8fafc",
                          color: post.status === "published" ? "#16a34a" : "#6b7280",
                        }}>
                          {post.status === "published" ? "已发布" : "草稿"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", color: "#6b6b6b", whiteSpace: "nowrap" }}>
                        {post.published_at ? formatDate(post.published_at) : "—"}
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => openEditPost(post.slug)}
                            style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: 12, color: "#6b6b6b", cursor: "pointer" }}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(post.slug, post.title)}
                            disabled={deletingSlug === post.slug}
                            style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#fee2e2", fontSize: 12, color: "#dc2626", cursor: deletingSlug === post.slug ? "not-allowed" : "pointer" }}
                          >
                            {deletingSlug === post.slug ? "删除中" : "删除"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
