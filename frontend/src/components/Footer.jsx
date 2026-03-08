export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-brand">
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
                        <p className="footer-description">
                            AI-powered platform for mastering computer science
                        </p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>Product</h4>
                            <a href="#">Features</a>
                            <a href="#">Pricing</a>
                            <a href="#">Roadmaps</a>
                        </div>
                        <div className="footer-column">
                            <h4>Company</h4>
                            <a href="#">About</a>
                            <a href="#">Blog</a>
                            <a href="#">Careers</a>
                        </div>
                        <div className="footer-column">
                            <h4>Support</h4>
                            <a href="#">Help Center</a>
                            <a href="#">Contact</a>
                            <a href="#">Privacy</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 CodeMentorAI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
