/**
 * System-wide constants for HackathonPDF
 */

// ─── File Validation ──────────────────────────────────────────────────────────
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_FILE_TYPES = ['application/pdf'];
export const ALLOWED_FILE_EXTENSIONS = ['.pdf'];

// ─── Prompt Validation ────────────────────────────────────────────────────────
export const MAX_PROMPT_LENGTH = 2000;
export const MIN_PROMPT_LENGTH = 3;

// ─── AWS Configuration ────────────────────────────────────────────────────────
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'hackathon-pdf-docs';
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// ─── Bedrock Configuration ────────────────────────────────────────────────────
export const BEDROCK_MODEL_ID = 'amazon.nova-pro-v1:0';
export const EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v2:0';

// ─── Timeouts (ms) ────────────────────────────────────────────────────────────
export const S3_UPLOAD_TIMEOUT = 60_000;        // 60 seconds
export const AGENT_INVOCATION_TIMEOUT = 120_000; // 2 minutes

// ─── RAG Configuration ────────────────────────────────────────────────────────
export const CHUNK_SIZE = 1000;    // characters per chunk
export const CHUNK_OVERLAP = 200;  // character overlap between chunks
export const MAX_CHUNKS = 1000;    // hard cap on total chunks
export const TOP_K_CHUNKS = 5;     // top K chunks to retrieve
