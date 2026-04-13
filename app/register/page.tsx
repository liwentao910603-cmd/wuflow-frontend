"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("loading");
    setMessage("");

    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        setStatus("error");
        setMessage(
          signUpError.message.includes("already registered")
            ? "该邮箱已注册，请直接登录"
            : "注册失败，请稍后重试"
        );
        return;
      }

      // 注册成功后自动登录（未开启邮件验证）
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        setStatus("error");
        setMessage("注册成功，但自动登录失败，请前往登录页手动登录");
        return;
      }

      window.location.href = "/dashboard";
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">免费注册</h1>
          <p className="text-sm text-gray-400">创建账号，开始整理你的知识</p>
        </div>

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
            <label className="block text-sm text-gray-600 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setStatus("idle"); setMessage(""); }}
              placeholder="至少6位"
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {message && (
            <div className="rounded-lg px-4 py-3 text-sm bg-red-50 border border-red-100 text-red-600">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? "注册中..." : "注册并进入 →"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          已有账号？{" "}
          <Link href="/login" className="text-gray-900 hover:underline font-medium">
            直接登录
          </Link>
        </p>
      </div>
    </div>
  );
}
