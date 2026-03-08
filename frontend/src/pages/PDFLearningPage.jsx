import { useState } from 'react';
import { Zap, ArrowLeft } from 'lucide-react';
import PDFHeader from '../components/pdf/PDFHeader';
import FileUpload from '../components/pdf/FileUpload';
import IntentSelector from '../components/pdf/IntentSelector';
import LoadingSpinner from '../components/pdf/LoadingSpinner';
import ErrorBanner from '../components/pdf/ErrorBanner';
import OutputCard from '../components/pdf/OutputCard';
import { usePDFLearning } from '../hooks/usePDFLearning';
import './PDFLearningPage.css';

export default function PDFLearningPage({ onBack }) {
    const [file, setFile] = useState(null);
    const [prompt, setPrompt] = useState('Teach me the main concepts from this document in simple, clear terms with examples.');
    const [intent, setIntent] = useState('teach');
    const [charCount, setCharCount] = useState(prompt.length);

    const { state, result, error, submit, reset } = usePDFLearning();

    const handleIntentSelect = (selectedIntent, defaultPrompt) => {
        setIntent(selectedIntent);
        setPrompt(defaultPrompt);
        setCharCount(defaultPrompt.length);
    };

    const handlePromptChange = (e) => {
        setPrompt(e.target.value);
        setCharCount(e.target.value.length);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !prompt.trim()) return;
        await submit(file, prompt, intent);
    };

    const handleReset = () => {
        reset();
        setFile(null);
        setPrompt('Teach me the main concepts from this document in simple, clear terms with examples.');
        setIntent('teach');
        setCharCount(prompt.length);
    };

    const isLoading = state === 'loading';
    const canSubmit = !!file && prompt.trim().length >= 3 && !isLoading;

    return (
        <div className="pdf-learning-page">
            {/* Back button */}
            {onBack && (
                <button onClick={onBack} className="pdf-back-btn">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
            )}

            {/* Background orbs */}
            <div className="orb orb-1" aria-hidden="true" />
            <div className="orb orb-2" aria-hidden="true" />
            <div className="orb orb-3" aria-hidden="true" />

            <div className="pdf-content-wrapper">
                {/* Hero header */}
                <PDFHeader />

                {/* Main content */}
                {state === 'success' && result ? (
                    <OutputCard output={result} onReset={handleReset} />
                ) : (
                    <div className="pdf-form-section">
                        {/* Input form */}
                        {!isLoading && (
                            <form
                                onSubmit={handleSubmit}
                                className="pdf-glass-card pdf-form-card"
                            >
                                {/* Error banner */}
                                {state === 'error' && error && (
                                    <ErrorBanner error={error} onDismiss={reset} />
                                )}

                                {/* File upload */}
                                <FileUpload file={file} onFileChange={setFile} />

                                {/* Intent selector */}
                                <IntentSelector selected={intent} onSelect={handleIntentSelect} />

                                {/* Prompt textarea */}
                                <div className="pdf-prompt-section">
                                    <div className="pdf-prompt-header">
                                        <label htmlFor="prompt-input" className="pdf-label">
                                            💬 Your Learning Request
                                        </label>
                                        <span className={`pdf-char-count ${charCount > 1800 ? 'pdf-char-limit' : ''}`}>
                                            {charCount} / 2000
                                        </span>
                                    </div>
                                    <textarea
                                        id="prompt-input"
                                        value={prompt}
                                        onChange={handlePromptChange}
                                        placeholder="E.g. Teach me the main concepts, Create a 7-day study plan, Generate quiz questions…"
                                        maxLength={2000}
                                        rows={4}
                                        className="pdf-textarea"
                                    />
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="pdf-glow-btn"
                                >
                                    <Zap className="pdf-btn-icon" />
                                    Generate Learning Content
                                    <span className="pdf-btn-badge">
                                        · {intent}
                                    </span>
                                </button>

                                {/* Helper text */}
                                {!file && (
                                    <p className="pdf-helper-text">
                                        👆 Upload a PDF to get started
                                    </p>
                                )}
                            </form>
                        )}

                        {/* Loading overlay */}
                        {isLoading && <LoadingSpinner intent={intent} />}
                    </div>
                )}

                {/* Footer */}
                <footer className="pdf-footer">
                    <p>PDF Learning · Powered by Amazon Bedrock Agent</p>
                </footer>
            </div>
        </div>
    );
}
