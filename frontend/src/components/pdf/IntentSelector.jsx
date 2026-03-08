import './PDFComponents.css';

const INTENT_OPTIONS = [
    {
        id: 'teach',
        label: 'Teach Me',
        icon: '🎓',
        description: 'Clear beginner-friendly lesson',
        prompt: 'Teach me the main concepts from this document in simple, clear terms with examples.',
    },
    {
        id: 'plan',
        label: 'Study Plan',
        icon: '📅',
        description: 'Phased learning roadmap',
        prompt: 'Create a structured 7-day study plan to master this content, with milestones and checkpoints.',
    },
    {
        id: 'quiz',
        label: 'Quiz Me',
        icon: '❓',
        description: '10 MCQ questions with answers',
        prompt: 'Generate 10 multiple-choice quiz questions (with answers and explanations) based on this content.',
    },
    {
        id: 'summary',
        label: 'Summarize',
        icon: '📝',
        description: 'Key concepts at a glance',
        prompt: 'Summarize the most important topics, key concepts, and critical points from this document.',
    },
];

export default function IntentSelector({ selected, onSelect }) {
    return (
        <div className="pdf-intent-section">
            <label className="pdf-label">
                🎯 Choose Learning Mode
            </label>
            <div className="pdf-intent-grid">
                {INTENT_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onSelect(option.id, option.prompt)}
                        className={`pdf-intent-btn ${selected === option.id ? 'active' : ''}`}
                        aria-pressed={selected === option.id}
                    >
                        <div className="pdf-intent-header">
                            <span className="pdf-intent-icon">{option.icon}</span>
                            <span className="pdf-intent-label">{option.label}</span>
                        </div>
                        <p className="pdf-intent-description">{option.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
