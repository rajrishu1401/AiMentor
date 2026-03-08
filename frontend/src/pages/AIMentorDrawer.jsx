import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./AIMentorDrawer.css";

const CHAT_API = "http://localhost:5005/chat";

/* ── helpers ──────────────────────────────────────── */
function makeSession() {
    return {
        id: Date.now().toString(),
        title: "New conversation",
        messages: [
            {
                type: "bot",
                text: "Hi! I'm your HackVedaAI Mentor 🤖\n\nAsk me anything about DSA, coding, roadmaps, or your learning path!",
            },
        ],
        createdAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    };
}

function formatMessage(text) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
            const lines = part.split("\n");
            const lang = lines[0].replace("```", "").trim() || "code";
            const code = lines.slice(1, -1).join("\n");
            return (
                <div key={i} className="aim-code-block">
                    <div className="aim-code-header">{lang}</div>
                    <pre className="aim-code-body">{code}</pre>
                </div>
            );
        }
        return (
            <span key={i} style={{ whiteSpace: "pre-wrap" }}>
                {part}
            </span>
        );
    });
}

/* ══════════════════════════════════════════════════ */
export default function AIMentorDrawer({ open, onClose }) {
    const [sessions, setSessions] = useState([makeSession()]);
    const [activeId, setActiveId] = useState(sessions[0].id);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const activeSession = sessions.find((s) => s.id === activeId) || sessions[0];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeSession?.messages]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open]);

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") { if (showHistory) setShowHistory(false); else onClose(); } };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, showHistory]);

    /* ── session helpers ── */
    const updateSession = (id, updater) => {
        setSessions((prev) => prev.map((s) => s.id === id ? updater(s) : s));
    };

    const newSession = () => {
        const s = makeSession();
        setSessions((prev) => [s, ...prev]);
        setActiveId(s.id);
        setShowHistory(false);
        setInput("");
    };

    const deleteSession = (id) => {
        setSessions((prev) => {
            const remaining = prev.filter((s) => s.id !== id);
            if (remaining.length === 0) {
                const fresh = makeSession();
                setActiveId(fresh.id);
                return [fresh];
            }
            if (activeId === id) setActiveId(remaining[0].id);
            return remaining;
        });
    };

    const loadSession = (id) => {
        setActiveId(id);
        setShowHistory(false);
        setInput("");
    };

    /* ── send message ── */
    const sendMessage = async (text = input.trim()) => {
        if (!text) return;
        setInput("");

        const userMsg = { type: "user", text };
        const loadingMsg = { type: "bot", text: "..." };

        // Update title from first user message
        updateSession(activeId, (s) => ({
            ...s,
            title: s.title === "New conversation" ? text.slice(0, 36) + (text.length > 36 ? "…" : "") : s.title,
            messages: [...s.messages, userMsg, loadingMsg],
        }));

        setLoading(true);

        try {
            const res = await fetch(CHAT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, sessionId: activeId }),
            });
            const data = await res.json();
            updateSession(activeId, (s) => {
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = { type: "bot", text: data.reply || "Sorry, I couldn't generate a response." };
                return { ...s, messages: msgs };
            });
        } catch {
            updateSession(activeId, (s) => {
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = { type: "bot", text: "⚠️ Couldn't reach the AI backend. Make sure the server is running on port 5005." };
                return { ...s, messages: msgs };
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    if (!open) return null;

    /* ══════════════════════════════════════════════════ */
    return createPortal(
        <div className="aim-overlay" onClick={() => { if (showHistory) setShowHistory(false); else onClose(); }}>
            <div
                className={`aim-drawer ${open ? "aim-drawer-open" : ""}`}
                onClick={(e) => e.stopPropagation()}
            >

                {/* ── Header ────────────────────────────────── */}
                <div className="aim-header">
                    <div className="aim-header-left">
                        <div className="aim-bot-avatar">🤖</div>
                        <div>
                            <p className="aim-header-title">AI Mentor</p>
                            <p className="aim-header-sub">Powered by AWS Bedrock</p>
                        </div>
                    </div>
                    <div className="aim-header-right">
                        {/* History button */}
                        <button
                            className={`aim-icon-btn ${showHistory ? "aim-icon-btn-active" : ""}`}
                            onClick={() => setShowHistory((v) => !v)}
                            title="Chat history"
                        >
                            {/* Clock/history SVG */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {sessions.length > 1 && (
                                <span className="aim-history-badge">{sessions.length}</span>
                            )}
                        </button>
                        <button className="aim-icon-btn aim-close-btn" onClick={onClose} title="Close">✕</button>
                    </div>
                </div>

                {/* ── History Panel (slides in over messages) ── */}
                {showHistory && (
                    <div className="aim-history-panel">
                        <div className="aim-history-header">
                            <span>Chat History</span>
                            <button className="aim-new-chat-btn" onClick={newSession}>+ New Chat</button>
                        </div>
                        <div className="aim-history-list">
                            {sessions.length === 0 ? (
                                <p className="aim-no-history">No conversations yet.</p>
                            ) : (
                                sessions.map((s) => (
                                    <div
                                        key={s.id}
                                        className={`aim-history-item ${s.id === activeId ? "aim-history-item-active" : ""}`}
                                        onClick={() => loadSession(s.id)}
                                    >
                                        <div className="aim-history-item-info">
                                            <p className="aim-history-item-title">{s.title}</p>
                                            <p className="aim-history-item-date">
                                                {s.messages.length - 1} message{s.messages.length - 1 !== 1 ? "s" : ""} · {s.createdAt}
                                            </p>
                                        </div>
                                        <button
                                            className="aim-history-del-btn"
                                            title="Delete conversation"
                                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ── Messages ──────────────────────────────── */}
                <div className="aim-messages">
                    {activeSession.messages.map((msg, i) => (
                        <div key={i} className={`aim-msg aim-msg-${msg.type}`}>
                            <div className="aim-msg-avatar">
                                {msg.type === "user" ? "👤" : "🤖"}
                            </div>
                            <div className="aim-msg-bubble">
                                {msg.text === "..." ? (
                                    <span className="aim-typing">
                                        <span /><span /><span />
                                    </span>
                                ) : (
                                    formatMessage(msg.text)
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* ── Input ─────────────────────────────────── */}
                <div className="aim-input-area">
                    <div className="aim-input-row">
                        <textarea
                            ref={inputRef}
                            className="aim-input"
                            placeholder="Ask anything about coding, DSA, roadmaps…"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            className="aim-send-btn"
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                        >
                            ➤
                        </button>
                    </div>
                    <p className="aim-disclaimer">AI may make mistakes. Verify important info.</p>
                </div>
            </div>
        </div>,
        document.body
    );
}
