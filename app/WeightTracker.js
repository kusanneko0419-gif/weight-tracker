"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "weight-tracker-data";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

export default function WeightTracker() {
  const [entries, setEntries] = useState([]);
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
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

  const save = (e, g) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: e, goal: g })); } catch {}
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const addEntry = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 20 || w > 300) { showToast("正しい体重を入力してください"); return; }
    const today = getTodayStr();
    const idx = entries.findIndex(e => e.date === today);
    let next;
    if (idx >= 0) {
      next = entries.map((e, i) => i === idx ? { ...e, weight: w } : e);
    } else {
      next = [...entries, { date: today, weight: w }].sort((a, b) => a.date.localeCompare(b.date));
    }
    setEntries(next);
    save(next, goal);
    setWeight("");
    showToast("記録しました！");
  };

  const deleteEntry = (date) => {
    const next = entries.filter(e => e.date !== date);
    setEntries(next);
    save(next, goal);
  };

  const saveGoal = () => {
    const g = parseFloat(goalInput);
    if (isNaN(g) || g < 20 || g > 300) { showToast("正しい体重を入力してください"); return; }
    setGoal(g);
    save(entries, g);
    setEditingGoal(false);
    showToast("目標を設定しました！");
  };

  if (!mounted) return null;

  const latest = entries[entries.length - 1];
  const todayEntry = entries.find(e => e.date === getTodayStr());

  const graphEntries = entries.slice(-14);
  const weights = graphEntries.map(e => e.weight);
  const minW = weights.length ? Math.floor(Math.min(...weights) - 1) : 50;
  const maxW = weights.length ? Math.ceil(Math.max(...weights) + 1) : 80;
  const range = maxW - minW || 1;
  const gW = 300, gH = 140;
  const pl = 32, pr = 8, pt = 8, pb = 24;
  const iW = gW - pl - pr, iH = gH - pt - pb;
  const tx = (i) => pl + (i / (graphEntries.length - 1 || 1)) * iW;
  const ty = (w) => pt + iH - ((w - minW) / range) * iH;
  const poly = graphEntries.map((e, i) => `${tx(i)},${ty(e.weight)}`).join(" ");

  return (
    <div style={{ fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif", background: "#fff", minHeight: "100svh", maxWidth: 390, margin: "0 auto", color: "#111", paddingBottom: 64 }}>

      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 999 }}>
          {toast}
        </div>
      )}

      {/* ヘッダー */}
      <div style={{ padding: "52px 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: 12, color: "#999", letterSpacing: 1 }}>体重トラッカー</div>
        <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>
          {latest ? latest.weight : <span style={{ color: "#ddd" }}>--</span>}
          <span style={{ fontSize: 16, color: "#999", fontWeight: 400 }}> kg</span>
        </div>
        {goal && latest && (
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
            目標まで {Math.abs(latest.weight - goal).toFixed(1)} kg
            {parseFloat(latest.weight) <= parseFloat(goal) ? "　🎉 達成！" : ""}
          </div>
        )}
      </div>

      {/* HOME */}
      {view === "home" && (
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ fontSize: 11, color: "#999", letterSpacing: 1, marginBottom: 8 }}>
            {todayEntry ? "今日の記録を更新" : "今日の体重"}
          </div>
          <input
            type="number" step="0.1"
            placeholder={todayEntry ? String(todayEntry.weight) : "65.0"}
            value={weight}
            onChange={e => setWeight(e.target.value)}
            style={{ width: "100%", border: "none", borderBottom: "2px solid #111", padding: "8px 0", fontSize: 36, fontWeight: 600, color: "#111", outline: "none", background: "transparent", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>kg</div>
          <button onClick={addEntry} style={{ width: "100%", background: "#111", border: "none", borderRadius: 8, padding: "14px", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 20 }}>
            記録する
          </button>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#999", letterSpacing: 1 }}>目標体重</div>
              <button onClick={() => { setEditingGoal(!editingGoal); setGoalInput(goal || ""); }}
                style={{ background: "none", border: "none", fontSize: 12, color: "#999", cursor: "pointer" }}>
                {editingGoal ? "キャンセル" : "設定"}
              </button>
            </div>
            {editingGoal ? (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <input type="number" step="0.1" placeholder="60.0" value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  style={{ flex: 1, border: "none", borderBottom: "2px solid #111", padding: "6px 0", fontSize: 28, fontWeight: 600, outline: "none", background: "transparent" }} />
                <button onClick={saveGoal} style={{ background: "#111", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>保存</button>
              </div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 700, color: goal ? "#111" : "#ddd" }}>
                {goal ? `${goal} kg` : "未設定"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRAPH */}
      {view === "graph" && (
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ fontSize: 11, color: "#999", letterSpacing: 1, marginBottom: 16 }}>直近14日間</div>
          {graphEntries.length < 2 ? (
            <div style={{ color: "#ccc", fontSize: 14, padding: "40px 0", textAlign: "center" }}>2件以上記録するとグラフが表示されます</div>
          ) : (
            <svg width="100%" viewBox={`0 0 ${gW} ${gH}`} style={{ overflow: "visible" }}>
              {[0, 0.5, 1].map(t => {
                const y = pt + iH * (1 - t);
                return (
                  <g key={t}>
                    <line x1={pl} y1={y} x2={gW - pr} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                    <text x={pl - 4} y={y + 4} textAnchor="end" fill="#ccc" fontSize="9">{(minW + range * t).toFixed(0)}</text>
                  </g>
                );
              })}
              {goal && goal >= minW && goal <= maxW && (
                <line x1={pl} y1={ty(goal)} x2={gW - pr} y2={ty(goal)} stroke="#111" strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
              )}
              <polyline points={poly} fill="none" stroke="#111" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {graphEntries.map((e, i) => (
                <circle key={e.date} cx={tx(i)} cy={ty(e.weight)} r="3" fill="#111" />
              ))}
              {graphEntries.filter((_, i) => i === 0 || i === graphEntries.length - 1 || i % 4 === 0).map((e) => {
                const i = graphEntries.indexOf(e);
                const d = new Date(e.date);
                return <text key={e.date} x={tx(i)} y={gH - 4} textAnchor="middle" fill="#bbb" fontSize="9">{`${d.getMonth() + 1}/${d.getDate()}`}</text>;
              })}
            </svg>
          )}

          {entries.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 24, background: "#f0f0f0", borderRadius: 10, overflow: "hidden" }}>
              {[
                { label: "最高", value: Math.max(...entries.map(e => e.weight)) + " kg" },
                { label: "最低", value: Math.min(...entries.map(e => e.weight)) + " kg" },
                { label: "平均", value: (entries.reduce((s, e) => s + e.weight, 0) / entries.length).toFixed(1) + " kg" },
                { label: "記録日数", value: entries.length + " 日" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOG */}
      {view === "log" && (
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ fontSize: 11, color: "#999", letterSpacing: 1, marginBottom: 16 }}>{entries.length}件の記録</div>
          {entries.length === 0 ? (
            <div style={{ color: "#ccc", fontSize: 14, padding: "40px 0", textAlign: "center" }}>まだ記録がありません</div>
          ) : (
            [...entries].reverse().map((e, i) => {
              const prev = entries[entries.length - 2 - i];
              const delta = prev ? (e.weight - prev.weight).toFixed(1) : null;
              const isToday = e.date === getTodayStr();
              return (
                <div key={e.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: "#111" }}>
                      {isToday ? "今日 · " : ""}{formatDate(e.date)}
                    </div>
                    {delta !== null && (
                      <div style={{ fontSize: 11, color: parseFloat(delta) < 0 ? "#22c55e" : parseFloat(delta) > 0 ? "#ef4444" : "#999", marginTop: 2 }}>
                        {parseFloat(delta) > 0 ? "+" : ""}{delta} kg
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{e.weight}</div>
                    <button onClick={() => deleteEntry(e.date)} style={{ background: "none", border: "none", color: "#ddd", fontSize: 14, cursor: "pointer", padding: 4 }}>✕</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ナビ */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 390, background: "#fff", borderTop: "1px solid #f0f0f0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "8px 0 env(safe-area-inset-bottom, 12px)" }}>
        {[
          { id: "home", icon: "⚖️", label: "記録" },
          { id: "graph", icon: "📈", label: "グラフ" },
          { id: "log", icon: "📋", label: "履歴" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 0" }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: view === tab.id ? "#111" : "#ccc" }}>{tab.label}</span>
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
