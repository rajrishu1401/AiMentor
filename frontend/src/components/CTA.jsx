export default function CTA({ onGetStarted }) {
    return (
        <section className="cta">
            <div className="cta-container">
                <h2 className="cta-title">Ready to Start Your Journey?</h2>
                <p className="cta-subtitle">
                    Join thousands of learners mastering computer science with AI
                </p>
                <button className="btn btn-primary btn-large" onClick={onGetStarted}>
                    Get Started Free
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>
        </section>
    );
}
