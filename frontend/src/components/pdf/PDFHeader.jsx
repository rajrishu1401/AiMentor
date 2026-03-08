import { Brain, Sparkles } from 'lucide-react';
import './PDFComponents.css';

export default function PDFHeader() {
    return (
        <header className="pdf-header">
            {/* Logo / Icon */}
            <div className="pdf-logo-section">
                <div className="pdf-logo-wrapper">
                    <div className="pdf-logo-icon">
                        <Brain className="pdf-brain-icon" />
                    </div>
                    <span className="pdf-sparkle-badge">
                        <Sparkles className="pdf-sparkle-icon" />
                    </span>
                </div>
                <div className="pdf-logo-text">
                    <h1 className="pdf-logo-title">PDF Learning</h1>
                    <p className="pdf-logo-subtitle">AI Mentor Platform</p>
                </div>
            </div>

            {/* Hero headline */}
            <div className="pdf-hero-content">
                <h2 className="pdf-hero-title">
                    <span className="pdf-hero-white">Learn Smarter</span>
                    <br />
                    <span className="pdf-gradient-text">with AI Mentoring</span>
                </h2>
                <p className="pdf-hero-description">
                    Upload any PDF and get personalised{' '}
                    <span className="pdf-highlight-violet">lessons</span>,{' '}
                    <span className="pdf-highlight-indigo">study plans</span>,{' '}
                    <span className="pdf-highlight-sky">quizzes</span>, and{' '}
                    <span className="pdf-highlight-emerald">summaries</span>{' '}
                    powered by Amazon Bedrock.
                </p>
            </div>

            {/* Stats strip */}
            <div className="pdf-stats-strip">
                {[
                    { label: 'Powered by', value: 'Amazon Bedrock' },
                    { label: 'Model', value: 'Nova Pro' },
                    { label: 'Max file size', value: '50 MB' },
                ].map(({ label, value }) => (
                    <div key={label} className="pdf-stat-item">
                        <div className="pdf-stat-value">{value}</div>
                        <div className="pdf-stat-label">{label}</div>
                    </div>
                ))}
            </div>
        </header>
    );
}
