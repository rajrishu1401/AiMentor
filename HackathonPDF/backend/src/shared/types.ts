/**
 * Core type definitions for HackathonPDF AI Mentor System
 */

// ─── Intent & Output Types ───────────────────────────────────────────────────

export type IntentType = 'teach' | 'plan' | 'quiz' | 'summary';

export type OutputType = 'teach' | 'plan' | 'quiz' | 'summary';

// ─── Document / Chunk Models ─────────────────────────────────────────────────

export interface DocumentChunk {
    content: string;
    score: number;
    chunkIndex: number;
    sourceLocation: string;
    metadata: {
        pageNumber: number;
        documentId: string;
    };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
    isValid: boolean;
    errorCode?: ErrorCode;
    errorMessage?: string;
}

// ─── S3 ───────────────────────────────────────────────────────────────────────

export interface S3Location {
    bucket: string;
    key: string;
    uri: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface SourceReference {
    chunkIndex: number;
    excerpt: string;
    relevanceScore: number;
}

export interface LearningOutput {
    requestId: string;
    type: OutputType;
    content: string;
    sourceReferences: SourceReference[];
    generationTimestamp: Date;
    metadata: {
        chunksRetrieved: number;
        tokensGenerated: number;
        modelVersion: string;
        processingTimeMs: number;
    };
    s3Location?: S3Location;
}

// ─── Error Model ──────────────────────────────────────────────────────────────

export interface ErrorResponse {
    errorCode: ErrorCode;
    message: string;
    details?: string;
    timestamp: Date;
    requestId?: string;
}

export enum ErrorCode {
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    PROMPT_TOO_LONG = 'PROMPT_TOO_LONG',
    PROMPT_EMPTY = 'PROMPT_EMPTY',
    UPLOAD_FAILED = 'UPLOAD_FAILED',
    INDEXING_FAILED = 'INDEXING_FAILED',
    EXTRACTION_FAILED = 'EXTRACTION_FAILED',
    GENERATION_FAILED = 'GENERATION_FAILED',
    INSUFFICIENT_CONTEXT = 'INSUFFICIENT_CONTEXT',
    AGENT_TIMEOUT = 'AGENT_TIMEOUT',
}

// ─── Request Input ────────────────────────────────────────────────────────────

export interface LearningRequestInput {
    userId: string;
    sessionId: string;
    file: Buffer;
    fileName: string;
    fileSize: number;
    mimeType: string;
    prompt: string;
    intent: IntentType;
}
