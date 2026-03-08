import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import './PDFComponents.css';

const steps = [
    { icon: '📄', label: 'Extracting text from PDF…' },
    { icon: '✂️', label: 'Chunking into segments…' },
    { icon: '🔍', label: 'Retrieving relevant context…' },
    { icon: '🤖', label: 'Invoking Amazon Bedrock Agent…' },
    { icon: '✨', label: 'Generating your content…' },
];

export default function LoadingSpinner({ intent }) {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="pdf-loading-card">
            {/* Spinner */}
            <div className="pdf-spinner-wrapper">
                <div className="pdf-spinner-container">
                    <div className="pdf-spinner" />
                    <div className="pdf-spinner-icon">
                        <Sparkles />
                    </div>
                </div>
            </div>

            {/* Title */}
            <div>
                <p className="pdf-loading-title">
                    AI Mentor is working…
                </p>
                {intent && (
                    <p className="pdf-loading-intent">
                        Mode: <span className="pdf-loading-intent-label">{intent}</span>
                    </p>
                )}
            </div>

            {/* Step progress */}
            <div className="pdf-loading-steps">
                {steps.map((step, i) => (
                    <div
                        key={step.label}
                        className={`pdf-loading-step ${
                            i < stepIndex
                                ? 'completed'
                                : i === stepIndex
                                ? 'active'
                                : 'pending'
                        }`}
                    >
                        <span>{step.icon}</span>
                        <span>{step.label}</span>
                        {i < stepIndex && <span className="pdf-step-check">✓</span>}
                        {i === stepIndex && (
                            <Loader2 className="pdf-step-spinner" />
                        )}
                    </div>
                ))}
            </div>

            <p className="pdf-loading-note">
                This typically takes 15–60 seconds depending on PDF size
            </p>
        </div>
    );
}
