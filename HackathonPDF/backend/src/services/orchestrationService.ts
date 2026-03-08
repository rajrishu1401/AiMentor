/**
 * orchestrationService.ts
 * Coordinates the full pipeline:
 *   PDF upload → text extraction → chunking → retrieval → Bedrock Agent → response
 */

import { randomUUID } from 'crypto';
import { extractTextFromPDF } from './pdfExtractor';
import { chunkText } from './chunkService';
import { retrieveTopChunks } from './retrievalService';
import { uploadToS3 } from './s3Service';
import { AgentService } from './agentService';
import {
    LearningRequestInput,
    LearningOutput,
    ErrorResponse,
    ErrorCode,
} from '../shared/types';
import { logger } from '../utils/logger';

// ─── Validation helpers ───────────────────────────────────────────────────────

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_PROMPT_LEN = 2000;

function validateRequest(input: LearningRequestInput): ErrorResponse | null {
    if (!input.fileName.toLowerCase().endsWith('.pdf') || input.mimeType !== 'application/pdf') {
        return errorResponse(ErrorCode.INVALID_FILE_TYPE, 'Only PDF files are supported.');
    }
    if (input.fileSize > MAX_FILE_BYTES) {
        return errorResponse(ErrorCode.FILE_TOO_LARGE, `File exceeds the 50 MB limit.`);
    }
    if (!input.prompt || input.prompt.trim().length < 3) {
        return errorResponse(ErrorCode.PROMPT_EMPTY, 'Please enter a valid prompt.');
    }
    if (input.prompt.length > MAX_PROMPT_LEN) {
        return errorResponse(ErrorCode.PROMPT_TOO_LONG, `Prompt must be under ${MAX_PROMPT_LEN} characters.`);
    }
    return null;
}

function errorResponse(
    errorCode: ErrorCode,
    message: string,
    details?: string,
    requestId?: string
): ErrorResponse {
    return { errorCode, message, details, timestamp: new Date(), requestId };
}

// ─── Main orchestration ────────────────────────────────────────────────────────

export async function processLearningRequest(
    input: LearningRequestInput
): Promise<LearningOutput | ErrorResponse> {
    const requestId = randomUUID();
    const t0 = Date.now();

    logger.info('Processing learning request', {
        requestId,
        userId: input.userId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        intent: input.intent,
        promptLen: input.prompt.length,
    });

    // ── 1. Validate ─────────────────────────────────────────────────────────────
    const validationError = validateRequest(input);
    if (validationError) {
        return { ...validationError, requestId };
    }

    try {
        // ── 2. Upload to S3 (fire-and-forget; not blocking the main response) ──────
        uploadToS3(input.file, input.fileName, input.userId, input.mimeType).catch((err) => {
            logger.warning('S3 upload failed (non-fatal)', {
                requestId,
                error: err instanceof Error ? err.message : String(err),
            });
        });

        // ── 3. Extract text ─────────────────────────────────────────────────────────
        const extracted = await extractTextFromPDF(input.file, input.fileName);

        if (!extracted.text || extracted.text.trim().length < 10) {
            return errorResponse(
                ErrorCode.EXTRACTION_FAILED,
                'Could not extract text from the PDF. Make sure it is not scanned/image-only or password-protected.',
                undefined,
                requestId
            );
        }

        // ── 4. Chunk ────────────────────────────────────────────────────────────────
        const chunks = chunkText(extracted.text);
        logger.info('Chunking done', { requestId, chunks: chunks.length });

        // ── 5. Retrieve top-K relevant chunks ───────────────────────────────────────
        const topChunks = retrieveTopChunks(chunks, input.prompt);
        logger.info('Retrieval done', { requestId, topChunks: topChunks.length });

        // ── 6. Invoke Bedrock Agent ──────────────────────────────────────────────────
        const agent = new AgentService();
        const output = await agent.generateLearning(requestId, input.prompt, topChunks, input.intent);

        logger.info('Request complete', { requestId, ms: Date.now() - t0, type: output.type });
        return output;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Orchestration error', { requestId, error: message, ms: Date.now() - t0 });

        return errorResponse(
            ErrorCode.GENERATION_FAILED,
            'An error occurred while generating your learning content. Please try again.',
            message,
            requestId
        );
    }
}
