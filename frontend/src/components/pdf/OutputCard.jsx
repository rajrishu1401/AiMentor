import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Clock, Cpu, Layers, ChevronDown, ChevronUp, RotateCcw, Copy, CheckCheck } from 'lucide-react';
import './PDFComponents.css';

const TYPE_CONFIG = {
    teach: { label: 'Lesson', icon: '🎓', color: 'text-violet-400', border: 'border-violet-500/40', bg: 'bg-violet-500/10' },
    plan: { label: 'Study Plan', icon: '📅', color: 'text-indigo-400', border: 'border-indigo-500/40', bg: 'bg-indigo-500/10' },
    quiz: { label: 'Quiz', icon: '❓', color: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-500/10' },
    summary: { label: 'Summary', icon: '📝', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
};

export default function OutputCard({ output, onReset }) {
    const [showSources, setShowSources] = useState(false);
    const [copied, setCopied] = useState(false);

    const cfg = TYPE_CONFIG[output.type] ?? TYPE_CONFIG.teach;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(output.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    const fmtMs = (ms) => {
        if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)} min`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    return (
        <div className="pdf-output-card">
            {/* Header */}
            <div className="pdf-output-header">
                <div className="pdf-output-title-section">
                    <div className={`pdf-output-icon-wrapper ${cfg.bg}`} style={{ border: `1px solid rgba(124, 58, 237, 0.4)` }}>
                        {cfg.icon}
                    </div>
                    <div className="pdf-output-title-text">
                        <h2>
                            Your {cfg.label}
                            <span className={`pdf-output-badge ${cfg.bg}`} style={{ border: `1px solid rgba(124, 58, 237, 0.4)`, color: '#a78bfa' }}>
                                {output.type.toUpperCase()}
                            </span>
                        </h2>
                        <p className="pdf-output-timestamp">
                            {new Date(output.generationTimestamp).toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                <div className="pdf-output-actions">
                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        className={`pdf-output-btn ${copied ? 'copied' : ''}`}
                        title="Copy to clipboard"
                    >
                        {copied ? <CheckCheck className="pdf-output-btn-icon" /> : <Copy className="pdf-output-btn-icon" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>

                    {/* Try again */}
                    <button
                        onClick={onReset}
                        className="pdf-output-btn"
                    >
                        <RotateCcw className="pdf-output-btn-icon" />
                        New Query
                    </button>
                </div>
            </div>

            {/* Meta stats */}
            <div className="pdf-output-metadata">
                <div className="pdf-meta-item">
                    <Layers className="pdf-meta-icon" style={{ color: '#a78bfa' }} />
                    <span>{output.metadata.chunksRetrieved} chunks retrieved</span>
                </div>
                <div className="pdf-meta-item">
                    <Cpu className="pdf-meta-icon" style={{ color: '#818cf8' }} />
                    <span>~{output.metadata.tokensGenerated.toLocaleString()} tokens</span>
                </div>
                <div className="pdf-meta-item">
                    <Clock className="pdf-meta-icon" style={{ color: '#38bdf8' }} />
                    <span>{fmtMs(output.metadata.processingTimeMs)}</span>
                </div>
                <div className="pdf-meta-item">
                    <BookOpen className="pdf-meta-icon" style={{ color: '#10b981' }} />
                    <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {output.metadata.modelVersion}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="pdf-output-content">
                <ReactMarkdown>{output.content}</ReactMarkdown>
            </div>

            {/* Source references toggle */}
            {output.sourceReferences.length > 0 && (
                <div className="pdf-sources-section">
                    <button
                        onClick={() => setShowSources((s) => !s)}
                        className="pdf-sources-toggle"
                    >
                        {showSources ? (
                            <ChevronUp className="pdf-sources-icon" />
                        ) : (
                            <ChevronDown className="pdf-sources-icon" />
                        )}
                        {showSources ? 'Hide' : 'Show'} {output.sourceReferences.length} source chunks
                    </button>

                    {showSources && (
                        <div className="pdf-sources-list">
                            {output.sourceReferences.map((ref, i) => (
                                <div key={i} className="pdf-source-item">
                                    <div className="pdf-source-header">
                                        <span className="pdf-source-chunk">
                                            Chunk #{ref.chunkIndex}
                                        </span>
                                        <span className="pdf-source-score">
                                            score: {(ref.relevanceScore * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <p className="pdf-source-excerpt">{ref.excerpt}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
