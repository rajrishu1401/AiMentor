export default function Navbar({ onGetStarted, onLogin }) {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo">
                    <div className="logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                        </svg>
                    </div>
                    <span className="logo-text">
                        CodeMentor<span className="logo-highlight">AI</span>
                    </span>
                </div>

                <div className="nav-links">
                    <a className="nav-link">Dashboard (Demo)</a>
                    <a className="nav-link" onClick={onLogin}>Login</a>
                    <button className="btn btn-primary" onClick={onGetStarted}>
                        Get Started
                    </button>
                </div>
            </div>
        </nav>
    );
}
