"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;
const supabase = createClient();

interface ReviewItem {
  id: string;
  note_id: string;
  next_review_at: string;
  interval_days: number;
  repetition_count: number;
  mastery_level: number;
  notes: {
    id: string;
    title: string;
    summary: string;
  };
}

interface Question {
  type: string;
  question: string;
  answer: string;
}

type Stage =
  | "list"          // 今日待复习列表
  | "loading"       // AI 生成题目中
  | "answering"     // 逐题作答
  | "reviewing"     // 统一查看答案+自评
  | "done";         // 全部完成

export default function ReviewPage() {
  const [userEmail, setUserEmail] = useState("");
  const [token, setToken] = useState("");

  // 列表
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // 当前复习
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlanId, setCurrentPlanId] = useState("");
  const [currentNoteId, setCurrentNoteId] = useState("");
  const [currentNoteTitle, setCurrentNoteTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [stage, setStage] = useState<Stage>("list");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? "");
      setToken(session.access_token);
      fetchToday(session.access_token);
    });
  }, []);

  const fetchToday = async (t: string) => {
    setListLoading(true);
    try {
      const res = await fetch(`${API}/review/today`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
    setListLoading(false);
  };

  const startReview = async (item: ReviewItem, index: number) => {
    setCurrentIndex(index);
    setCurrentPlanId(item.id);
    setCurrentNoteId(item.note_id);
    setCurrentNoteTitle(item.notes?.title || "");
    setQuestions([]);
    setAnswers([]);
    setQuestionIndex(0);
    setStage("loading");

    try {
      const res = await fetch(`${API}/review/start/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setAnswers(new Array(data.questions?.length || 0).fill(""));
      setStage("answering");
    } catch {
      setStage("list");
    }
  };

  const handleAnswerChange = (val: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[questionIndex] = val;
      return next;
    });
  };

  const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(q => q + 1);
    } else {
      setStage("reviewing");
    }
  };

  const handleSubmit = async (selfRating: number) => {
    setSubmitting(true);
    try {
      await fetch(`${API}/review/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: currentPlanId,
          note_id: currentNoteId,
          questions,
          user_answer: answers.join("\n\n"),
          self_rating: selfRating,
        }),
      });

      // 还有下一篇
      if (currentIndex < items.length - 1) {
        setStage("list");
        // 标记当前已完成（从列表移除）
        setItems(prev => prev.filter((_, i) => i !== currentIndex));
      } else {
        setStage("done");
      }
    } catch {}
    setSubmitting(false);
  };

  const ratingOptions = [
    { value: 1, label: "没懂", emoji: "😅", desc: "完全不会，需要重新学", color: "#fee2e2", textColor: "#dc2626" },
    { value: 2, label: "还差一点", emoji: "🤔", desc: "大概知道但表达不清", color: "#fef9c3", textColor: "#ca8a04" },
    { value: 3, label: "懂了", emoji: "💪", desc: "完全理解，表达流畅", color: "#dcfce7", textColor: "#16a34a" },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter','Noto Sans SC','PingFang SC',sans-serif" }}>
      <Sidebar userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto" style={{ background: '#f9f9f8' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 32px' }}>

          {/* ── 列表页 ── */}
          {stage === "list" && (
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 26, fontWeight: 600, color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                  今日复习 📖
                </h1>
                <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
                  {listLoading ? "加载中..." : items.length === 0 ? "今天没有待复习的笔记" : `共 ${items.length} 篇笔记待复习`}
                </p>
              </div>

              {listLoading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#ccc', fontSize: 14 }}>加载中...</div>
              ) : items.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 8 }}>今日复习全部完成！</div>
                  <div style={{ fontSize: 14, color: '#999', marginBottom: 24 }}>继续保持，明天见</div>
                  <Link href="/notes" style={{ background: '#111', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                    去知识库添加更多笔记 →
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map((item, i) => (
                    <div key={item.id} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.notes?.title || "未知笔记"}
                        </div>
                        <div style={{ fontSize: 12, color: '#bbb' }}>
                          已复习 {item.repetition_count} 次 · 掌握度 {Math.round(item.mastery_level * 100)}%
                        </div>
                      </div>
                      <button
                        onClick={() => startReview(item, i)}
                        style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        开始复习 →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── 生成题目中 ── */}
          {stage === "loading" && (
            <div style={{ textAlign: 'center', padding: '120px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🤖</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#111', marginBottom: 8 }}>AI 正在出题...</div>
              <div style={{ fontSize: 13, color: '#999' }}>基于「{currentNoteTitle}」生成专属测试题</div>
            </div>
          )}

          {/* ── 逐题作答 ── */}
          {stage === "answering" && questions.length > 0 && (
            <>
              {/* 进度 */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#999' }}>
                    第 {questionIndex + 1} / {questions.length} 题
                  </span>
                  <span style={{ fontSize: 12, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                    {currentNoteTitle}
                  </span>
                </div>
                <div style={{ height: 4, background: '#f0f0f0', borderRadius: 99 }}>
                  <div style={{ height: '100%', background: '#111', borderRadius: 99, width: `${((questionIndex + 1) / questions.length) * 100}%`, transition: 'width .3s' }} />
                </div>
              </div>

              {/* 题目卡片 */}
              <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 16, padding: '32px', marginBottom: 16 }}>
                <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#888', background: '#f5f5f5', padding: '3px 10px', borderRadius: 99, marginBottom: 20, letterSpacing: '0.5px' }}>
                  {questions[questionIndex].type}
                </div>
                <p style={{ fontSize: 16, fontWeight: 500, color: '#111', lineHeight: 1.7, margin: '0 0 28px' }}>
                  {questions[questionIndex].question}
                </p>
                <textarea
                  value={answers[questionIndex]}
                  onChange={e => handleAnswerChange(e.target.value)}
                  placeholder="写下你的答案..."
                  autoFocus
                  style={{
                    width: '100%', minHeight: 120, border: '1px solid #e5e7eb', borderRadius: 10,
                    padding: '14px 16px', fontSize: 14, color: '#111', lineHeight: 1.6,
                    resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    background: '#fafafa'
                  }}
                  onFocus={e => e.target.style.borderColor = '#111'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleNextQuestion}
                  style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                >
                  {questionIndex < questions.length - 1 ? "下一题 →" : "查看答案 →"}
                </button>
              </div>
            </>
          )}

          {/* ── 查看答案 + 自评 ── */}
          {stage === "reviewing" && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111', margin: '0 0 6px' }}>对照答案</h2>
                <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{currentNoteTitle}</p>
              </div>

              {/* 题目答案对比 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                {questions.map((q, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8, letterSpacing: '0.5px' }}>
                        第 {i + 1} 题 · {q.type}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0, lineHeight: 1.6 }}>{q.question}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      <div style={{ padding: '14px 20px', borderRight: '1px solid #f5f5f5' }}>
                        <div style={{ fontSize: 11, color: '#bbb', marginBottom: 6, fontWeight: 600 }}>你的答案</div>
                        <p style={{ fontSize: 13, color: answers[i] ? '#333' : '#ccc', margin: 0, lineHeight: 1.6 }}>
                          {answers[i] || "（未作答）"}
                        </p>
                      </div>
                      <div style={{ padding: '14px 20px', background: '#f9fdf9' }}>
                        <div style={{ fontSize: 11, color: '#16a34a', marginBottom: 6, fontWeight: 600 }}>参考答案</div>
                        <p style={{ fontSize: 13, color: '#333', margin: 0, lineHeight: 1.6 }}>{q.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 自评 */}
              <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 16, padding: '28px 28px' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: '0 0 20px' }}>整体掌握情况如何？</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {ratingOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => !submitting && handleSubmit(opt.value)}
                      disabled={submitting}
                      style={{
                        border: `1px solid ${opt.color}`, borderRadius: 12, padding: '16px 12px',
                        background: opt.color, cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.6 : 1, transition: 'transform .1s',
                        textAlign: 'center'
                      }}
                      onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: opt.textColor, marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── 全部完成 ── */}
          {stage === "done" && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🎉</div>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#111', margin: '0 0 10px' }}>今日复习全部完成！</h2>
              <p style={{ fontSize: 14, color: '#888', margin: '0 0 32px' }}>坚持复习是掌握知识最有效的方式，继续保持！</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Link href="/dashboard" style={{ background: '#111', color: '#fff', padding: '11px 24px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  回到主页
                </Link>
                <Link href="/notes" style={{ background: '#fff', color: '#111', border: '1px solid #ebebeb', padding: '11px 24px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  去知识库
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
