"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function ResetPasswordPage() {
  // null = 等待中，true = token 有效，false = 链接无效
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    // 2. 监听 onAuthStateChange，等待 PASSWORD_RECOVERY 事件
    //    Supabase JS SDK 会自动解析 URL hash 并触发该事件
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (timer) clearTimeout(timer);
        setIsValidToken(true);
      }
    });

    const init = async () => {
      // 1. 先检查 query params 是否有 error（Supabase 在链接过期/无效时会附加）
      const searchParams = new URLSearchParams(window.location.search);
      const urlError = searchParams.get("error_description") || searchParams.get("error");
      if (urlError) {
        setIsValidToken(false);
        setMessage(decodeURIComponent(urlError));
        return;
      }

      // 3. 兜底：手动解析 hash，处理 SDK 未自动触发的情况
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (type === "recovery" && accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          if (error) {
            // setSession 失败，若 onAuthStateChange 尚未触发则标记无效
            setIsValidToken((prev) => (prev === true ? true : false));
          }
        } else {
          // hash 存在但不是 recovery，3 秒后仍未收到事件则无效
          timer = setTimeout(() => setIsValidToken((prev) => (prev === true ? true : false)), 3000);
        }
      } else {
        // 无 hash 无 error，等待 onAuthStateChange 3 秒超时后降级
        timer = setTimeout(() => setIsValidToken((prev) => (prev === true ? true : false)), 3000);
      }
    };

    init();

    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
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
        let msg = "重置失败，请重新申请重置链接";
        if (error.message.includes("same password") || error.message.includes("different")) {
          msg = "新密码不能与原密码相同，请换一个密码";
        } else if (error.message.includes("weak") || error.message.includes("characters")) {
          msg = "密码强度不够，请使用至少6位字符";
        }
        setMessage(msg);
        return;
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

        {/* 等待 token 验证 */}
        {isValidToken === null ? (
          <div className="text-center text-sm text-gray-400">验证链接中...</div>
        ) : isValidToken === false ? (
          <div className="space-y-4">
            <div className="rounded-lg px-4 py-3 text-sm bg-red-50 border border-red-100 text-red-600">
              {message || "链接无效或已过期，请重新申请重置密码"}
            </div>
            <div className="text-center text-sm text-gray-400">
              <Link href="/login" className="text-gray-900 hover:underline font-medium">
                ← 返回登录
              </Link>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
