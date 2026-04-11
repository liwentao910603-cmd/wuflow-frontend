"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";

const supabase = createClient();

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("loading");
    setMessage("");

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setStatus("error");
          setMessage(
            error.message === "Invalid login credentials"
              ? "邮箱或密码错误"
              : "登录失败，请稍后重试"
          );
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          setStatus("error");
          setMessage("注册失败，请稍后重试");
        } else {
          setStatus("success");
          setMessage("注册成功！请检查邮箱，点击验证链接后即可登录。");
        }
      }
    } catch (e: unknown) {
      console.error("[login] 异常:", e);
      setStatus("error");
      setMessage("网络异常，请检查网络连接后重试");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://wuflow.cn/reset-password",
      });
      if (error) {
        setStatus("error");
        setMessage("发送失败，请确认邮箱是否正确");
      } else {
        setStatus("success");
        setMessage("重置链接已发送，请查收邮件");
      }
    } catch {
      setStatus("error");
      setMessage("网络异常，请检查网络连接后重试");
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setStatus("idle");
    setMessage("");
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {mode === "login" ? "登录" : mode === "signup" ? "注册" : "找回密码"}
          </h1>
          <p className="text-sm text-gray-400">
            {mode === "login"
              ? "登录后使用悟流的全部功能"
              : mode === "signup"
              ? "创建账号，开始整理你的知识"
              : "输入注册邮箱，我们将发送重置链接"}
          </p>
        </div>

        {/* 忘记密码表单 */}
        {mode === "forgot" ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setMessage(""); }}
                placeholder="you@example.com"
                required
                autoFocus
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
              {status === "loading" ? "发送中..." : "发送重置链接"}
            </button>

            <p className="text-center text-sm text-gray-400">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-gray-900 hover:underline font-medium"
              >
                ← 返回登录
              </button>
            </p>
          </form>
        ) : (
          /* 登录 / 注册表单 */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setMessage(""); }}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm text-gray-600">密码</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                  >
                    忘记密码？
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setStatus("idle"); setMessage(""); }}
                placeholder={mode === "signup" ? "至少6位" : "输入密码"}
                required
                minLength={mode === "signup" ? 6 : undefined}
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
              disabled={status === "loading"}
              className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === "loading"
                ? mode === "login" ? "登录中..." : "注册中..."
                : mode === "login" ? "登录 →" : "注册 →"}
            </button>
          </form>
        )}

        {/* 切换登录/注册 */}
        {mode !== "forgot" && (
          <p className="mt-6 text-center text-sm text-gray-400">
            {mode === "login" ? (
              <>
                还没有账号？{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-gray-900 hover:underline font-medium"
                >
                  注册
                </button>
              </>
            ) : (
              <>
                已有账号？{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="text-gray-900 hover:underline font-medium"
                >
                  登录
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
