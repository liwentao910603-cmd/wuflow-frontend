"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface SidebarProps {
  userEmail?: string;
}

export default function Sidebar({ userEmail = "" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navItems = [
    { href: "/dashboard", label: "主页", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    )},
    { href: "/ingest", label: "整理资料", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    )},
    { href: "/notes", label: "知识库", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    )},
    { href: "/qa", label: "AI 问答", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )},
  ];

  const learnItems: { href: string; label: string; disabled?: boolean; icon: React.ReactNode }[] = [
    { href: "/review", label: "复习提醒", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    )},
    { href: "/study-stats", label: "学习统计", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    )},
  ];

  const displayName = userEmail.split("@")[0] || "用户";

  return (
    <aside
      style={{ width: collapsed ? 52 : 220, flexShrink: 0, background: '#ffffff', borderRight: '1px solid rgba(0,0,0,0.08)', fontFamily: "'Inter','Noto Sans SC','PingFang SC',sans-serif" }}
      className="flex flex-col h-screen sticky top-0 transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className="h-11 flex items-center px-2 gap-2 flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0" style={{ background: '#f1f0ed', color: 'rgba(0,0,0,0.87)' }}>悟</div>
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">WuFlow</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-2 h-9 rounded-md text-sm mb-0.5 transition-colors whitespace-nowrap ${
              pathname === item.href
                ? "bg-white text-gray-900 font-medium"
                : "text-gray-500 hover:bg-white hover:text-gray-900"
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="overflow-hidden text-ellipsis">{item.label}</span>}
          </Link>
        ))}

        <div className="h-px my-1.5" style={{ background: 'rgba(0,0,0,0.08)' }} />
        {!collapsed && <div className="text-xs text-gray-400 px-2 pb-1 pt-0.5 tracking-wide font-medium">学习</div>}

        {learnItems.map((item) =>
          item.disabled ? (
            <div
              key={item.label}
              title="即将上线"
              className={`flex items-center gap-2 px-2 h-9 rounded-md text-sm mb-0.5 whitespace-nowrap cursor-not-allowed select-none ${
                collapsed ? "justify-center px-0" : ""
              }`}
              style={{ color: '#d1d5db' }}
            >
              <span className="flex-shrink-0" style={{ opacity: 0.5 }}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 overflow-hidden text-ellipsis">{item.label}</span>
                  <span style={{ fontSize: 10, background: '#f3f4f6', color: '#9ca3af', padding: '1px 6px', borderRadius: 99, flexShrink: 0, fontWeight: 500 }}>即将上线</span>
                </>
              )}
            </div>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 px-2 h-9 rounded-md text-sm mb-0.5 transition-colors whitespace-nowrap ${
                pathname === item.href
                  ? "bg-white text-gray-900 font-medium"
                  : "text-gray-500 hover:bg-white hover:text-gray-900"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="overflow-hidden text-ellipsis">{item.label}</span>}
            </Link>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-2 py-1.5 relative" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} ref={menuRef}>
        {/* 用户菜单弹窗 */}
        {menuOpen && (
          <div className="bg-white rounded-xl py-1.5 z-50 w-52" style={{ position: 'fixed', bottom: '60px', left: collapsed ? '60px' : '228px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-3 py-2 mb-1" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="text-sm font-medium" style={{ color: 'rgba(0,0,0,0.87)' }}>{displayName}</div>
              <div className="text-xs mt-0.5" style={{ color: '#a0a0a0' }}>{userEmail}</div>
              <span className="inline-block mt-1.5 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">免费版</span>
            </div>
            <button className="w-full flex items-center gap-2 px-3 h-9 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-md mx-auto transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              账户设置
            </button>
            <button className="w-full flex items-center gap-2 px-3 h-9 text-sm text-amber-700 hover:bg-amber-50 rounded-md transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              升级到 Pro ✦
            </button>
            <div className="h-px my-1" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 h-9 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              退出登录
            </button>
          </div>
        )}

        {/* 意见反馈 */}
        <button className={`w-full flex items-center gap-2 px-2 h-8 rounded-md text-xs text-gray-400 hover:bg-white hover:text-gray-500 transition-colors mb-1 ${collapsed ? "justify-center px-0" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          {!collapsed && <span>意见反馈</span>}
        </button>

        {/* 用户行 */}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className={`w-full flex items-center gap-2 px-2 h-10 rounded-md hover:bg-white transition-colors ${collapsed ? "justify-center px-0" : ""}`}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0" style={{ background: '#f1f0ed', color: 'rgba(0,0,0,0.87)' }}>
            {displayName.charAt(0)}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-medium text-gray-900 truncate">{displayName}</div>
                <div className="text-xs text-gray-400 truncate">{userEmail}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 text-gray-400"><polyline points="18 15 12 9 6 15"/></svg>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
