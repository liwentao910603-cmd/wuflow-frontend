"use client";
import { useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function CheckinModal({ onClose, onSuccess, token }: { onClose: () => void; onSuccess: () => void; token: string }) {
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState(30);
  const [mood, setMood] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/study/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, duration_minutes: duration, mood, note_tags: [] }),
      });
      onSuccess();
    } catch {} finally { setSubmitting(false); }
  };

  const moods = ["😩","😕","😊","😄","🚀"];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: '0 0 24px' }}>今天学了什么？ 📝</h3>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 8 }}>学习内容</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="简单记录一下今天学了什么..."
            autoFocus
            style={{ width: '100%', minHeight: 80, border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, lineHeight: 1.6, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 8 }}>学习时长（分钟）</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[15, 30, 60, 90].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: `1px solid ${duration === d ? '#111' : '#e5e7eb'}`, background: duration === d ? '#111' : '#fff', color: duration === d ? '#fff' : '#666', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 8 }}>今天状态</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {moods.map((m, i) => (
                <button key={i} onClick={() => setMood(i + 1)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: `1px solid ${mood === i+1 ? '#111' : '#e5e7eb'}`, background: mood === i+1 ? '#f5f5f5' : '#fff', fontSize: 16, cursor: 'pointer' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#666', fontSize: 13, cursor: 'pointer' }}>取消</button>
          <button onClick={handleSubmit} disabled={!content.trim() || submitting}
            style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: content.trim() ? '#111' : '#e5e7eb', color: content.trim() ? '#fff' : '#999', fontSize: 13, fontWeight: 500, cursor: content.trim() ? 'pointer' : 'not-allowed' }}>
            {submitting ? '提交中...' : '打卡 ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
