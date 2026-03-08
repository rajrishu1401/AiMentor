import { useState, useEffect, useRef } from "react";
import { apiRequest } from "../api/api";
import "./KnowledgeGraph.css";

/* ─── helpers ─────────────────────────────────────── */
function pct(progress, total) {
    if (!total) return 0;
    return Math.round((progress / total) * 100);
}

function confidenceLabel(p) {
    if (p >= 80) return { label: "High", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
    if (p >= 50) return { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    if (p >= 20) return { label: "Low", color: "#f97316", bg: "rgba(249,115,22,0.12)" };
    return { label: "None", color: "#64748b", bg: "rgba(100,116,139,0.10)" };
}

function levelEmoji(l) {
    return l === "Advanced" ? "🔴" : l === "Intermediate" ? "🟡" : "🟢";
}

/* ─── Compute bubble radius (min 38 max 90) ── */
function bubbleR(totalTopics, allTotals) {
    const max = Math.max(...allTotals, 1);
    return 38 + ((totalTopics / max) * 52);
}

/* ─── Rough non-overlap packing ─────────────── */
function packBubbles(bubbles) {
    const placed = [];
    for (let i = 0; i < bubbles.length; i++) {
        const r = bubbles[i].r;
        let x = 0, y = 0, found = false, attempt = 0;
        while (!found && attempt < 800) {
            attempt++;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 320;
            x = Math.cos(angle) * dist;
            y = Math.sin(angle) * dist;
            const ok = placed.every(p => {
                const dx = p.x - x, dy = p.y - y;
                return Math.sqrt(dx * dx + dy * dy) > p.r + r + 6;
            });
            if (ok) found = true;
        }
        placed.push({ ...bubbles[i], x, y });
    }
    return placed;
}

const PALETTE = [
    "#9333ea", "#7c3aed", "#6366f1", "#2563eb", "#0891b2",
    "#059669", "#d97706", "#dc2626", "#c026d3", "#0d9488",
];

/* ══════════════════════════════════════════════════ */
export default function KnowledgeGraph() {
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(null);    // hovered bubble id
    const [sortBy, setSortBy] = useState("completion"); // "completion"|"topics"|"name"
    const [filter, setFilter] = useState("all");   // "all"|"Beginner"|"Intermediate"|"Advanced"
    const svgRef = useRef(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await apiRequest("/learning/my-roadmaps");
            setRoadmaps(res.roadmaps || []);
        } catch { setRoadmaps([]); }
        finally { setLoading(false); }
    };

    /* ── derived data ── */
    const filtered = roadmaps
        .filter(rm => filter === "all" || rm.level === filter)
        .map((rm, i) => {
            const total = rm.topics?.length || 0;
            const done = Math.min(rm.progress || 0, total);
            const percent = pct(done, total);
            const conf = confidenceLabel(percent);
            const color = PALETTE[i % PALETTE.length];

            // Count coding challenges done
            let quizzesDone = 0;
            let codingDone = 0;
            rm.topics?.forEach(t => {
                t.subtopics?.forEach(s => {
                    if (s.quiz?.completed || s.score > 0) quizzesDone++;
                    if (s.codingSubmission?.noOfSubmissions > 0) codingDone++;
                });
            });

            return { ...rm, id: i, total, done, percent, conf, color, quizzesDone, codingDone };
        });

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "completion") return b.percent - a.percent;
        if (sortBy === "topics") return b.total - a.total;
        return a.subject.localeCompare(b.subject);
    });

    /* ── bubble layout ── */
    const allTotals = filtered.map(rm => rm.total);
    const rawBubbles = filtered.map((rm, i) => ({ ...rm, r: bubbleR(rm.total || 1, allTotals) }));
    const [packed] = useState(() => packBubbles(rawBubbles));

    // Actual pack results are recalculated on filter change
    const bubbles = packBubbles(rawBubbles);

    // SVG viewport centering
    const xs = bubbles.map(b => b.x);
    const ys = bubbles.map(b => b.y);
    const minX = Math.min(...xs, 0) - 100;
    const minY = Math.min(...ys, 0) - 100;
    const maxX = Math.max(...xs, 0) + 100;
    const maxY = Math.max(...ys, 0) + 100;
    const vw = maxX - minX;
    const vh = maxY - minY;

    /* ══════════════════════════════════════════════════ */
    return (
        <div className="kg-root">

            {/* ── Page Header ─────────────────────────────── */}
            <div className="kg-header">
                <div className="kg-header-left">
                    <div className="kg-header-icon">📊</div>
                    <div>
                        <h1 className="kg-title">Skills Activity</h1>
                        <p className="kg-subtitle">Your learning progress visualised across all roadmaps</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="kg-filters">
                    <div className="kg-filter-group">
                        <label>Level</label>
                        <div className="kg-filter-pills">
                            {["all", "Beginner", "Intermediate", "Advanced"].map(f => (
                                <button
                                    key={f}
                                    className={`kg-pill ${filter === f ? "kg-pill-active" : ""}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === "all" ? "All" : f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="kg-filter-group">
                        <label>Sort by</label>
                        <select className="kg-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="completion">% Completion</option>
                            <option value="topics">Topic Count</option>
                            <option value="name">Name A–Z</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="kg-loading">
                    <span className="kg-spinner" />
                    <p>Loading your skills data…</p>
                </div>
            ) : roadmaps.length === 0 ? (
                <div className="kg-empty">
                    <div className="kg-empty-icon">🗺️</div>
                    <h2>No roadmaps yet</h2>
                    <p>Create a learning roadmap from the Dashboard to see your Skills Activity.</p>
                </div>
            ) : (
                <>
                    {/* ── Section 2: Bubble Chart ─────────────── */}
                    <section className="kg-section">
                        <div className="kg-section-header">
                            <h2 className="kg-section-title">🫧 Top Skills Activity</h2>
                            <p className="kg-section-desc">Bubble size = total topics &nbsp;|&nbsp; Fill level = completion %</p>
                        </div>

                        <div className="kg-bubble-wrap">
                            {bubbles.length === 0 ? (
                                <p className="kg-no-match">No roadmaps match this filter.</p>
                            ) : (
                                <svg
                                    ref={svgRef}
                                    className="kg-svg"
                                    viewBox={`${minX} ${minY} ${vw} ${vh}`}
                                    preserveAspectRatio="xMidYMid meet"
                                >
                                    <defs>
                                        {bubbles.map(b => (
                                            <clipPath key={`clip-${b.id}`} id={`clip-${b.id}`}>
                                                <circle cx={b.x} cy={b.y} r={b.r - 2} />
                                            </clipPath>
                                        ))}
                                    </defs>

                                    {bubbles.map(b => {
                                        const fillH = (b.percent / 100) * (b.r * 2);
                                        const fillY = b.y + b.r - fillH;
                                        const isActive = active === b.id;

                                        return (
                                            <g
                                                key={b.id}
                                                className="kg-bubble-g"
                                                onMouseEnter={() => setActive(b.id)}
                                                onMouseLeave={() => setActive(null)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {/* Glow ring on hover */}
                                                {isActive && (
                                                    <circle
                                                        cx={b.x} cy={b.y} r={b.r + 6}
                                                        fill="none"
                                                        stroke={b.color}
                                                        strokeWidth="2"
                                                        opacity="0.6"
                                                    />
                                                )}

                                                {/* Background circle */}
                                                <circle
                                                    cx={b.x} cy={b.y} r={b.r}
                                                    fill="#1a1a2e"
                                                    stroke={b.color}
                                                    strokeWidth={isActive ? 2.5 : 1.5}
                                                    opacity="0.9"
                                                />

                                                {/* Fill level (water effect) */}
                                                <rect
                                                    x={b.x - b.r}
                                                    y={fillY}
                                                    width={b.r * 2}
                                                    height={fillH}
                                                    fill={b.color}
                                                    opacity="0.28"
                                                    clipPath={`url(#clip-${b.id})`}
                                                />

                                                {/* Bold fill line */}
                                                {b.percent > 0 && b.percent < 100 && (
                                                    <line
                                                        x1={b.x - b.r + 4} y1={fillY}
                                                        x2={b.x + b.r - 4} y2={fillY}
                                                        stroke={b.color}
                                                        strokeWidth="1.5"
                                                        opacity="0.6"
                                                        clipPath={`url(#clip-${b.id})`}
                                                    />
                                                )}

                                                {/* Subject label */}
                                                <text
                                                    x={b.x} y={b.y - 8}
                                                    textAnchor="middle"
                                                    fill="#f1f5f9"
                                                    fontSize={Math.max(9, Math.min(14, b.r / 4))}
                                                    fontWeight="600"
                                                    fontFamily="Inter, sans-serif"
                                                >
                                                    {b.subject.length > 14 ? b.subject.slice(0, 13) + "…" : b.subject}
                                                </text>

                                                {/* Percent */}
                                                <text
                                                    x={b.x} y={b.y + 10}
                                                    textAnchor="middle"
                                                    fill={b.color}
                                                    fontSize={Math.max(10, Math.min(18, b.r / 3))}
                                                    fontWeight="800"
                                                    fontFamily="Inter, sans-serif"
                                                >
                                                    {b.percent}%
                                                </text>

                                                {/* Level label */}
                                                <text
                                                    x={b.x} y={b.y + 26}
                                                    textAnchor="middle"
                                                    fill="#64748b"
                                                    fontSize={Math.max(7, Math.min(10, b.r / 5))}
                                                    fontFamily="Inter, sans-serif"
                                                >
                                                    {b.level}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            )}

                            {/* Legend */}
                            <div className="kg-legend">
                                {bubbles.map(b => (
                                    <div key={b.id} className="kg-legend-item">
                                        <span className="kg-legend-dot" style={{ background: b.color }} />
                                        <span>{b.subject}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── Section 3: Stats Table ──────────────── */}
                    <section className="kg-section">
                        <div className="kg-section-header">
                            <h2 className="kg-section-title">📋 Skills Breakdown</h2>
                            <p className="kg-section-desc">{sorted.length} roadmap{sorted.length !== 1 ? "s" : ""}</p>
                        </div>

                        <div className="kg-table-wrap">
                            <table className="kg-table">
                                <thead>
                                    <tr>
                                        <th>ROADMAP</th>
                                        <th className="kg-th-center">TOPICS TOTAL</th>
                                        <th className="kg-th-center">COMPLETED</th>
                                        <th className="kg-th-center">QUIZZES</th>
                                        <th className="kg-th-center">CODING</th>
                                        <th className="kg-th-center">COMPLETION</th>
                                        <th className="kg-th-center">CONFIDENCE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map(rm => (
                                        <tr key={rm.id} className="kg-row">
                                            {/* Col 1: Roadmap */}
                                            <td className="kg-td-roadmap">
                                                <div className="kg-rm-dot" style={{ background: rm.color }} />
                                                <div>
                                                    <p className="kg-rm-name">{rm.subject}</p>
                                                    <p className="kg-rm-level">{levelEmoji(rm.level)} {rm.level} · {rm.language || "—"}</p>
                                                </div>
                                            </td>

                                            {/* Col 2: Total topics */}
                                            <td className="kg-td-center">
                                                <span className="kg-stat">{rm.total}</span>
                                            </td>

                                            {/* Col 3: Completed topics */}
                                            <td className="kg-td-center">
                                                <span className="kg-stat" style={{ color: rm.color }}>{rm.done}</span>
                                                <span className="kg-stat-of"> / {rm.total}</span>
                                            </td>

                                            {/* Col 4: Quizzes */}
                                            <td className="kg-td-center">
                                                <span className="kg-stat">{rm.quizzesDone}</span>
                                            </td>

                                            {/* Col 5: Coding */}
                                            <td className="kg-td-center">
                                                <span className="kg-stat">{rm.codingDone}</span>
                                            </td>

                                            {/* Col 6: Completion bar */}
                                            <td className="kg-td-center">
                                                <div className="kg-prog-wrap">
                                                    <div className="kg-prog-bar">
                                                        <div
                                                            className="kg-prog-fill"
                                                            style={{ width: `${rm.percent}%`, background: rm.color }}
                                                        />
                                                    </div>
                                                    <span className="kg-prog-pct">{rm.percent}%</span>
                                                </div>
                                            </td>

                                            {/* Col 7: Confidence */}
                                            <td className="kg-td-center">
                                                <span
                                                    className="kg-conf-badge"
                                                    style={{ color: rm.conf.color, background: rm.conf.bg, border: `1px solid ${rm.conf.color}40` }}
                                                >
                                                    {rm.conf.label}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary row */}
                        <div className="kg-summary-bar">
                            <div className="kg-summary-item">
                                <span className="kg-sum-val">{roadmaps.length}</span>
                                <span className="kg-sum-label">Roadmaps</span>
                            </div>
                            <div className="kg-summary-item">
                                <span className="kg-sum-val">{roadmaps.reduce((a, rm) => a + (rm.topics?.length || 0), 0)}</span>
                                <span className="kg-sum-label">Total Topics</span>
                            </div>
                            <div className="kg-summary-item">
                                <span className="kg-sum-val">{roadmaps.reduce((a, rm) => a + Math.min(rm.progress || 0, rm.topics?.length || 0), 0)}</span>
                                <span className="kg-sum-label">Topics Completed</span>
                            </div>
                            <div className="kg-summary-item">
                                <span className="kg-sum-val">
                                    {Math.round(
                                        roadmaps.reduce((a, rm) => {
                                            const t = rm.topics?.length || 0;
                                            return a + pct(Math.min(rm.progress || 0, t), t);
                                        }, 0) / Math.max(roadmaps.length, 1)
                                    )}%
                                </span>
                                <span className="kg-sum-label">Avg Completion</span>
                            </div>
                            <div className="kg-summary-item">
                                <span className="kg-sum-val">{roadmaps.filter(rm => pct(Math.min(rm.progress || 0, rm.topics?.length || 0), rm.topics?.length || 0) >= 80).length}</span>
                                <span className="kg-sum-label">High Confidence</span>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
