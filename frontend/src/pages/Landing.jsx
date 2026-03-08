import "./Landing.css";

const features = [
    {
        icon: "🗺️",
        title: "Personalized Learning Roadmaps",
        desc: "AI generates a custom study path based on your current skills and target goals — no more guessing what to learn next.",
    },
    {
        icon: "⚡",
        title: "Interactive Coding Challenges",
        desc: "Practice with hand-picked coding problems at your level. Instant feedback helps you learn from every mistake.",
    },
    {
        icon: "🤖",
        title: "Real-time AI Mentorship",
        desc: "Stuck on a concept? Ask your AI mentor anytime. Get clear explanations, hints, and code reviews in seconds.",
    },
    {
        icon: "📊",
        title: "Progress Analytics",
        desc: "Track your growth with detailed insights on topics mastered, streak, and skill confidence scores.",
    },
    {
        icon: "🏆",
        title: "Gamified Experience",
        desc: "Earn XP, badges, and climb the leaderboard as you complete lessons and challenges.",
    },
    {
        icon: "🌐",
        title: "Multi-language Support",
        desc: "Learn Python, JavaScript, Java, C++, and more — all in one unified platform.",
    },
];

export default function Landing({ goToLogin, goToSignup }) {
    return (
        <div className="landing-root">
            {/* ── Navigation ── */}
            <nav className="lp-nav">
                <div className="lp-nav-logo">
                    <div className="lp-nav-logo-icon">&lt;/&gt;</div>
                    <span className="lp-nav-logo-text">
                        HackVeda<span className="lp-nav-logo-highlight">AI</span>
                    </span>
                </div>

                <div className="lp-nav-links">
                    <a href="#features" className="lp-nav-link">Features</a>
                    <a href="#pricing" className="lp-nav-link">Pricing</a>
                    <a href="#about" className="lp-nav-link">About</a>
                    <button id="nav-login-btn" className="lp-nav-btn-outline" onClick={goToLogin}>
                        Login
                    </button>
                    <button id="nav-signup-btn" className="lp-nav-btn-primary" onClick={goToSignup}>
                        Get Started
                    </button>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="lp-hero">
                <div className="lp-hero-content">
                    <div className="lp-hero-badge">
                        <span className="lp-hero-badge-dot"></span>
                        Powered by Advanced AI
                    </div>

                    <h1 className="lp-hero-title">
                        Master Computer Science with{" "}
                        <span className="lp-hero-title-gradient">AI-Powered Learning</span>
                    </h1>

                    <p className="lp-hero-subtitle">
                        Personalized roadmaps, interactive coding challenges, and real-time AI
                        mentorship to accelerate your journey from beginner to expert.
                    </p>

                    <div className="lp-hero-actions">
                        <button id="hero-get-started" className="lp-btn-primary" onClick={goToSignup}>
                            Start Learning Free →
                        </button>
                        <button id="hero-sign-in" className="lp-btn-secondary" onClick={goToLogin}>
                            Try Sandbox &lt;/&gt;
                        </button>
                    </div>
                </div>

                <div className="lp-hero-visual">
                    <div className="lp-code-window">
                        <div className="lp-code-window-header">
                            <span className="lp-dot lp-dot-red"></span>
                            <span className="lp-dot lp-dot-yellow"></span>
                            <span className="lp-dot lp-dot-green"></span>
                            <span className="lp-code-window-title">learnCS.js</span>
                        </div>
                        <div className="lp-code-body">
                            <div className="lp-code-line">
                                <span className="lp-code-ln">1</span>
                                <span><span className="lp-code-kw">function </span><span className="lp-code-fn">learnCS</span><span className="lp-code-op">() {"{"}</span></span>
                            </div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">2</span>
                                <span>&nbsp;&nbsp;<span className="lp-code-kw">const </span><span className="lp-code-var">skills </span><span className="lp-code-op">= [</span></span>
                            </div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">3</span>
                                <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="lp-code-str">'Data Structures'</span><span className="lp-code-op">,</span></span>
                            </div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">4</span>
                                <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="lp-code-str">'Algorithms'</span><span className="lp-code-op">,</span></span>
                            </div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">5</span>
                                <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="lp-code-str">'System Design'</span></span>
                            </div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">6</span>
                                <span>&nbsp;&nbsp;<span className="lp-code-op">];</span></span>
                            </div>
                            <div className="lp-code-blank"></div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">8</span>
                                <span>&nbsp;&nbsp;<span className="lp-code-kw">return </span><span className="lp-code-var">skills</span><span className="lp-code-op">.</span><span className="lp-code-fn">map</span><span className="lp-code-op">(</span><span className="lp-code-var">skill </span><span className="lp-code-op">=&gt;</span></span>
                            </div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">9</span>
                                <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="lp-code-fn">master</span><span className="lp-code-op">(</span><span className="lp-code-var">skill</span><span className="lp-code-op">)</span></span>
                            </div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">10</span>
                                <span>&nbsp;&nbsp;<span className="lp-code-op">);</span></span>
                            </div>
                            <div className="lp-code-line">
                                <span className="lp-code-ln">11</span>
                                <span><span className="lp-code-op">{"}"}</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <div className="lp-stats-bar">
                <div className="lp-stat-item">
                    <span className="lp-stat-number">10K+</span>
                    <span className="lp-stat-label">Active Learners</span>
                </div>
                <div className="lp-stat-item">
                    <span className="lp-stat-number">500+</span>
                    <span className="lp-stat-label">Coding Challenges</span>
                </div>
                <div className="lp-stat-item">
                    <span className="lp-stat-number">50+</span>
                    <span className="lp-stat-label">Learning Roadmaps</span>
                </div>
                <div className="lp-stat-item">
                    <span className="lp-stat-number">98%</span>
                    <span className="lp-stat-label">Satisfaction Rate</span>
                </div>
            </div>

            {/* ── Features ── */}
            <section id="features" className="lp-features">
                <p className="lp-section-label">Why HackVedaAI</p>
                <h2 className="lp-section-title">Everything you need to level up</h2>
                <p className="lp-section-subtitle">
                    A complete AI-powered platform designed to take you from where you are to
                    where you want to be — faster than ever.
                </p>

                <div className="lp-features-grid">
                    {features.map((f, i) => (
                        <div className="lp-feature-card" key={i}>
                            <div className="lp-feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="lp-cta">
                <h2>Ready to Start Your Journey?</h2>
                <p>Join thousands of learners mastering computer science with AI</p>
                <div className="lp-cta-actions">
                    <button id="cta-get-started" className="lp-btn-primary" onClick={goToSignup}>
                        Get Started Free →
                    </button>
                    <button id="cta-sign-in" className="lp-btn-secondary" onClick={goToLogin}>
                        Sign In
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="lp-footer">
                <div className="lp-footer-top">
                    <div className="lp-footer-brand">
                        <div className="lp-nav-logo">
                            <div className="lp-nav-logo-icon">&lt;/&gt;</div>
                            <span className="lp-nav-logo-text">
                                HackVeda<span className="lp-nav-logo-highlight">AI</span>
                            </span>
                        </div>
                        <p>AI-powered platform for mastering computer science</p>
                    </div>

                    <div className="lp-footer-col">
                        <h4>Product</h4>
                        <ul>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                            <li><a href="#features">Roadmaps</a></li>
                        </ul>
                    </div>

                    <div className="lp-footer-col">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#about">About</a></li>
                            <li><a href="#about">Blog</a></li>
                            <li><a href="#about">Careers</a></li>
                        </ul>
                    </div>

                    <div className="lp-footer-col">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#about">Help Center</a></li>
                            <li><a href="#about">Contact</a></li>
                            <li><a href="#about">Privacy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="lp-footer-bottom">
                    <p>© 2025 HackVedaAI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
