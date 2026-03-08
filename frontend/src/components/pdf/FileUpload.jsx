import { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import './PDFComponents.css';

export default function FileUpload({ file, onFileChange }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.type === 'application/pdf') {
            onFileChange(dropped);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleInputChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected) onFileChange(selected);
    };

    const formatSize = (bytes) => {
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    return (
        <div className="pdf-file-upload-section">
            <label className="pdf-label">
                📄 Upload PDF Document
            </label>

            <div
                className={`pdf-drop-zone ${file ? 'has-file' : ''} ${dragging ? 'dragging' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                aria-label="Upload PDF file"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleInputChange}
                />

                {file ? (
                    <div className="pdf-file-display">
                        <div className="pdf-file-info">
                            <div className="pdf-file-icon-wrapper">
                                <FileText className="pdf-file-icon" />
                            </div>
                            <div className="pdf-file-details">
                                <p className="pdf-file-name">{file.name}</p>
                                <p className="pdf-file-size">{formatSize(file.size)}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileChange(null);
                                if (inputRef.current) inputRef.current.value = '';
                            }}
                            className="pdf-remove-btn"
                            aria-label="Remove file"
                        >
                            <X className="pdf-remove-icon" />
                        </button>
                    </div>
                ) : (
                    <div className="pdf-upload-prompt">
                        <div className="pdf-upload-icon-wrapper">
                            <Upload className="pdf-upload-icon" />
                        </div>
                        <div>
                            <p className="pdf-upload-text">
                                {dragging ? 'Drop it here!' : 'Drag & drop your PDF here'}
                            </p>
                            <p className="pdf-upload-subtext">
                                or <span className="pdf-upload-link">click to browse</span> — max 50 MB
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
