import { AlertTriangle, X } from 'lucide-react';
import './PDFComponents.css';

export default function ErrorBanner({ error, onDismiss }) {
    return (
        <div className="pdf-error-banner" role="alert">
            <div className="pdf-error-content">
                <div className="pdf-error-icon-wrapper">
                    <AlertTriangle className="pdf-error-icon" />
                </div>
                <div className="pdf-error-details">
                    <p className="pdf-error-code">
                        {error.errorCode.replace(/_/g, ' ')}
                    </p>
                    <p className="pdf-error-message">{error.message}</p>
                    {error.details && (
                        <details className="pdf-error-technical">
                            <summary className="pdf-error-summary">
                                Technical details
                            </summary>
                            <p className="pdf-error-tech-details">{error.details}</p>
                        </details>
                    )}
                </div>
                <button
                    onClick={onDismiss}
                    className="pdf-error-dismiss"
                    aria-label="Dismiss error"
                >
                    <X className="pdf-dismiss-icon" />
                </button>
            </div>
        </div>
    );
}
