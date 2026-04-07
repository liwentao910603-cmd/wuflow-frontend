"use client";
import { useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function CheckinModal({ onClose, onSuccess, token }: { onClose: () => void; onSuccess: () => void; token: string }) {
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState(30);
  const [mood, setMood] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await fetch(`${API}/study/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, duration_minutes: duration, mood, note_tags: [] }),
      });
      onSuccess();
    } catch {
      setSubmitError("提交失败，请重试");
    } finally { setSubmitting(false); }
  };

  const moods = ["😩","😕","😊","😄","🚀"];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px', width: 440, boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'rgba(0,0,0,0.87)', margin: '0 0 24px' }}>今天学了什么？ 📝</h3>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 8 }}>学习内容</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="简单记录一下今天学了什么..."
            autoFocus
            style={{ width: '100%', minHeight: 80, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: '10px 12px', fontSize: 14, lineHeight: 1.6, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 8 }}>学习时长（分钟）</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[15, 30, 60, 90].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: `1px solid ${duration === d ? '#111' : 'rgba(0,0,0,0.08)'}`, background: duration === d ? '#111' : '#fff', color: duration === d ? '#fff' : '#6b6b6b', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 8 }}>今天状态</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {moods.map((m, i) => (
                <button key={i} onClick={() => setMood(i + 1)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: `1px solid ${mood === i+1 ? '#111' : 'rgba(0,0,0,0.08)'}`, background: mood === i+1 ? '#f7f6f3' : '#fff', fontSize: 16, cursor: 'pointer' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {submitError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#dc2626' }}>
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', color: '#6b6b6b', fontSize: 13, cursor: 'pointer' }}>取消</button>
          <button onClick={handleSubmit} disabled={!content.trim() || submitting}
            style={{ flex: 2, padding: '11px', borderRadius: 6, border: 'none', background: content.trim() ? '#111' : 'rgba(0,0,0,0.08)', color: content.trim() ? '#fff' : '#a0a0a0', fontSize: 13, fontWeight: 500, cursor: content.trim() ? 'pointer' : 'not-allowed' }}>
            {submitting ? '提交中...' : '打卡 ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
