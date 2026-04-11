"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Supabase 通过 URL hash 中的 access_token 自动恢复 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        setStatus("error");
        setMessage("链接无效或已过期，请重新申请重置密码");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("密码至少需要6位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("两次输入的密码不一致");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setStatus("error");
        setMessage("重置失败，请重新申请重置链接");
      } else {
        setStatus("success");
        setMessage("密码已重置，即将跳转...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch {
      setStatus("error");
      setMessage("网络异常，请检查网络连接后重试");
    }
  };

  return (
    <div
      className="min-h-screen bg-white text-gray-900"
      style={{ fontFamily: "'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif" }}
    >
      {/* 导航 */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
          悟流 WuFlow
        </Link>
      </nav>

      {/* 表单区域 */}
      <div className="max-w-sm mx-auto px-6 py-20">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">重置密码</h1>
          <p className="text-sm text-gray-400">请输入你的新密码</p>
        </div>

        {/* 链接无效时仅显示错误 */}
        {!ready && status === "error" ? (
          <div className="space-y-4">
            <div className="rounded-lg px-4 py-3 text-sm bg-red-50 border border-red-100 text-red-600">
              {message}
            </div>
            <div className="text-center text-sm text-gray-400">
              <Link href="/login" className="text-gray-900 hover:underline font-medium">
                ← 返回登录
              </Link>
            </div>
          </div>
        ) : ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setStatus("idle"); setMessage(""); }}
                placeholder="至少6位"
                required
                minLength={6}
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setStatus("idle"); setMessage(""); }}
                placeholder="再次输入新密码"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {message && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  status === "success"
                    ? "bg-green-50 border border-green-100 text-green-700"
                    : "bg-red-50 border border-red-100 text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === "loading" ? "重置中..." : "确认重置 →"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
