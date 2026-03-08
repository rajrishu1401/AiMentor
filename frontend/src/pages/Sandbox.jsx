import { useState, useRef, useEffect } from "react";
import "./Sandbox.css";

/* ─── Language config ──────────────────────────── */
const LANGUAGES = [
    { id: "javascript", label: "JavaScript", ext: "js", icon: "🟨" },
    { id: "python", label: "Python", ext: "py", icon: "🐍" },
    { id: "java", label: "Java", ext: "java", icon: "☕" },
    { id: "cpp", label: "C++", ext: "cpp", icon: "⚙️" },
    { id: "c", label: "C", ext: "c", icon: "🔵" },
];

const STARTERS = {
    javascript: `// JavaScript\nconsole.log("Hello, World!");`,
    python: `# Python\nprint("Hello, World!")`,
    java: `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    cpp: `// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
    c: `// C\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
};

const FILE_ICON = { js: "🟨", py: "🐍", java: "☕", cpp: "⚙️", c: "🔵", css: "🎨", html: "🌐", md: "📄", txt: "📝" };
function fileIcon(name) { return FILE_ICON[name.split(".").pop()] || "📄"; }

const CHAT_API = "http://13.232.0.142/chatbot/chat";
function makeChatSession() {
    return {
        id: Date.now().toString(),
        title: "New conversation",
        messages: [{ type: "bot", text: "Hi! I'm your AI assistant 🤖\n\nI can help you debug code, explain concepts, or suggest improvements.\nUse **Review current file** to send your code, or ask me anything!" }],
        createdAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    };
}

/* ─── Run JS locally ───────────────────────────── */
function runJS(code) {
    const logs = [];
    const con = {
        log: (...a) => logs.push(a.map(String).join(" ")),
        error: (...a) => logs.push("❌ " + a.map(String).join(" ")),
        warn: (...a) => logs.push("⚠️  " + a.map(String).join(" ")),
        info: (...a) => logs.push("ℹ️  " + a.map(String).join(" ")),
    };
    try {
        // eslint-disable-next-line no-new-func
        new Function("console", code)(con);
        return { out: logs.join("\n") || "(no output)", err: false };
    } catch (e) {
        return { out: `Error: ${e.message}`, err: true };
    }
}

/* ─── Chat message formatter ───────────────────── */
function fmtChat(text) {
    return text.split(/(```[\s\S]*?```)/g).map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
            const lines = part.split("\n");
            const lang = lines[0].replace("```", "").trim() || "code";
            const code = lines.slice(1, -1).join("\n");
            return (
                <div key={i} className="sb-code-block">
                    <div className="sb-code-block-header">{lang}</div>
                    <pre>{code}</pre>
                </div>
            );
        }
        return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
    });
}

/* ══════════════════════════════════════════════════ */
export default function Sandbox() {
    /* ── Language & editor state ── */
    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
    const [files, setFiles] = useState({ [`main.${LANGUAGES[0].ext}`]: STARTERS[LANGUAGES[0].id] });
    const [openTabs, setOpenTabs] = useState([`main.${LANGUAGES[0].ext}`]);
    const [activeFile, setActiveFile] = useState(`main.${LANGUAGES[0].ext}`);
    const [output, setOutput] = useState("");
    const [outputMode, setOutputMode] = useState("output");
    const [running, setRunning] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [showNewFile, setShowNewFile] = useState(false);

    /* ── Chat state ── */
    const [sessions, setSessions] = useState([makeChatSession()]);
    const [activeSessionId, setActiveId] = useState(() => makeChatSession().id);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const chatBottomRef = useRef(null);
    const editorRef = useRef(null);

    // Init session properly (avoid stale id)
    const [initialized] = useState(() => {
        const s = makeChatSession();
        return { sessions: [s], activeId: s.id };
    });

    const [chatSessions, setChatSessions] = useState(initialized.sessions);
    const [chatActiveId, setChatActiveId] = useState(initialized.activeId);

    const activeSession = chatSessions.find(s => s.id === chatActiveId) || chatSessions[0];

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeSession?.messages]);

    /* ── Switch language ── */
    const switchLanguage = (lang) => {
        setSelectedLang(lang);
        const fname = `main.${lang.ext}`;
        if (!files[fname]) {
            setFiles(f => ({ ...f, [fname]: STARTERS[lang.id] }));
        }
        setOpenTabs(t => t.includes(fname) ? t : [...t, fname]);
        setActiveFile(fname);
        setOutput("");
    };

    /* ── File helpers ── */
    const code = files[activeFile] || "";
    const setCode = (val) => setFiles(f => ({ ...f, [activeFile]: val }));

    const openFile = (path) => {
        setActiveFile(path);
        if (!openTabs.includes(path)) setOpenTabs(t => [...t, path]);
    };

    const closeTab = (path, e) => {
        e.stopPropagation();
        const remaining = openTabs.filter(t => t !== path);
        setOpenTabs(remaining);
        if (activeFile === path) setActiveFile(remaining[remaining.length - 1] || Object.keys(files)[0]);
    };

    const addFile = () => {
        const name = newFileName.trim();
        if (!name) return;
        setFiles(f => ({ ...f, [name]: "" }));
        openFile(name);
        setNewFileName("");
        setShowNewFile(false);
    };

    /* ── Run code ── */
    const handleRun = async () => {
        setRunning(true);
        setOutputMode("output");

        if (selectedLang.id === "javascript") {
            // Run JS natively in browser
            setTimeout(() => {
                const { out } = runJS(code);
                setOutput(out);
                setRunning(false);
            }, 250);
        } else {
            // Send to AI and ask it to trace/simulate the output
            setOutput("⏳ Sending to AI for output simulation…");
            try {
                const prompt = `You are a code executor. Run the following ${selectedLang.label} code mentally and return ONLY the exact output it would produce (no explanations, no markdown, just raw output). If there's an error, show the error message only.\n\nCode:\n\`\`\`${selectedLang.id}\n${code}\n\`\`\``;
                const res = await fetch(CHAT_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: prompt, sessionId: "sandbox-run-" + Date.now() }),
                });
                const data = await res.json();
                setOutput((data.reply || "No output returned.").replace(/```[\w]*/g, "").replace(/```/g, "").trim());
            } catch {
                setOutput("⚠️ Could not reach AI backend on port 5005.\nFor JavaScript, the sandbox runs code natively.\nFor other languages, start the chatbotAWS backend:\n  node backend.js");
            } finally { setRunning(false); }
        }
    };

    /* ── Tab handler in editor ── */
    const handleEditorKey = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const el = e.target, s = el.selectionStart;
            setCode(el.value.slice(0, s) + "  " + el.value.slice(el.selectionEnd));
            requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
        }
    };

    /* ── Chat helpers ── */
    const updateSession = (id, fn) => {
        setChatSessions(prev => prev.map(s => s.id === id ? fn(s) : s));
    };

    const newChatSession = () => {
        const s = makeChatSession();
        setChatSessions(prev => [s, ...prev]);
        setChatActiveId(s.id);
        setShowHistory(false);
        setChatInput("");
    };

    const deleteChatSession = (id, e) => {
        e.stopPropagation();
        setChatSessions(prev => {
            const rest = prev.filter(s => s.id !== id);
            if (rest.length === 0) {
                const fresh = makeChatSession();
                setChatActiveId(fresh.id);
                return [fresh];
            }
            if (chatActiveId === id) setChatActiveId(rest[0].id);
            return rest;
        });
    };

    const loadChatSession = (id) => {
        setChatActiveId(id);
        setShowHistory(false);
        setChatInput("");
    };

    const sendChat = async (text = chatInput.trim()) => {
        if (!text) return;
        setChatInput("");
        const userMsg = { type: "user", text };
        const loadingMsg = { type: "bot", text: "..." };
        updateSession(chatActiveId, s => ({
            ...s,
            title: s.title === "New conversation" ? text.slice(0, 36) + (text.length > 36 ? "…" : "") : s.title,
            messages: [...s.messages, userMsg, loadingMsg],
        }));
        setChatLoading(true);
        try {
            const res = await fetch(CHAT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, sessionId: chatActiveId }),
            });
            const data = await res.json();
            updateSession(chatActiveId, s => {
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = { type: "bot", text: data.reply || "No response." };
                return { ...s, messages: msgs };
            });
        } catch {
            updateSession(chatActiveId, s => {
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = { type: "bot", text: "⚠️ AI backend not reachable on port 5005." };
                return { ...s, messages: msgs };
            });
        } finally { setChatLoading(false); }
    };

    const handleChatKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
    };

    const lineCount = code.split("\n").length;

    /* ══════════════════════════════════════════════════ */
    return (
        <div className="sb-root">

            {/* ── LEFT SIDEBAR ─────────────────────────────── */}
            <aside className="sb-sidebar">
                <div className="sb-sidebar-header">
                    <span>EXPLORER</span>
                    <button className="sb-icon-action" title="New file" onClick={() => setShowNewFile(v => !v)}>+</button>
                </div>

                {showNewFile && (
                    <div className="sb-new-file-row">
                        <input
                            autoFocus
                            placeholder="filename.py"
                            value={newFileName}
                            onChange={e => setNewFileName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") addFile(); if (e.key === "Escape") setShowNewFile(false); }}
                            className="sb-new-file-input"
                        />
                    </div>
                )}

                <div className="sb-tree">
                    {Object.keys(files).map(fname => (
                        <div
                            key={fname}
                            className={`sb-tree-file ${activeFile === fname ? "sb-tree-file-active" : ""}`}
                            onClick={() => openFile(fname)}
                        >
                            <span className="sb-tree-icon">{fileIcon(fname)}</span>
                            <span>{fname}</span>
                        </div>
                    ))}
                    {Object.keys(files).length === 0 && (
                        <p className="sb-tree-empty">Click + to create a file</p>
                    )}
                </div>
            </aside>

            {/* ── EDITOR AREA ──────────────────────────────── */}
            <div className="sb-editor-area">

                {/* ── Toolbar: tabs + language dropdown + run ── */}
                <div className="sb-tabs">
                    {openTabs.map(tab => (
                        <div
                            key={tab}
                            className={`sb-tab ${activeFile === tab ? "sb-tab-active" : ""}`}
                            onClick={() => setActiveFile(tab)}
                        >
                            <span className="sb-tab-icon">{fileIcon(tab.split("/").pop())}</span>
                            <span>{tab.split("/").pop()}</span>
                            <button className="sb-tab-close" onClick={e => closeTab(tab, e)}>×</button>
                        </div>
                    ))}

                    <div className="sb-tab-spacer" />

                    {/* Language dropdown */}
                    <div className="sb-lang-select-wrap">
                        <select
                            className="sb-lang-select"
                            value={selectedLang.id}
                            onChange={e => switchLanguage(LANGUAGES.find(l => l.id === e.target.value))}
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.id} value={l.id}>{l.icon} {l.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Run */}
                    <button
                        className={`sb-run-btn ${running ? "sb-run-btn-running" : ""}`}
                        onClick={handleRun}
                        disabled={running || !code.trim()}
                        title={selectedLang.id === "javascript" ? "Runs natively in browser" : "Sends to AI for output simulation"}
                    >
                        {running ? "⏳ Running…" : "▶ Run"}
                    </button>
                </div>

                {/* Breadcrumb */}
                <div className="sb-breadcrumb">
                    <span>{activeFile}</span>
                    <span className="sb-breadcrumb-lang">{selectedLang.icon} {selectedLang.label}</span>
                    {selectedLang.id !== "javascript" && (
                        <span className="sb-breadcrumb-note">⚡ AI-simulated execution</span>
                    )}
                </div>

                {/* Code editor with line numbers */}
                <div className="sb-editor">
                    <div className="sb-line-numbers">
                        {Array.from({ length: lineCount }, (_, i) => (
                            <div key={i + 1} className="sb-ln">{i + 1}</div>
                        ))}
                    </div>
                    <textarea
                        ref={editorRef}
                        className="sb-textarea"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        onKeyDown={handleEditorKey}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        placeholder={`Start coding in ${selectedLang.label}…`}
                    />
                </div>

                {/* Output panel */}
                <div className="sb-output">
                    <div className="sb-output-header">
                        <div className="sb-output-tabs">
                            <button className={`sb-output-tab ${outputMode === "output" ? "active" : ""}`} onClick={() => setOutputMode("output")}>OUTPUT</button>
                            <button className={`sb-output-tab ${outputMode === "info" ? "active" : ""}`} onClick={() => setOutputMode("info")}>HOW RUN WORKS</button>
                        </div>
                        <button className="sb-output-clear" onClick={() => setOutput("")}>Clear</button>
                    </div>
                    <pre className="sb-output-content">
                        {outputMode === "info" ? (
                            <span className="sb-run-info">
                                {`▶ Run — How it works:

• JavaScript  → Runs natively in your browser (instant, 100% accurate).
  Uses an isolated eval() that captures console.log, console.error, etc.

• Python / Java / C / C++
  → Sends your code to the AWS Bedrock AI (port 5005).
  The AI traces the code logic and returns the expected output.
  This is a simulation — great for logic checks, not for I/O-heavy programs.

Tip: Click "Review current file" in the chat to get AI code review + fixes.`}
                            </span>
                        ) : (
                            output
                                ? <span className={output.startsWith("Error") ? "sb-output-error" : ""}>{output}</span>
                                : <span className="sb-output-placeholder">Click ▶ Run to execute your code</span>
                        )}
                    </pre>
                </div>
            </div>

            {/* ── AI CHAT SIDEBAR ──────────────────────────── */}
            <aside className="sb-chat">
                {/* Header */}
                <div className="sb-chat-header">
                    <div className="sb-chat-header-left">
                        <span className="sb-chat-icon">🤖</span>
                        <div>
                            <p className="sb-chat-title">AI Assistant</p>
                            <p className="sb-chat-sub">Powered by AWS Bedrock</p>
                        </div>
                    </div>
                    <div className="sb-chat-header-right">
                        {/* History button */}
                        <button
                            className={`sb-chat-icon-btn ${showHistory ? "sb-chat-icon-btn-active" : ""}`}
                            onClick={() => setShowHistory(v => !v)}
                            title="Chat history"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            {chatSessions.length > 1 && <span className="sb-chat-badge">{chatSessions.length}</span>}
                        </button>
                    </div>
                </div>

                {/* History panel */}
                {showHistory && (
                    <div className="sb-history-panel">
                        <div className="sb-history-header">
                            <span>CHAT HISTORY</span>
                            <button className="sb-new-session-btn" onClick={newChatSession}>+ New Chat</button>
                        </div>
                        <div className="sb-history-list">
                            {chatSessions.map(s => (
                                <div
                                    key={s.id}
                                    className={`sb-history-item ${s.id === chatActiveId ? "sb-history-item-active" : ""}`}
                                    onClick={() => loadChatSession(s.id)}
                                >
                                    <div className="sb-history-item-info">
                                        <p className="sb-history-item-title">{s.title}</p>
                                        <p className="sb-history-item-date">{s.messages.length - 1} msg · {s.createdAt}</p>
                                    </div>
                                    <button className="sb-history-del" onClick={e => deleteChatSession(s.id, e)} title="Delete">🗑️</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="sb-chat-messages">
                    {activeSession?.messages.map((msg, i) => (
                        <div key={i} className={`sb-msg sb-msg-${msg.type}`}>
                            {msg.type === "bot" && <div className="sb-msg-avatar">🤖</div>}
                            <div className="sb-msg-bubble">
                                {msg.text === "..." ? (
                                    <span className="sb-typing"><span /><span /><span /></span>
                                ) : fmtChat(msg.text)}
                            </div>
                            {msg.type === "user" && <div className="sb-msg-avatar">👤</div>}
                        </div>
                    ))}
                    <div ref={chatBottomRef} />
                </div>

                {/* Quick action */}
                <div className="sb-chat-quickbtn">
                    <button
                        className="sb-quick-action"
                        onClick={() => sendChat(`Review this ${selectedLang.label} code:\n\`\`\`${selectedLang.id}\n${code}\n\`\`\``)}
                    >
                        {selectedLang.icon} Review current file
                    </button>
                </div>

                {/* Input */}
                <div className="sb-chat-input-area">
                    <textarea
                        className="sb-chat-input"
                        placeholder="Ask about your code… (Enter to send)"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={handleChatKey}
                        rows={2}
                        disabled={chatLoading}
                    />
                    <button
                        className="sb-chat-send"
                        onClick={() => sendChat()}
                        disabled={chatLoading || !chatInput.trim()}
                    >➤</button>
                </div>
            </aside>

            {/* ── STATUS BAR ───────────────────────────────── */}
            <div className="sb-statusbar">
                <div className="sb-status-left">
                    <span className="sb-status-item sb-status-branch">⌥ HackVedaAI Sandbox</span>
                    <span className="sb-status-item">{Object.keys(files).length} file{Object.keys(files).length !== 1 ? "s" : ""}</span>
                </div>
                <div className="sb-status-right">
                    <span className="sb-status-item">{selectedLang.icon} {selectedLang.label}</span>
                    <span className="sb-status-item">Ln {lineCount}</span>
                    <span className="sb-status-item">UTF-8</span>
                </div>
            </div>
        </div>
    );
}
