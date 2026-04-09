"use client";
import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "weight-tracker-data";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" });
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function WeightTracker() {
  const [entries, setEntries] = useState([]);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [goal, setGoal] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [view, setView] = useState("home");
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setEntries(data.entries || []);
        setGoal(data.goal || "");
      }
    } catch {}
  }, []);

  const save = (newEntries, newGoal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: newEntries, goal: newGoal }));
    } catch {}
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const addEntry = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 20 || w > 300) { showToast("正しい体重を入力してください"); return; }
    const today = getTodayStr();
    const existing = entries.findIndex(e => e.date === today);
    let newEntries;
    if (existing >= 0) {
      newEntries = entries.map((e, i) => i === existing ? { ...e, weight: w, note } : e);
    } else {
      newEntries = [...entries, { date: today, weight: w, note }].sort((a, b) => a.date.localeCompare(b.date));
    }
    setEntries(newEntries);
    save(newEntries, goal);
    setWeight("");
    setNote("");
    showToast("記録しました！");
  };

  const deleteEntry = (date) => {
    const newEntries = entries.filter(e => e.date !== date);
    setEntries(newEntries);
    save(newEntries, goal);
    showToast("削除しました");
  };

  const saveGoal = () => {
    const g = parseFloat(goalInput);
    if (isNaN(g) || g < 20 || g > 300) { showToast("正しい目標体重を入力"); return; }
    setGoal(g);
    save(entries, g);
    setEditingGoal(false);
    showToast("目標を設定しました！");
  };

  if (!mounted) return null;

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const diff = latest && first ? (latest.weight - first.weight).toFixed(1) : null;
  const todayEntry = entries.find(e => e.date === getTodayStr());

  const graphEntries = entries.slice(-14);
  const weights = graphEntries.map(e => e.weight);
  const minW = weights.length ? Math.floor(Math.min(...weights) - 1) : 50;
  const maxW = weights.length ? Math.ceil(Math.max(...weights) + 1) : 80;
  const range = maxW - minW || 1;
  const gW = 320, gH = 160;
  const pad = { l: 36, r: 12, t: 12, b: 28 };
  const innerW = gW - pad.l - pad.r;
  const innerH = gH - pad.t - pad.b;
  const toX = (i) => pad.l + (i / (graphEntries.length - 1 || 1)) * innerW;
  const toY = (w) => pad.t + innerH - ((w - minW) / range) * innerH;
  const polyline = graphEntries.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(" ");

  return (
    <div style={{
      fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      background: "linear-gradient(160deg, #0f1117 0%, #1a1f2e 100%)",
      minHeight: "100svh",
      color: "#e8eaf0",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
      paddingBottom: 72,
    }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#4ade80", color: "#0a0a0a", padding: "10px 22px",
          borderRadius: 20, fontWeight: 700, fontSize: 14, zIndex: 999,
          boxShadow: "0 4px 20px rgba(74,222,128,0.4)",
        }}>{toast}</div>
      )}

      <div style={{ padding: "48px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 3, textTransform: "uppercase" }}>体重管理</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Weight Tracker</div>
        </div>
        {latest && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#4ade80", lineHeight: 1 }}>{latest.weight}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>kg / 最新</div>
          </div>
        )}
      </div>

      {/* HOME */}
      {view === "home" && (
        <div style={{ padding: "20px 20px 0" }}>
          {entries.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "記録数", value: entries.length + "日" },
                { label: "変化量", value: (diff > 0 ? "+" : "") + diff + "kg" },
                { label: "目標まで", value: goal && latest ? (latest.weight - goal).toFixed(1) + "kg" : "未設定" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "rgba(255,255,255,0.05)", borderRadius: 14,
                  padding: "12px 8px", textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, marginBottom: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, fontWeight: 600 }}>
              {todayEntry ? "✏️ 今日の記録を更新" : "📝 今日の体重を記録"}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <input
                type="number" step="0.1"
                placeholder={todayEntry ? String(todayEntry.weight) : "65.0"}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                style={{
                  flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12, padding: "14px 16px", color: "#f1f5f9",
                  fontSize: 24, fontWeight: 700, outline: "none",
                }}
              />
              <div style={{ fontSize: 18, color: "#6b7280", fontWeight: 600 }}>kg</div>
            </div>
            <input
              type="text" placeholder="メモ（任意）" value={note}
              onChange={e => setNote(e.target.value)}
              style={{
                width: "100%", background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                padding: "10px 14px", color: "#d1d5db", fontSize: 13,
                outline: "none", boxSizing: "border-box", marginBottom: 14,
              }}
            />
            <button onClick={addEntry} style={{
              width: "100%", background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              border: "none", borderRadius: 14, padding: "14px",
              color: "#0a0a0a", fontWeight: 800, fontSize: 15, cursor: "pointer",
            }}>記録する</button>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>🎯 目標体重</div>
              <button onClick={() => { setEditingGoal(!editingGoal); setGoalInput(goal || ""); }}
                style={{ background: "none", border: "none", color: "#4ade80", fontSize: 12, cursor: "pointer" }}>
                {editingGoal ? "キャンセル" : "設定"}
              </button>
            </div>
            {editingGoal ? (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input type="number" step="0.1" placeholder="60.0" value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: 10, padding: "10px 12px", color: "#f1f5f9", fontSize: 18, fontWeight: 700, outline: "none" }} />
                <button onClick={saveGoal} style={{ background: "#4ade80", border: "none", borderRadius: 10, padding: "10px 16px", color: "#0a0a0a", fontWeight: 700, cursor: "pointer" }}>保存</button>
              </div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 900, color: goal ? "#facc15" : "#374151", marginTop: 4 }}>
                {goal ? goal + " kg" : "未設定"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRAPH */}
      {view === "graph" && (
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>直近14日間のグラフ</div>
          {graphEntries.length < 2 ? (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 40, textAlign: "center", color: "#4b5563", fontSize: 14 }}>
              データが2件以上になるとグラフが表示されます
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "16px 8px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg width="100%" viewBox={`0 0 ${gW} ${gH}`} style={{ overflow: "visible" }}>
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                  const y = pad.t + innerH * (1 - t);
                  const val = (minW + range * t).toFixed(1);
                  return (
                    <g key={t}>
                      <line x1={pad.l} y1={y} x2={gW - pad.r} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                      <text x={pad.l - 4} y={y + 4} textAnchor="end" fill="#4b5563" fontSize="9">{val}</text>
                    </g>
                  );
                })}
                {goal && goal >= minW && goal <= maxW && (
                  <line x1={pad.l} y1={toY(goal)} x2={gW - pad.r} y2={toY(goal)} stroke="#facc15" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
                )}
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`${pad.l},${pad.t + innerH} ${polyline} ${gW - pad.r},${pad.t + innerH}`} fill="url(#areaGrad)" />
                <polyline points={polyline} fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {graphEntries.map((e, i) => (
                  <circle key={e.date} cx={toX(i)} cy={toY(e.weight)} r="4" fill="#4ade80" stroke="#0f1117" strokeWidth="2" />
                ))}
                {graphEntries.filter((_, i) => i % Math.ceil(graphEntries.length / 5) === 0 || i === graphEntries.length - 1).map((e) => {
                  const i = graphEntries.indexOf(e);
                  const d = new Date(e.date);
                  return (
                    <text key={e.date} x={toX(i)} y={gH - 6} textAnchor="middle" fill="#4b5563" fontSize="9">{`${d.getMonth() + 1}/${d.getDate()}`}</text>
                  );
                })}
              </svg>
              {goal && <div style={{ textAlign: "center", fontSize: 11, color: "#facc15", marginTop: 4 }}>── 目標: {goal}kg</div>}
            </div>
          )}
          {entries.length > 0 && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "最高体重", value: Math.max(...entries.map(e => e.weight)) + " kg", color: "#f87171" },
                { label: "最低体重", value: Math.min(...entries.map(e => e.weight)) + " kg", color: "#4ade80" },
                { label: "平均体重", value: (entries.reduce((s, e) => s + e.weight, 0) / entries.length).toFixed(1) + " kg", color: "#60a5fa" },
                { label: "記録期間", value: entries.length + " 日間", color: "#a78bfa" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOG */}
      {view === "log" && (
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>全記録 ({entries.length}件)</div>
          {entries.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 40, textAlign: "center", color: "#4b5563", fontSize: 14 }}>まだ記録がありません</div>
          ) : (
            [...entries].reverse().map((e, i) => {
              const prev = entries[entries.length - 1 - i - 1];
              const delta = prev ? (e.weight - prev.weight).toFixed(1) : null;
              const isToday = e.date === getTodayStr();
              return (
                <div key={e.date} style={{
                  background: isToday ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                  borderRadius: 14, padding: "14px 16px", marginBottom: 8,
                  border: isToday ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: isToday ? "#4ade80" : "#6b7280" }}>
                      {isToday ? "今日 " : ""}{formatDate(e.date)}
                    </div>
                    {e.note && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{e.note}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{e.weight}</div>
                      {delta !== null && (
                        <div style={{ fontSize: 11, color: parseFloat(delta) < 0 ? "#4ade80" : parseFloat(delta) > 0 ? "#f87171" : "#6b7280" }}>
                          {parseFloat(delta) > 0 ? "+" : ""}{delta}kg
                        </div>
                      )}
                    </div>
                    <button onClick={() => deleteEntry(e.date)} style={{ background: "rgba(248,113,113,0.15)", border: "none", borderRadius: 8, padding: "6px 10px", color: "#f87171", fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: "rgba(15,17,23,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        padding: "8px 0 env(safe-area-inset-bottom, 16px)",
      }}>
        {[
          { id: "home", icon: "⚖️", label: "記録" },
          { id: "graph", icon: "📈", label: "グラフ" },
          { id: "log", icon: "📋", label: "履歴" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "8px 0",
          }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: view === tab.id ? "#4ade80" : "#4b5563" }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      `}</style>
    </div>
  );
}
