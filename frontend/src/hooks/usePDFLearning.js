import axios from 'axios';
import { useState, useCallback } from 'react';

// Direct URL to PDF backend
const API_BASE = 'http://13.232.0.142/pdf/api';

export function usePDFLearning() {
    const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const reset = useCallback(() => {
        setState('idle');
        setResult(null);
        setError(null);
    }, []);

    const submit = useCallback(async (file, prompt, intent) => {
        setState('loading');
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('prompt', prompt);
        formData.append('intent', intent);
        formData.append('userId', 'hackathon-user');
        formData.append('sessionId', `session-${Date.now()}`);

        try {
            const { data } = await axios.post(`${API_BASE}/learn`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 180_000, // 3 minutes
            });
            setResult(data);
            setState('success');
        } catch (err) {
            const apiError = err.response?.data ?? {
                errorCode: 'NETWORK_ERROR',
                message: err.message || 'Failed to connect to the server.',
            };
            setError(apiError);
            setState('error');
        }
    }, []);

    return { state, result, error, submit, reset };
}
